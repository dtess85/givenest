/**
 * One-time migration: creates the manual_listings table in Neon.
 * Run with: node scripts/migrate-manual-listings.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@vercel/postgres";

// Load env vars from .env.local manually
const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] = m[2];
}

const conn = createClient({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
});

await conn.connect();

await conn.query(`
  CREATE TABLE IF NOT EXISTS manual_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mls_number TEXT,
    spark_listing_key TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Gilbert',
    state TEXT NOT NULL DEFAULT 'AZ',
    zip TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    beds NUMERIC,
    baths NUMERIC,
    sqft NUMERIC,
    property_type TEXT DEFAULT 'Single Family Residence',
    status TEXT DEFAULT 'Coming Soon',
    year_built INTEGER,
    lot_size TEXT,
    hoa_dues NUMERIC,
    garage_spaces INTEGER,
    description TEXT,
    neighborhood TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    image_urls TEXT[] DEFAULT '{}',
    list_office_name TEXT DEFAULT 'Givenest',
    is_active BOOLEAN DEFAULT true,
    sort_priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

console.log("✓ manual_listings table created (or already exists)");
await conn.end();
