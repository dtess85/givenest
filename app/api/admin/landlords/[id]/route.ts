/**
 * GET/PUT /api/admin/landlords/[id]
 *
 * Admin-side read + update for a single landlord. The landlord detail page
 * uses PUT to save profile/comm-prefs edits without a full page reload.
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import {
  getLandlordById,
  updateLandlord,
  type CommPrefs,
  type MailingAddress,
} from "@/lib/db/landlords";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const landlord = await getLandlordById(params.id);
  if (!landlord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ landlord });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    phone?: string | null;
    mailing_address?: MailingAddress | null;
    comm_prefs?: CommPrefs;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const landlord = await updateLandlord(params.id, {
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    phone:
      body.phone === undefined ? undefined : body.phone === null ? null : body.phone.trim(),
    mailing_address:
      body.mailing_address === undefined ? undefined : body.mailing_address,
    comm_prefs: body.comm_prefs,
  });
  if (!landlord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ landlord });
}
