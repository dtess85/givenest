import { pool } from "./index";
import { generateShortId, makePublicSlug } from "../short-id";
import type { Property } from "../mock-data";

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
  agent_name: string | null;
  list_office_name: string | null;
  status: string | null;
  mls_status: string | null;
  modified_at: string | null;
  synced_at: string;
  /** Snapshot of the prior price taken whenever the synced price differs
   *  from the stored one. Drives the "Price drop" / "Price increase" badge
   *  on buy-page cards (within 10 days of `price_changed_at`). */
  previous_price: number | null;
  price_changed_at: string | null;
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
  agent_name?: string | null;
  list_office_name?: string | null;
  status?: string | null;
  mls_status?: string | null;
  modified_at?: string | null;
}

const COLS = 18; // number of columns per row

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
        l.agent_name ?? null,
        l.list_office_name ?? null,
        l.status ?? null,
        l.mls_status ?? null,
        l.modified_at ?? null,
        new Date().toISOString() // synced_at
      );
    }

    // On price change, snapshot the prior price + stamp price_changed_at
    // BEFORE overwriting the price column. The CASE expressions reference
    // listings.price (the OLD value pre-update) and EXCLUDED.price (the
    // incoming value); they only fire when both are non-null and different,
    // so first-time inserts and unchanged rows leave the snapshot fields as
    // they were.
    const text = `
      INSERT INTO listings (
        spark_listing_key, mls_number, address, street_number, street_name,
        city, state, zip, price, beds, baths, neighborhood, agent_name, list_office_name,
        status, mls_status, modified_at, synced_at
      ) VALUES ${valuePlaceholders}
      ON CONFLICT (spark_listing_key) DO UPDATE SET
        mls_number       = EXCLUDED.mls_number,
        address          = EXCLUDED.address,
        street_number    = EXCLUDED.street_number,
        street_name      = EXCLUDED.street_name,
        city             = EXCLUDED.city,
        state            = EXCLUDED.state,
        zip              = EXCLUDED.zip,
        previous_price   = CASE
                              WHEN listings.price IS NOT NULL
                                   AND EXCLUDED.price IS NOT NULL
                                   AND listings.price <> EXCLUDED.price
                              THEN listings.price
                              ELSE listings.previous_price
                            END,
        price_changed_at = CASE
                              WHEN listings.price IS NOT NULL
                                   AND EXCLUDED.price IS NOT NULL
                                   AND listings.price <> EXCLUDED.price
                              THEN NOW()
                              ELSE listings.price_changed_at
                            END,
        price            = EXCLUDED.price,
        beds             = EXCLUDED.beds,
        baths            = EXCLUDED.baths,
        neighborhood     = EXCLUDED.neighborhood,
        agent_name       = EXCLUDED.agent_name,
        list_office_name = EXCLUDED.list_office_name,
        status           = EXCLUDED.status,
        mls_status       = EXCLUDED.mls_status,
        modified_at      = EXCLUDED.modified_at,
        synced_at        = EXCLUDED.synced_at
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
): Promise<{ results: ListingSearchResult[]; isMlsNumber: boolean; hasSubdivisionMatch: boolean; hasAgentMatch: boolean; matchedAgentName: string | null }> {
  const q = query.trim();

  // ── MLS number ────────────────────────────────────────────────────────────
  const isMlsNumber = /^\d{5,8}$/.test(q);
  if (isMlsNumber) {
    const { rows } = await pool.query(
      `SELECT spark_listing_key, address, city, price, neighborhood
       FROM listings WHERE mls_number = $1 LIMIT $2`,
      [q, limit]
    );
    return { results: rows.map(rowToResult), isMlsNumber: true, hasSubdivisionMatch: false, hasAgentMatch: false, matchedAgentName: null };
  }

  // ── "123 Main" — street number + name ────────────────────────────────────
  // Handles optional directional prefix/suffix (E, W, N, S, NE, SW, …) and
  // street suffix ("Dr", "St", "Ave", …) so users can type the full address
  // the way it appears on Zillow/Redfin and still hit a match. The street_name
  // column stores only the bare name (e.g. "Clark"), so we strip everything
  // else from the query.
  const numericPrefix = q.match(/^(\d+)\s+(.+)$/);
  if (numericPrefix) {
    const [, streetNum, rest] = numericPrefix;
    const bareName = rest
      .trim()
      // Strip leading directional (E, W, N, S, NE, NW, SE, SW)
      .replace(/^(N|S|E|W|NE|NW|SE|SW)\s+/i, "")
      // Strip trailing directional
      .replace(/\s+(N|S|E|W|NE|NW|SE|SW)$/i, "")
      // Strip common street suffix so "Clark Drive" → "Clark"
      .replace(/\s+(St|Street|Ave|Avenue|Dr|Drive|Rd|Road|Blvd|Boulevard|Ln|Lane|Ct|Court|Pl|Place|Way|Cir|Circle|Pkwy|Parkway|Hwy|Highway|Trl|Trail|Pt|Point|Cv|Cove|Pass|Ter|Terrace|Sq|Square|Row|Loop|Run|Path|Xing|Crossing)$/i, "")
      .trim();

    const { rows } = await pool.query(
      `SELECT spark_listing_key, address, city, price, neighborhood
       FROM listings WHERE street_number = $1 AND street_name ILIKE $2
       ORDER BY price DESC LIMIT $3`,
      [streetNum, `%${bareName}%`, limit]
    );
    return { results: rows.map(rowToResult), isMlsNumber: false, hasSubdivisionMatch: false, hasAgentMatch: false, matchedAgentName: null };
  }

  // ── General: trigram search on address, neighborhood, zip, agent; exact on city ──
  // For agent_name, replace inter-word spaces with `%` so "teresa porpiglia"
  // matches "Teresa M Porpiglia" — middle initials shouldn't break the search.
  const pattern = `%${q}%`;
  const agentPattern = `%${q.split(/\s+/).filter(Boolean).join("%")}%`;
  const { rows } = await pool.query(
    `SELECT spark_listing_key, address, city, price, neighborhood, agent_name,
       CASE WHEN city ILIKE $1 THEN 4 WHEN neighborhood ILIKE $2 THEN 3 WHEN agent_name ILIKE $4 THEN 2 ELSE 1 END AS score
     FROM listings
     WHERE address ILIKE $2 OR neighborhood ILIKE $2 OR city ILIKE $1 OR zip = $1 OR agent_name ILIKE $4
     ORDER BY score DESC, price DESC LIMIT $3`,
    [q, pattern, limit, agentPattern]
  );

  const qUpper = q.toUpperCase();
  const hasSubdivisionMatch = rows.some(
    (r: { neighborhood: string | null }) =>
      r.neighborhood && r.neighborhood.toUpperCase().includes(qUpper)
  );

  // Same word-gap regex for the post-query agent check so "teresa porpiglia"
  // recognizes "Teresa M Porpiglia" as an agent match.
  const agentTokens = q.toUpperCase().split(/\s+/).filter(Boolean);
  const agentRegex = new RegExp(
    agentTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")
  );
  const agentRow = rows.find(
    (r: { agent_name: string | null }) =>
      r.agent_name && agentRegex.test(r.agent_name.toUpperCase())
  );
  const hasAgentMatch = !!agentRow && !hasSubdivisionMatch;
  const matchedAgentName: string | null = hasAgentMatch ? (agentRow as { agent_name: string }).agent_name : null;

  return {
    results: rows.map(rowToResult),
    isMlsNumber: false,
    hasSubdivisionMatch,
    hasAgentMatch,
    matchedAgentName,
  };
}

/**
 * Resolve the best-matching brokerage name for a user query. Sourced from the
 * `agents.office_name` column (the listings table's `list_office_name` is
 * still backfilling). Returns the most-populated office that ILIKE-matches
 * the query, or null if nothing matches.
 */
export async function findBrokerageMatch(q: string): Promise<string | null> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return null;
  const { rows } = await pool.query(
    `SELECT office_name
     FROM agents
     WHERE office_name ILIKE $1 AND office_name <> ''
     GROUP BY office_name
     ORDER BY COUNT(*) DESC
     LIMIT 1`,
    [`%${trimmed}%`]
  );
  return rows[0]?.office_name ?? null;
}

/**
 * Resolve a brokerage display name to the set of Spark office ids that share
 * it. SparkQL's `ListOfficeName Eq` is not filterable, so we thread office
 * ids — and one brand (e.g. "HomeSmart") can span dozens of franchise offices,
 * each with its own id.
 */
export async function getOfficeIdsByBrokerageName(
  officeName: string,
  limit = 50
): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT office_id
     FROM agents
     WHERE office_name = $1 AND office_id IS NOT NULL
     LIMIT $2`,
    [officeName, limit]
  );
  return rows.map((r: { office_id: string }) => r.office_id);
}

/** Count how many rows are in the listings index (used to detect empty table) */
export async function countListingsIndex(): Promise<number> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM listings");
  return rows[0]?.n ?? 0;
}

/**
 * Walk every row missing a short_id and assign one, retrying on the (very
 * rare) UNIQUE-index collision. Safe to re-run at any time; idempotent.
 * Returns the number of rows populated. Used by both the backfill script and
 * the sync cron for newly inserted listings.
 */
export async function assignMissingShortIds(batch = 500): Promise<number> {
  const { rows } = await pool.query(
    `SELECT id FROM listings WHERE short_id IS NULL LIMIT $1`,
    [batch]
  );
  let assigned = 0;
  for (const row of rows) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const shortId = generateShortId();
      try {
        const res = await pool.query(
          `UPDATE listings SET short_id = $1 WHERE id = $2 AND short_id IS NULL`,
          [shortId, row.id]
        );
        if ((res.rowCount ?? 0) > 0) assigned++;
        break;
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === "23505") continue; // unique_violation → retry with new id
        throw e;
      }
    }
  }
  return assigned;
}

/** Bulk map spark_listing_key → short_id for listings already in the index. */
export async function getShortIdsForSparkKeys(
  keys: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (keys.length === 0) return out;
  const { rows } = await pool.query(
    `SELECT spark_listing_key, short_id FROM listings
     WHERE short_id IS NOT NULL AND spark_listing_key = ANY($1)`,
    [keys]
  );
  for (const r of rows as { spark_listing_key: string; short_id: string }[]) {
    out.set(r.spark_listing_key, r.short_id);
  }
  return out;
}

/** Reverse-lookup a short_id to its spark_listing_key (for URL resolution). */
export async function getSparkKeyByShortId(shortId: string): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT spark_listing_key FROM listings WHERE short_id = $1 LIMIT 1`,
    [shortId]
  );
  return rows[0]?.spark_listing_key ?? null;
}

/**
 * Given a batch of Property objects fresh from Spark, rewrite each `slug` to
 * its short `gpid-XXXXXXXX` form (when the listing has been backfilled) and
 * stash the original Spark ListingKey on `sparkKey` for server-side callers.
 * Listings without a short_id in the index keep the raw Spark key as slug,
 * so existing links + callers still resolve.
 */
export async function enrichWithShortSlugs<T extends Property>(
  listings: T[]
): Promise<T[]> {
  if (listings.length === 0) return listings;
  // sparkKey defaults to the current slug if not already set by a caller.
  for (const l of listings) if (!l.sparkKey) l.sparkKey = l.slug;
  const keys = listings.map((l) => l.sparkKey!).filter(Boolean);
  const shortIdMap = await getShortIdsForSparkKeys(keys);
  for (const l of listings) {
    const sid = l.sparkKey ? shortIdMap.get(l.sparkKey) : undefined;
    if (sid) l.slug = makePublicSlug(sid);
  }
  return listings;
}

/**
 * Spark listing keys whose price changed within `days` days, optionally
 * narrowed to drops or increases only. Backs the /buy page "Price reduced"
 * filter — the caller hands the resulting keys to Spark via
 * `ListingKey In (...)` so pagination + sort are still done by Spark.
 *
 * Limit is generous (1000) so the filter doesn't silently drop results in
 * the rare event we have a huge wave of price changes; SparkQL `In` clauses
 * comfortably handle this many keys.
 */
export async function getKeysWithRecentPriceChange(
  opts: { direction?: "drop" | "increase" | "any"; days?: number; limit?: number } = {}
): Promise<string[]> {
  const direction = opts.direction ?? "any";
  const days = opts.days ?? 10;
  const limit = opts.limit ?? 1000;

  const conditions: string[] = [
    "price_changed_at IS NOT NULL",
    "price_changed_at >= NOW() - INTERVAL '1 day' * $1",
    "previous_price IS NOT NULL",
    "price IS NOT NULL",
  ];
  const values: unknown[] = [days];

  if (direction === "drop") conditions.push("price < previous_price");
  else if (direction === "increase") conditions.push("price > previous_price");

  values.push(limit);
  const { rows } = await pool.query(
    `SELECT spark_listing_key
       FROM listings
      WHERE ${conditions.join(" AND ")}
      ORDER BY price_changed_at DESC
      LIMIT $${values.length}`,
    values
  );
  return rows.map((r: { spark_listing_key: string }) => r.spark_listing_key);
}

/**
 * Bulk-fill `previousPrice` + `priceChangeAt` on a batch of Property objects
 * from our `listings` index. Spark masks `PreviousListPrice` for most ARMLS
 * listings, so the buy-page card needs our sync-derived snapshot to show
 * "Price drop" / "Price increase" badges. One query for the whole batch.
 *
 * Listings not in the index (manual listings, or stale before next sync)
 * are left untouched — caller logic should treat the absence of these
 * fields as "no recent change to advertise".
 */
export async function enrichWithPriceChanges<T extends Property>(
  listings: T[]
): Promise<T[]> {
  if (listings.length === 0) return listings;
  const keys = listings.map((l) => l.sparkKey ?? l.slug).filter(Boolean);
  if (keys.length === 0) return listings;

  const { rows } = await pool.query(
    `SELECT spark_listing_key, previous_price, price_changed_at
       FROM listings
      WHERE price_changed_at IS NOT NULL
        AND spark_listing_key = ANY($1)`,
    [keys]
  );

  const map = new Map<string, { previousPrice: number; priceChangeAt: string }>();
  for (const r of rows as {
    spark_listing_key: string;
    previous_price: string | number | null;
    price_changed_at: string | null;
  }[]) {
    if (r.previous_price == null || r.price_changed_at == null) continue;
    map.set(r.spark_listing_key, {
      previousPrice: Number(r.previous_price),
      priceChangeAt: r.price_changed_at,
    });
  }

  for (const l of listings) {
    const key = l.sparkKey ?? l.slug;
    const hit = map.get(key);
    if (hit) {
      l.previousPrice = hit.previousPrice;
      l.priceChangeAt = hit.priceChangeAt;
    }
  }
  return listings;
}

/**
 * Look up Spark listing keys for a given agent name, restricted to active
 * (on-market) listings. Spark's `ListAgentName` field is not searchable via
 * SparkQL, so we use our local listings index as a secondary lookup and then
 * filter Spark by the resulting keys.
 */
export async function getListingKeysByAgent(agentName: string, limit = 200): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT spark_listing_key
     FROM listings
     WHERE agent_name ILIKE $1
       AND (mls_status IS NULL
            OR mls_status IN ('Active', 'Active UCB', 'Coming Soon'))
     ORDER BY modified_at DESC NULLS LAST
     LIMIT $2`,
    [agentName, limit]
  );
  return rows.map((r: { spark_listing_key: string }) => r.spark_listing_key);
}

/**
 * Look up Spark listing keys whose neighborhood (SubdivisionName) contains the
 * given query — case-insensitive partial match. Spark's `SubdivisionName Eq`
 * filter is case-sensitive and exact, which misses real-world variants like
 * "STRATLAND ESTATES PHASE 1" vs "Stratland Estates". Resolving via our index
 * keeps the buy-page filter consistent with the autocomplete dropdown.
 *
 * No status filter — the downstream Spark query already enforces the correct
 * status, and the index's mls_status can be stale (e.g. listing went active
 * after the last sync), which would incorrectly drop valid keys.
 */
export async function getListingKeysBySubdivision(
  subdivision: string,
  limit = 500
): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT spark_listing_key
     FROM listings
     WHERE neighborhood ILIKE $1
     ORDER BY modified_at DESC NULLS LAST
     LIMIT $2`,
    [`%${subdivision}%`, limit]
  );
  return rows.map((r: { spark_listing_key: string }) => r.spark_listing_key);
}

// ── Agent helpers ──────────────────────────────────────────────────────────

export interface AgentUpsertData {
  spark_member_id: string;
  slug: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  office_name: string | null;
  office_id: string | null;
  primary_city: string | null;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  associations: string[];
  is_givenest: boolean;
  idx_participant: boolean;
  modified_at: string | null;
}

const AGENT_COLS = 15;

export async function upsertAgentsBatch(agents: AgentUpsertData[]): Promise<void> {
  if (agents.length === 0) return;

  const CHUNK = 500;
  for (let offset = 0; offset < agents.length; offset += CHUNK) {
    const chunk = agents.slice(offset, offset + CHUNK);

    const placeholders = chunk
      .map((_, i) => {
        const base = i * AGENT_COLS;
        const params = Array.from({ length: AGENT_COLS }, (__, j) => `$${base + j + 1}`).join(",");
        return `(${params})`;
      })
      .join(",");

    const values: unknown[] = [];
    for (const a of chunk) {
      values.push(
        a.spark_member_id,
        a.slug,
        a.name,
        a.first_name,
        a.last_name,
        a.office_name,
        a.office_id,
        a.primary_city,
        a.license_number,
        a.phone,
        a.email,
        a.associations,
        a.is_givenest,
        a.idx_participant,
        a.modified_at,
      );
    }

    await pool.query(
      `INSERT INTO agents (
        spark_member_id, slug, name, first_name, last_name,
        office_name, office_id, primary_city, license_number,
        phone, email, associations, is_givenest, idx_participant, modified_at
      ) VALUES ${placeholders}
      ON CONFLICT (spark_member_id) DO UPDATE SET
        name             = EXCLUDED.name,
        first_name       = EXCLUDED.first_name,
        last_name        = EXCLUDED.last_name,
        office_name      = EXCLUDED.office_name,
        office_id        = EXCLUDED.office_id,
        primary_city     = EXCLUDED.primary_city,
        license_number   = EXCLUDED.license_number,
        phone            = EXCLUDED.phone,
        email            = EXCLUDED.email,
        associations     = EXCLUDED.associations,
        is_givenest      = EXCLUDED.is_givenest,
        idx_participant  = EXCLUDED.idx_participant,
        modified_at      = EXCLUDED.modified_at,
        updated_at       = NOW()`,
      values,
    );
  }
}

/** Update active_listing_count on all agents by joining against listings */
export async function updateAgentListingCounts(): Promise<void> {
  // Reset all to 0 first, then set from listings
  await pool.query(`UPDATE agents SET active_listing_count = 0`);
  await pool.query(`
    UPDATE agents a SET active_listing_count = c.cnt
    FROM (
      SELECT agent_name, COUNT(*)::int AS cnt
      FROM listings
      WHERE mls_status IN ('Active', 'Active UCB', 'Coming Soon')
        AND agent_name IS NOT NULL
      GROUP BY agent_name
    ) c
    WHERE a.name = c.agent_name
  `);
}

/** Remove agents not seen in the last 7 days */
export async function pruneStaleAgents(): Promise<number> {
  const { rowCount } = await pool.query(
    `DELETE FROM agents WHERE updated_at < NOW() - INTERVAL '7 days'`
  );
  return rowCount ?? 0;
}

export interface AgentRow {
  name: string;
  office_name: string | null;
  primary_city: string | null;
  active_listing_count: number;
  is_givenest: boolean;
}

/** Paginated agent search for the directory API */
export async function searchAgents(
  opts: { q?: string; city?: string; letter?: string; featured?: boolean; page?: number; limit?: number }
): Promise<{ agents: AgentRow[]; total: number }> {
  const { q, city, letter, featured, page = 1, limit = 48 } = opts;
  const conditions: string[] = ["idx_participant = true"];
  const params: unknown[] = [];
  let paramIdx = 0;

  if (q) {
    paramIdx++;
    // Use trigram similarity (%) which handles partial/fuzzy matches like
    // "Teresa Porpiglia" matching "Teresa M Porpiglia". Falls back to ILIKE
    // for very short queries where trigram similarity thresholds are too strict.
    if (q.length >= 3) {
      conditions.push(`(name % $${paramIdx} OR office_name % $${paramIdx})`);
    } else {
      conditions.push(`(name ILIKE '%' || $${paramIdx} || '%' OR office_name ILIKE '%' || $${paramIdx} || '%')`);
    }
    params.push(q);
  }
  if (city) {
    paramIdx++;
    conditions.push(`primary_city = $${paramIdx}`);
    params.push(city);
  }
  if (letter && /^[A-Za-z]$/.test(letter)) {
    paramIdx++;
    conditions.push(`UPPER(LEFT(SPLIT_PART(name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1)), 1)) = $${paramIdx}`);
    params.push(letter.toUpperCase());
  }
  if (featured) {
    // is_featured column may not exist if migration hasn't run yet
    try {
      const colCheck = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'is_featured' LIMIT 1`
      );
      if (colCheck.rows.length > 0) {
        conditions.push(`is_featured = true`);
      } else {
        // Column doesn't exist — return empty results for featured queries
        return { agents: [], total: 0 };
      }
    } catch {
      return { agents: [], total: 0 };
    }
  }

  const where = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM agents WHERE ${where}`,
    params,
  );
  const total: number = countResult.rows[0]?.total ?? 0;

  const offset = (page - 1) * limit;
  paramIdx++;
  params.push(limit);
  paramIdx++;
  params.push(offset);

  // Extract last name for sorting: last word of the name field
  const lastNameExpr = `SPLIT_PART(name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1))`;

  // When searching, rank by similarity first; otherwise by last name (with letter filter) or listing count
  const orderBy = q && q.length >= 3
    ? `is_givenest DESC, GREATEST(similarity(name, $1), similarity(COALESCE(office_name,''), $1)) DESC, ${lastNameExpr} ASC`
    : letter
      ? `is_givenest DESC, ${lastNameExpr} ASC, name ASC`
      : `is_givenest DESC, active_listing_count DESC, ${lastNameExpr} ASC`;

  const { rows } = await pool.query(
    `SELECT name, office_name, primary_city, active_listing_count, is_givenest
     FROM agents
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT $${paramIdx - 1} OFFSET $${paramIdx}`,
    params,
  );

  return { agents: rows as AgentRow[], total };
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
