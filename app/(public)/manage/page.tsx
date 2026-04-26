import Link from "next/link";

const included = [
  "Tenant screening & placement",
  "Lease drafting & renewals",
  "Rent collection & owner statements",
  "Maintenance coordination",
  "Move-in & move-out inspections",
  "Year-end giving summary for your records",
];

export default function ManagePage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Property management
          </span>
          <h1 className="mb-5 max-w-[760px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Manage your rental.{" "}
            <em className="text-coral">Fund a cause every month.</em>
          </h1>
          <p className="max-w-[580px] text-[17px] font-light leading-[1.8] text-muted">
            Full-service property management in Arizona. We handle tenants, leases, and maintenance — and donate 25% of every monthly management fee to a charity you choose. At no extra cost.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* What's included */}
      <div className="bg-pampas px-8 py-16">
        <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-3 inline-block text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
              What&apos;s included
            </span>
            <h2 className="mb-5 font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.15] tracking-[-0.02em]">
              Full-service management. None of the headaches.
            </h2>
            <p className="text-[15px] font-light leading-[1.8] text-muted">
              Givenest handles the day-to-day so you can stay hands-off. Every month you get a clean owner statement and a record of the donation made on your behalf.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 self-center">
            {included.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-[10px] border border-border bg-white p-4 text-[14px] font-light leading-[1.6] text-black"
              >
                <span className="mt-[2px] text-coral">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Owner dashboard */}
      <section className="bg-white px-8 py-16">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Owner dashboard
          </span>
          <h2 className="mb-3 max-w-[760px] font-serif text-[clamp(26px,3.5vw,38px)] font-medium leading-[1.15] tracking-[-0.02em]">
            Track everything in real time.{" "}
            <em className="text-coral">All in one place.</em>
          </h2>
          <p className="mb-10 max-w-[640px] text-[15px] font-light leading-[1.8] text-muted">
            Log in any time to see exactly what&apos;s happening with your property. Invoices, documents, and payments all live in your owner dashboard — no inbox digging, no spreadsheets.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[10px] border border-border bg-white p-6">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
                Invoices
              </div>
              <div className="mb-2 font-serif text-[18px] font-medium">
                Every charge, itemized
              </div>
              <p className="text-[14px] font-light leading-[1.7] text-muted">
                Management fees, repair bills, and vendor invoices — dated, categorized, and downloadable any time.
              </p>
            </div>
            <div className="rounded-[10px] border border-border bg-white p-6">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
                Documents
              </div>
              <div className="mb-2 font-serif text-[18px] font-medium">
                Leases & paperwork, organized
              </div>
              <p className="text-[14px] font-light leading-[1.7] text-muted">
                Leases, addenda, inspection reports, and end-of-year tax forms — filed by tenant and year so you always know where to look.
              </p>
            </div>
            <div className="rounded-[10px] border border-border bg-white p-6">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
                Payments
              </div>
              <div className="mb-2 font-serif text-[18px] font-medium">
                Manage payments end-to-end
              </div>
              <p className="text-[14px] font-light leading-[1.7] text-muted">
                Tenant rent in, owner deposits out, charity donations tracked — every transaction visible and reconciled monthly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-black px-8 py-16 text-center">
        <div className="mx-auto max-w-[600px]">
          <h2 className="mb-4 font-serif text-[clamp(24px,3vw,36px)] font-medium text-white tracking-[-0.02em]">
            Ready to manage with purpose?
          </h2>
          <p className="mb-8 text-[15px] font-light leading-[1.8] text-white/60">
            Tell us about your property and we&apos;ll be in touch — usually within one business day.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact?topic=manage"
              className="rounded-md bg-coral px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Talk to us →
            </Link>
            <Link
              href="/giving"
              className="rounded-md border border-white/20 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/40"
            >
              See how giving works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
