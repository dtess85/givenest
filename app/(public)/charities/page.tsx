"use client";

import { useState, useEffect, useRef } from "react";
import { CHARITIES } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  description?: string;
  profileUrl?: string;
  logoUrl?: string;
}

const FEATURED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean));

export default function Charities() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EveryOrgNonprofit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const key = process.env.NEXT_PUBLIC_EVERY_ORG_KEY;
        const res = await fetch(
          `https://partners.every.org/v0.2/search/${encodeURIComponent(search.trim())}?apiKey=${key}&take=12`
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

  const isSearching = !!search.trim();

  return (
    <div>
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Charity showcase
          </span>
          <h1 className="mb-[18px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            1.8M+ charities.{" "}
            <em className="text-coral">Your choice.</em>
          </h1>
          <div className="flex max-w-[460px]">
            <input
              className="flex-1 rounded-l-md border border-r-0 border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Search any 501(c)(3)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="rounded-r-md bg-coral px-[22px] py-[11px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-11">

        {/* Featured charities — always visible */}
        <div className="mb-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium tracking-[-0.01em]">
              Featured charities
            </h2>
            <span className="text-[13px] font-light text-muted">
              Nonprofits that givenest has donated to
            </span>
          </div>

          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
            {CHARITIES.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-[10px] border border-border bg-white"
              >
                <div className="h-[3px] bg-coral" />
                <div className="px-5 py-[18px]">
                  <div className="mb-[5px] text-[10px] font-medium uppercase tracking-[0.08em] text-coral">
                    {c.category}
                  </div>
                  <div className="mb-[2px] text-sm font-medium">{c.name}</div>
                  <div className="mb-[14px] text-xs text-muted">{c.city}</div>
                  <div className="mb-3 h-px bg-border" />
                  <div className="mb-3 grid grid-cols-2 gap-[10px]">
                    <div>
                      <div className="mb-[3px] text-[9px] font-medium uppercase tracking-[0.06em] text-muted">
                        Received
                      </div>
                      <div className="text-base font-semibold text-coral">
                        {fmt(c.total)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-[3px] text-[9px] font-medium uppercase tracking-[0.06em] text-muted">
                        Closings
                      </div>
                      <div className="text-base font-semibold">{c.closings}</div>
                    </div>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-sm bg-border">
                    <div
                      className="h-full rounded-sm bg-coral"
                      style={{ width: `${Math.min(100, (c.total / 65000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search results */}
        {isSearching && (
          <div className="mb-10">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-serif text-xl font-medium tracking-[-0.01em]">
                {loading ? "Searching…" : `${results.length} results`}
              </h2>
              <span className="text-[13px] font-light text-muted">
                Powered by every.org
              </span>
            </div>

            {!loading && results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No results found</p>
            )}

            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => {
                const isFeatured = FEATURED_EINS.has(r.ein);
                return (
                  <div
                    key={r.ein || r.name}
                    className="overflow-hidden rounded-[10px] border border-border bg-white"
                  >
                    <div className="h-[3px] bg-coral" />
                    <div className="px-5 py-[18px]">
                      <div className="mb-[5px] flex items-center gap-2">
                        {isFeatured && (
                          <span className="rounded-full bg-coral/10 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-coral">
                            Featured
                          </span>
                        )}
                        {r.ein && (
                          <span className="text-[10px] text-muted">EIN {r.ein}</span>
                        )}
                      </div>
                      <div className="mb-[2px] text-sm font-medium">{r.name}</div>
                      {r.description && (
                        <div className="mb-[14px] line-clamp-2 text-xs font-light leading-[1.6] text-muted">
                          {r.description}
                        </div>
                      )}
                      {r.profileUrl && (
                        <a
                          href={r.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-coral hover:underline"
                        >
                          View on every.org →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Giving commitment */}
        <div className="mt-[52px] grid grid-cols-1 gap-11 rounded-xl bg-white p-6 md:grid-cols-2 md:p-11">
          <div>
            <span className="mb-[14px] inline-block rounded-full bg-border px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Our giving commitment
            </span>
            <h2 className="mb-[14px] font-serif text-[clamp(20px,2.5vw,32px)] font-medium leading-[1.2] tracking-[-0.02em] text-black">
              Every closing funds a cause.
              <br />
              <em className="text-coral">No exceptions.</em>
            </h2>
            <p className="text-sm font-light leading-[1.8] text-muted">
              givenest donates directly to your chosen charity at every closing.
              The full amount, every time. No deductions.
            </p>
          </div>
          <div>
            {[
              { value: "$284,190", label: "Donated to charity", highlight: false },
              { value: "41", label: "Charities supported", highlight: false },
              { value: "82", label: "Closings", highlight: false },
              { value: "100%", label: "Donated in full, every closing", highlight: true },
            ].map(({ value: v, label, highlight }) => (
              <div
                key={label}
                className="flex items-baseline justify-between border-b border-border py-3"
              >
                <span className="text-[13px] font-light text-muted">{label}</span>
                <span className={`text-base font-semibold ${highlight ? "text-coral" : "text-black"}`}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
