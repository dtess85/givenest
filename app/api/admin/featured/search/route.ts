import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/** GET /api/admin/featured/search?type=agent|charity|listing&q=... */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q") || "";

  if (!type || !q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  let rows: unknown[] = [];

  if (type === "agent") {
    const res = await pool.query(
      `SELECT id, name, office_name, primary_city, active_listing_count, is_givenest, is_featured
       FROM agents
       WHERE idx_participant = true AND (name ILIKE '%' || $1 || '%' OR office_name ILIKE '%' || $1 || '%')
       ORDER BY is_featured DESC, active_listing_count DESC, name ASC
       LIMIT 10`,
      [q]
    );
    rows = res.rows;
  } else if (type === "charity") {
    const res = await pool.query(
      `SELECT id, name, ein, city, state, is_featured
       FROM charities
       WHERE name ILIKE '%' || $1 || '%' OR ein ILIKE '%' || $1 || '%'
       ORDER BY is_featured DESC, name ASC
       LIMIT 10`,
      [q]
    );
    rows = res.rows;
  } else if (type === "listing") {
    const res = await pool.query(
      `SELECT id, spark_listing_key, address, city, price, status, is_featured
       FROM listings
       WHERE address ILIKE '%' || $1 || '%' OR city ILIKE '%' || $1 || '%'
       ORDER BY is_featured DESC, price DESC
       LIMIT 10`,
      [q]
    );
    rows = res.rows;
  }

  return NextResponse.json({ results: rows });
}
