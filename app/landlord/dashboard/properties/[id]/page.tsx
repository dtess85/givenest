import { notFound } from "next/navigation";
import Link from "next/link";
import { requireLandlord } from "@/lib/auth/require-landlord";
import {
  getPropertyForOwner,
  listInvoicesForProperty,
  listServiceLogForProperty,
} from "@/lib/db/landlords";
import DashboardHeader from "../../DashboardHeader";

export const dynamic = "force-dynamic";

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
function fmtCents(cents: number | null | undefined, fractional = true): string {
  if (cents == null) return "—";
  return (fractional ? usd2 : usd0).format(cents / 100);
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SERVICE_KIND_LABEL: Record<string, string> = {
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  pest_control: "Pest control",
  maintenance: "Maintenance",
  utilities: "Utilities",
  other: "Other",
};

export default async function LandlordPropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, landlord } = await requireLandlord();

  // Authorization: getPropertyForOwner enforces owner_id match. If the URL
  // points at a property the landlord doesn't own (bookmark from a prior
  // owner, manual URL fiddling, etc.), return 404 — never leak existence.
  const property = await getPropertyForOwner(params.id, landlord.id);
  if (!property) notFound();

  const [serviceLog, invoices] = await Promise.all([
    listServiceLogForProperty(property.id, 100),
    listInvoicesForProperty(property.id, 24),
  ]);

  const unbilled = serviceLog.filter((e) => !e.billed_at && !e.tenant_chargeback);
  const unbilledTotal = unbilled.reduce((sum, e) => sum + e.amount_cents, 0);

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <DashboardHeader email={user.email ?? ""} />

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <Link href="/landlord/dashboard" className="mb-4 inline-block text-[12px] text-muted hover:text-coral">
          ← All properties
        </Link>
        <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em]">{property.address}</h1>
        <p className="mb-8 text-[14px] text-muted">
          {property.city}, {property.state} {property.zip ?? ""}
          {property.management_started_at && <> · Under management since {fmtDate(property.management_started_at)}</>}
          {" · "}Monthly fee {fmtCents(property.monthly_management_fee_cents, false)}
        </p>

        {/* Pending charges (will appear on next invoice) */}
        {unbilled.length > 0 && (
          <div className="mb-6 rounded-[10px] border border-[#FFE9C2] bg-[#FFF8E0] p-4">
            <div className="text-[13px] font-semibold text-[#8B6A00]">
              {unbilled.length} pending charge{unbilled.length === 1 ? "" : "s"} totaling {fmtCents(unbilledTotal)}
            </div>
            <div className="mt-1 text-[12px] text-[#8B6A00]/80">
              These will be invoiced on the 1st of next month, plus your {fmtCents(property.monthly_management_fee_cents, false)} management fee.
            </div>
          </div>
        )}

        {/* Service log */}
        <section className="rounded-[10px] border border-border bg-white p-6">
          <h2 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em]">Service log</h2>
          {serviceLog.length === 0 ? (
            <p className="text-[13px] text-muted">No service entries yet for this property.</p>
          ) : (
            <table className="w-full text-[14px]">
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="border-b border-border py-2 text-left">Date</th>
                  <th className="border-b border-border py-2 text-left">Service</th>
                  <th className="border-b border-border py-2 text-left">Vendor</th>
                  <th className="border-b border-border py-2 text-left">Description</th>
                  <th className="border-b border-border py-2 text-right">Amount</th>
                  <th className="border-b border-border py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {serviceLog.map((e) => (
                  <tr key={e.id}>
                    <td className="border-b border-border py-2 text-muted">{fmtDate(e.performed_at)}</td>
                    <td className="border-b border-border py-2">{SERVICE_KIND_LABEL[e.service_kind] ?? e.service_kind}</td>
                    <td className="border-b border-border py-2 text-muted">{e.vendor ?? "—"}</td>
                    <td className="border-b border-border py-2">{e.description}</td>
                    <td className="border-b border-border py-2 text-right">{fmtCents(e.amount_cents)}</td>
                    <td className="border-b border-border py-2">
                      {e.tenant_chargeback ? (
                        <span className="rounded-full bg-[#EEE8FF] px-2 py-0.5 text-[10px] font-semibold text-[#5E3ABF]">Tenant</span>
                      ) : e.billed_at ? (
                        <span className="rounded-full bg-[#E6F6EC] px-2 py-0.5 text-[10px] font-semibold text-[#1F7A40]">Billed {fmtDate(e.billed_at)}</span>
                      ) : (
                        <span className="rounded-full bg-[#FFF8E0] px-2 py-0.5 text-[10px] font-semibold text-[#8B6A00]">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Invoices */}
        <section className="mt-6 rounded-[10px] border border-border bg-white p-6">
          <h2 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em]">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-[13px] text-muted">
              Once your first month of service is billed, invoices will appear here with a link to the Stripe-hosted receipt.
            </p>
          ) : (
            <table className="w-full text-[14px]">
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="border-b border-border py-2 text-left">Period</th>
                  <th className="border-b border-border py-2 text-right">Amount</th>
                  <th className="border-b border-border py-2 text-left">Status</th>
                  <th className="border-b border-border py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const cls =
                    inv.status === "paid" ? "bg-[#E6F6EC] text-[#1F7A40]"
                    : inv.status === "open" ? "bg-[#E6F0FF] text-[#1F4FB8]"
                    : inv.status === "failed" ? "bg-[#FDE2E2] text-[#A31F1F]"
                    : "bg-[#F4F3EE] text-[#555]";
                  return (
                    <tr key={inv.id}>
                      <td className="border-b border-border py-2">
                        {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                      </td>
                      <td className="border-b border-border py-2 text-right">{fmtCents(inv.amount_cents)}</td>
                      <td className="border-b border-border py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{inv.status}</span>
                      </td>
                      <td className="border-b border-border py-2 text-right">
                        {inv.hosted_invoice_url && (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noopener" className="text-[12px] text-coral hover:underline">View</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
