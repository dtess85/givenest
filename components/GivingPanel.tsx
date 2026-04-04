"use client";

import { useState, useEffect, useRef } from "react";
import { calcCommission, calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import { CHARITIES } from "@/lib/mock-data";

interface GivingPanelProps {
  price: number;
  variant?: "property" | "seller" | "dashboard";
}

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  description?: string;
  profileUrl?: string;
  logoUrl?: string;
}

interface PickedCharity {
  name: string;
  ein: string;
  category: string;
}

const FEATURED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean));

export default function GivingPanel({ price, variant = "property" }: GivingPanelProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EveryOrgNonprofit[]>([]);
  const [loading, setLoading] = useState(false);
  const [charity, setCharity] = useState<PickedCharity | null>(null);
  const [matched, setMatched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commission = calcCommission(price);
  const givingPool = calcGivingPool(price);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const key = process.env.NEXT_PUBLIC_EVERY_ORG_KEY;
        const res = await fetch(
          `https://partners.every.org/v0.2/search/${encodeURIComponent(search.trim())}?apiKey=${key}&take=8`
        );
        const data = await res.json();
        setResults(data.nonprofits ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [search]);

  const rows = [
    { label: variant === "seller" ? "Home value" : "List price", value: fmt(price), highlight: false },
    { label: "Estimated donation (25%)", value: fmt(givingPool), highlight: true },
  ];

  // What to show in the list
  const showFeatured = !search.trim();
  const listItems: PickedCharity[] = showFeatured
    ? CHARITIES.map((c) => ({ name: c.name, ein: c.ein ?? "", category: c.category }))
    : results.map((r) => ({ name: r.name, ein: r.ein, category: "" }));

  return (
    <div className="rounded-[10px] border border-border bg-white p-[26px]" style={{ borderTop: "3px solid var(--color-coral)" }}>
      <span className="mb-[14px] inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
        Giving panel
      </span>
      <h3 className="mb-5 font-serif text-xl font-medium leading-[1.2] tracking-[-0.02em] text-black">
        Every closing
        <br />
        gives back.
      </h3>

      {/* Math breakdown */}
      <div className="mb-[18px]">
        {rows.map(({ label, value, highlight }) => (
          <div
            key={label}
            className="flex items-baseline justify-between border-b border-border py-[9px]"
          >
            <span className={`text-[13px] ${highlight ? "font-medium text-black" : "font-light text-muted"}`}>
              {label}
            </span>
            <span className={highlight ? "text-[17px] font-semibold text-coral" : "text-sm font-normal text-muted"}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* 100% to charity callout */}
      <div className="mb-4 rounded-md border border-coral/20 bg-coral/[0.08] px-3 py-[10px]">
        <div className="mb-[3px] text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
          100% to charity
        </div>
        <div className="text-xs font-light leading-[1.6] text-muted">
          givenest donates this amount directly to your chosen charity at
          closing. Nothing extra from you.
        </div>
      </div>

      {/* Charity search */}
      <div className="mb-2">
        <div className="mb-[7px] text-xs text-muted">Choose your charity</div>
        <input
          className="w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none transition-colors placeholder:text-[#c0bdb6] focus:border-coral"
          placeholder="Search 1.8M+ nonprofits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List label */}
      <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
        {showFeatured ? "Featured charities" : loading ? "Searching…" : `${results.length} results`}
      </div>

      <div className="mb-[14px] flex max-h-[200px] flex-col gap-1 overflow-y-auto">
        {listItems.map((c) => {
          const isFeatured = FEATURED_EINS.has(c.ein);
          const isSelected = charity?.ein === c.ein;
          return (
            <button
              key={c.ein || c.name}
              onClick={() => setCharity(c)}
              className={`flex items-center justify-between rounded-[5px] border px-[10px] py-2 text-left transition-all ${
                isSelected
                  ? "border-coral bg-coral/[0.08]"
                  : "border-border bg-white hover:border-coral"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs text-black">{c.name}</span>
                  {!showFeatured && isFeatured && (
                    <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">
                      Featured
                    </span>
                  )}
                </div>
                {c.category && (
                  <div className="text-[10px] text-muted">{c.category}</div>
                )}
              </div>
              {isSelected && <span className="ml-2 flex-shrink-0 text-[13px] text-coral">&#10003;</span>}
            </button>
          );
        })}
        {!showFeatured && !loading && results.length === 0 && (
          <div className="py-3 text-center text-xs text-muted">No results found</div>
        )}
      </div>

      {/* Match prompt */}
      {charity && !matched && (
        <div className="mb-[10px] rounded-md border border-border bg-white p-3">
          <div className="mb-2 text-xs font-light leading-[1.6] text-muted">
            Want to add a personal donation on top of{" "}
            <span className="text-coral">{fmt(givingPool)}</span> to{" "}
            {charity.name}? See our FAQ for details.
          </div>
          <button className="w-full rounded-md border border-border px-2 py-2 text-xs transition-all hover:border-coral hover:text-coral">
            I&apos;d like to match
          </button>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => charity && setMatched(true)}
        className={`w-full rounded-md bg-coral py-[13px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
          !charity ? "cursor-default opacity-40" : "cursor-pointer"
        }`}
      >
        {matched ? "\u2713 Request sent" : "Get matched with an agent"}
      </button>
    </div>
  );
}
