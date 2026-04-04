"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { CHARITIES } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
import { useUserLocation } from "@/lib/useUserLocation";

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  location?: string;
  description?: string;
  profileUrl?: string;
  logoUrl?: string;
}

const SEED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean) as string[]);

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Charities() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EveryOrgNonprofit[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Map<string, EveryOrgNonprofit>>(new Map());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLoc = useUserLocation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("givenest-favorites");
      if (saved) setFavorites(new Map(JSON.parse(saved)));
    } catch {}
    setFavoritesLoaded(true);
  }, []);

  useEffect(() => {
    if (!favoritesLoaded) return;
    try {
      localStorage.setItem("givenest-favorites", JSON.stringify(Array.from(favorites.entries())));
    } catch {}
  }, [favorites, favoritesLoaded]);

  const toggleFavorite = (r: EveryOrgNonprofit) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      if (next.has(r.ein)) next.delete(r.ein);
      else next.set(r.ein, r);
      return next;
    });
  };

  const locationScore = (loc?: string) => {
    if (!loc || !userLoc) return 0;
    const l = loc.toLowerCase();
    if (userLoc.city && l.includes(userLoc.city.toLowerCase())) return 2;
    if (userLoc.stateCode && l.includes(userLoc.stateCode.toLowerCase())) return 1;
    if (userLoc.state && l.includes(userLoc.state.toLowerCase())) return 1;
    return 0;
  };

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
  const favoritesList = Array.from(favorites.values());

  const sortedResults = results
    .slice()
    .sort((a, b) => locationScore(b.location) - locationScore(a.location));

  return (
    <div>
      <section className="relative flex min-h-[50vh] items-center overflow-hidden">
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/images/charities-family.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 60%, rgba(0,0,0,0.18) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-8 py-[90px] md:px-12">
          <div className="mb-3 inline-block rounded-full bg-coral px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
            Charity showcase
          </div>
          <h1 className="mb-5 max-w-[600px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em] text-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)" }}>
            1.8M+ charities.{" "}
            <em className="text-coral">Your choice.</em>
          </h1>

          <div className="flex max-w-[460px] overflow-hidden rounded-lg shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
            <input
              className="min-w-0 flex-1 border-none bg-white px-[18px] py-[15px] text-[15px] font-light outline-none placeholder:text-[#c0bdb6]"
              placeholder="Search any 501(c)(3)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="bg-coral px-[22px] py-[15px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]">
              Search
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-8 py-11">

        {/* Featured charities — Givenest-curated, admin only */}
        {!isSearching && <div className="mb-10">
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
              <div key={c.id} className="overflow-hidden rounded-[10px] border border-border bg-white">
                <div className="h-[3px] bg-coral" />
                <div className="px-5 py-[18px]">
                  <div className="mb-[5px] flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-coral">{c.category}</span>
                    <span className="text-coral"><StarIcon /></span>
                  </div>
                  <div className="mb-[2px] text-sm font-medium">{c.name}</div>
                  <div className="mb-[14px] text-xs text-muted">{c.city}</div>
                  <div className="mb-3 h-px bg-border" />
                  <div className="mb-3 grid grid-cols-2 gap-[10px]">
                    <div>
                      <div className="mb-[3px] text-[9px] font-medium uppercase tracking-[0.06em] text-muted">Received</div>
                      <div className="text-base font-semibold text-coral">{fmt(c.total)}</div>
                    </div>
                    <div>
                      <div className="mb-[3px] text-[9px] font-medium uppercase tracking-[0.06em] text-muted">Closings</div>
                      <div className="text-base font-semibold">{c.closings}</div>
                    </div>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-sm bg-border">
                    <div className="h-full rounded-sm bg-coral" style={{ width: `${Math.min(100, (c.total / 65000) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* User favorites — only shown when non-empty and not searching */}
        {!isSearching && favoritesList.length > 0 && (
          <div className="mb-10">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-serif text-xl font-medium tracking-[-0.01em]">
                Your saved charities
              </h2>
              <span className="text-[13px] font-light text-muted">
                Saved by you
              </span>
            </div>

            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {favoritesList.map((r) => (
                <div key={r.ein} className="overflow-hidden rounded-[10px] border border-border bg-white">
                  <div className="h-[3px] bg-coral" />
                  <div className="px-5 py-[18px]">
                    <div className="mb-[5px] flex items-center justify-between">
                      <span className="rounded-full bg-coral/10 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-coral">Saved</span>
                      <button
                        onClick={() => toggleFavorite(r)}
                        className="text-coral transition-colors hover:text-coral/60"
                        title="Remove from saved"
                      >
                        <HeartIcon filled />
                      </button>
                    </div>
                    <div className="mb-[2px] text-sm font-medium">{r.name}</div>
                    {r.location && <div className="mb-[6px] text-xs text-muted">{r.location}</div>}
                    {r.description && (
                      <div className="line-clamp-2 text-xs font-light leading-[1.6] text-muted">{r.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {isSearching && (
          <div className="mb-10">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-serif text-xl font-medium tracking-[-0.01em]">
                {loading ? "Searching…" : `${sortedResults.length} results`}
              </h2>
              <span className="text-[13px] font-light text-muted">Powered by every.org</span>
            </div>

            {!loading && sortedResults.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No results found</p>
            )}

            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {sortedResults.map((r) => {
                const isSeed = SEED_EINS.has(r.ein);
                const isFavorited = favorites.has(r.ein);
                const isLocal = !isSeed && !isFavorited && locationScore(r.location) > 0;
                return (
                  <div key={r.ein || r.name} className="overflow-hidden rounded-[10px] border border-border bg-white">
                    <div className="h-[3px] bg-coral" />
                    <div className="px-5 py-[18px]">
                      <div className="mb-[5px] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSeed && (
                            <span className="rounded-full bg-coral/10 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-coral">Featured</span>
                          )}
                          {isFavorited && (
                            <span className="rounded-full bg-coral/10 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-coral">Saved</span>
                          )}
                          {isLocal && (
                            <span className="rounded-full bg-emerald-50 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-emerald-600">Local</span>
                          )}
                        </div>
                        {!isSeed && (
                          <button
                            onClick={() => toggleFavorite(r)}
                            className={`transition-colors ${isFavorited ? "text-coral hover:text-coral/60" : "text-muted hover:text-coral"}`}
                            title={isFavorited ? "Remove from saved" : "Save charity"}
                          >
                            <HeartIcon filled={isFavorited} />
                          </button>
                        )}
                      </div>
                      <div className="mb-[2px] text-sm font-medium">{r.name}</div>
                      {r.location && <div className="mb-[6px] text-xs text-muted">{r.location}</div>}
                      {r.description && (
                        <div className="mb-[14px] line-clamp-2 text-xs font-light leading-[1.6] text-muted">{r.description}</div>
                      )}
                      {r.profileUrl && (
                        <a href={r.profileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-coral hover:underline">
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
              { value: "$0",  label: "Donated to charity", highlight: false },
              { value: "0",   label: "Charities supported", highlight: false },
              { value: "0",   label: "Closings",            highlight: false },
              { value: "25%",      label: "% of commission donated at close", highlight: true },
            ].map(({ value: v, label, highlight }) => (
              <div key={label} className="flex items-baseline justify-between border-b border-border py-3">
                <span className="text-[13px] font-light text-muted">{label}</span>
                <span className={`text-base font-semibold ${highlight ? "text-coral" : "text-black"}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
