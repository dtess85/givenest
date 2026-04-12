"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AgentCard from "@/components/AgentCard";
import ConsultForm from "@/components/ConsultForm";

interface Agent {
  name: string;
  office_name: string | null;
  primary_city: string | null;
  active_listing_count: number;
  is_givenest: boolean;
}

const GIVENEST_TEAM = [
  {
    initials: "KY",
    name: "Kyndall Yates",
    title: "Co-Founder · Salesperson",
    email: "kyndall@givenest.com",
    phone: "(480) 400-8690",
  },
  {
    initials: "DT",
    name: "Dustin Tessendorf",
    title: "Co-Founder · Designated Broker",
    email: "dustin@givenest.com",
    phone: "(480) 779-7204",
  },
];

export default function AgentsPage() {
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchAgents = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(p));
      params.set("limit", "48");
      const res = await fetch(`/api/agents?${params}`);
      const data = await res.json();
      setAgents(data.agents ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPage(1);
      fetchAgents(query, 1);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, fetchAgents]);

  // Page change
  useEffect(() => {
    fetchAgents(query, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSelect(agent: Agent) {
    setSelectedAgent(agent);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }

  // Separate givenest agents from the API results (they may also appear in the query)
  const externalAgents = agents.filter((a) => !a.is_givenest);
  const showGivenestPinned = !query; // Only show pinned section when not searching

  return (
    <>
      {/* ── Hero ── */}
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

      {/* ── Search + directory ── */}
      <section className="mx-auto max-w-[1100px] px-8 py-10">
        {/* Search bar */}
        <div className="mb-8">
          <input
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-[14px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
            placeholder="Search by agent name or brokerage…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!loading && (
            <div className="mt-2 text-[12px] text-muted">
              {total.toLocaleString()} agent{total !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Pinned Givenest agents */}
        {showGivenestPinned && (
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
                        <span className="rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-coral">
                          Givenest
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">{a.title}</div>
                    </div>
                    <a
                      href={`mailto:${a.email}`}
                      className="flex-shrink-0 rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral"
                    >
                      Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent grid */}
        <div className="mb-4">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {query ? "Search results" : "All Arizona agents"}
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[13px] text-muted">Loading agents…</div>
        ) : externalAgents.length === 0 && agents.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted">
            No agents found{query ? ` for "${query}"` : ""}. Try a different search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(query ? agents : externalAgents).map((agent) => (
              <AgentCard
                key={agent.name}
                name={agent.name}
                officeName={agent.office_name}
                primaryCity={agent.primary_city}
                activeListingCount={agent.active_listing_count}
                isGivenest={agent.is_givenest}
                onSelect={() => handleSelect(agent)}
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
      </section>

      {/* ── Consult form overlay ── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div ref={formRef} className="w-full max-w-[420px] rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-serif text-[15px] font-medium">
                Request a consult
              </h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-[18px] text-muted hover:text-black"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-medium text-white">
                  {selectedAgent.name
                    .split(" ")
                    .filter((w) => w[0] === w[0].toUpperCase())
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-[13px] font-medium">{selectedAgent.name}</div>
                  {selectedAgent.office_name && (
                    <div className="text-[11px] text-muted">{selectedAgent.office_name}</div>
                  )}
                </div>
              </div>
              <div className="mb-3 rounded bg-pampas px-3 py-2 text-[11px] text-muted">
                Givenest will coordinate with this agent on your behalf. 25% of the total
                commission will be donated to a charity you choose at closing.
              </div>
              <ConsultForm
                agentName={selectedAgent.name}
                agentOffice={selectedAgent.office_name}
                source="directory"
                onSuccess={() => setTimeout(() => setSelectedAgent(null), 2000)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
