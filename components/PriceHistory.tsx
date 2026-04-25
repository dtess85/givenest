"use client";

import { useEffect, useState } from "react";
import type { HistoryCycle, HistoryEvent } from "@/lib/spark-history";
import type { ValuationYear } from "@/lib/maricopa";

/**
 * Two related blocks for the property detail page:
 *   - <PriceDropAlert>  — coral-tag callout shown when the current cycle has
 *                         a recent ListPrice reduction.
 *   - <SaleHistoryTable> — Redfin-style timeline grouped by ARMLS#, fed by
 *                         `/api/listings/[key]/history`.
 *
 * Both are client components for two reasons: (a) the parent
 * `app/(public)/buy/[address]/page.tsx` is already `"use client"` so we can
 * compose without splitting the page, and (b) the history fetch is slow
 * enough (one extra Spark round-trip per prior cycle) that we don't want it
 * blocking the initial paint — the table appears after the rest of the
 * page has rendered.
 */

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return usd0.format(n);
}

/** "$275K" / "$1.3M" — used in the price-drop callout where we don't have
 *  room for a full price string. */
function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m >= 10 ? m.toFixed(1) : m.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return usd0.format(n);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtPricePerSqft(price: number | null, sqft: number | undefined): string | null {
  if (price == null || !sqft || sqft <= 0) return null;
  const n = Math.round(price / sqft);
  return `$${n.toLocaleString()}/sq ft`;
}

/* -------------------------------------------------------------------------- */
/* Price drop alert                                                           */
/* -------------------------------------------------------------------------- */

export function PriceChangeAlert({
  listingSlug,
  currentPrice,
}: {
  listingSlug: string;
  currentPrice: number;
}) {
  const [change, setChange] = useState<{
    direction: "drop" | "increase";
    amount: number;
    date: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Spark masks `PreviousListPrice` on most ARMLS-replicated listings, so
    // the only reliable source for the change amount is the listing's history
    // endpoint — find the most recent ListPrice change in the current cycle.
    fetch(`/api/listings/${listingSlug}/history`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cycles: HistoryCycle[] } | null) => {
        if (cancelled || !d) return;
        // Most-recent cycle = first in the array (sorted newest-first by the
        // API). "Price Changed" events are also newest-first within a cycle.
        const cycle = d.cycles?.[0];
        const lastChange = cycle?.events.find(
          (e) => e.event === "Price Changed" && e.previousPrice
        );
        if (!lastChange?.previousPrice) return;

        // Cap visibility to 10 days. Past that, the change is no longer "news"
        // — the sale-history table below still shows it for context, but the
        // banner stops nagging buyers about a months-old change.
        const VISIBLE_FOR_MS = 10 * 24 * 60 * 60 * 1000;
        const ageMs = Date.now() - new Date(lastChange.date).getTime();
        if (ageMs > VISIBLE_FOR_MS) return;

        if (lastChange.previousPrice > currentPrice) {
          setChange({
            direction: "drop",
            amount: lastChange.previousPrice - currentPrice,
            date: lastChange.date,
          });
        } else if (lastChange.previousPrice < currentPrice) {
          setChange({
            direction: "increase",
            amount: currentPrice - lastChange.previousPrice,
            date: lastChange.date,
          });
        }
      })
      .catch(() => {
        /* silent — banner just won't render */
      });
    return () => {
      cancelled = true;
    };
  }, [listingSlug, currentPrice]);

  if (!change) return null;
  const amountLabel = fmtCompact(change.amount);
  const isDrop = change.direction === "drop";

  return (
    <div className="rounded-[12px] border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        <PriceTagIcon direction={change.direction} />
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-foreground">
            {isDrop ? "Price drop" : "Price increase"}
          </div>
          <p className="mt-0.5 text-[14px] text-foreground/80">
            {isDrop
              ? `List price was lowered by ${amountLabel}. Tour it before it's gone!`
              : `List price was raised by ${amountLabel}.`}
          </p>
          <p className="mt-3 text-[13px] text-muted">{fmtDate(change.date)}</p>
        </div>
      </div>
    </div>
  );
}

/** Backwards-compat alias — kept so any older imports keep resolving. New
 *  callers should prefer `PriceChangeAlert`. */
export const PriceDropAlert = PriceChangeAlert;

/** Inline SVG to avoid a runtime icon dependency. The triangle inside the
 *  tag is coral on a drop (matches the brand) and amber on an increase
 *  (informational, signals "less buyer-favorable" without alarming). */
function PriceTagIcon({ direction }: { direction: "drop" | "increase" }) {
  const triangleFill = direction === "drop" ? "#E85A4F" : "#D89F2E";
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path
        d="M9 24 L24 9 L37 9 L37 22 L22 37 Z"
        stroke="#1F1F1F"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="16" r="2.4" stroke="#1F1F1F" strokeWidth="1.5" />
      <path
        d={direction === "drop" ? "M14 28 L26 28 L20 35 Z" : "M14 35 L26 35 L20 28 Z"}
        fill={triangleFill}
      />
      {/* Sparkle marks above the tag */}
      <path d="M24 4 L24 8 M27 5 L25 7 M21 5 L23 7" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Sale history table                                                         */
/* -------------------------------------------------------------------------- */

type Tab = "sale" | "tax";

export function SaleHistoryTable({
  listingSlug,
  sqft,
}: {
  listingSlug: string;
  /** Optional — if known, we render $/sq ft below each price. */
  sqft?: number;
}) {
  const [cycles, setCycles] = useState<HistoryCycle[] | null>(null);
  const [taxHistory, setTaxHistory] = useState<ValuationYear[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("sale");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/listings/${listingSlug}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { cycles: HistoryCycle[]; taxHistory?: ValuationYear[] }) => {
        if (cancelled) return;
        setCycles(d.cycles ?? []);
        setTaxHistory(d.taxHistory ?? []);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [listingSlug]);

  return (
    <section className="rounded-[12px] border border-border bg-white p-6">
      <h3 className="mb-4 font-serif text-[20px] font-medium tracking-[-0.01em] text-foreground">
        Sales history
      </h3>

      {/* Tab row */}
      <div className="mb-3 flex items-center gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("sale")}
          className={`-mb-px pb-2 text-[14px] transition-colors ${
            tab === "sale"
              ? "border-b-2 border-foreground font-semibold text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Sale History
        </button>
        <button
          type="button"
          onClick={() => setTab("tax")}
          className={`-mb-px pb-2 text-[14px] transition-colors ${
            tab === "tax"
              ? "border-b-2 border-foreground font-semibold text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Tax History
        </button>
      </div>

      {error && (
        <p className="py-4 text-[13px] text-muted">
          Couldn&apos;t load history right now.
        </p>
      )}

      {!error && tab === "sale" && (
        <SaleHistoryPane cycles={cycles} sqft={sqft} />
      )}

      {!error && tab === "tax" && (
        <TaxHistoryPane taxHistory={taxHistory} />
      )}
    </section>
  );
}

function SaleHistoryPane({
  cycles,
  sqft,
}: {
  cycles: HistoryCycle[] | null;
  sqft?: number;
}) {
  if (cycles === null) {
    return <p className="py-4 text-[13px] text-muted">Loading sale history…</p>;
  }
  if (cycles.length === 0) {
    return (
      <p className="py-4 text-[13px] text-muted">
        No sale history available for this address.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_1.2fr_auto] text-[14px]">
      <div className="border-b border-border pb-2 pr-4 font-semibold text-foreground">Date</div>
      <div className="border-b border-border pb-2 pr-4 font-semibold text-foreground">Event</div>
      <div className="border-b border-border pb-2 text-right font-semibold text-foreground">Price</div>

      {cycles.map((c) => (
        <CycleRows key={c.sparkKey} cycle={c} sqft={sqft} />
      ))}
    </div>
  );
}

function TaxHistoryPane({ taxHistory }: { taxHistory: ValuationYear[] | null }) {
  if (taxHistory === null) {
    return <p className="py-4 text-[13px] text-muted">Loading tax history…</p>;
  }
  if (taxHistory.length === 0) {
    return (
      <p className="py-4 text-[13px] text-muted">
        No tax history available. Tax records come from the Maricopa County
        Assessor — listings outside Maricopa County (Pinal, Pima, Yavapai) won&apos;t
        have data here yet.
      </p>
    );
  }

  // Hide the Tax column entirely when no row publishes one — saves a column
  // of dashes for parcels where the assessor doesn't expose annual amounts.
  const showTaxAmount = taxHistory.some((v) => v.taxAmount != null);

  return (
    <div
      className={`grid text-[14px] ${
        showTaxAmount
          ? "grid-cols-[auto_1fr_1fr_auto]"
          : "grid-cols-[auto_1fr_1fr]"
      }`}
    >
      <div className="border-b border-border pb-2 pr-4 font-semibold text-foreground">Year</div>
      <div className="border-b border-border pb-2 pr-4 text-right font-semibold text-foreground">Assessed value</div>
      <div className="border-b border-border pb-2 pr-4 text-right font-semibold text-foreground">Limited value</div>
      {showTaxAmount && (
        <div className="border-b border-border pb-2 text-right font-semibold text-foreground">Tax</div>
      )}

      {taxHistory.map((v) => (
        <ValuationRow key={v.year} valuation={v} showTaxAmount={showTaxAmount} />
      ))}
    </div>
  );
}

function ValuationRow({
  valuation,
  showTaxAmount,
}: {
  valuation: ValuationYear;
  showTaxAmount: boolean;
}) {
  return (
    <>
      <div className="border-b border-border py-3 pr-4 text-foreground/90">
        {valuation.year}
      </div>
      <div className="border-b border-border py-3 pr-4 text-right text-foreground">
        {valuation.assessedValue == null ? "—" : fmtPrice(valuation.assessedValue)}
      </div>
      <div className="border-b border-border py-3 pr-4 text-right text-foreground/90">
        {valuation.limitedValue == null ? "—" : fmtPrice(valuation.limitedValue)}
      </div>
      {showTaxAmount && (
        <div className="border-b border-border py-3 text-right text-foreground/90">
          {valuation.taxAmount == null ? "—" : fmtPrice(valuation.taxAmount)}
        </div>
      )}
    </>
  );
}

function CycleRows({ cycle, sqft }: { cycle: HistoryCycle; sqft?: number }) {
  return (
    <>
      {/* MLS# group banner spans all three columns. */}
      <div className="col-span-3 mt-2 bg-[#FAF9F6] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        ARMLS #{cycle.mlsNumber}
      </div>
      {cycle.events.map((e, i) => (
        <EventRow key={`${cycle.sparkKey}-${i}`} event={e} sqft={sqft} />
      ))}
    </>
  );
}

function EventRow({ event, sqft }: { event: HistoryEvent; sqft?: number }) {
  const ppsf = fmtPricePerSqft(event.price, sqft);
  return (
    <>
      <div className="border-b border-border py-3 pr-4 text-foreground/90">
        {fmtDate(event.date)}
      </div>
      <div className="border-b border-border py-3 pr-4 text-foreground/90">
        {event.event}
      </div>
      <div className="border-b border-border py-3 text-right text-foreground">
        <div>{event.price == null ? "—" : fmtPrice(event.price)}</div>
        {ppsf && <div className="text-[12px] text-muted">{ppsf}</div>}
      </div>
    </>
  );
}
