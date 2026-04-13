"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AgentCard from "@/components/AgentCard";
import LeadModal from "@/components/LeadModal";

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
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
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
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whether we're in browse mode (search or letter filter active)
  const isBrowsing = !!(query || activeLetter);

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

  const fetchAgents = useCallback(async (q: string, letter: string | null, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (letter) params.set("letter", letter);
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

  // Debounced search — only fetch when browsing
  useEffect(() => {
    if (!query && !activeLetter) {
      setAgents([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPage(1);
      fetchAgents(query, query ? null : activeLetter, 1);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, activeLetter, fetchAgents]);

  // Page change (only when browsing)
  useEffect(() => {
    if (!query && !activeLetter) return;
    fetchAgents(query, query ? null : activeLetter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSelect(agent: Agent) {
    setSelectedAgent(agent);
    setLeadModalOpen(true);
  }

  function handleLetterClick(letter: string) {
    setQuery("");
    setActiveLetter((prev) => (prev === letter ? null : letter));
    setPage(1);
  }

  // Separate givenest agents from browsing results
  const externalAgents = agents.filter((a) => !a.is_givenest);
  const savedAgentsList = Array.from(favorites.values());

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-pampas px-8 py-16 text-center">
        <div className="mx-auto max-w-[600px]">
          <div className="mb-4 inline-block rounded-full bg-coral px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
            Agent directory
          </div>
          <h1 className="mb-4 font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.15] tracking-[-0.02em]">
            Find an agent. Fund a cause.
          </h1>
          <p className="text-[15px] leading-[1.7] text-muted">
            Work with any Arizona Realtor through Givenest and 25% of the total commission
            is donated to a charity of your choice — at no extra cost.
          </p>
        </div>
      </section>

      {/* Search + directory */}
      <section className="mx-auto max-w-[1100px] px-8 py-10">
        {/* Search bar */}
        <div className="mb-6">
          <input
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-[14px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
            placeholder="Search by agent name or brokerage..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (e.target.value) setActiveLetter(null); }}
          />
        </div>

        {/* A-Z index */}
        {!query && (
          <div className="mb-6 flex flex-wrap items-center gap-1">
            <button
              onClick={() => { setActiveLetter(null); setPage(1); }}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                !activeLetter
                  ? "bg-coral text-white"
                  : "text-muted hover:bg-pampas hover:text-black"
              }`}
            >
              All
            </button>
            {LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className={`rounded-md px-2 py-1 text-[12px] font-medium transition-colors ${
                  activeLetter === letter
                    ? "bg-coral text-white"
                    : "text-muted hover:bg-pampas hover:text-black"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

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
            <div className="mb-10">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                Featured agents
              </h2>
              {featuredLoading ? (
                <div className="py-12 text-center text-[13px] text-muted">Loading agents...</div>
              ) : featuredAgents.length === 0 ? (
                <div className="rounded-[10px] border border-border bg-white px-6 py-10 text-center">
                  <h3 className="font-serif text-lg font-medium tracking-[-0.01em]">Become a featured agent</h3>
                  <p className="mx-auto mt-2 max-w-[420px] text-[13px] font-light leading-[1.7] text-muted">
                    Featured agents appear at the top of our directory and get priority visibility
                    with buyers and sellers. Partner with Givenest and grow your business while
                    giving back to the community.
                  </p>
                  <a
                    href="mailto:dustin@givenest.com?subject=Featured Agent Inquiry"
                    className="mt-5 inline-block rounded-md bg-coral px-6 py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
                  >
                    Get featured
                  </a>
                </div>
              ) : (
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
              )}
            </div>
          </>
        )}

        {/* ── Browse view: search results or letter-filtered list ── */}
        {isBrowsing && (
          <>
            {/* Count */}
            {!loading && (
              <div className="mb-6 text-[12px] text-muted">
                {total.toLocaleString()} agent{total !== 1 ? "s" : ""} found
                {activeLetter && ` starting with "${activeLetter}"`}
              </div>
            )}

            {/* Agent grid heading */}
            <div className="mb-4">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                {query ? "Search results" : `Agents — ${activeLetter}`}
              </h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-muted">Loading agents...</div>
            ) : externalAgents.length === 0 && agents.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-muted">
                No agents found{query ? ` for "${query}"` : activeLetter ? ` starting with "${activeLetter}"` : ""}. Try a different search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(query ? agents : externalAgents).map((agent) => (
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
