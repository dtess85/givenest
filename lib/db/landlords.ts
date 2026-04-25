/**
 * DB helpers for the landlord property-management dashboard. Backed by
 * `lib/db/migrations/010_landlords.sql`. All queries go through the shared
 * `pg.Pool` (see `lib/db/index.ts`) — that connects as the postgres owner
 * role, so RLS is bypassed.
 *
 * Auth model: every landlord-facing route handler MUST call `requireLandlord`
 * (see `lib/auth/require-landlord.ts`) to translate `auth.users.id` →
 * `landlord_id`. Per-property endpoints MUST then verify ownership via
 * `getPropertyForOwner(propertyId, landlordId)` — never trust a propertyId
 * query param without that check.
 */

import { pool, sql } from "./index";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface MailingAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface CommPrefs {
  email: boolean;
  sms: boolean;
  invoice_emails: boolean;
  /** "monthly" = digest summary; "per_event" = one email per service log */
  frequency: "monthly" | "per_event";
}

export interface Landlord {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  mailing_address: MailingAddress | null;
  comm_prefs: CommPrefs;
  stripe_customer_id: string | null;
  default_payment_method_id: string | null;
  billing_setup_at: string | null;
  invited_at: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyMgmtStatus = "active" | "paused" | "terminated";

export interface PropertyMgmt {
  id: string;
  owner_id: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  mls_listing_key: string | null;
  management_started_at: string | null;
  monthly_management_fee_cents: number;
  status: PropertyMgmtStatus;
  created_at: string;
  updated_at: string;
}

export type LandlordDocKind =
  | "pma" | "lease" | "inspection" | "statement" | "other";

export interface LandlordDocument {
  id: string;
  landlord_id: string;
  property_id: string | null;
  kind: LandlordDocKind;
  title: string;
  blob_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  deleted_at: string | null;
}

export type ServiceKind =
  | "landscaping" | "cleaning" | "pest_control" | "maintenance" | "utilities" | "other";

export interface ServiceLogEntry {
  id: string;
  property_id: string;
  service_kind: ServiceKind;
  vendor: string | null;
  description: string;
  performed_at: string;
  amount_cents: number;
  currency: string;
  tenant_chargeback: boolean;
  notes: string | null;
  billed_at: string | null;
  stripe_invoice_id: string | null;
  created_by: string | null;
  created_at: string;
}

export type LandlordInvoiceStatus =
  | "draft" | "open" | "paid" | "void" | "uncollectible" | "failed";

export interface LandlordInvoice {
  id: string;
  landlord_id: string;
  property_id: string;
  period_start: string;
  period_end: string;
  stripe_invoice_id: string | null;
  amount_cents: number | null;
  status: LandlordInvoiceStatus;
  finalized_at: string | null;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  error: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/* Landlord CRUD                                                               */
/* -------------------------------------------------------------------------- */

export async function listLandlords(): Promise<Landlord[]> {
  const { rows } = await sql`
    SELECT * FROM landlords ORDER BY created_at DESC
  `;
  return rows as Landlord[];
}

export async function getLandlordById(id: string): Promise<Landlord | null> {
  const { rows } = await sql`SELECT * FROM landlords WHERE id = ${id} LIMIT 1`;
  return (rows[0] as Landlord) ?? null;
}

export async function getLandlordByAuthUserId(
  authUserId: string
): Promise<Landlord | null> {
  const { rows } = await sql`
    SELECT * FROM landlords WHERE auth_user_id = ${authUserId} LIMIT 1
  `;
  return (rows[0] as Landlord) ?? null;
}

export async function getLandlordByEmail(
  email: string
): Promise<Landlord | null> {
  const { rows } = await sql`
    SELECT * FROM landlords WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `;
  return (rows[0] as Landlord) ?? null;
}

export interface CreateLandlordInput {
  email: string;
  name: string;
  phone?: string | null;
  mailing_address?: MailingAddress | null;
  invited_by?: string | null;
}

export async function createLandlord(
  input: CreateLandlordInput
): Promise<Landlord> {
  const { rows } = await sql`
    INSERT INTO landlords (
      email, name, phone, mailing_address, invited_at, invited_by
    ) VALUES (
      ${input.email},
      ${input.name},
      ${input.phone ?? null},
      ${input.mailing_address ? JSON.stringify(input.mailing_address) : null}::jsonb,
      NOW(),
      ${input.invited_by ?? null}
    )
    RETURNING *
  `;
  return rows[0] as Landlord;
}

export interface UpdateLandlordInput {
  name?: string;
  phone?: string | null;
  mailing_address?: MailingAddress | null;
  comm_prefs?: CommPrefs;
}

export async function updateLandlord(
  id: string,
  input: UpdateLandlordInput
): Promise<Landlord | null> {
  // Only update fields the caller actually passed — undefined skips. We use
  // COALESCE on the JSONB columns so passing null clears them but undefined
  // (== "field omitted") leaves them untouched.
  const { rows } = await sql`
    UPDATE landlords SET
      name             = COALESCE(${input.name ?? null}, name),
      phone            = ${input.phone === undefined ? null : input.phone},
      mailing_address  = COALESCE(
        ${input.mailing_address === undefined ? null : JSON.stringify(input.mailing_address)}::jsonb,
        mailing_address
      ),
      comm_prefs       = COALESCE(
        ${input.comm_prefs === undefined ? null : JSON.stringify(input.comm_prefs)}::jsonb,
        comm_prefs
      ),
      updated_at       = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Landlord) ?? null;
}

/** Bind a Supabase auth.users id to an existing landlord row on first login.
 *  Triggered from `requireLandlord` when a logged-in user matches a landlord
 *  by email but `auth_user_id` is still NULL. */
export async function bindLandlordAuthUser(
  landlordId: string,
  authUserId: string
): Promise<Landlord | null> {
  const { rows } = await sql`
    UPDATE landlords
       SET auth_user_id = ${authUserId},
           updated_at = NOW()
     WHERE id = ${landlordId}
       AND auth_user_id IS NULL
     RETURNING *
  `;
  return (rows[0] as Landlord) ?? null;
}

/** Record the Stripe customer + saved payment method after a successful
 *  Checkout (mode=setup) or SetupIntent webhook. Idempotent — webhook
 *  delivery may double-fire. */
export async function setLandlordBilling(
  landlordId: string,
  patch: {
    stripe_customer_id?: string;
    default_payment_method_id?: string;
    mark_setup_complete?: boolean;
  }
): Promise<Landlord | null> {
  const { rows } = await sql`
    UPDATE landlords SET
      stripe_customer_id        = COALESCE(${patch.stripe_customer_id ?? null}, stripe_customer_id),
      default_payment_method_id = COALESCE(${patch.default_payment_method_id ?? null}, default_payment_method_id),
      billing_setup_at          = CASE
                                    WHEN ${patch.mark_setup_complete ?? false}
                                         AND billing_setup_at IS NULL
                                    THEN NOW()
                                    ELSE billing_setup_at
                                  END,
      updated_at                = NOW()
    WHERE id = ${landlordId}
    RETURNING *
  `;
  return (rows[0] as Landlord) ?? null;
}

export async function listLandlordsReadyForBilling(): Promise<Landlord[]> {
  const { rows } = await sql`
    SELECT * FROM landlords
     WHERE billing_setup_at IS NOT NULL
       AND default_payment_method_id IS NOT NULL
     ORDER BY name ASC
  `;
  return rows as Landlord[];
}

/* -------------------------------------------------------------------------- */
/* Properties                                                                  */
/* -------------------------------------------------------------------------- */

export async function listPropertiesForOwner(
  ownerId: string
): Promise<PropertyMgmt[]> {
  const { rows } = await sql`
    SELECT * FROM properties_mgmt
     WHERE owner_id = ${ownerId}
     ORDER BY status ASC, created_at DESC
  `;
  return rows as PropertyMgmt[];
}

/** Authorization-aware property lookup. Returns the row only if `ownerId`
 *  matches — caller can treat null as "not found OR not yours" without
 *  leaking existence. */
export async function getPropertyForOwner(
  propertyId: string,
  ownerId: string
): Promise<PropertyMgmt | null> {
  const { rows } = await sql`
    SELECT * FROM properties_mgmt
     WHERE id = ${propertyId} AND owner_id = ${ownerId}
     LIMIT 1
  `;
  return (rows[0] as PropertyMgmt) ?? null;
}

export async function getPropertyById(id: string): Promise<PropertyMgmt | null> {
  const { rows } = await sql`SELECT * FROM properties_mgmt WHERE id = ${id} LIMIT 1`;
  return (rows[0] as PropertyMgmt) ?? null;
}

export async function listActivePropertiesForOwner(
  ownerId: string
): Promise<PropertyMgmt[]> {
  const { rows } = await sql`
    SELECT * FROM properties_mgmt
     WHERE owner_id = ${ownerId} AND status = 'active'
     ORDER BY created_at ASC
  `;
  return rows as PropertyMgmt[];
}

export interface CreatePropertyInput {
  owner_id: string;
  address: string;
  city: string;
  state?: string;
  zip?: string | null;
  mls_listing_key?: string | null;
  management_started_at?: string | null;
  monthly_management_fee_cents?: number;
  status?: PropertyMgmtStatus;
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyMgmt> {
  const { rows } = await sql`
    INSERT INTO properties_mgmt (
      owner_id, address, city, state, zip, mls_listing_key,
      management_started_at, monthly_management_fee_cents, status
    ) VALUES (
      ${input.owner_id},
      ${input.address},
      ${input.city},
      ${input.state ?? "AZ"},
      ${input.zip ?? null},
      ${input.mls_listing_key ?? null},
      ${input.management_started_at ?? null},
      ${input.monthly_management_fee_cents ?? 0},
      ${input.status ?? "active"}
    )
    RETURNING *
  `;
  return rows[0] as PropertyMgmt;
}

export interface UpdatePropertyInput {
  address?: string;
  city?: string;
  state?: string;
  zip?: string | null;
  mls_listing_key?: string | null;
  management_started_at?: string | null;
  monthly_management_fee_cents?: number;
  status?: PropertyMgmtStatus;
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput
): Promise<PropertyMgmt | null> {
  const { rows } = await sql`
    UPDATE properties_mgmt SET
      address                       = COALESCE(${input.address ?? null}, address),
      city                          = COALESCE(${input.city ?? null}, city),
      state                         = COALESCE(${input.state ?? null}, state),
      zip                           = ${input.zip === undefined ? null : input.zip},
      mls_listing_key               = ${input.mls_listing_key === undefined ? null : input.mls_listing_key},
      management_started_at         = ${input.management_started_at === undefined ? null : input.management_started_at},
      monthly_management_fee_cents  = COALESCE(${input.monthly_management_fee_cents ?? null}, monthly_management_fee_cents),
      status                        = COALESCE(${input.status ?? null}::property_mgmt_status, status),
      updated_at                    = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as PropertyMgmt) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Documents                                                                   */
/* -------------------------------------------------------------------------- */

export async function listDocumentsForLandlord(
  landlordId: string
): Promise<LandlordDocument[]> {
  const { rows } = await sql`
    SELECT * FROM landlord_documents
     WHERE landlord_id = ${landlordId} AND deleted_at IS NULL
     ORDER BY uploaded_at DESC
  `;
  return rows as LandlordDocument[];
}

export async function getDocumentForLandlord(
  documentId: string,
  landlordId: string
): Promise<LandlordDocument | null> {
  const { rows } = await sql`
    SELECT * FROM landlord_documents
     WHERE id = ${documentId} AND landlord_id = ${landlordId} AND deleted_at IS NULL
     LIMIT 1
  `;
  return (rows[0] as LandlordDocument) ?? null;
}

export interface CreateDocumentInput {
  landlord_id: string;
  property_id?: string | null;
  kind: LandlordDocKind;
  title: string;
  blob_url: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  uploaded_by?: string | null;
}

export async function createDocument(
  input: CreateDocumentInput
): Promise<LandlordDocument> {
  const { rows } = await sql`
    INSERT INTO landlord_documents (
      landlord_id, property_id, kind, title, blob_url,
      mime_type, size_bytes, uploaded_by
    ) VALUES (
      ${input.landlord_id},
      ${input.property_id ?? null},
      ${input.kind},
      ${input.title},
      ${input.blob_url},
      ${input.mime_type ?? null},
      ${input.size_bytes ?? null},
      ${input.uploaded_by ?? null}
    )
    RETURNING *
  `;
  return rows[0] as LandlordDocument;
}

export async function softDeleteDocument(id: string): Promise<void> {
  await sql`UPDATE landlord_documents SET deleted_at = NOW() WHERE id = ${id}`;
}

/* -------------------------------------------------------------------------- */
/* Service log                                                                 */
/* -------------------------------------------------------------------------- */

export async function listServiceLogForProperty(
  propertyId: string,
  limit = 100
): Promise<ServiceLogEntry[]> {
  const { rows } = await sql`
    SELECT * FROM service_log
     WHERE property_id = ${propertyId}
     ORDER BY performed_at DESC, created_at DESC
     LIMIT ${limit}
  `;
  return rows as ServiceLogEntry[];
}

export async function listUnbilledServiceLog(
  propertyId: string,
  performedBefore: string
): Promise<ServiceLogEntry[]> {
  const { rows } = await sql`
    SELECT * FROM service_log
     WHERE property_id = ${propertyId}
       AND billed_at IS NULL
       AND tenant_chargeback = FALSE
       AND performed_at < ${performedBefore}
     ORDER BY performed_at ASC, created_at ASC
  `;
  return rows as ServiceLogEntry[];
}

export interface CreateServiceLogInput {
  property_id: string;
  service_kind: ServiceKind;
  vendor?: string | null;
  description: string;
  performed_at: string; // ISO date
  amount_cents: number;
  currency?: string;
  tenant_chargeback?: boolean;
  notes?: string | null;
  created_by?: string | null;
}

export async function createServiceLog(
  input: CreateServiceLogInput
): Promise<ServiceLogEntry> {
  const { rows } = await sql`
    INSERT INTO service_log (
      property_id, service_kind, vendor, description, performed_at,
      amount_cents, currency, tenant_chargeback, notes, created_by
    ) VALUES (
      ${input.property_id},
      ${input.service_kind},
      ${input.vendor ?? null},
      ${input.description},
      ${input.performed_at},
      ${input.amount_cents},
      ${input.currency ?? "usd"},
      ${input.tenant_chargeback ?? false},
      ${input.notes ?? null},
      ${input.created_by ?? null}
    )
    RETURNING *
  `;
  return rows[0] as ServiceLogEntry;
}

export async function deleteServiceLog(id: string): Promise<void> {
  // Hard delete is OK — only un-billed entries are deletable. Once `billed_at`
  // is stamped the row references a finalized invoice and must stick around.
  await sql`DELETE FROM service_log WHERE id = ${id} AND billed_at IS NULL`;
}

export async function markServiceLogBilled(
  ids: string[],
  stripeInvoiceId: string
): Promise<void> {
  if (ids.length === 0) return;
  // ANY($1) accepts a JS array — safer than building an IN clause.
  await pool.query(
    `UPDATE service_log
        SET billed_at = NOW(),
            stripe_invoice_id = $1
      WHERE id = ANY($2::uuid[])`,
    [stripeInvoiceId, ids]
  );
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */

export async function listInvoicesForLandlord(
  landlordId: string,
  limit = 24
): Promise<LandlordInvoice[]> {
  const { rows } = await sql`
    SELECT * FROM landlord_invoices
     WHERE landlord_id = ${landlordId}
     ORDER BY period_start DESC, created_at DESC
     LIMIT ${limit}
  `;
  return rows as LandlordInvoice[];
}

export async function listInvoicesForProperty(
  propertyId: string,
  limit = 24
): Promise<LandlordInvoice[]> {
  const { rows } = await sql`
    SELECT * FROM landlord_invoices
     WHERE property_id = ${propertyId}
     ORDER BY period_start DESC, created_at DESC
     LIMIT ${limit}
  `;
  return rows as LandlordInvoice[];
}

export interface CreateInvoiceInput {
  landlord_id: string;
  property_id: string;
  period_start: string;
  period_end: string;
  stripe_invoice_id?: string | null;
  amount_cents?: number | null;
  status?: LandlordInvoiceStatus;
  hosted_invoice_url?: string | null;
  finalized_at?: string | null;
  error?: string | null;
}

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<LandlordInvoice> {
  const { rows } = await sql`
    INSERT INTO landlord_invoices (
      landlord_id, property_id, period_start, period_end,
      stripe_invoice_id, amount_cents, status, hosted_invoice_url,
      finalized_at, error
    ) VALUES (
      ${input.landlord_id},
      ${input.property_id},
      ${input.period_start},
      ${input.period_end},
      ${input.stripe_invoice_id ?? null},
      ${input.amount_cents ?? null},
      ${input.status ?? "draft"},
      ${input.hosted_invoice_url ?? null},
      ${input.finalized_at ?? null},
      ${input.error ?? null}
    )
    RETURNING *
  `;
  return rows[0] as LandlordInvoice;
}

export async function updateInvoiceFromStripe(
  stripeInvoiceId: string,
  patch: {
    status?: LandlordInvoiceStatus;
    amount_cents?: number;
    hosted_invoice_url?: string | null;
    paid_at?: string | null;
    finalized_at?: string | null;
  }
): Promise<LandlordInvoice | null> {
  const { rows } = await sql`
    UPDATE landlord_invoices SET
      status              = COALESCE(${patch.status ?? null}::landlord_invoice_status, status),
      amount_cents        = COALESCE(${patch.amount_cents ?? null}, amount_cents),
      hosted_invoice_url  = COALESCE(${patch.hosted_invoice_url ?? null}, hosted_invoice_url),
      paid_at             = COALESCE(${patch.paid_at ?? null}::timestamptz, paid_at),
      finalized_at        = COALESCE(${patch.finalized_at ?? null}::timestamptz, finalized_at)
    WHERE stripe_invoice_id = ${stripeInvoiceId}
    RETURNING *
  `;
  return (rows[0] as LandlordInvoice) ?? null;
}
