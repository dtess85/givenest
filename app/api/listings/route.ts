import { NextResponse } from "next/server";
import { queryListings } from "@/lib/listings/query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await queryListings(searchParams);
    return NextResponse.json(result, {
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
