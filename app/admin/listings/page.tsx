import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllManualListings } from "@/lib/db/listings";

function fmt(n: number) {
  return "$" + n.toLocaleString();
}

export default async function AdminListingsPage() {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    redirect("/");
  }

  const listings = await getAllManualListings();

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium text-white">give<span className="text-coral">nest</span></a>
            <span className="text-white/30">|</span>
            <span className="text-[13px] text-white/60">Admin</span>
            <span className="text-white/30">|</span>
            <span className="text-[13px] text-white/60">Listings</span>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="rounded-md border border-white/20 px-4 py-2 text-[13px] font-medium text-white hover:bg-white/10">
              ← Dashboard
            </Link>
            <Link href="/admin/listings/new" className="rounded-md bg-coral px-4 py-2 text-[13px] font-medium text-white hover:bg-[#d4574a]">
              + Add listing
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em]">Manual Listings</h1>
            <p className="mt-1 text-[13px] text-muted">Coming Soon and off-IDX properties pinned to the top of the buy page.</p>
          </div>
          <span className="text-[13px] text-muted">{listings.length} total</span>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-[10px] border border-border bg-white p-12 text-center">
            <div className="mb-3 text-[32px]">🏠</div>
            <div className="font-medium text-[#2a2825]">No listings yet</div>
            <div className="mt-1 text-[13px] text-muted">Add a Coming Soon or off-IDX listing to pin it to the top of the buy page.</div>
            <Link href="/admin/listings/new" className="mt-4 inline-block rounded-md bg-coral px-5 py-2 text-[13px] font-medium text-white hover:bg-[#d4574a]">
              Add your first listing
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-[#F4F3EE]">
                  <th className="px-5 py-3 text-left font-medium text-muted">Address</th>
                  <th className="px-5 py-3 text-left font-medium text-muted">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted">Price</th>
                  <th className="px-5 py-3 text-left font-medium text-muted">MLS #</th>
                  <th className="px-5 py-3 text-left font-medium text-muted">Active</th>
                  <th className="px-5 py-3 text-left font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-[#faf9f7]">
                    <td className="px-5 py-3">
                      <div className="font-medium">{l.address}</div>
                      <div className="text-[11px] text-muted">{l.city}, {l.state}{l.zip ? ` ${l.zip}` : ""}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-[2px] text-[10px] font-medium ${
                        l.status === "Coming Soon" ? "bg-blue-100 text-blue-700" :
                        l.status === "For Sale" || l.status === "Active" ? "bg-green-100 text-green-700" :
                        l.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {l.status ?? "Coming Soon"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{fmt(Number(l.price))}</td>
                    <td className="px-5 py-3 text-muted">{l.mls_number ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-[2px] text-[10px] font-medium ${l.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {l.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/listings/${l.id}`} className="text-coral hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
