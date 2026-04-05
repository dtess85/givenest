import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createTransaction } from "@/lib/db/transactions";
import { recalcCharityTotals } from "@/lib/db/charities";

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  if (!data.charity_id || !data.amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transaction = await createTransaction({
    charity_id: data.charity_id,
    amount: data.amount,
    property_address: data.property_address || null,
    property_city: data.property_city || null,
    closing_date: data.closing_date || null,
    agent_name: data.agent_name || null,
    agent_share_consent: !!data.agent_share_consent,
    client_name: data.client_name || null,
    client_share_consent: !!data.client_share_consent,
    notes: data.notes || null,
  });

  // Recalculate charity totals
  await recalcCharityTotals(data.charity_id);

  return NextResponse.json({ transaction });
}
