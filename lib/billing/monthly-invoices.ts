/**
 * Monthly invoice rollup. Shared between:
 *   - `/api/cron/monthly-invoices` — fires on the 1st via Vercel Cron
 *   - `/api/admin/landlords/[id]/generate-invoice` — manual admin trigger
 *
 * Per landlord, per active property:
 *   1. Pull unbilled, non-tenant-chargeback service log rows for the period
 *   2. Skip if no rows AND no monthly_management_fee
 *   3. Create a draft Stripe Invoice (charge_automatically + auto_advance)
 *   4. Push one invoice item per service log row + one for the management fee
 *   5. Finalize the invoice (Stripe attempts payment automatically)
 *   6. Insert local landlord_invoices row + mark service_log rows billed
 *
 * Errors per-property are caught and recorded as a `failed` landlord_invoices
 * row — the loop continues so one broken property doesn't kill the whole
 * cron run.
 *
 * Period boundaries are computed in America/Phoenix to match the cron's
 * intended "the month that just ended" semantics. Vercel cron schedules run
 * UTC, but our customers think in Phoenix calendar time.
 */

import { sql } from "@/lib/db/index";
import {
  createInvoice,
  listActivePropertiesForOwner,
  listLandlordsReadyForBilling,
  listUnbilledServiceLog,
  markServiceLogBilled,
  type Landlord,
  type PropertyMgmt,
  type ServiceLogEntry,
} from "@/lib/db/landlords";
import { getStripe } from "@/lib/stripe";
import { sendInvoiceFinalized } from "@/lib/email/landlord";

const SERVICE_KIND_LABEL: Record<string, string> = {
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  pest_control: "Pest control",
  maintenance: "Maintenance",
  utilities: "Utilities",
  other: "Other",
};

export interface BillingPeriod {
  /** YYYY-MM-DD inclusive */
  startDate: string;
  /** YYYY-MM-DD inclusive (last day of the month) */
  endDate: string;
  /** Human-readable label, e.g. "April 2026" */
  label: string;
}

/**
 * Compute "last calendar month" in America/Phoenix. We don't trust UTC
 * because the cron may fire just-after midnight UTC on the 1st, which is
 * ~5pm Phoenix the prior day — already in the period we want to close.
 *
 * Strategy: take "now" formatted in Phoenix to extract year/month, then
 * subtract one month to get the period bounds. Stays correct around DST.
 */
export function periodForLastMonth(now: Date = new Date()): BillingPeriod {
  // Extract year + month in Phoenix.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const phxYear = Number(ymd.find((p) => p.type === "year")!.value);
  const phxMonth = Number(ymd.find((p) => p.type === "month")!.value);

  // Subtract one month — handle Jan → Dec wrap.
  let year = phxYear;
  let month = phxMonth - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); // month is 1-indexed; day=0 wraps back to last day
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const label = new Date(`${startDate}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/Phoenix",
  });
  return { startDate, endDate, label };
}

export interface GenerateResult {
  landlord_id: string;
  created: number;
  skipped: number;
  failed: number;
  invoices: Array<{
    property_id: string;
    address: string;
    amount_cents: number;
    stripe_invoice_id?: string;
    status: string;
    error?: string;
  }>;
}

/**
 * Generate (at most) one Stripe invoice per active property for the given
 * landlord and period. Idempotent at the service-log level: a service log
 * row with `billed_at IS NOT NULL` is skipped, so re-running this for the
 * same period will just produce zero new invoices.
 */
export async function generateInvoicesForLandlord(
  landlord: Landlord,
  period: BillingPeriod
): Promise<GenerateResult> {
  const result: GenerateResult = {
    landlord_id: landlord.id,
    created: 0,
    skipped: 0,
    failed: 0,
    invoices: [],
  };

  if (!landlord.billing_setup_at || !landlord.default_payment_method_id || !landlord.stripe_customer_id) {
    // Skip the whole landlord — no card on file means we can't charge them.
    // Caller (cron / admin) sees `skipped` and can surface a hint.
    result.skipped = 1;
    return result;
  }

  const properties = await listActivePropertiesForOwner(landlord.id);
  for (const property of properties) {
    try {
      const inv = await generateInvoiceForProperty(landlord, property, period);
      if (inv === "skipped") {
        result.skipped += 1;
      } else {
        result.created += 1;
        result.invoices.push(inv);
      }
    } catch (err) {
      result.failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      // Persist the failure so admins can find it without crawling logs.
      await createInvoice({
        landlord_id: landlord.id,
        property_id: property.id,
        period_start: period.startDate,
        period_end: period.endDate,
        status: "failed",
        error: msg,
      });
      result.invoices.push({
        property_id: property.id,
        address: property.address,
        amount_cents: 0,
        status: "failed",
        error: msg,
      });
      console.error(`[monthly-invoices] property ${property.id} failed:`, err);
    }
  }
  return result;
}

async function generateInvoiceForProperty(
  landlord: Landlord,
  property: PropertyMgmt,
  period: BillingPeriod
): Promise<
  | "skipped"
  | {
      property_id: string;
      address: string;
      amount_cents: number;
      stripe_invoice_id: string;
      status: string;
    }
> {
  // Fetch service log rows that fall in or before the period and aren't
  // billed yet. Using `performed_at < period_end + 1d` would be cleaner —
  // but our helper takes a single date threshold, so pass the day AFTER
  // period_end so a charge dated on the last day of the month is included.
  const dayAfterEnd = addDaysISO(period.endDate, 1);
  const entries = await listUnbilledServiceLog(property.id, dayAfterEnd);

  const fee = property.monthly_management_fee_cents;
  if (entries.length === 0 && fee === 0) {
    return "skipped";
  }

  const stripe = getStripe();

  // Create the invoice shell first. `pending_invoice_items_behavior: 'exclude'`
  // would normally apply, but we're explicitly attaching items via the
  // `invoice` param on each invoiceItems.create call. Auto-advance flips
  // Stripe into "finalize then charge" mode without a manual finalize call;
  // we still call finalizeInvoice below to surface the hosted_invoice_url
  // synchronously.
  const stripeInvoice = await stripe.invoices.create({
    customer: landlord.stripe_customer_id!,
    collection_method: "charge_automatically",
    auto_advance: true,
    default_payment_method: landlord.default_payment_method_id!,
    description: `${property.address} — ${period.label}`,
    metadata: {
      landlord_id: landlord.id,
      property_id: property.id,
      period_start: period.startDate,
      period_end: period.endDate,
    },
    pending_invoice_items_behavior: "exclude",
  });

  if (!stripeInvoice.id) {
    throw new Error("Stripe invoice has no id");
  }

  for (const entry of entries) {
    await stripe.invoiceItems.create({
      customer: landlord.stripe_customer_id!,
      invoice: stripeInvoice.id,
      amount: entry.amount_cents,
      currency: entry.currency,
      description: invoiceItemDescription(entry),
    });
  }
  if (fee > 0) {
    await stripe.invoiceItems.create({
      customer: landlord.stripe_customer_id!,
      invoice: stripeInvoice.id,
      amount: fee,
      currency: "usd",
      description: `Property management fee — ${period.label}`,
    });
  }

  const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

  // Persist locally + lock the service log rows in a single transaction
  // (sql is auto-committed per call here, so we order them so a partial
  // failure leaves the rows un-billed for retry, not orphaned).
  const localInvoice = await createInvoice({
    landlord_id: landlord.id,
    property_id: property.id,
    period_start: period.startDate,
    period_end: period.endDate,
    stripe_invoice_id: finalized.id ?? stripeInvoice.id,
    amount_cents: typeof finalized.amount_due === "number" ? finalized.amount_due : null,
    status: "open",
    hosted_invoice_url: finalized.hosted_invoice_url ?? null,
    finalized_at: new Date().toISOString(),
  });
  if (entries.length > 0) {
    await markServiceLogBilled(
      entries.map((e) => e.id),
      finalized.id ?? stripeInvoice.id
    );
  }

  // Branded "your invoice is ready" email. Fire-and-forget — webhook will
  // also catch any payment-success/failure events and email separately.
  void sendInvoiceFinalized(landlord, property, localInvoice);

  return {
    property_id: property.id,
    address: property.address,
    amount_cents: typeof finalized.amount_due === "number" ? finalized.amount_due : 0,
    stripe_invoice_id: finalized.id ?? stripeInvoice.id,
    status: "open",
  };
}

function invoiceItemDescription(entry: ServiceLogEntry): string {
  const kind = SERVICE_KIND_LABEL[entry.service_kind] ?? entry.service_kind;
  const date = new Date(entry.performed_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const vendor = entry.vendor ? ` · ${entry.vendor}` : "";
  return `${kind} (${date}): ${entry.description}${vendor}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z"); // noon UTC avoids DST edge cases
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Cron-side entry point: run `generateInvoicesForLandlord` for every
 * landlord with billing set up. Returns an aggregate summary the cron
 * route logs and surfaces in its response.
 */
export async function runMonthlyInvoiceCron(): Promise<{
  period: BillingPeriod;
  landlord_count: number;
  created: number;
  skipped: number;
  failed: number;
}> {
  const period = periodForLastMonth();
  const landlords = await listLandlordsReadyForBilling();
  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const landlord of landlords) {
    const r = await generateInvoicesForLandlord(landlord, period);
    created += r.created;
    skipped += r.skipped;
    failed += r.failed;
  }
  // Touch a sentinel so the cron's audit trail is queryable from SQL too.
  // No-op SELECT — the actual run record lives in `landlord_invoices` rows.
  void sql; // keep import live if we add an audit row later
  return { period, landlord_count: landlords.length, created, skipped, failed };
}
