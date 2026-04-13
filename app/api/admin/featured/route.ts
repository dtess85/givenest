import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/** GET /api/admin/featured — return all featured agents, charities, and properties */
export async function GET() {
  const [agentsRes, charitiesRes, listingsRes] = await Promise.all([
    pool.query(
      `SELECT id, name, office_name, primary_city, active_listing_count, is_givenest, is_featured
       FROM agents WHERE is_featured = true ORDER BY name ASC`
    ),
    pool.query(
      `SELECT id, name, ein, city, state, is_featured
       FROM charities WHERE is_featured = true ORDER BY name ASC`
    ),
    pool.query(
      `SELECT id, spark_listing_key, address, city, price, status, is_featured
       FROM listings WHERE is_featured = true ORDER BY address ASC`
    ),
  ]);

  return NextResponse.json({
    agents: agentsRes.rows,
    charities: charitiesRes.rows,
    listings: listingsRes.rows,
  });
}

/** PATCH /api/admin/featured — toggle featured status for an item */
export async function PATCH(request: Request) {
  const body = await request.json();
  const { type, id, featured } = body as { type: string; id: string; featured: boolean };

  if (!type || !id || typeof featured !== "boolean") {
    return NextResponse.json({ error: "type, id, and featured are required" }, { status: 400 });
  }

  const table = type === "agent" ? "agents" : type === "charity" ? "charities" : type === "listing" ? "listings" : null;
  if (!table) {
    return NextResponse.json({ error: "type must be agent, charity, or listing" }, { status: 400 });
  }

  await pool.query(`UPDATE ${table} SET is_featured = $1 WHERE id = $2`, [featured, id]);

  return NextResponse.json({ ok: true });
}
