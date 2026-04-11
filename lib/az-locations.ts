export type LocationSuggestion = {
  type: "city" | "zip" | "subdivision" | "agent";
  label: string;
  city?: string;
  zip?: string;
  subdivision?: string; // exact SubdivisionName Eq value to pass to the API
  agent?: string;       // exact ListAgentName Eq value to pass to the API
  lat?: number;
  lng?: number;
};

export const AZ_LOCATIONS: LocationSuggestion[] = [
  // Maricopa County cities
  { type: "city", label: "Gilbert, AZ",        city: "Gilbert",        lat: 33.3528, lng: -111.7890 },
  { type: "city", label: "Chandler, AZ",       city: "Chandler",       lat: 33.3062, lng: -111.8413 },
  { type: "city", label: "Mesa, AZ",           city: "Mesa",           lat: 33.4152, lng: -111.8315 },
  { type: "city", label: "Scottsdale, AZ",     city: "Scottsdale",     lat: 33.4942, lng: -111.9261 },
  { type: "city", label: "Phoenix, AZ",        city: "Phoenix",        lat: 33.4484, lng: -112.0740 },
  { type: "city", label: "Tempe, AZ",          city: "Tempe",          lat: 33.4255, lng: -111.9400 },
  { type: "city", label: "Glendale, AZ",       city: "Glendale",       lat: 33.5387, lng: -112.1860 },
  { type: "city", label: "Peoria, AZ",         city: "Peoria",         lat: 33.5806, lng: -112.2374 },
  { type: "city", label: "Surprise, AZ",       city: "Surprise",       lat: 33.6292, lng: -112.3679 },
  { type: "city", label: "Queen Creek, AZ",    city: "Queen Creek",    lat: 33.2487, lng: -111.6340 },
  { type: "city", label: "Goodyear, AZ",       city: "Goodyear",       lat: 33.4353, lng: -112.3576 },
  { type: "city", label: "Buckeye, AZ",        city: "Buckeye",        lat: 33.3703, lng: -112.5838 },
  { type: "city", label: "Avondale, AZ",       city: "Avondale",       lat: 33.4356, lng: -112.3496 },
  { type: "city", label: "Laveen, AZ",         city: "Laveen",         lat: 33.3620, lng: -112.1692 },
  { type: "city", label: "Fountain Hills, AZ", city: "Fountain Hills", lat: 33.6115, lng: -111.7165 },
  { type: "city", label: "Paradise Valley, AZ",city: "Paradise Valley",lat: 33.5317, lng: -111.9422 },
  { type: "city", label: "Cave Creek, AZ",     city: "Cave Creek",     lat: 33.8331, lng: -111.9517 },
  { type: "city", label: "Carefree, AZ",       city: "Carefree",       lat: 33.8225, lng: -111.9189 },
  { type: "city", label: "San Tan Valley, AZ", city: "San Tan Valley", lat: 33.1978, lng: -111.5559 },
  { type: "city", label: "Apache Junction, AZ",city: "Apache Junction",lat: 33.4154, lng: -111.5495 },
  { type: "city", label: "Gold Canyon, AZ",    city: "Gold Canyon",    lat: 33.3765, lng: -111.4426 },
  { type: "city", label: "Maricopa, AZ",       city: "Maricopa",       lat: 33.0581, lng: -112.0476 },
  // Pinal County
  { type: "city", label: "Casa Grande, AZ",    city: "Casa Grande",    lat: 32.8795, lng: -111.7574 },
  { type: "city", label: "Florence, AZ",       city: "Florence",       lat: 33.0314, lng: -111.3873 },
  // Yavapai County
  { type: "city", label: "Prescott, AZ",       city: "Prescott",       lat: 34.5400, lng: -112.4685 },
  { type: "city", label: "Prescott Valley, AZ",city: "Prescott Valley",lat: 34.6100, lng: -112.3154 },
  { type: "city", label: "Sedona, AZ",         city: "Sedona",         lat: 34.8697, lng: -111.7610 },
  // Pima County
  { type: "city", label: "Tucson, AZ",         city: "Tucson",         lat: 32.2226, lng: -110.9747 },
  { type: "city", label: "Sahuarita, AZ",      city: "Sahuarita",      lat: 31.9582, lng: -110.9671 },
  // Coconino County
  { type: "city", label: "Flagstaff, AZ",      city: "Flagstaff",      lat: 35.1983, lng: -111.6513 },

  // Gilbert zip codes
  { type: "zip", label: "85233 – Gilbert, AZ", zip: "85233" },
  { type: "zip", label: "85234 – Gilbert, AZ", zip: "85234" },
  { type: "zip", label: "85295 – Gilbert, AZ", zip: "85295" },
  { type: "zip", label: "85296 – Gilbert, AZ", zip: "85296" },
  { type: "zip", label: "85297 – Gilbert, AZ", zip: "85297" },
  { type: "zip", label: "85298 – Gilbert, AZ", zip: "85298" },
  // Chandler zip codes
  { type: "zip", label: "85224 – Chandler, AZ", zip: "85224" },
  { type: "zip", label: "85225 – Chandler, AZ", zip: "85225" },
  { type: "zip", label: "85226 – Chandler, AZ", zip: "85226" },
  { type: "zip", label: "85248 – Chandler, AZ", zip: "85248" },
  { type: "zip", label: "85249 – Chandler, AZ", zip: "85249" },
  // Mesa zip codes
  { type: "zip", label: "85201 – Mesa, AZ", zip: "85201" },
  { type: "zip", label: "85202 – Mesa, AZ", zip: "85202" },
  { type: "zip", label: "85203 – Mesa, AZ", zip: "85203" },
  { type: "zip", label: "85204 – Mesa, AZ", zip: "85204" },
  { type: "zip", label: "85205 – Mesa, AZ", zip: "85205" },
  { type: "zip", label: "85206 – Mesa, AZ", zip: "85206" },
  { type: "zip", label: "85207 – Mesa, AZ", zip: "85207" },
  { type: "zip", label: "85208 – Mesa, AZ", zip: "85208" },
  { type: "zip", label: "85209 – Mesa, AZ", zip: "85209" },
  { type: "zip", label: "85210 – Mesa, AZ", zip: "85210" },
  { type: "zip", label: "85212 – Mesa, AZ", zip: "85212" },
  { type: "zip", label: "85213 – Mesa, AZ", zip: "85213" },
  { type: "zip", label: "85215 – Mesa, AZ", zip: "85215" },
  // Scottsdale zip codes
  { type: "zip", label: "85250 – Scottsdale, AZ", zip: "85250" },
  { type: "zip", label: "85251 – Scottsdale, AZ", zip: "85251" },
  { type: "zip", label: "85254 – Scottsdale, AZ", zip: "85254" },
  { type: "zip", label: "85255 – Scottsdale, AZ", zip: "85255" },
  { type: "zip", label: "85257 – Scottsdale, AZ", zip: "85257" },
  { type: "zip", label: "85258 – Scottsdale, AZ", zip: "85258" },
  { type: "zip", label: "85259 – Scottsdale, AZ", zip: "85259" },
  { type: "zip", label: "85260 – Scottsdale, AZ", zip: "85260" },
  { type: "zip", label: "85262 – Scottsdale, AZ", zip: "85262" },
  { type: "zip", label: "85266 – Scottsdale, AZ", zip: "85266" },
  { type: "zip", label: "85268 – Fountain Hills, AZ", zip: "85268" },
  // Tempe zip codes
  { type: "zip", label: "85281 – Tempe, AZ", zip: "85281" },
  { type: "zip", label: "85282 – Tempe, AZ", zip: "85282" },
  { type: "zip", label: "85283 – Tempe, AZ", zip: "85283" },
  { type: "zip", label: "85284 – Tempe, AZ", zip: "85284" },
  // Queen Creek
  { type: "zip", label: "85140 – Queen Creek, AZ", zip: "85140" },
  { type: "zip", label: "85142 – Queen Creek, AZ", zip: "85142" },
  // San Tan Valley
  { type: "zip", label: "85143 – San Tan Valley, AZ", zip: "85143" },
  { type: "zip", label: "85144 – San Tan Valley, AZ", zip: "85144" },
  // Goodyear / Buckeye / Avondale
  { type: "zip", label: "85338 – Goodyear, AZ", zip: "85338" },
  { type: "zip", label: "85395 – Goodyear, AZ", zip: "85395" },
  { type: "zip", label: "85323 – Avondale, AZ", zip: "85323" },
  { type: "zip", label: "85326 – Buckeye, AZ", zip: "85326" },
  // Peoria / Surprise / Glendale
  { type: "zip", label: "85345 – Peoria, AZ", zip: "85345" },
  { type: "zip", label: "85374 – Surprise, AZ", zip: "85374" },
  { type: "zip", label: "85375 – Surprise, AZ", zip: "85375" },
  { type: "zip", label: "85301 – Glendale, AZ", zip: "85301" },
  { type: "zip", label: "85302 – Glendale, AZ", zip: "85302" },
  { type: "zip", label: "85303 – Glendale, AZ", zip: "85303" },
  { type: "zip", label: "85308 – Glendale, AZ", zip: "85308" },
];

export const POPULAR_CITIES = AZ_LOCATIONS.filter((l) => l.type === "city").slice(0, 8);
