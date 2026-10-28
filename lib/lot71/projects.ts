export type ProjectKind = "build" | "remodel";

// Lifecycle status for each home we built. Drives CTAs:
//  - "available"   → "Inquire about this home" button + listing link
//  - "coming-soon" → "Join the list" link
//  - "sold"        → portfolio-only
export type ProjectStatus = "available" | "coming-soon" | "sold";

export type MediaTone = "warm" | "stone" | "ochre" | "shadow" | "clay";

export type Media =
  | { kind: "image"; src: string; alt?: string }
  | { kind: "video"; src: string; poster?: string }
  // Vimeo background embed — `videoId` is the numeric id from the share URL.
  // Rendered as an iframe scaled to cover its container; always muted,
  // no controls (via Vimeo's `background=1`). `startAt` / `endAt` (seconds)
  // bound a sub-clip and the component loops that range via the Player SDK.
  | {
      kind: "vimeo";
      videoId: string;
      startAt?: number;
      endAt?: number;
      alt?: string;
    }
  | { kind: "placeholder"; label: string; tone: MediaTone };

export type Project = {
  slug: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  year: number;
  city: string;
  state: string;
  summary: string;
  description: string[];
  specs: { label: string; value: string }[];
  hero: Media;
  gallery: Media[];
  // Only used when status is "available". `listingUrl` can point to the
  // MLS link or Givenest listing page once it's up.
  price?: string;
  listingUrl?: string;
};

// Projects are named by their lot number — e.g. "Lot 98" with slug "lot-98".
// Keep that convention when adding new ones. The original Lot 71 was a
// tract home we lived in — not a build — so it's the origin story
// (see /lot71/story), not a portfolio piece.
//
// Placeholder data in the entries below (The Ranch, Morrison, Citrus) is
// legacy — swap each `name`/`slug` for its real lot number, and replace
// the `kind: "placeholder"` media with real `image` / `video` entries
// when photos land. Also update the public folder path to match the new
// slug (public/lot71/projects/<slug>/).
export const projects: Project[] = [
  {
    slug: "lot-98",
    name: "Lot 98",
    kind: "build",
    status: "coming-soon",
    year: 2026,
    city: "Gilbert",
    state: "AZ",
    summary:
      "A limestone and shiplap custom with cedar-shake roofs, arched entry, and a shaded ramada on the pool.",
    description: [
      "A two-story custom sited for the long street view. Limestone and lime-washed brick at the ground floor, vertical shiplap and cedar-shake roofs above. An arched steel-and-glass entry centers the elevation; brass carriage lanterns flank the door.",
      "The plan opens to a long back run — covered pavilion with exposed timber trusses, pool, dining ramada, and lawn with court beyond. Materials stay honest: stone, oak, plaster, brass.",
    ],
    specs: [
      { label: "Status", value: "Coming soon" },
      { label: "Type", value: "New Build" },
      { label: "Style", value: "Transitional, brick + shiplap" },
      { label: "Lot", value: "Gilbert, AZ" },
      { label: "Features", value: "Pool · Ramada · Court" },
    ],
    hero: {
      kind: "image",
      src: "/lot71/projects/lot-98/hero.jpg",
      alt: "Lot 98 — three-quarter front elevation",
    },
    gallery: [
      {
        kind: "image",
        src: "/lot71/projects/lot-98/gallery-01-front.jpg",
        alt: "Front elevation",
      },
      {
        kind: "image",
        src: "/lot71/projects/lot-98/gallery-02-entry.jpg",
        alt: "Arched entry with brass lanterns",
      },
      {
        kind: "image",
        src: "/lot71/projects/lot-98/gallery-03-driveway.jpg",
        alt: "Side approach to the garage court",
      },
      {
        kind: "image",
        src: "/lot71/projects/lot-98/gallery-04-pavilion.jpg",
        alt: "Covered pavilion with exposed trusses",
      },
      {
        kind: "image",
        src: "/lot71/projects/lot-98/gallery-05-dining.jpg",
        alt: "Outdoor dining looking to the pool",
      },
      {
        kind: "image",
        src: "/lot71/projects/lot-98/gallery-06-aerial.jpg",
        alt: "Aerial — site layout",
      },
    ],
  },
  {
    slug: "lot-73",
    name: "Lot 73",
    kind: "remodel",
    status: "coming-soon",
    year: 2026,
    city: "Gilbert",
    state: "AZ",
    summary: "A whole-home remodel in Gilbert — details coming soon.",
    description: [
      "Placeholder description. Replace with the project narrative — scope, plan moves, materials — when photos are ready.",
    ],
    specs: [
      { label: "Status", value: "Coming soon" },
      { label: "Type", value: "Whole-home Remodel" },
    ],
    hero: { kind: "placeholder", label: "Lot 73", tone: "shadow" },
    gallery: [
      { kind: "placeholder", label: "Exterior", tone: "stone" },
      { kind: "placeholder", label: "Kitchen", tone: "warm" },
      { kind: "placeholder", label: "Living", tone: "ochre" },
      { kind: "placeholder", label: "Primary", tone: "clay" },
    ],
  },
  {
    slug: "lot-150",
    name: "Lot 150",
    kind: "build",
    status: "sold",
    year: 2023,
    city: "Gilbert",
    state: "AZ",
    summary: "A new build in Somerset Phase 2 — 2635 E Los Altos Rd.",
    description: [
      "Placeholder description. Replace with the project narrative — plan moves, siting, materials — when photos are ready.",
    ],
    specs: [
      { label: "Status", value: "Sold" },
      { label: "Type", value: "New Build" },
      { label: "Address", value: "2635 E Los Altos Rd" },
      { label: "Subdivision", value: "Somerset Phase 2" },
    ],
    hero: { kind: "placeholder", label: "Lot 150", tone: "warm" },
    gallery: [
      { kind: "placeholder", label: "Exterior", tone: "stone" },
      { kind: "placeholder", label: "Kitchen", tone: "warm" },
      { kind: "placeholder", label: "Living", tone: "ochre" },
      { kind: "placeholder", label: "Primary", tone: "clay" },
    ],
  },
  {
    slug: "lot-30",
    name: "Lot 30",
    kind: "remodel",
    status: "sold",
    year: 2024,
    city: "Gilbert",
    state: "AZ",
    summary: "A remodel in Stratland Estates — 2941 E Los Altos Ct.",
    description: [
      "Placeholder description. Replace with the project narrative — scope, plan moves, materials — when photos are ready.",
    ],
    specs: [
      { label: "Status", value: "Sold" },
      { label: "Type", value: "Remodel" },
      { label: "Address", value: "2941 E Los Altos Ct" },
      { label: "Subdivision", value: "Stratland Estates" },
    ],
    hero: { kind: "placeholder", label: "Lot 30", tone: "stone" },
    gallery: [
      { kind: "placeholder", label: "Exterior", tone: "warm" },
      { kind: "placeholder", label: "Kitchen", tone: "stone" },
      { kind: "placeholder", label: "Living", tone: "ochre" },
      { kind: "placeholder", label: "Primary", tone: "clay" },
    ],
  },
  {
    slug: "lot-26",
    name: "Lot 26",
    kind: "remodel",
    status: "sold",
    year: 2024,
    city: "Gilbert",
    state: "AZ",
    summary: "A remodel in Stratland Estates — 2873 E Los Altos Rd.",
    description: [
      "Placeholder description. Replace with the project narrative — scope, plan moves, materials — when photos are ready.",
    ],
    specs: [
      { label: "Status", value: "Sold" },
      { label: "Type", value: "Remodel" },
      { label: "Address", value: "2873 E Los Altos Rd" },
      { label: "Subdivision", value: "Stratland Estates" },
    ],
    hero: { kind: "placeholder", label: "Lot 26", tone: "clay" },
    gallery: [
      { kind: "placeholder", label: "Exterior", tone: "stone" },
      { kind: "placeholder", label: "Kitchen", tone: "warm" },
      { kind: "placeholder", label: "Living", tone: "ochre" },
      { kind: "placeholder", label: "Primary", tone: "shadow" },
    ],
  },
  {
    slug: "lot-25",
    name: "Lot 25",
    kind: "remodel",
    status: "sold",
    year: 2025,
    city: "Gilbert",
    state: "AZ",
    summary: "A remodel in Stratland Estates — 2859 E Los Altos Rd.",
    description: [
      "Placeholder description. Replace with the project narrative — scope, plan moves, materials — when photos are ready.",
    ],
    specs: [
      { label: "Status", value: "Sold" },
      { label: "Type", value: "Remodel" },
      { label: "Address", value: "2859 E Los Altos Rd" },
      { label: "Subdivision", value: "Stratland Estates" },
    ],
    hero: { kind: "placeholder", label: "Lot 25", tone: "ochre" },
    gallery: [
      { kind: "placeholder", label: "Exterior", tone: "warm" },
      { kind: "placeholder", label: "Kitchen", tone: "stone" },
      { kind: "placeholder", label: "Living", tone: "clay" },
      { kind: "placeholder", label: "Primary", tone: "shadow" },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  prev: Project;
  next: Project;
} {
  const i = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  return { prev, next };
}
