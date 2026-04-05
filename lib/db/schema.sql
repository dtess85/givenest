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
  clerk_user_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  total_donated NUMERIC DEFAULT 0,
  total_closings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
