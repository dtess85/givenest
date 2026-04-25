"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CommPrefs,
  Landlord,
  LandlordDocument,
  LandlordInvoice,
  PropertyMgmt,
  ServiceLogEntry,
} from "@/lib/db/landlords";

/**
 * Single client surface for the admin landlord detail page. Owns local state
 * for every editable section so admins can stay on this page while making
 * changes, with optimistic refresh via `router.refresh()` after each mutation.
 *
 * Sections (top → bottom):
 *   1. Profile + comm prefs (PUT /api/admin/landlords/[id])
 *   2. Properties (POST /.../properties, PUT/DELETE /api/admin/properties/[id])
 *   3. Service log (per active property — POST/DELETE /api/admin/service-log)
 *   4. Documents (POST/DELETE /api/admin/landlords/[id]/documents, /api/admin/documents/[id])
 *   5. Invoices (history; manual generate-now button)
 *
 * Each section is a small subcomponent at the bottom of this file to keep
 * the wiring + state collocated rather than scattered across a Components/
 * folder for one page.
 */

const SERVICE_KIND_LABEL: Record<string, string> = {
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  pest_control: "Pest control",
  maintenance: "Maintenance",
  utilities: "Utilities",
  other: "Other",
};

const DOC_KIND_LABEL: Record<string, string> = {
  pma: "PMA",
  lease: "Lease",
  inspection: "Inspection",
  statement: "Statement",
  other: "Other",
};

const inputClass =
  "w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] outline-none placeholder:text-muted/50 focus:border-coral";
const sectionClass = "rounded-[10px] border border-border bg-white p-6";

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
function fmtCents(cents: number | null | undefined, fractional = true): string {
  if (cents == null) return "—";
  return (fractional ? usd2 : usd0).format(cents / 100);
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  landlord: Landlord;
  initialProperties: PropertyMgmt[];
  initialDocuments: LandlordDocument[];
  initialInvoices: LandlordInvoice[];
  initialServiceLogByProperty: Record<string, ServiceLogEntry[]>;
}

export default function LandlordPageClient({
  landlord,
  initialProperties,
  initialDocuments,
  initialInvoices,
  initialServiceLogByProperty,
}: Props) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalNote, setGlobalNote] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <header className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em]">{landlord.name}</h1>
          <p className="mt-1 text-[14px] text-muted">{landlord.email}</p>
          <p className="mt-1 text-[12px] text-muted">
            Invited {fmtDate(landlord.invited_at)} · {landlord.auth_user_id ? "Logged in" : "Awaiting first login"}
            {landlord.billing_setup_at ? " · Billing set up" : " · Billing pending"}
          </p>
        </div>
        <ResendInviteButton landlordId={landlord.id} onResult={(ok, msg) => {
          if (ok) setGlobalNote("Invite re-sent.");
          else setGlobalError(msg ?? "Resend failed");
        }} />
      </header>

      {globalError && <Banner kind="error">{globalError}</Banner>}
      {globalNote && <Banner kind="success">{globalNote}</Banner>}

      <div className="space-y-8">
        <ProfileSection landlord={landlord} onSaved={refresh} />
        <PropertiesSection
          landlordId={landlord.id}
          properties={initialProperties}
          onChanged={refresh}
        />
        <ServiceLogSection
          properties={initialProperties.filter((p) => p.status !== "terminated")}
          serviceLogByProperty={initialServiceLogByProperty}
          onChanged={refresh}
        />
        <DocumentsSection
          landlordId={landlord.id}
          properties={initialProperties}
          documents={initialDocuments}
          onChanged={refresh}
        />
        <InvoicesSection
          landlordId={landlord.id}
          invoices={initialInvoices}
          onChanged={refresh}
        />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile + comm prefs                                                        */
/* -------------------------------------------------------------------------- */

function ProfileSection({ landlord, onSaved }: { landlord: Landlord; onSaved: () => void }) {
  const [name, setName] = useState(landlord.name);
  const [phone, setPhone] = useState(landlord.phone ?? "");
  const addr = landlord.mailing_address ?? {};
  const [street, setStreet] = useState(addr.street ?? "");
  const [city, setCity] = useState(addr.city ?? "");
  const [state, setState] = useState(addr.state ?? "AZ");
  const [zip, setZip] = useState(addr.zip ?? "");
  const prefs: CommPrefs = landlord.comm_prefs;
  const [emailOn, setEmailOn] = useState(prefs.email);
  const [smsOn, setSmsOn] = useState(prefs.sms);
  const [invoiceEmailsOn, setInvoiceEmailsOn] = useState(prefs.invoice_emails);
  const [frequency, setFrequency] = useState<CommPrefs["frequency"]>(prefs.frequency);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      const res = await fetch(`/api/admin/landlords/${landlord.id}`, {
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
      if (res.ok) {
        setSaved(true);
        onSaved();
      }
    });
  }

  return (
    <section className={sectionClass}>
      <SectionHeader title="Profile" subtitle="Contact + communication preferences" />
      <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name"><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></Field>
        <Field label="Phone"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></Field>
        <div className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
          <Field label="Street"><input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} /></Field>
          <Field label="City"><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} /></Field>
          <Field label="State"><input type="text" value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} w-[80px]`} maxLength={2} /></Field>
          <Field label="ZIP"><input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className={`${inputClass} w-[120px]`} /></Field>
        </div>
        <div className="md:col-span-2 mt-2 border-t border-border pt-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Communication preferences</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Toggle checked={emailOn} onChange={setEmailOn} label="Email notifications" />
            <Toggle checked={invoiceEmailsOn} onChange={setInvoiceEmailsOn} label="Invoice emails" />
            <Toggle checked={smsOn} onChange={setSmsOn} label="SMS notifications" hint="(Phase TBD — placeholder)" />
            <Field label="Frequency">
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as CommPrefs["frequency"])} className={inputClass}>
                <option value="monthly">Monthly digest</option>
                <option value="per_event">Per service log entry</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="md:col-span-2 mt-2 flex items-center justify-end gap-3">
          {saved && <span className="text-[12px] text-emerald-600">Saved</span>}
          <button type="submit" disabled={pending} className="rounded-md bg-coral px-5 py-[8px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Properties                                                                  */
/* -------------------------------------------------------------------------- */

function PropertiesSection({
  landlordId,
  properties,
  onChanged,
}: {
  landlordId: string;
  properties: PropertyMgmt[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <section className={sectionClass}>
      <SectionHeader
        title="Properties"
        subtitle={`${properties.filter((p) => p.status !== "terminated").length} active · ${properties.length} total`}
        right={
          <button onClick={() => setShowAdd((v) => !v)} className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral">
            {showAdd ? "Cancel" : "Add property"}
          </button>
        }
      />
      {showAdd && (
        <AddPropertyForm
          landlordId={landlordId}
          onSaved={() => {
            setShowAdd(false);
            onChanged();
          }}
        />
      )}
      {properties.length === 0 ? (
        <p className="text-[13px] text-muted">No properties yet.</p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <PropertyRow key={p.id} property={p} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  );
}

function AddPropertyForm({ landlordId, onSaved }: { landlordId: string; onSaved: () => void }) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("AZ");
  const [zip, setZip] = useState("");
  const [feeDollars, setFeeDollars] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/landlords/${landlordId}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          state,
          zip: zip.trim() || undefined,
          monthly_management_fee_cents: feeDollars
            ? Math.round(parseFloat(feeDollars) * 100)
            : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setAddress("");
      setCity("");
      setZip("");
      setFeeDollars("");
      onSaved();
    });
  }

  return (
    <form onSubmit={submit} className="mb-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-[#FAF9F6] p-4 md:grid-cols-[2fr_1fr_auto_auto_auto_auto]">
      <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} required className={inputClass} placeholder="2845 E Red Oak Ct" /></Field>
      <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} required className={inputClass} placeholder="Gilbert" /></Field>
      <Field label="State"><input value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} w-[64px]`} maxLength={2} /></Field>
      <Field label="ZIP"><input value={zip} onChange={(e) => setZip(e.target.value)} className={`${inputClass} w-[100px]`} /></Field>
      <Field label="Monthly fee ($)"><input type="number" step="0.01" value={feeDollars} onChange={(e) => setFeeDollars(e.target.value)} className={`${inputClass} w-[120px]`} placeholder="0.00" /></Field>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="rounded-md bg-coral px-4 py-[8px] text-[13px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-60">
          {pending ? "Saving…" : "Add"}
        </button>
      </div>
      {error && <div className="md:col-span-6 text-[12px] text-[#A31F1F]">{error}</div>}
    </form>
  );
}

function PropertyRow({ property, onChanged }: { property: PropertyMgmt; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <PropertyEditForm
      property={property}
      onCancel={() => setEditing(false)}
      onSaved={() => {
        setEditing(false);
        onChanged();
      }}
    />
  ) : (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-[#FAF9F6] p-3">
      <div>
        <div className="text-[14px] font-medium">
          {property.address}
          {property.status !== "active" && (
            <span className="ml-2 rounded-full bg-[#F4F3EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{property.status}</span>
          )}
        </div>
        <div className="text-[12px] text-muted">
          {property.city}, {property.state} {property.zip ?? ""} · Fee: {fmtCents(property.monthly_management_fee_cents, false)}/mo
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral">Edit</button>
        {property.status !== "terminated" && (
          <button
            onClick={async () => {
              if (!confirm("Terminate this property? It stops being billed but historical data stays.")) return;
              await fetch(`/api/admin/properties/${property.id}`, { method: "DELETE" });
              onChanged();
            }}
            className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-[#A31F1F] hover:text-[#A31F1F]"
          >
            Terminate
          </button>
        )}
      </div>
    </div>
  );
}

function PropertyEditForm({ property, onCancel, onSaved }: { property: PropertyMgmt; onCancel: () => void; onSaved: () => void }) {
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [state, setState] = useState(property.state);
  const [zip, setZip] = useState(property.zip ?? "");
  const [feeDollars, setFeeDollars] = useState((property.monthly_management_fee_cents / 100).toFixed(2));
  const [status, setStatus] = useState(property.status);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          state,
          zip: zip.trim() || null,
          monthly_management_fee_cents: Math.round(parseFloat(feeDollars || "0") * 100),
          status,
        }),
      });
      if (res.ok) onSaved();
    });
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-md border border-coral bg-[#FFF5F4] p-4 md:grid-cols-[2fr_1fr_auto_auto_auto_auto_auto]">
      <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} required className={inputClass} /></Field>
      <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} required className={inputClass} /></Field>
      <Field label="State"><input value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} w-[64px]`} maxLength={2} /></Field>
      <Field label="ZIP"><input value={zip} onChange={(e) => setZip(e.target.value)} className={`${inputClass} w-[100px]`} /></Field>
      <Field label="Fee ($)"><input type="number" step="0.01" value={feeDollars} onChange={(e) => setFeeDollars(e.target.value)} className={`${inputClass} w-[100px]`} /></Field>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as PropertyMgmt["status"])} className={`${inputClass} w-[120px]`}>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="terminated">terminated</option>
        </select>
      </Field>
      <div className="flex items-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border bg-white px-3 py-[8px] text-[12px]">Cancel</button>
        <button type="submit" disabled={pending} className="rounded-md bg-coral px-3 py-[8px] text-[12px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Service log                                                                 */
/* -------------------------------------------------------------------------- */

function ServiceLogSection({
  properties,
  serviceLogByProperty,
  onChanged,
}: {
  properties: PropertyMgmt[];
  serviceLogByProperty: Record<string, ServiceLogEntry[]>;
  onChanged: () => void;
}) {
  return (
    <section className={sectionClass}>
      <SectionHeader title="Service log" subtitle="Recorded as work happens. Unbilled entries roll into next month's invoice." />
      {properties.length === 0 ? (
        <p className="text-[13px] text-muted">Add a property first.</p>
      ) : (
        <div className="space-y-6">
          {properties.map((p) => (
            <PropertyServiceLog
              key={p.id}
              property={p}
              entries={serviceLogByProperty[p.id] ?? []}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PropertyServiceLog({
  property,
  entries,
  onChanged,
}: {
  property: PropertyMgmt;
  entries: ServiceLogEntry[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[14px] font-medium">{property.address}</div>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral">
          {showForm ? "Cancel" : "Add entry"}
        </button>
      </div>
      {showForm && (
        <ServiceLogForm
          propertyId={property.id}
          onSaved={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}
      {entries.length === 0 ? (
        <p className="text-[12px] text-muted">No entries yet.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="border-b border-border py-2 text-left">Date</th>
              <th className="border-b border-border py-2 text-left">Service</th>
              <th className="border-b border-border py-2 text-left">Vendor</th>
              <th className="border-b border-border py-2 text-left">Description</th>
              <th className="border-b border-border py-2 text-right">Amount</th>
              <th className="border-b border-border py-2 text-left">Status</th>
              <th className="border-b border-border py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-[#FAF9F6]">
                <td className="py-2 text-muted">{fmtDate(e.performed_at)}</td>
                <td className="py-2">{SERVICE_KIND_LABEL[e.service_kind] ?? e.service_kind}</td>
                <td className="py-2 text-muted">{e.vendor ?? "—"}</td>
                <td className="py-2">{e.description}</td>
                <td className="py-2 text-right">{fmtCents(e.amount_cents)}</td>
                <td className="py-2">
                  {e.tenant_chargeback ? (
                    <span className="rounded-full bg-[#EEE8FF] px-2 py-0.5 text-[10px] font-semibold text-[#5E3ABF]">Tenant chargeback</span>
                  ) : e.billed_at ? (
                    <span className="rounded-full bg-[#E6F6EC] px-2 py-0.5 text-[10px] font-semibold text-[#1F7A40]">Billed</span>
                  ) : (
                    <span className="rounded-full bg-[#FFF8E0] px-2 py-0.5 text-[10px] font-semibold text-[#8B6A00]">Pending</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  {!e.billed_at && (
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this entry?")) return;
                        await fetch(`/api/admin/service-log/${e.id}`, { method: "DELETE" });
                        onChanged();
                      }}
                      className="text-[11px] text-muted hover:text-[#A31F1F]"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ServiceLogForm({ propertyId, onSaved }: { propertyId: string; onSaved: () => void }) {
  const [serviceKind, setServiceKind] = useState("landscaping");
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [tenantChargeback, setTenantChargeback] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/service-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          service_kind: serviceKind,
          performed_at: performedAt,
          vendor: vendor.trim() || undefined,
          description: description.trim(),
          amount_dollars: parseFloat(amountDollars || "0"),
          tenant_chargeback: tenantChargeback,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setVendor("");
      setDescription("");
      setAmountDollars("");
      setTenantChargeback(false);
      onSaved();
    });
  }
  return (
    <form onSubmit={submit} className="mb-3 grid grid-cols-1 gap-3 rounded-md border border-border bg-[#FAF9F6] p-3 md:grid-cols-[auto_auto_1fr_2fr_auto_auto_auto]">
      <Field label="Service">
        <select value={serviceKind} onChange={(e) => setServiceKind(e.target.value)} className={`${inputClass} w-[150px]`}>
          {Object.entries(SERVICE_KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </Field>
      <Field label="Date"><input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} className={`${inputClass} w-[150px]`} /></Field>
      <Field label="Vendor"><input value={vendor} onChange={(e) => setVendor(e.target.value)} className={inputClass} placeholder="optional" /></Field>
      <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} required className={inputClass} placeholder="What was done" /></Field>
      <Field label="Amount ($)"><input type="number" step="0.01" value={amountDollars} onChange={(e) => setAmountDollars(e.target.value)} required className={`${inputClass} w-[110px]`} /></Field>
      <label className="flex items-end gap-1 text-[12px] text-muted">
        <input type="checkbox" checked={tenantChargeback} onChange={(e) => setTenantChargeback(e.target.checked)} />
        <span>Tenant chargeback</span>
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="rounded-md bg-coral px-3 py-[8px] text-[12px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-60">{pending ? "…" : "Add"}</button>
      </div>
      {error && <div className="md:col-span-7 text-[12px] text-[#A31F1F]">{error}</div>}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Documents                                                                   */
/* -------------------------------------------------------------------------- */

function DocumentsSection({
  landlordId,
  properties,
  documents,
  onChanged,
}: {
  landlordId: string;
  properties: PropertyMgmt[];
  documents: LandlordDocument[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  return (
    <section className={sectionClass}>
      <SectionHeader
        title="Documents"
        subtitle="PMA, leases, inspections — landlord can view + download"
        right={
          <button onClick={() => setShowForm((v) => !v)} className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral">
            {showForm ? "Cancel" : "Upload"}
          </button>
        }
      />
      {showForm && (
        <DocumentUploadForm
          landlordId={landlordId}
          properties={properties}
          onSaved={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}
      {documents.length === 0 ? (
        <p className="text-[13px] text-muted">No documents uploaded.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-[#FAF9F6] p-3">
              <div>
                <div className="text-[14px]">
                  <a href={d.blob_url} target="_blank" rel="noopener" className="font-medium hover:text-coral">{d.title}</a>
                  <span className="ml-2 rounded-full bg-[#EEE8FF] px-2 py-0.5 text-[10px] font-semibold text-[#5E3ABF]">{DOC_KIND_LABEL[d.kind] ?? d.kind}</span>
                </div>
                <div className="text-[12px] text-muted">
                  Uploaded {fmtDate(d.uploaded_at)} · {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : ""}
                  {d.property_id && properties.find((p) => p.id === d.property_id) ? ` · ${properties.find((p) => p.id === d.property_id)!.address}` : " · Landlord-level"}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm("Delete document?")) return;
                  await fetch(`/api/admin/documents/${d.id}`, { method: "DELETE" });
                  onChanged();
                }}
                className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-[#A31F1F] hover:text-[#A31F1F]"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DocumentUploadForm({ landlordId, properties, onSaved }: { landlordId: string; properties: PropertyMgmt[]; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<keyof typeof DOC_KIND_LABEL>("pma");
  const [propertyId, setPropertyId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Pick a file first");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      if (title) fd.append("title", title);
      if (propertyId) fd.append("property_id", propertyId);
      const res = await fetch(`/api/admin/landlords/${landlordId}/documents`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={submit} className="mb-3 grid grid-cols-1 gap-3 rounded-md border border-border bg-[#FAF9F6] p-3 md:grid-cols-[auto_2fr_auto_auto_auto]">
      <Field label="Type">
        <select value={kind} onChange={(e) => setKind(e.target.value as keyof typeof DOC_KIND_LABEL)} className={`${inputClass} w-[140px]`}>
          {Object.entries(DOC_KIND_LABEL).map(([k, label]) => (<option key={k} value={k}>{label}</option>))}
        </select>
      </Field>
      <Field label="Title (optional)"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Falls back to filename" /></Field>
      <Field label="Property">
        <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={`${inputClass} w-[180px]`}>
          <option value="">— Landlord-level —</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
        </select>
      </Field>
      <Field label="File"><input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="text-[13px]" /></Field>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="rounded-md bg-coral px-3 py-[8px] text-[12px] font-medium text-white hover:bg-[#d4574a] disabled:opacity-60">{pending ? "Uploading…" : "Upload"}</button>
      </div>
      {error && <div className="md:col-span-5 text-[12px] text-[#A31F1F]">{error}</div>}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */

function InvoicesSection({
  landlordId,
  invoices,
  onChanged,
}: {
  landlordId: string;
  invoices: LandlordInvoice[];
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function generate() {
    setResult(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/landlords/${landlordId}/generate-invoice`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult(`Failed: ${data.error ?? "unknown"}`);
        return;
      }
      setResult(`Generated ${data.created ?? 0} invoice(s). ${data.skipped ?? 0} skipped (no unbilled work).`);
      onChanged();
    });
  }

  return (
    <section className={sectionClass}>
      <SectionHeader
        title="Invoices"
        subtitle="One per property per month. Cron runs the 1st; manual button generates last month now."
        right={
          <button onClick={generate} disabled={pending} className="rounded-md border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral disabled:opacity-60">
            {pending ? "Generating…" : "Generate now"}
          </button>
        }
      />
      {result && <Banner kind={result.startsWith("Failed") ? "error" : "success"}>{result}</Banner>}
      {invoices.length === 0 ? (
        <p className="text-[13px] text-muted">No invoices yet.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="border-b border-border py-2 text-left">Period</th>
              <th className="border-b border-border py-2 text-right">Amount</th>
              <th className="border-b border-border py-2 text-left">Status</th>
              <th className="border-b border-border py-2 text-left">Stripe</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="border-b border-border py-2">
                  {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                </td>
                <td className="border-b border-border py-2 text-right">{fmtCents(inv.amount_cents)}</td>
                <td className="border-b border-border py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    inv.status === "paid" ? "bg-[#E6F6EC] text-[#1F7A40]"
                    : inv.status === "open" ? "bg-[#E6F0FF] text-[#1F4FB8]"
                    : inv.status === "failed" ? "bg-[#FDE2E2] text-[#A31F1F]"
                    : "bg-[#F4F3EE] text-[#555]"
                  }`}>{inv.status}</span>
                  {inv.error && <span className="ml-2 text-[11px] text-[#A31F1F]">{inv.error}</span>}
                </td>
                <td className="border-b border-border py-2">
                  {inv.hosted_invoice_url ? (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noopener" className="text-[12px] text-coral hover:underline">View</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Resend invite                                                               */
/* -------------------------------------------------------------------------- */

function ResendInviteButton({ landlordId, onResult }: { landlordId: string; onResult: (ok: boolean, msg?: string) => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("Re-send the magic-link invite to this landlord?")) return;
        startTransition(async () => {
          const res = await fetch(`/api/admin/landlords/${landlordId}/invite-resend`, { method: "POST" });
          const data = await res.json();
          onResult(res.ok, data.error);
        });
      }}
      disabled={pending}
      className="rounded-md border border-border bg-white px-4 py-[8px] text-[13px] hover:border-coral hover:text-coral disabled:opacity-60"
    >
      {pending ? "Sending…" : "Resend invite"}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Tiny shared bits                                                            */
/* -------------------------------------------------------------------------- */

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-[20px] font-medium tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

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

function Banner({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={`mb-4 rounded-md p-3 text-[13px] ${
        kind === "error"
          ? "border border-[#F5C2C2] bg-[#FDE2E2] text-[#A31F1F]"
          : "border border-[#C2EAD2] bg-[#E6F6EC] text-[#1F7A40]"
      }`}
    >
      {children}
    </div>
  );
}
