"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const STATUS_OPTIONS = ["Coming Soon", "For Sale", "Pending", "Contingent"];
const TYPE_OPTIONS = [
  "Single Family Residence", "Townhouse", "Condominium", "Apartment",
  "Duplex", "Triplex", "Quadruplex", "Land",
];

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
  const [sparkKey, setSparkKey] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [sortPriority, setSortPriority] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Load listing on mount
  useEffect(() => {
    fetch(`/api/admin/listings/${id}`)
      .then((r) => r.json())
      .then(({ listing }) => {
        if (!listing) { setNotFound(true); return; }
        setAddress(listing.address ?? "");
        setCity(listing.city ?? "Gilbert");
        setState(listing.state ?? "AZ");
        setZip(listing.zip ?? "");
        setPrice(listing.price != null ? String(listing.price) : "");
        setBeds(listing.beds != null ? String(listing.beds) : "");
        setBaths(listing.baths != null ? String(listing.baths) : "");
        setSqft(listing.sqft != null ? String(listing.sqft) : "");
        setStatus(listing.status ?? "Coming Soon");
        setPropertyType(listing.property_type ?? "Single Family Residence");
        setYearBuilt(listing.year_built != null ? String(listing.year_built) : "");
        setLotSize(listing.lot_size ?? "");
        setHoaDues(listing.hoa_dues != null ? String(listing.hoa_dues) : "");
        setGarageSpaces(listing.garage_spaces != null ? String(listing.garage_spaces) : "");
        setDescription(listing.description ?? "");
        setNeighborhood(listing.neighborhood ?? "");
        setMlsNumber(listing.mls_number ?? "");
        setSparkKey(listing.spark_listing_key ?? "");
        setImageUrls((listing.image_urls ?? []).join("\n"));
        setSortPriority(listing.sort_priority != null ? String(listing.sort_priority) : "0");
        setIsActive(listing.is_active !== false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
        image_urls: imageUrls.split("\n").map((u) => u.trim()).filter(Boolean),
        list_office_name: "Givenest",
        is_active: isActive,
        sort_priority: Number(sortPriority) || 0,
      };

      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save.");
        return;
      }

      router.push("/admin/listings");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      router.push("/admin/listings");
    } catch {
      setError("Failed to delete listing.");
      setDeleting(false);
    }
  }

  const inputCls = "w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-coral";
  const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-muted";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE]">
        <div className="text-[13px] text-muted">Loading…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F4F3EE]">
        <div className="text-[15px] font-medium">Listing not found</div>
        <Link href="/admin/listings" className="text-coral hover:underline text-[13px]">← Back to listings</Link>
      </div>
    );
  }

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
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em]">Edit listing</h1>
          {/* Delete button */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="text-[13px] text-muted hover:text-red-600">
              Delete listing
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-red-600 font-medium">Are you sure?</span>
              <button onClick={handleDelete} disabled={deleting} className="rounded-md bg-red-600 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-[13px] text-muted hover:text-black">Cancel</button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-[15px] font-medium">Listing details</h2>
          </div>
          <div className="space-y-6 p-5">
            {/* Address row */}
            <div className="grid grid-cols-[1fr_180px_80px_100px] gap-3">
              <div>
                <label className={labelCls}>Street address *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
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
                <input value={zip} onChange={(e) => setZip(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>List price *</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className={inputCls} />
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Beds</label>
                <input value={beds} onChange={(e) => setBeds(e.target.value)} type="number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Baths</label>
                <input value={baths} onChange={(e) => setBaths(e.target.value)} type="number" step="0.5" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sq ft</label>
                <input value={sqft} onChange={(e) => setSqft(e.target.value)} type="number" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Year built</label>
                <input value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} type="number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Lot size</label>
                <input value={lotSize} onChange={(e) => setLotSize(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>HOA / mo</label>
                <input value={hoaDues} onChange={(e) => setHoaDues(e.target.value)} type="number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Garage spaces</label>
                <input value={garageSpaces} onChange={(e) => setGarageSpaces(e.target.value)} type="number" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Neighborhood / subdivision</label>
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>MLS number</label>
                <input value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls + " resize-none"} />
            </div>

            <div>
              <label className={labelCls}>Photo URLs (one per line)</label>
              <textarea value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} rows={5} className={inputCls + " resize-none font-mono text-[11px]"} />
            </div>

            {sparkKey && (
              <div>
                <label className={labelCls}>Spark listing key</label>
                <input value={sparkKey} onChange={(e) => setSparkKey(e.target.value)} className={inputCls + " font-mono text-[11px]"} />
              </div>
            )}

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

            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-5">
              <Link href="/admin/listings" className="text-[13px] text-muted hover:text-black">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-coral px-6 py-2 text-[13px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
