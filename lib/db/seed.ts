import { sql } from "./index";

const charities = [
  {
    slug: "gilbert-christian-schools",
    name: "Gilbert Christian Schools",
    ein: "86-0878481",
    category: "Education",
    city: "Gilbert",
    state: "AZ",
    tagline: "Faith-based education for the next generation.",
    description: "Gilbert Christian Schools provides a Christ-centered education for students in the East Valley. Their mission is to develop students academically, spiritually, and socially.",
    is_featured: true,
    is_partner: false,
    status: "active",
  },
  {
    slug: "orchard-africa",
    name: "Orchard: Africa",
    ein: "82-1339324",
    category: "International",
    city: "South Africa",
    state: null,
    tagline: "Transforming communities across Sub-Saharan Africa.",
    description: "Orchard: Africa equips local leaders and communities across Sub-Saharan Africa with resources, training, and support to create lasting change.",
    is_featured: true,
    is_partner: false,
    status: "active",
  },
  {
    slug: "house-of-refuge",
    name: "House of Refuge",
    ein: "86-0671519",
    category: "Housing",
    city: "Mesa",
    state: "AZ",
    tagline: "Emergency housing for families in crisis.",
    description: "House of Refuge provides emergency shelter, transitional housing, and supportive services to families experiencing homelessness in the East Valley.",
    is_featured: true,
    is_partner: false,
    status: "active",
  },
];

async function seed() {
  console.log("Seeding charities...");
  for (const c of charities) {
    await sql`
      INSERT INTO charities (slug, name, ein, category, city, state, tagline, description, is_featured, is_partner, status)
      VALUES (${c.slug}, ${c.name}, ${c.ein}, ${c.category}, ${c.city}, ${c.state ?? "AZ"}, ${c.tagline}, ${c.description}, ${c.is_featured}, ${c.is_partner}, ${c.status})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description,
        updated_at = NOW()
    `;
    console.log(`  ✓ ${c.name}`);
  }
  console.log("Done.");
}

seed().catch(console.error);
