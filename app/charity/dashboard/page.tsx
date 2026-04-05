import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCharityByClerkUserId } from "@/lib/db/charities";
import { getTransactionsByCharityId } from "@/lib/db/transactions";
import { fmt } from "@/lib/utils";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CharityDashboard() {
  const user = await currentUser();
  if (!user) redirect("/charity/login");
  const userId = user.id;

  const charity = await getCharityByClerkUserId(userId);
  if (!charity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] px-8">
        <div className="max-w-[480px] text-center">
          <h1 className="mb-3 font-serif text-[28px] font-medium">No profile linked</h1>
          <p className="mb-6 text-[14px] font-light text-muted">
            Your account isn&apos;t linked to a charity profile yet. Contact Givenest at{" "}
            <a href="mailto:dustin@givenest.com" className="text-coral hover:underline">dustin@givenest.com</a>{" "}
            to get set up.
          </p>
          <Link href="/" className="text-[13px] text-coral hover:underline">← Back to givenest.com</Link>
        </div>
      </div>
    );
  }

  const transactions = await getTransactionsByCharityId(charity.id);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {/* Header */}
      <div className="border-b border-border bg-white px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium">
              give<span className="text-coral">nest</span>
            </a>
            <span className="text-border">|</span>
            <span className="text-[13px] text-muted">Partner Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/charities/${charity.slug}`} className="text-[13px] text-muted hover:text-black">
              View profile →
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em]">{charity.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-[2px] text-[11px] font-medium uppercase tracking-[0.05em] ${
              charity.subscription_status === "active" ? "bg-green-100 text-green-700" :
              charity.is_featured ? "bg-coral/10 text-coral" : "bg-border text-muted"
            }`}>
              {charity.subscription_status === "active" ? "Partner — Active" : charity.is_featured ? "Featured" : charity.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total donated by Givenest", value: fmt(Number(charity.total_donated)), large: true },
            { label: "Closings", value: String(charity.total_closings) },
            { label: "Subscription", value: charity.subscription_status === "active" ? "Active" : "Inactive" },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] border border-border bg-white p-5">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{s.label}</div>
              <div className={`font-serif font-semibold ${s.large ? "text-[28px] text-coral" : "text-[22px]"}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/charity/dashboard/profile" className="flex items-center justify-between rounded-[10px] border border-border bg-white p-4 hover:border-coral transition-colors">
            <div>
              <div className="text-[14px] font-medium">Edit profile</div>
              <div className="text-[12px] text-muted">Photos, description, links</div>
            </div>
            <span className="text-muted">→</span>
          </Link>
          <Link href="/charity/dashboard/billing" className="flex items-center justify-between rounded-[10px] border border-border bg-white p-4 hover:border-coral transition-colors">
            <div>
              <div className="text-[14px] font-medium">Billing</div>
              <div className="text-[12px] text-muted">Manage subscription</div>
            </div>
            <span className="text-muted">→</span>
          </Link>
          <Link href={`/charities/${charity.slug}`} className="flex items-center justify-between rounded-[10px] border border-border bg-white p-4 hover:border-coral transition-colors">
            <div>
              <div className="text-[14px] font-medium">Public profile</div>
              <div className="text-[12px] text-muted">See how donors see you</div>
            </div>
            <span className="text-muted">→</span>
          </Link>
        </div>

        {/* Recent transactions */}
        <div className="rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-[18px] font-medium">Recent giving history</h2>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-[14px] text-muted">
              No closings recorded yet. Givenest will update this when a transaction is completed in your name.
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-[#faf9f7]">
                  <th className="px-5 py-3 text-left font-medium text-muted">Date</th>
                  <th className="px-5 py-3 text-left font-medium text-muted">Property</th>
                  <th className="px-5 py-3 text-left font-medium text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-muted">{formatDate(t.closing_date)}</td>
                    <td className="px-5 py-3">{t.property_address || "—"}</td>
                    <td className="px-5 py-3 font-medium text-coral">{fmt(Number(t.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
