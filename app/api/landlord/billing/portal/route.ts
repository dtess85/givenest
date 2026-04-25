/**
 * POST /api/landlord/billing/portal
 *
 * Returns a Stripe Customer Portal URL the landlord can use to update
 * their saved card, view receipts, or download invoice PDFs. Stripe hosts
 * the entire experience — we only mint the session and redirect.
 *
 * Requires the landlord to have a `stripe_customer_id` on file. If they
 * land here without one (rare — they'd typically hit "Add a card" first),
 * we surface a 400 the UI can explain.
 */

import { NextResponse } from "next/server";
import { requireLandlordForApi } from "@/lib/auth/require-landlord";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  let session;
  try {
    session = await requireLandlordForApi();
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
  const { landlord } = session;

  if (!landlord.stripe_customer_id) {
    return NextResponse.json(
      { error: "No payment method on file yet — add a card first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://givenest.com";
  const portal = await stripe.billingPortal.sessions.create({
    customer: landlord.stripe_customer_id,
    return_url: `${siteUrl}/landlord/dashboard/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
