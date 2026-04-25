/**
 * Monthly invoice cron. Schedule (in vercel.json): `0 5 1 * *` (UTC) →
 * 5am UTC on the 1st = ~10pm Phoenix on the 31st (or 9pm during DST).
 * The cron picks up the just-closed Phoenix calendar month and generates
 * one Stripe invoice per active property per landlord-with-billing.
 *
 * Auth: same `Bearer ${CRON_SECRET}` pattern used by sync-listings.
 *
 * `maxDuration = 300` (Pro plan) so a long run with many landlords/
 * properties + Stripe round-trips can complete without timing out.
 */

export const maxDuration = 300;

import { NextResponse } from "next/server";
import { runMonthlyInvoiceCron } from "@/lib/billing/monthly-invoices";

const CRON_SECRET = process.env.CRON_SECRET;

async function handle(req: Request): Promise<NextResponse> {
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const result = await runMonthlyInvoiceCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/monthly-invoices] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
