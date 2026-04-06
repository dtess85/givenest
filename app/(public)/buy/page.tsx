"use client";

import { useState } from "react";
import Link from "next/link";
import { PROPERTIES } from "@/lib/mock-data";
import { calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";

const PRICE_OPTIONS = [
  { label: "No min", value: 0 },
  { label: "$500K", value: 500_000 },
  { label: "$1M", value: 1_000_000 },
  { label: "$2M", value: 2_000_000 },
  { label: "$3M", value: 3_000_000 },
  { label: "$5M", value: 5_000_000 },
  { label: "$7.5M", value: 7_500_000 },
  { label: "$10M", value: 10_000_000 },
];

const PRICE_MAX_OPTIONS = [
  { label: "No max", value: Infinity },
  { label: "$1M", value: 1_000_000 },
  { label: "$2M", value: 2_000_000 },
  { label: "$3M", value: 3_000_000 },
  { label: "$5M", value: 5_000_000 },
  { label: "$7.5M", value: 7_500_000 },
  { label: "$10M", value: 10_000_000 },
  { label: "$15M+", value: Infinity },
];

export default function Buy() {
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(Infinity);

  const filtered = PROPERTIES.filter((h) => {
    const matchesSearch =
      h.address.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase());
    const matchesMin = h.price >= minPrice;
    const matchesMax = h.price <= maxPrice;
    return matchesSearch && matchesMin && matchesMax;
  });

  const selectClass =
    "rounded-md border border-border bg-white px-3 py-[11px] text-sm text-[#2a2825] outline-none focus:border-coral appearance-none cursor-pointer pr-8";

  return (
    <div>
      <div className="bg-white px-8 pb-9 pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Buyer portal
          </span>
          <h1 className="mb-2 font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
            Houses for sale near you.
          </h1>
          <p className="mb-[22px] max-w-[560px] text-[15px] leading-relaxed text-muted">
            Find houses for sale near you. View photos, open house information, and property details for nearby real estate.
          </p>

          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="min-w-[220px] flex-1 rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Address, city, or zip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Min price */}
            <div className="relative">
              <select
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className={selectClass}
              >
                {PRICE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <span className="text-[13px] text-muted">to</span>

            {/* Max price */}
            <div className="relative">
              <select
                value={maxPrice === Infinity ? "Infinity" : maxPrice}
                onChange={(e) => setMaxPrice(e.target.value === "Infinity" ? Infinity : Number(e.target.value))}
                className={selectClass}
              >
                {PRICE_MAX_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value === Infinity ? "Infinity" : o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <button className="whitespace-nowrap rounded-md bg-coral px-[22px] py-[11px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]">
              Search
            </button>
          </div>
          <p className="mt-3 text-[12px] text-muted">
            Every closing donates a portion of the commission to your chosen charity — at no extra cost to you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-9">
        <div className="mb-[18px] text-[13px] text-muted">
          {filtered.length} {filtered.length === 1 ? "property" : "properties"}
        </div>
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => {
            const givingPool = h.donation ?? calcGivingPool(h.price);
            return (
              <Link
                key={h.id}
                href={`/buy/${h.slug}`}
                className="group overflow-hidden rounded-[10px] border border-border bg-white transition-all hover:shadow-md"
              >
                <div className="relative h-[180px] overflow-hidden bg-[#F5F4F2]">
                  {h.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.images[0]}
                      alt={h.address}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="px-[18px] py-4">
                  <div className="mb-px text-[15px] font-semibold">
                    {fmt(h.price)}
                  </div>
                  <div className="mb-px text-[13px] font-medium">{h.address}</div>
                  <div className="mb-3 text-xs text-muted">{h.city}</div>
                  <div className="mb-3 flex gap-[14px]">
                    {[
                      ["Beds", h.beds],
                      ["Baths", h.baths],
                      ["Sqft", h.sqft.toLocaleString()],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <div className="text-[9px] font-medium uppercase tracking-[0.06em] text-muted">
                          {k}
                        </div>
                        <div className="mt-px text-[13px] font-semibold">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-[10px] h-px bg-border" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted">Estimated Donation</span>
                    <span className="text-[15px] font-semibold text-coral">
                      {fmt(givingPool)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
