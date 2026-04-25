/**
 * Property mutation endpoints. Auth = admin only.
 *
 *   PUT    /api/admin/properties/[propertyId] — partial update
 *   DELETE /api/admin/properties/[propertyId] — soft-terminate (status='terminated')
 *
 * We never hard-delete properties — service log + invoice rows reference
 * them for historical reporting. Setting status='terminated' hides them from
 * the active list and stops the monthly cron from billing them.
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { getPropertyById, updateProperty } from "@/lib/db/landlords";

export async function PUT(
  req: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getPropertyById(params.propertyId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const property = await updateProperty(params.propertyId, {
    address: typeof body.address === "string" ? body.address : undefined,
    city: typeof body.city === "string" ? body.city : undefined,
    state: typeof body.state === "string" ? body.state : undefined,
    zip: typeof body.zip === "string" || body.zip === null ? (body.zip as string | null) : undefined,
    mls_listing_key:
      typeof body.mls_listing_key === "string" || body.mls_listing_key === null
        ? (body.mls_listing_key as string | null)
        : undefined,
    management_started_at:
      typeof body.management_started_at === "string" || body.management_started_at === null
        ? (body.management_started_at as string | null)
        : undefined,
    monthly_management_fee_cents:
      typeof body.monthly_management_fee_cents === "number"
        ? body.monthly_management_fee_cents
        : undefined,
    status:
      body.status === "active" || body.status === "paused" || body.status === "terminated"
        ? body.status
        : undefined,
  });
  return NextResponse.json({ property });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await updateProperty(params.propertyId, { status: "terminated" });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ property });
}
