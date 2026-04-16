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
    `🏡 New Arizona listing in ${city}`,
    "",
    p.address,
    `${p.beds} bed · ${p.baths} bath · ${fmtSqft(p.sqft)}`,
    `Listed at ${fmtPrice(p.price)}`,
    "",
    `If this home sold through Givenest, ~${fmtDonation(donation)} would fund`,
    `Arizona nonprofits. Every closing with Givenest gives back.`,
    "",
    `Listed by ${officeName}. Offer through Givenest — link in bio 🔗 or DM for details.`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Reel — short + punchy                                                      */
/* -------------------------------------------------------------------------- */

/** Rotation pool of hook phrasings used on-screen in the first 1–2s of a Reel. */
export const REEL_HOOK_POOL: { id: string; render: (p: Property) => string }[] = [
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
  { id: "would-you", text: "Would you live here? 👇" },
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
    `New ${city} listing → ~${fmtDonation(donation)} to AZ charities 🏡`,
    "",
    `Listed by ${officeName}. DM for details or tap the link in bio 🔗`,
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
 * Clip count: up to 6 (falls back to `images[0]` if fewer photos available).
 * Each clip runs 1.0–1.5s in the cinematic templates (→ ~15–25s total).
 */
export function buildReelScript(
  p: Property,
  officeName: string,
  opts?: { hookId?: string; ctaId?: string }
): ReelScript & { hookId: string; ctaId: string } {
  const hook =
    REEL_HOOK_POOL.find((h) => h.id === opts?.hookId) ?? REEL_HOOK_POOL[0];
  const cta =
    REEL_CTA_POOL.find((c) => c.id === opts?.ctaId) ?? REEL_CTA_POOL[0];

  const imgs = p.images ?? [];
  const at = (i: number): string => imgs[i] ?? imgs[0] ?? "";

  const city = shortCity(p.city);
  const price = fmtPrice(p.price);
  const donation = fmtDonation(calcGivingPool(p.price));

  return {
    hookId: hook.id,
    ctaId: cta.id,
    hookText: hook.render(p),
    ctaText: cta.text,
    clips: [
      { imageUrl: at(0), overlay: `${p.beds} bed · ${p.baths} bath`, kenBurns: "zoomIn" },
      { imageUrl: at(1), overlay: fmtSqft(p.sqft),                    kenBurns: "panRight" },
      { imageUrl: at(2), overlay: city,                               kenBurns: "panLeft" },
      { imageUrl: at(3), overlay: `Listed at ${price}`,               kenBurns: "zoomOut" },
      { imageUrl: at(4), overlay: `~${donation} to AZ charities`,     kenBurns: "zoomIn" },
      { imageUrl: at(5), overlay: `Listed by ${officeName}`,          kenBurns: "panRight" },
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
    topStrip: `🏡 NEW AZ LISTING · ${city}`,
    address: p.address,
    specs: `${p.beds}bd · ${p.baths}ba · ${fmtSqft(p.sqft)}`,
    price: fmtPrice(p.price),
    donationBadge: `~${donation} to AZ charities`,
    bottomStrip: "Tap to view on Givenest",
  };
}
