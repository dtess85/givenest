import { pool } from "./index";

export interface ListingIndexRow {
  id: string;
  spark_listing_key: string;
  mls_number: string | null;
  address: string;
  street_number: string | null;
  street_name: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  neighborhood: string | null;
  status: string | null;
  mls_status: string | null;
  modified_at: string | null;
  synced_at: string;
}

export interface ListingUpsertData {
  spark_listing_key: string;
  mls_number?: string | null;
  address: string;
  street_number?: string | null;
  street_name?: string | null;
  city?: string | null;
  state?: string;
  zip?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  neighborhood?: string | null;
  status?: string | null;
  mls_status?: string | null;
  modified_at?: string | null;
}

const COLS = 16; // number of columns per row

/**
 * Batch upsert listings by spark_listing_key.
 * Processes in chunks of 500 rows → single INSERT per chunk for speed.
 * 40k rows ≈ 80 queries instead of 40,000.
 */
export async function upsertListings(listings: ListingUpsertData[]): Promise<void> {
  if (listings.length === 0) return;

  const CHUNK = 500;
  for (let offset = 0; offset < listings.length; offset += CHUNK) {
    const chunk = listings.slice(offset, offset + CHUNK);

    // Build: ($1,$2,...,$16),($17,$18,...,$32),...
    const valuePlaceholders = chunk
      .map((_, i) => {
        const base = i * COLS;
        const params = Array.from({ length: COLS }, (__, j) => `$${base + j + 1}`).join(",");
        return `(${params})`;
      })
      .join(",");

    const values: unknown[] = [];
    for (const l of chunk) {
      values.push(
        l.spark_listing_key,
        l.mls_number ?? null,
        l.address,
        l.street_number ?? null,
        l.street_name ?? null,
        l.city ?? null,
        l.state ?? "AZ",
        l.zip ?? null,
        l.price ?? null,
        l.beds ?? null,
        l.baths ?? null,
        l.neighborhood ?? null,
        l.status ?? null,
        l.mls_status ?? null,
        l.modified_at ?? null,
        new Date().toISOString() // synced_at
      );
    }

    const text = `
      INSERT INTO listings (
        spark_listing_key, mls_number, address, street_number, street_name,
        city, state, zip, price, beds, baths, neighborhood, status, mls_status,
        modified_at, synced_at
      ) VALUES ${valuePlaceholders}
      ON CONFLICT (spark_listing_key) DO UPDATE SET
        mls_number    = EXCLUDED.mls_number,
        address       = EXCLUDED.address,
        street_number = EXCLUDED.street_number,
        street_name   = EXCLUDED.street_name,
        city          = EXCLUDED.city,
        state         = EXCLUDED.state,
        zip           = EXCLUDED.zip,
        price         = EXCLUDED.price,
        beds          = EXCLUDED.beds,
        baths         = EXCLUDED.baths,
        neighborhood  = EXCLUDED.neighborhood,
        status        = EXCLUDED.status,
        mls_status    = EXCLUDED.mls_status,
        modified_at   = EXCLUDED.modified_at,
        synced_at     = EXCLUDED.synced_at
    `;

    await pool.query(text, values);
  }
}

/** Lightweight search result — just enough for the address-search dropdown */
export interface ListingSearchResult {
  slug: string;       // = spark_listing_key (used in /buy/[slug] URLs)
  address: string;
  city: string;
  price: number;
  neighborhood: string | undefined;
}

/**
 * Search the listings index. Returns up to `limit` results sorted by relevance.
 * Three modes:
 *  - MLS number (5–8 digits)
 *  - "123 Main" street number + name
 *  - General: address / neighborhood / city / zip trigram search
 */
export async function searchListings(
  query: string,
  limit = 8
): Promise<{ results: ListingSearchResult[]; isMlsNumber: boolean; hasSubdivisionMatch: boolean }> {
  const q = query.trim();

  // ── MLS number ────────────────────────────────────────────────────────────
  const isMlsNumber = /^\d{5,8}$/.test(q);
  if (isMlsNumber) {
    const { rows } = await pool.query(
      `SELECT spark_listing_key, address, city, price, neighborhood
       FROM listings WHERE mls_number = $1 LIMIT $2`,
      [q, limit]
    );
    return { results: rows.map(rowToResult), isMlsNumber: true, hasSubdivisionMatch: false };
  }

  // ── "123 Main" — street number + name ────────────────────────────────────
  const numericPrefix = q.match(/^(\d+)\s+(.+)$/);
  if (numericPrefix) {
    const [, streetNum, streetNameRaw] = numericPrefix;
    const { rows } = await pool.query(
      `SELECT spark_listing_key, address, city, price, neighborhood
       FROM listings WHERE street_number = $1 AND street_name ILIKE $2
       ORDER BY price DESC LIMIT $3`,
      [streetNum, `%${streetNameRaw.trim()}%`, limit]
    );
    return { results: rows.map(rowToResult), isMlsNumber: false, hasSubdivisionMatch: false };
  }

  // ── General: trigram search on address, neighborhood, zip; exact on city ──
  const pattern = `%${q}%`;
  const { rows } = await pool.query(
    `SELECT spark_listing_key, address, city, price, neighborhood,
       CASE WHEN city ILIKE $1 THEN 3 WHEN neighborhood ILIKE $2 THEN 2 ELSE 1 END AS score
     FROM listings
     WHERE address ILIKE $2 OR neighborhood ILIKE $2 OR city ILIKE $1 OR zip = $1
     ORDER BY score DESC, price DESC LIMIT $3`,
    [q, pattern, limit]
  );

  const qUpper = q.toUpperCase();
  const hasSubdivisionMatch = rows.some(
    (r: { neighborhood: string | null }) =>
      r.neighborhood && r.neighborhood.toUpperCase().includes(qUpper)
  );

  return {
    results: rows.map(rowToResult),
    isMlsNumber: false,
    hasSubdivisionMatch,
  };
}

/** Count how many rows are in the listings index (used to detect empty table) */
export async function countListingsIndex(): Promise<number> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM listings");
  return rows[0]?.n ?? 0;
}

function rowToResult(r: {
  spark_listing_key: string;
  address: string;
  city: string | null;
  price: number | null;
  neighborhood: string | null;
}): ListingSearchResult {
  return {
    slug: r.spark_listing_key,
    address: r.address,
    city: r.city ?? "",
    price: Number(r.price ?? 0),
    neighborhood: r.neighborhood ?? undefined,
  };
}
