/**
 * Resolve a user-supplied target (URL, price range, city, or "random") to a
 * concrete Spark listing key. Used by the /admin/social "Generate Reel" form.
 *
 * All four modes end at the same place: a Spark listing key the caller can
 * feed to `fetchSparkListing()` to get the full Property for draft creation.
 *
 * Eligibility for random/price/city picks: only `mls_status = 'Active'`
 * listings with a spark_listing_key. Those are the ones the /buy page
 * actually shows, so this matches what the admin user is browsing.
 */

import { pool } from "@/lib/db";
import { parsePublicSlug } from "@/lib/short-id";
import { getSparkKeyByShortId } from "@/lib/db/listings-index";

export type ReelTarget =
  | { mode: "url"; url: string }
  | { mode: "price"; minPrice?: number; maxPrice?: number }
  | { mode: "city"; city: string }
  | { mode: "random" };

export interface ResolvedTarget {
  sparkKey: string;
  /** Optional pre-built label. Populated by the DB-backed modes (price/city/
   *  random) where we already have the row in hand. URL mode leaves this
   *  empty — the slug alone isn't a useful label, so the caller derives one
   *  from the fetched Property via `fmtPropertyLabel`. */
  label?: string;
}

/** Pull the last path segment off a URL-ish string. Accepts full URLs,
 *  path-only strings, or a bare slug; returns the trailing slug. */
function extractSlug(input: string): string {
  const trimmed = input.trim();
  // Match the last non-empty path segment so we handle:
  //   https://givenest.com/buy/2026...0000
  //   /buy/gpid-aB3kE9Qs
  //   2026...0000  (bare key)
  const segs = trimmed.split(/[?#]/)[0].split("/").filter(Boolean);
  return segs[segs.length - 1] ?? trimmed;
}

/** Format a price-tag label — "$1.3M", "$820K", etc. */
export function fmtShortPrice(price: number | null): string {
  if (price == null || price <= 0) return "";
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `$${m >= 10 ? m.toFixed(1) : m.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

/** Build the short human label used in the "Draft created" toast. Same shape
 *  for all four modes — the resolver doesn't try to label URL-mode targets
 *  itself (the slug is opaque), it lets the caller derive this from the
 *  fetched Property. */
export function fmtPropertyLabel(p: {
  price: number;
  city: string;
  address: string;
}): string {
  const city = (p.city ?? "").split(",")[0]?.trim() ?? "";
  return [fmtShortPrice(p.price), city, p.address]
    .filter(Boolean)
    .join(" · ");
}

export async function resolveReelTarget(
  target: ReelTarget
): Promise<ResolvedTarget | { error: string }> {
  if (target.mode === "url") {
    const slug = extractSlug(target.url);
    if (!slug) return { error: "URL has no listing slug." };

    // Three slug shapes:
    //   1. gpid-XXXXXXXX   → short id, needs spark_listing_key lookup
    //   2. 24-digit Spark listing key (numeric)
    //   3. manual-<uuid>   → not supported for reels (no Spark source)
    if (slug.startsWith("manual-")) {
      return { error: "Manual listings can't be used for reels (no Spark source)." };
    }
    const shortId = parsePublicSlug(slug);
    if (shortId) {
      const sparkKey = await getSparkKeyByShortId(shortId);
      if (!sparkKey) {
        return { error: `No listing found for ${slug}.` };
      }
      return { sparkKey };
    }
    if (/^\d{10,}$/.test(slug)) {
      return { sparkKey: slug };
    }
    return { error: `Unrecognized listing URL or slug: ${slug}` };
  }

  // ── DB-backed picks (price / city / random) ─────────────────────────────
  // All three pick a random row from the active listings pool. We assemble the
  // WHERE clause defensively (bind every user-supplied value) and use
  // `ORDER BY RANDOM() LIMIT 1` — the active pool is small enough (~10k rows)
  // that a full scan is fine.
  const where: string[] = ["spark_listing_key IS NOT NULL", "mls_status = 'Active'"];
  const values: unknown[] = [];

  if (target.mode === "price") {
    if (target.minPrice != null) {
      values.push(target.minPrice);
      where.push(`price >= $${values.length}`);
    }
    if (target.maxPrice != null) {
      values.push(target.maxPrice);
      where.push(`price <= $${values.length}`);
    }
  } else if (target.mode === "city") {
    values.push(target.city);
    where.push(`LOWER(city) = LOWER($${values.length})`);
  }

  const { rows } = await pool.query(
    `SELECT spark_listing_key, price, city, address
       FROM listings
      WHERE ${where.join(" AND ")}
      ORDER BY RANDOM()
      LIMIT 1`,
    values
  );

  if (rows.length === 0) {
    const crit =
      target.mode === "price"
        ? `price ${target.minPrice ?? "?"}\u2013${target.maxPrice ?? "?"}`
        : target.mode === "city"
          ? `city=${target.city}`
          : "any";
    return { error: `No active listings match ${crit}.` };
  }

  const row = rows[0] as {
    spark_listing_key: string;
    price: number | null;
    city: string | null;
    address: string;
  };
  const priceLabel = fmtShortPrice(row.price);
  const label = [priceLabel, row.city ?? "", row.address]
    .filter(Boolean)
    .join(" · ");

  return { sparkKey: row.spark_listing_key, label };
}
