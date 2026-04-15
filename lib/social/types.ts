import type { Property } from "@/lib/mock-data";

/** Instagram post format. A single listing typically produces one draft per
 *  format (CAROUSEL, STORY, REEL) on publish day. */
export type MediaFormat = "CAROUSEL" | "STORY" | "REEL" | "CHARITY";

/** Lifecycle of a row in `social_posts`:
 *  - draft:      created by the drafting cron, waiting on approval
 *  - rendering:  Remotion/blob-render in flight (Reel + Story)
 *  - approved:   reviewed and ready for the publisher cron to pick up
 *  - publishing: claimed by the publisher cron (in-flight to Meta)
 *  - published:  live on Instagram; `ig_media_id` + `ig_permalink` populated
 *  - failed:     terminal-after-retries; `last_error_*` populated
 *  - rejected:   admin rejected the draft; never published
 *  - skipped:    listing went Pending/Sold between draft and publish
 */
export type PostStatus =
  | "draft"
  | "rendering"
  | "approved"
  | "publishing"
  | "published"
  | "failed"
  | "rejected"
  | "skipped";

/** Price-tier slug stored on the listing_snapshot so the variety scorer can
 *  look back at "the last N posts in this tier" without re-deriving from price. */
export type PriceTier = "ultra" | "luxury" | "entry";

/** Canonical day-of-week slug for the listing-drafting cron. */
export type ListingDay = "mon" | "wed" | "fri";

/** Canonical day-of-week slug for the charity-drafting cron (Phase 4). */
export type CharityDay = "tue" | "thu" | "sat";

/** A draft insert payload (pre-DB, post-composition). Mirrors a subset of
 *  `social_posts` row shape — the DB helper fills in created/updated timestamps
 *  and lifecycle defaults. */
export interface SocialPostDraft {
  format: MediaFormat;
  listing_slug: string;
  listing_source: "spark" | "manual";
  listing_office_name: string;
  /** Frozen Property snapshot (+ price_tier) at the time of drafting. */
  listing_snapshot: Property & { price_tier: PriceTier };
  caption: string;
  /** Carousel: 2–10 HTTPS URLs. Story: 1. Reel: empty in Phase 1 (video
   *  URL is filled by the Remotion render job in Phase 2). */
  image_urls: string[];
  /** Phase 2+ only — MP4 output from Remotion Lambda. */
  video_url?: string;
  scheduled_for?: Date;
  /** Reel-only bookkeeping (Phase 2+): which template / hook / CTA we picked. */
  reel_template_id?: string;
  reel_hook_id?: string;
  reel_cta_id?: string;
}

/** A Spark listing that passed tier + photo + dedup + HEAD validation. */
export interface CandidateListing {
  property: Property;
  /** Listing brokerage name (MLS attribution — goes in every caption). */
  officeName: string;
  /** Price-tier slug ('ultra' | 'luxury' | 'entry') derived from the day. */
  priceTier: PriceTier;
}

/** Shape of the overlay copy that goes onto a rendered 9:16 Story image.
 *  The image is composed server-side via `@vercel/og` using these strings. */
export interface StoryOverlay {
  topStrip: string;
  address: string;
  specs: string;
  price: string;
  donationBadge: string;
  bottomStrip: string;
}

/** A single clip inside a Reel composition. */
export interface ReelClip {
  imageUrl: string;
  overlay: string;
  kenBurns: "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "slowPanLeft" | "slowPanRight" | "slowZoomIn" | "whipLeft" | "whipRight" | "hardCut";
}

/** Everything Remotion needs to render a Reel. Passed as `inputProps` to the
 *  registered composition. */
export interface ReelScript {
  hookText: string;
  clips: ReelClip[];
  ctaText: string;
}
