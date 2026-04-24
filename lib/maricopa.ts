/**
 * Maricopa County Assessor API client.
 *
 * Public API documented at:
 *   https://www.mcassessor.maricopa.gov/file/home/MC-Assessor-API-Documentation.pdf
 *
 * Auth: a custom `AUTHORIZATION: <token>` header (no "Bearer" prefix). The
 * docs also say to set `User-Agent: null`. Tokens are issued by emailing the
 * MCA web team via the contact form on https://preview.mcassessor.maricopa.gov/contact/
 * with subject "API Token/Question".
 *
 * Coverage: Maricopa County only. ~70% of our AZ listings (Phoenix metro,
 * Scottsdale, Paradise Valley, Gilbert, Mesa, Chandler, Tempe, Cave Creek).
 * Pinal/Pima/Yavapai listings will get null back and the UI should hide the
 * Tax History tab content gracefully.
 */

const BASE = "https://mcassessor.maricopa.gov";
const TOKEN = process.env.MARICOPA_API_TOKEN;

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

export interface ValuationYear {
  /** Tax year, e.g. 2025. */
  year: number;
  /** Total assessed value in dollars (sum of land + improvements / "full
   *  cash value"). May be null if the assessor row is missing the field. */
  assessedValue: number | null;
  /** "Limited Property Value" — the basis Arizona uses for taxation under
   *  Prop 117. Capped at 5% growth per year. Null when not published. */
  limitedValue: number | null;
  /** Annual property tax in dollars, when published. The MCA endpoint
   *  doesn't always include this — we surface it when present and hide the
   *  column when not. */
  taxAmount: number | null;
}

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function maricopaHeaders(): HeadersInit {
  if (!TOKEN) throw new Error("MARICOPA_API_TOKEN is not set");
  return {
    AUTHORIZATION: TOKEN,
    Accept: "application/json",
    // Per MCA docs, set user-agent to null. Node's fetch sends a default UA;
    // we override with empty string which produces no UA header on the wire.
    "User-Agent": "",
  };
}

/** APNs are accepted with or without dashes per the docs ("169-39-018" or
 *  "16939018"). We strip dashes/dots/spaces to be safe — some downstream
 *  APIs don't handle the punctuation cleanly. */
function normalizeApn(apn: string): string {
  return apn.replace(/[-.\s]/g, "");
}

/** Coerce assorted assessor field shapes to a number. The MCA payload uses
 *  numbers in some places and stringified currency ("$1,234,567") in others;
 *  we accept both and return null for any value we can't parse. */
function toMoney(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,]/g, "").trim();
    if (!cleaned || cleaned === "-") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toYear(v: unknown): number | null {
  if (typeof v === "number" && v >= 1900 && v <= 2200) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1900 && n <= 2200) return n;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fetch up to 5 years of valuation data for an APN. Returns an empty array
 * (rather than throwing) for any failure mode — missing token, parcel not
 * found, transient error — so the property page degrades to "no tax data"
 * instead of breaking.
 *
 * The MCA `/parcel/{apn}/valuations` endpoint's exact JSON shape isn't fixed
 * across deployments; this parser handles three common shapes:
 *   1. `[{ TaxYear, FullCashValue, LimitedPropertyValue }, …]`
 *   2. `{ Valuations: [...] }`
 *   3. `{ "2025": { …yearly fields }, "2024": …}`
 *
 * Newer keys (snake_case, lowercase) are also tolerated.
 */
export async function getMaricopaValuations(
  apn: string
): Promise<ValuationYear[]> {
  if (!TOKEN) return [];
  if (!apn) return [];

  const normalizedApn = normalizeApn(apn);
  const url = `${BASE}/parcel/${normalizedApn}/valuations`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: maricopaHeaders(),
      next: { revalidate: 86_400 }, // tax data updates yearly — 24h cache is plenty
    });
  } catch (err) {
    console.error("[maricopa] fetch failed:", err);
    return [];
  }
  if (!res.ok) return [];

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }

  // Pull the array of yearly records out of whichever shape we got back.
  let rows: unknown[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.Valuations)) {
      rows = obj.Valuations as unknown[];
    } else if (Array.isArray(obj.valuations)) {
      rows = obj.valuations as unknown[];
    } else {
      // Year-keyed object: { "2025": { …fields }, "2024": …}
      const yearKeys = Object.keys(obj).filter((k) => /^\d{4}$/.test(k));
      if (yearKeys.length > 0) {
        rows = yearKeys.map((y) => ({ TaxYear: y, ...(obj[y] as object) }));
      }
    }
  }

  const years: ValuationYear[] = rows
    .map((raw) => {
      const r = raw as Record<string, unknown>;
      const year =
        toYear(r.TaxYear) ??
        toYear(r.tax_year) ??
        toYear(r.Year) ??
        toYear(r.year);
      if (year == null) return null;
      const assessedValue =
        toMoney(r.FullCashValue) ??
        toMoney(r.full_cash_value) ??
        toMoney(r.AssessedValue) ??
        toMoney(r.assessed_value) ??
        null;
      const limitedValue =
        toMoney(r.LimitedPropertyValue) ??
        toMoney(r.limited_property_value) ??
        toMoney(r.LimitedValue) ??
        toMoney(r.limited_value) ??
        null;
      const taxAmount =
        toMoney(r.TaxAmount) ??
        toMoney(r.tax_amount) ??
        toMoney(r.AnnualTax) ??
        toMoney(r.Taxes) ??
        null;
      return { year, assessedValue, limitedValue, taxAmount };
    })
    .filter((v): v is ValuationYear => v !== null)
    .sort((a, b) => b.year - a.year); // newest first

  return years;
}
