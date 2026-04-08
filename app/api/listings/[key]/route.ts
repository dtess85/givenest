import { NextResponse } from "next/server";
import { fetchSparkListing } from "@/lib/spark";
import { getManualListingById, manualListingToProperty } from "@/lib/db/listings";


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
        const live = await fetchSparkListing(row.spark_listing_key);
        if (live) {
          return NextResponse.json({ listing: live }, {
            headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
          });
        }
      }
      return NextResponse.json({ listing: manualListingToProperty(row) }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Spark listing key
    const listing = await fetchSparkListing(key);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ listing }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err) {
    console.error("Listing detail API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}
