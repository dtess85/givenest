/**
 * GET/PUT /api/landlord/profile
 *
 * Self-serve profile + comm-prefs editor for the signed-in landlord. The
 * `requireLandlordForApi()` gate ensures the request maps to a `landlords`
 * row before we let the update through, so a user can only mutate their
 * own row regardless of what id they try to pass.
 */

import { NextResponse } from "next/server";
import { requireLandlordForApi } from "@/lib/auth/require-landlord";
import { updateLandlord, type CommPrefs, type MailingAddress } from "@/lib/db/landlords";

export async function GET() {
  try {
    const { landlord } = await requireLandlordForApi();
    return NextResponse.json({ landlord });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}

export async function PUT(req: Request) {
  let landlordId: string;
  try {
    const session = await requireLandlordForApi();
    landlordId = session.landlord.id;
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Unauthorized" }, { status });
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

  const landlord = await updateLandlord(landlordId, {
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    phone:
      body.phone === undefined ? undefined : body.phone === null ? null : body.phone.trim(),
    mailing_address: body.mailing_address === undefined ? undefined : body.mailing_address,
    comm_prefs: body.comm_prefs,
  });
  return NextResponse.json({ landlord });
}
