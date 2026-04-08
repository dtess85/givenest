import { NextResponse } from "next/server";
import { fetchSparkListings } from "@/lib/spark";

/** Build a SparkQL OR group using only Eq operators */
function orGroup(field: string, values: string[]): string {
  if (values.length === 1) return `${field} Eq '${values[0]}'`;
  return `(${values.map((v) => `${field} Eq '${v}'`).join(" Or ")})`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 3) return NextResponse.json({ listings: [], isMlsNumber: false });

  // Sanitize: strip single quotes to prevent SparkQL injection
  const clean = q.replace(/'/g, "");

  const conditions: string[] = [
    "StateOrProvince Eq 'AZ'",
    "(PropertyType Eq 'A' Or PropertyType Eq 'Q' Or PropertyType Eq 'L')",
    orGroup("MlsStatus", ["Active", "Active UCB", "Coming Soon", "Pending"]),
  ];

  // Detect MLS number: 5–8 digit pure number (ARMLS MLS# format)
  const isMlsNumber = /^\d{5,8}$/.test(clean);

  if (isMlsNumber) {
    // Exact MLS number lookup
    conditions.push(`ListingId Eq '${clean}'`);
  } else {
    const numericPrefix = clean.match(/^(\d+)\s+(.+)$/);
    if (numericPrefix) {
      // "825 Main" → exact street number + exact street name
      const [, streetNum, streetName] = numericPrefix;
      conditions.push(`StreetNumber Eq '${streetNum}'`);
      conditions.push(`StreetName Eq '${streetName.trim()}'`);
    } else {
      // Street name, subdivision/community, or city — exact match (Spark Eq is case-insensitive)
      // Note: SubdivisionName Eq does word-level matching so "Agritopia" matches "AGRITOPIA PHASE 2B"
      conditions.push(
        `(StreetName Eq '${clean}' Or SubdivisionName Eq '${clean}' Or City Eq '${clean}')`
      );
    }
  }

  const filter = conditions.join(" And ");

  try {
    const { listings } = await fetchSparkListings(filter, 8);

    // Detect if any results came from a subdivision/community match so the UI
    // can offer a "Browse [community]" option that filters the main grid.
    const cleanUpper = clean.toUpperCase();
    const hasSubdivisionMatch =
      !isMlsNumber &&
      listings.some(
        (l) => l.neighborhood && l.neighborhood.toUpperCase().includes(cleanUpper)
      );

    return NextResponse.json({ listings, isMlsNumber, hasSubdivisionMatch });
  } catch (err) {
    console.error("Address search error:", err);
    return NextResponse.json({ listings: [], isMlsNumber: false, hasSubdivisionMatch: false });
  }
}
