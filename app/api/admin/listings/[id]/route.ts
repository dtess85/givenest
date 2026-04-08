import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getManualListingById, updateManualListing, deleteManualListing } from "@/lib/db/listings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await getManualListingById(id);
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();

    // Coerce numeric fields when present
    const data = {
      ...body,
      ...(body.price != null ? { price: Number(body.price) } : {}),
      ...(body.beds != null ? { beds: Number(body.beds) } : {}),
      ...(body.baths != null ? { baths: Number(body.baths) } : {}),
      ...(body.sqft != null ? { sqft: Number(body.sqft) } : {}),
      ...(body.year_built != null ? { year_built: Number(body.year_built) } : {}),
      ...(body.hoa_dues != null ? { hoa_dues: Number(body.hoa_dues) } : {}),
      ...(body.garage_spaces != null ? { garage_spaces: Number(body.garage_spaces) } : {}),
      ...(body.latitude != null ? { latitude: Number(body.latitude) } : {}),
      ...(body.longitude != null ? { longitude: Number(body.longitude) } : {}),
      ...(body.sort_priority != null ? { sort_priority: Number(body.sort_priority) } : {}),
    };

    const listing = await updateManualListing(id, data);
    return NextResponse.json({ listing });
  } catch (err) {
    console.error("Update manual listing error:", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

/** PATCH for partial updates like toggling is_active */
export async function PATCH(request: Request, { params }: Params) {
  return PUT(request, { params });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteManualListing(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete manual listing error:", err);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
