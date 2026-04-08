import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Property } from "@/lib/mock-data";
import { sparkToProperty } from "@/lib/spark";
import type { SparkListing } from "@/lib/spark";

const TOKEN = process.env.SPARK_API_TOKEN;

const FIELDS = [
  "ListingKey", "ListingId", "ListPrice", "BedsTotal", "BathsFull", "BathsHalf",
  "LivingArea", "City", "StreetNumber", "StreetName", "StreetSuffix",
  "StateOrProvince", "PostalCode", "PropertySubType", "MlsStatus",
  "PublicRemarks", "YearBuilt", "LotSizeAcres", "AssociationFee",
  "GarageSpaces", "ListDate", "ListOfficeName", "ListAgentFullName",
  "Latitude", "Longitude", "SubdivisionName",
].join(",");

function sparkHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
  };
}

/** Try the standard (non-IDX) Spark API by filter string */
async function tryStandardApi(filter: string): Promise<{ listing: Property | null; key: string | null }> {
  try {
    const url = new URL("https://sparkapi.com/v1/listings");
    url.searchParams.set("_expand", "Photos");
    url.searchParams.set("_select", FIELDS);
    url.searchParams.set("_filter", filter);
    url.searchParams.set("_limit", "1");
    const res = await fetch(url.toString(), { headers: sparkHeaders(), cache: "no-store" });
    if (!res.ok) return { listing: null, key: null };
    const data = await res.json();
    const result: SparkListing | undefined = data?.D?.Results?.[0];
    if (!result) return { listing: null, key: null };
    return { listing: sparkToProperty(result), key: result.Id };
  } catch {
    return { listing: null, key: null };
  }
}

/** Try the standard Spark API by listing key (direct endpoint) */
async function tryStandardApiByKey(listingKey: string): Promise<{ listing: Property | null; key: string | null }> {
  try {
    const url = new URL(`https://sparkapi.com/v1/listings/${listingKey}`);
    url.searchParams.set("_expand", "Photos");
    url.searchParams.set("_select", FIELDS);
    const res = await fetch(url.toString(), { headers: sparkHeaders(), cache: "no-store" });
    if (!res.ok) return { listing: null, key: null };
    const data = await res.json();
    const result: SparkListing | undefined = data?.D?.Results?.[0];
    if (!result) return { listing: null, key: null };
    return { listing: sparkToProperty(result), key: result.Id };
  } catch {
    return { listing: null, key: null };
  }
}

/** Fall back to the IDX replication API */
async function tryReplicationApi(filter: string): Promise<{ listing: Property | null; key: string | null }> {
  try {
    const url = new URL("https://replication.sparkapi.com/v1/listings");
    url.searchParams.set("_expand", "Photos");
    url.searchParams.set("_select", FIELDS);
    url.searchParams.set("_filter", filter);
    url.searchParams.set("_limit", "1");
    const res = await fetch(url.toString(), { headers: sparkHeaders(), cache: "no-store" });
    if (!res.ok) return { listing: null, key: null };
    const data = await res.json();
    const result: SparkListing | undefined = data?.D?.Results?.[0];
    if (!result) return { listing: null, key: null };
    return { listing: sparkToProperty(result), key: result.Id };
  } catch {
    return { listing: null, key: null };
  }
}

/** Replication API by direct listing key */
async function tryReplicationApiByKey(listingKey: string): Promise<{ listing: Property | null; key: string | null }> {
  try {
    const url = new URL(`https://replication.sparkapi.com/v1/listings/${listingKey}`);
    url.searchParams.set("_expand", "Photos");
    url.searchParams.set("_select", FIELDS);
    const res = await fetch(url.toString(), { headers: sparkHeaders(), cache: "no-store" });
    if (!res.ok) return { listing: null, key: null };
    const data = await res.json();
    const result: SparkListing | undefined = data?.D?.Results?.[0];
    if (!result) return { listing: null, key: null };
    return { listing: sparkToProperty(result), key: result.Id };
  } catch {
    return { listing: null, key: null };
  }
}

/** First(n) regex match or null */
function rx(html: string, ...patterns: RegExp[]): RegExpMatchArray | null {
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m;
  }
  return null;
}

/**
 * Fetch a FlexMLS share page and scrape listing data.
 *
 * Strategy:
 * 1. Fetch the flexmls.com/share/... page (tiny JS-redirect shell with og: meta tags)
 *    → get address, description, beds/baths/sqft from meta tags; photo from og:image;
 *      and the redirect_url pointing to my.flexmls.com
 * 2. Fetch the redirect URL at my.flexmls.com
 *    → extract Spark listing key from data-direct-load-ldp attribute
 * 3. Caller will try the Spark API with that key for price + full structured data
 */
async function scrapeFlexMls(shareUrl: string): Promise<{
  listing: Partial<Property> | null;
  sparkListingKey: string | null;
  mlsNumber: string | null;
}> {
  try {
    const HEADERS = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
    };

    // ── Step 1: Fetch the original flexmls.com share URL ──────────────────────
    const res = await fetch(shareUrl, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) return { listing: null, sparkListingKey: null, mlsNumber: null };
    const html = await res.text();

    // ── Address from <title> or og:title (much more reliable than URL slug) ────
    // Title format: "2635 E LOS ALTOS RD, Gilbert, AZ 85297"
    const titleText = html.match(/<title>([^<]+)<\/title>/i)?.[1]
      ?? html.match(/<meta name="title" content="([^"]+)"/i)?.[1]
      ?? "";
    let address = "";
    let city = "Gilbert";
    let state = "AZ";
    let zip = "";
    if (titleText) {
      // "2635 E LOS ALTOS RD, Gilbert, AZ 85297"
      const titleMatch = titleText.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})?/);
      if (titleMatch) {
        address = titleMatch[1].trim();
        city = titleMatch[2].trim();
        state = titleMatch[3].trim();
        zip = titleMatch[4]?.trim() ?? "";
      } else {
        // Fallback: use URL slug
        const urlSlug = shareUrl.match(/\/share\/[^/]+\/(.+?)(?:\?|$)/)?.[1] ?? "";
        if (urlSlug) {
          const parts = urlSlug.split("-");
          let idx = parts.length - 1;
          if (/^\d{5}$/.test(parts[idx])) { zip = parts[idx--]; }
          if (/^[A-Z]{2}$/.test(parts[idx])) { state = parts[idx--]; }
          const SUFFIXES = new Set(["RD","ST","DR","AVE","BLVD","LN","CT","PL","WAY","CIR","PKWY",
            "TRL","HWY","LOOP","PASS","CV","CYN","RUN","TER","XING",
            "ROAD","STREET","DRIVE","LANE","COURT","PLACE","BOULEVARD"]);
          let suffixAt = -1;
          for (let i = idx; i >= 0; i--) {
            if (SUFFIXES.has(parts[i].toUpperCase())) { suffixAt = i; break; }
          }
          if (suffixAt >= 0) {
            address = parts.slice(0, suffixAt + 1).join(" ").toUpperCase();
            city = parts.slice(suffixAt + 1, idx + 1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          }
        }
      }
    }

    // ── Description, beds, baths, sqft, neighborhood from og:description ───────
    // og:description text contains: "5 bedrooms and 4.5 bathrooms", "6,677 square feet",
    // and neighborhood names like "Somerset Landmark"
    const descMeta = html.match(/<meta(?:[^>]*?)name="description"(?:[^>]*?)content="([^"]+)"/i)?.[1]
      ?? html.match(/<meta(?:[^>]*?)property="og:description"(?:[^>]*?)content="([^"]+)"/i)?.[1]
      ?? "";

    let beds: number | null = null;
    let baths: number | null = null;
    let sqft: number | null = null;
    let neighborhood: string | null = null;
    let description: string | null = descMeta || null;

    if (descMeta) {
      // "5 bedrooms and 4.5 bathrooms" or "5 bedrooms and 5 bathrooms"
      const bedMatch = descMeta.match(/(\d+)\s+bedroom/i);
      if (bedMatch) beds = parseInt(bedMatch[1], 10);

      const bathMatch = descMeta.match(/(\d+(?:\.\d+)?)\s+bathroom/i);
      if (bathMatch) baths = parseFloat(bathMatch[1]);

      // "6,677 square feet"
      const sqftMatch = descMeta.match(/([0-9,]+)\s+square\s+feet/i);
      if (sqftMatch) sqft = parseInt(sqftMatch[1].replace(/,/g, ""), 10);

      // Neighborhood: often in title line "Furnished European-Inspired Estate | Somerset Landmark"
      const neighborhoodMatch = descMeta.match(/\|\s*([A-Z][A-Za-z\s]{3,40}?)(?:\.|$|\n)/m);
      if (neighborhoodMatch) neighborhood = neighborhoodMatch[1].trim();
    }

    // ── Photos — deduplicated by photo ID (same image can appear on both CDNs) ──
    const photoPattern = /https:\/\/(?:cdn(?:0)?\.photos\.sparkplatform\.com|cdn\.resize\.sparkplatform\.com)\/[^\s"'<>]+\.jpg/gi;
    const ogImage = html.match(/<meta(?:[^>]*?)(?:property="og:image"|name="image")(?:[^>]*?)content="([^"]+)"/i)?.[1];
    const allFoundPhotos = [
      ...(ogImage ? [ogImage] : []),
      ...(html.match(photoPattern) ?? []),
    ];
    // Deduplicate by the 20+ digit photo ID embedded in the URL.
    // Prefer cdn0.photos (original full-res) over cdn.resize (server-resized copy).
    const photoById = new Map<string, string>();
    for (const url of allFoundPhotos) {
      const id = url.match(/\/([0-9]{20,})/)?.[1];
      if (!id) continue;
      const existing = photoById.get(id);
      if (!existing || url.includes("cdn0.photos")) photoById.set(id, url);
    }
    const images = Array.from(photoById.values());

    // ── Status from meta content ───────────────────────────────────────────────
    let status: Property["status"] = "For Sale";
    if (/Coming\s*Soon/i.test(html)) status = "Coming Soon";
    else if (/\bPending\b/i.test(html)) status = "Pending";
    else if (/\bContingent\b|Active\s+UCB\b/i.test(html)) status = "Contingent";

    // ── MLS number (usually not in initial HTML for Coming Soon) ──────────────
    const mlsNumber = rx(html,
      /MLS\s*#\s*(\d{5,8})\b/i,
      /"mlsId"\s*:\s*"(\d{5,8})"/,
      /\bMLS[^0-9]{0,10}(\d{5,8})\b/i,
    )?.[1] ?? null;

    // ── Step 2: Follow JS redirect to my.flexmls.com for the Spark listing key ─
    let sparkListingKey: string | null = null;

    const redirectUrl = html.match(/var redirect_url\s*=\s*"([^"]+)"/)?.[1];
    if (redirectUrl) {
      try {
        const r2 = await fetch(redirectUrl, { headers: HEADERS, cache: "no-store" });
        if (r2.ok) {
          const r2Html = await r2.text();
          sparkListingKey = r2Html.match(/data-direct-load-ldp="([0-9]{20,})"/)?.[1]
            ?? r2Html.match(/ListingKey Eq &#39;([0-9]{20,})&#39;/)?.[1]
            ?? r2Html.match(/\/listings\/([0-9]{20,})/)?.[1]
            ?? null;

          // Also try to get more photos from the my.flexmls.com page (same dedup by ID)
          const r2Photos = r2Html.match(photoPattern) ?? [];
          for (const url of r2Photos) {
            const id = url.match(/\/([0-9]{20,})/)?.[1];
            if (!id) continue;
            if (!photoById.has(id) || url.includes("cdn0.photos")) photoById.set(id, url);
          }
          // Rebuild images from updated map
          images.length = 0;
          images.push(...Array.from(photoById.values()));
        }
      } catch { /* ignore */ }
    }

    // Fallback: try to find key in the original HTML
    if (!sparkListingKey) {
      sparkListingKey = rx(html,
        /list_id=([0-9]{20,})/,
        /\/listings\/([0-9]{20,})\//,
        /"listingId"\s*:\s*"([0-9]{20,})"/,
      )?.[1] ?? null;
    }

    const listing: Partial<Property> = {
      address,
      city: city && state && zip ? `${city}, ${state} ${zip}` : city,
      price: 0, // Price comes from Spark API — not in page HTML
      beds: beds ?? 0,
      baths: baths ?? 0,
      sqft: sqft ?? 0,
      status,
      type: "Single Family Residence",
      description: description ?? undefined,
      neighborhood: neighborhood ?? undefined,
      mlsNumber: mlsNumber ?? undefined,
      images,
      thumbnails: images,
    };

    return { listing, sparkListingKey, mlsNumber };
  } catch {
    return { listing: null, sparkListingKey: null, mlsNumber: null };
  }
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("mls") ?? searchParams.get("url") ?? "").trim();

  if (!input) {
    return NextResponse.json({ error: "Provide ?mls= or ?url=" }, { status: 400 });
  }

  // ── Detect FlexMLS URL ──────────────────────────────────────────────────────
  const isFlexMlsUrl = /flexmls\.com\/share\//i.test(input);
  if (isFlexMlsUrl) {
    const url = input.startsWith("http") ? input : `https://${input}`;
    const scraped = await scrapeFlexMls(url);

    if (scraped.sparkListingKey) {
      // Try to get full structured Spark data using the listing key we extracted
      const [standard, replication] = await Promise.all([
        tryStandardApiByKey(scraped.sparkListingKey),
        tryReplicationApiByKey(scraped.sparkListingKey),
      ]);

      if (standard.listing) {
        return NextResponse.json({ listing: standard.listing, spark_listing_key: standard.key, source: "standard" });
      }
      if (replication.listing) {
        return NextResponse.json({ listing: replication.listing, spark_listing_key: replication.key, source: "replication" });
      }
    }

    // Fall back to scraped data
    if (scraped.listing) {
      return NextResponse.json({
        listing: scraped.listing,
        spark_listing_key: scraped.sparkListingKey,
        source: "flexmls-scrape",
      });
    }

    return NextResponse.json({ listing: null, spark_listing_key: null, source: "not-found" });
  }

  // ── MLS number or listing key ───────────────────────────────────────────────
  // Extract MLS# from any URL or plain number
  let mls = "";
  let listingKey = "";

  if (/^\d{5,8}$/.test(input)) {
    mls = input;
  } else if (/^\d{20,}$/.test(input)) {
    listingKey = input;
  } else {
    // Try extracting from any URL (Matrix, Zillow, etc.)
    const mlsMatch = input.match(/\b(\d{5,8})\b/);
    if (mlsMatch) mls = mlsMatch[1];
  }

  const filter = listingKey
    ? `ListingKey Eq '${listingKey}'`
    : mls
      ? `ListingId Eq '${mls}'`
      : null;

  if (!filter) {
    return NextResponse.json({ listing: null, spark_listing_key: null, source: "not-found" });
  }

  const standard = await tryStandardApi(filter);
  if (standard.listing) {
    return NextResponse.json({ listing: standard.listing, spark_listing_key: standard.key, source: "standard" });
  }

  const replication = await tryReplicationApi(filter);
  if (replication.listing) {
    return NextResponse.json({ listing: replication.listing, spark_listing_key: replication.key, source: "replication" });
  }

  return NextResponse.json({ listing: null, spark_listing_key: null, source: "not-found" });
}
