import type { Property } from "./mock-data";

const SPARK_BASE = "https://replication.sparkapi.com/v1";
const TOKEN = process.env.SPARK_API_TOKEN;

const FIELDS = [
  "ListingKey",
  "ListingId",
  "ListPrice",
  "BedsTotal",
  "BathsFull",
  "BathsHalf",
  "LivingArea",
  "City",
  "StreetNumber",
  "StreetDirPrefix",
  "StreetName",
  "StreetSuffix",
  "StreetDirSuffix",
  "StateOrProvince",
  "PostalCode",
  "PropertySubType",
  "MlsStatus",
  "PublicRemarks",
  "SupplementalRemarks",
  "YearBuilt",
  "LotSizeAcres",
  "AssociationFee",
  "GarageSpaces",
  "ListingContractDate",
  "StatusChangeTimestamp",
  "ListOfficeName",
  "ListAgentName",
  "Latitude",
  "Longitude",
  "SubdivisionName",
  "BackOnMarketDate",
  "ModificationTimestamp",
  "OnMarketDate",
].join(",");

export interface SparkOpenHouse {
  Date: string;       // "2025-04-18"
  StartTime: string;  // "11:00:00"
  EndTime: string;    // "14:00:00"
  Type?: string;      // "Public" | "Appointment Only" | etc.
}

export interface SparkPhoto {
  Id: string;
  Primary: boolean;
  UriThumb: string;
  Uri300: string;
  Uri640: string;
  Uri800: string;
  Uri1280: string;
  UriLarge: string;
}

export interface SparkStandardFields {
  ListingKey: string;
  ListingId: string;
  ListPrice: number;
  BedsTotal: number;
  BathsFull: number;
  BathsHalf: number | null;
  LivingArea: number | null;
  City: string;
  StreetNumber: string;
  StreetDirPrefix: string | null;
  StreetName: string;
  StreetSuffix: string | null;
  StreetDirSuffix: string | null;
  StateOrProvince: string;
  PostalCode: string;
  PropertySubType: string | null;
  MlsStatus: string;
  PublicRemarks: string | null;
  SupplementalRemarks: string | null;
  YearBuilt: number | null;
  LotSizeAcres: number | null;
  AssociationFee: number | null;
  GarageSpaces: number | null;
  ListingContractDate: string | null;
  StatusChangeTimestamp: string | null;
  ListOfficeName: string | null;
  ListAgentName: string | null;
  OnMarketDate?: string | null;
  Latitude: number | null;
  Longitude: number | null;
  SubdivisionName: string | null;
  BackOnMarketDate?: string | null;
  ModificationTimestamp?: string | null;
  CumulativeDaysOnMarket?: number | null;
  Photos?: SparkPhoto[];
  OpenHouses?: SparkOpenHouse[];
}

export interface SparkListing {
  Id: string;
  ResourceUri: string;
  StandardFields: SparkStandardFields;
}

const MLS_STATUS_MAP: Record<string, Property["status"]> = {
  // Sale statuses
  Active: "For Sale",
  "Active UCB": "Contingent",
  "Active Under Contract": "Contingent",
  Pending: "Pending",
  Closed: "Sold",
  "Coming Soon": "Coming Soon",
  // Rental statuses — should be filtered at API level (PropertyType Ne 'RN')
  // but mapped here as a safety net so they're never mislabeled "For Sale"
  "Active Lease": "For Rent",
  "Leased": "For Rent",
  "Rented": "For Rent",
};

/**
 * Convert ALL-CAPS street names from ARMLS to title case.
 * Keeps known abbreviations (N, S, E, W, Dr, St, Ave…) in their correct form.
 */
function titleCaseStreet(str: string | null | undefined): string | null {
  if (!str) return null;
  // Abbreviations that should stay as-is (case-insensitive match → fixed output)
  const ABBR: Record<string, string> = {
    n: "N", s: "S", e: "E", w: "W",
    ne: "NE", nw: "NW", se: "SE", sw: "SW",
    st: "St", ave: "Ave", dr: "Dr", blvd: "Blvd", ln: "Ln",
    ct: "Ct", pl: "Pl", way: "Way", rd: "Rd", cir: "Cir",
    pkwy: "Pkwy", hwy: "Hwy", fwy: "Fwy", expy: "Expy",
    trl: "Trl", trce: "Trce", pt: "Pt", cv: "Cv", pass: "Pass",
  };
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => ABBR[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Return null for Spark restricted fields that come back as "********" */
function num(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string" && val.startsWith("*")) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export function sparkToProperty(listing: SparkListing): Property {
  const f = listing.StandardFields;
  const address = [
    f.StreetNumber,
    titleCaseStreet(f.StreetDirPrefix),
    titleCaseStreet(f.StreetName),
    titleCaseStreet(f.StreetSuffix),
    titleCaseStreet(f.StreetDirSuffix),
  ]
    .filter(Boolean)
    .join(" ");

  const photos = (f.Photos ?? []).sort(
    (a, b) => (b.Primary ? 1 : 0) - (a.Primary ? 1 : 0)
  );

  const beds = num(f.BedsTotal);
  const bathsFull = num(f.BathsFull);
  const bathsHalf = num(f.BathsHalf);

  return {
    id: parseInt(listing.Id.slice(-8), 10) || 0,
    slug: listing.Id,
    sparkKey: listing.Id,
    address,
    city: `${f.City}, ${f.StateOrProvince} ${f.PostalCode}`,
    price: f.ListPrice,
    beds: beds ?? 0,
    baths: (bathsFull ?? 0) + (bathsHalf !== null && bathsHalf > 0 ? 0.5 : 0),
    sqft: num(f.LivingArea) ?? 0,
    type: f.PropertySubType ?? "Residential",
    status: MLS_STATUS_MAP[f.MlsStatus] ?? "For Sale",
    images: photos.map((p) => p.Uri1280 || p.Uri800), // high-res for detail page modal
    thumbnails: photos.map((p) => p.Uri640),          // optimized for listing cards
    description: [f.PublicRemarks, f.SupplementalRemarks].filter(Boolean).join("\r\n\r\n") || undefined,
    yearBuilt: num(f.YearBuilt) ?? undefined,
    lotSize: num(f.LotSizeAcres) ? `${f.LotSizeAcres} acres` : undefined,
    hoaDues: num(f.AssociationFee) ?? undefined,
    parking: num(f.GarageSpaces)
      ? `${Math.round(num(f.GarageSpaces)!)}-car garage`
      : undefined,
    mlsNumber: f.ListingId ?? undefined,
    listingDate: f.StatusChangeTimestamp ?? f.ListingContractDate ?? undefined,
    listOfficeName: f.ListOfficeName ?? undefined,
    listAgentName: f.ListAgentName ?? undefined,
    latitude: num(f.Latitude) ?? undefined,
    longitude: num(f.Longitude) ?? undefined,
    neighborhood: f.SubdivisionName ?? undefined,
    backOnMarketDate: f.BackOnMarketDate ?? undefined,
    modifiedAt: f.ModificationTimestamp ?? undefined,
    daysOnMarket: (() => {
      // Prefer OnMarketDate — represents when the listing actually went live to buyers.
      // Fall back to ListingContractDate if OnMarketDate is missing.
      const d = f.OnMarketDate ?? f.ListingContractDate;
      return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : undefined;
    })(),
    openHouses: f.OpenHouses
      ?.filter((oh) => oh.Type !== "Appointment Only")
      .map((oh) => ({ date: oh.Date, startTime: oh.StartTime, endTime: oh.EndTime })),
  };
}

/**
 * Secondary guard: catch any rental listings that slip past the API-level
 * PropertyType filter. Rental prices in AZ are virtually always under $15,000/mo,
 * while the cheapest AZ home sale is well above that.
 * Also reject listings whose status mapped to "For Rent".
 */
function isSaleListing(p: Property): boolean {
  if (p.status === "For Rent") return false;
  if (p.price > 0 && p.price < 15_000) return false;
  return true;
}

function sparkHeaders() {
  if (!TOKEN) throw new Error("SPARK_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
  };
}

/**
 * Count total listings matching a filter — uses a high _limit with no photo expansion
 * so the response is tiny. Spark replication API doesn't return TotalRows, so we
 * infer count from result length. Max _limit allowed by Spark replication API is 1,000.
 */
export async function countSparkListings(filter: string): Promise<number> {
  const COUNT_LIMIT = 1_000;
  const url = new URL(`${SPARK_BASE}/listings`);
  url.searchParams.set("_select", "ListingKey,ListPrice,MlsStatus");
  url.searchParams.set("_limit", String(COUNT_LIMIT));
  url.searchParams.set("_filter", filter);

  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return 0;

  const data = await res.json();
  const results: Array<{ StandardFields: { ListPrice: number; MlsStatus: string } }> =
    data?.D?.Results ?? [];

  // Apply same sale guard as the main fetch to keep counts consistent
  return results.filter((r) => {
    const price = r.StandardFields?.ListPrice ?? 0;
    const status = r.StandardFields?.MlsStatus ?? "";
    if (status === "Active Lease" || status === "Leased" || status === "Rented") return false;
    if (price > 0 && price < 15_000) return false;
    return true;
  }).length;
}

/** Fetch multiple listings with a SparkQL filter string */
export async function fetchSparkListings(
  filter: string,
  limit = 50,
  page = 1,
  orderby = "-ListingContractDate"
): Promise<{ listings: Property[]; total: number; totalPages: number }> {
  const url = new URL(`${SPARK_BASE}/listings`);
  url.searchParams.set("_expand", "Photos,OpenHouses");
  url.searchParams.set("_select", FIELDS);
  url.searchParams.set("_limit", String(limit));
  url.searchParams.set("_page", String(page));
  url.searchParams.set("_filter", filter);
  url.searchParams.set("_orderby", orderby);

  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    next: { revalidate: 120 }, // 2-minute server-side cache
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Spark API error:", res.status, text);
    return { listings: [], total: 0, totalPages: 0 };
  }

  const data = await res.json();
  const results: SparkListing[] = data?.D?.Results ?? [];
  const listings = results.map(sparkToProperty).filter(isSaleListing);

  // Spark replication API does not return D.Pagination.TotalRows — the API route
  // calls countSparkListings() in parallel to get the real total independently.
  return { listings, total: listings.length, totalPages: 0 };
}

// ── Spark accounts (ARMLS member roster) ────────────────────────────────────

export interface SparkAccount {
  Id: string;
  Name: string;
  FirstName: string | null;
  MiddleName: string | null;
  LastName: string | null;
  Office: string | null;
  OfficeId: string | null;
  LicenseNumber: string | null;
  Associations: string[];
  IdxParticipant: boolean;
  ModificationTimestamp: string | null;
  ShortId: string | null;
  Phones: Array<{ Name: string; Primary: boolean; Type: string; Number: string }>;
  Emails: Array<{ Name: string; Primary: boolean; Address: string }>;
}

const ACCOUNT_SELECT = [
  "Id", "Name", "FirstName", "MiddleName", "LastName",
  "Office", "OfficeId", "LicenseNumber", "Associations",
  "IdxParticipant", "ModificationTimestamp", "ShortId",
  "Phones", "Emails",
].join(",");

/**
 * Fetch one page of ARMLS member accounts from Spark /v1/accounts.
 * Filter is required — at minimum `UserType Eq 'Member'`.
 */
export async function fetchSparkAccounts(
  filter: string,
  page = 1,
  limit = 1000,
): Promise<SparkAccount[]> {
  const url = new URL(`${SPARK_BASE}/accounts`);
  url.searchParams.set("_filter", filter);
  url.searchParams.set("_select", ACCOUNT_SELECT);
  url.searchParams.set("_limit", String(limit));
  url.searchParams.set("_page", String(page));

  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Spark accounts fetch error: ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return (data?.D?.Results ?? []) as SparkAccount[];
}

/** Fetch a single listing by ListingKey */
export async function fetchSparkListing(
  key: string,
  opts?: { noCache?: boolean }
): Promise<Property | null> {
  const url = new URL(`${SPARK_BASE}/listings/${key}`);
  url.searchParams.set("_expand", "Photos,OpenHouses");
  url.searchParams.set("_select", FIELDS);

  const fetchInit = opts?.noCache
    ? { headers: sparkHeaders(), cache: "no-store" as const }
    : { headers: sparkHeaders(), next: { revalidate: 300 } };

  const res = await fetch(url.toString(), fetchInit);

  if (!res.ok) return null;

  const data = await res.json();
  const result: SparkListing | undefined = data?.D?.Results?.[0];
  if (!result) return null;

  return sparkToProperty(result);
}
