/**
 * `inputProps` shape handed to every Reel composition. Built by
 * `buildReelScript(property, officeName)` in `lib/social/caption.ts`, passed
 * to Remotion via `--props=./out/input-props.json` at render time.
 *
 * Every template (walkthrough-cinematic, quick-tour, details-closeup,
 * lifestyle — Phase 2) consumes the same shape. Differences between templates
 * live inside the composition: pacing, ken-burns strategy, overlay style.
 */

/** Ken Burns motion keyword per clip. Each template maps the slow/quick
 *  variants onto its own motion curve. */
export type KenBurnsDirection =
  | "zoomIn"
  | "zoomOut"
  | "panLeft"
  | "panRight"
  | "slowPanLeft"
  | "slowPanRight"
  | "slowZoomIn"
  | "whipLeft"
  | "whipRight"
  | "hardCut"
  /** Tight macro crop (~1.7× scale) with slight slow drift — used by
   *  `details-closeup` to push in on finishes and architectural details. */
  | "macro"
  /** Tight macro crop with a gentle pan right. Same scale family as
   *  `macro`, different drift axis for variety across clips. */
  | "macroPanRight";

export interface ReelClip {
  /** Full-res listing photo URL (Spark Uri1280 or our branded blob). */
  imageUrl: string;
  /** Short text shown over this clip (e.g. "5 bed · 5.5 bath"). */
  overlay: string;
  kenBurns: KenBurnsDirection;
}

export interface ReelInputProps {
  /** Full-sentence hook shown for the first ~2s. Rotated from `REEL_HOOK_POOL`. */
  hookText: string;
  /** Short end-card line. Rotated from `REEL_CTA_POOL`. */
  ctaText: string;
  /** Lora italic brand tagline ("Every home does good", etc.). Rotated
   *  deterministically per listing slug. */
  taglineText: string;
  /** Preformatted coral donation pill text ("~$5,499"). */
  donationLabel: string;
  /** MLS listing brokerage — shown on the final clip per attribution rules. */
  officeName: string;
  /** Short city ("Scottsdale"). */
  city: string;
  /** Subdivision / community name when the listing has one ("Stratland Estates").
   *  Templates that want to show a more specific location than the city alone
   *  (e.g. price-reveal pairs it with the city — "Stratland Estates, Gilbert")
   *  read this and gracefully fall back to just `city` when absent. */
  neighborhood?: string;
  /** Street address ("4248 E Patricia Jane Drive"). Used as an editorial-
   *  style corner caption in details-closeup. */
  address: string;
  /** Year built, when available. details-closeup uses this for
   *  "Built 2025"-style captions. */
  yearBuilt?: number;
  /** Lot size string as returned by Spark ("0.29 acres"). */
  lotSize?: string;
  /** Price-per-sqft preformatted for display ("$830/sqft"). */
  pricePerSqft?: string;
  /** 6 clips, avg 2.5s each @ 30fps = 450 frames = 15s total. */
  clips: ReelClip[];
}

/** Default input props used by Remotion Studio / Preview when no external
 *  props are provided. Matches the production shape so overlays don't break. */
export const DEFAULT_REEL_INPUT_PROPS: ReelInputProps = {
  hookText:
    "Every home does good — this one could give ~$5,499 to a charity of your choice.",
  ctaText: "DM for details",
  taglineText: "Every home does good",
  donationLabel: "~$5,499",
  officeName: "Example Brokerage",
  city: "Scottsdale",
  neighborhood: "Troon North",
  address: "1234 N Example Way",
  yearBuilt: 2022,
  lotSize: "0.45 acres",
  pricePerSqft: "$620/sqft",
  // 6 placeholder clips. Remotion Studio renders blank frames for missing
  // images — swap these with real Spark URLs to preview a specific listing.
  // Clip 1 = hook card, clips 2–4 = walkthrough overlays, clip 5 = donation
  // pill (no text), clip 6 = end card (no text).
  clips: [
    // 1. Hero — hook card overlays; no clip text
    { imageUrl: "", overlay: "", kenBurns: "slowZoomIn" },
    // 2. Interior — beds/baths
    { imageUrl: "", overlay: "5 bed · 5.5 bath", kenBurns: "slowPanRight" },
    // 3. Kitchen — sqft
    { imageUrl: "", overlay: "4,817 sqft", kenBurns: "slowPanLeft" },
    // 4. Living — price
    { imageUrl: "", overlay: "Listed at $3,998,000", kenBurns: "slowPanRight" },
    // 5. Aerial — donation pill overlays; no clip text
    { imageUrl: "", overlay: "", kenBurns: "slowPanLeft" },
    // 6. Hero return — end card overlays; no clip text
    { imageUrl: "", overlay: "", kenBurns: "slowZoomIn" },
  ],
};
