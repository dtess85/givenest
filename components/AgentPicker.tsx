"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Agent {
  name: string;
  office_name: string | null;
  primary_city: string | null;
  active_listing_count: number;
  is_givenest: boolean;
}

interface AgentPickerProps {
  defaultAgent?: Agent;
  onSelect: (agent: Agent) => void;
}

export default function AgentPicker({ defaultAgent, onSelect }: AgentPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Agent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/agents?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.agents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
        placeholder="Search for an agent by name…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
      />

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[260px] overflow-y-auto rounded-lg border border-border bg-white shadow-md">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-muted">Searching…</div>
          )}
          {results.map((agent) => {
            const initials = agent.name
              .split(" ")
              .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
              .slice(0, 2)
              .map((w) => w[0])
              .join("");
            return (
              <button
                key={agent.name}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-pampas"
                onClick={() => {
                  onSelect(agent);
                  setQuery(agent.name);
                  setIsOpen(false);
                }}
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-medium text-white">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{agent.name}</div>
                  <div className="text-[10px] text-muted truncate">
                    {[agent.office_name, agent.primary_city].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {agent.is_givenest && (
                  <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-coral">
                    Givenest
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {defaultAgent && !query && (
        <div className="mt-2 text-[11px] text-muted">
          Default: <span className="font-medium text-black">{defaultAgent.name}</span>
          {defaultAgent.office_name && <> · {defaultAgent.office_name}</>}
        </div>
      )}
    </div>
  );
}
