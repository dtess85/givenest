"use client";

import { useState, useEffect } from "react";

export interface UserLocation {
  city: string;
  state: string;      // full name, e.g. "Arizona"
  stateCode: string;  // abbreviation, e.g. "AZ"
  source: "gps" | "ip";
}

/**
 * Detects user location with GPS-first strategy:
 * 1. Check Permissions API — if GPS already granted, use it (no prompt)
 * 2. Fall back to IP geolocation via ipapi.co
 * 3. If GPS permission is "prompt", request it as a non-blocking upgrade
 *
 * GPS reverse-geocodes via Nominatim (free, no key needed).
 */
export function useUserLocation(): UserLocation | null {
  const [loc, setLoc] = useState<UserLocation | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      // Try GPS first if permission is already granted (no prompt shown)
      const gpsResult = await tryGps(cancelled);
      if (cancelled) return;
      if (gpsResult) {
        setLoc(gpsResult);
        return;
      }

      // Fall back to IP
      const ipResult = await tryIp();
      if (cancelled) return;
      if (ipResult) setLoc(ipResult);

      // Non-blocking GPS upgrade: if permission is "prompt", ask once
      // This shows the browser prompt but doesn't block the UI
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (cancelled) return;
            const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            if (cancelled || !city) return;
            setLoc({
              city: city.city,
              state: city.state,
              stateCode: city.stateCode,
              source: "gps",
            });
          },
          () => {} // silently ignore denial
        );
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  return loc;
}

/** Check if GPS is already granted and use it without prompting */
async function tryGps(cancelled: boolean): Promise<UserLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  // Permissions API tells us if GPS is already granted (no prompt)
  try {
    if (navigator.permissions) {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state !== "granted") return null; // don't prompt here
    } else {
      return null; // can't check, skip to avoid unexpected prompt
    }
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) { resolve(null); return; }
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (city) {
          resolve({ city: city.city, state: city.state, stateCode: city.stateCode, source: "gps" });
        } else {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 3000 }
    );
  });
}

/** IP-based geolocation fallback */
async function tryIp(): Promise<UserLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const city = data.city || "";
    const state = data.region || "";
    const stateCode = data.region_code || "";
    if (city || state) return { city, state, stateCode, source: "ip" };
  } catch {}
  return null;
}

/** Reverse geocode GPS coords to city/state via Nominatim (free, no API key) */
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; state: string; stateCode: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "Givenest/1.0" } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.hamlet || "";
    const state = addr.state || "";
    // Nominatim doesn't return state codes directly; derive from common states
    const stateCode = STATE_CODES[state] || "";
    if (city || state) return { city, state, stateCode };
  } catch {}
  return null;
}

const STATE_CODES: Record<string, string> = {
  Arizona: "AZ", California: "CA", Nevada: "NV", "New Mexico": "NM",
  Utah: "UT", Colorado: "CO", Texas: "TX", Oregon: "OR",
  Washington: "WA", Idaho: "ID", Montana: "MT", Wyoming: "WY",
  "New York": "NY", Florida: "FL", Illinois: "IL", Ohio: "OH",
  Pennsylvania: "PA", Georgia: "GA", Michigan: "MI", "North Carolina": "NC",
  "New Jersey": "NJ", Virginia: "VA", Tennessee: "TN", Massachusetts: "MA",
  Indiana: "IN", Missouri: "MO", Maryland: "MD", Wisconsin: "WI",
  Minnesota: "MN", Alabama: "AL", "South Carolina": "SC", Louisiana: "LA",
  Kentucky: "KY", Oklahoma: "OK", Connecticut: "CT", Iowa: "IA",
  Mississippi: "MS", Arkansas: "AR", Kansas: "KS", Nebraska: "NE",
  Hawaii: "HI", "West Virginia": "WV", Delaware: "DE", Maine: "ME",
  "New Hampshire": "NH", "Rhode Island": "RI", Vermont: "VT",
  Alaska: "AK", "North Dakota": "ND", "South Dakota": "SD",
  "District of Columbia": "DC",
};
