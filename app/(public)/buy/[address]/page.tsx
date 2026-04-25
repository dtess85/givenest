"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Property } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
import { calcGivingPool } from "@/lib/commission";
import GivingPanel from "@/components/GivingPanel";
import {
  PriceDropAlert,
  SaleHistoryTable,
} from "@/components/PriceHistory";
import IdxAttribution from "@/components/IdxAttribution";
import AgentPicker from "@/components/AgentPicker";
import LeadModal from "@/components/LeadModal";

export default function PropertyDetail() {
  const params = useParams();
  const router = useRouter();

  // undefined = loading, null = not found, Property = loaded
  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const [descExpanded, setDescExpanded] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [chosenAgent, setChosenAgent] = useState<{ name: string; office_name: string | null } | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedCharities, setSelectedCharities] = useState<{ name: string; ein: string }[]>([]);
  const [mobilePhotoIndex, setMobilePhotoIndex] = useState(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  // ── Favorites: localStorage-backed. A future login will replace this with a
  //    server-side list, but the slug-keyed set is the same shape either way.
  const FAVORITES_KEY = "givenest:favorites";
  const [isFavorited, setIsFavorited] = useState(false);
  useEffect(() => {
    if (!property || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      const set: string[] = raw ? JSON.parse(raw) : [];
      setIsFavorited(set.includes(property.slug));
    } catch { /* corrupt JSON — ignore */ }
  }, [property]);
  function toggleFavorite() {
    if (!property || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      const set: string[] = raw ? JSON.parse(raw) : [];
      const next = set.includes(property.slug)
        ? set.filter((s) => s !== property.slug)
        : [...set, property.slug];
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setIsFavorited(next.includes(property.slug));
    } catch { /* quota exceeded or disabled — ignore */ }
  }

  // ── Share: Web Share API on mobile, clipboard fallback on desktop
  const [shareCopied, setShareCopied] = useState(false);
  async function handleShare() {
    if (!property || typeof window === "undefined") return;
    const url = window.location.href;
    const title = `${property.address} · ${fmt(property.price)}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try { await navigator.share({ title, url }); return; } catch { /* user dismissed */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch { /* clipboard blocked — ignore */ }
  }

  // Fetch listing from Spark API
  useEffect(() => {
    const key = params.address as string;
    if (!key) { setProperty(null); return; }
    fetch(`/api/listings/${key}`)
      .then((r) => r.json())
      .then((d) => {
        setProperty(d.listing ?? null);
        setFetchedAt(d.fetchedAt ?? null);
      })
      .catch(() => setProperty(null));
  }, [params.address]);

  // Loading state
  if (property === undefined) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-20 text-center">
        <svg className="mx-auto h-6 w-6 animate-spin text-coral" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="mt-4 text-sm text-muted">Loading listing…</p>
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="mx-auto max-w-[1100px] px-8 py-20 text-center">
        <h1 className="font-serif text-2xl font-medium">Property not found</h1>
        <button onClick={handleBack} className="mt-4 inline-block text-sm text-coral hover:underline">
          ← Back to search
        </button>
      </div>
    );
  }

  function handleBack() {
    if (typeof document !== "undefined" && document.referrer) {
      try {
        if (new URL(document.referrer).hostname === window.location.hostname) {
          router.back();
          return;
        }
      } catch { /* invalid referrer URL, fall through */ }
    }
    router.push("/buy");
  }

  const estimatedDonation = property.donation ?? calcGivingPool(property.price);
  const pricePerSqft = Math.round(property.price / property.sqft);

  const listingUpdated = (property.modifiedAt ?? property.listingDate)
    ? (() => {
        const d = new Date(property.modifiedAt ?? property.listingDate!);
        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        return `${date} at ${time}`;
      })()
    : null;

  const checkedRelative = fetchedAt
    ? (() => {
        const secs = Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000);
        if (secs < 10) return "just now";
        if (secs < 60) return `${secs} seconds ago`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
        const hrs = Math.floor(mins / 60);
        return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
      })()
    : null;

  return (
    <>
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="text-[13px] text-muted transition-colors hover:text-black"
        >
          ← Back to search
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLeadModalOpen(true)}
            className="rounded-md bg-coral px-4 py-[7px] text-[12px] font-medium text-white transition-colors hover:bg-[#d4574a] lg:hidden"
          >
            Request
          </button>
          <button
            type="button"
            onClick={async () => {
              const url = typeof window !== "undefined" ? window.location.href : "";
              const title = property?.address ?? "Givenest listing";
              if (typeof navigator !== "undefined" && "share" in navigator) {
                try { await navigator.share({ title, url }); return; } catch { /* user canceled */ }
              }
              try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
            }}
            aria-label="Share listing"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-coral hover:text-coral"
          >
            <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Two-column grid: content left, GivingPanel right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-8">

          {/* Photo Gallery */}
          {(() => {
            const imgs = property.images ?? [];
            const hasMany = imgs.length > 1;
            const isGivenest = property.listOfficeName?.toLowerCase().includes("givenest");
            return (
              <>
                {/* ── MOBILE: swipeable carousel (hidden on md+) ── */}
                <div className="relative md:hidden overflow-hidden rounded-[12px]">
                  <div
                    ref={mobileCarouselRef}
                    onScroll={() => {
                      const el = mobileCarouselRef.current;
                      if (!el) return;
                      setMobilePhotoIndex(Math.round(el.scrollLeft / el.offsetWidth));
                    }}
                    className="flex snap-x snap-mandatory overflow-x-auto"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
                  >
                    {imgs.length > 0 ? imgs.map((src, i) => (
                      <div
                        key={i}
                        className="relative h-[300px] w-full flex-none snap-center cursor-pointer"
                        onClick={() => setPhotoModalOpen(true)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={i === 0 ? property.address : ""} className="h-full w-full object-cover" />
                        {i === 0 && (isGivenest || property.status === "Coming Soon") && (
                          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                            {isGivenest && (
                              <span className="rounded-full bg-coral px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                                Listed by Givenest
                              </span>
                            )}
                            {property.status === "Coming Soon" && (
                              <span className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                                Coming Soon
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="relative h-[300px] w-full flex-none snap-center bg-[#E8E6E0] flex items-center justify-center">
                        <svg className="h-10 w-10 text-[#C4C0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Photo counter badge */}
                  {imgs.length > 1 && (
                    <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-[3px] text-[11px] font-medium text-white backdrop-blur-sm">
                      {mobilePhotoIndex + 1} / {imgs.length}
                    </div>
                  )}
                  {/* Dot indicators */}
                  {imgs.length > 1 && imgs.length <= 10 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-[5px]">
                      {imgs.map((_, i) => (
                        <div
                          key={i}
                          className={`h-[5px] rounded-full transition-all duration-200 ${i === mobilePhotoIndex ? "w-4 bg-white" : "w-[5px] bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── DESKTOP: photo grid (hidden on mobile, shown md+) ── */}
                {hasMany ? (
                  /* Multi-photo grid */
                  <div className="relative hidden md:grid h-[460px] grid-cols-2 gap-1 overflow-hidden rounded-[12px]">
                    <div className="relative cursor-pointer" onClick={() => setPhotoModalOpen(true)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgs[0]} alt={property.address} className="h-full w-full object-cover" />
                      {(isGivenest || property.status === "Coming Soon") && (
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                          {isGivenest && (
                            <span className="rounded-full bg-coral px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                              Listed by Givenest
                            </span>
                          )}
                          {property.status === "Coming Soon" && (
                            <span className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      )}
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
                    className={`relative hidden md:block h-[460px] overflow-hidden rounded-[12px] bg-[#E8E6E0] ${imgs[0] ? "cursor-pointer" : ""}`}
                    onClick={() => imgs[0] && setPhotoModalOpen(true)}
                  >
                    {imgs[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgs[0]} alt={property.address} className="h-full w-full object-cover" />
                    ) : null}
                    {(isGivenest || property.status === "Coming Soon") && (
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                        {isGivenest && (
                          <span className="rounded-full bg-coral px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                            Listed by Givenest
                          </span>
                        )}
                        {property.status === "Coming Soon" && (
                          <span className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    )}
                    {!imgs[0] && (
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
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

            {/* Mini map thumbnail */}
            {(() => {
              const mapsQuery = encodeURIComponent(`${property.address}, ${property.city}`);
              return (
                <button
                  onClick={() => setMapModalOpen(true)}
                  className="group relative flex-shrink-0 self-end overflow-hidden rounded-2xl border border-border shadow-sm cursor-pointer"
                  style={{ width: 120, height: 88 }}
                  aria-label="View map"
                >
                  {/* iframe oversized to crop 'Maps' label at top and watermark at bottom */}
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=10&iwloc=near`}
                    className="pointer-events-none"
                    style={{ width: "100%", height: "176px", marginTop: "-44px" }}
                    loading="lazy"
                    title="Mini map"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
              );
            })()}
          </div>

          {/* ── Price drop alert (only renders when ListPrice was lowered) ── */}
          <PriceDropAlert
            listingSlug={property.slug}
            currentPrice={property.price}
          />

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
                <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-[#4a4845]">
                  {displayed.split(/\r?\n\r?\n/).map((para, i) => (
                    <p key={i}>{para.replace(/\r\n/g, "\n")}</p>
                  ))}
                </div>
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

          {/* ── Map ── */}
          {(() => {
            const mapsQuery = encodeURIComponent(`${property.address}, ${property.city}`);
            return (
              <div className="border-t border-border pt-6">
                <h2 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em]">Location</h2>
                <button
                  onClick={() => setMapModalOpen(true)}
                  className="group relative block w-full overflow-hidden rounded-[12px] border border-border cursor-pointer"
                  aria-label="View map"
                >
                  {/* iframe oversized to crop 'Maps' label at top and watermark at bottom */}
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=14`}
                    className="pointer-events-none w-full"
                    style={{ height: "275px", marginTop: "-35px" }}
                    loading="lazy"
                    title="Property location map"
                  />
                  {/* "Expand map" pill */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/60 bg-white/90 px-3 py-[5px] text-[11px] font-medium text-[#2a2825] shadow-sm backdrop-blur-sm transition-colors group-hover:bg-white">
                    View full map
                  </div>
                </button>
              </div>
            );
          })()}

          {/* ── Listed by — hidden on small screens, shown inline on lg ── */}
          <div className="hidden lg:block border-t border-border pt-5 pb-4">
            <p className="mb-4 text-[13px] text-muted">
              {property.listOfficeName ? (
                <>Listing courtesy of{property.listAgentName && <> <span className="font-medium text-[#2a2825]">{property.listAgentName}</span> ·</>} <span className="font-medium text-[#2a2825]">{property.listOfficeName}</span> via <span className="font-medium text-[#2a2825]">ARMLS</span></>
              ) : (
                <>Listed by <span className="font-medium text-[#2a2825]">Kyndall Yates</span><span className="mx-2 text-border">•</span><span className="font-medium text-[#2a2825]">Givenest</span></>
              )}
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
                <span>Givenest checked: <span className="text-emerald-600">{checkedRelative ?? "just now"}</span></span>
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

          {/* ── Sale history (Spark + same-address lookup) ── */}
          <SaleHistoryTable listingSlug={property.slug} sqft={property.sqft} />

        </div>
        {/* ── END LEFT COLUMN ── */}

        {/* ── RIGHT SIDEBAR ── */}
        <div className="sticky top-[68px] flex flex-col gap-4">

          {/* Choose your agent */}
          <div className="rounded-[10px] border border-border bg-white p-[26px]" style={{ borderTop: "3px solid var(--color-coral)" }}>
            <h3 className="font-serif text-xl font-medium leading-[1.2] tracking-[-0.02em] text-black">
              Choose your agent.
            </h3>
            <p className="mt-2 text-[13px] font-light text-muted">
              Work with any agent. They handle the deal and we make the donation.
            </p>

            {/* Selected agent display */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                {(chosenAgent?.name ?? "Kyndall Yates").split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{chosenAgent?.name ?? "Kyndall Yates"}</div>
                {!chosenAgent ? (
                  <>
                    <a href="mailto:kyndall@givenest.com" className="block text-[12px] text-coral hover:underline truncate">kyndall@givenest.com</a>
                    <a href="tel:4804008690" className="block text-[12px] text-muted hover:text-black">(480) 400-8690</a>
                  </>
                ) : (
                  <div className="text-[12px] text-muted truncate">
                    {[chosenAgent.office_name, "Arizona"].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              {!chosenAgent && (
                <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-coral">
                  Givenest
                </span>
              )}
              {chosenAgent && (
                <button
                  onClick={() => setChosenAgent(null)}
                  className="flex-shrink-0 text-[12px] text-muted hover:text-coral transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Agent search */}
            <div className="mt-3">
              <AgentPicker
                defaultAgent={{
                  name: "Kyndall Yates",
                  office_name: "Givenest",
                  primary_city: "Gilbert",
                  active_listing_count: 0,
                  is_givenest: true,
                }}
                onSelect={(agent) => setChosenAgent({ name: agent.name, office_name: agent.office_name })}
              />
            </div>
            <button
              type="button"
              onClick={() => setLeadModalOpen(true)}
              className="mt-4 w-full cursor-pointer rounded-md bg-coral py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Send request
            </button>
          </div>

          {/* GivingPanel */}
          <GivingPanel
            price={property.price}
            variant="property"
            onRequestMatch={() => setLeadModalOpen(true)}
            onCharitiesChange={setSelectedCharities}
          />
        </div>

      </div>
    </div>

    {/* ── Listed by — shown below sidebar on small screens only ── */}
    <div className="lg:hidden mx-auto max-w-[1200px] px-6 pb-8">
      <div className="border-t border-border pt-5 pb-4">
        <p className="mb-4 text-[13px] text-muted">
          {property.listOfficeName ? (
            <>Listing courtesy of{property.listAgentName && <> <span className="font-medium text-[#2a2825]">{property.listAgentName}</span> ·</>} <span className="font-medium text-[#2a2825]">{property.listOfficeName}</span> via <span className="font-medium text-[#2a2825]">ARMLS</span></>
          ) : (
            <>Listed by <span className="font-medium text-[#2a2825]">Kyndall Yates</span><span className="mx-2 text-border">•</span><span className="font-medium text-[#2a2825]">Givenest</span></>
          )}
        </p>
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
            <span>Givenest checked: <span className="text-emerald-600">{checkedRelative ?? "just now"}</span></span>
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

    {/* Map modal — same style as photo modal */}
    {mounted && mapModalOpen && createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 9999, background: "rgba(245,244,242,0.97)", display: "flex" }} onClick={() => setMapModalOpen(false)}>
        <div className="flex flex-1 flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-6 py-4">
            <div>
              <div className="font-serif text-[15px] font-medium tracking-[-0.01em]">{property.address}</div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-coral hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View on Google Maps ↗
              </a>
            </div>
            <button
              onClick={() => setMapModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted transition-colors hover:border-coral hover:text-coral"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Body */}
          <div className="flex flex-1 gap-6 overflow-hidden p-6">
            {/* Full map */}
            <div className="relative flex-1 overflow-hidden rounded-[12px] border border-border">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}`)}&output=embed&z=14`}
                className="h-full w-full"
                title="Full property map"
              />
            </div>
            {/* Agent card */}
            <div className="hidden w-[280px] flex-shrink-0 lg:block">
              <div className="overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
                <div className="border-b border-border px-4 py-3">
                  <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Your agent</h3>
                </div>
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                    {(chosenAgent?.name ?? "Kyndall Yates").split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{chosenAgent?.name ?? "Kyndall Yates"}</div>
                    {!chosenAgent ? (
                      <>
                        <a href="mailto:kyndall@givenest.com" className="block truncate text-[11px] text-coral hover:underline" onClick={(e) => e.stopPropagation()}>kyndall@givenest.com</a>
                        <a href="tel:4804008690" className="block text-[11px] text-muted hover:text-black" onClick={(e) => e.stopPropagation()}>(480) 400-8690</a>
                      </>
                    ) : (
                      <div className="text-[11px] text-muted truncate">{chosenAgent.office_name ?? "Arizona"}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Photo modal — rendered via portal to escape stacking context */}
    {mounted && photoModalOpen && (property.images?.length ?? 0) > 0 && createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 9999, background: "rgba(245,244,242,0.97)", display: "flex", flexDirection: "column" }} onClick={() => setPhotoModalOpen(false)}>
        {/* Header — X left, category tabs center, Favorite + Share right */}
        <div
          className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-5 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* X close — top left */}
          <button
            onClick={() => setPhotoModalOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted transition-colors hover:border-coral hover:text-coral"
            aria-label="Close photo viewer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Category tabs — placeholder. MLS feed doesn't return per-photo
              categories (Caption is empty, Name is just numeric). Leaving the
              slot wired up so we can plug in AI labeling or another source later. */}
          <div className="hidden md:flex items-center gap-1 rounded-full border border-border bg-[#F5F4F2] p-1">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium shadow-sm">
              All {property.images!.length}
            </span>
            <span className="px-3 py-1 text-[11px] text-muted/60" title="Photo categories will appear here once categorization data is available">
              Photos by category — coming soon
            </span>
          </div>

          {/* Favorite + Share — top right */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`flex h-9 items-center gap-[6px] rounded-full border px-3 text-[12px] font-medium transition-colors ${
                isFavorited
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-border bg-white text-muted hover:border-coral hover:text-coral"
              }`}
              aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
            >
              <svg className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">{isFavorited ? "Saved" : "Save"}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex h-9 items-center gap-[6px] rounded-full border border-border bg-white px-3 text-[12px] font-medium text-muted transition-colors hover:border-coral hover:text-coral"
              aria-label="Share listing"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">{shareCopied ? "Copied!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* Body — photos scroll left, sticky sidebar right */}
        <div
          className="flex flex-1 gap-6 overflow-hidden p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Photos — scroll column */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
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

          {/* Sticky price sidebar — right */}
          <div className="hidden w-[320px] flex-shrink-0 lg:block">
            <div className="sticky top-0 flex flex-col gap-4">
              <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-sm" style={{ borderTop: "3px solid var(--color-coral)" }}>
                {/* Price + address */}
                <div className="px-5 pt-5 pb-4">
                  {property.status && (
                    <span className={`mb-3 inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.07em] ${
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
                  )}
                  <div className="font-serif text-[26px] font-medium tracking-[-0.02em] leading-tight">
                    {fmt(property.price)}
                  </div>
                  <div className="mt-3 font-serif text-[15px] font-medium tracking-[-0.01em] leading-snug">
                    {property.address}
                  </div>
                  <div className="text-[12px] text-muted">{property.city}</div>
                </div>
                {/* Beds / baths / sqft row */}
                <div className="flex items-center gap-4 border-t border-border bg-[#FBFAF8] px-5 py-3">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted">Beds</div>
                    <div className="text-[14px] font-semibold">{property.beds}</div>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted">Baths</div>
                    <div className="text-[14px] font-semibold">{property.baths}</div>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted">Sqft</div>
                    <div className="text-[14px] font-semibold">{property.sqft.toLocaleString()}</div>
                  </div>
                </div>
                {/* Choose your agent */}
                <div className="border-t border-border px-5 py-5">
                  <h3 className="font-serif text-xl font-medium leading-[1.2] tracking-[-0.02em] text-black">
                    Choose your agent.
                  </h3>
                  <p className="mt-2 text-[13px] font-light text-muted">
                    Work with any agent. They handle the deal and we make the donation.
                  </p>

                  {/* Selected agent display */}
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[12px] font-medium text-white">
                      {(chosenAgent?.name ?? "Kyndall Yates").split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{chosenAgent?.name ?? "Kyndall Yates"}</div>
                      {!chosenAgent ? (
                        <>
                          <a href="mailto:kyndall@givenest.com" className="block truncate text-[12px] text-coral hover:underline">kyndall@givenest.com</a>
                          <a href="tel:4804008690" className="block text-[12px] text-muted hover:text-black">(480) 400-8690</a>
                        </>
                      ) : (
                        <div className="text-[12px] text-muted truncate">
                          {[chosenAgent.office_name, "Arizona"].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    {!chosenAgent && (
                      <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-coral">
                        Givenest
                      </span>
                    )}
                    {chosenAgent && (
                      <button
                        onClick={() => setChosenAgent(null)}
                        className="flex-shrink-0 text-[12px] text-muted hover:text-coral transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <AgentPicker
                      defaultAgent={{
                        name: "Kyndall Yates",
                        office_name: "Givenest",
                        primary_city: "Gilbert",
                        active_listing_count: 0,
                        is_givenest: true,
                      }}
                      onSelect={(agent) => setChosenAgent({ name: agent.name, office_name: agent.office_name })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeadModalOpen(true)}
                    className="mt-4 w-full cursor-pointer rounded-md bg-coral py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
                  >
                    Send request
                  </button>
                </div>
              </div>
              <GivingPanel
                price={property.price}
                variant="property"
                onRequestMatch={() => setLeadModalOpen(true)}
                onCharitiesChange={setSelectedCharities}
              />
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* IDX Attribution */}
    <div className="mx-auto max-w-[1200px] px-6 pb-10">
      <IdxAttribution />
    </div>

    {/* Lead capture modal */}
    <LeadModal
      open={leadModalOpen}
      onClose={() => setLeadModalOpen(false)}
      propertyAddress={property.address}
      propertyPrice={property.price}
      defaultAgent={chosenAgent ?? undefined}
      defaultCharities={selectedCharities}
    />
    </>
  );
}
