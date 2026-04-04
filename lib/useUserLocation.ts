"use client";

import { useState, useEffect } from "react";

export interface UserLocation {
  city: string;
  state: string;
}

export function useUserLocation(): UserLocation | null {
  const [loc, setLoc] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "";
          const state = data.address?.state || "";
          if (city || state) setLoc({ city, state });
        } catch {
          // silently fail — location is a nice-to-have
        }
      },
      () => {} // denied — no-op
    );
  }, []);

  return loc;
}
