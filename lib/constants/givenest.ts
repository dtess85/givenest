/**
 * Shared Givenest constants. Imported from anywhere that needs the office id,
 * display name, or canonical listing detail URL — no more duplicated magic
 * strings scattered through the codebase.
 */

/** ARMLS office id for Givenest — used to pin our listings on /buy and to
 *  attribute our own inventory correctly in social posts. */
export const GIVENEST_OFFICE_ID = "20260331163530092165000000";

/** Human-readable office name. Used in captions, footers, attribution. */
export const GIVENEST_OFFICE_NAME = "Givenest";

/** Canonical site origin, with a safe default for local/dev environments. */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://givenest.com";

/** Build the absolute URL for a listing detail page. */
export const listingDetailUrl = (slug: string): string =>
  `${SITE_ORIGIN}/buy/${slug}`;
