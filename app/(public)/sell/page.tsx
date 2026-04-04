"use client";

import { useState } from "react";
import { calcCommission, calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import { CHARITIES, type CharityItem } from "@/lib/mock-data";

export default function Sell() {
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [charity, setCharity] = useState<CharityItem | null>(null);

  const num = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  const commission = calcCommission(num);
  const givingPool = calcGivingPool(num);

  const filtered = CHARITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white px-8 pb-9 pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Seller portal
          </span>
          <h1 className="font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
            Sell your home.{" "}
            <em className="text-coral">Grow a cause.</em>
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-[860px] grid-cols-1 gap-11 px-8 py-11 md:grid-cols-[1fr_320px]">
        {/* Left — estimate calculator */}
        <div>
          <h3 className="mb-[18px] font-serif text-[17px] font-medium tracking-[-0.01em]">
            Estimate your giving
          </h3>
          <div className="rounded-[10px] border border-border bg-white p-6">
            <label className="mb-[7px] block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Estimated home value
            </label>
            <div className="relative mb-[18px]">
              <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <input
                className="w-full rounded-md border border-border bg-white py-[11px] pl-[26px] pr-[14px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                placeholder="550,000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            {num > 0 && (
              <div>
                {[
                  { label: "Home value", value: fmt(num), highlight: false },
                  { label: "Estimated commission", value: fmt(commission), highlight: false },
                  { label: "Estimated donation (25%)", value: fmt(givingPool), highlight: true },
                ].map(({ label, value: v, highlight }) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between border-b border-border py-[11px]"
                  >
                    <span className={`text-sm ${highlight ? "font-medium text-black" : "font-light text-muted"}`}>
                      {label}
                    </span>
                    <span
                      className={
                        highlight
                          ? "text-[19px] font-semibold text-coral"
                          : "text-sm font-normal text-black"
                      }
                    >
                      {v}
                    </span>
                  </div>
                ))}
                <div className="mt-[14px] rounded-md border border-border bg-white px-[13px] py-[11px]">
                  <div className="text-xs font-light leading-[1.6] text-muted">
                    givenest donates this amount directly to your chosen charity
                    at closing — from the standard commission, at no extra cost.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — charity selection */}
        <div>
          <h3 className="mb-[18px] font-serif text-[17px] font-medium tracking-[-0.01em]">
            Choose a charity
          </h3>
          <input
            className="mb-2 w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
            placeholder="Search nonprofits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mb-[14px] flex flex-col gap-[5px]">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setCharity(c)}
                className={`flex items-center gap-3 rounded-md border px-3 py-[10px] text-left transition-all ${
                  charity?.id === c.id
                    ? "border-coral bg-[#fff8f7]"
                    : "border-border bg-white hover:border-coral"
                }`}
              >
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{c.name}</div>
                  <div className="text-[11px] text-muted">
                    {c.category} · {c.city}
                  </div>
                </div>
                {charity?.id === c.id && (
                  <span className="text-[13px] text-coral">&#10003;</span>
                )}
              </button>
            ))}
          </div>

          {charity && num > 0 && (
            <div className="mb-3 rounded-lg border border-border bg-white px-4 py-[14px]">
              <div className="mb-[3px] text-xs text-muted">
                Your closing would give
              </div>
              <div className="text-[22px] font-semibold text-coral">
                {fmt(givingPool)}
              </div>
              <div className="mt-[2px] text-xs text-muted">
                to {charity.name}
              </div>
            </div>
          )}

          <button
            className={`w-full rounded-md bg-coral py-3 text-sm font-medium text-white transition-colors hover:bg-[#d4574a] ${
              !charity ? "cursor-default opacity-40" : "cursor-pointer"
            }`}
          >
            Get matched with an agent
          </button>
        </div>
      </div>
    </div>
  );
}
