-- 009_listings_price_change.sql
-- Track price changes on the listings index so the buy-page property cards
-- can show "Price drop" / "Price increase" badges without making 12+ Spark
-- history requests per page load.
--
-- The values land here via the sync-listings cron (lib/db/listings-index.ts
-- `upsertListings`) — when an incoming Spark price differs from the stored
-- price, we snapshot the old price into `previous_price` and stamp
-- `price_changed_at = NOW()`. The card UI then renders a badge for any
-- listing whose `price_changed_at` is within the last 10 days, matching
-- the visibility window already used by the property-page Price drop
-- alert.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS previous_price NUMERIC,
  ADD COLUMN IF NOT EXISTS price_changed_at TIMESTAMPTZ;

-- Partial index — only the recent-change tail is needed on the buy page.
-- "Recent" is generous (90 days) so future widening of the badge window
-- doesn't require an index rebuild.
CREATE INDEX IF NOT EXISTS listings_price_changed_at_idx
  ON listings(price_changed_at DESC)
  WHERE price_changed_at IS NOT NULL;
