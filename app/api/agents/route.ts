import { NextResponse } from "next/server";
import { searchAgents } from "@/lib/db/listings-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const city = searchParams.get("city") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "48", 10) || 48));

  const { agents, total } = await searchAgents({ q, city, page, limit });
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    { agents, total, page, totalPages },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
