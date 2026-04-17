-- 007_listing_image_classifications.sql
-- Persistent cache for Anthropic vision classifications of listing photos.
-- We classify each unique image URL once, then reuse across every social
-- draft that references that image. Keyed on URL so the cache is shared
-- across listings (rare) and across draft re-runs (common — deleting and
-- re-running the drafter shouldn't re-bill the API).

CREATE TABLE IF NOT EXISTS listing_image_classifications (
  -- Primary key: SHA-256 of the image URL. Using a hash keeps the index
  -- compact even for very long Spark CDN URLs, and sidesteps URL quoting
  -- / case-sensitivity edge cases when we do lookups.
  url_hash CHAR(64) PRIMARY KEY,

  -- The URL we classified, stored for debugging / invalidation.
  url TEXT NOT NULL,

  -- Classification output:
  --   exterior_front   — street-view / front elevation / front yard
  --   exterior_back    — backyard, pool, patio, pergola
  --   aerial           — drone / bird's-eye
  --   kitchen          — kitchen (any view)
  --   living           — living room, family room, great room
  --   dining           — dedicated dining room
  --   primary_bedroom  — primary / master suite
  --   bedroom          — any other bedroom
  --   bath             — any bathroom
  --   office           — home office / den / study
  --   other_interior   — laundry, mudroom, bar, closet, entryway, hallway
  --   floorplan_or_map — floorplan, site plan, map — DO NOT use as social content
  --   other            — anything we couldn't confidently categorize
  category TEXT NOT NULL,

  -- 0.0–1.0. We use this to downweight low-confidence classifications when
  -- ordering slides; we DON'T auto-reject on confidence alone.
  confidence NUMERIC(3, 2) NOT NULL,

  -- Model used, for future cache-busting if we change classifier behavior.
  model TEXT NOT NULL,

  classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (confidence >= 0.0 AND confidence <= 1.0),
  CHECK (category IN (
    'exterior_front', 'exterior_back', 'aerial',
    'kitchen', 'living', 'dining', 'primary_bedroom', 'bedroom', 'bath',
    'office', 'other_interior',
    'floorplan_or_map', 'other'
  ))
);

CREATE INDEX IF NOT EXISTS listing_image_classifications_model_idx
  ON listing_image_classifications(model, classified_at DESC);

-- Per-slot categories for a social_posts row, aligned index-for-index with
-- `image_urls`. Enables the admin UI to show "Kitchen" / "Backyard" badges
-- under each thumbnail so classification mistakes are easy to spot.
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS image_categories TEXT[] NOT NULL DEFAULT '{}';
