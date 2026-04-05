"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug, AGENTS } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
import { calcGivingPool } from "@/lib/commission";
import GivingPanel from "@/components/GivingPanel";

export default function PropertyDetail() {
  const params = useParams();
  const property = getPropertyBySlug(params.address as string);

  const [descExpanded, setDescExpanded] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  const [submittedAgents, setSubmittedAgents] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  if (!property) {
    return (
      <div className="mx-auto max-w-[1100px] px-8 py-20 text-center">
        <h1 className="font-serif text-2xl font-medium">Property not found</h1>
        <Link href="/buy" className="mt-4 inline-block text-sm text-coral hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const estimatedDonation = property.donation ?? calcGivingPool(property.price);
  const pricePerSqft = Math.round(property.price / property.sqft);

  const listingUpdated = property.listingDate
    ? new Date(property.listingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <Link
        href="/buy"
        className="mb-5 inline-block text-[13px] text-muted transition-colors hover:text-black"
      >
        ← Back to search
      </Link>

      {/* Two-column grid: content left, GivingPanel right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-8">

          {/* Photo Gallery */}
          {(() => {
            const imgs = property.images ?? [];
            const hasMany = imgs.length > 1;
            return (
              <>
                {hasMany ? (
                  /* Multi-photo grid */
                  <div className="relative grid h-[460px] grid-cols-2 gap-1 overflow-hidden rounded-[12px]">
                    <div className="relative cursor-pointer" onClick={() => setPhotoModalOpen(true)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgs[0]} alt={property.address} className="h-full w-full object-cover" />
                    </div>
                    <div className="grid grid-rows-2 gap-1">
                      <div className="grid grid-cols-2 gap-1">
                        {[1, 2].map((i) => (
                          <div key={i} className="relative cursor-pointer overflow-hidden bg-[#E8E6E0]" onClick={() => setPhotoModalOpen(true)}>
                            {imgs[i] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgs[i]} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {[3, 4].map((i) => (
                          <div key={i} className="relative cursor-pointer overflow-hidden bg-[#D5D1CA]" onClick={() => setPhotoModalOpen(true)}>
                            {imgs[i] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgs[i]} alt="" className="h-full w-full object-cover" />
                            ) : null}
                            {i === 4 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setPhotoModalOpen(true); }}
                                className="absolute bottom-3 right-3 rounded-full border border-white/60 bg-black/50 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                              >
                                View all photos
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single photo — full width, clickable */
                  <div
                    className={`relative h-[460px] overflow-hidden rounded-[12px] bg-[#E8E6E0] ${imgs[0] ? "cursor-pointer" : ""}`}
                    onClick={() => imgs[0] && setPhotoModalOpen(true)}
                  >
                    {imgs[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgs[0]} alt={property.address} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-10 w-10 text-[#C4C0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

              </>
            );
          })()}

          {/* Address + stats bar */}
          <div>
            {property.status ? (
              <span className={`mb-2 inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.07em] ${
                property.status === "For Sale"    ? "border-green-200 bg-green-50 text-green-700" :
                property.status === "Pending"     ? "border-yellow-200 bg-yellow-50 text-yellow-700" :
                property.status === "Contingent"  ? "border-orange-200 bg-orange-50 text-orange-700" :
                property.status === "Coming Soon" ? "border-blue-200 bg-blue-50 text-blue-700" :
                property.status === "Sold"        ? "border-red-200 bg-red-50 text-red-700" :
                "border-border bg-[#F0EDE7] text-muted"
              }`}>
                <span className={`h-[6px] w-[6px] rounded-full ${
                  property.status === "For Sale"    ? "bg-green-500" :
                  property.status === "Pending"     ? "bg-yellow-500" :
                  property.status === "Contingent"  ? "bg-orange-500" :
                  property.status === "Coming Soon" ? "bg-blue-500" :
                  property.status === "Sold"        ? "bg-red-500" :
                  "bg-muted"
                }`} />
                {property.status}
              </span>
            ) : (
              <div className="mb-2 inline-block rounded-full bg-[#F0EDE7] px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.07em] text-muted">
                {property.type}
              </div>
            )}
            <h1 className="mb-[2px] font-serif text-[28px] font-medium tracking-[-0.02em] leading-tight">
              {property.address}
            </h1>
            <p className="mb-4 text-[14px] text-muted">{property.city}</p>

            {/* Stat pills */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                ["Price", fmt(property.price)],
                ["Beds", String(property.beds)],
                ["Baths", String(property.baths)],
                ["Sqft", property.sqft.toLocaleString()],
              ].map(([label, value], i, arr) => (
                <div key={label} className="flex items-center gap-5">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted">{label}</div>
                    <div className="text-[15px] font-semibold">{value}</div>
                  </div>
                  {i < arr.length - 1 && <div className="h-6 w-px bg-border" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── About this home ── */}
          {property.description && (() => {
            const LIMIT = 300;
            const isLong = property.description!.length > LIMIT;
            const displayed = isLong && !descExpanded
              ? property.description!.slice(0, LIMIT).trimEnd() + "…"
              : property.description!;
            return (
              <div className="border-t border-border pt-6">
                <h2 className="mb-3 font-serif text-[20px] font-medium tracking-[-0.01em]">About this home</h2>
                <p className="text-[14px] leading-relaxed text-[#4a4845]">{displayed}</p>
                {isLong && (
                  <button
                    onClick={() => setDescExpanded((e) => !e)}
                    className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-coral hover:underline"
                  >
                    {descExpanded ? "Show less" : "Show more"}
                    <svg
                      className={`h-4 w-4 transition-transform ${descExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })()}

          {/* ── Property Details ── */}
          <div className="border-t border-border pt-6">
            <h2 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em]">Property details</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

              {/* Property Type */}
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[#FAFAF8] px-4 py-4">
                <svg className="h-6 w-6 flex-shrink-0 text-[#6b6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">{property.type}</div>
                  <div className="text-[12px] text-muted">Property Type</div>
                </div>
              </div>

              {/* Year Built */}
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[#FAFAF8] px-4 py-4">
                <svg className="h-6 w-6 flex-shrink-0 text-[#6b6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">{property.yearBuilt ?? "—"}</div>
                  <div className="text-[12px] text-muted">Year Built</div>
                </div>
              </div>

              {/* Lot Size */}
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[#FAFAF8] px-4 py-4">
                <svg className="h-6 w-6 flex-shrink-0 text-[#6b6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">{property.lotSize ?? "—"}</div>
                  <div className="text-[12px] text-muted">Lot Size</div>
                </div>
              </div>

              {/* Price / Sq Ft */}
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[#FAFAF8] px-4 py-4">
                <svg className="h-6 w-6 flex-shrink-0 text-[#6b6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.657 48.657 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                </svg>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">${pricePerSqft.toLocaleString()}</div>
                  <div className="text-[12px] text-muted">Price/Sq.Ft.</div>
                </div>
              </div>

              {/* HOA Dues */}
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[#FAFAF8] px-4 py-4">
                <svg className="h-6 w-6 flex-shrink-0 text-[#6b6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">
                    {property.hoaDues === 0 ? "None" : property.hoaDues ? `$${property.hoaDues}/mo` : "—"}
                  </div>
                  <div className="text-[12px] text-muted">HOA Dues</div>
                </div>
              </div>

              {/* Parking */}
              <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[#FAFAF8] px-4 py-4">
                <svg className="h-6 w-6 flex-shrink-0 text-[#6b6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">{property.parking ?? "—"}</div>
                  <div className="text-[12px] text-muted">Parking</div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Listed by ── */}
          <div className="border-t border-border pt-5 pb-4">
            <p className="mb-4 text-[13px] text-muted">
              Listed by <span className="font-medium text-[#2a2825]">Kyndall Yates</span>
              <span className="mx-2 text-border">•</span>
              <span className="font-medium text-[#2a2825]">Givenest</span>
            </p>

            {/* Listing metadata */}
            <div className="flex flex-col gap-[6px] text-[12px] text-muted">
              {listingUpdated && (
                <div className="flex items-center gap-2">
                  <span className="text-[#b0ada6]">
                    <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>Listing updated: <span className="text-[#4a4845]">{listingUpdated}</span></span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[#b0ada6]">
                  <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span>Last checked: <span className="text-[#4a4845]">{today}</span></span>
              </div>
              {property.mlsNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-[#b0ada6]">
                    <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                    </svg>
                  </span>
                  <span>Source: <span className="text-[#4a4845]">Arizona MLS #{property.mlsNumber}</span></span>
                </div>
              )}
              {property.daysOnMarket != null && (
                <div className="flex items-center gap-2">
                  <span className="text-[#b0ada6]">
                    <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span><span className="text-[#4a4845] font-medium">{property.daysOnMarket} days</span> on market</span>
                </div>
              )}
            </div>
          </div>

        </div>
        {/* ── END LEFT COLUMN ── */}

        {/* ── RIGHT SIDEBAR ── */}
        <div className="sticky top-[68px] flex flex-col gap-4">

          {/* Contact an agent */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Contact an agent</h3>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {AGENTS.map((a) => {
                const isActive = activeAgent === a.initials;
                const isSubmitted = submittedAgents.has(a.initials);
                return (
                  <div key={a.initials}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                        {a.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium">{a.name}</div>
                        <a href={`mailto:${a.email}`} className="block text-[11px] text-coral hover:underline truncate">{a.email}</a>
                        <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="block text-[11px] text-muted hover:text-black">{a.phone}</a>
                      </div>
                      <button
                        onClick={() => {
                          if (!isSubmitted) {
                            setActiveAgent(isActive ? null : a.initials);
                            setFormData({ name: "", email: "", phone: "" });
                          }
                        }}
                        className={`flex-shrink-0 rounded-md border px-3 py-[6px] text-[12px] transition-all ${
                          isSubmitted
                            ? "border-border text-muted cursor-default"
                            : isActive
                            ? "border-coral text-coral"
                            : "border-border hover:border-coral hover:text-coral"
                        }`}
                      >
                        {isSubmitted ? "✓ Sent" : "Contact"}
                      </button>
                    </div>

                    {isActive && !isSubmitted && (
                      <div className="border-t border-border bg-[#FAFAF8] px-4 py-3">
                        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Your contact info</div>
                        <div className="flex flex-col gap-2">
                          <input
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                            placeholder="Full name"
                            value={formData.name}
                            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                          />
                          <input
                            type="email"
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                          />
                          <input
                            type="tel"
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                            placeholder="Phone (optional)"
                            value={formData.phone}
                            onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                          />
                          <button
                            onClick={async () => {
                              if (!formData.name || !formData.email) return;
                              setSending(true);
                              try {
                                await fetch("/api/agent-request", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    name: formData.name,
                                    email: formData.email,
                                    phone: formData.phone,
                                    agentName: a.name,
                                    propertyAddress: property.address,
                                  }),
                                });
                              } finally {
                                setSending(false);
                                setSubmittedAgents((prev) => new Set(prev).add(a.initials));
                                setActiveAgent(null);
                              }
                            }}
                            disabled={!formData.name || !formData.email || sending}
                            className={`w-full rounded-md bg-coral py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
                              !formData.name || !formData.email || sending ? "cursor-default opacity-40" : "cursor-pointer"
                            }`}
                          >
                            {sending ? "Sending…" : "Send request"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* GivingPanel */}
          <GivingPanel price={property.price} variant="property" />
        </div>

      </div>
    </div>

    {/* Photo modal — rendered via portal to escape stacking context */}
    {mounted && photoModalOpen && (property.images?.length ?? 0) > 0 && createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 9999, background: "rgba(245,244,242,0.97)", display: "flex" }} onClick={() => setPhotoModalOpen(false)}>
        <div className="flex flex-1 flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-6 py-4">
            <div>
              <div className="font-serif text-[15px] font-medium tracking-[-0.01em]">{property.address}</div>
              <div className="text-[12px] text-muted">{property.images!.length} photo{property.images!.length !== 1 ? "s" : ""}</div>
            </div>
            <button
              onClick={() => setPhotoModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted transition-colors hover:border-coral hover:text-coral"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Body */}
          <div className="flex flex-1 gap-6 overflow-y-auto p-6">
            {/* Photos */}
            <div className="flex flex-1 flex-col gap-4">
              {property.images!.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${property.address} photo ${i + 1}`}
                  className="w-full rounded-[10px] object-cover shadow-sm"
                />
              ))}
            </div>
            {/* Agent card */}
            <div className="hidden w-[280px] flex-shrink-0 lg:block">
              <div className="sticky top-0 overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
                <div className="border-b border-border px-4 py-3">
                  <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Contact an agent</h3>
                </div>
                {AGENTS.map((a) => (
                  <div key={a.initials} className="flex items-center gap-3 px-4 py-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                      {a.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{a.name}</div>
                      <a href={`mailto:${a.email}`} className="block truncate text-[11px] text-coral hover:underline">{a.email}</a>
                      <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="block text-[11px] text-muted hover:text-black">{a.phone}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
