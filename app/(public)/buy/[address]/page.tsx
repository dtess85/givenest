"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug, AGENTS } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
import { calcGivingPool } from "@/lib/commission";
import GivingPanel from "@/components/GivingPanel";

export default function PropertyDetail() {
  const params = useParams();
  const property = getPropertyBySlug(params.address as string);

  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [submittedAgents, setSubmittedAgents] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  if (!property) {
    return (
      <div className="mx-auto max-w-[1100px] px-8 py-20 text-center">
        <h1 className="font-serif text-2xl font-medium">Property not found</h1>
        <Link href="/buy" className="mt-4 inline-block text-sm text-coral hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const estimatedDonation = property.donation ?? calcGivingPool(property.price);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <Link
        href="/buy"
        className="mb-5 inline-block text-[13px] text-muted transition-colors hover:text-black"
      >
        ← Back to search
      </Link>

      {/* Two-column grid: photos + info left, sidebar right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Photo Gallery */}
          <div className="relative mb-5 grid h-[400px] grid-cols-2 gap-1 overflow-hidden rounded-[12px]">
            {/* Large hero photo */}
            <div className="flex items-center justify-center bg-[#E8E6E0]">
              <svg className="h-10 w-10 text-[#C4C0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* 2×2 thumbnail grid */}
            <div className="grid grid-rows-2 gap-1">
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-[#DDD9D2]" />
                <div className="bg-[#D5D1CA]" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-[#CFCBC3]" />
                <div className="relative bg-[#C8C4BC]">
                  <button className="absolute bottom-3 right-3 rounded-full border border-white/60 bg-black/50 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
                    View all photos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Address + stats bar */}
          <div className="mb-6">
            <div className="mb-1 inline-block rounded-full bg-[#F0EDE7] px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.07em] text-muted">
              {property.type}
            </div>
            <h1 className="mb-[2px] font-serif text-[28px] font-medium tracking-[-0.02em] leading-tight">
              {property.address}
            </h1>
            <p className="mb-4 text-[14px] text-muted">{property.city}</p>

            {/* Stat pills */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                ["Price", fmt(property.price)],
                ["Beds", String(property.beds)],
                ["Baths", String(property.baths)],
                ["Sqft", property.sqft.toLocaleString()],
              ].map(([label, value], i, arr) => (
                <div key={label} className="flex items-center gap-5">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted">{label}</div>
                    <div className="text-[15px] font-semibold">{value}</div>
                  </div>
                  {i < arr.length - 1 && <div className="h-6 w-px bg-border" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="sticky top-[68px] flex flex-col gap-4">

          {/* givenest agents card */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em]">givenest agents</h3>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {AGENTS.map((a) => {
                const isActive = activeAgent === a.initials;
                const isSubmitted = submittedAgents.has(a.initials);
                return (
                  <div key={a.initials}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
                        {a.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium">{a.name}</div>
                        <a href={`mailto:${a.email}`} className="block text-[11px] text-coral hover:underline truncate">{a.email}</a>
                        <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="block text-[11px] text-muted hover:text-black">{a.phone}</a>
                      </div>
                      <button
                        onClick={() => {
                          if (!isSubmitted) {
                            setActiveAgent(isActive ? null : a.initials);
                            setFormData({ name: "", email: "", phone: "" });
                          }
                        }}
                        className={`flex-shrink-0 rounded-md border px-3 py-[6px] text-[12px] transition-all ${
                          isSubmitted
                            ? "border-border text-muted cursor-default"
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
                        <div className="flex flex-col gap-2">
                          <input
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                            placeholder="Full name"
                            value={formData.name}
                            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                          />
                          <input
                            type="email"
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                          />
                          <input
                            type="tel"
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                            placeholder="Phone (optional)"
                            value={formData.phone}
                            onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                          />
                          <button
                            onClick={async () => {
                              if (!formData.name || !formData.email) return;
                              setSending(true);
                              try {
                                await fetch("/api/agent-request", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    name: formData.name,
                                    email: formData.email,
                                    phone: formData.phone,
                                    agentName: a.name,
                                    propertyAddress: property.address,
                                  }),
                                });
                              } finally {
                                setSending(false);
                                setSubmittedAgents((prev) => new Set(prev).add(a.initials));
                                setActiveAgent(null);
                              }
                            }}
                            disabled={!formData.name || !formData.email || sending}
                            className={`w-full rounded-md bg-coral py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
                              !formData.name || !formData.email || sending ? "cursor-default opacity-40" : "cursor-pointer"
                            }`}
                          >
                            {sending ? "Sending…" : "Send request"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* GivingPanel */}
          <GivingPanel price={property.price} variant="property" />
        </div>
      </div>

      {/* ── PROPERTY DETAILS (full width, below grid) ── */}
      <div className="mt-8 border-t border-border pt-8">
        <h2 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em]">Property details</h2>
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
            {[
              ["Home type", property.type],
              ["Bedrooms", String(property.beds)],
              ["Bathrooms", String(property.baths)],
              ["Square feet", property.sqft.toLocaleString()],
              ["List price", fmt(property.price)],
              ["Est. donation", fmt(estimatedDonation)],
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-5 py-4">
                <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.07em] text-muted">{label}</div>
                <div className={`text-[15px] font-semibold ${label === "Est. donation" ? "text-coral" : ""}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
