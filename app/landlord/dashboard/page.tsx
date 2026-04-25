import Link from "next/link";
import { requireLandlord } from "@/lib/auth/require-landlord";
import {
  listInvoicesForLandlord,
  listPropertiesForOwner,
} from "@/lib/db/landlords";
import DashboardHeader from "./DashboardHeader";

export const dynamic = "force-dynamic";

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
function fmtCents(cents: number | null | undefined, fractional = true): string {
  if (cents == null) return "—";
  return (fractional ? usd2 : usd0).format(cents / 100);
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function LandlordDashboardPage() {
  const { user, landlord } = await requireLandlord();
  const [properties, invoices] = await Promise.all([
    listPropertiesForOwner(landlord.id),
    listInvoicesForLandlord(landlord.id, 6),
  ]);

  const activeProperties = properties.filter((p) => p.status === "active");
  const lastInvoice = invoices[0] ?? null;

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <DashboardHeader email={user.email ?? ""} />

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">
          Hello, {landlord.name.split(" ")[0]}
        </h1>
        <p className="mb-8 text-[14px] text-muted">
          Your properties under Givenest management. Service log entries are billed monthly to your saved card.
        </p>

        {/* Top-row summary tiles */}
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SummaryTile label="Active properties" value={String(activeProperties.length)} sub={`${properties.length} total`} />
          <SummaryTile
            label="Billing"
            value={landlord.billing_setup_at ? "Set up" : "Not yet"}
            sub={landlord.billing_setup_at ? `Card on file since ${fmtDate(landlord.billing_setup_at)}` : "Add a payment method to enable monthly billing"}
            cta={landlord.billing_setup_at ? null : { href: "/landlord/dashboard/billing", label: "Set up billing →" }}
          />
          <SummaryTile
            label="Last invoice"
            value={lastInvoice ? fmtCents(lastInvoice.amount_cents) : "—"}
            sub={lastInvoice ? `${fmtDate(lastInvoice.period_start)} – ${fmtDate(lastInvoice.period_end)} · ${lastInvoice.status}` : "No invoices yet"}
          />
        </div>

        {/* Properties */}
        <section className="rounded-[10px] border border-border bg-white p-6">
          <h2 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em]">Your properties</h2>
          {properties.length === 0 ? (
            <p className="text-[13px] text-muted">
              No properties on file yet. Givenest staff will add them shortly after onboarding.
            </p>
          ) : (
            <div className="space-y-2">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/landlord/dashboard/properties/${p.id}`}
                  className="group flex items-center justify-between rounded-md border border-border bg-[#FAF9F6] p-3 transition-colors hover:border-coral"
                >
                  <div>
                    <div className="text-[14px] font-medium group-hover:text-coral">
                      {p.address}
                      {p.status !== "active" && (
                        <span className="ml-2 rounded-full bg-[#F4F3EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-muted">
                      {p.city}, {p.state} {p.zip ?? ""} · Monthly fee {fmtCents(p.monthly_management_fee_cents, false)}
                    </div>
                  </div>
                  <span className="text-[12px] text-muted group-hover:text-coral">View →</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent invoices snapshot */}
        {invoices.length > 0 && (
          <section className="mt-6 rounded-[10px] border border-border bg-white p-6">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-[20px] font-medium tracking-[-0.01em]">Recent invoices</h2>
              <span className="text-[12px] text-muted">Showing last {invoices.length}</span>
            </div>
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
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="border-b border-border py-2">{fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}</td>
                    <td className="border-b border-border py-2 text-right">{fmtCents(inv.amount_cents)}</td>
                    <td className="border-b border-border py-2">
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="border-b border-border py-2 text-right">
                      {inv.hosted_invoice_url && (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noopener" className="text-[12px] text-coral hover:underline">View</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  cta,
}: {
  label: string;
  value: string;
  sub?: string;
  cta?: { href: string; label: string } | null;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">{value}</div>
      {sub && <p className="mt-1 text-[12px] text-muted">{sub}</p>}
      {cta && (
        <Link href={cta.href} className="mt-3 inline-block text-[13px] font-medium text-coral hover:underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-[#E6F6EC] text-[#1F7A40]"
      : status === "open"
      ? "bg-[#E6F0FF] text-[#1F4FB8]"
      : status === "failed"
      ? "bg-[#FDE2E2] text-[#A31F1F]"
      : "bg-[#F4F3EE] text-[#555]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>
  );
}
