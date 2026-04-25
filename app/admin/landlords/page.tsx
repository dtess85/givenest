import Link from "next/link";
import { listLandlords } from "@/lib/db/landlords";
import AdminHeader from "./AdminHeader";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminLandlordsPage() {
  const landlords = await listLandlords().catch(() => []);

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <AdminHeader trail={[
        { label: "Admin", href: "/admin" },
        { label: "Landlords" },
      ]} />

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Landlords</h1>
            <p className="text-[14px] text-muted">
              Property owners under management. Each landlord can have multiple properties; service log entries roll up into a monthly Stripe invoice on the 1st.
            </p>
          </div>
          <Link
            href="/admin/landlords/new"
            className="rounded-md bg-coral px-5 py-[10px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a]"
          >
            Invite landlord
          </Link>
        </div>

        {landlords.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border bg-white/50 p-8 text-center text-[13px] text-muted">
            No landlords yet. Click <span className="font-medium text-foreground">Invite landlord</span> to send a magic-link invite and create the first one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white">
            <table className="w-full text-[14px]">
              <thead className="border-b border-border bg-[#FAF9F6] text-[11px] font-medium uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Invited</th>
                  <th className="px-4 py-3 text-left">Billing</th>
                  <th className="px-4 py-3 text-left">Bound</th>
                </tr>
              </thead>
              <tbody>
                {landlords.map((l) => {
                  const billingState = l.billing_setup_at
                    ? "Set up"
                    : l.stripe_customer_id
                    ? "Started"
                    : "Pending";
                  return (
                    <tr
                      key={l.id}
                      className="border-b border-border last:border-b-0 hover:bg-[#FAF9F6]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/landlords/${l.id}`}
                          className="font-medium hover:text-coral"
                        >
                          {l.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{l.email}</td>
                      <td className="px-4 py-3 text-muted">{fmtDate(l.invited_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            l.billing_setup_at
                              ? "bg-[#E6F6EC] text-[#1F7A40]"
                              : l.stripe_customer_id
                              ? "bg-[#FFF8E0] text-[#8B6A00]"
                              : "bg-[#F4F3EE] text-[#555]"
                          }`}
                        >
                          {billingState}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {l.auth_user_id ? "✓" : "Awaiting login"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
