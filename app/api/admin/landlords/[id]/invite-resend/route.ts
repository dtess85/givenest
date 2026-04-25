/**
 * POST /api/admin/landlords/[id]/invite-resend
 *
 * Re-issues the Supabase magic-link invite for an existing landlord. Used
 * when the original invite expired or got lost — does not create a new row.
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLandlordById } from "@/lib/db/landlords";

export async function POST(
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

  try {
    const supabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://givenest.com";
    await supabase.auth.admin.inviteUserByEmail(landlord.email, {
      redirectTo: `${siteUrl}/landlord/dashboard`,
      data: { role: "landlord", landlord_id: landlord.id },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
