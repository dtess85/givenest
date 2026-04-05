import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCharityByClerkUserId } from "@/lib/db/charities";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charity = await getCharityByClerkUserId(userId);
  if (!charity) return NextResponse.json({ error: "No charity linked" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const field = formData.get("field") as string;

  if (!file || !["cover_image_url", "logo_url", "gallery"].includes(field)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const filename = `charities/${charity.slug}/${field}-${Date.now()}.${file.name.split(".").pop()}`;
  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
