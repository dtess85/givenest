/**
 * POST /api/admin/landlords/[id]/properties
 *
 * Create a property under a landlord. Property edits/deletes go through
 * `/api/admin/properties/[propertyId]` so the URL only carries the property
 * id (we don't need the landlord id once the row exists — `owner_id` on
 * the row is the source of truth).
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createProperty, getLandlordById } from "@/lib/db/landlords";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const landlord = await getLandlordById(params.id);
  if (!landlord) {
    return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    mls_listing_key?: string;
    management_started_at?: string;
    monthly_management_fee_cents?: number;
  } | null;
  if (!body || !body.address?.trim() || !body.city?.trim()) {
    return NextResponse.json(
      { error: "address and city are required" },
      { status: 400 }
    );
  }

  try {
    const property = await createProperty({
      owner_id: landlord.id,
      address: body.address.trim(),
      city: body.city.trim(),
      state: body.state?.trim() || "AZ",
      zip: body.zip?.trim() || null,
      mls_listing_key: body.mls_listing_key?.trim() || null,
      management_started_at: body.management_started_at || null,
      monthly_management_fee_cents:
        typeof body.monthly_management_fee_cents === "number"
          ? body.monthly_management_fee_cents
          : 0,
    });
    return NextResponse.json({ property });
  } catch (err) {
    // Most likely a UNIQUE (owner_id, address) violation.
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
