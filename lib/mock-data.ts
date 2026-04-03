export interface Property {
  id: number;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  slug: string;
}

export interface CharityItem {
  id: number;
  name: string;
  category: string;
  city: string;
  total: number;
  closings: number;
}

export interface AgentItem {
  name: string;
  markets: string;
  closings: number;
  initials: string;
}

export const PROPERTIES: Property[] = [
  { id: 1, address: "4821 N Scottsdale Rd", city: "Scottsdale, AZ 85251", price: 875000, beds: 4, baths: 3, sqft: 2840, type: "Single Family", slug: "4821-n-scottsdale-rd" },
  { id: 2, address: "12 W Camelback Rd", city: "Phoenix, AZ 85013", price: 620000, beds: 3, baths: 2, sqft: 1920, type: "Condo", slug: "12-w-camelback-rd" },
  { id: 3, address: "9301 E Shea Blvd", city: "Scottsdale, AZ 85260", price: 1190000, beds: 5, baths: 4, sqft: 3850, type: "Single Family", slug: "9301-e-shea-blvd" },
  { id: 4, address: "702 S Mill Ave", city: "Tempe, AZ 85281", price: 485000, beds: 2, baths: 2, sqft: 1340, type: "Townhome", slug: "702-s-mill-ave" },
  { id: 5, address: "3340 S Higley Rd", city: "Gilbert, AZ 85297", price: 695000, beds: 4, baths: 3, sqft: 2620, type: "Single Family", slug: "3340-s-higley-rd" },
  { id: 6, address: "1420 E Chandler Blvd", city: "Chandler, AZ 85225", price: 540000, beds: 3, baths: 2, sqft: 1780, type: "Single Family", slug: "1420-e-chandler-blvd" },
];

export const CHARITIES: CharityItem[] = [
  { id: 1, name: "Gilbert Christian Schools", category: "Education", city: "Gilbert, AZ", total: 0, closings: 0 },
  { id: 2, name: "Orchard: Africa", category: "International", city: "South Africa", total: 0, closings: 0 },
  { id: 3, name: "House of Refuge", category: "Housing", city: "Mesa, AZ", total: 0, closings: 0 },
];

export const AGENTS: AgentItem[] = [
  { name: "Kyndall Yates", markets: "Gilbert · Mesa · Chandler", closings: 0, initials: "KY" },
  { name: "Dustin Tessendorf", markets: "Scottsdale · Phoenix · Paradise Valley", closings: 0, initials: "DT" },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}
