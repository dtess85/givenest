/**
 * POST /api/landlord/billing/checkout
 *
 * Creates a Stripe Checkout session in `mode: 'setup'` so the landlord can
 * save a card for future off-session charges. We intentionally do NOT use
 * `mode: 'subscription'` — Givenest's billing model is variable monthly
 * invoices (built from service log + management fee), not a fixed
 * recurring price.
 *
 * Idempotency: if the landlord already has a `stripe_customer_id`, reuse
 * it. Stripe Customers cost nothing to keep around, but creating a fresh
 * one on every retry would split the saved-card history.
 *
 * The `setup_intent_data.metadata.landlord_id` lets the webhook (which
 * gets fired on `setup_intent.succeeded` and `checkout.session.completed`
 * for setup-mode sessions) link the saved card back to our row.
 */

import { NextResponse } from "next/server";
import { requireLandlordForApi } from "@/lib/auth/require-landlord";
import { setLandlordBilling } from "@/lib/db/landlords";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  let session;
  try {
    session = await requireLandlordForApi();
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
  const { landlord, user } = session;

  const stripe = getStripe();

  // Reuse the existing customer when we already have one. Otherwise mint a
  // fresh customer + persist the id BEFORE handing the user off to Stripe —
  // if they bail before completing the session we still know their customer
  // id on next retry, no orphan customers.
  let customerId = landlord.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: landlord.email,
      name: landlord.name,
      phone: landlord.phone ?? undefined,
      metadata: { landlord_id: landlord.id, role: "landlord" },
    });
    customerId = customer.id;
    await setLandlordBilling(landlord.id, { stripe_customer_id: customerId });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://givenest.com";
  const checkout = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card", "us_bank_account"],
    setup_intent_data: {
      metadata: { landlord_id: landlord.id, role: "landlord" },
    },
    // `client_reference_id` is also a metadata-disambiguation channel —
    // belt-and-suspenders so the webhook can route correctly even if the
    // setup_intent metadata is dropped by an older API version.
    client_reference_id: `landlord:${landlord.id}`,
    success_url: `${siteUrl}/landlord/dashboard/billing?setup=success`,
    cancel_url: `${siteUrl}/landlord/dashboard/billing?setup=cancelled`,
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "Stripe didn't return a Checkout URL" }, { status: 500 });
  }
  return NextResponse.json({ url: checkout.url, user_id: user.id });
}
