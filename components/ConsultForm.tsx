"use client";

import { useState } from "react";

interface ConsultFormProps {
  agentName: string;
  agentOffice?: string | null;
  propertyAddress?: string;
  source: "directory" | "property-page";
  onSuccess?: () => void;
}

export default function ConsultForm({
  agentName,
  agentOffice,
  propertyAddress,
  source,
  onSuccess,
}: ConsultFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = form.name.trim() && form.email.trim() && !sending && !sent;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    try {
      await fetch("/api/agent-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          agentName,
          agentOffice: agentOffice ?? undefined,
          propertyAddress: propertyAddress ?? undefined,
          message: form.message,
          source,
        }),
      });
      setSent(true);
      onSuccess?.();
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-[#FAFAF8] px-4 py-6 text-center">
        <div className="mb-1 text-[14px] font-medium">Request sent</div>
        <p className="text-[12px] text-muted">
          We&apos;ll coordinate with {agentName} and get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
        Your contact info
      </div>
      <input
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
        placeholder="Full name"
        value={form.name}
        autoFocus
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <input
        type="email"
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
        placeholder="Email address"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <input
        type="tel"
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <textarea
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#c0bdb6] focus:border-coral"
        placeholder="Message (optional)"
        rows={2}
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full rounded-md bg-coral py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
          !canSubmit ? "cursor-default opacity-40" : "cursor-pointer"
        }`}
      >
        {sending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
