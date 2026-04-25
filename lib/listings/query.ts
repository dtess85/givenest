import { fetchSparkListings, countSparkListings } from "@/lib/spark";
import { getActiveManualListings, manualListingToProperty } from "@/lib/db/listings";
import { getListingKeysByAgent, getListingKeysBySubdivision, getOfficeIdsByBrokerageName, enrichWithShortSlugs, enrichWithPriceChanges } from "@/lib/db/listings-index";
import { GIVENEST_OFFICE_ID } from "@/lib/constants/givenest";
import { CITY_ALIASES } from "@/lib/az-locations";
import type { Property } from "@/lib/mock-data";

export interface ListingsQueryResult {
  listings: Property[];
  pinnedListings: Property[];
  total: number;
  totalPages: number;
}

// Property type UI label → ARMLS PropertySubType values
const TYPE_MAP: Record<string, string[]> = {
  House: ["Single Family Residence"],
  Condo: ["Apartment", "Flat", "Loft", "Condominium"],
  Townhouse: ["Townhouse"],
  "Multi-Family": ["Duplex", "Triplex", "Quadruplex"],
  Land: ["Land", "Lots & Land"],
};

/** Build a SparkQL OR group: (Field Eq 'v1' Or Field Eq 'v2') */
function orGroup(field: string, values: string[]): string {
  if (values.length === 1) return `${field} Eq '${values[0]}'`;
  return `(${values.map((v) => `${field} Eq '${v}'`).join(" Or ")})`;
}

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

    // Status — mirrors the server-side flatMap so "Under Contract / Pending"
    // and "Sold" actually narrow the manual-listings list.
    if (rawStatus) {
      const requestedStatuses = rawStatus.split(",").flatMap((s): string[] => {
        if (s === "For Sale" || s === "Active") return ["For Sale"];
        if (s === "Coming Soon") return ["Coming Soon"];
        if (s === "Contingent") return ["Contingent"];
        if (s === "Pending") return ["Pending"];
        if (s === "Under Contract / Pending") return ["Contingent", "Pending"];
        if (s === "Sold") return ["Sold"];
        return [];
      });
      if (requestedStatuses.length > 0 && p.status && !requestedStatuses.includes(p.status)) return false;
    }

    // Year built (minYear/maxYear)
    const minYr = params.get("minYear");
    const maxYr = params.get("maxYear");
    if (minYr && Number(minYr) > 0 && p.yearBuilt && p.yearBuilt < Number(minYr)) return false;
    if (maxYr && Number(maxYr) > 0 && p.yearBuilt && p.yearBuilt > Number(maxYr)) return false;

    // New Construction — same YearBuilt proxy used on the Spark side.
    const manualListingType = params.get("listingType");
    const manualListingTypes = manualListingType ? manualListingType.split(",") : [];
    if (manualListingTypes.includes("New Construction")) {
      const cutoff = new Date().getFullYear() - 1;
      if (!p.yearBuilt || p.yearBuilt < cutoff) return false;
    }

    return true;
  });
}

/**
 * Run the /buy listings query against Spark + manual-listings + agent/subdivision index.
 * Callable from both the /api/listings route handler and server components.
 *
 * Behavior is byte-for-byte identical to the previous inline route logic — the only
 * change is it returns a plain result (no NextResponse), so callers choose transport.
 */
export async function queryListings(searchParams: URLSearchParams): Promise<ListingsQueryResult> {
  const conditions: string[] = [];

  // Always restrict to Arizona for-sale listings only.
  conditions.push("StateOrProvince Eq 'AZ'");
  conditions.push("(PropertyType Eq 'A' Or PropertyType Eq 'Q' Or PropertyType Eq 'L')");

  // Status
  const rawStatus = searchParams.get("status");
  const isSubdivisionBrowse = !!searchParams.get("subdivision");
  const defaultStatuses = isSubdivisionBrowse
    ? ["Active", "Active UCB", "Coming Soon", "Pending"]
    : ["Active", "Active UCB", "Coming Soon"];
  let resolvedStatuses: string[];
  if (rawStatus) {
    // Each UI label can fan out to multiple MLS statuses (e.g. "Under Contract /
    // Pending" covers both Active-Under-Contract and Pending). Flatten so the
    // OR group contains every matching ARMLS value, then dedupe.
    const statuses = rawStatus
      .split(",")
      .flatMap((s): string[] => {
        if (s === "For Sale" || s === "Active") return ["Active"];
        if (s === "Coming Soon") return ["Coming Soon"];
        if (s === "Contingent") return ["Active UCB"];
        if (s === "Pending") return ["Pending"];
        if (s === "Under Contract / Pending") return ["Active UCB", "Pending"];
        if (s === "Sold") return ["Closed"];
        return [];
      });
    const uniq = Array.from(new Set(statuses));
    resolvedStatuses = uniq.length > 0 ? uniq : defaultStatuses;
  } else {
    resolvedStatuses = defaultStatuses;
  }
  const statusGroup = orGroup("MlsStatus", resolvedStatuses);
  // Keep Givenest's own pending listings visible even when the resolved
  // status filter would otherwise exclude "Pending".
  if (!resolvedStatuses.includes("Pending")) {
    conditions.push(
      `(${statusGroup} Or (ListOfficeId Eq '${GIVENEST_OFFICE_ID}' And MlsStatus Eq 'Pending'))`
    );
  } else {
    conditions.push(statusGroup);
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

  // City search. Some AZ towns have multiple MLS city values (see CITY_ALIASES),
  // so we expand into an Or-group to catch inconsistent data entry.
  const city = searchParams.get("city");
  if (city) {
    const safeCity = city.replace(/'/g, "");
    const aliases = CITY_ALIASES[safeCity] ?? [safeCity];
    conditions.push(orGroup("City", aliases));
  }

  // Brokerage search — SparkQL's `ListOfficeName Eq` is not filterable, so we
  // resolve the display name to the set of Spark office ids that share it
  // (via the agents table) and filter by id. One brand can span many offices
  // (e.g. HomeSmart has 10+ franchise branches).
  const brokerage = searchParams.get("brokerage");
  if (brokerage) {
    const officeIds = await getOfficeIdsByBrokerageName(brokerage);
    if (officeIds.length === 0) {
      return { listings: [], pinnedListings: [], total: 0, totalPages: 0 };
    }
    conditions.push(orGroup("ListOfficeId", officeIds));
  }

  // Zip code search
  const zip = searchParams.get("zip");
  if (zip) conditions.push(`PostalCode Eq '${zip.replace(/'/g, "")}'`);

  // Subdivision / community search — resolve via local index
  const subdivision = searchParams.get("subdivision");
  if (subdivision) {
    const subdivisionKeys = await getListingKeysBySubdivision(subdivision);
    if (subdivisionKeys.length === 0) {
      return { listings: [], pinnedListings: [], total: 0, totalPages: 0 };
    }
    const keyGroup = subdivisionKeys
      .map((k) => `ListingKey Eq '${k.replace(/'/g, "")}'`)
      .join(" Or ");
    conditions.push(`(${keyGroup})`);
  }

  // Agent name search — resolve via local index
  const agent = searchParams.get("agent");
  if (agent) {
    const agentKeys = await getListingKeysByAgent(agent);
    if (agentKeys.length === 0) {
      return { listings: [], pinnedListings: [], total: 0, totalPages: 0 };
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

  // Year built range — pushed to the server so the filter applies across ALL
  // pages rather than just the 12-item page already in memory client-side.
  const minYear = searchParams.get("minYear");
  const maxYear = searchParams.get("maxYear");
  if (minYear && Number(minYear) > 0) conditions.push(`YearBuilt Ge ${minYear}`);
  if (maxYear && Number(maxYear) > 0) conditions.push(`YearBuilt Le ${maxYear}`);

  // Max days on market — use OnMarketDate as the cutoff. Server-side filtering
  // means "Listed within last 7 days" actually shows 7-day listings, not
  // whatever 7-day listings happened to be on the current page.
  const maxDom = searchParams.get("maxDom");
  if (maxDom && Number(maxDom) > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(maxDom));
    const iso = cutoff.toISOString().slice(0, 10);
    conditions.push(`OnMarketDate Ge ${iso}`);
  }

  // New Construction — "New Construction" UI checkbox maps to YearBuilt Ge
  // (currentYear - 1). ARMLS has a NewConstructionYN flag but it's not in our
  // field set; YearBuilt is a close-enough proxy and already available.
  const listingType = searchParams.get("listingType");
  const requestedListingTypes = listingType ? listingType.split(",") : [];
  if (requestedListingTypes.includes("New Construction")) {
    const cutoffYear = new Date().getFullYear() - 1;
    conditions.push(`YearBuilt Ge ${cutoffYear}`);
  }

  // Snapshot of conditions BEFORE the geo bounds are added — used for the
  // Givenest pin so our own listings stay visible statewide even when the
  // main query is narrowed to the user's proximity window. Without this,
  // a Givenest listing in Lakeside would appear on SSR (no lat/lng yet)
  // and vanish once the client refetches with the user's IP/GPS location.
  // Year/DOM/NewConstruction conditions are intentionally INSIDE the snapshot
  // so the pin honors those user filters.
  const nonGeoConditions = [...conditions];

  // Geo-filter for recommended/nearest sorts. Only applied when there's no
  // explicit location filter — if the user picked a city/zip/subdivision/
  // agent/brokerage, their IP-based proximity bounds shouldn't narrow the
  // result set (e.g. searching "Pinetop-Lakeside" from a Phoenix IP would
  // otherwise return zero because Lakeside sits outside the Phoenix box).
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const sort = searchParams.get("sort") ?? "recommended";
  const hasExplicitLocation = !!(
    searchParams.get("city") ||
    searchParams.get("zip") ||
    searchParams.get("subdivision") ||
    searchParams.get("agent") ||
    searchParams.get("brokerage")
  );
  if (lat && lng && !hasExplicitLocation && (sort === "recommended" || sort === "nearest")) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      const latDelta = 0.36;
      const lngDelta = 0.43;
      conditions.push(`Latitude Ge ${(userLat - latDelta).toFixed(6)}`);
      conditions.push(`Latitude Le ${(userLat + latDelta).toFixed(6)}`);
      conditions.push(`Longitude Ge ${(userLng - lngDelta).toFixed(6)}`);
      conditions.push(`Longitude Le ${(userLng + lngDelta).toFixed(6)}`);
    }
  }

  const filter = conditions.join(" And ");
  const givenestBaseFilter = nonGeoConditions.join(" And ");
  const limit = Number(searchParams.get("limit") ?? "50");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const SORT_MAP: Record<string, string> = {
    recommended: "-ListingContractDate",
    newest:      "-ListingContractDate",
    price_asc:   "ListPrice",
    price_desc:  "-ListPrice",
    sqft_desc:   "-LivingArea",
    beds_desc:   "-BedsTotal",
  };
  const orderby = SORT_MAP[sort] ?? "-ListingContractDate";

  // Pin our own listings to page 1 of Recommended via the Givenest office id
  // (defined in @/lib/constants/givenest). "Closest to me" is pure distance —
  // no pinning — so a user browsing by nearest still sees true nearest first,
  // even if the closest home isn't one of ours.
  const givenestFilterPromise =
    sort === "recommended" && page === 1
      ? fetchSparkListings(givenestBaseFilter + ` And ListOfficeId Eq '${GIVENEST_OFFICE_ID}'`, 20, 1, "-ListingContractDate")
      : Promise.resolve({ listings: [] as Property[] });

  // Run count + listings + givenest pin + manual listings in parallel
  const [{ listings }, total, { listings: sparkPinned }, manualRows] = await Promise.all([
    fetchSparkListings(filter, limit, page, orderby),
    countSparkListings(filter),
    givenestFilterPromise,
    getActiveManualListings().catch(() => []),
  ]);

  // Map manual rows → Property and apply the same filters in-memory
  const manualProperties = manualRows.map(manualListingToProperty);
  const filteredManual = applyManualFilters(manualProperties, searchParams);

  // Merge: manual listings first, then Spark-pinned, dedup by sparkKey (or
  // slug if no sparkKey — manual listings have their own "manual-<uuid>" slug).
  const seen = new Set<string>();
  const pinnedListings: Property[] = [];
  for (const p of [...filteredManual, ...sparkPinned]) {
    const key = p.sparkKey ?? p.slug;
    if (!seen.has(key)) {
      seen.add(key);
      pinnedListings.push(p);
    }
  }

  // Swap raw Spark keys for short `gpid-XXXXXXXX` slugs wherever we have one
  // in the index, and bulk-fill price-change snapshots for the badge UI.
  // One bulk DB query each per listings request, run in parallel.
  await Promise.all([
    enrichWithShortSlugs([...listings, ...pinnedListings]),
    enrichWithPriceChanges([...listings, ...pinnedListings]),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  return { listings, pinnedListings, total, totalPages };
}
