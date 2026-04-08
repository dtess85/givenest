import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAllManualListings, createManualListing } from "@/lib/db/listings";

export async function GET() {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await getAllManualListings();
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.address || body.price == null) {
      return NextResponse.json({ error: "address and price are required" }, { status: 400 });
    }

    // Coerce numeric fields
    const data = {
      ...body,
      price: Number(body.price),
      beds: body.beds != null ? Number(body.beds) : null,
      baths: body.baths != null ? Number(body.baths) : null,
      sqft: body.sqft != null ? Number(body.sqft) : null,
      year_built: body.year_built != null ? Number(body.year_built) : null,
      hoa_dues: body.hoa_dues != null ? Number(body.hoa_dues) : null,
      garage_spaces: body.garage_spaces != null ? Number(body.garage_spaces) : null,
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      sort_priority: body.sort_priority != null ? Number(body.sort_priority) : 0,
      is_active: body.is_active !== false,
    };

    const listing = await createManualListing(data);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    console.error("Create manual listing error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
