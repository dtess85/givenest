"use client";

import { useState, useEffect, useRef } from "react";
import { CHARITIES } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
import { useUserLocation } from "@/lib/useUserLocation";
import LeadModal from "@/components/LeadModal";

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  location?: string;
  description?: string;
  profileUrl?: string;
  logoUrl?: string;
}

const SEED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean) as string[]);
const CATEGORIES = Array.from(new Set(CHARITIES.map((c) => c.category)));
const LOCATIONS = Array.from(new Set(CHARITIES.map((c) => c.city)));

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState<{ name: string; ein: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const toggleFavorite = (r: EveryOrgNonprofit) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      if (next.has(r.ein)) next.delete(r.ein);
      else next.set(r.ein, r);
      return next;
    });
  };

  const chooseCharity = (name: string, ein: string) => {
    setSelectedCharity({ name, ein });
    setLeadModalOpen(true);
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
  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedLocation ? 1 : 0);

  const sortedResults = results
    .slice()
    .sort((a, b) => locationScore(b.location) - locationScore(a.location));

  // Apply filters
  const filteredCharities = CHARITIES.filter((c) => {
    if (selectedCategory && c.category !== selectedCategory) return false;
    if (selectedLocation && c.city !== selectedLocation) return false;
    return true;
  });

  const filteredResults = sortedResults.filter((r) => {
    if (selectedLocation && !r.location?.toLowerCase().includes(selectedLocation.split(",")[0].toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <section className="relative flex min-h-[35vh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/images/charities-banner.png"
            alt="Community hands around a plant"
            className="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)" }}
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-8 py-[60px] md:px-12">
          <div className="mb-5 inline-block rounded-full bg-coral px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
            Charity showcase
          </div>
          <h1 className="mb-5 max-w-[700px] font-serif text-[clamp(38px,5vw,68px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)" }}>
            1.8M+ charities.{" "}
            <em className="text-coral">Your choice.</em>
          </h1>
          <div className="flex max-w-[560px] items-start gap-2">
            {/* Search pill */}
            <div className="flex flex-1 overflow-hidden rounded-lg shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
              <input
                className="flex-1 border-none bg-white px-[18px] py-[16px] text-[15px] font-light outline-none placeholder:text-[#c0bdb6]"
                placeholder="Search any organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="bg-coral px-[22px] py-[16px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]">
                Search
              </button>
            </div>

            {/* Filter button + dropdown */}
            <div className="relative hidden" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={`flex items-center gap-[6px] whitespace-nowrap rounded-lg border px-4 py-[16px] text-sm font-medium shadow-[0_4px_32px_rgba(0,0,0,0.2)] transition-colors ${filterOpen || activeFilterCount > 0 ? "border-coral bg-coral/[0.06] text-coral" : "border-white/60 bg-white/90 text-[#2a2825] hover:border-white hover:bg-white"}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-coral px-[7px] py-px text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[240px] rounded-[10px] border border-border bg-white p-4 shadow-xl">
                  <div className="mb-3">
                    <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Type</div>
                    <div className="flex flex-wrap gap-[6px]">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            selectedCategory === cat
                              ? "border-coral bg-coral/10 text-coral"
                              : "border-border text-muted hover:border-coral"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Location</div>
                    <div className="flex flex-wrap gap-[6px]">
                      {LOCATIONS.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => setSelectedLocation(selectedLocation === loc ? null : loc)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            selectedLocation === loc
                              ? "border-coral bg-coral/10 text-coral"
                              : "border-border text-muted hover:border-coral"
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(selectedCategory || selectedLocation) && (
                    <button
                      onClick={() => { setSelectedCategory(null); setSelectedLocation(null); }}
                      className="mt-3 w-full rounded-md border border-border py-[6px] text-xs text-muted transition hover:text-black"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-8 py-11">

        {/* Active filter pills */}
        {(selectedCategory || selectedLocation) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
                {selectedCategory}
                <button onClick={() => setSelectedCategory(null)} className="ml-1 leading-none hover:opacity-70">×</button>
              </span>
            )}
            {selectedLocation && (
              <span className="flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
                {selectedLocation}
                <button onClick={() => setSelectedLocation(null)} className="ml-1 leading-none hover:opacity-70">×</button>
              </span>
            )}
          </div>
        )}

        {/* Featured charities — Givenest-curated, admin only */}
        {!isSearching && <div className="mb-10">
          <div className="mb-5">
            <h2 className="font-serif text-xl font-medium tracking-[-0.01em]">
              Featured charities
            </h2>
          </div>

          {filteredCharities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No charities match the selected filters</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredCharities.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                      {c.name.split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">{c.name}</span>
                        <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-coral">{c.category}</span>
                      </div>
                      <div className="text-[11px] text-muted">{c.city}</div>
                    </div>
                    <button
                      onClick={() => chooseCharity(c.name, c.ein ?? "")}
                      className="flex-shrink-0 rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral cursor-pointer"
                    >
                      Choose
                    </button>
                  </div>
                  {c.description && (
                    <p className="mt-2 pl-12 text-[12px] font-light leading-[1.6] text-muted">{c.description}</p>
                  )}
                </div>
              ))}
              {/* Become a featured charity CTA — inside grid as a card */}
              <div className="rounded-lg border border-dashed border-coral/40 bg-white px-4 py-4">
                <h3 className="text-[13px] font-medium tracking-[-0.01em]">Become a featured charity</h3>
                <p className="mt-1 text-[12px] font-light leading-[1.6] text-muted">
                  Partner with Givenest to get priority visibility and receive donations from every closing.
                </p>
                <a
                  href="mailto:dustin@givenest.com?subject=Featured Charity Inquiry"
                  className="mt-3 inline-block rounded-md bg-coral px-4 py-[7px] text-[12px] font-medium text-white transition-colors hover:bg-[#d4574a]"
                >
                  Get featured
                </a>
              </div>
            </div>
          )}
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {favoritesList.map((r) => (
                <div key={r.ein} className="flex w-full items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                    {r.name.split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{r.name}</div>
                    {r.location && <div className="text-[11px] text-muted truncate">{r.location}</div>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleFavorite(r)}
                      className="p-1.5 text-coral transition-colors hover:text-coral/60"
                      title="Remove from saved"
                    >
                      <HeartIcon filled />
                    </button>
                    <button
                      onClick={() => chooseCharity(r.name, r.ein)}
                      className="rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral cursor-pointer"
                    >
                      Choose
                    </button>
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
                {loading ? "Searching…" : `${filteredResults.length} results`}
              </h2>
              <span className="text-[13px] font-light text-muted">Powered by every.org</span>
            </div>

            {!loading && filteredResults.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No results found</p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredResults.map((r) => {
                const isSeed = SEED_EINS.has(r.ein);
                const isFavorited = favorites.has(r.ein);
                const isLocal = !isSeed && !isFavorited && locationScore(r.location) > 0;
                return (
                  <div key={r.ein || r.name} className="flex w-full items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                      {r.name.split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">{r.name}</span>
                        {isSeed && (
                          <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-coral">Featured</span>
                        )}
                        {isLocal && (
                          <span className="flex-shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-emerald-600">Local</span>
                        )}
                      </div>
                      {r.location && <div className="text-[11px] text-muted truncate">{r.location}</div>}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {!isSeed && (
                        <button
                          onClick={() => toggleFavorite(r)}
                          className={`p-1.5 transition-colors ${isFavorited ? "text-coral hover:text-coral/60" : "text-muted hover:text-coral"}`}
                          title={isFavorited ? "Remove from saved" : "Save charity"}
                        >
                          <HeartIcon filled={isFavorited} />
                        </button>
                      )}
                      <button
                        onClick={() => chooseCharity(r.name, r.ein)}
                        className="rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral cursor-pointer"
                      >
                        Choose
                      </button>
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

      <LeadModal
        open={leadModalOpen}
        onClose={() => { setLeadModalOpen(false); setSelectedCharity(null); }}
        propertyAddress="Charity page inquiry"
        propertyPrice={500000}
        defaultCharities={selectedCharity ? [selectedCharity] : undefined}
      />
    </div>
  );
}
