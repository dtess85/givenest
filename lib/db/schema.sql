-- Givenest charity partner profiles
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ein TEXT UNIQUE,
  category TEXT,
  city TEXT,
  state TEXT DEFAULT 'AZ',
  tagline TEXT,
  description TEXT,
  mission TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_partner BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  user_id TEXT, -- will be populated by Supabase Auth uid() once auth is wired
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  total_donated NUMERIC DEFAULT 0,
  total_closings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manually-entered Givenest listings (Coming Soon and other off-IDX properties)
CREATE TABLE IF NOT EXISTS manual_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mls_number TEXT,
  spark_listing_key TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Gilbert',
  state TEXT NOT NULL DEFAULT 'AZ',
  zip TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  beds NUMERIC,
  baths NUMERIC,
  sqft NUMERIC,
  property_type TEXT DEFAULT 'Single Family Residence',
  status TEXT DEFAULT 'Coming Soon',
  year_built INTEGER,
  lot_size TEXT,
  hoa_dues NUMERIC,
  garage_spaces INTEGER,
  description TEXT,
  neighborhood TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_urls TEXT[] DEFAULT '{}',
  list_office_name TEXT DEFAULT 'Givenest',
  is_active BOOLEAN DEFAULT true,
  sort_priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-indexed Spark listings for instant address search and stable property URLs.
-- Synced every 15 min via /api/cron/sync-listings.
-- Supabase requires pg_trgm for the trigram indexes below (enabled by default).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_listing_key TEXT UNIQUE NOT NULL, -- = listing.Id from Spark replication API
  mls_number TEXT,                        -- ListingId (ARMLS MLS#)
  address TEXT NOT NULL,                  -- "123 N Main St"
  street_number TEXT,
  street_name TEXT,
  city TEXT,
  state TEXT DEFAULT 'AZ',
  zip TEXT,
  price NUMERIC,
  beds NUMERIC,
  baths NUMERIC,
  neighborhood TEXT,                      -- SubdivisionName
  agent_name TEXT,                        -- ListAgentFullName
  status TEXT,                            -- mapped status (e.g. "For Sale")
  mls_status TEXT,                        -- raw MlsStatus from Spark
  is_featured BOOLEAN DEFAULT false,
  modified_at TIMESTAMPTZ,               -- ModificationTimestamp from Spark
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listings_spark_key_idx ON listings(spark_listing_key);
CREATE INDEX IF NOT EXISTS listings_mls_idx ON listings(mls_number);
CREATE INDEX IF NOT EXISTS listings_city_idx ON listings(city);
CREATE INDEX IF NOT EXISTS listings_street_num_idx ON listings(street_number);
CREATE INDEX IF NOT EXISTS listings_address_trgm_idx ON listings USING GIN(address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_neighborhood_trgm_idx ON listings USING GIN(neighborhood gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_agent_trgm_idx ON listings USING GIN(agent_name gin_trgm_ops);

-- Add list_office_name to listings (idempotent for existing installs)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS list_office_name TEXT;

-- ARMLS member roster — synced daily from Spark /v1/accounts
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_member_id TEXT UNIQUE NOT NULL,  -- Spark account Id
  slug TEXT NOT NULL,                     -- URL-safe, for future profile pages (not unique — name collisions possible)
  name TEXT NOT NULL,                    -- full display name
  first_name TEXT,
  last_name TEXT,
  office_name TEXT,                      -- current brokerage from Spark
  office_id TEXT,
  primary_city TEXT,                     -- from Associations[0]
  license_number TEXT,
  phone TEXT,                            -- stored but NOT exposed in UI (referral protection)
  email TEXT,                            -- stored but NOT exposed in UI
  associations TEXT[],
  is_givenest BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  active_listing_count INTEGER DEFAULT 0,
  idx_participant BOOLEAN DEFAULT true,
  modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS agents_slug_idx ON agents(slug);
CREATE INDEX IF NOT EXISTS agents_name_trgm_idx ON agents USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS agents_city_idx ON agents(primary_city);
CREATE INDEX IF NOT EXISTS agents_office_trgm_idx ON agents USING GIN(office_name gin_trgm_ops);

-- Lead capture for agent consult requests
CREATE TABLE IF NOT EXISTS agent_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  agent_office TEXT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  property_address TEXT,
  message TEXT,
  source TEXT,                           -- 'directory' | 'property-page' | 'search'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Closing records (manually entered by Givenest admin)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id UUID REFERENCES charities(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  property_address TEXT,
  property_city TEXT,
  closing_date DATE,
  agent_name TEXT,
  agent_share_consent BOOLEAN DEFAULT false,
  client_name TEXT,
  client_share_consent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
