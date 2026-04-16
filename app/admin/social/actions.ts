"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateCaption as dbUpdateCaption } from "@/lib/db/social-posts";

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
