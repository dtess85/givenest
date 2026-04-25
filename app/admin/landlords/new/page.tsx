"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../AdminHeader";

/**
 * Admin: invite a new landlord. Submits to /api/admin/landlords which:
 *   1. Inserts a `landlords` row (idempotent by email — re-submits return
 *      the existing row instead of creating a dupe).
 *   2. Sends a Supabase magic-link invite via the service-role admin client.
 *
 * On success we navigate to /admin/landlords/[id] so the admin can
 * immediately attach properties + upload PMA / lease docs.
 */
export default function NewLandlordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("AZ");
  const [zip, setZip] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/landlords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim() || undefined,
          mailing_address:
            street || city || zip
              ? { street: street.trim(), city: city.trim(), state, zip: zip.trim() }
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      // Surface invite-send failures (rare — usually a missing service role key).
      if (data.invite_error) {
        setError(`Landlord saved, but invite failed: ${data.invite_error}`);
      }
      router.push(`/admin/landlords/${data.landlord.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <AdminHeader trail={[
        { label: "Admin", href: "/admin" },
        { label: "Landlords", href: "/admin/landlords" },
        { label: "New" },
      ]} />

      <div className="mx-auto max-w-[760px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Invite landlord</h1>
        <p className="mb-8 text-[14px] text-muted">
          Creates the landlord profile and emails them a magic-link invite. They click through, set a password, and land on their dashboard.
        </p>

        <form onSubmit={submit} className="rounded-[10px] border border-border bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" required>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Jane Doe" />
            </Field>
            <Field label="Email" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="jane@example.com" />
            </Field>
            <Field label="Phone">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(602) 555-0142" />
            </Field>
          </div>

          <div className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Mailing address (optional)
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_auto_auto]">
            <Field label="Street">
              <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} placeholder="123 Main St" />
            </Field>
            <Field label="City">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Scottsdale" />
            </Field>
            <Field label="State">
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} w-[80px]`} maxLength={2} />
            </Field>
            <Field label="ZIP">
              <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className={`${inputClass} w-[120px]`} placeholder="85251" />
            </Field>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-[#F5C2C2] bg-[#FDE2E2] p-3 text-[13px] text-[#A31F1F]">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-[12px] text-muted">
              The landlord will receive an email from Supabase with a sign-in link. They&apos;ll set a password on first visit.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-coral px-6 py-[10px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
            >
              {pending ? "Sending invite…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none placeholder:text-muted/50 focus:border-coral";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[6px] block text-[11px] font-medium text-muted">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </span>
      {children}
    </label>
  );
}
