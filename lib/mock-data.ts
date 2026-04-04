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
  donation?: number; // optional override for estimated donation
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
  { id: 1, address: "2635 E Los Altos Rd", city: "Gilbert, AZ 85297", price: 5990000, beds: 5, baths: 4.5, sqft: 7000, type: "Single Family", slug: "2635-e-los-altos-rd", donation: 37438 },
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
