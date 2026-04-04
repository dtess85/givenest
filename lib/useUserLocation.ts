"use client";

import { useState, useEffect } from "react";

export interface UserLocation {
  city: string;
  state: string;      // full name, e.g. "Arizona"
  stateCode: string;  // abbreviation, e.g. "AZ"
}

export function useUserLocation(): UserLocation | null {
  const [loc, setLoc] = useState<UserLocation | null>(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        const city = data.city || "";
        const state = data.region || "";
        const stateCode = data.region_code || "";
        if (city || state) setLoc({ city, state, stateCode });
      })
      .catch(() => {});
  }, []);

  return loc;
}
