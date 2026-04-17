-- 006_social_posts.sql
-- Social media (Instagram) content pipeline. Each row is one Reel / Carousel /
-- Story / Charity draft. The drafting cron inserts; a reviewer approves (or
-- rejects) via /admin/social; the publisher cron (Phase 3) transitions
-- approved → publishing → published and writes the IG permalink back.

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT 'instagram',

  -- Format
  format TEXT NOT NULL,  -- 'CAROUSEL' | 'STORY' | 'REEL' | 'CHARITY'

  -- Listing reference (NULL for CHARITY)
  listing_slug TEXT,
  listing_source TEXT,           -- 'spark' | 'manual'
  listing_office_name TEXT,      -- Attribution from Spark ListOfficeName
  listing_snapshot JSONB,        -- Frozen Property at draft time + price_tier

  -- Charity reference (Phase 4; NULL for listing posts)
  charity_id UUID REFERENCES charities(id),
  charity_stat JSONB,            -- { label, value, period }

  -- Content
  caption TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',  -- 0–10 HTTPS URLs (Reels empty until rendered)
  video_url TEXT,                            -- Reels only
  media_type TEXT NOT NULL,                  -- 'IMAGE' | 'CAROUSEL' | 'STORY' | 'REEL'

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,

  -- Phase 2 — Remotion render tracking
  render_job_id TEXT,
  render_started_at TIMESTAMPTZ,
  render_completed_at TIMESTAMPTZ,

  -- Phase 2 — Reel-variety rotation bookkeeping
  reel_template_id TEXT,
  reel_hook_id TEXT,
  reel_cta_id TEXT,

  -- Phase 3 — IG publish metadata
  ig_container_id TEXT,
  ig_media_id TEXT,
  ig_permalink TEXT,

  -- Review
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,

  -- Failure handling
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  last_error_message TEXT,
  last_attempt_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT social_posts_format_chk
    CHECK (format IN ('CAROUSEL','STORY','REEL','CHARITY')),
  CONSTRAINT social_posts_status_chk
    CHECK (status IN ('draft','rendering','approved','publishing','published','failed','rejected','skipped')),
  CONSTRAINT social_posts_image_count_chk
    CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) BETWEEN 0 AND 10),
  CONSTRAINT social_posts_ref_chk
    CHECK (
      (format = 'CHARITY' AND charity_id IS NOT NULL) OR
      (format <> 'CHARITY' AND listing_slug IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS social_posts_publish_idx
  ON social_posts(scheduled_for)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS social_posts_slug_status_idx
  ON social_posts(listing_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS social_posts_status_created_idx
  ON social_posts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS social_posts_format_idx
  ON social_posts(format, created_at DESC);

CREATE INDEX IF NOT EXISTS social_posts_reel_template_idx
  ON social_posts(reel_template_id, created_at DESC)
  WHERE format = 'REEL';
