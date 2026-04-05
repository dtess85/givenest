import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db/index";



export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;

  if (event.type === "checkout.session.completed") {
    const s = session as Stripe.Checkout.Session;
    const charityId = s.metadata?.charity_id;
    const subscriptionId = s.subscription as string;
    if (charityId) {
      await sql`
        UPDATE charities SET
          stripe_subscription_id = ${subscriptionId},
          subscription_status = 'active',
          is_partner = true,
          updated_at = NOW()
        WHERE id = ${charityId}
      `;
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = session as Stripe.Subscription;
    await sql`
      UPDATE charities SET
        subscription_status = ${sub.status},
        is_partner = ${sub.status === "active"},
        updated_at = NOW()
      WHERE stripe_subscription_id = ${sub.id}
    `;
  }

  return NextResponse.json({ received: true });
}
