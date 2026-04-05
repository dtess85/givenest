import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCharityByClerkUserId, updateCharity } from "@/lib/db/charities";



export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charity = await getCharityByClerkUserId(userId);
  if (!charity) return NextResponse.json({ error: "No charity linked" }, { status: 404 });

  let customerId = charity.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ name: charity.name, metadata: { charity_id: charity.id } });
    customerId = customer.id;
    await updateCharity(charity.id, { stripe_customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Givenest Partner Profile", description: "Monthly partner profile on givenest.com" },
          unit_amount: 4900,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://givenest.com"}/charity/dashboard?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://givenest.com"}/charity/dashboard/billing`,
    metadata: { charity_id: charity.id },
  });

  return NextResponse.json({ url: session.url });
}
