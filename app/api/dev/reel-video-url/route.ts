import { NextRequest, NextResponse } from "next/server";
import { updateVideoUrl } from "@/lib/db/social-posts";

/**
 * Dev-only endpoint used by `scripts/render-reel-local.ts`. After the local
 * renderer uploads an MP4 to Vercel Blob, it POSTs `{ id, videoUrl }` here
 * and this route stamps `social_posts.video_url` on the row so the admin UI
 * picks it up.
 *
 * Production path (Phase 2 Lambda): `/api/cron/social-render-reels` will
 * call `updateVideoUrl` directly — no HTTP round-trip. This handler only
 * exists because direct `pg` from a Node CLI script can't resolve
 * Supabase's IPv6-only DB host on macOS with the default resolver.
 *
 * Gate: 404s in production, mirrors the auth policy of
 * `/api/dev/reel-source` (CRON_SECRET optional in dev).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, videoUrl } = (body ?? {}) as { id?: string; videoUrl?: string };
  if (!id || !videoUrl) {
    return NextResponse.json(
      { error: "Expected { id, videoUrl } in body" },
      { status: 400 }
    );
  }

  const row = await updateVideoUrl(id, videoUrl);
  if (!row) {
    return NextResponse.json({ error: "Row not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: row.id, video_url: row.video_url });
}
