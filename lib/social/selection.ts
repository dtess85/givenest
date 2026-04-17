import { fetchSparkListings } from "@/lib/spark";
import {
  getPostedOrPendingSlugs,
  getRecentPostsByTier,
} from "@/lib/db/social-posts";
import { shortCity } from "@/lib/social/caption";
import type { Property } from "@/lib/mock-data";
import type {
  CandidateListing,
  ListingDay,
  PriceTier,
} from "@/lib/social/types";

/* -------------------------------------------------------------------------- */
/* Tier definitions                                                           */
/* -------------------------------------------------------------------------- */

/** Day → `[minPrice, maxPriceExclusive | null]`. */
const TIERS: Record<ListingDay, { tier: PriceTier; min: number; max: number | null }> = {
  mon: { tier: "ultra",  min: 3_000_000, max: null },       // $3M+
  wed: { tier: "luxury", min:   900_000, max: 3_000_000 },  // $900K–$3M
  fri: { tier: "entry",  min:   750_000, max:   900_000 },  // $750K–$900K
};

export function tierForDay(day: ListingDay): PriceTier {
  return TIERS[day].tier;
}

/* -------------------------------------------------------------------------- */
/* Spark filter construction                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Cities we intentionally concentrate on for the brand feed. Paradise Valley
 * (via `City Eq`) + Arcadia (via Phoenix zips) blend into "premium AZ" without
 * pulling in the whole Phoenix metro.
 */
const FOCUS_CITIES = ["Scottsdale", "Paradise Valley", "Gilbert", "Cave Creek", "Queen Creek"];
const ARCADIA_ZIPS = ["85018", "85016", "85251"];

/**
 * Build the city-scope filter. Spark's SparkQL rejects more than 2 levels of
 * parenthetical nesting (error code 1041). The Arcadia carve-out (Phoenix +
 * specific zips) would be 3 levels if expressed inline, so we include
 * "Phoenix" in the OR list at the API level and filter down to the Arcadia
 * zips in-memory after the fetch (see `passesCityScope`).
 */
function buildCityFilter(): string {
  const cities = [...FOCUS_CITIES, "Phoenix"];
  return "(" + cities.map((c) => `City Eq '${c}'`).join(" Or ") + ")";
}

/** In-memory city filter: keep FOCUS_CITIES outright, but for Phoenix only
 *  keep listings whose zip is in ARCADIA_ZIPS. Cheap to run post-fetch. */
function passesCityScope(p: Property): boolean {
  const city = shortCity(p.city);
  if (FOCUS_CITIES.includes(city)) return true;
  if (city === "Phoenix") {
    // Property.city is formatted `"Phoenix, AZ 85018"` — last token is the zip
    const zip = p.city.split(" ").pop() ?? "";
    return ARCADIA_ZIPS.includes(zip);
  }
  return false;
}

function buildTierFilter(day: ListingDay): string {
  const { min, max } = TIERS[day];
  const parts = [
    "StateOrProvince Eq 'AZ'",
    "(MlsStatus Eq 'Active' Or MlsStatus Eq 'Coming Soon')",
    `ListPrice Ge ${min}`,
  ];
  if (max !== null) parts.push(`ListPrice Lt ${max}`);
  parts.push(buildCityFilter());
  return parts.join(" And ");
}

/* -------------------------------------------------------------------------- */
/* Photo-quality check                                                        */
/* -------------------------------------------------------------------------- */

/** Spark returns HD photos as `Uri1280`; `sparkToProperty` falls back to
 *  `Uri800` when 1280 is missing. We want an explicit HD check — Spark's
 *  resize CDN encodes the size in the path as `/1280x1024/` (width×height),
 *  so we match "/1280x<digits>/" as the reliable HD-present signal.
 *  Query-param form `?w=1280` is kept as a fallback for non-resize CDNs. */
function isHdUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\/1280x\d+\//.test(url) || /[?&](w|width)=12\d{2}/.test(url);
}

function passesPhotoQuality(p: Property): boolean {
  if (!p.images || p.images.length < 25) return false;
  return isHdUrl(p.images[0]);
}

/* -------------------------------------------------------------------------- */
/* HEAD validation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Meta's media fetcher will reject containers whose `image_url` isn't a
 * straight HTTPS 200 image response. Drop candidates whose primary image
 * can't be verified at draft time so we don't queue up a guaranteed-to-fail
 * publish later.
 *
 * Runs in parallel with a 5s timeout per URL.
 */
async function headValidatePrimaryImage(p: Property): Promise<boolean> {
  const url = p.images?.[0];
  if (!url) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Selection                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Pick the single listing that today's cron will post as Reel + Carousel + Story.
 *
 * Pipeline:
 *   1. Spark filter: AZ + Active/Coming Soon + day's price tier + focus cities
 *   2. Photo quality: ≥ 25 photos AND `images[0]` is HD
 *   3. Dedup against the last 90 days of drafts/publishes
 *   4. HEAD-verify `images[0]` is a live image/*
 *   5. Variety score: recency rank, minus penalty if the city matches one of
 *      this tier's last 2 posts
 *
 * Returns `null` only if the entire AZ ARMLS feed has nothing qualifying —
 * effectively never in practice with 5+ focus cities.
 */
export async function selectListingCandidate(
  day: ListingDay
): Promise<CandidateListing | null> {
  const filter = buildTierFilter(day);
  const { listings } = await fetchSparkListings(filter, 100, 1, "-ListingContractDate");
  const TRACE = process.env.SOCIAL_SELECT_TRACE === "1";
  if (TRACE) console.log(`[select] spark returned=${listings.length}`);

  // 1: city scope (trim Phoenix → Arcadia zips in-memory; see buildCityFilter)
  let candidates = listings.filter(passesCityScope);
  if (TRACE) console.log(`[select] after city scope=${candidates.length}`);
  if (candidates.length === 0) return null;

  // 2: photo quality
  candidates = candidates.filter(passesPhotoQuality);
  if (TRACE) console.log(`[select] after photo quality=${candidates.length}`);
  if (candidates.length === 0) {
    if (TRACE && listings[0]) {
      console.log(`[select] sample photo counts:`, listings.slice(0, 5).map((p) => ({
        slug: p.slug, n: p.images?.length ?? 0, first: p.images?.[0]?.slice(0, 120),
      })));
    }
    return null;
  }

  // 3: dedup
  const seenSlugs = await getPostedOrPendingSlugs(90).catch((e) => {
    // DB may not have the table yet in dev — treat as no prior posts
    if (TRACE) console.log(`[select] dedup db lookup failed: ${e instanceof Error ? e.message : e}`);
    return new Set<string>();
  });
  candidates = candidates.filter((p) => !seenSlugs.has(p.slug));
  if (TRACE) console.log(`[select] after dedup=${candidates.length}`);
  if (candidates.length === 0) return null;

  // 4: HEAD-validate primary images. Run parallel, keep passing ones.
  const checks = await Promise.all(
    candidates.map(async (p) => ({ p, ok: await headValidatePrimaryImage(p) }))
  );
  candidates = checks.filter((c) => c.ok).map((c) => c.p);
  if (TRACE) console.log(`[select] after HEAD validation=${candidates.length}`);
  if (candidates.length === 0) return null;

  // 5: variety. Penalize repeating the last 2 tier-posts' cities.
  const tier = tierForDay(day);
  const tierRecent = await getRecentPostsByTier(tier, 6).catch(() => [] as Awaited<ReturnType<typeof getRecentPostsByTier>>);
  const lastTwoCities = new Set(
    tierRecent
      .slice(0, 2)
      .map((r) => r.listing_snapshot?.city ?? "")
      .map((c) => shortCity(c).toLowerCase())
      .filter(Boolean)
  );

  type Scored = { p: Property; score: number };
  const scored: Scored[] = candidates.map((p, i) => {
    const cityKey = shortCity(p.city).toLowerCase();
    const cityPenalty = lastTwoCities.has(cityKey) ? 50 : 0;
    const recencyRank = candidates.length - i; // newest first
    return { p, score: recencyRank - cityPenalty };
  });
  scored.sort((a, b) => b.score - a.score);

  const winner = scored[0]?.p;
  if (!winner) return null;

  return {
    property: winner,
    officeName: winner.listOfficeName ?? "Listing brokerage",
    priceTier: tier,
  };
}

/* -------------------------------------------------------------------------- */
/* Day resolution                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Derive the listing-day slug from today's weekday. Returns null on
 * non-listing days (Sun/Tue/Thu/Sat) so the cron can be a no-op when
 * misfired or manually invoked without `?day=`.
 */
export function dayFromDate(date: Date): ListingDay | null {
  // UTC weekday: 0=Sun, 1=Mon, …, 6=Sat.
  switch (date.getUTCDay()) {
    case 1: return "mon";
    case 3: return "wed";
    case 5: return "fri";
    default: return null;
  }
}
