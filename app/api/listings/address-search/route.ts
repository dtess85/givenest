/**
 * Address search — queries the pre-indexed Supabase `listings` table for instant results.
 * Falls back to the Spark API if the index is empty (e.g., before first sync runs).
 *
 * Response shape matches what the buy page expects:
 *   { listings: Array<{ slug, address, city, price, neighborhood }>, isMlsNumber, hasSubdivisionMatch }
 */

import { NextResponse } from "next/server";
import { searchListings, countListingsIndex, findBrokerageMatch } from "@/lib/db/listings-index";
import { fetchSparkListings } from "@/lib/spark";

/** Spark fallback — same logic as the original route, used before the index is populated */
async function sparkFallback(q: string) {
  const clean = q.replace(/'/g, "");
  const isMlsNumber = /^\d{5,8}$/.test(clean);

  const conditions = [
    "StateOrProvince Eq 'AZ'",
    "(PropertyType Eq 'A' Or PropertyType Eq 'Q' Or PropertyType Eq 'L')",
    "(MlsStatus Eq 'Active' Or MlsStatus Eq 'Active UCB' Or MlsStatus Eq 'Coming Soon' Or MlsStatus Eq 'Pending')",
  ];

  if (isMlsNumber) {
    conditions.push(`ListingId Eq '${clean}'`);
  } else {
    const numericPrefix = clean.match(/^(\d+)\s+(.+)$/);
    if (numericPrefix) {
      const [, streetNum, rest] = numericPrefix;
      // ARMLS's StreetName field stores only the bare name (e.g. "Wagon"),
      // with directionals and suffixes in sibling fields. Strip them from
      // the query so `StreetName Eq` lines up — otherwise typing the full
      // address the way it appears on Zillow/Redfin returns nothing.
      const bareName = rest
        .trim()
        .replace(/^(N|S|E|W|NE|NW|SE|SW)\s+/i, "")
        .replace(/\s+(N|S|E|W|NE|NW|SE|SW)$/i, "")
        .replace(/\s+(St|Street|Ave|Avenue|Dr|Drive|Rd|Road|Blvd|Boulevard|Ln|Lane|Ct|Court|Pl|Place|Way|Cir|Circle|Pkwy|Parkway|Hwy|Highway|Trl|Trail|Pt|Point|Cv|Cove|Pass|Ter|Terrace|Sq|Square|Row|Loop|Run|Path|Xing|Crossing)$/i, "")
        .trim();
      conditions.push(`StreetNumber Eq '${streetNum}'`);
      conditions.push(`StreetName Eq '${bareName}'`);
    } else {
      conditions.push(
        `(StreetName Eq '${clean}' Or SubdivisionName Eq '${clean}' Or City Eq '${clean}')`
      );
    }
  }

  const { listings } = await fetchSparkListings(conditions.join(" And "), 8);

  const cleanUpper = clean.toUpperCase();
  const hasSubdivisionMatch =
    !isMlsNumber &&
    listings.some((l) => l.neighborhood && l.neighborhood.toUpperCase().includes(cleanUpper));

  return { listings, isMlsNumber, hasSubdivisionMatch };
}

// Cache the index-empty check so we don't query the DB on every keystroke
let indexIsEmpty: boolean | null = null;
let indexCheckAt = 0;
const INDEX_CHECK_TTL = 5 * 60 * 1000; // re-check every 5 min

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 3) {
    return NextResponse.json({ listings: [], isMlsNumber: false, hasSubdivisionMatch: false });
  }

  // Brokerage match is independent of the listings index (queries the agents
  // table). Runs in parallel with whichever listings path we take below so
  // dropdown latency doesn't compound.
  const brokeragePromise = findBrokerageMatch(q).catch(() => null);

  // ── Check if the index is populated (cached, TTL 5 min) ───────────────────
  if (indexIsEmpty === null || Date.now() - indexCheckAt > INDEX_CHECK_TTL) {
    try {
      const count = await countListingsIndex();
      indexIsEmpty = count === 0;
      indexCheckAt = Date.now();
    } catch {
      // DB not reachable — fall back to Spark
      indexIsEmpty = true;
    }
  }

  // ── Fallback to Spark if index not yet populated ───────────────────────────
  if (indexIsEmpty) {
    try {
      const [{ listings, isMlsNumber, hasSubdivisionMatch }, matchedBrokerageName] = await Promise.all([
        sparkFallback(q),
        brokeragePromise,
      ]);
      return NextResponse.json({
        listings,
        isMlsNumber,
        hasSubdivisionMatch,
        hasBrokerageMatch: !!matchedBrokerageName && !isMlsNumber,
        matchedBrokerageName,
      });
    } catch (err) {
      console.error("Address search Spark fallback error:", err);
      return NextResponse.json({ listings: [], isMlsNumber: false, hasSubdivisionMatch: false });
    }
  }

  // ── Query Supabase index ───────────────────────────────────────────────────
  try {
    const [{ results, isMlsNumber, hasSubdivisionMatch, hasAgentMatch, matchedAgentName }, matchedBrokerageName] =
      await Promise.all([searchListings(q, 8), brokeragePromise]);
    const hasBrokerageMatch = !!matchedBrokerageName && !isMlsNumber;

    // If DB returned nothing, fall back to Spark (handles edge cases like very new listings)
    if (results.length === 0 && !isMlsNumber) {
      indexIsEmpty = false; // DB is populated, just no match — don't re-check
      try {
        const fallback = await sparkFallback(q);
        return NextResponse.json({ ...fallback, hasBrokerageMatch, matchedBrokerageName });
      } catch {
        return NextResponse.json({ listings: results, isMlsNumber, hasSubdivisionMatch, hasAgentMatch, matchedAgentName, hasBrokerageMatch, matchedBrokerageName });
      }
    }

    return NextResponse.json({ listings: results, isMlsNumber, hasSubdivisionMatch, hasAgentMatch, matchedAgentName, hasBrokerageMatch, matchedBrokerageName });
  } catch (err) {
    console.error("Address search DB error:", err);
    // DB error — try Spark
    try {
      const [{ listings, isMlsNumber, hasSubdivisionMatch }, matchedBrokerageName] = await Promise.all([
        sparkFallback(q),
        brokeragePromise,
      ]);
      return NextResponse.json({
        listings,
        isMlsNumber,
        hasSubdivisionMatch,
        hasBrokerageMatch: !!matchedBrokerageName && !isMlsNumber,
        matchedBrokerageName,
      });
    } catch {
      return NextResponse.json({ listings: [], isMlsNumber: false, hasSubdivisionMatch: false });
    }
  }
}
