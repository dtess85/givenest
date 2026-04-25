/**
 * Sale-history fetcher built on top of Spark's `/listings/{key}/history`
 * endpoint plus a same-address lookup. Together they give us enough events
 * to reconstruct Redfin-style listing-history tables grouped by ARMLS#.
 *
 * Strategy:
 *   1. Find every Spark listing at the given address (current + prior cycles).
 *   2. Fetch the history endpoint for each — it returns FieldChange events
 *      (ListPrice, MlsStatus) and lifecycle events (NewListing).
 *   3. Map each event onto a Redfin-style row: { date, event, price }.
 *   4. Group by ARMLS#, sort each group newest-first, sort groups by their
 *      most-recent event newest-first.
 *
 * Tax history is NOT covered — Spark doesn't expose assessor data. That's a
 * separate ATTOM/Estated integration if/when we want it.
 */

import { sparkHeaders } from "./spark";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

export type HistoryEventKind =
  | "Listed"
  | "Price Changed"
  | "Pending"
  | "Contingent"
  | "Sold"
  | "Closed"
  | "Withdrawn"
  | "Expired"
  | "Off Market"
  | "Active"
  | "Coming Soon"
  | "Other";

export interface HistoryEvent {
  /** ISO timestamp from Spark. */
  date: string;
  /** Human-readable event label, normalized for display ("Price Changed",
   *  "Sold", etc.). */
  event: HistoryEventKind;
  /** Price at this event in dollars, or null if Spark masked the field
   *  ("********") because the row is in a state where price isn't shown
   *  (rare for sold/active homes; common for off-market/withdrawn). */
  price: number | null;
  /** Only set for FieldChange ListPrice events — the price before the change.
   *  Used to render "down from $X" hints on the row. */
  previousPrice?: number;
}

export interface HistoryCycle {
  /** ARMLS#/MLS#. The display table groups rows by this so multiple list
   *  cycles appear as separate sections like Redfin's UI. */
  mlsNumber: string;
  /** The Spark listing id this cycle came from — useful for debugging. */
  sparkKey: string;
  /** Events in this cycle, newest first. */
  events: HistoryEvent[];
}

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

const SPARK_BASE = "https://replication.sparkapi.com/v1";

interface SparkHistoryEvent {
  Event: string;                  // "FieldChange" | "NewListing" | …
  Field: string | null;           // "ListPrice" | "MlsStatus" | null
  NewValue: string | null;
  PreviousValue: string | null;
  ModificationTimestamp: string;
  PriceAtEvent: number | string | null; // number, "********", or null
  Listing?: {
    StandardFields?: { ListingId?: string };
  };
}

interface SparkHistoryResponse {
  D?: { Results?: SparkHistoryEvent[]; Success?: boolean };
}

interface SparkAddressMatch {
  Id: string; // Spark listing key
  StandardFields?: {
    ListingId?: string;
    ListingContractDate?: string | null;
  };
}

interface SparkAddressResponse {
  D?: { Results?: SparkAddressMatch[]; Success?: boolean };
}

/** "********" → null, else the numeric value. Spark masks PriceAtEvent for
 *  some event types; we treat those as "no price column" rather than 0. */
function unmaskPrice(v: number | string | null | undefined): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "********") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Map a Spark history event to our display shape. Returns null if the event
 *  isn't worth showing (e.g. internal MlsStatusInformation flips). */
function mapEvent(e: SparkHistoryEvent): HistoryEvent | null {
  const date = e.ModificationTimestamp;
  const price = unmaskPrice(e.PriceAtEvent);

  if (e.Event === "NewListing") {
    return { date, event: "Listed", price };
  }

  if (e.Event === "FieldChange" && e.Field === "ListPrice") {
    const previousPrice = e.PreviousValue ? Number(e.PreviousValue) : undefined;
    return {
      date,
      event: "Price Changed",
      price: e.NewValue ? Number(e.NewValue) : price,
      previousPrice: Number.isFinite(previousPrice) ? previousPrice : undefined,
    };
  }

  if (e.Event === "FieldChange" && e.Field === "MlsStatus") {
    const status = (e.NewValue ?? "").trim();
    if (!status) return null;
    const KIND_BY_STATUS: Record<string, HistoryEventKind> = {
      "Active": "Active",
      "Active UCB": "Contingent",
      "Active Under Contract": "Contingent",
      "Pending": "Pending",
      "Closed": "Sold",
      "Sold": "Sold",
      "Withdrawn": "Withdrawn",
      "Cancelled": "Withdrawn",
      "Canceled": "Withdrawn",
      "Expired": "Expired",
      "Temp Off Market": "Off Market",
      "Coming Soon": "Coming Soon",
    };
    const kind = KIND_BY_STATUS[status] ?? "Other";
    if (kind === "Other") return null; // skip unknown intermediate states
    return { date, event: kind, price };
  }

  // Internal-only field changes (e.g. MlsStatusInformation, PhotoCount).
  return null;
}

/* -------------------------------------------------------------------------- */
/* Spark calls                                                                */
/* -------------------------------------------------------------------------- */

/** Fetch the full history for a single listing key. */
async function fetchOneListingHistory(
  sparkKey: string
): Promise<SparkHistoryEvent[]> {
  const url = new URL(`${SPARK_BASE}/listings/${sparkKey}/history`);
  url.searchParams.set("_limit", "100");
  url.searchParams.set(
    "_select",
    "Event,Field,NewValue,PreviousValue,ModificationTimestamp,PriceAtEvent,Listing.StandardFields.ListingId"
  );
  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    next: { revalidate: 600 }, // 10-minute cache — history changes rarely
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SparkHistoryResponse;
  return data?.D?.Results ?? [];
}

/** Find every Spark listing at the same physical address. Used so the
 *  history table includes prior cycles (e.g. the 2011-2012 sale of a home
 *  that's now relisted in 2026 under a different ARMLS#).
 *
 *  Spark's filter language doesn't support a clean address-equality query,
 *  so we approximate with StreetNumber + StreetName (case-sensitive).
 *  This will over-match in the rare case of a duplicate house number on a
 *  street with the same name in a different city — acceptable for now.
 *  Filter by city as a tie-breaker to keep precision high. */
async function findListingsAtAddress(
  streetNumber: string,
  streetName: string,
  city: string
): Promise<SparkAddressMatch[]> {
  // SparkQL string equality: 'value'. No escape support, so reject anything
  // weird up front.
  if (
    /['\\\\\n\r]/.test(streetNumber) ||
    /['\\\\\n\r]/.test(streetName) ||
    /['\\\\\n\r]/.test(city)
  ) {
    return [];
  }
  const filter =
    `StreetNumber Eq '${streetNumber}'` +
    ` And StreetName Eq '${streetName}'` +
    ` And City Eq '${city}'`;
  const url = new URL(`${SPARK_BASE}/listings`);
  url.searchParams.set("_filter", filter);
  url.searchParams.set("_limit", "20");
  url.searchParams.set("_select", "ListingId,ListingContractDate");
  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    next: { revalidate: 600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SparkAddressResponse;
  return data?.D?.Results ?? [];
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Build the full sale-history table for a listing. Includes the current
 * cycle plus any prior cycles at the same address. Cycles are returned
 * newest-first; events within a cycle are also newest-first.
 *
 * Returns an empty array on any Spark failure rather than throwing — the
 * UI degrades to "no history available" instead of breaking the page.
 */
export async function getAddressSaleHistory(
  sparkKey: string,
  streetNumber: string,
  streetName: string,
  city: string
): Promise<HistoryCycle[]> {
  // Find every cycle at this address. We always include the requested key,
  // even if the lookup fails or doesn't list it (defensive belt-and-suspenders
  // for the common single-cycle case).
  let matches: SparkAddressMatch[] = [];
  try {
    matches = await findListingsAtAddress(streetNumber, streetName, city);
  } catch {
    matches = [];
  }
  const keys = new Set<string>([sparkKey, ...matches.map((m) => m.Id)]);

  // Fetch each cycle's history in parallel.
  const cycles = await Promise.all(
    Array.from(keys).map(async (key): Promise<HistoryCycle | null> => {
      const events = await fetchOneListingHistory(key);
      if (events.length === 0) return null;
      const mapped = events
        .map(mapEvent)
        .filter((e): e is HistoryEvent => e !== null)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));
      const mlsNumber =
        events.find((e) => e.Listing?.StandardFields?.ListingId)?.Listing
          ?.StandardFields?.ListingId ?? key;
      return { mlsNumber, sparkKey: key, events: mapped };
    })
  );

  return cycles
    .filter((c): c is HistoryCycle => c !== null && c.events.length > 0)
    .sort((a, b) => {
      // Sort cycles by their most-recent event newest-first.
      const aMax = a.events[0]?.date ?? "";
      const bMax = b.events[0]?.date ?? "";
      return bMax.localeCompare(aMax);
    });
}
