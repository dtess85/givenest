import { sql } from "./index";

export interface Charity {
  id: string;
  slug: string;
  name: string;
  ein?: string;
  category?: string;
  city?: string;
  state?: string;
  tagline?: string;
  description?: string;
  mission?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  gallery_urls?: string[];
  video_url?: string;
  is_featured: boolean;
  is_partner: boolean;
  status: string;
  user_id?: string; // Supabase Auth uid — populated when auth is wired
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  total_donated: number;
  total_closings: number;
  created_at: string;
  updated_at: string;
}

export async function getCharityBySlug(slug: string): Promise<Charity | null> {
  const { rows } = await sql`SELECT * FROM charities WHERE slug = ${slug} LIMIT 1`;
  return (rows[0] as Charity) ?? null;
}

export async function getCharityById(id: string): Promise<Charity | null> {
  const { rows } = await sql`SELECT * FROM charities WHERE id = ${id} LIMIT 1`;
  return (rows[0] as Charity) ?? null;
}

export async function getCharityByUserId(userId: string): Promise<Charity | null> {
  const { rows } = await sql`SELECT * FROM charities WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0] as Charity) ?? null;
}

export async function getAllCharities(): Promise<Charity[]> {
  const { rows } = await sql`SELECT * FROM charities ORDER BY is_featured DESC, name ASC`;
  return rows as Charity[];
}

export async function getFeaturedCharities(): Promise<Charity[]> {
  const { rows } = await sql`SELECT * FROM charities WHERE is_featured = true AND status = 'active' ORDER BY name ASC`;
  return rows as Charity[];
}

export async function updateCharity(id: string, data: Partial<Charity>): Promise<Charity> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);

  if (fields.length === 0) throw new Error("No fields to update");

  // Build dynamic update — safe because keys come from our own type
  const { rows } = await sql`
    UPDATE charities SET
      tagline = COALESCE(${data.tagline ?? null}, tagline),
      description = COALESCE(${data.description ?? null}, description),
      mission = COALESCE(${data.mission ?? null}, mission),
      website = COALESCE(${data.website ?? null}, website),
      logo_url = COALESCE(${data.logo_url ?? null}, logo_url),
      cover_image_url = COALESCE(${data.cover_image_url ?? null}, cover_image_url),
      gallery_urls = COALESCE(${data.gallery_urls ? JSON.stringify(data.gallery_urls) : null}::text[], gallery_urls),
      video_url = COALESCE(${data.video_url ?? null}, video_url),
      is_featured = COALESCE(${data.is_featured ?? null}, is_featured),
      is_partner = COALESCE(${data.is_partner ?? null}, is_partner),
      status = COALESCE(${data.status ?? null}, status),
      user_id = COALESCE(${data.user_id ?? null}, user_id),
      stripe_customer_id = COALESCE(${data.stripe_customer_id ?? null}, stripe_customer_id),
      stripe_subscription_id = COALESCE(${data.stripe_subscription_id ?? null}, stripe_subscription_id),
      subscription_status = COALESCE(${data.subscription_status ?? null}, subscription_status),
      total_donated = COALESCE(${data.total_donated ?? null}, total_donated),
      total_closings = COALESCE(${data.total_closings ?? null}, total_closings),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Charity;
}

export async function recalcCharityTotals(charityId: string): Promise<void> {
  await sql`
    UPDATE charities SET
      total_donated = (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE charity_id = ${charityId}),
      total_closings = (SELECT COUNT(*) FROM transactions WHERE charity_id = ${charityId}),
      updated_at = NOW()
    WHERE id = ${charityId}
  `;
}
