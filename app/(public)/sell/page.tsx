"use client";

import { useState, useEffect, useRef } from "react";
import { calcCommission, calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import { CHARITIES, AGENTS } from "@/lib/mock-data";
import { useUserLocation } from "@/lib/useUserLocation";

interface EveryOrgNonprofit {
  name: string;
  ein: string;
  location?: string;
  description?: string;
  profileUrl?: string;
}

interface PickedCharity {
  name: string;
  ein: string;
}

const SEED_EINS = new Set(CHARITIES.map((c) => c.ein).filter(Boolean));

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Sell() {
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [charity, setCharity] = useState<PickedCharity | null>(null);
  const [results, setResults] = useState<EveryOrgNonprofit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Map<string, EveryOrgNonprofit>>(new Map());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [submittedAgents, setSubmittedAgents] = useState<Set<string>>(new Set());
  const [agentSending, setAgentSending] = useState(false);
  const [agentFormData, setAgentFormData] = useState({ name: "", email: "", phone: "" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLoc = useUserLocation();

  const num = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  const commission = calcCommission(num);
  const givingPool = calcGivingPool(num);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const key = process.env.NEXT_PUBLIC_EVERY_ORG_KEY;
        const res = await fetch(
          `https://partners.every.org/v0.2/search/${encodeURIComponent(search.trim())}?apiKey=${key}&take=8`
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

  const locationScore = (loc?: string) => {
    if (!loc || !userLoc) return 0;
    const l = loc.toLowerCase();
    if (userLoc.city && l.includes(userLoc.city.toLowerCase())) return 2;
    if (userLoc.stateCode && l.includes(userLoc.stateCode.toLowerCase())) return 1;
    if (userLoc.state && l.includes(userLoc.state.toLowerCase())) return 1;
    return 0;
  };

  const sortedResults = results.slice().sort((a, b) => locationScore(b.location) - locationScore(a.location));

  type ListItem = PickedCharity & { category?: string; city?: string; location?: string; isSeed?: boolean; isFav?: boolean };

  const listItems: ListItem[] = isSearching
    ? sortedResults.map((r) => ({
        name: r.name, ein: r.ein, location: r.location,
        isSeed: SEED_EINS.has(r.ein), isFav: favorites.has(r.ein),
      }))
    : showFavorites
    ? favoritesList.map((f) => ({ name: f.name, ein: f.ein, location: f.location, isFav: true }))
    : CHARITIES.map((c) => ({ name: c.name, ein: c.ein ?? "", category: c.category, city: c.city, isSeed: true }));

  const listLabel = isSearching
    ? loading ? "Searching…" : `${results.length} results`
    : showFavorites
    ? `${favoritesList.length} saved`
    : "Featured charities";

  return (
    <div>
      <div className="bg-white px-8 pb-9 pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Seller portal
          </span>
          <h1 className="font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
            Sell your home.{" "}
            <em className="text-coral">Grow a cause.</em>
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-[860px] grid-cols-1 gap-11 px-8 py-11 md:grid-cols-[1fr_320px]">
        {/* Left — estimate calculator */}
        <div>
          <h3 className="mb-[18px] font-serif text-[17px] font-medium tracking-[-0.01em]">
            Estimate your giving
          </h3>
          <div className="rounded-[10px] border border-border bg-white p-6">
            <label className="mb-[7px] block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Estimated home value
            </label>
            <div className="relative mb-[18px]">
              <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <input
                className="w-full rounded-md border border-border bg-white py-[11px] pl-[26px] pr-[14px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                placeholder="550,000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            {num > 0 && (
              <div>
                {[
                  { label: "Home value", value: fmt(num), highlight: false },
                  { label: "Estimated donation (25%)", value: fmt(givingPool), highlight: true },
                ].map(({ label, value: v, highlight }) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between border-b border-border py-[11px]"
                  >
                    <span className={`text-sm ${highlight ? "font-medium text-black" : "font-light text-muted"}`}>
                      {label}
                    </span>
                    <span
                      className={
                        highlight
                          ? "text-[19px] font-semibold text-coral"
                          : "text-sm font-normal text-black"
                      }
                    >
                      {v}
                    </span>
                  </div>
                ))}
                <div className="mt-[14px] rounded-md border border-border bg-white px-[13px] py-[11px]">
                  <div className="text-xs font-light leading-[1.6] text-muted">
                    givenest donates this amount directly to your chosen charity
                    at closing — from the standard commission, at no extra cost.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — charity selection */}
        <div>
          <h3 className="mb-[18px] font-serif text-[17px] font-medium tracking-[-0.01em]">
            Choose a charity
          </h3>

          {/* Search + favorites toggle */}
          <div className="mb-2 flex gap-2">
            <input
              className="flex-1 rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
              placeholder="Search nonprofits..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value.trim()) setShowFavorites(false); }}
            />
            <button
              onClick={() => { setShowFavorites((v) => !v); setSearch(""); }}
              title={showFavorites ? "Show all" : "Show saved"}
              className={`flex items-center justify-center rounded-md border px-3 transition-colors ${
                showFavorites ? "border-coral bg-coral/[0.08] text-coral" : "border-border bg-white text-muted hover:border-coral hover:text-coral"
              }`}
            >
              <HeartIcon filled={showFavorites} />
            </button>
          </div>

          {/* List label */}
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
            {listLabel}
          </div>

          <div className="mb-[14px] flex flex-col gap-[5px]">
            {listItems.map((c) => {
              const isSelected = charity?.ein === c.ein;
              const isFavorited = favorites.has(c.ein);
              const isLocal = !c.isSeed && !isFavorited && locationScore(c.location) > 0;
              const favoritableObj: EveryOrgNonprofit = { name: c.name, ein: c.ein, location: c.location };
              return (
                <div
                  key={c.ein || c.name}
                  className={`flex items-center gap-2 rounded-md border px-3 py-[10px] transition-all ${
                    isSelected ? "border-coral bg-[#fff8f7]" : "border-border bg-white hover:border-coral"
                  }`}
                >
                  <button
                    onClick={() => setCharity({ name: c.name, ein: c.ein })}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium">{c.name}</span>
                      {c.isSeed && (
                        <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">Featured</span>
                      )}
                      {!c.isSeed && isFavorited && (
                        <span className="flex-shrink-0 rounded-full bg-coral/10 px-[6px] py-px text-[9px] font-medium text-coral">Saved</span>
                      )}
                      {isLocal && (
                        <span className="flex-shrink-0 rounded-full bg-emerald-50 px-[6px] py-px text-[9px] font-medium text-emerald-600">Local</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted">
                      {c.category && c.city ? `${c.category} · ${c.city}` : c.location ?? ""}
                    </div>
                  </button>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {isSelected && <span className="text-[13px] text-coral">&#10003;</span>}
                    {!c.isSeed && (
                      <button
                        onClick={() => toggleFavorite(favoritableObj)}
                        title={isFavorited ? "Remove from saved" : "Save charity"}
                        className={`transition-colors ${isFavorited ? "text-coral hover:text-coral/60" : "text-muted hover:text-coral"}`}
                      >
                        <HeartIcon filled={isFavorited} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {isSearching && !loading && results.length === 0 && (
              <div className="py-3 text-center text-xs text-muted">No results found</div>
            )}
            {showFavorites && !isSearching && favoritesList.length === 0 && (
              <div className="py-3 text-center text-xs text-muted">No saved charities yet</div>
            )}
          </div>

          {charity && num > 0 && (
            <div className="mb-3 rounded-lg border border-border bg-white px-4 py-[14px]">
              <div className="mb-[3px] text-xs text-muted">
                Your closing would give
              </div>
              <div className="text-[22px] font-semibold text-coral">
                {fmt(givingPool)}
              </div>
              <div className="mt-[2px] text-xs text-muted">
                to {charity.name}
              </div>
            </div>
          )}

          <button
            onClick={() => { if (charity && !submitted) setShowForm(true); }}
            className={`w-full rounded-md bg-coral py-3 text-sm font-medium text-white transition-colors hover:bg-[#d4574a] ${
              !charity || submitted ? "cursor-default opacity-40" : "cursor-pointer"
            }`}
          >
            {submitted ? "✓ Request sent" : "Get matched with an agent"}
          </button>

          {showForm && !submitted && (
            <div className="mt-3 rounded-md border border-border bg-white p-4">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Your contact info</div>
              <div className="flex flex-col gap-2">
                <input
                  className="w-full rounded-md border border-border bg-white px-[14px] py-[10px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  type="email"
                  className="w-full rounded-md border border-border bg-white px-[14px] py-[10px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                />
                <input
                  type="tel"
                  className="w-full rounded-md border border-border bg-white px-[14px] py-[10px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                  placeholder="Phone (optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                />
                <button
                  onClick={async () => {
                    if (!formData.name || !formData.email) return;
                    setSending(true);
                    try {
                      await fetch("/api/contact", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: formData.name,
                          email: formData.email,
                          phone: formData.phone,
                          charity: charity?.name,
                          homeValue: num > 0 ? fmt(num) : "",
                          givingAmount: num > 0 ? fmt(givingPool) : "",
                        }),
                      });
                    } finally {
                      setSending(false);
                      setSubmitted(true);
                      setShowForm(false);
                    }
                  }}
                  disabled={!formData.name || !formData.email || sending}
                  className={`w-full rounded-md bg-coral py-[10px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a] ${
                    !formData.name || !formData.email || sending ? "cursor-default opacity-40" : "cursor-pointer"
                  }`}
                >
                  {sending ? "Sending…" : "Send request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agents section */}
      <div className="border-t border-border bg-white px-8 py-12">
        <div className="mx-auto max-w-[1100px]">
          <h3 className="mb-[14px] font-serif text-[17px] font-medium tracking-[-0.01em]">givenest agents</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {AGENTS.map((a) => {
              const isActive = activeAgent === a.initials;
              const isSubmitted = submittedAgents.has(a.initials);
              return (
                <div key={a.initials}>
                  <div className="flex items-center gap-[14px] rounded-[10px] border border-border bg-white p-[14px_18px]">
                    <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">{a.name}</div>
                      <a href={`mailto:${a.email}`} className="block text-[11px] text-coral hover:underline">{a.email}</a>
                      <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="block text-[11px] text-muted hover:text-black">{a.phone}</a>
                    </div>
                    <button
                      onClick={() => {
                        if (!isSubmitted) {
                          setActiveAgent(isActive ? null : a.initials);
                          setAgentFormData({ name: "", email: "", phone: "" });
                        }
                      }}
                      className={`rounded-md border px-[14px] py-[7px] text-xs transition-all ${
                        isSubmitted
                          ? "border-border text-muted cursor-default"
                          : isActive
                          ? "border-coral text-coral"
                          : "border-border hover:border-coral hover:text-coral"
                      }`}
                    >
                      {isSubmitted ? "✓ Sent" : "Request"}
                    </button>
                  </div>

                  {isActive && !isSubmitted && (
                    <div className="mt-1 rounded-md border border-border bg-white p-3">
                      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Your contact info</div>
                      <div className="flex flex-col gap-[6px]">
                        <input
                          className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                          placeholder="Full name"
                          value={agentFormData.name}
                          onChange={(e) => setAgentFormData((f) => ({ ...f, name: e.target.value }))}
                        />
                        <input
                          type="email"
                          className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                          placeholder="Email address"
                          value={agentFormData.email}
                          onChange={(e) => setAgentFormData((f) => ({ ...f, email: e.target.value }))}
                        />
                        <input
                          type="tel"
                          className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                          placeholder="Phone (optional)"
                          value={agentFormData.phone}
                          onChange={(e) => setAgentFormData((f) => ({ ...f, phone: e.target.value }))}
                        />
                        <button
                          onClick={async () => {
                            if (!agentFormData.name || !agentFormData.email) return;
                            setAgentSending(true);
                            try {
                              await fetch("/api/agent-request", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  name: agentFormData.name,
                                  email: agentFormData.email,
                                  phone: agentFormData.phone,
                                  agentName: a.name,
                                  propertyAddress: "Sell page inquiry",
                                }),
                              });
                            } finally {
                              setAgentSending(false);
                              setSubmittedAgents((prev) => new Set(prev).add(a.initials));
                              setActiveAgent(null);
                            }
                          }}
                          disabled={!agentFormData.name || !agentFormData.email || agentSending}
                          className={`w-full rounded-md bg-coral py-[8px] text-xs font-medium text-white transition-colors hover:bg-[#d4574a] ${
                            !agentFormData.name || !agentFormData.email || agentSending ? "cursor-default opacity-40" : "cursor-pointer"
                          }`}
                        >
                          {agentSending ? "Sending…" : "Send request"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
