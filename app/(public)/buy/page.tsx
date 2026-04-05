"use client";

import { useState } from "react";
import Link from "next/link";
import { PROPERTIES } from "@/lib/mock-data";
import { calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";

export default function Buy() {
  const [search, setSearch] = useState("");

  const filtered = PROPERTIES.filter(
    (h) =>
      h.address.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white px-8 pb-9 pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Buyer portal
          </span>
          <h1 className="mb-[18px] font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
            Find your home.{" "}
            <em className="text-coral">Fund a cause.</em>
          </h1>
          <div className="flex max-w-[500px]">
            <input
              className="flex-1 rounded-l-md border border-r-0 border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Address, city, or zip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="whitespace-nowrap rounded-r-md bg-coral px-[22px] py-[11px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-9">
        <div className="mb-[18px] text-[13px] text-muted">
          {filtered.length} properties
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
                  <div className="absolute bottom-0 left-0 px-[18px] py-[12px]">
                    <div className={`text-[10px] uppercase tracking-[0.06em] ${h.images?.[0] ? "rounded-full bg-black/40 px-2 py-[3px] text-white backdrop-blur-sm" : "text-muted"}`}>
                      {h.type}
                    </div>
                  </div>
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
