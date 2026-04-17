import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "@/lib/db";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Closed set matching the `CHECK` constraint in migration 007.
 *  Keep in sync with the prompt below and the admin-UI badge map. */
export type ImageCategory =
  | "exterior_front"
  | "exterior_back"
  | "aerial"
  | "kitchen"
  | "living"
  | "dining"
  | "primary_bedroom"
  | "bedroom"
  | "bath"
  | "office"
  | "other_interior"
  | "floorplan_or_map"
  | "other";

export interface ImageClassification {
  url: string;
  category: ImageCategory;
  confidence: number;
}

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

/** Keep the image batch small enough to stay well under Anthropic's 20-image
 *  cap per request and to keep latency tight. We'll fan out if the listing
 *  has more. */
const BATCH_SIZE = 10;

/** Claude Haiku is plenty for "is this a kitchen" — fast and cheap. Override
 *  via env if you want to swap to Sonnet for tougher cases. */
const MODEL = process.env.ANTHROPIC_CLASSIFIER_MODEL ?? "claude-haiku-4-5";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function hashUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex");
}

const VALID_CATEGORIES = new Set<ImageCategory>([
  "exterior_front",
  "exterior_back",
  "aerial",
  "kitchen",
  "living",
  "dining",
  "primary_bedroom",
  "bedroom",
  "bath",
  "office",
  "other_interior",
  "floorplan_or_map",
  "other",
]);

/** Defensive parse — coerces model output into valid `ImageCategory` or
 *  `"other"` if the model hallucinated a new label. */
function coerceCategory(raw: unknown): ImageCategory {
  if (typeof raw === "string" && VALID_CATEGORIES.has(raw as ImageCategory)) {
    return raw as ImageCategory;
  }
  return "other";
}

function coerceConfidence(raw: unknown): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) return 0.5;
  return Math.max(0, Math.min(1, raw));
}

/* -------------------------------------------------------------------------- */
/* Cache                                                                      */
/* -------------------------------------------------------------------------- */

async function readCache(
  urls: string[]
): Promise<Map<string, ImageClassification>> {
  if (urls.length === 0) return new Map();
  const hashes = urls.map(hashUrl);
  const { rows } = await pool.query<{
    url: string;
    category: ImageCategory;
    confidence: string; // NUMERIC comes back as string
  }>(
    `SELECT url, category, confidence
       FROM listing_image_classifications
      WHERE url_hash = ANY($1::char(64)[])`,
    [hashes]
  );
  const out = new Map<string, ImageClassification>();
  for (const r of rows) {
    out.set(r.url, {
      url: r.url,
      category: r.category,
      confidence: Number(r.confidence),
    });
  }
  return out;
}

async function writeCache(batch: ImageClassification[]): Promise<void> {
  if (batch.length === 0) return;
  // Build a parameterized multi-row INSERT ... ON CONFLICT DO NOTHING.
  const values: unknown[] = [];
  const placeholders: string[] = [];
  batch.forEach((c, i) => {
    const base = i * 5;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
    );
    values.push(
      hashUrl(c.url),
      c.url,
      c.category,
      c.confidence,
      MODEL
    );
  });

  const query = `
    INSERT INTO listing_image_classifications
      (url_hash, url, category, confidence, model)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (url_hash) DO NOTHING
  `;

  await pool.query(query, values);
}

/* -------------------------------------------------------------------------- */
/* Anthropic call                                                             */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You are a real-estate photo classifier. For each image I send, pick exactly ONE category from this fixed list:

- exterior_front — street view, front elevation, front yard, front door
- exterior_back — backyard, pool, patio, deck, pergola, outdoor kitchen
- aerial — drone / bird's-eye shot
- kitchen — kitchen (any view, any angle)
- living — living room, family room, great room, sitting room
- dining — dedicated dining room
- primary_bedroom — primary / master bedroom suite (typically the largest, often with en-suite bath visible)
- bedroom — any other bedroom (guest, secondary, kids)
- bath — any bathroom
- office — home office, den, study, library
- other_interior — laundry, mudroom, bar, wine room, closet, entryway, hallway, staircase, garage interior
- floorplan_or_map — floorplan diagram, site plan, neighborhood map, price sheet
- other — anything else (lifestyle shots, community amenity photos, etc.)

Respond with ONLY valid JSON in this exact shape, no prose, no markdown:

{"classifications":[{"index":0,"category":"exterior_front","confidence":0.95},{"index":1,"category":"kitchen","confidence":0.90}]}

Rules:
- \`index\` matches the order I send the images (0-based).
- \`confidence\` is 0.0–1.0 (your certainty).
- If you're genuinely unsure between two categories, pick the more specific one and lower confidence.
- NEVER invent new categories.`;

/** Fetch a single image and return its bytes + content-type for base64
 *  embedding. Anthropic accepts the same allowlist as Safari's <img>: JPEG,
 *  PNG, GIF, WebP. */
type SupportedMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

async function urlToBase64(
  url: string
): Promise<{ data: string; mediaType: SupportedMedia }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch ${url} → ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = (res.headers.get("content-type") ?? "image/jpeg").toLowerCase();

  // Normalize to the Anthropic allowlist.
  let mediaType: SupportedMedia = "image/jpeg";
  if (ct.includes("png")) mediaType = "image/png";
  else if (ct.includes("gif")) mediaType = "image/gif";
  else if (ct.includes("webp")) mediaType = "image/webp";

  return { data: buf.toString("base64"), mediaType };
}

async function classifyBatch(
  client: Anthropic,
  urls: string[]
): Promise<ImageClassification[]> {
  // Fetch + base64-encode in parallel. We can't use URL sources directly —
  // Spark's CDN has robots.txt rules that block Anthropic's URL fetcher.
  // Base64 routes the bytes through our server, bypassing that.
  const fetched = await Promise.all(
    urls.map(async (url, i) => {
      try {
        return { ok: true as const, url, index: i, ...(await urlToBase64(url)) };
      } catch (err) {
        return { ok: false as const, url, index: i, err };
      }
    })
  );

  // Any image we couldn't fetch gets a category="other"/0-conf placeholder.
  const failedIndices = new Set<number>();
  for (const f of fetched) {
    if (!f.ok) {
      console.error(`[image-classifier] fetch failed idx=${f.index}: ${f.err}`);
      failedIndices.add(f.index);
    }
  }

  // Build the message with only successfully-fetched images.
  const successfullyFetched = fetched.filter((f) => f.ok) as Extract<
    (typeof fetched)[number],
    { ok: true }
  >[];

  if (successfullyFetched.length === 0) {
    return urls.map((url) => ({ url, category: "other", confidence: 0 }));
  }

  const content: Anthropic.Messages.ContentBlockParam[] =
    successfullyFetched.map((f) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: f.mediaType,
        data: f.data,
      },
    }));
  content.push({
    type: "text",
    text: `Classify these ${successfullyFetched.length} images and return the JSON object as instructed. Indexes are 0-based in the order I sent them.`,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  // Extract the first text block from the response.
  const textBlock = response.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  if (!textBlock) {
    throw new Error("Classifier returned no text block");
  }

  // Defensive JSON parse — model should return strict JSON, but strip any
  // incidental ```json fencing just in case.
  const text = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Classifier returned non-JSON: ${text.slice(0, 200)}`);
  }

  const raw =
    parsed && typeof parsed === "object" && "classifications" in parsed
      ? (parsed as { classifications: Array<Record<string, unknown>> })
          .classifications
      : [];

  // Model indexes are relative to `successfullyFetched` — build a map from
  // that local index → classification, then re-project onto the original
  // `urls` order (with failed fetches filling in as "other"/0).
  const byLocalIndex = new Map<
    number,
    { category: ImageCategory; confidence: number }
  >();
  for (const entry of raw) {
    const idx = typeof entry.index === "number" ? entry.index : -1;
    if (idx < 0 || idx >= successfullyFetched.length) continue;
    byLocalIndex.set(idx, {
      category: coerceCategory(entry.category),
      confidence: coerceConfidence(entry.confidence),
    });
  }

  // Build an original-index → local-index lookup so we can re-project.
  const originalToLocal = new Map<number, number>();
  successfullyFetched.forEach((f, localIdx) => {
    originalToLocal.set(f.index, localIdx);
  });

  return urls.map((url, origIdx) => {
    if (failedIndices.has(origIdx)) {
      return { url, category: "other" as ImageCategory, confidence: 0 };
    }
    const local = originalToLocal.get(origIdx);
    const hit = local !== undefined ? byLocalIndex.get(local) : undefined;
    return {
      url,
      category: hit?.category ?? "other",
      confidence: hit?.confidence ?? 0.0,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Public entry                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Classify a listing's images, using the DB cache when possible. Returns
 * classifications in the same order as the input. Safe to call with an empty
 * array or a list that's already fully cached (no API hit).
 *
 * On any classifier error, logs and returns fallback classifications
 * (category="other", confidence=0) — the caller should treat classifier
 * output as a hint, not a hard dependency, so the drafter never blocks on
 * vision failures.
 */
export async function classifyListingImages(
  urls: string[]
): Promise<ImageClassification[]> {
  if (urls.length === 0) return [];

  // 1. Dedup (same URL could appear twice if a listing duplicates a photo).
  const uniqueUrls = Array.from(new Set(urls));

  // 2. Cache lookup.
  const cached = await readCache(uniqueUrls);
  const toClassify = uniqueUrls.filter((u) => !cached.has(u));

  // 3. Classify uncached in batches.
  if (toClassify.length > 0) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn(
        "[image-classifier] ANTHROPIC_API_KEY not set — skipping classification"
      );
      // Fall through: cached hits still honored; missing entries become "other".
    } else {
      const client = new Anthropic({ apiKey });
      const batches: string[][] = [];
      for (let i = 0; i < toClassify.length; i += BATCH_SIZE) {
        batches.push(toClassify.slice(i, i + BATCH_SIZE));
      }
      const results = await Promise.all(
        batches.map(async (b) => {
          try {
            return await classifyBatch(client, b);
          } catch (err) {
            console.error("[image-classifier] batch failed:", err);
            return b.map((url) => ({
              url,
              category: "other" as ImageCategory,
              confidence: 0,
            }));
          }
        })
      );
      const flat = results.flat();
      // Write successful non-zero-confidence results to the cache.
      await writeCache(flat.filter((c) => c.confidence > 0));
      for (const c of flat) cached.set(c.url, c);
    }
  }

  // 4. Re-project onto the original input order. Any URL that somehow still
  //    lacks a classification (shouldn't happen outside of API outage) maps
  //    to "other".
  return urls.map((url) => {
    return (
      cached.get(url) ?? {
        url,
        category: "other" as ImageCategory,
        confidence: 0,
      }
    );
  });
}
