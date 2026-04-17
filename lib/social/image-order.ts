import type { ImageCategory, ImageClassification } from "./image-classifier";

/* -------------------------------------------------------------------------- */
/* Slot priority                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic ordering for social slides / reel clips. Rules, in priority:
 *
 *   Slot 1:  always the MLS hero (`images[0]`). Listing agents are trained
 *            to put the money shot first and MLS order is the one piece of
 *            metadata we trust. We never reorder slot 1.
 *
 *   Slot 2:  best kitchen — kitchens sell homes on IG.
 *   Slot 3:  living room / great room.
 *   Slot 4:  primary bedroom.
 *   Slot 5:  backyard / pool (exterior_back).
 *
 *   Slot 6+: everything else, in this preference order:
 *            dining → other bedrooms → baths → office → other_interior →
 *            exterior_front extras → aerial → other.
 *
 *   NEVER include: floorplan_or_map — these tank carousel engagement and
 *                  look awful in Reels.
 *
 * If a preferred category isn't present (listing has no clear backyard
 * shot, say), we skip that slot rather than backfill with junk — the
 * lower-priority categories slide up to fill the gap.
 */
const SLOT_PRIORITY: ImageCategory[] = [
  "kitchen",
  "living",
  "primary_bedroom",
  "exterior_back",
  "dining",
  "bedroom",
  "bath",
  "office",
  "other_interior",
  "exterior_front",
  "aerial",
  "other",
];

/** Categories we refuse to include in social content regardless of what the
 *  listing offers. */
const BLOCKED: ReadonlySet<ImageCategory> = new Set<ImageCategory>([
  "floorplan_or_map",
]);

/* -------------------------------------------------------------------------- */
/* Sorter                                                                     */
/* -------------------------------------------------------------------------- */

export interface OrderedImage {
  url: string;
  category: ImageCategory;
  confidence: number;
  /** Original position in the MLS image array. Preserved so we can sanity-
   *  check hero position and for admin-debug display. */
  originalIndex: number;
}

/**
 * Reorder a listing's images for social consumption. Returns ALL non-blocked
 * images in their new order — the caller slices to `N` slots (5 for carousel,
 * 6 for reel).
 *
 * Callers pass the listing's `images[]` + matching classification results.
 * The input arrays must be the same length and aligned index-for-index.
 */
export function sortImagesForSocial(
  images: string[],
  classifications: ImageClassification[]
): OrderedImage[] {
  if (images.length === 0) return [];
  if (images.length !== classifications.length) {
    throw new Error(
      `sortImagesForSocial: images (${images.length}) and classifications (${classifications.length}) length mismatch`
    );
  }

  const all: OrderedImage[] = images.map((url, i) => ({
    url,
    category: classifications[i].category,
    confidence: classifications[i].confidence,
    originalIndex: i,
  }));

  // 1. Hero: always index 0 (regardless of what the classifier says).
  const hero = all[0];
  const rest = all.slice(1).filter((img) => !BLOCKED.has(img.category));

  // 2. Group remaining images by category.
  const byCategory = new Map<ImageCategory, OrderedImage[]>();
  for (const img of rest) {
    const arr = byCategory.get(img.category) ?? [];
    arr.push(img);
    byCategory.set(img.category, arr);
  }

  // 3. Within each category, sort by confidence desc, then original index asc
  //    (stable tie-break — earlier MLS position wins ties).
  byCategory.forEach((arr) => {
    arr.sort((a, b) => {
      if (a.confidence !== b.confidence) return b.confidence - a.confidence;
      return a.originalIndex - b.originalIndex;
    });
  });

  // 4. Slot-by-slot pick from SLOT_PRIORITY: top entry of each category,
  //    dedupe within a category (we only want ONE best kitchen in slot 2,
  //    additional kitchens go to the tail).
  const ordered: OrderedImage[] = [hero];
  const leftovers: OrderedImage[] = [];

  for (const cat of SLOT_PRIORITY) {
    const bucket = byCategory.get(cat);
    if (!bucket || bucket.length === 0) continue;
    // Take the top one into the ordered sequence; rest drop to leftovers.
    ordered.push(bucket[0]);
    leftovers.push(...bucket.slice(1));
  }

  // 5. Append leftovers sorted by (priority of their category, then confidence).
  const priorityIndex = new Map(SLOT_PRIORITY.map((c, i) => [c, i]));
  leftovers.sort((a, b) => {
    const ap = priorityIndex.get(a.category) ?? 999;
    const bp = priorityIndex.get(b.category) ?? 999;
    if (ap !== bp) return ap - bp;
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    return a.originalIndex - b.originalIndex;
  });
  ordered.push(...leftovers);

  return ordered;
}
