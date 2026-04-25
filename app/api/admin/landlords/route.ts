/**
 * POST /api/admin/landlords
 *
 * Creates a `landlords` row and triggers a Supabase magic-link invite via
 * the service-role admin client. The landlord clicks the email link, lands
 * on /landlord/dashboard, and `requireLandlord()` binds `auth_user_id` to
 * the freshly-created auth.users row by case-insensitive email match.
 *
 * Idempotency: if a landlord with the same email already exists, return it
 * instead of inserting a duplicate. Re-sending the invite is a separate
 * endpoint (`/api/admin/landlords/[id]/invite-resend`).
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLandlord, getLandlordByEmail, type MailingAddress } from "@/lib/db/landlords";
import { sendInviteWelcome } from "@/lib/email/landlord";

interface CreateBody {
  email?: string;
  name?: string;
  phone?: string;
  mailing_address?: MailingAddress;
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  if (!email || !name) {
    return NextResponse.json(
      { error: "email and name are required" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  // Idempotent: if the landlord row already exists, reuse it. Surfaces
  // "already invited" to the admin UI without creating dupes on double-click.
  const existing = await getLandlordByEmail(email);
  const landlord = existing
    ? existing
    : await createLandlord({
        email,
        name,
        phone: body.phone?.trim() || null,
        mailing_address: body.mailing_address ?? null,
        invited_by: admin.userId,
      });

  // Send the Supabase magic-link invite. Doesn't throw if the auth.users row
  // already exists — Supabase will resend the email. The redirect lands the
  // user on /landlord/dashboard; middleware ensures they're auth'd, then
  // requireLandlord() binds the auth_user_id.
  let inviteError: string | null = null;
  try {
    const supabase = createAdminClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://givenest.com";
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/landlord/dashboard`,
      data: { role: "landlord", landlord_id: landlord.id },
    });
    // Side-channel branded welcome — Supabase's email is bare-bones and the
    // Givenest welcome explains what to expect on first login. Fire-and-
    // forget; failures here don't roll back the invite.
    void sendInviteWelcome(landlord);
  } catch (err) {
    // Don't roll back the landlord row — admin can resend the invite.
    inviteError = err instanceof Error ? err.message : String(err);
    console.error("[admin/landlords] invite failed:", err);
  }

  return NextResponse.json({
    landlord,
    invited: !inviteError,
    invite_error: inviteError,
    reused_existing: !!existing,
  });
}
