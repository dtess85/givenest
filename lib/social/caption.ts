import type { Property } from "@/lib/mock-data";
import type { ReelScript, StoryOverlay } from "@/lib/social/types";
import { calcGivingPool } from "@/lib/commission";

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const int = new Intl.NumberFormat("en-US");

const fmtPrice = (n: number): string => usd0.format(n);
const fmtDonation = (n: number): string => usd0.format(Math.round(n));
const fmtSqft = (n: number): string => `${int.format(n)} sqft`;

/** Strip the state/zip suffix off the `Property.city` field so we get a clean
 *  short-form city name. `"Scottsdale, AZ 85251"` → `"Scottsdale"`. */
export function shortCity(cityField: string): string {
  const comma = cityField.indexOf(",");
  return (comma === -1 ? cityField : cityField.slice(0, comma)).trim();
}

/* -------------------------------------------------------------------------- */
/* Carousel — long-form, detail-rich                                          */
/* -------------------------------------------------------------------------- */

/**
 * Carousel caption. Targets serious-buyer swipe-through:
 * - Opening hook (emoji + city)
 * - Specs block (beds/baths/sqft + price)
 * - Donation line (generic framing)
 * - Attribution line (MLS rule)
 * - Hashtag fuel
 *
 * **No URL in caption** — Instagram caption URLs are plain text, not clickable.
 * The clickable path is either (a) "link in bio" on organic posts, or (b) a
 * Learn More CTA on the post when it's boosted via Meta Ads Manager. The
 * destination URL is surfaced on the admin card and stored derivable from
 * `listing_slug`; see `ctaUrlFor(row)`.
 *
 * ≤ 2,200 chars. No hashtags — Instagram's algorithm no longer rewards them
 * for reach; clean captions convert better.
 */
export function buildCarouselCaption(
  p: Property,
  officeName: string
): string {
  const city = shortCity(p.city);
  const donation = calcGivingPool(p.price);

  return [
    `New Arizona listing in ${city}`,
    "",
    p.address,
    `${p.beds} bed · ${p.baths} bath · ${fmtSqft(p.sqft)}`,
    `Listed at ${fmtPrice(p.price)}`,
    "",
    `If this home sold through Givenest, ~${fmtDonation(donation)} would fund Arizona nonprofits. Every closing with Givenest gives back.`,
    "",
    `Listed by ${officeName}. Offer through Givenest — link in bio or DM for details.`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Reel — short + punchy                                                      */
/* -------------------------------------------------------------------------- */

/** Rotation pool of hook phrasings used on-screen in the first 1–2s of a Reel. */
export const REEL_HOOK_POOL: { id: string; render: (p: Property) => string }[] = [
  {
    id: "every-home-does-good",
    render: (p) =>
      `Every home does good — this one could give ~${fmtDonation(calcGivingPool(p.price))} to a charity of your choice.`,
  },
  {
    id: "donation-direct",
    render: (p) => `This home gives ~${fmtDonation(calcGivingPool(p.price))} to AZ charities`,
  },
  {
    id: "buy-change-life",
    render: (p) => `Buy this ${shortCity(p.city)} home → change someone's life`,
  },
  {
    id: "if-sells",
    render: (p) => `~${fmtDonation(calcGivingPool(p.price))} to AZ nonprofits if this sells with Givenest`,
  },
  {
    id: "love-this",
    render: (p) => `Love this ${shortCity(p.city)} home? Every sale funds charity.`,
  },
  {
    id: "luxury-purpose",
    render: (p) => `${shortCity(p.city)} luxury with purpose — ~${fmtDonation(calcGivingPool(p.price))} to charity`,
  },
];

/** Rotation pool of on-screen CTA phrasings. */
export const REEL_CTA_POOL: { id: string; text: string }[] = [
  { id: "dm-details", text: "DM for details" },
  { id: "dm-interested", text: "Interested? DM us" },
  { id: "link-bio", text: "Tap the link in bio" },
  { id: "would-you", text: "Would you live here?" },
];

/**
 * Reel caption. First line < 200 chars (fits under Instagram's "See more"
 * fold). On-screen overlays carry the pitch — the caption is just the hook
 * + attribution. No hashtags.
 *
 * **No URL in caption** — organic Reels don't render clickable links. The
 * clickable Learn More CTA appears only when the Reel is *boosted* through
 * Meta Ads Manager; the destination URL is attached there, not here.
 */
export function buildReelCaption(
  p: Property,
  officeName: string
): string {
  const city = shortCity(p.city);
  const donation = calcGivingPool(p.price);

  return [
    `New ${city} listing — ~${fmtDonation(donation)} to AZ charities`,
    "",
    `Listed by ${officeName}. DM for details or tap the link in bio.`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Reel — script (consumed by Remotion in Phase 2)                            */
/* -------------------------------------------------------------------------- */

/**
 * Build the `inputProps` payload for a Remotion Reel composition. Each clip
 * pairs a listing image with an overlay line and a Ken Burns hint; the
 * composition resolves the Ken Burns into actual motion.
 *
 * Clip count: **8 clips** — covers the widest template in use (quick-tour,
 * 8 beats). walkthrough-cinematic only references clips[0..5] and silently
 * ignores the extras. Falls back to `images[0]` when the listing has fewer
 * than 8 photos so the schema is always satisfied.
 *
 * The `donationLabel` / `city` / `officeName` / `taglineText` are hoisted
 * out of the clips array to match `ReelInputProps` — the template uses them
 * for persistent elements (kicker, donation badge, end card).
 */
export function buildReelScript(
  p: Property,
  officeName: string,
  opts?: { hookId?: string; ctaId?: string; taglineText?: string }
): ReelScript & {
  hookId: string;
  ctaId: string;
  /** Hoisted persistent props — matches remotion/types.ts `ReelInputProps`. */
  taglineText: string;
  donationLabel: string;
  officeName: string;
  city: string;
  address: string;
  yearBuilt?: number;
  lotSize?: string;
  pricePerSqft?: string;
} {
  const hook =
    REEL_HOOK_POOL.find((h) => h.id === opts?.hookId) ?? REEL_HOOK_POOL[0];
  const cta =
    REEL_CTA_POOL.find((c) => c.id === opts?.ctaId) ?? REEL_CTA_POOL[0];

  const imgs = p.images ?? [];
  const at = (i: number): string => imgs[i] ?? imgs[0] ?? "";

  const city = shortCity(p.city);
  const price = fmtPrice(p.price);
  const donationLabel = `~${fmtDonation(calcGivingPool(p.price))}`;

  // Derived fields used by details-closeup and other editorial templates.
  const pricePerSqft =
    p.sqft && p.sqft > 0
      ? `$${Math.round(p.price / p.sqft).toLocaleString()}/sqft`
      : undefined;

  return {
    hookId: hook.id,
    ctaId: cta.id,
    hookText: hook.render(p),
    ctaText: cta.text,
    taglineText: opts?.taglineText ?? "Every home does good",
    donationLabel,
    officeName,
    city,
    address: p.address,
    yearBuilt: p.yearBuilt,
    lotSize: p.lotSize,
    pricePerSqft,
    // 8 clips — covers the widest template (quick-tour). Walkthrough-cinematic
    // uses clips[0..5] and ignores the last two. Each clip carries its own
    // default `overlay` + `kenBurns` hint; templates can override when their
    // pacing demands different motion (e.g. quick-tour swaps in whip motion).
    clips: [
      // 1. Hero exterior — hook card lives on top.
      { imageUrl: at(0), overlay: "", kenBurns: "slowZoomIn" },
      // 2. Interior wide — beds/baths.
      { imageUrl: at(1), overlay: `${p.beds} bed · ${p.baths} bath`, kenBurns: "slowPanRight" },
      // 3. Kitchen — sqft.
      { imageUrl: at(2), overlay: fmtSqft(p.sqft), kenBurns: "slowPanLeft" },
      // 4. Primary bedroom — city (quick-tour only; walkthrough stops at 3 beats).
      { imageUrl: at(3), overlay: city, kenBurns: "slowZoomIn" },
      // 5. Living — price.
      { imageUrl: at(4), overlay: `Listed at ${price}`, kenBurns: "slowPanRight" },
      // 6. Outdoor / pool — no text overlay (office attribution lives on the
      // end card, so this beat just lets the photo breathe).
      { imageUrl: at(5), overlay: "", kenBurns: "zoomIn" },
      // 7. Aerial / exterior — donation pill overlays (both templates).
      { imageUrl: at(6), overlay: "", kenBurns: "slowPanLeft" },
      // 8. Hero return — end card overlays (both templates).
      { imageUrl: at(7), overlay: "", kenBurns: "slowZoomIn" },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* Story — overlay text for the 9:16 rendered PNG                             */
/* -------------------------------------------------------------------------- */

/**
 * Story overlay text. These strings get composed over `images[0]` (cropped
 * 9:16) by `lib/social/story-render.ts` into a single PNG that lives in
 * `image_urls[0]` of the Story draft.
 *
 * The Story "caption" in Instagram is just the link sticker — set during
 * publish (Phase 3) to the listing URL.
 */
export function buildStoryOverlay(p: Property): StoryOverlay {
  const city = shortCity(p.city);
  const donation = fmtDonation(calcGivingPool(p.price));
  return {
    topStrip: `NEW AZ LISTING · ${city}`,
    address: p.address,
    specs: `${p.beds}bd · ${p.baths}ba · ${fmtSqft(p.sqft)}`,
    price: fmtPrice(p.price),
    donationBadge: `~${donation} to AZ charities`,
    bottomStrip: "Tap to view on Givenest",
  };
}
