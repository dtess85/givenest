"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateCaption as dbUpdateCaption,
  updateReelImageOrder as dbUpdateReelImageOrder,
  getById as dbGetById,
} from "@/lib/db/social-posts";
import { fetchSparkListing } from "@/lib/spark";
import { createReelDraftForProperty } from "@/lib/social/reel-draft";
import {
  fmtPropertyLabel,
  resolveReelTarget,
  type ReelTarget,
} from "@/lib/social/reel-target";

/**
 * Admin-only mutations for the /admin/social drafts grid.
 *
 * Auth model (defense-in-depth):
 *   1. `middleware.ts` already blocks non-admin users at the /admin/* route
 *      level, but server actions are server RPCs and can also be invoked from
 *      outside a /admin/* page load — so we re-check admin status here.
 *   2. `ADMIN_EMAILS` env (same list the middleware trusts) gates who can
 *      mutate. Matches middleware default fallback so local dev Just Works.
 */

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ?? "dustin@givenest.com,kyndall@givenest.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

async function assertAdmin(): Promise<{ email: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("Unauthorized");
  }
  return { email };
}

export interface UpdateCaptionResult {
  ok: boolean;
  caption?: string;
  error?: string;
}

/**
 * Replace the caption on a draft row. Called from <EditableCaption> when the
 * admin clicks Save. Returns the updated caption so the client can reconcile
 * local state without a full page refresh (revalidatePath still fires so that
 * other clients/tabs pick up the change on next load).
 */
export async function updateCaptionAction(
  id: string,
  caption: string
): Promise<UpdateCaptionResult> {
  try {
    await assertAdmin();

    const trimmed = caption.trim();
    if (!trimmed) return { ok: false, error: "Caption cannot be empty." };
    if (trimmed.length > 2200) {
      return { ok: false, error: "Caption exceeds Instagram's 2,200-char limit." };
    }

    const row = await dbUpdateCaption(id, trimmed);
    if (!row) return { ok: false, error: "Draft not found." };

    // Invalidate the server-rendered list so the next visit/refresh picks up
    // the new caption (current client already has it via the return value).
    revalidatePath("/admin/social");

    return { ok: true, caption: row.caption };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/* Generate Reel — creates a REEL draft for a specific listing               */
/* -------------------------------------------------------------------------- */

export interface GenerateReelResult {
  ok: boolean;
  /** The row id of the newly-created REEL draft. Passed back so the UI can
   *  open the Pick Clips modal against the new row. */
  id?: string;
  /** Short human label — shown in the success toast. */
  label?: string;
  /** Hint to show the admin ("classified via Anthropic Vision" vs. "raw MLS
   *  order — set ANTHROPIC_API_KEY to auto-order photos"). */
  classified?: boolean;
  error?: string;
}

/**
 * Generate a REEL draft for the given target (URL / price / city / random).
 * Fetches the full listing from Spark, classifies photos with Anthropic Vision
 * (if the key is available — otherwise falls back to raw MLS order), and
 * inserts a REEL row in social_posts ready for the admin to pick clips and
 * render locally.
 */
export async function generateReelAction(
  target: ReelTarget
): Promise<GenerateReelResult> {
  try {
    await assertAdmin();

    const resolved = await resolveReelTarget(target);
    if ("error" in resolved) return { ok: false, error: resolved.error };

    const property = await fetchSparkListing(resolved.sparkKey, {
      noCache: true,
    });
    if (!property) {
      return {
        ok: false,
        error: `Spark returned no listing for ${resolved.sparkKey}.`,
      };
    }
    if (!property.images || property.images.length === 0) {
      return {
        ok: false,
        error: `Listing ${resolved.sparkKey} has no photos — can't render a reel.`,
      };
    }

    const officeName = property.listOfficeName ?? "Listing brokerage";
    const draft = await createReelDraftForProperty(property, officeName);

    revalidatePath("/admin/social");

    const classified = !!process.env.ANTHROPIC_API_KEY;
    // Always derive the label from the fetched Property — the URL-mode slug
    // is opaque (24-digit Spark key), and even the DB-backed modes benefit
    // from a freshly-formatted label that includes the address.
    const label = fmtPropertyLabel(property);
    return { ok: true, id: draft.id, label, classified };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/* Pick Reel Clips — admin-picks which MLS photos go into the 8 clip slots   */
/* -------------------------------------------------------------------------- */

export interface PickReelClipsResult {
  ok: boolean;
  error?: string;
}

/**
 * Reorder the REEL draft's snapshot images so that `pickedUrls` land in
 * clip slots 0..N-1 in the order given. Any listing photos the admin didn't
 * pick are appended in their current snapshot order — this keeps the full
 * library available if the admin wants to re-pick later, and keeps the
 * existing render path (which reads `listing_snapshot.images[0..7]`)
 * working without changes.
 *
 * The parallel `image_categories` array is reordered in lockstep so the
 * admin's category badges ("Kitchen", "Backyard", …) still line up.
 */
export async function pickReelClipsAction(
  id: string,
  pickedUrls: string[]
): Promise<PickReelClipsResult> {
  try {
    await assertAdmin();

    if (pickedUrls.length === 0) {
      return { ok: false, error: "Pick at least one photo." };
    }

    const row = await dbGetById(id);
    if (!row) return { ok: false, error: "Draft not found." };
    if (row.format !== "REEL") {
      return { ok: false, error: "Only REEL rows can have clips picked." };
    }

    const snap = row.listing_snapshot;
    const currentImages = snap?.images ?? [];
    const currentCategories = snap?.image_categories ?? [];

    // URL → category lookup built off the current snapshot. If a picked URL
    // isn't in the snapshot (shouldn't happen via the UI, but belt-and-
    // suspenders), it gets the category "other".
    const categoryByUrl = new Map<string, string>();
    currentImages.forEach((url, i) => {
      categoryByUrl.set(url, currentCategories[i] ?? "other");
    });

    const dedupedPicks = Array.from(new Set(pickedUrls));
    const pickedSet = new Set(dedupedPicks);
    const remaining = currentImages.filter((u) => !pickedSet.has(u));

    const newImages = [...dedupedPicks, ...remaining];
    const newCategories = newImages.map(
      (u) => categoryByUrl.get(u) ?? "other"
    );

    const updated = await dbUpdateReelImageOrder(id, newImages, newCategories);
    if (!updated) return { ok: false, error: "Update failed." };

    revalidatePath("/admin/social");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
