import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCharityByClerkUserId, updateCharity } from "@/lib/db/charities";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charity = await getCharityByClerkUserId(userId);
  return NextResponse.json({ charity });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charity = await getCharityByClerkUserId(userId);
  if (!charity) return NextResponse.json({ error: "No charity linked" }, { status: 404 });

  const data = await req.json();
  const allowed = ["tagline", "description", "mission", "website", "video_url", "cover_image_url", "logo_url"];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  const updated = await updateCharity(charity.id, update);
  return NextResponse.json({ charity: updated });
}
