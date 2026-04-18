"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import AgentCard from "@/components/AgentCard";
import LeadModal from "@/components/LeadModal";
import { getInitials } from "@/lib/utils";

interface Agent {
  name: string;
  office_name: string | null;
  primary_city: string | null;
  active_listing_count: number;
  is_givenest: boolean;
}

interface SavedAgent {
  name: string;
  office_name: string | null;
  primary_city: string | null;
  active_listing_count: number;
  is_givenest: boolean;
}

const AGENT_FAVORITES_KEY = "givenest-agent-favorites";
const FEATURED_LIMIT = 12;

const GIVENEST_TEAM = [
  {
    initials: "KY",
    name: "Kyndall Yates",
    email: "kyndall@givenest.com",
    phone: "(480) 400-8690",
  },
  {
    initials: "DT",
    name: "Dustin Tessendorf",
    email: "dustin@givenest.com",
    phone: "(480) 779-7204",
  },
];

export default function AgentsPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<Map<string, SavedAgent>>(new Map());
  const [suggestions, setSuggestions] = useState<Agent[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Whether we're in browse mode (search committed) — agents are private until
  // typed; we don't expose a public alphabetical roster.
  const isBrowsing = !!query;

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AGENT_FAVORITES_KEY);
      if (saved) setFavorites(new Map(JSON.parse(saved)));
    } catch {}
  }, []);

  const persistFavorites = (next: Map<string, SavedAgent>) => {
    setFavorites(next);
    try {
      localStorage.setItem(AGENT_FAVORITES_KEY, JSON.stringify(Array.from(next.entries())));
    } catch {}
  };

  const toggleFavorite = (agent: Agent) => {
    const next = new Map(favorites);
    if (next.has(agent.name)) next.delete(agent.name);
    else next.set(agent.name, agent);
    persistFavorites(next);
  };

  // Fetch featured agents on mount (admin-curated via is_featured flag)
  useEffect(() => {
    (async () => {
      setFeaturedLoading(true);
      try {
        const res = await fetch(`/api/agents?featured=true&limit=${FEATURED_LIMIT}&page=1`);
        if (!res.ok) { setFeaturedAgents([]); return; }
        const data = await res.json();
        setFeaturedAgents((data.agents ?? []).filter((a: Agent) => !a.is_givenest));
      } catch {
        setFeaturedAgents([]);
      } finally {
        setFeaturedLoading(false);
      }
    })();
  }, []);

  const fetchAgents = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(p));
      params.set("limit", "48");
      const res = await fetch(`/api/agents?${params}`);
      if (!res.ok) { setAgents([]); setTotal(0); setTotalPages(0); return; }
      const data = await res.json();
      setAgents(data.agents ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Committed search — fires immediately when user hits Enter / Search
  useEffect(() => {
    if (!query) {
      setAgents([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }
    setPage(1);
    fetchAgents(query, 1);
  }, [query, fetchAgents]);

  // Page change (only when browsing)
  useEffect(() => {
    if (!query) return;
    fetchAgents(query, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Live autocomplete suggestions (driven by input, not committed)
  useEffect(() => {
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    const q = input.trim();
    if (!q) { setSuggestions([]); setSuggestLoading(false); return; }

    suggestTimerRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const params = new URLSearchParams({ q, page: "1", limit: "6" });
        const res = await fetch(`/api/agents?${params}`);
        if (!res.ok) { setSuggestions([]); return; }
        const data = await res.json();
        setSuggestions(data.agents ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 220);
    return () => { if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current); };
  }, [input]);

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const commitSearch = (value?: string) => {
    const v = (value ?? input).trim();
    setQuery(v);
    setDropdownOpen(false);
  };

  const clearSearch = () => {
    setInput("");
    setQuery("");
    setSuggestions([]);
    setDropdownOpen(false);
  };

  function handleSelect(agent: Agent) {
    setSelectedAgent(agent);
    setLeadModalOpen(true);
  }

  const savedAgentsList = Array.from(favorites.values());

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-pampas px-8 py-16 text-center">
        <div className="mx-auto max-w-[600px]">
          <div className="mb-4 inline-block rounded-full bg-coral px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
            Agent directory
          </div>
          <h1 className="mb-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-[-0.02em]">
            Find an agent. <span className="italic text-coral">Fund a cause.</span>
          </h1>
          <p className="text-[15px] leading-[1.7] text-muted">
            Work with any Arizona agent through givenest and 25% of the total commission
            is donated to a charity of your choice — at no extra cost.{" "}
            <Link href="/giving" className="text-coral underline-offset-2 hover:underline">
              Learn more
            </Link>
          </p>
        </div>
      </section>

      {/* Search + directory */}
      <section className="mx-auto max-w-[1100px] px-8 py-10">
        {/* Search bar — autocomplete + commit on Enter/click */}
        <div className="relative mb-6" ref={searchBoxRef}>
          <form
            onSubmit={(e) => { e.preventDefault(); commitSearch(); }}
            className="flex overflow-hidden rounded-lg border border-border bg-white focus-within:border-coral"
          >
            <input
              className="flex-1 border-none bg-white px-4 py-3 text-[14px] outline-none placeholder:text-[#c0bdb6]"
              placeholder="Search by agent name or brokerage..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setDropdownOpen(true); }}
              onFocus={() => { if (input.trim()) setDropdownOpen(true); }}
              onKeyDown={(e) => { if (e.key === "Escape") setDropdownOpen(false); }}
            />
            {input && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-2 text-muted hover:text-black"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="bg-coral px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Search
            </button>
          </form>

          {/* Autocomplete dropdown */}
          {dropdownOpen && input.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-border bg-white shadow-xl">
              {suggestLoading && suggestions.length === 0 && (
                <div className="px-4 py-3 text-[12px] text-muted">Searching…</div>
              )}
              {!suggestLoading && suggestions.length === 0 && (
                <div className="px-4 py-3 text-[12px] text-muted">No matches — press Enter to search anyway</div>
              )}
              {suggestions.slice(0, 6).map((a) => {
                const initials = getInitials(a.name);
                return (
                  <button
                    key={a.name}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(a); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-3 border-b border-border px-4 py-[10px] text-left hover:bg-pampas"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[10px] font-medium text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-black">{a.name}</span>
                        {a.is_givenest && (
                          <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.05em] text-coral">Givenest</span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted">
                        {[a.office_name, a.primary_city].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commitSearch(); }}
                className="flex w-full items-center justify-between px-4 py-[10px] text-left text-[12px] text-coral hover:bg-pampas"
              >
                <span>See all results for &ldquo;{input.trim()}&rdquo;</span>
                <span aria-hidden>→</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Default view: Givenest + Featured + Saved ── */}
        {!isBrowsing && (
          <>
            {/* Saved agents */}
            {savedAgentsList.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Saved agents
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {savedAgentsList.map((agent) => (
                    <AgentCard
                      key={agent.name}
                      name={agent.name}
                      officeName={agent.office_name}
                      primaryCity={agent.primary_city}
                      activeListingCount={agent.active_listing_count}
                      isGivenest={agent.is_givenest}
                      isFavorite={true}
                      onSelect={() => handleSelect(agent)}
                      onToggleFavorite={() => toggleFavorite(agent)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Givenest agents */}
            <div className="mb-10">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                Givenest agents
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GIVENEST_TEAM.map((a) => (
                  <div key={a.initials} className="rounded-lg border border-coral/40 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                        {a.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium">{a.name}</span>
                          <span className="rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-coral">Givenest</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                          <a href={`tel:${a.phone}`} className="hover:text-coral transition-colors">{a.phone}</a>
                          <span className="text-border">·</span>
                          <a href={`mailto:${a.email}`} className="hover:text-coral transition-colors">{a.email}</a>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelect({ name: a.name, office_name: "Givenest", primary_city: null, active_listing_count: 0, is_givenest: true })}
                        className="flex-shrink-0 rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral cursor-pointer"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured agents */}
            {!featuredLoading && featuredAgents.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Featured agents
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {featuredAgents.map((agent) => (
                    <AgentCard
                      key={agent.name}
                      name={agent.name}
                      officeName={agent.office_name}
                      primaryCity={agent.primary_city}
                      activeListingCount={agent.active_listing_count}
                      isGivenest={agent.is_givenest}
                      isFavorite={favorites.has(agent.name)}
                      onSelect={() => handleSelect(agent)}
                      onToggleFavorite={() => toggleFavorite(agent)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Browse view: search results or letter-filtered list ── */}
        {isBrowsing && (
          <>
            {/* Count */}
            {!loading && (
              <div className="mb-6 text-[12px] text-muted">
                {total.toLocaleString()} agent{total !== 1 ? "s" : ""} found
              </div>
            )}

            {/* Agent grid heading */}
            <div className="mb-4">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                Search results
              </h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-muted">Loading agents...</div>
            ) : agents.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-muted">
                No agents found for &quot;{query}&quot;. Try a different search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.name}
                    name={agent.name}
                    officeName={agent.office_name}
                    primaryCity={agent.primary_city}
                    activeListingCount={agent.active_listing_count}
                    isGivenest={agent.is_givenest}
                    isFavorite={favorites.has(agent.name)}
                    onSelect={() => handleSelect(agent)}
                    onToggleFavorite={() => toggleFavorite(agent)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-border px-4 py-2 text-[13px] transition-colors hover:border-coral disabled:opacity-30 disabled:hover:border-border"
                >
                  Previous
                </button>
                <span className="text-[13px] text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-border px-4 py-2 text-[13px] transition-colors hover:border-coral disabled:opacity-30 disabled:hover:border-border"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Become a featured agent — always visible */}
        <div className="mb-10">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            Become a featured agent
          </h2>
          <div className="flex items-center gap-4 rounded-lg border border-dashed border-coral/40 bg-white px-5 py-5">
            <p className="flex-1 font-serif italic text-[15px] leading-[1.4] text-black">
              Partner with Givenest to get priority visibility and grow your business while giving back to the community.
            </p>
            <a
              href="mailto:dustin@givenest.com?subject=Featured Agent Inquiry"
              className="flex-shrink-0 rounded-md bg-coral px-3 py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Get featured
            </a>
          </div>
        </div>
      </section>

      {/* Lead Modal */}
      <LeadModal
        open={leadModalOpen}
        onClose={() => { setLeadModalOpen(false); setSelectedAgent(null); }}
        propertyAddress="Agent directory inquiry"
        propertyPrice={500000}
        defaultAgent={selectedAgent ? { name: selectedAgent.name, office_name: selectedAgent.office_name } : undefined}
      />
    </>
  );
}
