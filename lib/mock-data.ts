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
  status?: "For Sale" | "Pending" | "Contingent" | "Sold" | "Coming Soon";
  images?: string[]; // paths relative to /public
  description?: string;
  yearBuilt?: number;
  lotSize?: string;   // e.g. "0.65 acres"
  hoaDues?: number;   // monthly, 0 = none
  parking?: string;   // e.g. "3-car garage"
  mlsNumber?: string;
  listingDate?: string; // ISO date string
  daysOnMarket?: number;
}

export interface CharityItem {
  id: number;
  name: string;
  category: string;
  city: string;
  total: number;
  closings: number;
  ein?: string;
}

export interface AgentItem {
  name: string;
  markets: string;
  closings: number;
  initials: string;
  email: string;
  phone: string;
  instagram: string;
}

export const PROPERTIES: Property[] = [
  {
    id: 1,
    address: "2635 E Los Altos Rd",
    city: "Gilbert, AZ 85297",
    price: 5950000,
    beds: 5,
    baths: 4.5,
    sqft: 6677,
    type: "Single Family",
    slug: "2635-e-los-altos-rd",
    status: "Coming Soon",
    images: ["/images/2635-e-los-altos-rd.jpg"],
    description:
      "Furnished European-Inspired Estate | Somerset Landmark. Set behind the gates of Somerset Landmark, this furnished, turn-key European-inspired estate is a masterpiece of design and craftsmanship. Spanning 6,677 square feet, the residence offers 5 bedrooms and 4.5 bathrooms, including a beautiful guest quarters with separate entrance. Positioned on a corner lot, a flagstone pathway leads to a private courtyard with fireplace — creating an immediate sense of arrival. The kitchen is both functional and artful, centered around a furniture-style island and layered with white oak cabinetry. A spacious game room overlooks the outdoor living area and includes a fireplace and dedicated workspace. A custom library — complete with built-in shelving, rolling ladder, and integrated bench seating — lines one of the home's most distinctive spaces. The primary suite is designed as a private retreat, featuring a statement fireplace and exposed white oak beams. A château-style pool, outdoor kitchen, barrel sauna, and sport court create a setting equally suited for intimate gatherings and grand entertaining. Throughout the home, natural materials — including white oak, stone, and flagstone — pair with integrated smart home technology. A four-car garage, trailer gate, and additional space for five vehicles complete the property.",
    yearBuilt: 2026,
    lotSize: "0.586 acres",
    hoaDues: 285,
    parking: "4-car garage",
    mlsNumber: "7009177",
    listingDate: "2026-04-03",
    daysOnMarket: 2,
  },
];

export const CHARITIES: CharityItem[] = [
  { id: 1, name: "Gilbert Christian Schools", category: "Education", city: "Gilbert, AZ", total: 0, closings: 0, ein: "86-0878481" },
  { id: 2, name: "Orchard: Africa", category: "International", city: "South Africa", total: 0, closings: 0, ein: "82-1339324" },
  { id: 3, name: "House of Refuge", category: "Housing", city: "Mesa, AZ", total: 0, closings: 0, ein: "86-0671519" },
];

export const AGENTS: AgentItem[] = [
  { name: "Kyndall Yates", markets: "Gilbert · Mesa · Chandler", closings: 0, initials: "KY", email: "kyndall@givenest.com", phone: "(480) 400-8690", instagram: "https://www.instagram.com/kdyates/" },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}
