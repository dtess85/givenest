-- 008_enable_rls.sql
-- Close the PostgREST back door.
--
-- Context: the app never touches these tables through Supabase's PostgREST
-- endpoint — all reads and writes go through the `pg` pool in lib/db/index.ts
-- using DATABASE_URL (connects as the `postgres` owner role, which bypasses
-- RLS entirely). But NEXT_PUBLIC_SUPABASE_ANON_KEY is baked into the browser
-- bundle for Supabase Auth, and with no RLS the anon key can hit
-- /rest/v1/<table> and read every row in these tables directly.
--
-- Fix: enable RLS with NO policies. Default-deny blocks anon/authed PostgREST
-- access. The app's pg connection (superuser) bypasses RLS and keeps working.
--
-- If we later add browser-side Supabase client reads for any of these tables,
-- add a FOR SELECT USING (...) policy for that specific case.

ALTER TABLE listings                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_listings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiries               ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_image_classifications ENABLE ROW LEVEL SECURITY;
