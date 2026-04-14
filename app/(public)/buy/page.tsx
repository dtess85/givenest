import { Suspense } from "react";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import BuyClient, { type BuyClientInitialData } from "./BuyClient";
import BuySkeleton from "@/components/buy/BuySkeleton";
import { queryListings, type ListingsQueryResult } from "@/lib/listings/query";

type SearchParams = { [key: string]: string | string[] | undefined };

// Filter keys the buy page recognizes. Any request whose URL contains only
// keys outside this set (or no keys at all) is treated as the "default variant"
// and served from the RSC cache. Anything else runs a fresh query.
const FILTER_KEYS = [
  "city",
  "zip",
  "subdivision",
  "agent",
  "type",
  "status",
  "minPrice",
  "maxPrice",
  "minBeds",
  "minBaths",
  "minSqft",
  "maxSqft",
  "maxHoa",
  "sort",
] as const;

function isDefaultVariant(searchParams: SearchParams): boolean {
  return FILTER_KEYS.every((k) => {
    const v = searchParams[k];
    return v === undefined || v === "";
  });
}

/**
 * Build the URLSearchParams that mirror the client's first-page fetch.
 * The `limit` and sort follow the same rules BuyClient uses so the server
 * payload matches whatever the client would have asked for — this keeps
 * pagination offsets aligned after hydration.
 */
function buildInitialParams(searchParams: SearchParams, lat: number | null, lng: number | null): URLSearchParams {
  const params = new URLSearchParams();

  for (const k of FILTER_KEYS) {
    const v = searchParams[k];
    if (typeof v === "string" && v !== "") params.set(k, v);
  }

  const sort = params.get("sort") ?? "recommended";
  params.set("sort", sort);
  params.set("page", "1");

  const isGeoEligible =
    (sort === "recommended" || sort === "nearest") && lat !== null && lng !== null;
  // Match BuyClient.fetchListings: geo sorts pull 100 (so client-side haversine
  // has enough nearby listings to fill the fold); everything else pulls 12.
  params.set("limit", isGeoEligible ? "100" : "12");
  if (isGeoEligible && lat !== null && lng !== null) {
    params.set("lat", String(lat));
    params.set("lng", String(lng));
  }

  return params;
}

/**
 * Cached wrapper for the default-variant query. Keyed on the coarse lat/lng
 * bucket so visitors near each other share a cache entry.
 * Tag `listings:default` can be revalidated from mutation hooks.
 */
const getDefaultListingsCached = unstable_cache(
  async (latBucket: number | null, lngBucket: number | null): Promise<ListingsQueryResult> => {
    const params = buildInitialParams({}, latBucket, lngBucket);
    return queryListings(params);
  },
  ["buy", "default-listings", "v1"],
  { tags: ["listings:default"], revalidate: 300 }
);

/** Round lat/lng to 0.5° buckets (~30 mi) to keep the cache hit rate high */
function bucket(n: number | null): number | null {
  if (n === null) return null;
  return Math.round(n * 2) / 2;
}

async function BuyData({ searchParams }: { searchParams: SearchParams }) {
  // IP-derived lat/lng from Vercel's edge headers. Good-enough starting point
  // so the client doesn't block the first paint on /api/user-location or GPS.
  const h = headers();
  const latStr = h.get("x-vercel-ip-latitude");
  const lngStr = h.get("x-vercel-ip-longitude");
  const ipLat = latStr ? parseFloat(latStr) : null;
  const ipLng = lngStr ? parseFloat(lngStr) : null;
  const lat = ipLat !== null && !isNaN(ipLat) ? ipLat : null;
  const lng = ipLng !== null && !isNaN(ipLng) ? ipLng : null;

  const isDefault = isDefaultVariant(searchParams);

  let data: ListingsQueryResult;
  try {
    data = isDefault
      ? await getDefaultListingsCached(bucket(lat), bucket(lng))
      : await queryListings(buildInitialParams(searchParams, lat, lng));
  } catch (err) {
    console.error("[buy/page] server query failed, falling back to client-only render:", err);
    data = { listings: [], pinnedListings: [], total: 0, totalPages: 0 };
  }

  const initial: BuyClientInitialData = {
    listings: data.listings,
    pinnedListings: data.pinnedListings,
    total: data.total,
    totalPages: data.totalPages,
    lat,
    lng,
  };

  return <BuyClient initial={initial} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<BuySkeleton />}>
      <BuyData searchParams={searchParams} />
    </Suspense>
  );
}
