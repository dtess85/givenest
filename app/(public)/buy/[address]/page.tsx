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
                      <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="block text-[11px] text-muted hover:text-black">{a.phone}</a>
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
