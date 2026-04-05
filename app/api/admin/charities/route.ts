import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAllCharities } from "@/lib/db/charities";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charities = await getAllCharities();
  return NextResponse.json({ charities });
}
