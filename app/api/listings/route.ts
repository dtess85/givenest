import { NextResponse } from "next/server";
import { fetchSparkListings, countSparkListings } from "@/lib/spark";
import { getActiveManualListings, manualListingToProperty } from "@/lib/db/listings";
import { getListingKeysByAgent, getListingKeysBySubdivision } from "@/lib/db/listings-index";
import type { Property } from "@/lib/mock-data";

// Property type UI label → ARMLS PropertySubType values
const TYPE_MAP: Record<string, string[]> = {
  House: ["Single Family Residence"],
  Condo: ["Apartment", "Flat", "Loft", "Condominium"],
  Townhouse: ["Townhouse"],
  "Multi-Family": ["Duplex", "Triplex", "Quadruplex"],
  Land: ["Land", "Lots & Land"],
};

/** Filter in-memory manual listings by the same params used for Spark queries */
function applyManualFilters(listings: Property[], params: URLSearchParams): Property[] {
  const city = params.get("city");
  const zip = params.get("zip");
  const subdivision = params.get("subdivision");
  const agent = params.get("agent");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const type = params.get("type");
  const rawStatus = params.get("status");

  return listings.filter((p) => {
    // Location: city/zip/subdivision/agent — manual listing is included if no location filter,
    // or if it matches the specified filter
    if (city && !p.city.toLowerCase().startsWith(city.toLowerCase())) return false;
    if (zip) {
      // city field format: "Gilbert, AZ 85296"
      if (!p.city.includes(zip)) return false;
    }
    if (subdivision && !p.neighborhood?.toLowerCase().includes(subdivision.toLowerCase())) return false;
    // Manual listings don't carry an agent field; if the user is filtering by agent,
    // exclude all manual listings.
    if (agent) return false;

    // Price
    if (minPrice && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;

    // Property type
    if (type) {
      const requestedTypes = type.split(",");
      const typeMap: Record<string, string[]> = {
        House: ["Single Family Residence"],
        Condo: ["Apartment", "Flat", "Loft", "Condominium"],
        Townhouse: ["Townhouse"],
        "Multi-Family": ["Duplex", "Triplex", "Quadruplex"],
        Land: ["Land", "Lots & Land"],
      };
      const allowed = requestedTypes.flatMap((t) => typeMap[t] ?? [t]);
      if (!allowed.includes(p.type)) return false;
    }

    // Beds / baths
    const minBedsFilter = params.get("minBeds");
    const minBathsFilter = params.get("minBaths");
    if (minBedsFilter && Number(minBedsFilter) > 0 && p.beds < Number(minBedsFilter)) return false;
    if (minBathsFilter && Number(minBathsFilter) > 0 && p.baths < Number(minBathsFilter)) return false;

    // Status
    if (rawStatus) {
      const requestedStatuses = rawStatus.split(",").map((s) => {
        if (s === "For Sale" || s === "Active") return "For Sale";
        if (s === "Coming Soon") return "Coming Soon";
        if (s === "Contingent") return "Contingent";
        if (s === "Pending") return "Pending";
        return s;
      });
      if (p.status && !requestedStatuses.includes(p.status)) return false;
    }

    return true;
  });
}

/** Build a SparkQL OR group: (Field Eq 'v1' Or Field Eq 'v2') */
function orGroup(field: string, values: string[]): string {
  if (values.length === 1) return `${field} Eq '${values[0]}'`;
  return `(${values.map((v) => `${field} Eq '${v}'`).join(" Or ")})`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const conditions: string[] = [];

  // Always restrict to Arizona for-sale listings only.
  // Use explicit whitelist (Eq) rather than Ne — SparkQL Ne operator is unreliable.
  // PropertyType: A=Residential, Q=Manufactured/Mobile, L=Lot/Land — excludes RN=Rental/Lease
  conditions.push("StateOrProvince Eq 'AZ'");
  conditions.push("(PropertyType Eq 'A' Or PropertyType Eq 'Q' Or PropertyType Eq 'L')");

  // Status — IDX only allows Active/Coming Soon/Pending (no Sold)
  // When the user is browsing a specific subdivision/community we widen the
  // default to include Pending + Contingent — the autocomplete dropdown shows
  // those listings, so hiding them on the destination page is confusing
  // ("autocomplete showed 3, page shows 1"). The status badge on each card
  // makes the listing's true state clear.
  const rawStatus = searchParams.get("status");
  const isSubdivisionBrowse = !!searchParams.get("subdivision");
  const defaultStatuses = isSubdivisionBrowse
    ? ["Active", "Active UCB", "Coming Soon", "Pending"]
    : ["Active", "Active UCB", "Coming Soon"];
  if (rawStatus) {
    const statuses = rawStatus
      .split(",")
      .map((s) => {
        if (s === "For Sale" || s === "Active") return "Active";
        if (s === "Coming Soon") return "Coming Soon";
        if (s === "Contingent") return "Active UCB";
        if (s === "Pending") return "Pending";
        return null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    if (statuses.length > 0) {
      conditions.push(orGroup("MlsStatus", statuses));
    } else {
      conditions.push(orGroup("MlsStatus", defaultStatuses));
    }
  } else {
    conditions.push(orGroup("MlsStatus", defaultStatuses));
  }

  // Price range
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice) conditions.push(`ListPrice Ge ${minPrice}`);
  if (maxPrice) conditions.push(`ListPrice Le ${maxPrice}`);

  // Property type
  const type = searchParams.get("type");
  if (type) {
    const uiTypes = type.split(",");
    const armlsTypes = uiTypes.flatMap((t) => TYPE_MAP[t] ?? [t]);
    if (armlsTypes.length > 0) {
      conditions.push(orGroup("PropertySubType", armlsTypes));
    }
  }

  // City search
  const city = searchParams.get("city");
  if (city) conditions.push(`City Eq '${city.replace(/'/g, "")}'`);

  // Zip code search
  const zip = searchParams.get("zip");
  if (zip) conditions.push(`PostalCode Eq '${zip.replace(/'/g, "")}'`);

  // Subdivision / community search
  // Spark's `SubdivisionName Eq` is exact + case-sensitive, which misses
  // real-world variants ("STRATLAND ESTATES PHASE 1" vs "Stratland Estates").
  // Resolve the query to spark_listing_keys via our local index so the buy-page
  // filter matches everything the autocomplete dropdown matched.
  const subdivision = searchParams.get("subdivision");
  if (subdivision) {
    const subdivisionKeys = await getListingKeysBySubdivision(subdivision);
    if (subdivisionKeys.length === 0) {
      return NextResponse.json(
        { listings: [], pinnedListings: [], total: 0, totalPages: 0 },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
      );
    }
    const keyGroup = subdivisionKeys
      .map((k) => `ListingKey Eq '${k.replace(/'/g, "")}'`)
      .join(" Or ");
    conditions.push(`(${keyGroup})`);
  }

  // Agent name search — Spark's ListAgentName is NOT searchable via SparkQL,
  // so we look up the matching spark_listing_keys from our Supabase index
  // and restrict the Spark query to that key set with an OR group.
  const agent = searchParams.get("agent");
  if (agent) {
    const agentKeys = await getListingKeysByAgent(agent);
    if (agentKeys.length === 0) {
      // No listings for this agent — short-circuit with an empty result set.
      return NextResponse.json(
        { listings: [], pinnedListings: [], total: 0, totalPages: 0 },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
      );
    }
    const keyGroup = agentKeys
      .map((k) => `ListingKey Eq '${k.replace(/'/g, "")}'`)
      .join(" Or ");
    conditions.push(`(${keyGroup})`);
  }

  // Beds minimum
  const minBeds = searchParams.get("minBeds");
  if (minBeds && Number(minBeds) > 0)
    conditions.push(`BedsTotal Ge ${minBeds}`);

  // Baths minimum
  const minBaths = searchParams.get("minBaths");
  if (minBaths && Number(minBaths) > 0)
    conditions.push(`BathsFull Ge ${minBaths}`);

  // Sqft range
  const minSqft = searchParams.get("minSqft");
  const maxSqft = searchParams.get("maxSqft");
  if (minSqft) conditions.push(`LivingArea Ge ${minSqft}`);
  if (maxSqft) conditions.push(`LivingArea Le ${maxSqft}`);

  // Max HOA
  const maxHoa = searchParams.get("maxHoa");
  if (maxHoa && Number(maxHoa) > 0)
    conditions.push(`AssociationFee Le ${maxHoa}`);

  // Geo-filter: when the client provides lat/lng (for recommended/nearest sorts),
  // restrict Spark results to a bounding box around the user (~25 mi radius)
  // so the client-side distance sort has nearby listings to work with.
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const sort = searchParams.get("sort") ?? "recommended";
  if (lat && lng && (sort === "recommended" || sort === "nearest")) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      // ~0.36 degrees ≈ 25 miles at Arizona's latitude
      const latDelta = 0.36;
      const lngDelta = 0.43; // slightly wider because longitude degrees are shorter
      conditions.push(`Latitude Ge ${(userLat - latDelta).toFixed(6)}`);
      conditions.push(`Latitude Le ${(userLat + latDelta).toFixed(6)}`);
      conditions.push(`Longitude Ge ${(userLng - lngDelta).toFixed(6)}`);
      conditions.push(`Longitude Le ${(userLng + lngDelta).toFixed(6)}`);
    }
  }

  const filter = conditions.join(" And ");
  const limit = Number(searchParams.get("limit") ?? "50");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  // Map UI sort value to Spark _orderby field
  const SORT_MAP: Record<string, string> = {
    recommended: "-ListingContractDate",
    newest:      "-ListingContractDate",
    price_asc:   "ListPrice",
    price_desc:  "-ListPrice",
    sqft_desc:   "-LivingArea",
    beds_desc:   "-BedsTotal",
  };
  const orderby = SORT_MAP[sort] ?? "-ListingContractDate";

  try {
    // For Recommended sort on page 1: also fetch Givenest-listed properties so they can be
    // pinned to the top of the grid regardless of list date.
    // Givenest ARMLS office ID — used to reliably filter our own listings
    // (ListOfficeName is not searchable on the replication API; ListOfficeId is)
    const GIVENEST_OFFICE_ID = "20260331163530092165000000";
    const givenestFilterPromise =
      (sort === "recommended" || sort === "nearest") && page === 1
        ? fetchSparkListings(filter + ` And ListOfficeId Eq '${GIVENEST_OFFICE_ID}'`, 20, 1, "-ListingContractDate")
        : Promise.resolve({ listings: [] as Property[] });

    // Run count + listings + givenest pin + manual listings in parallel
    const [{ listings }, total, { listings: sparkPinned }, manualRows] = await Promise.all([
      fetchSparkListings(filter, limit, page, orderby),
      countSparkListings(filter),
      givenestFilterPromise,
      getActiveManualListings().catch(() => []),
    ]);

    // Map manual rows → Property and apply the same location/price/type filters in-memory
    const manualProperties = manualRows.map(manualListingToProperty);
    const filteredManual = applyManualFilters(manualProperties, searchParams);

    // Merge: manual listings first (highest priority), then Spark-pinned, dedup by slug
    const seenSlugs = new Set<string>();
    const pinnedListings: Property[] = [];
    for (const p of [...filteredManual, ...sparkPinned]) {
      if (!seenSlugs.has(p.slug)) {
        seenSlugs.add(p.slug);
        pinnedListings.push(p);
      }
    }

    const totalPages = Math.ceil(total / limit) || 1;
    return NextResponse.json({ listings, pinnedListings, total, totalPages }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("Listings API error:", err);
    return NextResponse.json(
      { listings: [], pinnedListings: [], total: 0, totalPages: 0, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
