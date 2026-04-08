"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Property } from "@/lib/mock-data";
import { calcGivingPool } from "@/lib/commission";
import { fmt } from "@/lib/utils";
import IdxAttribution from "@/components/IdxAttribution";
import { AZ_LOCATIONS, POPULAR_CITIES, type LocationSuggestion } from "@/lib/az-locations";

// Module-level client cache — survives re-renders, cleared on full page refresh.
// Keyed by the URLSearchParams string so each unique filter+page+sort combo is cached separately.
const listingsCache = new Map<string, { data: { listings: Property[]; pinnedListings: Property[]; total: number; totalPages: number }; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Reconstruct a LocationSuggestion from URL search params (with lat/lng from AZ_LOCATIONS if available) */
function locationFromParams(p: URLSearchParams): LocationSuggestion | null {
  const city = p.get("city");
  const zip = p.get("zip");
  const subdivision = p.get("subdivision");
  if (city) {
    return (
      AZ_LOCATIONS.find((l) => l.type === "city" && l.city === city) ??
      { type: "city", label: `${city}, AZ`, city }
    );
  }
  if (zip) {
    return (
      AZ_LOCATIONS.find((l) => l.type === "zip" && l.zip === zip) ??
      { type: "zip", label: zip, zip }
    );
  }
  if (subdivision) {
    return { type: "subdivision", label: subdivision, subdivision };
  }
  return null;
}

/** Build page number list with ellipsis for pagination nav */
function getPaginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const rangeStart = Math.max(2, current - 2);
  const rangeEnd = Math.min(total - 1, current + 2);
  pages.push(1);
  if (rangeStart > 2) pages.push("...");
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

const PRICE_OPTIONS = [
  { label: "No min", value: 0 },
  { label: "$50k", value: 50_000 },
  { label: "$75k", value: 75_000 },
  { label: "$100k", value: 100_000 },
  { label: "$125k", value: 125_000 },
  { label: "$150k", value: 150_000 },
  { label: "$175k", value: 175_000 },
  { label: "$200k", value: 200_000 },
  { label: "$250k", value: 250_000 },
  { label: "$300k", value: 300_000 },
  { label: "$400k", value: 400_000 },
  { label: "$500k", value: 500_000 },
  { label: "$600k", value: 600_000 },
  { label: "$700k", value: 700_000 },
  { label: "$800k", value: 800_000 },
  { label: "$900k", value: 900_000 },
  { label: "$1M", value: 1_000_000 },
  { label: "$1.25M", value: 1_250_000 },
  { label: "$1.5M", value: 1_500_000 },
  { label: "$2M", value: 2_000_000 },
  { label: "$3M", value: 3_000_000 },
  { label: "$5M", value: 5_000_000 },
];

const PRICE_MAX_OPTIONS = [
  { label: "No max", value: Infinity },
  { label: "$50k", value: 50_000 },
  { label: "$75k", value: 75_000 },
  { label: "$100k", value: 100_000 },
  { label: "$125k", value: 125_000 },
  { label: "$150k", value: 150_000 },
  { label: "$175k", value: 175_000 },
  { label: "$200k", value: 200_000 },
  { label: "$250k", value: 250_000 },
  { label: "$300k", value: 300_000 },
  { label: "$400k", value: 400_000 },
  { label: "$500k", value: 500_000 },
  { label: "$600k", value: 600_000 },
  { label: "$700k", value: 700_000 },
  { label: "$800k", value: 800_000 },
  { label: "$900k", value: 900_000 },
  { label: "$1M", value: 1_000_000 },
  { label: "$1.25M", value: 1_250_000 },
  { label: "$1.5M", value: 1_500_000 },
  { label: "$2M", value: 2_000_000 },
  { label: "$3M", value: 3_000_000 },
  { label: "$5M", value: 5_000_000 },
  { label: "$7.5M", value: 7_500_000 },
  { label: "$10M+", value: Infinity },
];

const YEAR_OPTIONS = [
  { label: "No min", value: null as number | null },
  ...Array.from({ length: 2025 - 1900 }, (_, i) => ({ label: String(1900 + i), value: 1900 + i })),
];

const YEAR_MAX_OPTIONS = [
  { label: "No max", value: null as number | null },
  ...Array.from({ length: 2025 - 1900 }, (_, i) => ({ label: String(2025 - i), value: 2025 - i })),
];

const HOA_OPTIONS = [
  { label: "No max", value: null as number | null },
  { label: "$0/mo (none)", value: 0 },
  { label: "$100/mo", value: 100 },
  { label: "$200/mo", value: 200 },
  { label: "$300/mo", value: 300 },
  { label: "$500/mo", value: 500 },
  { label: "$1,000/mo", value: 1000 },
];

const DOM_OPTIONS = [
  { label: "No max", value: null as number | null },
  { label: "1 day", value: 1 },
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

const PROPERTY_TYPE_LIST = ["House", "Condo", "Townhouse", "Co-op", "Multi-Family", "Land", "Other Types"];
const STATUS_LIST = ["Coming Soon", "Active", "Under Contract / Pending", "Sold"];
const LISTING_TYPE_LIST = ["Givenest Listings", "MLS Listings", "New Construction", "For Sale by Owner"];

function ChevronIcon() {
  return (
    <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2a2825]">{children}</div>;
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-[10px] py-[3px] text-sm text-[#2a2825]">
      <span className={`flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-sm border transition ${checked ? "border-coral bg-coral" : "border-[#d0cdc8] bg-white"}`}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    </label>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white animate-pulse">
      <div className="h-[180px] bg-[#F0EDEA]" />
      <div className="px-[18px] py-4">
        <div className="mb-2 h-4 w-24 rounded bg-[#E8E5E0]" />
        <div className="mb-1 h-3 w-40 rounded bg-[#E8E5E0]" />
        <div className="mb-4 h-3 w-28 rounded bg-[#E8E5E0]" />
        <div className="flex gap-4 mb-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-6 w-10 rounded bg-[#E8E5E0]" />)}
        </div>
        <div className="h-px bg-border mb-3" />
        <div className="flex justify-between">
          <div className="h-3 w-24 rounded bg-[#E8E5E0]" />
          <div className="h-4 w-16 rounded bg-[#E8E5E0]" />
        </div>
      </div>
    </div>
  );
}

/** Returns "NEW X HRS AGO" / "NEW X DAYS AGO" if listed recently, null otherwise */
function getNewLabel(listingDate: string | undefined): string | null {
  if (!listingDate) return null;
  const ms = Date.now() - new Date(listingDate).getTime();
  const hours = ms / (1000 * 60 * 60);
  if (hours <= 1) return "NEW";
  if (hours <= 24) return `NEW ${Math.round(hours)} HR${Math.round(hours) !== 1 ? "S" : ""} AGO`;
  const days = Math.floor(hours / 24);
  if (days <= 7) return `NEW ${days} DAY${days !== 1 ? "S" : ""} AGO`;
  return null;
}

/** Formats the next upcoming open house as "OPEN SAT, 11AM-2PM" */
function getOpenHouseLabel(openHouses: Property["openHouses"]): string | null {
  if (!openHouses?.length) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = openHouses
    .filter((oh) => new Date(oh.date + "T00:00:00") >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!upcoming) return null;
  const day = new Date(upcoming.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
  };
  return `OPEN ${day}, ${fmt(upcoming.startTime)}-${fmt(upcoming.endTime)}`;
}

// Icon for city suggestions
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Icon for zip code suggestions
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

function HomeGridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

/** Haversine distance in miles between two lat/lng points */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Buy() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Restore location from URL (e.g., when navigating back from a listing)
  const urlLocation = locationFromParams(searchParams);

  // Search state — initialized from URL so back-navigation restores the previous search
  const [searchInput, setSearchInput] = useState(() => urlLocation?.label ?? "");
  const [search, setSearch] = useState(""); // client-side address filter
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(urlLocation);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  // Live address search results
  const [addressResults, setAddressResults] = useState<Property[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [isMlsSearch, setIsMlsSearch] = useState(false);
  const [hasSubdivisionMatch, setHasSubdivisionMatch] = useState(false);

  // User geolocation
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<"ip" | "gps" | null>(null);
  // Skip IP geolocation wait if a location was already in the URL
  const [locationReady, setLocationReady] = useState(() => urlLocation !== null);
  // Treat URL-restored location as user-set so IP doesn't override it
  const userSetLocation = useRef(urlLocation !== null);

  const [minPrice, setMinPrice] = useState(() => Number(searchParams.get("minPrice") ?? "0"));
  const [maxPrice, setMaxPrice] = useState(() => {
    const v = searchParams.get("maxPrice");
    return v ? Number(v) : Infinity;
  });

  // Filter panel
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Property type
  const [propertyTypes, setPropertyTypes] = useState<Set<string>>(() => {
    const t = searchParams.get("type");
    return t ? new Set(t.split(",")) : new Set();
  });
  // Status
  const [statuses, setStatuses] = useState<Set<string>>(() => {
    const s = searchParams.get("status");
    return s ? new Set(s.split(",")) : new Set();
  });
  const [openHousesOnly, setOpenHousesOnly] = useState(false);
  // Listing type
  const [listingTypes, setListingTypes] = useState<Set<string>>(new Set());
  // Beds / baths
  const [minBeds, setMinBeds] = useState<number | null>(() => { const v = searchParams.get("minBeds"); return v ? Number(v) : null; });
  const [minBaths, setMinBaths] = useState<number | null>(() => { const v = searchParams.get("minBaths"); return v ? Number(v) : null; });
  // Property facts
  const [minSqft, setMinSqft] = useState(() => searchParams.get("minSqft") ?? "");
  const [maxSqft, setMaxSqft] = useState(() => searchParams.get("maxSqft") ?? "");
  const [minYear, setMinYear] = useState<number | null>(null);
  const [maxYear, setMaxYear] = useState<number | null>(null);
  const [maxHoa, setMaxHoa] = useState<number | null>(() => {
    const h = searchParams.get("maxHoa");
    return h ? Number(h) : null;
  });
  const [maxDom, setMaxDom] = useState<number | null>(null);

  // Live listings from Spark API
  const [properties, setProperties] = useState<Property[]>([]);
  const [pinnedListings, setPinnedListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") ?? "1")));
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") ?? "recommended");
  const [totalPages, setTotalPages] = useState(1);

  // Search suggestions (memoized)
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

  // Close search dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // On mount: detect location via IP (fast), then upgrade to GPS if allowed
  useEffect(() => {
    let cancelled = false;
    // Safety valve: never block the initial fetch longer than 2s
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setLocationReady(true);
    }, 2000);

    fetch("/api/user-location")
      .then((r) => r.json())
      .then((data: { lat: number | null; lng: number | null; city: string | null; region: string | null; source: string }) => {
        if (cancelled) return;
        if (data.lat && data.lng) {
          setUserLat(data.lat);
          setUserLng(data.lng);
          setLocationSource("ip");
          // Auto-select nearest city if user is in AZ and hasn't picked one manually.
          // Uses haversine against city coordinates instead of exact name match so any
          // AZ IP location (even cities not in our list) resolves to the closest city.
          // Location coords are used only for distance sorting — not shown in search bar
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLocationReady(true);
          clearTimeout(fallbackTimer);
        }
      });

    // Non-blocking GPS upgrade — fires after initial load, refines sort
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocationSource("gps");
        },
        () => {} // silently ignore denial
      );
    }

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced live address search — fires when user types ≥3 chars
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 3 || selectedLocation) {
      setAddressResults([]);
      setIsMlsSearch(false);
      setHasSubdivisionMatch(false);
      setAddressSearchLoading(false);
      return;
    }
    setAddressSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/listings/address-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setAddressResults(data.listings ?? []);
        setIsMlsSearch(data.isMlsNumber ?? false);
        setHasSubdivisionMatch(data.hasSubdivisionMatch ?? false);
      } catch {
        setAddressResults([]);
        setIsMlsSearch(false);
        setHasSubdivisionMatch(false);
      } finally {
        setAddressSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, selectedLocation]);

  // Fetch listings from Spark API (server-side filtered), with client-side cache
  const fetchListings = useCallback(async () => {
    const params = new URLSearchParams();
    if (minPrice > 0) params.set("minPrice", String(minPrice));
    if (minPrice > 0 && maxPrice !== Infinity) params.set("maxPrice", String(maxPrice));
    if (maxPrice !== Infinity && minPrice === 0) params.set("maxPrice", String(maxPrice));
    if (propertyTypes.size > 0) params.set("type", Array.from(propertyTypes).join(","));
    if (statuses.size > 0) params.set("status", Array.from(statuses).join(","));
    if (minBeds !== null) params.set("minBeds", String(minBeds));
    if (minBaths !== null) params.set("minBaths", String(minBaths));
    if (minSqft) params.set("minSqft", minSqft);
    if (maxSqft) params.set("maxSqft", maxSqft);
    if (maxHoa !== null) params.set("maxHoa", String(maxHoa));
    if (selectedLocation?.city) params.set("city", selectedLocation.city);
    if (selectedLocation?.zip) params.set("zip", selectedLocation.zip);
    if (selectedLocation?.subdivision) params.set("subdivision", selectedLocation.subdivision);
    params.set("page", String(page));
    params.set("sort", sortBy);

    const cacheKey = params.toString();

    // Serve from cache instantly if fresh (< 5 min)
    const hit = listingsCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setProperties(hit.data.listings);
      setPinnedListings(hit.data.pinnedListings ?? []);
      setTotal(hit.data.total);
      setTotalPages(hit.data.totalPages ?? 1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/listings?${cacheKey}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      listingsCache.set(cacheKey, { data, ts: Date.now() });
      setProperties(data.listings ?? []);
      setPinnedListings(data.pinnedListings ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setProperties([]);
      setPinnedListings([]);
    } finally {
      setLoading(false);
    }
  }, [minPrice, maxPrice, propertyTypes, statuses, minBeds, minBaths, minSqft, maxSqft, maxHoa, selectedLocation, page, sortBy]);

  // Debounced refetch — waits for location detection on first load
  useEffect(() => {
    if (!locationReady) return;
    const timer = setTimeout(fetchListings, 400);
    return () => clearTimeout(timer);
  }, [fetchListings, locationReady]);

  function selectLocation(loc: LocationSuggestion) {
    userSetLocation.current = true;
    setSelectedLocation(loc);
    setSearchInput(loc.label);
    setSearch(""); // clear address-level client filter
    setSearchDropdownOpen(false);
  }

  function clearLocation() {
    userSetLocation.current = true;
    setSelectedLocation(null);
    setSearchInput("");
    setSearch("");
    setAddressResults([]);
  }

  function toggleSet(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function clearFilters() {
    setPropertyTypes(new Set());
    setStatuses(new Set());
    setOpenHousesOnly(false);
    setListingTypes(new Set());
    setMinBeds(null);
    setMinBaths(null);
    setMinSqft("");
    setMaxSqft("");
    setMinYear(null);
    setMaxYear(null);
    setMaxHoa(null);
    setMaxDom(null);
    setPage(1);
  }

  // Reset to page 1 whenever filter / location / sort params change
  useEffect(() => { setPage(1); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minPrice, maxPrice, minBeds, minBaths, minSqft, maxSqft, maxHoa, selectedLocation?.label, propertyTypes.size, statuses.size, sortBy]);

  // Sync filter state to URL so browser back + "← Back to search" restores the previous search.
  // Uses router.replace (no new history entry) so every filter tweak doesn't pollute the history stack.
  useEffect(() => {
    if (!locationReady) return; // wait until initial location is resolved before writing URL
    const p = new URLSearchParams();
    if (selectedLocation?.city) p.set("city", selectedLocation.city);
    if (selectedLocation?.zip) p.set("zip", selectedLocation.zip);
    if (selectedLocation?.subdivision) p.set("subdivision", selectedLocation.subdivision);
    if (minPrice > 0) p.set("minPrice", String(minPrice));
    if (maxPrice !== Infinity) p.set("maxPrice", String(maxPrice));
    if (propertyTypes.size > 0) p.set("type", Array.from(propertyTypes).join(","));
    if (statuses.size > 0) p.set("status", Array.from(statuses).join(","));
    if (minBeds !== null) p.set("minBeds", String(minBeds));
    if (minBaths !== null) p.set("minBaths", String(minBaths));
    if (minSqft) p.set("minSqft", minSqft);
    if (maxSqft) p.set("maxSqft", maxSqft);
    if (maxHoa !== null) p.set("maxHoa", String(maxHoa));
    if (page > 1) p.set("page", String(page));
    if (sortBy !== "recommended") p.set("sort", sortBy);
    const qs = p.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationReady, selectedLocation, minPrice, maxPrice, propertyTypes, statuses, minBeds, minBaths, minSqft, maxSqft, maxHoa, page, sortBy]);

  const activeFilterCount =
    propertyTypes.size +
    statuses.size +
    (openHousesOnly ? 1 : 0) +
    listingTypes.size +
    (minBeds !== null ? 1 : 0) +
    (minBaths !== null ? 1 : 0) +
    (minSqft ? 1 : 0) +
    (maxSqft ? 1 : 0) +
    (minYear !== null ? 1 : 0) +
    (maxYear !== null ? 1 : 0) +
    (maxHoa !== null ? 1 : 0) +
    (maxDom !== null ? 1 : 0);

  // Client-side text search + remaining local filters on API results
  const filtered = properties.filter((h) => {
    if (search) {
      const q = search.toLowerCase();
      if (!h.address.toLowerCase().includes(q) && !h.city.toLowerCase().includes(q)) return false;
    }
    if (minYear !== null && h.yearBuilt && h.yearBuilt < minYear) return false;
    if (maxYear !== null && h.yearBuilt && h.yearBuilt > maxYear) return false;
    if (maxDom !== null && h.daysOnMarket !== undefined && h.daysOnMarket > maxDom) return false;
    if (listingTypes.size > 0) {
      const isGivenest = h.listOfficeName?.toLowerCase().includes("givenest");
      if (listingTypes.has("Givenest Listings") && !isGivenest) return false;
      if (listingTypes.has("MLS Listings") && isGivenest) return false;
    }
    return true;
  });

  // Sort: for "recommended" on page 1, pin Givenest listings first (fetched separately by API),
  // then proximity-sort the rest. Other sorts trust the API ordering.
  const sorted = useMemo(() => {
    if (sortBy !== "recommended") return filtered;

    // Build a deduped set: pinned Givenest listings first, then the rest sorted by proximity
    const pinnedSlugs = new Set(pinnedListings.map((l) => l.slug));
    const rest = filtered.filter((l) => !pinnedSlugs.has(l.slug));

    if (userLat !== null && userLng !== null) {
      rest.sort((a, b) => {
        const aDist =
          a.latitude != null && a.longitude != null
            ? haversine(userLat, userLng, a.latitude, a.longitude)
            : Infinity;
        const bDist =
          b.latitude != null && b.longitude != null
            ? haversine(userLat, userLng, b.latitude, b.longitude)
            : Infinity;
        return aDist - bDist;
      });
    }

    return [...pinnedListings, ...rest];
  }, [filtered, pinnedListings, userLat, userLng, sortBy]);

  const selectClass =
    "w-full rounded-lg border border-border bg-white px-3 py-[10px] text-[15px] text-[#2a2825] outline-none focus:border-coral appearance-none cursor-pointer pr-8";

  const filterSelectClass =
    "w-full rounded-md border border-[#e8e5e0] bg-white px-3 py-[8px] text-sm text-[#2a2825] outline-none focus:border-coral appearance-none cursor-pointer pr-7";

  return (
    <>
    {/* Preconnect to Spark photo CDN — eliminates DNS/TLS handshake before first image */}
    {/* eslint-disable-next-line @next/next/no-page-custom-font */}
    <link rel="preconnect" href="https://cdn.photos.sparkplatform.com" />
    <link rel="preconnect" href="https://cdn.resize.sparkplatform.com" />
    <div>
      <div className="bg-white px-8 pb-9 pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Buyer portal
          </span>
          <h1 className="mb-2 font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
            Find your home.{" "}
            <em className="text-coral">Fund a cause.</em>
          </h1>
          <p className="mb-[22px] max-w-[560px] text-[15px] leading-relaxed text-muted">
            Find houses for sale near you. View photos, open house information, and property details for nearby real estate.
          </p>

          {/* Search bar + filter */}
          <div className="relative flex flex-wrap items-stretch gap-2">
            {/* Search input with autocomplete — full width on mobile */}
            <div className="relative w-full lg:w-auto lg:flex-[3]" ref={searchRef}>
              <div className="flex overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-colors focus-within:border-coral">
                <input
                  className="min-w-0 flex-1 bg-transparent px-[16px] py-[10px] text-[15px] outline-none placeholder:text-[#c0bdb6]"
                  placeholder="City, zip, or address..."
                  value={searchInput}
                  onFocus={() => setSearchDropdownOpen(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchInput(val);
                    setSearch(val); // also drives client-side address filter
                    if (selectedLocation) setSelectedLocation(null); // clear API location on edit
                    setSearchDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchDropdownOpen(false);
                    if (e.key === "Enter") setSearchDropdownOpen(false);
                  }}
                />
                {searchInput && (
                  <button
                    onClick={clearLocation}
                    className="px-3 text-[#c0bdb6] hover:text-[#2a2825] transition-colors"
                    aria-label="Clear search"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setSearchDropdownOpen(false)}
                  className="flex items-center justify-center gap-2 bg-coral px-[16px] text-white transition-colors hover:bg-[#d4574a]"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span className="hidden text-[15px] font-medium lg:inline">Search</span>
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {searchDropdownOpen && (citySuggestions.length > 0 || zipSuggestions.length > 0 || addressSearchLoading || addressResults.length > 0) && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-40 w-full min-w-[300px] overflow-hidden rounded-[10px] border border-border bg-white shadow-xl">

                  {/* Cities section */}
                  {citySuggestions.length > 0 && (
                    <>
                      <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                        {!searchInput.trim() ? "Popular cities" : "Cities"}
                      </div>
                      {citySuggestions.map((loc) => (
                        <button
                          key={loc.label}
                          onMouseDown={(e) => { e.preventDefault(); selectLocation(loc); }}
                          className="flex w-full items-center gap-3 px-4 py-[9px] text-left text-[14px] text-[#2a2825] hover:bg-[#F9F7F4] transition-colors"
                        >
                          <MapPinIcon />
                          {loc.label}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Zip codes section */}
                  {zipSuggestions.length > 0 && (
                    <>
                      <div className={`px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted ${citySuggestions.length > 0 ? "border-t border-border pt-2 mt-1" : "pt-3"}`}>
                        Zip Codes
                      </div>
                      {zipSuggestions.map((loc) => (
                        <button
                          key={loc.label}
                          onMouseDown={(e) => { e.preventDefault(); selectLocation(loc); }}
                          className="flex w-full items-center gap-3 px-4 py-[9px] text-left text-[14px] text-[#2a2825] hover:bg-[#F9F7F4] transition-colors"
                        >
                          <HashIcon />
                          {loc.label}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Live address/property results */}
                  {searchInput.trim().length >= 3 && (
                    <div className={citySuggestions.length > 0 || zipSuggestions.length > 0 ? "border-t border-border mt-1" : ""}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                          {isMlsSearch ? "MLS Listing" : "Properties"}
                        </span>
                        {addressSearchLoading && (
                          <svg className="h-3 w-3 animate-spin text-muted" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        )}
                      </div>

                      {/* Browse community shortcut — shown when subdivision match detected */}
                      {hasSubdivisionMatch && !isMlsSearch && (
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const q = searchInput.trim();
                            selectLocation({ type: "subdivision", label: q, subdivision: q });
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

                      {addressResults.length > 0 ? (
                        addressResults.map((prop) => (
                          <Link
                            key={prop.slug}
                            href={`/buy/${prop.slug}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setSearchDropdownOpen(false); setSearchInput(prop.address); }}
                            className="flex w-full items-center gap-3 px-4 py-[9px] text-left hover:bg-[#F9F7F4] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-muted">
                              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                              <path d="M9 21V12h6v9" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-medium text-[#2a2825]">{prop.address}</div>
                              <div className="text-[11px] text-muted">
                                {prop.city} · {fmt(prop.price)}
                                {prop.neighborhood && <span className="ml-1">· {prop.neighborhood}</span>}
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : !addressSearchLoading ? (
                        <div className="px-4 pb-3 text-[13px] text-muted">No listings found</div>
                      ) : null}
                    </div>
                  )}

                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* Min price */}
            <div className="relative" ref={filterRef}>
              <select
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className={selectClass}
              >
                {PRICE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>

            <span className="flex items-center text-[13px] text-muted">to</span>

            {/* Max price */}
            <div className="relative">
              <select
                value={maxPrice === Infinity ? "Infinity" : maxPrice}
                onChange={(e) => setMaxPrice(e.target.value === "Infinity" ? Infinity : Number(e.target.value))}
                className={selectClass}
              >
                {PRICE_MAX_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value === Infinity ? "Infinity" : o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>

            {/* Filters button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={`flex items-center gap-[6px] whitespace-nowrap rounded-lg border px-[16px] py-[10px] text-sm font-medium transition-colors ${filterOpen || activeFilterCount > 0 ? "border-coral bg-coral/[0.06] text-coral" : "border-border bg-white text-[#2a2825] hover:border-coral"}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-coral px-[7px] py-px text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter dropdown panel */}
              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(560px,calc(100vw-32px))] rounded-[10px] border border-border bg-white shadow-xl">
                  <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:divide-x divide-border">

                    {/* Left column */}
                    <div className="p-5">
                      {/* Bedrooms */}
                      <div className="mb-5">
                        <SectionLabel>Bedrooms</SectionLabel>
                        <div className="flex gap-[6px]">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setMinBeds(minBeds === n ? null : n)}
                              className={`flex-1 rounded-md border py-[7px] text-[13px] font-medium transition-colors ${minBeds === n ? "border-coral bg-coral/10 text-coral" : "border-[#e8e5e0] text-[#2a2825] hover:border-coral"}`}
                            >
                              {n}+
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bathrooms */}
                      <div className="mb-6">
                        <SectionLabel>Bathrooms</SectionLabel>
                        <div className="flex gap-[6px]">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setMinBaths(minBaths === n ? null : n)}
                              className={`flex-1 rounded-md border py-[7px] text-[13px] font-medium transition-colors ${minBaths === n ? "border-coral bg-coral/10 text-coral" : "border-[#e8e5e0] text-[#2a2825] hover:border-coral"}`}
                            >
                              {n}+
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Property Type */}
                      <div className="mb-6">
                        <SectionLabel>Property Type</SectionLabel>
                        <div className="space-y-px">
                          {PROPERTY_TYPE_LIST.map((t) => (
                            <CheckRow key={t} label={t} checked={propertyTypes.has(t)} onChange={() => setPropertyTypes(toggleSet(propertyTypes, t))} />
                          ))}
                        </div>
                      </div>

                      {/* Listing Type */}
                      <div>
                        <SectionLabel>Listing Type</SectionLabel>
                        <div className="space-y-px">
                          {LISTING_TYPE_LIST.map((t) => (
                            <CheckRow key={t} label={t} checked={listingTypes.has(t)} onChange={() => setListingTypes(toggleSet(listingTypes, t))} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="p-5">
                      {/* Listing Status */}
                      <div className="mb-5">
                        <SectionLabel>Listing Status</SectionLabel>
                        <div className="mb-3 space-y-px">
                          {STATUS_LIST.map((s) => (
                            <CheckRow key={s} label={s} checked={statuses.has(s)} onChange={() => setStatuses(toggleSet(statuses, s))} />
                          ))}
                        </div>
                        <div className="mb-2 text-[11px] font-medium text-muted">Days on Market</div>
                        <div className="relative">
                          <select value={maxDom ?? ""} onChange={(e) => setMaxDom(e.target.value === "" ? null : Number(e.target.value))} className={filterSelectClass}>
                            {DOM_OPTIONS.map((o) => (
                              <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                            ))}
                          </select>
                          <ChevronIcon />
                        </div>
                        <div className="mt-3">
                          <CheckRow label="Open Houses" checked={openHousesOnly} onChange={() => setOpenHousesOnly((v) => !v)} />
                        </div>
                      </div>

                      {/* Property Facts */}
                      <div>
                        <SectionLabel>Property Facts</SectionLabel>

                        {/* Square Feet */}
                        <div className="mb-3">
                          <div className="mb-[6px] text-[11px] font-medium text-muted">Square Feet</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="No min"
                              value={minSqft}
                              onChange={(e) => setMinSqft(e.target.value)}
                              className="w-full rounded-md border border-[#e8e5e0] px-3 py-[8px] text-sm outline-none focus:border-coral placeholder:text-[#c0bdb6]"
                            />
                            <span className="text-xs text-muted">–</span>
                            <input
                              type="number"
                              placeholder="No max"
                              value={maxSqft}
                              onChange={(e) => setMaxSqft(e.target.value)}
                              className="w-full rounded-md border border-[#e8e5e0] px-3 py-[8px] text-sm outline-none focus:border-coral placeholder:text-[#c0bdb6]"
                            />
                          </div>
                        </div>

                        {/* Year Built */}
                        <div className="mb-3">
                          <div className="mb-[6px] text-[11px] font-medium text-muted">Year Built</div>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <select value={minYear ?? ""} onChange={(e) => setMinYear(e.target.value === "" ? null : Number(e.target.value))} className={filterSelectClass}>
                                {YEAR_OPTIONS.map((o) => (
                                  <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                                ))}
                              </select>
                              <ChevronIcon />
                            </div>
                            <span className="text-xs text-muted">–</span>
                            <div className="relative flex-1">
                              <select value={maxYear ?? ""} onChange={(e) => setMaxYear(e.target.value === "" ? null : Number(e.target.value))} className={filterSelectClass}>
                                {YEAR_MAX_OPTIONS.map((o) => (
                                  <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                                ))}
                              </select>
                              <ChevronIcon />
                            </div>
                          </div>
                        </div>

                        {/* Max HOA */}
                        <div>
                          <div className="mb-[6px] text-[11px] font-medium text-muted">Max HOA Fees</div>
                          <div className="relative">
                            <select value={maxHoa ?? ""} onChange={(e) => setMaxHoa(e.target.value === "" ? null : Number(e.target.value))} className={filterSelectClass}>
                              {HOA_OPTIONS.map((o) => (
                                <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                              ))}
                            </select>
                            <ChevronIcon />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-border px-5 py-3">
                    <button
                      onClick={clearFilters}
                      className="text-[13px] text-muted underline-offset-2 hover:text-[#2a2825] hover:underline"
                    >
                      Clear all filters
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="rounded-md bg-coral px-5 py-[8px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location pill — auto-detected or manually selected */}
          {selectedLocation && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-[6px] rounded-full bg-coral/10 px-3 py-[5px] text-xs font-medium text-coral">
                {selectedLocation.type === "city" ? <MapPinIcon /> : selectedLocation.type === "zip" ? <HashIcon /> : <HomeGridIcon />}
                {selectedLocation.label}
                <button
                  onClick={clearLocation}
                  className="ml-[2px] text-coral/60 hover:text-coral transition-colors"
                  aria-label="Clear location filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            </div>
          )}

          <p className="mt-3 text-[12px] text-muted">
            Every closing donates a portion of the commission to your chosen charity — at no extra cost to you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-9">
        {/* Results header: count + sort */}
        <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-3 w-3 animate-spin text-coral" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading…
                </span>
              ) : (
                <>
                  <span className="font-semibold text-[#2a2825]">{total >= 1000 ? "1,000+" : total.toLocaleString()}</span>
                  {" "}home{total !== 1 ? "s" : ""}
                  {selectedLocation ? ` in ${selectedLocation.label}` : " in Arizona"}
                </>
              )}
            </span>
            <span className="text-border">·</span>
            <span className="text-[13px] text-muted">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="appearance-none rounded-md border border-border bg-white py-[7px] pl-3 pr-8 text-[13px] font-medium text-[#2a2825] outline-none focus:border-coral cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price (low to high)</option>
                <option value="price_desc">Price (high to low)</option>
                <option value="sqft_desc">Largest</option>
                <option value="beds_desc">Most beds</option>
              </select>
              <ChevronIcon />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : sorted.map((h, idx) => {
                const givingPool = h.donation ?? calcGivingPool(h.price);
                const isGivenest = h.listOfficeName?.toLowerCase().includes("givenest");
                // First 6 cards are above the fold — load eagerly at high priority
                const aboveFold = idx < 6;
                const cardImg = h.thumbnails?.[0] ?? h.images?.[0];
                return (
                  <Link
                    key={h.slug}
                    href={`/buy/${h.slug}`}
                    className="group overflow-hidden rounded-[10px] border border-border bg-white transition-all hover:shadow-md"
                  >
                    <div className="relative h-[180px] overflow-hidden bg-[#F5F4F2]">
                      {cardImg && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cardImg}
                          alt={h.address}
                          loading={aboveFold ? "eager" : "lazy"}
                          decoding="async"
                          // @ts-expect-error — fetchpriority is a valid HTML attribute, React types lag behind
                          fetchpriority={aboveFold ? "high" : "auto"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                      {(() => {
                        const newLabel = getNewLabel(h.listingDate);
                        const openLabel = getOpenHouseLabel(h.openHouses);
                        const isBackOnMarket = !!h.backOnMarketDate &&
                          (Date.now() - new Date(h.backOnMarketDate).getTime()) < 30 * 24 * 60 * 60 * 1000;
                        // Primary status pill: "new" or "back on market" replaces "For Sale"
                        const primaryLabel =
                          h.status === "For Sale" && newLabel ? newLabel :
                          h.status === "For Sale" && isBackOnMarket ? "BACK ON MARKET" :
                          null;
                        const showStatusPill = h.status && !(isGivenest && h.status === "For Sale") && !primaryLabel;
                        return (
                          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                            {isGivenest && (
                              <span className="rounded-full bg-coral px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm">
                                Listed by Givenest
                              </span>
                            )}
                            {primaryLabel && (
                              <span className={`rounded-full px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm ${isBackOnMarket && !newLabel ? "bg-blue-500" : "bg-emerald-600"}`}>
                                {primaryLabel}
                              </span>
                            )}
                            {showStatusPill && (
                              <span className={`rounded-full px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm ${
                                h.status === "For Sale" ? "bg-emerald-500" :
                                h.status === "Coming Soon" ? "bg-blue-500" :
                                h.status === "Pending" ? "bg-amber-500" :
                                h.status === "Contingent" ? "bg-orange-500" :
                                h.status === "For Rent" ? "bg-purple-500" :
                                "bg-[#6b6865]"
                              }`}>
                                {h.status}
                              </span>
                            )}
                            {openLabel && (
                              <span className="rounded-full bg-emerald-600 px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm">
                                {openLabel}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="px-[18px] py-4">
                      <div className="mb-px text-[15px] font-semibold">
                        {fmt(h.price)}
                      </div>
                      <div className="mb-px text-[13px] font-medium">{h.address}</div>
                      <div className="mb-3 text-xs text-muted">{h.city}</div>
                      <div className="mb-3 flex gap-[14px]">
                        {[
                          ["Beds", h.beds > 0 ? h.beds : "—"],
                          ["Baths", h.baths > 0 ? h.baths : "—"],
                          ["Sqft", h.sqft > 0 ? h.sqft.toLocaleString() : "—"],
                        ].map(([k, v]) => (
                          <div key={k as string}>
                            <div className="text-[9px] font-medium uppercase tracking-[0.06em] text-muted">
                              {k}
                            </div>
                            <div className="mt-px text-[13px] font-semibold">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mb-[10px] h-px bg-border" />
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted">Estimated Donation</span>
                        <span className="text-[15px] font-semibold text-coral">
                          {fmt(givingPool)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Pagination nav */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-1">
              {/* Previous */}
              <button
                onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === 1}
                className="flex h-9 items-center gap-1 rounded-md border border-border px-3 text-[13px] font-medium text-[#2a2825] transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Prev
              </button>

              {/* Page numbers */}
              {getPaginationPages(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-[13px] text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-[13px] font-medium transition-colors ${
                      page === p
                        ? "border-coral bg-coral text-white"
                        : "border-border text-[#2a2825] hover:border-coral hover:text-coral"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === totalPages}
                className="flex h-9 items-center gap-1 rounded-md border border-border px-3 text-[13px] font-medium text-[#2a2825] transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <div className="text-[12px] text-muted">
              Page {page} of {totalPages}
            </div>
          </div>
        )}

        <IdxAttribution />
      </div>
    </div>
    </>
  );
}
