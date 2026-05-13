"use client";

import { useState, useRef, useEffect } from "react";
import { getInitials } from "@/lib/utils";

/**
 * Givenest-only agent picker. Renders as a click-to-open dropdown that
 * lists every member of the Givenest team (fetched from
 * `/api/agents/team`, which filters to `is_givenez = true`). No free-text
 * search — ARMLS access rules forbid exposing other MLS agents' data, so
 * the only agents a buyer can pick are our own.
 *
 * Pre-existing API kept: `defaultAgent` + `onSelect(agent)` so the
 * surrounding property page works unchanged. The picker now also seeds
 * itself from the API on mount so newly-added team members appear without
 * a code change.
 */

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
  size?: "sm" | "md";
}

export default function AgentPicker({ defaultAgent, onSelect, size = "sm" }: AgentPickerProps) {
  const [team, setTeam] = useState<Agent[]>(defaultAgent ? [defaultAgent] : []);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load the Givenest team once on mount. We seed with `defaultAgent` so
  // the very first paint has something to show; the API response then
  // replaces the seed with whatever's currently flagged is_givenest in
  // the agents index (handles new hires without a code change).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents/team")
      .then((r) => (r.ok ? r.json() : { agents: [] }))
      .then((data: { agents?: Agent[] }) => {
        if (cancelled) return;
        const fetched = data.agents ?? [];
        // De-dupe by name in case the API returns defaultAgent too.
        const merged = [...fetched];
        if (defaultAgent && !merged.some((a) => a.name === defaultAgent.name)) {
          merged.unshift(defaultAgent);
        }
        setTeam(merged.length > 0 ? merged : defaultAgent ? [defaultAgent] : []);
      })
      .catch(() => {
        // Network/DB error — keep the seed so the picker still functions.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultAgent]);

  // Close dropdown on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const buttonClass = `flex w-full items-center justify-between rounded-md border border-border bg-white text-left outline-none transition-colors hover:border-coral focus:border-coral ${
    size === "md" ? "px-[14px] py-[11px] text-sm" : "px-3 py-2 text-[13px]"
  }`;

  // Single-agent shortcut: when the team is just one person there's no
  // need for a dropdown. Show a static row indicating who the buyer would
  // be working with.
  if (!loading && team.length === 1) {
    const agent = team[0];
    return (
      <div className={buttonClass.replace("hover:border-coral focus:border-coral", "")}>
        <span className="flex items-center gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-medium text-white">
            {getInitials(agent.name)}
          </div>
          <span className="text-[13px] font-medium">{agent.name}</span>
        </span>
        <span className="rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-coral">
          Givenest
        </span>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={buttonClass}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-[13px] text-muted">
          {loading && team.length === 0 ? "Loading…" : "Browse Givenest agents"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && team.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[260px] overflow-y-auto rounded-lg border border-border bg-white shadow-md">
          {team.map((agent) => (
            <button
              key={agent.name}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-pampas"
              onClick={() => {
                onSelect(agent);
                setIsOpen(false);
              }}
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-medium text-white">
                {getInitials(agent.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">{agent.name}</div>
                <div className="text-[10px] text-muted truncate">
                  {[agent.office_name, agent.primary_city].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-coral">
                Givenest
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
