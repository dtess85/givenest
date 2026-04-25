/**
 * Sale-history endpoint for a single listing slug. Returns the full
 * Redfin-style timeline (current cycle + any prior cycles at the same
 * physical address) so the property detail page can render the table.
 *
 * Resolves the slug → Spark key the same way `/api/listings/[key]/route.ts`
 * does, so it accepts both `gpid-XXXXXXXX` short slugs and raw Spark keys.
 *
 * Manual listings (`manual-<uuid>`) return an empty history — they exist in
 * our database only and don't have a Spark history trail.
 */

import { NextResponse } from "next/server";
import { sparkHeaders } from "@/lib/spark";
import { getSparkKeyByShortId } from "@/lib/db/listings-index";
import { parsePublicSlug } from "@/lib/short-id";
import { getAddressSaleHistory } from "@/lib/spark-history";
import { getMaricopaValuations } from "@/lib/maricopa";

const SPARK_BASE = "https://replication.sparkapi.com/v1";

/** Minimal field fetch — we need StreetNumber/StreetName/City for the
 *  same-address lookup and ParcelNumber for the Maricopa tax-history call.
 *  Separate from `fetchSparkListing` so the history endpoint isn't paying
 *  the photo-array transfer cost. */
async function fetchHistoryFields(sparkKey: string): Promise<{
  streetNumber: string;
  streetName: string;
  city: string;
  parcelNumber: string | null;
  /** Current ListPrice — used to backfill the "Listed" event's price for
   *  brand-new listings whose history endpoint hasn't yet recorded a
   *  Price Changed event we can derive the original list price from. */
  listPrice: number | null;
} | null> {
  const url = new URL(`${SPARK_BASE}/listings/${sparkKey}`);
  url.searchParams.set(
    "_select",
    "StreetNumber,StreetName,City,ParcelNumber,ListPrice"
  );
  const res = await fetch(url.toString(), {
    headers: sparkHeaders(),
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    D?: {
      Results?: Array<{
        StandardFields?: {
          StreetNumber?: string;
          StreetName?: string;
          City?: string;
          ParcelNumber?: string;
          ListPrice?: number;
        };
      }>;
    };
  };
  const f = data?.D?.Results?.[0]?.StandardFields;
  if (!f?.StreetNumber || !f.StreetName || !f.City) return null;
  return {
    streetNumber: f.StreetNumber,
    streetName: f.StreetName,
    city: f.City,
    parcelNumber: f.ParcelNumber ?? null,
    listPrice: typeof f.ListPrice === "number" ? f.ListPrice : null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const slug = params.key;

    if (slug.startsWith("manual-")) {
      // Manual listings have no Spark history or parcel.
      return NextResponse.json({ cycles: [], taxHistory: [] });
    }

    const shortId = parsePublicSlug(slug);
    const sparkKey = shortId ? await getSparkKeyByShortId(shortId) : slug;
    if (!sparkKey) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const fields = await fetchHistoryFields(sparkKey);

    // Fetch sale-history cycles + tax valuations in parallel. Both are
    // independent (one hits Spark, one hits Maricopa) and the slowest-path
    // is what determines the response time, so don't sequentialise.
    const [cycles, taxHistory] = await Promise.all([
      getAddressSaleHistory(
        sparkKey,
        fields?.streetNumber ?? "",
        fields?.streetName ?? "",
        fields?.city ?? "",
        fields?.listPrice ?? undefined
      ),
      fields?.parcelNumber
        ? getMaricopaValuations(fields.parcelNumber).catch((err) => {
            console.error("[history] maricopa lookup failed:", err);
            return [];
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json(
      { cycles, taxHistory },
      { headers: { "Cache-Control": "public, max-age=600" } }
    );
  } catch (err) {
    console.error("Listing history API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
