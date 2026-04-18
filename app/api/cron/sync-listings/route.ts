export const maxDuration = 300; // 5 min — full sync takes ~70s, well within Pro limit

/**
 * Spark → Supabase listings sync
 *
 * Normal run (every 15 min via Vercel Cron):
 *   Fetches listings modified in the last 90 minutes and upserts them.
 *   The 90-min lookback means up to 5 consecutive sync failures can occur
 *   before any data is actually missed.
 *
 * Full sync (manual bootstrap or recovery):
 *   GET /api/cron/sync-listings?full=1
 *   Paginates through ALL active AZ listings (may take 30–90 s for 40k+ rows).
 *
 * Protected by CRON_SECRET env var. Vercel sets Authorization: Bearer <secret>
 * automatically for scheduled calls. For manual triggers, pass the same header.
 */

import { NextResponse } from "next/server";
import { upsertListings, assignMissingShortIds, type ListingUpsertData } from "@/lib/db/listings-index";

const SPARK_BASE = "https://replication.sparkapi.com/v1";
const TOKEN = process.env.SPARK_API_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

// Minimal field set — no photos/open houses needed for the address index
const SYNC_FIELDS = [
  "ListingKey",
  "ListingId",
  "ListPrice",
  "BedsTotal",
  "BathsFull",
  "BathsHalf",
  "StreetNumber",
  "StreetDirPrefix",
  "StreetName",
  "StreetSuffix",
  "StreetDirSuffix",
  "City",
  "StateOrProvince",
  "PostalCode",
  "PropertySubType",
  "MlsStatus",
  "SubdivisionName",
  "ListAgentName",
  "ListOfficeName",
  "ModificationTimestamp",
].join(",");

const MLS_STATUS_MAP: Record<string, string> = {
  Active: "For Sale",
  "Active UCB": "Contingent",
  "Active Under Contract": "Contingent",
  Pending: "Pending",
  Closed: "Sold",
  "Coming Soon": "Coming Soon",
  "Active Lease": "For Rent",
  Leased: "For Rent",
  Rented: "For Rent",
};

function sparkHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
  };
}

interface SparkSyncListing {
  Id: string;
  StandardFields: {
    ListingKey: string;
    ListingId: string;
    ListPrice: number | string;
    BedsTotal: number | string;
    BathsFull: number | string;
    BathsHalf: number | string | null;
    StreetNumber: string;
    StreetDirPrefix: string | null;
    StreetName: string;
    StreetSuffix: string | null;
    StreetDirSuffix: string | null;
    City: string;
    StateOrProvince: string;
    PostalCode: string;
    PropertySubType: string | null;
    MlsStatus: string;
    SubdivisionName: string | null;
    ListAgentName: string | null;
    ListOfficeName: string | null;
    ModificationTimestamp: string | null;
  };
}

/** Return null for Spark restricted fields that come back as "********" */
function num(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string" && val.startsWith("*")) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function titleCase(str: string | null | undefined): string | null {
  if (!str) return null;
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toUpsertData(listing: SparkSyncListing): ListingUpsertData | null {
  const f = listing.StandardFields;

  // Drop rentals and sub-$15k (same guard as main buy page)
  if (f.MlsStatus === "Active Lease" || f.MlsStatus === "Leased" || f.MlsStatus === "Rented") return null;
  const price = num(f.ListPrice);
  if (price !== null && price > 0 && price < 15_000) return null;

  const streetDirPrefix = titleCase(f.StreetDirPrefix);
  const streetName = titleCase(f.StreetName);
  const streetSuffix = titleCase(f.StreetSuffix);
  const streetDirSuffix = titleCase(f.StreetDirSuffix);
  const address = [f.StreetNumber, streetDirPrefix, streetName, streetSuffix, streetDirSuffix]
    .filter(Boolean)
    .join(" ");

  const bathsFull = num(f.BathsFull) ?? 0;
  const bathsHalf = num(f.BathsHalf) ?? 0;

  return {
    spark_listing_key: listing.Id,
    mls_number: f.ListingId || null,
    address,
    street_number: f.StreetNumber || null,
    street_name: streetName,
    city: f.City || null,
    state: f.StateOrProvince || "AZ",
    zip: f.PostalCode || null,
    price,
    beds: num(f.BedsTotal),
    baths: bathsFull + (bathsHalf > 0 ? 0.5 : 0) || null,
    neighborhood: f.SubdivisionName || null,
    agent_name: f.ListAgentName || null,
    list_office_name: f.ListOfficeName || null,
    status: MLS_STATUS_MAP[f.MlsStatus] ?? "For Sale",
    mls_status: f.MlsStatus || null,
    modified_at: f.ModificationTimestamp || null,
  };
}

/** Fetch one page of listings from Spark */
async function fetchPage(filter: string, page: number, limit = 1000) {
  const url = new URL(`${SPARK_BASE}/listings`);
  url.searchParams.set("_select", SYNC_FIELDS);
  url.searchParams.set("_filter", filter);
  url.searchParams.set("_limit", String(limit));
  url.searchParams.set("_page", String(page));
  url.searchParams.set("_orderby", "ModificationTimestamp");

  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Spark sync fetch error: ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return (data?.D?.Results ?? []) as SparkSyncListing[];
}

// PropertyType whitelist: A=Residential, Q=Manufactured/Mobile, L=Lot/Land (excludes RN=Rental)
// MlsStatus whitelist: only active/pending — avoids fetching entire sold history
const BASE_FILTER =
  "StateOrProvince Eq 'AZ' And (PropertyType Eq 'A' Or PropertyType Eq 'Q' Or PropertyType Eq 'L') And (MlsStatus Eq 'Active' Or MlsStatus Eq 'Active UCB' Or MlsStatus Eq 'Coming Soon' Or MlsStatus Eq 'Pending')";

export async function GET(request: Request) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!TOKEN) {
    return NextResponse.json({ error: "SPARK_API_TOKEN not set" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const isFull = searchParams.get("full") === "1";

  const start = Date.now();
  let totalFetched = 0;
  let totalUpserted = 0;

  try {
  if (isFull) {
    // ── Full sync: paginate through all active AZ listings ─────────────────
    let page = 1;
    while (true) {
      const listings = await fetchPage(BASE_FILTER, page);
      if (listings.length === 0) break;

      const rows = listings.map(toUpsertData).filter((r): r is ListingUpsertData => r !== null);
      totalFetched += listings.length;

      if (rows.length > 0) {
        await upsertListings(rows);
        totalUpserted += rows.length;
      }

      // Spark replication API max page size is 1000 — if we got < 1000, we're done
      if (listings.length < 1000) break;
      page++;
    }
  } else {
    // ── Incremental sync: last 90 minutes of changes ───────────────────────
    // Wide window = resilient to missed crons. Since upsert is idempotent on
    // spark_listing_key, re-processing the same rows costs nothing.
    const windowMs = 90 * 60 * 1000;
    const since = new Date(Date.now() - windowMs).toISOString().replace(/\.\d{3}/, "");
    const filter = `${BASE_FILTER} And ModificationTimestamp Gt '${since}'`;

    // Paginate — a 90-min window with heavy MLS churn can exceed one page
    let page = 1;
    while (true) {
      const listings = await fetchPage(filter, page);
      if (listings.length === 0) break;

      const rows = listings.map(toUpsertData).filter((r): r is ListingUpsertData => r !== null);
      totalFetched += listings.length;

      if (rows.length > 0) {
        await upsertListings(rows);
        totalUpserted += rows.length;
      }

      if (listings.length < 1000) break;
      page++;
    }
  }

  // Assign short_ids to any newly-inserted rows (drains rows missing one).
  let shortIdsAssigned = 0;
  while (true) {
    const n = await assignMissingShortIds(1000);
    if (n === 0) break;
    shortIdsAssigned += n;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Listings sync (${isFull ? "full" : "incremental"}): fetched=${totalFetched} upserted=${totalUpserted} shortIds=${shortIdsAssigned} in ${elapsed}s`);

  return NextResponse.json({
    mode: isFull ? "full" : "incremental",
    fetched: totalFetched,
    upserted: totalUpserted,
    shortIdsAssigned,
    elapsedSeconds: parseFloat(elapsed),
  });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Sync error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
