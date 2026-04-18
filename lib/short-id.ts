import { randomBytes } from "crypto";

/**
 * Short, URL-friendly public IDs for listings. Stored permanently on the
 * `listings.short_id` column once generated, so indexed / shared URLs never
 * change. Format on the wire is `gpid-<8-char-base62>` — 62^8 ≈ 218 trillion
 * possibilities, so even at our full 50k-listing catalogue the birthday
 * collision probability is ~5e-6, and the DB's UNIQUE constraint catches
 * anything that slips through.
 */

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const LENGTH = 8;
const PREFIX = "gpid-";

/** Generate a cryptographically random 8-char base62 short id. */
export function generateShortId(): string {
  const bytes = randomBytes(LENGTH);
  let out = "";
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Turn a raw short id into the public URL slug. */
export function makePublicSlug(shortId: string): string {
  return `${PREFIX}${shortId}`;
}

const PUBLIC_SLUG_RE = new RegExp(`^${PREFIX}([A-Za-z0-9]{${LENGTH}})$`);

/** Pull the short id out of a public slug, or return null if it isn't one. */
export function parsePublicSlug(slug: string): string | null {
  const m = slug.match(PUBLIC_SLUG_RE);
  return m ? m[1] : null;
}

/** True if `slug` looks like a short public slug (gpid-XXXXXXXX). */
export function isPublicSlug(slug: string): boolean {
  return PUBLIC_SLUG_RE.test(slug);
}
