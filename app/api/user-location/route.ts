import { NextResponse } from "next/server";

/**
 * Returns the user's approximate location via Vercel's built-in
 * IP geolocation headers. No external API call required.
 * In local dev these headers are absent, so we return null.
 */
export async function GET(request: Request) {
  const lat = request.headers.get("x-vercel-ip-latitude");
  const lng = request.headers.get("x-vercel-ip-longitude");
  const city = request.headers.get("x-vercel-ip-city");
  const region = request.headers.get("x-vercel-ip-country-region"); // e.g. "AZ"

  if (lat && lng) {
    return NextResponse.json({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      // city header is URL-encoded (e.g. "San+Jose" → "San Jose")
      city: city ? decodeURIComponent(city) : null,
      region, // US state abbreviation
      source: "ip",
    });
  }

  // Vercel headers not present (local dev or CF-proxied)
  return NextResponse.json({ lat: null, lng: null, city: null, region: null, source: "unavailable" });
}
