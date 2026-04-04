"use client";

import { useState, useEffect, useRef } from "react";
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

const CATEGORIES = [
  { label: "Featured",      slug: null,             match: null },
  { label: "All",           slug: null,             match: null },
  { label: "Education",     slug: "education",       match: "Education" },
  { label: "Housing",       slug: "human-services",  match: "Housing" },
  { label: "International", slug: "international",   match: "International" },
  { label: "Health",        slug: "health",          match: "Health" },
  { label: "Environment",   slug: "environment",     match: "Environment" },
  { label: "Animals",       slug: "animals",         match: "Animals" },
  { label: "Faith",         slug: "religion",        match: "Faith" },
  { label: "Community",     slug: "community",       match: "Community" },
  { label: "Arts",          slug: "arts-culture",    match: "Arts" },
];

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function Charities() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Featured");
  const [results, setResults] = useState<EveryOrgNonprofit[]>([]);
  const [loading, setLoading] = useState(false);
  // Starred: EIN → nonprofit data (for charities added via search)
  const [starred, setStarred] = useState<Map<string, EveryOrgNonprofit>>(() => {
    if (typeof window === "undefined") return new Map();
    try {
      const saved = localStorage.getItem("givenest-starred");
      if (saved) return new Map(JSON.parse(saved));
    } catch {}
    return new Map();
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLoc = useUserLocation();

  // Persist starred to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("givenest-starred", JSON.stringify(Array.from(starred.entries())));
    } catch {}
  }, [starred]);

  const isFeatured = (ein: string) => SEED_EINS.has(ein) || starred.has(ein);

  const toggleStar = (r: EveryOrgNonprofit) => {
    if (SEED_EINS.has(r.ein)) return; // can't un-feature seed charities
    setStarred((prev) => {
      const next = new Map(prev);
      if (next.has(r.ein)) next.delete(r.ein);
      else next.set(r.ein, r);
      return next;
    });
  };

  const activeCat = CATEGORIES.find((c) => c.label === activeCategory)!;

  const locationScore = (loc?: string) => {
    if (!loc || !userLoc) return 0;
    const l = loc.toLowerCase();
    if (userLoc.city && l.includes(userLoc.city.toLowerCase())) return 2;
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
        const slug = CATEGORIES.find((c) => c.label === activeCategory)?.slug;
        const causeParam = slug ? `&causes=${slug}` : "";
        const res = await fetch(
          `https://partners.every.org/v0.2/search/${encodeURIComponent(search.trim())}?apiKey=${key}&take=12${causeParam}`
        );
        const data = await res.json();
        setResults(data.nonprofits ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [search, activeCategory]);

  const isSearching = !!search.trim();

  // Which results to show (filter + sort)
  const filteredResults = activeCategory === "Featured"
    ? results.filter((r) => isFeatured(r.ein))
    : results;

  const sortedResults = filteredResults
    .slice()
    .sort((a, b) => locationScore(b.location) - locationScore(a.location));

  // Featured charities section: seed CHARITIES + starred search results (merged)
  const seedFiltered =
    activeCategory === "All" || activeCategory === "Featured"
      ? CHARITIES
      : CHARITIES.filter((c) => c.category === activeCat.match);

  const starredList = Array.from(starred.values()).filter(
    (r) => activeCategory === "All" || activeCategory === "Featured" || !activeCat.match || r.location?.includes(activeCat.match ?? "")
  );

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

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`rounded-full px-[14px] py-[7px] text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
                  activeCategory === cat.label
                    ? "bg-coral text-white"
                    : "bg-border text-muted hover:text-black"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-11">

        {/* Featured charities section */}
        {(seedFiltered.length > 0 || starredList.length > 0) && (
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
              {seedFiltered.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-[10px] border border-border bg-white">
                  <div className="h-[3px] bg-coral" />
                  <div className="px-5 py-[18px]">
                    <div className="mb-[5px] flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-coral">{c.category}</span>
                      <span className="text-coral"><StarIcon filled /></span>
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

              {starredList.map((r) => (
                <div key={r.ein} className="overflow-hidden rounded-[10px] border border-border bg-white">
                  <div className="h-[3px] bg-coral" />
                  <div className="px-5 py-[18px]">
                    <div className="mb-[5px] flex items-center justify-between">
                      <span className="rounded-full bg-coral/10 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-coral">Featured</span>
                      <button
                        onClick={() => toggleStar(r)}
                        className="text-coral transition-colors hover:text-coral/60"
                        title="Remove from featured"
                      >
                        <StarIcon filled />
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
                const featured = isFeatured(r.ein);
                const isLocal = !featured && locationScore(r.location) > 0;
                const isSeed = SEED_EINS.has(r.ein);
                return (
                  <div key={r.ein || r.name} className="overflow-hidden rounded-[10px] border border-border bg-white">
                    <div className="h-[3px] bg-coral" />
                    <div className="px-5 py-[18px]">
                      <div className="mb-[5px] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {featured && (
                            <span className="rounded-full bg-coral/10 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-coral">Featured</span>
                          )}
                          {isLocal && (
                            <span className="rounded-full bg-emerald-50 px-[8px] py-px text-[9px] font-medium uppercase tracking-[0.06em] text-emerald-600">Local</span>
                          )}
                        </div>
                        {!isSeed && (
                          <button
                            onClick={() => toggleStar(r)}
                            className={`transition-colors ${featured ? "text-coral hover:text-coral/60" : "text-muted hover:text-coral"}`}
                            title={featured ? "Remove from featured" : "Add to featured"}
                          >
                            <StarIcon filled={featured} />
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
              { value: "$284,190", label: "Donated to charity", highlight: false },
              { value: "41",       label: "Charities supported", highlight: false },
              { value: "82",       label: "Closings",            highlight: false },
              { value: "100%",     label: "Donated in full, every closing", highlight: true },
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
