import { notFound } from "next/navigation";
import Link from "next/link";
import { getCharityBySlug } from "@/lib/db/charities";
import { getTransactionsByCharityId } from "@/lib/db/transactions";
import { fmt } from "@/lib/utils";

export const revalidate = 60;

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CharityProfilePage({ params }: { params: { slug: string } }) {
  const charity = await getCharityBySlug(params.slug);
  if (!charity || charity.status === "suspended") notFound();

  const transactions = await getTransactionsByCharityId(charity.id);
  const visibleTransactions = transactions.filter(
    (t) => t.agent_share_consent || t.client_share_consent || t.property_address
  );

  const embedUrl = charity.video_url
    ? charity.video_url
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "www.youtube.com/embed/")
    : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden bg-black">
        {charity.cover_image_url ? (
          <>
            <img
              src={charity.cover_image_url}
              alt={charity.name}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 100%)" }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]" />
        )}
        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-8 py-12">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {charity.category && (
              <span className="rounded-full bg-coral px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                {charity.category}
              </span>
            )}
            {charity.is_partner && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                Partner
              </span>
            )}
            {charity.is_featured && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                Featured
              </span>
            )}
          </div>
          <h1
            className="mb-2 font-serif text-[clamp(32px,5vw,56px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {charity.name}
          </h1>
          {charity.tagline && (
            <p className="text-[17px] font-light text-white/80" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
              {charity.tagline}
            </p>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-black/95 px-8 py-5">
        <div className="mx-auto flex max-w-[1100px] flex-wrap gap-10">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Total donated</div>
            <div className="font-serif text-[28px] font-semibold text-coral">{fmt(Number(charity.total_donated))}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Closings</div>
            <div className="font-serif text-[28px] font-semibold text-white">{charity.total_closings}</div>
          </div>
          {charity.city && (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Location</div>
              <div className="font-serif text-[28px] font-semibold text-white">{charity.city}{charity.state && charity.state !== "AZ" ? "" : charity.state ? `, ${charity.state}` : ""}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-14">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="flex flex-col gap-12">

            {/* About */}
            {(charity.description || charity.mission) && (
              <section>
                <h2 className="mb-5 font-serif text-[24px] font-medium tracking-[-0.01em]">About</h2>
                {charity.description && (
                  <p className="mb-4 text-[15px] font-light leading-[1.8] text-[#3a3834]">{charity.description}</p>
                )}
                {charity.mission && (
                  <div className="rounded-[10px] border border-border bg-[#F4F3EE] p-5">
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Mission</div>
                    <p className="text-[15px] font-light leading-[1.7] text-[#3a3834]">{charity.mission}</p>
                  </div>
                )}
              </section>
            )}

            {/* Video */}
            {embedUrl && (
              <section>
                <h2 className="mb-5 font-serif text-[24px] font-medium tracking-[-0.01em]">Video</h2>
                <div className="overflow-hidden rounded-[10px] border border-border" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allowFullScreen
                    title={`${charity.name} video`}
                  />
                </div>
              </section>
            )}

            {/* Gallery */}
            {charity.gallery_urls && charity.gallery_urls.length > 0 && (
              <section>
                <h2 className="mb-5 font-serif text-[24px] font-medium tracking-[-0.01em]">Gallery</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {charity.gallery_urls.map((url, i) => (
                    <div key={i} className="overflow-hidden rounded-[8px] border border-border" style={{ aspectRatio: "4/3" }}>
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Transaction history */}
            {visibleTransactions.length > 0 && (
              <section>
                <h2 className="mb-2 font-serif text-[24px] font-medium tracking-[-0.01em]">Giving history</h2>
                <p className="mb-5 text-[13px] font-light text-muted">Every Givenest closing that selected {charity.name}.</p>
                <div className="overflow-hidden rounded-[10px] border border-border">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-[#F4F3EE]">
                        <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-muted">Property</th>
                        <th className="px-4 py-3 text-left font-medium text-muted">Donated</th>
                        <th className="px-4 py-3 text-left font-medium text-muted">Agent</th>
                        <th className="px-4 py-3 text-left font-medium text-muted">Client</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-[#faf9f7]"}>
                          <td className="px-4 py-3 text-muted">{formatDate(t.closing_date)}</td>
                          <td className="px-4 py-3">
                            {t.property_address
                              ? `${t.property_address}${t.property_city ? `, ${t.property_city}` : ""}`
                              : <span className="text-muted">—</span>}
                          </td>
                          <td className="px-4 py-3 font-medium text-coral">{fmt(Number(t.amount))}</td>
                          <td className="px-4 py-3">
                            {t.agent_share_consent && t.agent_name ? t.agent_name : <span className="text-muted">Anonymous</span>}
                          </td>
                          <td className="px-4 py-3">
                            {t.client_share_consent && t.client_name ? t.client_name : <span className="text-muted">Anonymous</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* CTA card */}
            <div className="rounded-[12px] border border-border bg-[#F4F3EE] p-6">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Support this cause</div>
              <p className="mb-5 text-[14px] font-light leading-[1.7] text-[#3a3834]">
                Choose {charity.name} as your charity when buying or selling with Givenest. We&apos;ll donate 25% of our commission at closing — at no cost to you.
              </p>
              <Link
                href="/sell"
                className="mb-2 block w-full rounded-md bg-coral py-[11px] text-center text-sm font-medium text-white transition-colors hover:bg-[#d4574a]"
              >
                Sell your home
              </Link>
              <Link
                href="/buy"
                className="block w-full rounded-md border border-border bg-white py-[11px] text-center text-sm font-medium text-black transition-colors hover:border-coral hover:text-coral"
              >
                Browse homes
              </Link>
            </div>

            {/* Details */}
            <div className="rounded-[12px] border border-border bg-white p-6">
              <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Details</div>
              <div className="flex flex-col gap-3">
                {charity.ein && (
                  <div>
                    <div className="text-[11px] text-muted">EIN</div>
                    <div className="text-[14px] font-medium">{charity.ein}</div>
                  </div>
                )}
                {charity.category && (
                  <div>
                    <div className="text-[11px] text-muted">Category</div>
                    <div className="text-[14px] font-medium">{charity.category}</div>
                  </div>
                )}
                {charity.city && (
                  <div>
                    <div className="text-[11px] text-muted">Location</div>
                    <div className="text-[14px] font-medium">{charity.city}{charity.state ? `, ${charity.state}` : ""}</div>
                  </div>
                )}
                {charity.website && (
                  <div>
                    <div className="text-[11px] text-muted">Website</div>
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-medium text-coral hover:underline"
                    >
                      {charity.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Claim profile */}
            {!charity.is_partner && (
              <div className="rounded-[12px] border border-dashed border-border p-6 text-center">
                <div className="mb-2 text-[13px] font-medium">Is this your organization?</div>
                <p className="mb-4 text-[12px] font-light text-muted">Claim this profile to add photos, videos, and your full story.</p>
                <Link
                  href="/charity/login"
                  className="inline-block rounded-md border border-border px-4 py-2 text-[12px] font-medium text-black transition-colors hover:border-coral hover:text-coral"
                >
                  Claim profile →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
