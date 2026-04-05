import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCharityByClerkUserId } from "@/lib/db/charities";



export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charity = await getCharityByClerkUserId(userId);
  if (!charity?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: charity.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://givenest.com"}/charity/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
