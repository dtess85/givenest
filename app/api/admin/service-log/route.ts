/**
 * POST /api/admin/service-log
 *
 * Admin records a single service event (landscaping, cleaning, pest control,
 * etc.) on a property. The monthly cron later rolls these up into a Stripe
 * invoice for the landlord.
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import {
  createServiceLog,
  getPropertyById,
  type ServiceKind,
} from "@/lib/db/landlords";

const SERVICE_KINDS: ServiceKind[] = [
  "landscaping",
  "cleaning",
  "pest_control",
  "maintenance",
  "utilities",
  "other",
];

export async function POST(req: Request) {
  let admin;
  try {
    admin = await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    property_id?: string;
    service_kind?: string;
    vendor?: string;
    description?: string;
    performed_at?: string;
    amount_dollars?: number; // form-friendly; we convert to cents
    amount_cents?: number;
    tenant_chargeback?: boolean;
    notes?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.property_id) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 });
  }
  if (!body.service_kind || !SERVICE_KINDS.includes(body.service_kind as ServiceKind)) {
    return NextResponse.json({ error: "invalid service_kind" }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (!body.performed_at) {
    return NextResponse.json({ error: "performed_at is required" }, { status: 400 });
  }

  // Accept either dollars (UI-friendly) or cents (API-correct). The form
  // submits dollars to keep the input field readable.
  let amountCents: number;
  if (typeof body.amount_cents === "number") {
    amountCents = Math.round(body.amount_cents);
  } else if (typeof body.amount_dollars === "number") {
    amountCents = Math.round(body.amount_dollars * 100);
  } else {
    return NextResponse.json(
      { error: "amount_dollars or amount_cents required" },
      { status: 400 }
    );
  }
  if (amountCents <= 0) {
    return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
  }

  // Confirm the property exists before inserting (we don't fail loud on
  // FK errors — surface a clean 404 instead).
  const property = await getPropertyById(body.property_id);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const entry = await createServiceLog({
    property_id: body.property_id,
    service_kind: body.service_kind as ServiceKind,
    vendor: body.vendor?.trim() || null,
    description: body.description.trim(),
    performed_at: body.performed_at,
    amount_cents: amountCents,
    tenant_chargeback: !!body.tenant_chargeback,
    notes: body.notes?.trim() || null,
    created_by: admin.userId,
  });
  return NextResponse.json({ entry });
}
