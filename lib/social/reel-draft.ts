/**
 * Create a REEL-only draft in social_posts for a given listing. Used by the
 * /admin/social "Generate Reel" flow — a streamlined version of the cron's
 * social-draft-listing handler that skips the CAROUSEL + STORY rows (those
 * are driven by the automated tier schedule; the admin flow is for ad-hoc
 * reels on demand).
 *
 * Mirrors the cron's snapshot shape exactly (so admin-UI code that reads
 * `listing_snapshot.images` + `listing_snapshot.image_categories` keeps
 * working without branching on origin).
 */

import type { Property } from "@/lib/mock-data";
import type { PriceTier, SocialPostDraft } from "@/lib/social/types";
import { createDraft } from "@/lib/db/social-posts";
import { buildReelCaption, buildReelScript } from "@/lib/social/caption";
import { classifyListingImages } from "@/lib/social/image-classifier";
import { sortImagesForSocial, type OrderedImage } from "@/lib/social/image-order";

/** Derive a price tier from the list price — mirrors the Mon/Wed/Fri tier
 *  bands used by `selectListingCandidate`. The tier is cosmetic at insert
 *  time (no auto-scheduling on admin-generated drafts) but the
 *  `SocialPostDraft.listing_snapshot` type requires it, and downstream
 *  variety-scoring code may read it later. */
function tierForPrice(price: number): PriceTier {
  if (price >= 3_000_000) return "ultra";
  if (price >= 900_000) return "luxury";
  return "entry";
}

export interface CreateReelDraftResult {
  id: string;
  listing_slug: string;
  images: string[];
  image_categories: string[];
}

/**
 * Classify + reorder images, then insert a REEL draft row. Returns the row id
 * + the ordered image/category arrays (callers often want to jump the admin
 * user straight into the clip-picker for the new row).
 *
 * If `ANTHROPIC_API_KEY` isn't set or the classifier throws, falls back to
 * the raw MLS order with category="other" — matches cron behavior.
 */
export async function createReelDraftForProperty(
  property: Property,
  officeName: string
): Promise<CreateReelDraftResult> {
  const sourceImages = property.images ?? [];

  let ordered: OrderedImage[];
  try {
    const classifications = await classifyListingImages(sourceImages);
    ordered = sortImagesForSocial(sourceImages, classifications);
  } catch (err) {
    console.error("[reel-draft] classification failed:", err);
    ordered = sourceImages.map((url, i) => ({
      url,
      category: "other" as const,
      confidence: 0,
      originalIndex: i,
    }));
  }
  const orderedUrls = ordered.map((o) => o.url);
  const orderedCategories = ordered.map((o) => o.category);

  const snapshot = {
    ...property,
    images: orderedUrls,
    image_categories: orderedCategories,
    price_tier: tierForPrice(property.price),
  };

  const reorderedProperty = { ...property, images: orderedUrls };
  const reelScript = buildReelScript(reorderedProperty, officeName);

  const draft: SocialPostDraft = {
    format: "REEL",
    listing_slug: property.slug,
    listing_source: "spark",
    listing_office_name: officeName,
    listing_snapshot: snapshot,
    caption: buildReelCaption(property, officeName),
    image_urls: [],
    reel_hook_id: reelScript.hookId,
    reel_cta_id: reelScript.ctaId,
  };

  const row = await createDraft(draft);
  return {
    id: row.id,
    listing_slug: property.slug,
    images: orderedUrls,
    image_categories: orderedCategories,
  };
}
