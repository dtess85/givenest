"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug, AGENTS } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
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

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10">
      <Link
        href="/buy"
        className="mb-6 inline-block text-[13px] text-muted transition-colors hover:text-black"
      >
        ← Back to search
      </Link>

      <div className="grid grid-cols-1 items-start gap-11 lg:grid-cols-[1fr_360px]">
        {/* Left column — property info */}
        <div>
          <div className="mb-6 flex h-[240px] items-end rounded-[10px] bg-[#F5F4F2] p-6">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-[0.06em] text-muted">
                {property.type}
              </div>
              <h1 className="mb-[3px] font-serif text-[26px] font-medium tracking-[-0.02em]">
                {property.address}
              </h1>
              <div className="text-[13px] text-muted">{property.city}</div>
            </div>
          </div>

          <div className="mb-6 flex gap-7">
            {[
              ["Price", fmt(property.price)],
              ["Beds", property.beds],
              ["Baths", property.baths],
              ["Sqft", property.sqft.toLocaleString()],
            ].map(([k, v]) => (
              <div key={k as string}>
                <div className="mb-[3px] text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                  {k}
                </div>
                <div className="text-base font-semibold">{v}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 h-px bg-border" />

          <h3 className="mb-[14px] font-serif text-[17px] font-medium tracking-[-0.01em]">
            givenest agents
          </h3>
          <div className="flex flex-col gap-2">
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
                      <div className="flex items-center gap-[6px]">
                        <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="text-[11px] text-muted hover:text-black">{a.phone}</a>
                        <a href={a.instagram} target="_blank" rel="noopener noreferrer" className="inline-block text-coral hover:opacity-70" aria-label="Instagram"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!isSubmitted) {
                          setActiveAgent(isActive ? null : a.initials);
                          setFormData({ name: "", email: "", phone: "" });
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
                      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                        Your contact info
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <input
                          className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                          placeholder="Full name"
                          value={formData.name}
                          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                        />
                        <input
                          type="email"
                          className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                          placeholder="Email address"
                          value={formData.email}
                          onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                        />
                        <input
                          type="tel"
                          className="w-full rounded-md border border-border bg-white px-[12px] py-[8px] text-xs outline-none placeholder:text-[#c0bdb6] focus:border-coral"
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
                          className={`w-full rounded-md bg-coral py-[8px] text-xs font-medium text-white transition-colors hover:bg-[#d4574a] ${
                            !formData.name || !formData.email || sending
                              ? "cursor-default opacity-40"
                              : "cursor-pointer"
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

        {/* Right column — Giving Panel (sticky) */}
        <div className="sticky top-[68px]">
          <GivingPanel price={property.price} variant="property" />
        </div>
      </div>
    </div>
  );
}
