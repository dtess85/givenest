/**
 * POST /api/admin/landlords/[id]/generate-invoice
 *
 * Manually trigger invoice generation for last calendar month for one
 * landlord — useful when admins want to verify a Stripe Invoice without
 * waiting for the monthly cron, or when re-running after fixing a failed
 * run.
 *
 * The actual rollup logic lives in `lib/billing/monthly-invoices.ts` and
 * is shared with `/api/cron/monthly-invoices` so both paths stay in sync.
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { getLandlordById } from "@/lib/db/landlords";
import { generateInvoicesForLandlord, periodForLastMonth } from "@/lib/billing/monthly-invoices";

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
    return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
  }

  const period = periodForLastMonth();
  const result = await generateInvoicesForLandlord(landlord, period);
  return NextResponse.json(result);
}
