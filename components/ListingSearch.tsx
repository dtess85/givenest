"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AZ_LOCATIONS, POPULAR_CITIES, type LocationSuggestion } from "@/lib/az-locations";
import type { Property } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function HomeGridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

type Variant = "hero" | "nav";

interface ListingSearchProps {
  variant?: Variant;
  className?: string;
}

/**
 * Address / agent / MLS autocomplete search. Used by the Hero section on `/`
 * and by the Nav bar on every other page. The `variant` prop only affects
 * the outer shell styling — dropdown rendering is identical in both modes.
 */
export default function ListingSearch({ variant = "hero", className = "" }: ListingSearchProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState(
    variant === "nav"
      ? "Search by address, city, agent, MLS #"
      : "City, Neighborhood, Address, ZIP, Agent, MLS #"
  );
  useEffect(() => {
    const update = () => {
      if (variant === "nav") {
        setSearchPlaceholder(
          window.innerWidth < 640
            ? "Search"
            : "Search by address, city, agent, MLS #"
        );
      } else {
        setSearchPlaceholder(
          window.innerWidth < 640
            ? "City, Address, ZIP, Agent, MLS #"
            : "City, Neighborhood, Address, ZIP, Agent, MLS #"
        );
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [variant]);
  const [addressResults, setAddressResults] = useState<Property[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [isMlsSearch, setIsMlsSearch] = useState(false);
  const [hasSubdivisionMatch, setHasSubdivisionMatch] = useState(false);
  const [hasAgentMatch, setHasAgentMatch] = useState(false);
  const [matchedAgentName, setMatchedAgentName] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Live address search (debounced)
  useEffect(() => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    const q = searchInput.trim();
    if (q.length < 3) { setAddressResults([]); setAddressLoading(false); return; }

    setAddressLoading(true);
    addressDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/listings/address-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setAddressResults(data.listings ?? []);
        setIsMlsSearch(data.isMlsNumber ?? false);
        setHasSubdivisionMatch(data.hasSubdivisionMatch ?? false);
        setHasAgentMatch(data.hasAgentMatch ?? false);
        setMatchedAgentName(data.matchedAgentName ?? null);
      } catch {
        setAddressResults([]);
      } finally {
        setAddressLoading(false);
      }
    }, 350);
  }, [searchInput]);

  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return POPULAR_CITIES;
    const q = searchInput.toLowerCase();
    return AZ_LOCATIONS.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.city?.toLowerCase().startsWith(q) ||
        l.zip?.startsWith(q)
    ).slice(0, 12);
  }, [searchInput]);

  const citySuggestions = suggestions.filter((s) => s.type === "city");
  const zipSuggestions = suggestions.filter((s) => s.type === "zip");

  function navigateToLocation(loc: LocationSuggestion) {
    setDropdownOpen(false);
    const params = new URLSearchParams();
    if (loc.type === "city" && loc.city) params.set("city", loc.city);
    else if (loc.type === "zip" && loc.zip) params.set("zip", loc.zip);
    else if (loc.type === "subdivision" && loc.subdivision) params.set("subdivision", loc.subdivision);
    router.push(`/buy${params.toString() ? "?" + params.toString() : ""}`);
  }

  function handleSearch() {
    setDropdownOpen(false);
    router.push("/buy");
  }

  const showDropdown =
    dropdownOpen &&
    (citySuggestions.length > 0 || zipSuggestions.length > 0 || addressLoading || addressResults.length > 0);

  // ── Variant-dependent shell styling ──────────────────────────────────────
  const shellClass =
    variant === "nav"
      ? "flex overflow-hidden rounded-full border border-border"
      : "flex overflow-hidden rounded-lg shadow-[0_4px_32px_rgba(0,0,0,0.3)]";
  const inputClass =
    variant === "nav"
      ? "min-w-0 flex-1 border-none bg-white px-4 py-[7px] font-sans text-[13px] text-black outline-none placeholder:text-[#c0bdb6]"
      : "min-w-0 flex-1 border-none bg-white px-4 py-[18px] font-sans text-[15px] font-light text-black outline-none placeholder:text-[#c0bdb6] md:px-[22px]";
  const clearBtnClass =
    variant === "nav"
      ? "bg-white px-2 text-[#c0bdb6] hover:text-[#2a2825] transition-colors"
      : "bg-white px-3 text-[#c0bdb6] hover:text-[#2a2825] transition-colors";
  const submitBtnClass =
    variant === "nav"
      ? "flex items-center justify-center bg-coral px-3 text-white transition-colors hover:bg-[#d4574a]"
      : "flex items-center justify-center gap-2 bg-coral px-[20px] font-sans text-[15px] font-medium text-white transition-colors hover:bg-[#d4574a] md:px-[28px]";

  return (
    <div className={`relative ${variant === "hero" ? "w-full max-w-[800px]" : "w-full"} ${className}`} ref={searchRef}>
      <div className={shellClass}>
        <input
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setDropdownOpen(true); }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDropdownOpen(false);
            if (e.key === "Enter") handleSearch();
          }}
          placeholder={searchPlaceholder}
          className={inputClass}
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(""); setAddressResults([]); setDropdownOpen(true); }}
            className={clearBtnClass}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <button
          onClick={handleSearch}
          className={submitBtnClass}
          aria-label="Search"
        >
          <svg width={variant === "nav" ? 15 : 17} height={variant === "nav" ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {variant === "hero" && <span className="hidden whitespace-nowrap md:inline">Search</span>}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-40 w-full overflow-hidden rounded-[10px] border border-border bg-white shadow-xl">

          {/* Cities */}
          {citySuggestions.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                {!searchInput.trim() ? "Popular cities" : "Cities"}
              </div>
              {citySuggestions.map((loc) => (
                <button
                  key={loc.label}
                  onMouseDown={(e) => { e.preventDefault(); navigateToLocation(loc); }}
                  className="flex w-full items-center gap-3 px-4 py-[9px] text-left text-[14px] text-[#2a2825] hover:bg-[#F9F7F4] transition-colors"
                >
                  <MapPinIcon />
                  {loc.label}
                </button>
              ))}
            </>
          )}

          {/* Zip codes */}
          {zipSuggestions.length > 0 && (
            <>
              <div className={`px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted ${citySuggestions.length > 0 ? "border-t border-border pt-2 mt-1" : "pt-3"}`}>
                Zip Codes
              </div>
              {zipSuggestions.map((loc) => (
                <button
                  key={loc.label}
                  onMouseDown={(e) => { e.preventDefault(); navigateToLocation(loc); }}
                  className="flex w-full items-center gap-3 px-4 py-[9px] text-left text-[14px] text-[#2a2825] hover:bg-[#F9F7F4] transition-colors"
                >
                  <HashIcon />
                  {loc.label}
                </button>
              ))}
            </>
          )}

          {/* Live address / property results */}
          {searchInput.trim().length >= 3 && (
            <div className={citySuggestions.length > 0 || zipSuggestions.length > 0 ? "border-t border-border mt-1" : ""}>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                  {isMlsSearch ? "MLS Listing" : "Properties"}
                </span>
                {addressLoading && (
                  <svg className="h-3 w-3 animate-spin text-muted" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
              </div>
              {/* Browse community shortcut */}
              {hasSubdivisionMatch && !isMlsSearch && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const q = searchInput.trim();
                    navigateToLocation({ type: "subdivision", label: q, subdivision: q });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-[9px] text-left hover:bg-[#F9F7F4] transition-colors"
                >
                  <HomeGridIcon />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-[#2a2825]">Browse {searchInput.trim()} community</div>
                    <div className="text-[11px] text-muted">See all listings in this neighborhood</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}

              {/* Browse agent's listings shortcut */}
              {hasAgentMatch && matchedAgentName && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateToLocation({ type: "subdivision", label: matchedAgentName, subdivision: matchedAgentName });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-[9px] text-left hover:bg-[#F9F7F4] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-[#2a2825]">{matchedAgentName}</div>
                    <div className="text-[11px] text-muted">See all listings by this agent</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}

              {addressResults.length > 0 ? (
                addressResults.map((prop) => (
                  <Link
                    key={prop.slug}
                    href={`/buy/${prop.slug}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-[9px] text-left hover:bg-[#F9F7F4] transition-colors"
                  >
                    <HomeIcon />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#2a2825]">{prop.address}</div>
                      <div className="text-[11px] text-muted">
                        {prop.city} · {fmt(prop.price)}
                        {prop.neighborhood && <span className="ml-1">· {prop.neighborhood}</span>}
                      </div>
                    </div>
                  </Link>
                ))
              ) : !addressLoading ? (
                <div className="px-4 pb-3 text-[13px] text-muted">No listings found</div>
              ) : null}
            </div>
          )}

          <div className="h-2" />
        </div>
      )}
    </div>
  );
}
