"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Charity { id: string; name: string; slug: string; }

export default function NewTransactionPage() {
  const router = useRouter();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    charity_id: "",
    amount: "",
    property_address: "",
    property_city: "",
    closing_date: "",
    agent_name: "",
    agent_share_consent: false,
    client_name: "",
    client_share_consent: false,
    notes: "",
  });

  useEffect(() => {
    fetch("/api/admin/charities").then((r) => r.json()).then((d) => setCharities(d.charities ?? []));
  }, []);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/admin/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      alert("Error saving transaction.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <a href="/" className="font-sans text-[16px] font-medium text-white">give<span className="text-coral">nest</span></a>
          <span className="text-white/30">|</span>
          <Link href="/admin" className="text-[13px] text-white/60 hover:text-white">Admin</Link>
          <span className="text-white/30">/</span>
          <span className="text-[13px] text-white/60">Log closing</span>
        </div>
      </div>

      <div className="mx-auto max-w-[680px] px-8 py-10">
        <h1 className="mb-8 font-serif text-[28px] font-medium tracking-[-0.01em]">Log a closing</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Charity */}
          <div className="rounded-[10px] border border-border bg-white p-5">
            <label className="mb-2 block text-[13px] font-medium">Charity *</label>
            <select
              required
              value={form.charity_id}
              onChange={(e) => set("charity_id", e.target.value)}
              className="w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none focus:border-coral"
            >
              <option value="">Select a charity...</option>
              {charities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[10px] border border-border bg-white p-5">
              <label className="mb-2 block text-[13px] font-medium">Donation amount *</label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-[#faf9f7] px-3 py-2">
                <span className="text-muted">$</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="5,625.00"
                  className="flex-1 bg-transparent text-[14px] outline-none"
                />
              </div>
            </div>
            <div className="rounded-[10px] border border-border bg-white p-5">
              <label className="mb-2 block text-[13px] font-medium">Closing date</label>
              <input
                type="date"
                value={form.closing_date}
                onChange={(e) => set("closing_date", e.target.value)}
                className="w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none focus:border-coral"
              />
            </div>
          </div>

          {/* Property */}
          <div className="rounded-[10px] border border-border bg-white p-5">
            <label className="mb-2 block text-[13px] font-medium">Property</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.property_address}
                onChange={(e) => set("property_address", e.target.value)}
                placeholder="Street address"
                className="rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none focus:border-coral"
              />
              <input
                type="text"
                value={form.property_city}
                onChange={(e) => set("property_city", e.target.value)}
                placeholder="City, AZ"
                className="rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none focus:border-coral"
              />
            </div>
          </div>

          {/* Agent */}
          <div className="rounded-[10px] border border-border bg-white p-5">
            <label className="mb-2 block text-[13px] font-medium">Agent</label>
            <input
              type="text"
              value={form.agent_name}
              onChange={(e) => set("agent_name", e.target.value)}
              placeholder="Agent full name"
              className="mb-3 w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none focus:border-coral"
            />
            <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={form.agent_share_consent}
                onChange={(e) => set("agent_share_consent", e.target.checked)}
                className="accent-coral"
              />
              Agent consents to showing their name on the charity&apos;s public profile
            </label>
          </div>

          {/* Client */}
          <div className="rounded-[10px] border border-border bg-white p-5">
            <label className="mb-2 block text-[13px] font-medium">Client</label>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
              placeholder="Client full name"
              className="mb-3 w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none focus:border-coral"
            />
            <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={form.client_share_consent}
                onChange={(e) => set("client_share_consent", e.target.checked)}
                className="accent-coral"
              />
              Client consents to showing their name on the charity&apos;s public profile
            </label>
          </div>

          {/* Notes */}
          <div className="rounded-[10px] border border-border bg-white p-5">
            <label className="mb-2 block text-[13px] font-medium">Internal notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any internal context about this closing..."
              rows={3}
              className="w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] font-light outline-none focus:border-coral"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-coral py-[13px] text-[15px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Log closing"}
          </button>
        </form>
      </div>
    </div>
  );
}
