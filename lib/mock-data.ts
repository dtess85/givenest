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
  status?: "For Sale" | "Pending" | "Contingent" | "Sold" | "Coming Soon" | "For Rent";
  images?: string[]; // paths relative to /public
  description?: string;
  yearBuilt?: number;
  lotSize?: string;   // e.g. "0.65 acres"
  hoaDues?: number;   // monthly, 0 = none
  parking?: string;   // e.g. "3-car garage"
  mlsNumber?: string;
  listingDate?: string; // ISO date string
  daysOnMarket?: number;
  listOfficeName?: string; // Listing brokerage (IDX attribution)
  latitude?: number;
  longitude?: number;
  thumbnails?: string[]; // Uri640 — optimized for listing cards (~30% smaller than Uri800)
  neighborhood?: string; // SubdivisionName — community / planned subdivision name
  backOnMarketDate?: string; // ISO date — set when a listing is relisted after withdrawal
  openHouses?: Array<{ date: string; startTime: string; endTime: string }>; // upcoming open houses
  modifiedAt?: string; // ISO — ModificationTimestamp from Spark (when listing data last changed)
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
      "Set behind the gates of Somerset Landmark, this furnished, turn-key European-inspired estate is a masterful collaboration between Cory Black Design, The Lifestyled Co., and Overton Builders — where architecture, interiors, and craftsmanship come together with intention.\n\nSpanning 6,677 square feet, the residence offers 5 bedrooms and 4.5 bathrooms, including a beautifully appointed 957-square-foot guest house (ADU) complete with its own kitchen and laundry.\n\nPositioned on a corner lot, a flagstone pathway leads to a private courtyard with fireplace — creating one of the most inviting and expansive front yard experiences in the community.\n\nDefined by its signature architectural arches, the home balances timeless elegance with modern livability. A vaulted great room opens through three arched French doors, while a gallery-style entry introduces a sense of scale and quiet refinement.\n\nThe kitchen is both functional and artful, centered around a furniture-style island and layered white oak cabinetry, with seamless access to a prep kitchen, walk-in pantry, and laundry — thoughtfully connected to the garage for everyday ease.\n\nA spacious game room overlooks the outdoor living area and includes a fireplace and dedicated workspace, offering a relaxed yet elevated setting for gathering.\n\nA custom library — complete with built-in shelving, rolling ladder, and integrated bench seating — lines the bedroom corridor, adding a distinctive architectural element and flexible use of space.\n\nThe primary suite is designed as a private retreat, featuring a statement fireplace, exposed white oak beams, and a spa-like bath with soaking tub, oversized shower, and a custom walk-in closet with center island.\n\nA château-style pool, outdoor kitchen, barrel sauna, and sport court create a setting equally suited for quiet mornings or effortless entertaining.\n\nThroughout the home, natural materials — including white oak, stone, and flagstone — pair with integrated technology such as Lutron HomeWorks whole-home lighting and Visual Comfort fixtures to deliver a seamless, elevated living experience.\n\nA four-car garage, trailer gate, and additional space for five vehicles complete the property.\n\nA thoughtfully designed estate set within the gates of Somerset Landmark with direct views of the nearby LDS temple, adding a unique sense of setting and perspective.",
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
