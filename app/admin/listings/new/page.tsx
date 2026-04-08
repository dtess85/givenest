"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Property } from "@/lib/mock-data";

interface ImportResult {
  listing: Property | null;
  spark_listing_key: string | null;
  source: "standard" | "replication" | "flexmls-scrape" | "not-found";
}

const STATUS_OPTIONS = ["Coming Soon", "For Sale", "Pending", "Contingent"];
const TYPE_OPTIONS = [
  "Single Family Residence", "Townhouse", "Condominium", "Apartment",
  "Duplex", "Triplex", "Quadruplex", "Land",
];

export default function NewListingPage() {
  const router = useRouter();

  // Import section state
  const [importInput, setImportInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [sparkKey, setSparkKey] = useState("");

  // Form state
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Gilbert");
  const [state, setState] = useState("AZ");
  const [zip, setZip] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [status, setStatus] = useState("Coming Soon");
  const [propertyType, setPropertyType] = useState("Single Family Residence");
  const [yearBuilt, setYearBuilt] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [hoaDues, setHoaDues] = useState("");
  const [garageSpaces, setGarageSpaces] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [sortPriority, setSortPriority] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImport() {
    const q = importInput.trim();
    if (!q) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Send the full input — route handles URL detection, MLS extraction, etc.
      const res = await fetch(`/api/admin/spark-import?mls=${encodeURIComponent(q)}`);
      const data: ImportResult = await res.json();
      setImportResult(data);

      if (data.listing) {
        const l = data.listing;
        // Pre-fill form from Spark data
        const addressOnly = l.address ?? "";
        const cityParts = l.city?.split(",") ?? [];
        const cityName = cityParts[0]?.trim() ?? "Gilbert";
        const stateZip = cityParts[1]?.trim() ?? "AZ";
        const stateMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5})?/);

        setAddress(addressOnly);
        setCity(cityName);
        setState(stateMatch?.[1] ?? "AZ");
        setZip(stateMatch?.[2] ?? "");
        // For FlexMLS scrape, price & status aren't in the static HTML — keep form defaults
        if (data.source !== "flexmls-scrape") setPrice(String(l.price ?? ""));
        setBeds(l.beds != null && l.beds > 0 ? String(l.beds) : "");
        setBaths(l.baths != null && l.baths > 0 ? String(l.baths) : "");
        setSqft(l.sqft != null && l.sqft > 0 ? String(l.sqft) : "");
        if (data.source !== "flexmls-scrape") {
          setStatus(l.status === "For Sale" ? "For Sale" : l.status ?? "Coming Soon");
        }
        setPropertyType(l.type ?? "Single Family Residence");
        setYearBuilt(l.yearBuilt != null ? String(l.yearBuilt) : "");
        setLotSize(l.lotSize ?? "");
        setHoaDues(l.hoaDues != null ? String(l.hoaDues) : "");
        setGarageSpaces(
          l.parking ? String(parseInt(l.parking.replace(/\D/g, "")) || "") : ""
        );
        setDescription(l.description ?? "");
        setNeighborhood(l.neighborhood ?? "");
        setMlsNumber(l.mlsNumber ?? "");
        setImageUrls((l.images ?? []).join("\n"));
        setSparkKey(data.spark_listing_key ?? "");
      }
    } catch {
      setImportResult({ listing: null, spark_listing_key: null, source: "not-found" });
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    if (!address.trim() || !price) {
      setError("Address and price are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        mls_number: mlsNumber || null,
        spark_listing_key: sparkKey || null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim() || null,
        price: Number(price),
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        sqft: sqft ? Number(sqft) : null,
        property_type: propertyType,
        status,
        year_built: yearBuilt ? Number(yearBuilt) : null,
        lot_size: lotSize || null,
        hoa_dues: hoaDues ? Number(hoaDues) : null,
        garage_spaces: garageSpaces ? Number(garageSpaces) : null,
        description: description || null,
        neighborhood: neighborhood || null,
        image_urls: imageUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
        list_office_name: "Givenest",
        is_active: isActive,
        sort_priority: Number(sortPriority) || 0,
      };

      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save listing.");
        return;
      }

      router.push("/admin/listings");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-coral";
  const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-muted";

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {/* Header */}
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[860px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium text-white">give<span className="text-coral">nest</span></a>
            <span className="text-white/30">|</span>
            <span className="text-[13px] text-white/60">Admin</span>
          </div>
          <Link href="/admin/listings" className="text-[13px] text-white/60 hover:text-white">
            ← Back to listings
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-8 py-10">
        <h1 className="mb-8 font-serif text-[28px] font-medium tracking-[-0.01em]">Add listing</h1>

        {/* Import from Spark */}
        <div className="mb-8 overflow-hidden rounded-[10px] border border-border bg-white" style={{ borderTop: "3px solid var(--color-coral)" }}>
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-[15px] font-medium">Import from Spark</h2>
            <p className="mt-1 text-[12px] text-muted">Paste a FlexMLS share URL, Matrix URL, MLS number, or any listing URL. Fields will be pre-filled automatically.</p>
          </div>
          <div className="p-5">
            <div className="flex gap-3">
              <input
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
                placeholder="https://www.flexmls.com/share/... or MLS number"
                className={inputCls + " flex-1"}
              />
              <button
                onClick={handleImport}
                disabled={importing || !importInput.trim()}
                className="shrink-0 rounded-md bg-coral px-5 py-2 text-[13px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-50"
              >
                {importing ? "Fetching…" : "Fetch from Spark"}
              </button>
            </div>

            {importResult && (
              <div className={`mt-3 rounded-md px-4 py-3 text-[13px] ${
                importResult.source !== "not-found"
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}>
                {importResult.source === "standard" && "✓ Found via Spark API — all fields and photos pre-filled from ARMLS data."}
                {importResult.source === "replication" && "✓ Found via IDX replication feed — fields pre-filled from ARMLS data."}
                {importResult.source === "flexmls-scrape" && "✓ Imported from FlexMLS listing page — review fields below and add any missing details."}
                {importResult.source === "not-found" && "Not found in the Spark API. This listing may not be in the IDX feed yet — fill in the details below manually."}
              </div>
            )}
          </div>
        </div>

        {/* Listing form */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-[15px] font-medium">Listing details</h2>
          </div>
          <div className="space-y-6 p-5">
            {/* Address row */}
            <div className="grid grid-cols-[1fr_180px_80px_100px] gap-3">
              <div>
                <label className={labelCls}>Street address *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="2635 E Los Altos Rd" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Zip</label>
                <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="85297" className={inputCls} />
              </div>
            </div>

            {/* Price / Status / Type */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>List price *</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="850000" type="number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Property type</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputCls}>
                  {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Beds / Baths / Sqft */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Beds</label>
                <input value={beds} onChange={(e) => setBeds(e.target.value)} type="number" placeholder="4" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Baths</label>
                <input value={baths} onChange={(e) => setBaths(e.target.value)} type="number" step="0.5" placeholder="2.5" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sq ft</label>
                <input value={sqft} onChange={(e) => setSqft(e.target.value)} type="number" placeholder="2400" className={inputCls} />
              </div>
            </div>

            {/* Year / Lot / HOA / Garage */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Year built</label>
                <input value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} type="number" placeholder="2018" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Lot size</label>
                <input value={lotSize} onChange={(e) => setLotSize(e.target.value)} placeholder="0.25 acres" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>HOA / mo</label>
                <input value={hoaDues} onChange={(e) => setHoaDues(e.target.value)} type="number" placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Garage spaces</label>
                <input value={garageSpaces} onChange={(e) => setGarageSpaces(e.target.value)} type="number" placeholder="2" className={inputCls} />
              </div>
            </div>

            {/* Neighborhood / MLS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Neighborhood / subdivision</label>
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Agritopia" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>MLS number</label>
                <input value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} placeholder="7009177" className={inputCls} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Property description…" className={inputCls + " resize-none"} />
            </div>

            {/* Image URLs */}
            <div>
              <label className={labelCls}>Photo URLs (one per line)</label>
              <textarea value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} rows={5} placeholder={"https://cdn.photos.sparkplatform.com/...\nhttps://cdn.photos.sparkplatform.com/..."} className={inputCls + " resize-none font-mono text-[11px]"} />
              <p className="mt-1 text-[11px] text-muted">Populated automatically when imported from Spark. First URL is the primary photo.</p>
            </div>

            {/* Spark key (read-only) */}
            {sparkKey && (
              <div>
                <label className={labelCls}>Spark listing key (auto-set)</label>
                <input value={sparkKey} readOnly className={inputCls + " bg-[#f9f8f6] text-muted font-mono text-[11px]"} />
              </div>
            )}

            {/* Active / Priority */}
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-coral" />
                <span className="text-[13px] font-medium">Active (visible on buy page)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted">Sort priority:</span>
                <input value={sortPriority} onChange={(e) => setSortPriority(e.target.value)} type="number" min="0" className="w-16 rounded-md border border-border bg-white px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-coral" />
                <span className="text-[11px] text-muted">(0 = highest)</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border pt-5">
              <Link href="/admin/listings" className="text-[13px] text-muted hover:text-black">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-coral px-6 py-2 text-[13px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save listing"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
