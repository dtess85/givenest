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

  const scrollToTools = () =>
    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });

  // Suppress unused variable warning from commission (used implicitly via givingPool)
  void commission;

  return (
    <div>

      {/* ── Section 1: Hero ── */}
      <section
        className="relative flex min-h-[560px] items-center"
        style={{
          backgroundImage: "url('/images/2635-e-los-altos-rd.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 100%)" }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-8 py-24">
          <span className="mb-5 inline-block rounded-full bg-coral px-[12px] py-[5px] text-[11px] font-medium uppercase tracking-[0.06em] text-white">
            Seller portal
          </span>
          <h1
            className="mb-5 max-w-[560px] font-serif font-medium leading-[1.1] tracking-[-0.02em] text-white"
            style={{ fontSize: "clamp(36px,5vw,60px)" }}
          >
            Sell your home.<br />
            <em className="text-coral">Fund a cause.</em>
          </h1>
          <p className="mb-9 max-w-[460px] text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
            Givenest donates 25% of our commission to a nonprofit of your choice at closing — at no extra cost to you.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={scrollToTools}
              className="rounded-md px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.1)]"
              style={{ border: "1px solid rgba(255,255,255,0.55)" }}
            >
              Estimate your giving ↓
            </button>
            <button
              onClick={scrollToTools}
              className="rounded-md bg-coral px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Contact our agent
            </button>
          </div>
        </div>

        {/* Property card overlay — desktop only */}
        <div className="absolute bottom-8 right-8 hidden lg:block">
          <div
            className="w-[230px] rounded-[12px] p-5"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.6)" }}>
              Listed by Givenest
            </div>
            <div className="font-serif text-[19px] font-medium text-white">$5,950,000</div>
            <div className="mt-[3px] text-[12px]" style={{ color: "rgba(255,255,255,0.75)" }}>
              2635 E Los Altos Rd, Gilbert
            </div>
            <div className="mt-3 flex gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span>5 bd</span>
              <span>4.5 ba</span>
              <span>6,677 sqft</span>
            </div>
            <div
              className="mt-3 rounded-full px-3 py-1 text-center text-[10px] font-medium uppercase tracking-[0.05em]"
              style={{ background: "rgba(227,104,88,0.85)", color: "white" }}
            >
              Coming Soon
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Stats strip ── */}
      <section className="bg-[#F4F3EE] py-14">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { stat: "0%", label: "Extra cost to you" },
              { stat: "25%", label: "Of commission donated" },
              { stat: "100%", label: "Directly to your charity" },
            ].map(({ stat, label }) => (
              <div key={stat} className="px-8 text-center first:pl-0 last:pr-0 sm:px-12">
                <div
                  className="font-serif font-medium leading-none text-coral"
                  style={{ fontSize: "clamp(34px,5vw,52px)" }}
                >
                  {stat}
                </div>
                <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.07em] text-muted">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: How it works ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-coral" />
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-coral">
              Seller process
            </span>
          </div>
          <h2
            className="mb-14 font-serif font-medium tracking-[-0.02em]"
            style={{ fontSize: "clamp(24px,3vw,38px)" }}
          >
            Sell with purpose. It&apos;s that simple.
          </h2>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "List with Givenest",
                body: "We price, market, and sell your home at full market value using local expertise and professional photography.",
              },
              {
                n: "2",
                title: "Close at top dollar",
                body: "Your home sells. We handle everything — offers, negotiations, inspections, and closing paperwork.",
              },
              {
                n: "3",
                title: "Your charity receives a gift",
                body: "At closing, 25% of our commission is donated in your name to the nonprofit you choose.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="relative">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-sm font-semibold text-white">
                  {n}
                </div>
                <h3 className="mb-2 font-serif text-[17px] font-medium">{title}</h3>
                <p className="text-[13px] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Benefits grid ── */}
      <section className="bg-[#F4F3EE] py-20">
        <div className="mx-auto max-w-[1100px] px-8">
          <h2
            className="mb-10 font-serif font-medium tracking-[-0.02em]"
            style={{ fontSize: "clamp(22px,3vw,34px)" }}
          >
            Why sellers choose Givenest
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: "No extra cost",
                body: "The donation comes from our standard listing commission. You pay nothing extra — ever.",
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                ),
                title: "Any nonprofit",
                body: "Search over 1.8 million verified nonprofits. Pick the cause that matters most to you.",
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
                title: "Full market representation",
                body: "We negotiate hard for your best price. A higher sale means a bigger gift to your charity.",
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
                title: "Transparent at closing",
                body: "You receive a closing summary showing exactly how much was donated and to whom.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="rounded-[10px] border border-border bg-white p-6">
                <div className="mb-3 text-coral">{icon}</div>
                <h3 className="mb-[6px] font-serif text-[16px] font-medium">{title}</h3>
                <p className="text-[13px] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Functional tools ── */}
      <div id="tools" className="bg-white py-16">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mb-10">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px w-8 bg-coral" />
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-coral">
                Get started
              </span>
            </div>
            <h2
              className="font-serif font-medium tracking-[-0.02em]"
              style={{ fontSize: "clamp(22px,2.5vw,32px)" }}
            >
              Estimate your giving &amp; connect with our agent
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_480px]">
            {/* Left — estimate calculator */}
            <div>
              <div className="overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
                <div className="border-b border-border px-4 py-3">
                  <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Estimate your giving</h3>
                </div>
                <div className="p-6">
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
            </div>

            {/* Right — agents + charity selection */}
            <div>
              {/* Agents */}
              <div className="mb-4 overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
                <div className="border-b border-border px-4 py-3">
                  <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Contact an Agent</h3>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {AGENTS.map((a) => {
                    const isActive = activeAgent === a.initials;
                    const isSubmitted = submittedAgents.has(a.initials);
                    return (
                      <div key={a.initials}>
                        <div className="flex items-center gap-[14px] px-4 py-3">
                          <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                            {a.initials}
                          </div>
                          <div className="min-w-0 flex-1">
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
                                ? "cursor-default border-border text-muted"
                                : isActive
                                ? "border-coral text-coral"
                                : "border-border hover:border-coral hover:text-coral"
                            }`}
                          >
                            {isSubmitted ? "✓ Sent" : "Contact"}
                          </button>
                        </div>

                        {isActive && !isSubmitted && (
                          <div className="border-t border-border bg-[#FAFAF8] px-4 py-3">
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

              {/* Charity picker */}
              <div className="overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
                <div className="border-b border-border px-4 py-3">
                  <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">Choose a charity</h3>
                </div>
                <div className="p-4">
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
                            className="min-w-0 flex-1 text-left"
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
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
