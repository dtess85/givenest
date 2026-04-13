"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AgentPicker from "@/components/AgentPicker";
import { calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import { CHARITIES } from "@/lib/mock-data";
import { useUserLocation } from "@/lib/useUserLocation";

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  location?: string;
}

interface PickedCharity {
  name: string;
  ein: string;
}

interface SavedAgent {
  name: string;
  office_name: string | null;
}

const SEED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean));
const AGENT_FAVORITES_KEY = "givenest-agent-favorites";
const CHARITY_FAVORITES_KEY = "givenest-favorites";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  propertyAddress: string;
  propertyPrice: number;
  defaultAgent?: { name: string; office_name: string | null };
  defaultCharities?: PickedCharity[];
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 w-2 rounded-full transition-colors ${
            s <= current ? "bg-coral" : "border border-border bg-white"
          }`}
        />
      ))}
    </div>
  );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      />
    </svg>
  );
}

export default function LeadModal({
  open,
  onClose,
  propertyAddress,
  propertyPrice,
  defaultAgent,
  defaultCharities,
}: LeadModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [step, setStep] = useState(1);

  // Agent
  const [agent, setAgent] = useState(defaultAgent ?? { name: "Kyndall Yates", office_name: "Givenest" });

  // Agent favorites
  const [agentFavorites, setAgentFavorites] = useState<Map<string, SavedAgent>>(new Map());
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AGENT_FAVORITES_KEY);
      if (saved) setAgentFavorites(new Map(JSON.parse(saved)));
    } catch {}
  }, []);

  const persistAgentFavorites = (next: Map<string, SavedAgent>) => {
    setAgentFavorites(next);
    try {
      localStorage.setItem(AGENT_FAVORITES_KEY, JSON.stringify(Array.from(next.entries())));
    } catch {}
  };

  const toggleAgentFavorite = (a: SavedAgent) => {
    const next = new Map(agentFavorites);
    if (next.has(a.name)) next.delete(a.name);
    else next.set(a.name, a);
    persistAgentFavorites(next);
  };

  // Charity search
  const [charitySearch, setCharitySearch] = useState("");
  const [charityResults, setCharityResults] = useState<EveryOrgNonprofit[]>([]);
  const [charityLoading, setCharityLoading] = useState(false);
  const [charities, setCharities] = useState<PickedCharity[]>(defaultCharities ?? []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLoc = useUserLocation();

  // Charity favorites
  const [charityFavorites, setCharityFavorites] = useState<Map<string, EveryOrgNonprofit>>(new Map());
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHARITY_FAVORITES_KEY);
      if (saved) setCharityFavorites(new Map(JSON.parse(saved)));
    } catch {}
  }, []);

  // Contact
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Sync defaults when modal opens
  useEffect(() => {
    if (open) {
      setAgent(defaultAgent ?? { name: "Kyndall Yates", office_name: "Givenest" });
      if (defaultCharities) setCharities(defaultCharities);
      setSent(false);
      const startStep = (defaultAgent && defaultCharities && defaultCharities.length > 0) ? 3 : 1;
      setStep(startStep);
    }
  }, [open, defaultAgent, defaultCharities]);

  // Charity search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!charitySearch.trim()) { setCharityResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setCharityLoading(true);
      try {
        const key = process.env.NEXT_PUBLIC_EVERY_ORG_KEY;
        const res = await fetch(
          `https://partners.every.org/v0.2/search/${encodeURIComponent(charitySearch.trim())}?apiKey=${key}&take=6`
        );
        const data = await res.json();
        setCharityResults(data.nonprofits ?? []);
      } catch {
        setCharityResults([]);
      } finally {
        setCharityLoading(false);
      }
    }, 350);
  }, [charitySearch]);

  const selectedEins = new Set(charities.map((c) => c.ein));
  const toggleCharity = (c: PickedCharity) => {
    setCharities((prev) =>
      selectedEins.has(c.ein) ? prev.filter((x) => x.ein !== c.ein) : [...prev, c]
    );
  };

  const locationScore = (loc?: string) => {
    if (!loc || !userLoc) return 0;
    const l = loc.toLowerCase();
    if (userLoc.city && l.includes(userLoc.city.toLowerCase())) return 2;
    if (userLoc.stateCode && l.includes(userLoc.stateCode.toLowerCase())) return 1;
    return 0;
  };

  const showFeaturedCharities = !charitySearch.trim();
  const sortedResults = charityResults.slice().sort((a, b) => locationScore(b.location) - locationScore(a.location));
  const savedCharitiesList = Array.from(charityFavorites.values()).filter((f) => !SEED_EINS.has(f.ein));

  // Build charity list with selected pinned to top (same pattern as GivingPanel)
  type CharityItem = PickedCharity & { location?: string; isSeed?: boolean; isSaved?: boolean };
  const baseCharityItems: CharityItem[] = showFeaturedCharities
    ? [
        ...CHARITIES.map((c) => ({ name: c.name, ein: c.ein ?? "", isSeed: true })),
        ...savedCharitiesList.map((f) => ({ name: f.name, ein: f.ein, location: f.location, isSaved: true })),
      ]
    : sortedResults.map((r) => ({ name: r.name, ein: r.ein, location: r.location, isSeed: SEED_EINS.has(r.ein), isSaved: charityFavorites.has(r.ein) }));

  const selectedCharityItems = charities.map((c) => {
    const match = baseCharityItems.find((b) => b.ein === c.ein);
    return match ?? { ...c, isSeed: SEED_EINS.has(c.ein) };
  });
  const unselectedCharityItems = baseCharityItems.filter((b) => !selectedEins.has(b.ein));
  const charityListItems: CharityItem[] = [...selectedCharityItems, ...unselectedCharityItems];

  // Build agent list: Kyndall default + saved agents, selected pinned to top
  const savedAgentsList = Array.from(agentFavorites.values()).filter((a) => a.name !== "Kyndall Yates");
  type AgentItem = SavedAgent & { isDefault?: boolean; isSaved?: boolean };
  const kyndallItem: AgentItem = { name: "Kyndall Yates", office_name: "Givenest", isDefault: true };
  const baseAgentItems: AgentItem[] = [
    kyndallItem,
    ...savedAgentsList.map((a) => ({ ...a, isSaved: true })),
  ];
  const selectedAgentItem = baseAgentItems.find((a) => a.name === agent.name)
    ?? { name: agent.name, office_name: agent.office_name };
  const unselectedAgentItems = baseAgentItems.filter((a) => a.name !== agent.name);
  const agentListItems: AgentItem[] = [selectedAgentItem, ...unselectedAgentItems];

  const hasProperty = !propertyAddress.toLowerCase().includes("inquiry");
  const givingPool = calcGivingPool(propertyPrice);
  const canSubmit = form.name.trim() && form.email.trim() && !sending && !sent;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    try {
      await fetch("/api/agent-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          agentName: agent.name,
          agentOffice: agent.office_name || undefined,
          propertyAddress,
          charity: charities.map((c) => c.name).join(", ") || undefined,
          homeValue: fmt(propertyPrice),
          givingAmount: fmt(givingPool),
          source: "property-page",
        }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (!open || !mounted) return null;

  const initials = agent.name
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const STEP_HEIGHT = "min-h-[500px]";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-lg border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-lg font-medium">Get started</h2>
          <button onClick={onClose} className="text-muted hover:text-black transition-colors" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <StepIndicator current={step} />

        {sent ? (
          <div className={`flex flex-col items-center justify-center px-5 py-10 ${STEP_HEIGHT}`}>
            <div className="mb-2 font-serif text-lg font-medium">Request sent</div>
            <p className="text-[13px] text-muted">
              We&apos;ll coordinate with {agent.name} and get back to you shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-md border border-border px-5 py-2 text-[13px] font-medium transition-colors hover:border-coral hover:text-coral"
            >
              Close
            </button>
          </div>
        ) : (
          <div className={`flex flex-col px-5 py-4 ${STEP_HEIGHT}`}>
            {/* Step 1: Choose your agent */}
            {step === 1 && (
              <div className="flex flex-1 flex-col">
                <h3 className="font-serif text-xl font-medium leading-tight tracking-[-0.02em]">Choose your agent</h3>
                <p className="mt-1 text-[13px] text-muted">
                  Work with any Arizona Realtor. We handle the donation on your behalf.
                </p>

                <div className="mt-5 flex-1">
                  <AgentPicker
                    defaultAgent={{
                      name: "Kyndall Yates",
                      office_name: "Givenest",
                      primary_city: "Gilbert",
                      active_listing_count: 0,
                      is_givenest: true,
                    }}
                    onSelect={(a) => setAgent({ name: a.name, office_name: a.office_name })}
                  />

                  {/* Agent list: selected pinned to top */}
                  <div className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                    {agent.name !== "Kyndall Yates" ? "Selected" : savedAgentsList.length > 0 ? "Default & saved" : "Default"}
                  </div>
                  <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
                    {agentListItems.map((a, i) => {
                      const isSelected = agent.name === a.name;
                      const prevIsSelected = i > 0 && agent.name === agentListItems[i - 1].name;
                      const showDivider = !isSelected && prevIsSelected;
                      const ai = a.name
                        .split(" ")
                        .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("");
                      return (
                        <div key={a.name}>
                          {showDivider && (
                            <div className="mb-1 mt-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                              {savedAgentsList.length > 0 ? "Default & saved" : "Default"}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setAgent({ name: a.name, office_name: a.office_name })}
                              className={`flex flex-1 items-center gap-2 rounded-[5px] border px-[10px] py-[6px] text-left transition-all ${
                                isSelected
                                  ? "border-coral bg-coral/[0.08]"
                                  : "border-border bg-white hover:border-coral"
                              }`}
                            >
                              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[8px] font-medium text-white">
                                {ai}
                              </div>
                              <span className="truncate text-xs text-black">{a.name}</span>
                              {a.isDefault ? (
                                <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">Givenest</span>
                              ) : a.office_name ? (
                                <span className="truncate text-[10px] text-muted">{a.office_name}</span>
                              ) : null}
                              {isSelected && <span className="ml-auto flex-shrink-0 text-[13px] text-coral">&#10003;</span>}
                            </button>
                            {!a.isDefault && (
                              <button
                                type="button"
                                onClick={() => toggleAgentFavorite(a)}
                                className="flex-shrink-0 p-1 text-coral hover:text-[#d4574a] transition-colors"
                                aria-label={agentFavorites.has(a.name) ? "Remove from saved" : "Save agent"}
                              >
                                <HeartIcon filled={agentFavorites.has(a.name)} className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-md bg-coral px-6 py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Choose your charity */}
            {step === 2 && (
              <div className="flex flex-1 flex-col">
                <h3 className="font-serif text-xl font-medium leading-tight tracking-[-0.02em]">Choose a charity</h3>
                <p className="mt-1 text-[13px] text-muted">
                  {hasProperty
                    ? <>25% of our commission — <span className="font-medium text-coral">{fmt(givingPool)}</span> on this home — goes directly to the charity you pick.</>
                    : <>We donate 25% of the commission directly to the charity you choose. Nothing extra from you.</>
                  }
                </p>

                <div className="mt-5 flex-1">
                  <input
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Search 1.8M+ nonprofits..."
                    value={charitySearch}
                    onChange={(e) => setCharitySearch(e.target.value)}
                  />

                  {/* Charity list label */}
                  <div className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                    {charities.length > 0 ? "Selected" : showFeaturedCharities
                      ? savedCharitiesList.length > 0 ? "Featured & saved" : "Featured charities"
                      : charityLoading ? "Searching\u2026" : `${charityResults.length} results`
                    }
                  </div>

                  <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
                    {charityLoading && charityListItems.length === 0 && (
                      <div className="py-2 text-center text-[11px] text-muted">Searching...</div>
                    )}
                    {charityListItems.map((c, i) => {
                      const isSelected = selectedEins.has(c.ein);
                      const prevIsSelected = i > 0 && selectedEins.has(charityListItems[i - 1].ein);
                      const showDivider = charities.length > 0 && !isSelected && prevIsSelected;
                      return (
                        <div key={c.ein}>
                          {showDivider && (
                            <div className="mb-1 mt-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                              {showFeaturedCharities
                                ? savedCharitiesList.length > 0 ? "Featured & saved" : "Featured charities"
                                : "Results"
                              }
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleCharity(c)}
                            className={`flex w-full items-center justify-between rounded-[5px] border px-[10px] py-[6px] text-left transition-all ${
                              isSelected
                                ? "border-coral bg-coral/[0.08]"
                                : "border-border bg-white hover:border-coral"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate text-xs text-black">{c.name}</span>
                              {!showFeaturedCharities && c.isSaved && (
                                <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">Saved</span>
                              )}
                            </div>
                            {isSelected && <span className="ml-2 flex-shrink-0 text-[13px] text-coral">&#10003;</span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-md border border-border px-5 py-[10px] text-[13px] font-medium text-muted transition-colors hover:border-coral hover:text-coral cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-md bg-coral px-6 py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] cursor-pointer"
                  >
                    {charities.length > 0 ? "Next" : "Skip"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Your info */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                <h3 className="font-serif text-xl font-medium leading-tight tracking-[-0.02em]">Almost there</h3>
                <p className="mt-1 text-[13px] text-muted">
                  We&apos;ll connect you with {agent.name} and handle the donation at closing. Nothing extra from you.
                </p>

                {/* Summary strip */}
                <div className="mt-4 rounded-md bg-[#FAFAF8] px-3 py-2">
                  {hasProperty && <div className="text-[12px] font-medium truncate">{propertyAddress}</div>}
                  <div className="text-[11px] text-muted">
                    {hasProperty && `${fmt(propertyPrice)} · `}{agent.name}
                    {charities.length > 0 && ` · ${charities.map((c) => c.name).join(", ")}`}
                  </div>
                </div>

                <div className="mt-4 flex flex-1 flex-col gap-2">
                  <input
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    type="email"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  <input
                    type="tel"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-md border border-border px-5 py-[10px] text-[13px] font-medium text-muted transition-colors hover:border-coral hover:text-coral cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`rounded-md bg-coral px-6 py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
                      !canSubmit ? "cursor-default opacity-40" : "cursor-pointer"
                    }`}
                  >
                    {sending ? "Sending..." : "Send request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
