import { pool, sql } from "./index";
import type {
  MediaFormat,
  PostStatus,
  PriceTier,
  SocialPostDraft,
} from "@/lib/social/types";
import type { Property } from "@/lib/mock-data";

/** Row shape for `social_posts` as returned from the database.
 *  Mirrors the migration in `lib/db/migrations/006_social_posts.sql`. */
export interface SocialPostRow {
  id: string;
  platform: string;
  format: MediaFormat;
  listing_slug: string | null;
  listing_source: "spark" | "manual" | null;
  listing_office_name: string | null;
  listing_snapshot:
    | (Property & { price_tier?: PriceTier; image_categories?: string[] })
    | null;
  charity_id: string | null;
  charity_stat: Record<string, unknown> | null;
  caption: string;
  image_urls: string[];
  image_categories: string[];
  video_url: string | null;
  media_type: "IMAGE" | "CAROUSEL" | "STORY" | "REEL";
  status: PostStatus;
  scheduled_for: string | null;
  render_job_id: string | null;
  render_started_at: string | null;
  render_completed_at: string | null;
  reel_template_id: string | null;
  reel_hook_id: string | null;
  reel_cta_id: string | null;
  ig_container_id: string | null;
  ig_media_id: string | null;
  ig_permalink: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  retry_count: number;
  last_error_code: string | null;
  last_error_message: string | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Map a draft's format to the IG API `media_type`. */
function mediaTypeFor(format: MediaFormat): SocialPostRow["media_type"] {
  if (format === "CAROUSEL") return "CAROUSEL";
  if (format === "STORY") return "STORY";
  if (format === "REEL") return "REEL";
  return "IMAGE"; // CHARITY posts are single-image IG posts
}

/** Encode a string array as a Postgres array literal. Needed because `pg`
 *  doesn't bind arrays from template literals the way it handles scalars. */
function encodePgTextArray(values: string[]): string {
  if (values.length === 0) return "{}";
  const escaped = values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(",");
  return `{${escaped}}`;
}

/**
 * Insert a draft row. The drafting cron calls this once per format per listing
 * (so Mon with one listing generates 3 rows: Carousel + Story + Reel).
 *
 * For Reels in Phase 1: `image_urls` can be empty and `video_url` null — the
 * Remotion render job (Phase 2) fills them in and flips `status` from
 * 'rendering' back to 'draft' for approval.
 */
export async function createDraft(draft: SocialPostDraft): Promise<SocialPostRow> {
  const mediaType = mediaTypeFor(draft.format);
  const { rows } = await sql`
    INSERT INTO social_posts (
      format, listing_slug, listing_source, listing_office_name, listing_snapshot,
      caption, image_urls, image_categories, video_url, media_type, status,
      scheduled_for, reel_template_id, reel_hook_id, reel_cta_id
    ) VALUES (
      ${draft.format},
      ${draft.listing_slug},
      ${draft.listing_source},
      ${draft.listing_office_name},
      ${JSON.stringify(draft.listing_snapshot)}::jsonb,
      ${draft.caption},
      ${encodePgTextArray(draft.image_urls)}::text[],
      ${encodePgTextArray(draft.image_categories ?? [])}::text[],
      ${draft.video_url ?? null},
      ${mediaType},
      'draft',
      ${draft.scheduled_for ? draft.scheduled_for.toISOString() : null},
      ${draft.reel_template_id ?? null},
      ${draft.reel_hook_id ?? null},
      ${draft.reel_cta_id ?? null}
    )
    RETURNING *
  `;
  return rows[0] as SocialPostRow;
}

/** Fetch rows by status, newest first. Used by /admin/social. */
export async function listByStatus(
  statuses: PostStatus[],
  limit = 50
): Promise<SocialPostRow[]> {
  if (statuses.length === 0) return [];
  // `pg` can't bind a JS array into an `IN (...)` clause from our template tag,
  // so expand manually with parameterized placeholders.
  const placeholders = statuses.map((_, i) => `$${i + 1}`).join(",");
  const { rows } = await pool.query(
    `SELECT * FROM social_posts
       WHERE status IN (${placeholders})
       ORDER BY created_at DESC
       LIMIT $${statuses.length + 1}`,
    [...statuses, limit]
  );
  return rows as SocialPostRow[];
}

/**
 * Slugs of listings that are currently drafted or en route to publish. Used
 * by the selector to avoid re-picking the same listing we just worked on.
 */
export async function getPostedOrPendingSlugs(
  sinceDays: number
): Promise<Set<string>> {
  const { rows } = await sql`
    SELECT DISTINCT listing_slug
      FROM social_posts
     WHERE listing_slug IS NOT NULL
       AND status IN ('draft','rendering','approved','publishing','published')
       AND created_at >= NOW() - (${sinceDays} || ' days')::interval
  `;
  return new Set(rows.map((r) => (r as { listing_slug: string }).listing_slug));
}

/**
 * Return the most-recent N posts for a given price tier. The selector uses
 * this for city-variety scoring — if "Scottsdale" appeared in the tier's last
 * 2 posts, penalize a new Scottsdale candidate.
 */
export async function getRecentPostsByTier(
  tier: PriceTier,
  limit: number
): Promise<SocialPostRow[]> {
  const { rows } = await sql`
    SELECT * FROM social_posts
     WHERE listing_snapshot ->> 'price_tier' = ${tier}
       AND format = 'CAROUSEL'
     ORDER BY created_at DESC
     LIMIT ${limit}
  `;
  return rows as SocialPostRow[];
}

/** Return the most-recent Reel rows — used by the template-rotation selector
 *  (Phase 2) to avoid repeating the last N templates. */
export async function getRecentReelTemplateIds(limit: number): Promise<string[]> {
  const { rows } = await sql`
    SELECT reel_template_id
      FROM social_posts
     WHERE format = 'REEL'
       AND reel_template_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT ${limit}
  `;
  return rows
    .map((r) => (r as { reel_template_id: string | null }).reel_template_id)
    .filter((v): v is string => v !== null);
}

/** Fetch a draft by id. Used by approval routes (Phase 3). */
export async function getById(id: string): Promise<SocialPostRow | null> {
  const { rows } = await sql`SELECT * FROM social_posts WHERE id = ${id} LIMIT 1`;
  return (rows[0] as SocialPostRow) ?? null;
}

/**
 * Overwrite the caption on a draft row. Admin-only (auth enforced by the
 * calling server action). `updated_at` is bumped explicitly because we don't
 * install an auto-update trigger on the table.
 *
 * Returns the freshly-updated row so the UI can reconcile without a re-query.
 */
export async function updateCaption(
  id: string,
  caption: string
): Promise<SocialPostRow | null> {
  const { rows } = await sql`
    UPDATE social_posts
       SET caption = ${caption},
           updated_at = NOW()
     WHERE id = ${id}
     RETURNING *
  `;
  return (rows[0] as SocialPostRow) ?? null;
}

/**
 * Stamp the rendered Reel MP4 URL on a REEL row. Called by
 * `lib/social/reel-render.ts` after a Remotion render + Blob upload. Once
 * this is populated the admin UI swaps from "source-clips placeholder" to a
 * playable <video> preview.
 */
export async function updateVideoUrl(
  id: string,
  videoUrl: string
): Promise<SocialPostRow | null> {
  const { rows } = await sql`
    UPDATE social_posts
       SET video_url = ${videoUrl},
           updated_at = NOW()
     WHERE id = ${id}
     RETURNING *
  `;
  return (rows[0] as SocialPostRow) ?? null;
}

/**
 * Rewrite the image ordering on a REEL draft's snapshot. Called by the
 * admin "Pick clips" flow — reorders `listing_snapshot.images` (and the
 * parallel `image_categories` array in lockstep) so the admin-picked photos
 * land in clip slots 0..N-1 when the Remotion render reads them.
 *
 * Uses jsonb_set rather than re-writing the whole snapshot so we don't race
 * with any field a future admin path might add to the blob.
 */
export async function updateReelImageOrder(
  id: string,
  images: string[],
  imageCategories: string[]
): Promise<SocialPostRow | null> {
  const { rows } = await sql`
    UPDATE social_posts
       SET listing_snapshot = jsonb_set(
             jsonb_set(
               COALESCE(listing_snapshot, '{}'::jsonb),
               '{images}',
               ${JSON.stringify(images)}::jsonb,
               true
             ),
             '{image_categories}',
             ${JSON.stringify(imageCategories)}::jsonb,
             true
           ),
           updated_at = NOW()
     WHERE id = ${id}
       AND format = 'REEL'
     RETURNING *
  `;
  return (rows[0] as SocialPostRow) ?? null;
}
