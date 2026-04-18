import { sql } from "../lib/db";

type Seed = {
  slug: string;
  name: string;
  ein: string;
  category: string;
  city: string;
  state: string | null;
  tagline: string;
  description: string;
  website: string;
};

const CHARITIES: Seed[] = [
  {
    slug: "gilbert-christian-schools",
    name: "Gilbert Christian Schools",
    ein: "86-0878481",
    category: "Education",
    city: "Gilbert",
    state: "AZ",
    tagline: "Christ-centered K–12 education in the East Valley",
    description:
      "Providing Christ-centered education from preschool through high school in the East Valley.",
    website: "https://www.gilbertchristianschools.org",
  },
  {
    slug: "orchard-africa",
    name: "Orchard: Africa",
    ein: "82-1339324",
    category: "International",
    city: "South Africa",
    state: null,
    tagline: "Empowering African communities through holistic child care",
    description:
      "Empowering vulnerable communities in Africa through education, clean water, and sustainable development.",
    website: "https://orchardafrica.org",
  },
  {
    slug: "house-of-refuge",
    name: "House of Refuge",
    ein: "86-0671519",
    category: "Housing",
    city: "Mesa",
    state: "AZ",
    tagline: "Transitional housing for homeless East Valley families",
    description:
      "Transitional housing and support services for homeless families with children in the East Valley.",
    website: "https://houseofrefuge.org",
  },
];

async function main() {
  for (const c of CHARITIES) {
    await sql`
      INSERT INTO charities (
        slug, name, ein, category, city, state,
        tagline, description, website,
        is_featured, is_partner, status
      ) VALUES (
        ${c.slug}, ${c.name}, ${c.ein}, ${c.category}, ${c.city}, ${c.state},
        ${c.tagline}, ${c.description}, ${c.website},
        true, false, 'active'
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        ein = EXCLUDED.ein,
        category = EXCLUDED.category,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description,
        website = EXCLUDED.website,
        is_featured = true,
        status = 'active',
        updated_at = NOW()
    `;
    console.log(`  ✓ ${c.name} → /charities/${c.slug}`);
  }
  const { rows } = await sql`SELECT COUNT(*)::int AS n FROM charities`;
  console.log(`Total charities in DB: ${rows[0].n}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
