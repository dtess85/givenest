import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * Dev-only endpoint used by `scripts/render-reel-local.ts`. Returns the
 * listing snapshot + office name + slug for a single REEL draft row so the
 * local Remotion renderer has something to work with.
 *
 * Only reachable from the running Next dev server — which is the whole
 * point, since a direct `pg` connection from a fresh node script can't
 * resolve Supabase's IPv6-only direct DB hostname on macOS.
 *
 * Auth: CRON_SECRET bearer — same gate used for the drafter cron routes.
 *
 * Gate: this route returns 404 in production builds so we never ship a
 * database-leaking dev handler to Vercel.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Block in production. The reel-render pipeline on Vercel uses Lambda
  // (Phase 2) and doesn't go through this path.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Match the drafter route's policy: if CRON_SECRET is set in env, require
  // it; otherwise allow through on localhost (dev convenience). We already
  // gate on NODE_ENV !== production above, so this is localhost-only.
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const slug = req.nextUrl.searchParams.get("slug");

  const query = slug
    ? {
        text: `SELECT id, listing_snapshot, listing_office_name, listing_slug
               FROM social_posts
               WHERE listing_slug = $1 AND format = 'REEL'
               ORDER BY created_at DESC LIMIT 1`,
        values: [slug],
      }
    : {
        text: `SELECT id, listing_snapshot, listing_office_name, listing_slug
               FROM social_posts
               WHERE format = 'REEL' AND status = 'draft'
               ORDER BY created_at DESC LIMIT 1`,
        values: [],
      };

  const { rows } = await pool.query(query);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No matching REEL row" },
      { status: 404 }
    );
  }

  const row = rows[0];
  return NextResponse.json({
    property: row.listing_snapshot,
    officeName: row.listing_office_name,
    slug: row.listing_slug,
    // Returned so the local renderer can PATCH video_url back on the exact
    // row after upload. Left out when --from <file.json> is used.
    reelId: row.id,
  });
}
