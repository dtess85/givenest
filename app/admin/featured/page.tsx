"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ── Types ── */

interface FeaturedAgent {
  id: string;
  name: string;
  office_name: string | null;
  primary_city: string | null;
  active_listing_count: number;
  is_givenest: boolean;
  is_featured: boolean;
}

interface FeaturedCharity {
  id: string;
  name: string;
  ein: string | null;
  city: string | null;
  state: string | null;
  is_featured: boolean;
}

interface FeaturedListing {
  id: string;
  spark_listing_key: string;
  address: string;
  city: string | null;
  price: number | null;
  status: string | null;
  is_featured: boolean;
}

type Tab = "agents" | "charities" | "listings";

/* ── Helpers ── */

function fmt(n: number | null) {
  if (n == null) return "";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/* ── Page ── */

export default function FeaturedAdminPage() {
  const [tab, setTab] = useState<Tab>("agents");

  // Featured items
  const [agents, setAgents] = useState<FeaturedAgent[]>([]);
  const [charities, setCharities] = useState<FeaturedCharity[]>([]);
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<(FeaturedAgent | FeaturedCharity | FeaturedListing)[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toggling
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/featured");
      const data = await res.json();
      setAgents(data.agents ?? []);
      setCharities(data.charities ?? []);
      setListings(data.listings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // Search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim() || search.length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const type = tab === "agents" ? "agent" : tab === "charities" ? "charity" : "listing";
        const res = await fetch(`/api/admin/featured/search?type=${type}&q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [search, tab]);

  // Clear search when switching tabs
  useEffect(() => {
    setSearch("");
    setSearchResults([]);
  }, [tab]);

  async function toggleFeatured(type: "agent" | "charity" | "listing", id: string, featured: boolean) {
    setToggling((prev) => new Set(prev).add(id));
    try {
      await fetch("/api/admin/featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, featured }),
      });
      // Refresh
      await fetchFeatured();
      // Update search results in place
      setSearchResults((prev) =>
        prev.map((r) => ("id" in r && r.id === id ? { ...r, is_featured: featured } : r))
      );
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral";

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "agents", label: "Agents", count: agents.length },
    { key: "charities", label: "Charities", count: charities.length },
    { key: "listings", label: "Properties", count: listings.length },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {/* Header */}
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[860px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium text-white">
              give<span className="text-coral">nest</span>
            </a>
            <span className="text-white/30">|</span>
            <span className="text-[13px] text-white/60">Admin</span>
          </div>
          <Link href="/admin" className="text-[13px] text-white/60 hover:text-white">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Featured</h1>
        <p className="mb-8 text-[14px] text-muted">
          Choose which agents, charities, and properties appear in the featured sections across the site.
        </p>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-white border border-border p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? "bg-coral text-white"
                  : "text-muted hover:bg-pampas hover:text-black"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 ${tab === t.key ? "text-white/70" : "text-muted"}`}>
                  ({t.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search to add */}
        <div className="mb-6 overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-[13px] font-medium">
              Add featured {tab === "agents" ? "agent" : tab === "charities" ? "charity" : "property"}
            </h2>
          </div>
          <div className="p-5">
            <input
              className={inputCls}
              placeholder={
                tab === "agents"
                  ? "Search agents by name or brokerage..."
                  : tab === "charities"
                  ? "Search charities by name or EIN..."
                  : "Search properties by address or city..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Search results */}
            {(searchResults.length > 0 || searchLoading) && (
              <div className="mt-3 max-h-[320px] overflow-y-auto rounded-md border border-border">
                {searchLoading && searchResults.length === 0 && (
                  <div className="px-4 py-3 text-[12px] text-muted">Searching...</div>
                )}
                {tab === "agents" &&
                  (searchResults as FeaturedAgent[]).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
                    >
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-medium text-white">
                        {initials(a.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{a.name}</div>
                        <div className="text-[11px] text-muted truncate">
                          {[a.office_name, a.primary_city].filter(Boolean).join(" · ")}
                          {a.active_listing_count > 0 && ` · ${a.active_listing_count} listings`}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured("agent", a.id, !a.is_featured)}
                        disabled={toggling.has(a.id)}
                        className={`flex-shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          a.is_featured
                            ? "border border-coral bg-coral/10 text-coral hover:bg-coral/20"
                            : "border border-border text-muted hover:border-coral hover:text-coral"
                        } ${toggling.has(a.id) ? "opacity-50" : ""}`}
                      >
                        {a.is_featured ? "Featured ✓" : "Add"}
                      </button>
                    </div>
                  ))}
                {tab === "charities" &&
                  (searchResults as FeaturedCharity[]).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{c.name}</div>
                        <div className="text-[11px] text-muted truncate">
                          {[c.ein, c.city, c.state].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured("charity", c.id, !c.is_featured)}
                        disabled={toggling.has(c.id)}
                        className={`flex-shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          c.is_featured
                            ? "border border-coral bg-coral/10 text-coral hover:bg-coral/20"
                            : "border border-border text-muted hover:border-coral hover:text-coral"
                        } ${toggling.has(c.id) ? "opacity-50" : ""}`}
                      >
                        {c.is_featured ? "Featured ✓" : "Add"}
                      </button>
                    </div>
                  ))}
                {tab === "listings" &&
                  (searchResults as FeaturedListing[]).map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{l.address}</div>
                        <div className="text-[11px] text-muted truncate">
                          {[l.city, l.status, fmt(l.price)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured("listing", l.id, !l.is_featured)}
                        disabled={toggling.has(l.id)}
                        className={`flex-shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          l.is_featured
                            ? "border border-coral bg-coral/10 text-coral hover:bg-coral/20"
                            : "border border-border text-muted hover:border-coral hover:text-coral"
                        } ${toggling.has(l.id) ? "opacity-50" : ""}`}
                      >
                        {l.is_featured ? "Featured ✓" : "Add"}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Currently featured list */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-[13px] font-medium">
              Currently featured{" "}
              <span className="text-muted">
                ({tab === "agents" ? agents.length : tab === "charities" ? charities.length : listings.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-center text-[13px] text-muted">Loading...</div>
          ) : (
            <div>
              {/* Agents list */}
              {tab === "agents" &&
                (agents.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] text-muted">
                    No featured agents yet. Search above to add some.
                  </div>
                ) : (
                  agents.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[10px] font-medium text-white">
                        {initials(a.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium truncate">{a.name}</span>
                          {a.is_givenest && (
                            <span className="rounded bg-coral/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-coral">
                              Givenest
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {[a.office_name, a.primary_city].filter(Boolean).join(" · ")}
                          {a.active_listing_count > 0 && ` · ${a.active_listing_count} listings`}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured("agent", a.id, false)}
                        disabled={toggling.has(a.id)}
                        className={`flex-shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 ${
                          toggling.has(a.id) ? "opacity-50" : ""
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ))}

              {/* Charities list */}
              {tab === "charities" &&
                (charities.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] text-muted">
                    No featured charities yet. Search above to add some.
                  </div>
                ) : (
                  charities.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{c.name}</div>
                        <div className="text-[11px] text-muted truncate">
                          {[c.ein, c.city, c.state].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured("charity", c.id, false)}
                        disabled={toggling.has(c.id)}
                        className={`flex-shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 ${
                          toggling.has(c.id) ? "opacity-50" : ""
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ))}

              {/* Listings list */}
              {tab === "listings" &&
                (listings.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] text-muted">
                    No featured properties yet. Search above to add some.
                  </div>
                ) : (
                  listings.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{l.address}</div>
                        <div className="text-[11px] text-muted truncate">
                          {[l.city, l.status, fmt(l.price)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured("listing", l.id, false)}
                        disabled={toggling.has(l.id)}
                        className={`flex-shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 ${
                          toggling.has(l.id) ? "opacity-50" : ""
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
