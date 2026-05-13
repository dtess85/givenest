/**
 * GET /api/agents/team
 *
 * Returns the Givenest team — only agents flagged `is_givenest = true` in
 * our index. Used by the <AgentPicker> on property detail pages so buyers
 * can pick a Givenest agent to represent them.
 *
 * Why a private dedicated endpoint instead of the old `/api/agents` search:
 * ARMLS access rules forbid exposing other MLS agents' data publicly. This
 * endpoint never returns anyone outside Givenest, so it's safe to call
 * from an unauthenticated browser. Edge-cached for 5 minutes — the team
 * list changes infrequently.
 */

import { NextResponse } from "next/server";
import { getGivenestAgents } from "@/lib/db/listings-index";

export async function GET() {
  try {
    const agents = await getGivenestAgents(10);
    return NextResponse.json(
      { agents },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[api/agents/team] failed:", err);
    return NextResponse.json({ agents: [] }, { status: 200 });
  }
}
