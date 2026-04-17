import { fetchSparkListings, countSparkListings } from "@/lib/spark";
import { getActiveManualListings, manualListingToProperty } from "@/lib/db/listings";
import { getListingKeysByAgent, getListingKeysBySubdivision } from "@/lib/db/listings-index";
import { GIVENEST_OFFICE_ID } from "@/lib/constants/givenest";
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

  // Geo-filter for recommended/nearest sorts
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const sort = searchParams.get("sort") ?? "recommended";
  if (lat && lng && (sort === "recommended" || sort === "nearest")) {
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

  // Pin our own listings to page 1 of Recommended/Nearest via the Givenest office id
  // (defined in @/lib/constants/givenest).
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

  // Map manual rows → Property and apply the same filters in-memory
  const manualProperties = manualRows.map(manualListingToProperty);
  const filteredManual = applyManualFilters(manualProperties, searchParams);

  // Merge: manual listings first, then Spark-pinned, dedup by slug
  const seenSlugs = new Set<string>();
  const pinnedListings: Property[] = [];
  for (const p of [...filteredManual, ...sparkPinned]) {
    if (!seenSlugs.has(p.slug)) {
      seenSlugs.add(p.slug);
      pinnedListings.push(p);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;
  return { listings, pinnedListings, total, totalPages };
}
