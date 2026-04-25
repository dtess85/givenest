-- 010_landlords.sql
-- Property-management dashboard schema. Backs the /landlord/* portal and the
-- /admin/landlords admin surface. Five tables:
--
--   landlords           — one row per invited owner, bound to auth.users on
--                         first magic-link login (auth_user_id NULL until then)
--   properties_mgmt     — N properties per landlord, separate from MLS-listing
--                         "properties" so the namespace stays clean
--   landlord_documents  — admin-uploaded PDFs (PMA, leases, inspections) stored
--                         on Vercel Blob, listed in the landlord doc viewer
--   service_log         — admin-entered work events (landscaping, cleaning,
--                         pest control, etc). Cron rolls unbilled rows into a
--                         monthly Stripe invoice.
--   landlord_invoices   — local mirror of each Stripe invoice the cron creates,
--                         plus a 'failed' state for cron-side errors so we
--                         don't lose track of broken invoices.
--
-- Billing model: variable per month, NOT a Stripe subscription. We save a
-- card via SetupIntent (Checkout mode='setup'), then off-session charge a
-- Stripe Invoice on the 1st of each month built from service_log rows.
--
-- RLS: enabled on every table, NO policies. Mirrors 008_enable_rls.sql —
-- the app's pg.Pool connects as the postgres owner role and bypasses RLS;
-- this just blocks PostgREST/anon access via the Supabase REST endpoint.

CREATE TABLE IF NOT EXISTS landlords (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL until the invited landlord clicks the magic link and middleware
  -- binds them to a Supabase auth.users row by case-insensitive email match.
  auth_user_id              UUID UNIQUE,
  email                     TEXT UNIQUE NOT NULL,
  name                      TEXT NOT NULL,
  phone                     TEXT,
  -- { street, city, state, zip } — JSONB so we can extend (unit/suite, etc.)
  -- without a follow-up migration.
  mailing_address           JSONB,
  -- { email, sms, invoice_emails, frequency } — see lib/email/landlord.ts.
  comm_prefs                JSONB NOT NULL DEFAULT
    '{"email":true,"sms":false,"invoice_emails":true,"frequency":"monthly"}'::jsonb,
  stripe_customer_id        TEXT UNIQUE,
  default_payment_method_id TEXT,
  -- Stamped when the SetupIntent succeeds. Cron only bills landlords with
  -- this populated (otherwise no card is on file).
  billing_setup_at          TIMESTAMPTZ,
  invited_at                TIMESTAMPTZ,
  invited_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS landlords_auth_user_idx
  ON landlords(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS landlords_email_idx
  ON landlords(LOWER(email));

DO $$ BEGIN
  CREATE TYPE property_mgmt_status AS ENUM ('active','paused','terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS properties_mgmt (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                     UUID NOT NULL REFERENCES landlords(id) ON DELETE RESTRICT,
  address                      TEXT NOT NULL,
  city                         TEXT NOT NULL,
  state                        TEXT NOT NULL DEFAULT 'AZ',
  zip                          TEXT,
  -- Cross-ref into the listings index when the property is also on the MLS.
  -- NULL for off-market rentals, which is the typical case for management.
  mls_listing_key              TEXT,
  management_started_at        DATE,
  -- Base monthly fee in cents. The cron adds this as one line item per
  -- invoice on top of the per-service line items rolled up from service_log.
  monthly_management_fee_cents INTEGER NOT NULL DEFAULT 0,
  status                       property_mgmt_status NOT NULL DEFAULT 'active',
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One landlord can't have two properties at the same exact address — keeps
  -- the dashboard's property selector unambiguous.
  UNIQUE (owner_id, address)
);
CREATE INDEX IF NOT EXISTS properties_mgmt_owner_status_idx
  ON properties_mgmt(owner_id, status);

DO $$ BEGIN
  CREATE TYPE landlord_doc_kind AS ENUM ('pma','lease','inspection','statement','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS landlord_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE RESTRICT,
  -- Some docs are landlord-level (PMA), others property-level (inspection).
  -- NULL = landlord-level.
  property_id UUID REFERENCES properties_mgmt(id) ON DELETE SET NULL,
  kind        landlord_doc_kind NOT NULL DEFAULT 'other',
  title       TEXT NOT NULL,
  blob_url    TEXT NOT NULL,
  mime_type   TEXT,
  size_bytes  BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Soft delete so previously-shared links keep resolving for audit, but the
  -- doc is hidden from the landlord viewer.
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS landlord_documents_landlord_idx
  ON landlord_documents(landlord_id, kind, uploaded_at DESC)
  WHERE deleted_at IS NULL;

DO $$ BEGIN
  CREATE TYPE service_kind AS ENUM
    ('landscaping','cleaning','pest_control','maintenance','utilities','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS service_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties_mgmt(id) ON DELETE RESTRICT,
  service_kind      service_kind NOT NULL,
  vendor            TEXT,
  description       TEXT NOT NULL,
  performed_at      DATE NOT NULL,
  amount_cents      INTEGER NOT NULL CHECK (amount_cents > 0),
  currency          TEXT NOT NULL DEFAULT 'usd',
  -- TRUE = passes through to a tenant ledger (future feature) and is excluded
  -- from the landlord's monthly invoice. FALSE = bill to landlord.
  tenant_chargeback BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  -- Stamped by the cron when this row gets included in a finalized invoice.
  -- Cron filters WHERE billed_at IS NULL AND tenant_chargeback = FALSE.
  billed_at         TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS service_log_billing_idx
  ON service_log(property_id, billed_at, performed_at);

DO $$ BEGIN
  CREATE TYPE landlord_invoice_status AS ENUM
    ('draft','open','paid','void','uncollectible','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS landlord_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id         UUID NOT NULL REFERENCES landlords(id) ON DELETE RESTRICT,
  property_id         UUID NOT NULL REFERENCES properties_mgmt(id) ON DELETE RESTRICT,
  -- Period bounds in America/Phoenix calendar (the cron computes these
  -- explicitly — Vercel cron schedules run in UTC).
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  stripe_invoice_id   TEXT UNIQUE,
  amount_cents        INTEGER,
  status              landlord_invoice_status NOT NULL DEFAULT 'draft',
  finalized_at        TIMESTAMPTZ,
  paid_at             TIMESTAMPTZ,
  hosted_invoice_url  TEXT,
  -- Set when the cron threw mid-invoice (e.g. Stripe API hiccup) so admins
  -- can find broken invoices without grep'ing logs.
  error               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS landlord_invoices_landlord_idx
  ON landlord_invoices(landlord_id, period_start DESC);

ALTER TABLE landlords          ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties_mgmt    ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_invoices  ENABLE ROW LEVEL SECURITY;
