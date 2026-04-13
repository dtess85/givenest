-- Add is_featured flag to agents and listings tables
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Index for fast featured queries
CREATE INDEX IF NOT EXISTS agents_featured_idx ON agents(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS listings_featured_idx ON listings(is_featured) WHERE is_featured = true;
