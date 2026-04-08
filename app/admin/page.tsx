import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllCharities } from "@/lib/db/charities";
import { fmt } from "@/lib/utils";

export default async function AdminDashboard() {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    redirect("/");
  }

  const charities = await getAllCharities();

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium text-white">give<span className="text-coral">nest</span></a>
            <span className="text-white/30">|</span>
            <span className="text-[13px] text-white/60">Admin</span>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/listings" className="rounded-md border border-white/20 px-4 py-2 text-[13px] font-medium text-white hover:bg-white/10">
              Listings
            </Link>
            <Link href="/admin/transactions/new" className="rounded-md bg-coral px-4 py-2 text-[13px] font-medium text-white hover:bg-[#d4574a]">
              + Log closing
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em]">Charities</h1>
          <span className="text-[13px] text-muted">{charities.length} total</span>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-[#F4F3EE]">
                <th className="px-5 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-5 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-5 py-3 text-left font-medium text-muted">Closings</th>
                <th className="px-5 py-3 text-left font-medium text-muted">Total donated</th>
                <th className="px-5 py-3 text-left font-medium text-muted">Subscription</th>
                <th className="px-5 py-3 text-left font-medium text-muted"></th>
              </tr>
            </thead>
            <tbody>
              {charities.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-[#faf9f7]">
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted">{c.city}{c.state ? `, ${c.state}` : ""}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.is_featured && <span className="rounded-full bg-coral/10 px-2 py-[2px] text-[10px] font-medium text-coral">Featured</span>}
                      {c.is_partner && <span className="rounded-full bg-black/10 px-2 py-[2px] text-[10px] font-medium">Partner</span>}
                      <span className={`rounded-full px-2 py-[2px] text-[10px] font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {c.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.total_closings}</td>
                  <td className="px-5 py-3 font-medium text-coral">{fmt(Number(c.total_donated))}</td>
                  <td className="px-5 py-3 text-muted">{c.subscription_status ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/charities/${c.id}`} className="text-coral hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
