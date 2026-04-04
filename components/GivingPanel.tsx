"use client";

import { useState, useEffect, useRef } from "react";
import { calcCommission, calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import { CHARITIES } from "@/lib/mock-data";
import { useUserLocation } from "@/lib/useUserLocation";

interface GivingPanelProps {
  price: number;
  variant?: "property" | "seller" | "dashboard";
}

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  location?: string;
  description?: string;
  profileUrl?: string;
  logoUrl?: string;
}

interface PickedCharity {
  name: string;
  ein: string;
  category: string;
}

const SEED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean));

export default function GivingPanel({ price, variant = "property" }: GivingPanelProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EveryOrgNonprofit[]>([]);
  const [loading, setLoading] = useState(false);
  const [charity, setCharity] = useState<PickedCharity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [favorites, setFavorites] = useState<Map<string, EveryOrgNonprofit>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLoc = useUserLocation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("givenest-favorites");
      if (saved) setFavorites(new Map(JSON.parse(saved)));
    } catch {}
  }, []);

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

  const locationScore = (loc?: string) => {
    if (!loc || !userLoc) return 0;
    const l = loc.toLowerCase();
    if (userLoc.city && l.includes(userLoc.city.toLowerCase())) return 2;
    if (userLoc.stateCode && l.includes(userLoc.stateCode.toLowerCase())) return 1;
    if (userLoc.state && l.includes(userLoc.state.toLowerCase())) return 1;
    return 0;
  };

  const showFeatured = !search.trim();
  const sortedResults = results.slice().sort((a, b) => locationScore(b.location) - locationScore(a.location));
  const favoritesList = Array.from(favorites.values()).filter((f) => !SEED_EINS.has(f.ein));

  type ListItem = PickedCharity & { location?: string; isSeed?: boolean; isFav?: boolean };
  const listItems: ListItem[] = showFeatured
    ? [
        ...CHARITIES.map((c) => ({ name: c.name, ein: c.ein ?? "", category: c.category, isSeed: true })),
        ...favoritesList.map((f) => ({ name: f.name, ein: f.ein, category: "", location: f.location, isFav: true })),
      ]
    : sortedResults.map((r) => ({
        name: r.name, ein: r.ein, category: "", location: r.location,
        isSeed: SEED_EINS.has(r.ein), isFav: favorites.has(r.ein),
      }));

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
        {listItems.map((c, i) => {
          const isSelected = charity?.ein === c.ein;
          const showFavLabel = showFeatured && c.isFav && listItems[i - 1]?.isSeed;
          return (
            <div key={c.ein || c.name}>
              {showFavLabel && (
                <div className="mb-1 mt-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                  Your saved
                </div>
              )}
              <button
                onClick={() => setCharity(c)}
                className={`flex w-full items-center justify-between rounded-[5px] border px-[10px] py-2 text-left transition-all ${
                  isSelected
                    ? "border-coral bg-coral/[0.08]"
                    : "border-border bg-white hover:border-coral"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs text-black">{c.name}</span>
                    {!showFeatured && c.isSeed && (
                      <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">Featured</span>
                    )}
                    {!showFeatured && c.isFav && (
                      <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">Saved</span>
                    )}
                    {!showFeatured && !c.isSeed && !c.isFav && locationScore(c.location) > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-emerald-50 px-[6px] py-px text-[9px] font-medium text-emerald-600">Local</span>
                    )}
                  </div>
                  {!showFeatured && c.location && (
                    <div className="text-[10px] text-muted">{c.location}</div>
                  )}
                  {showFeatured && c.category && (
                    <div className="text-[10px] text-muted">{c.category}</div>
                  )}
                </div>
                {isSelected && <span className="ml-2 flex-shrink-0 text-[13px] text-coral">&#10003;</span>}
              </button>
            </div>
          );
        })}
        {!showFeatured && !loading && results.length === 0 && (
          <div className="py-3 text-center text-xs text-muted">No results found</div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => { if (charity && !submitted) setShowForm(true); }}
        className={`w-full rounded-md bg-coral py-[13px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
          !charity || submitted ? "cursor-default opacity-40" : "cursor-pointer"
        }`}
      >
        {submitted ? "\u2713 Request sent" : "Get matched with an agent"}
      </button>

      {showForm && !submitted && (
        <div className="mt-3 rounded-md border border-border bg-white p-3">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Your contact info</div>
          <div className="flex flex-col gap-[6px]">
            <input
              className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              type="email"
              className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              type="tel"
              className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
            />
            <button
              onClick={async () => {
                if (!formData.name || !formData.email) return;
                setSending(true);
                try {
                  await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: formData.name,
                      email: formData.email,
                      phone: formData.phone,
                      charity: charity?.name,
                      homeValue: fmt(price),
                      givingAmount: fmt(givingPool),
                    }),
                  });
                } finally {
                  setSending(false);
                  setSubmitted(true);
                  setShowForm(false);
                }
              }}
              disabled={!formData.name || !formData.email || sending}
              className={`w-full rounded-md bg-coral py-[8px] text-xs font-medium text-white transition-colors hover:bg-[#d4574a] ${
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
}
