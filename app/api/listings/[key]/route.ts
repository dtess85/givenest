import { NextResponse } from "next/server";
import { fetchSparkListing } from "@/lib/spark";
import { getManualListingById, manualListingToProperty } from "@/lib/db/listings";
import { pool } from "@/lib/db";

async function getDescriptionOverride(sparkKey: string): Promise<string | null> {
  try {
    const r = await pool.query(
      "SELECT description_override FROM listings WHERE spark_listing_key = $1 LIMIT 1",
      [sparkKey]
    );
    return r.rows[0]?.description_override ?? null;
  } catch {
    return null;
  }
}


export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;

    // Manual listing slugs: "manual-{uuid}"
    if (key.startsWith("manual-")) {
      const id = key.slice("manual-".length);
      const row = await getManualListingById(id);
      if (!row) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
      // If a Spark listing key has been linked (e.g. once the listing goes Active),
      // serve live data from Spark so the URL stays the same after Coming Soon ends.
      if (row.spark_listing_key) {
        const live = await fetchSparkListing(row.spark_listing_key, { noCache: true });
        if (live) {
          return NextResponse.json(
            { listing: live, fetchedAt: new Date().toISOString() },
            { headers: { "Cache-Control": "no-store" } }
          );
        }
      }
      return NextResponse.json(
        { listing: manualListingToProperty(row), fetchedAt: new Date().toISOString() },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Spark listing key — always fetch live so detail page shows real-time data
    const [listing, descOverride] = await Promise.all([
      fetchSparkListing(key, { noCache: true }),
      getDescriptionOverride(key),
    ]);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (descOverride) listing.description = descOverride;
    return NextResponse.json(
      { listing, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Listing detail API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}
