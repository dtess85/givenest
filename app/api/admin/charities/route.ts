import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAllCharities } from "@/lib/db/charities";

export async function GET() {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charities = await getAllCharities();
  return NextResponse.json({ charities });
}
