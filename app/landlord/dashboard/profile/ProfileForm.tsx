"use client";

import { useState, useTransition } from "react";
import type { CommPrefs, Landlord } from "@/lib/db/landlords";

/**
 * Self-serve profile editor for the landlord dashboard. PUTs the same
 * payload shape that the admin profile editor uses (against
 * /api/landlord/profile rather than /api/admin/landlords/[id]) — server-
 * side, the route only allows the authenticated landlord to update
 * their own row.
 */
export default function ProfileForm({ landlord }: { landlord: Landlord }) {
  const [name, setName] = useState(landlord.name);
  const [phone, setPhone] = useState(landlord.phone ?? "");
  const addr = landlord.mailing_address ?? {};
  const [street, setStreet] = useState(addr.street ?? "");
  const [city, setCity] = useState(addr.city ?? "");
  const [state, setState] = useState(addr.state ?? "AZ");
  const [zip, setZip] = useState(addr.zip ?? "");
  const prefs = landlord.comm_prefs;
  const [emailOn, setEmailOn] = useState(prefs.email);
  const [smsOn, setSmsOn] = useState(prefs.sms);
  const [invoiceEmailsOn, setInvoiceEmailsOn] = useState(prefs.invoice_emails);
  const [frequency, setFrequency] = useState<CommPrefs["frequency"]>(prefs.frequency);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/landlord/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          mailing_address: street || city || zip
            ? { street: street.trim(), city: city.trim(), state, zip: zip.trim() }
            : null,
          comm_prefs: { email: emailOn, sms: smsOn, invoice_emails: invoiceEmailsOn, frequency },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={save} className="rounded-[10px] border border-border bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </Field>
        <Field label="Email">
          <input value={landlord.email} disabled className={`${inputClass} text-muted`} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
        Mailing address
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
        <Field label="Street"><input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} /></Field>
        <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} /></Field>
        <Field label="State"><input value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} w-[80px]`} maxLength={2} /></Field>
        <Field label="ZIP"><input value={zip} onChange={(e) => setZip(e.target.value)} className={`${inputClass} w-[120px]`} /></Field>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Communication preferences</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Toggle checked={emailOn} onChange={setEmailOn} label="Email notifications" />
          <Toggle checked={invoiceEmailsOn} onChange={setInvoiceEmailsOn} label="Invoice + receipt emails" />
          <Toggle checked={smsOn} onChange={setSmsOn} label="SMS notifications" hint="(coming soon)" />
          <Field label="Frequency">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as CommPrefs["frequency"])} className={inputClass}>
              <option value="monthly">Monthly digest</option>
              <option value="per_event">Each service log entry</option>
            </select>
          </Field>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-[#F5C2C2] bg-[#FDE2E2] p-3 text-[13px] text-[#A31F1F]">{error}</div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && <span className="text-[12px] text-emerald-600">Saved</span>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-coral px-6 py-[10px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none placeholder:text-muted/50 focus:border-coral";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[4px] block text-[11px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-coral" />
      <span>{label}{hint && <span className="ml-1 text-[11px] text-muted">{hint}</span>}</span>
    </label>
  );
}
