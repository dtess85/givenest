import { sql } from "./index";
import type { Property } from "@/lib/mock-data";

export interface ManualListing {
  id: string;
  mls_number?: string;
  spark_listing_key?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  property_type?: string;
  status?: string;
  year_built?: number;
  lot_size?: string;
  hoa_dues?: number;
  garage_spaces?: number;
  description?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  image_urls: string[];
  list_office_name: string;
  is_active: boolean;
  sort_priority: number;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, Property["status"]> = {
  "Coming Soon": "Coming Soon",
  "For Sale": "For Sale",
  "Active": "For Sale",
  "Pending": "Pending",
  "Contingent": "Contingent",
  "Sold": "Sold",
};

/** Map a DB row to the shared Property interface used by the buy page */
export function manualListingToProperty(row: ManualListing): Property {
  return {
    id: parseInt(row.id.replace(/-/g, "").slice(0, 8), 16) || 0,
    slug: `manual-${row.id}`,
    address: row.address,
    city: `${row.city}, ${row.state}${row.zip ? ` ${row.zip}` : ""}`,
    price: Number(row.price),
    beds: Number(row.beds ?? 0),
    baths: Number(row.baths ?? 0),
    sqft: Number(row.sqft ?? 0),
    type: row.property_type ?? "Single Family Residence",
    status: STATUS_MAP[row.status ?? "Coming Soon"] ?? "Coming Soon",
    images: row.image_urls ?? [],
    thumbnails: row.image_urls ?? [],
    description: row.description ?? undefined,
    yearBuilt: row.year_built ?? undefined,
    lotSize: row.lot_size ?? undefined,
    hoaDues: row.hoa_dues != null ? Number(row.hoa_dues) : undefined,
    parking: row.garage_spaces ? `${row.garage_spaces}-car garage` : undefined,
    mlsNumber: row.mls_number ?? undefined,
    listingDate: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : undefined,
    listOfficeName: row.list_office_name,
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    neighborhood: row.neighborhood ?? undefined,
  };
}

export async function getActiveManualListings(): Promise<ManualListing[]> {
  const { rows } = await sql`
    SELECT * FROM manual_listings
    WHERE is_active = true
    ORDER BY sort_priority ASC, created_at DESC
  `;
  return rows as ManualListing[];
}

export async function getAllManualListings(): Promise<ManualListing[]> {
  const { rows } = await sql`
    SELECT * FROM manual_listings
    ORDER BY sort_priority ASC, created_at DESC
  `;
  return rows as ManualListing[];
}

export async function getManualListingById(id: string): Promise<ManualListing | null> {
  const { rows } = await sql`SELECT * FROM manual_listings WHERE id = ${id} LIMIT 1`;
  return (rows[0] as ManualListing) ?? null;
}

export async function createManualListing(
  data: Omit<Partial<ManualListing>, "id" | "created_at" | "updated_at"> & { address: string; price: number }
): Promise<ManualListing> {
  const { rows } = await sql`
    INSERT INTO manual_listings (
      mls_number, spark_listing_key, address, city, state, zip,
      price, beds, baths, sqft, property_type, status,
      year_built, lot_size, hoa_dues, garage_spaces,
      description, neighborhood, latitude, longitude,
      image_urls, list_office_name, is_active, sort_priority
    ) VALUES (
      ${data.mls_number ?? null},
      ${data.spark_listing_key ?? null},
      ${data.address},
      ${data.city ?? "Gilbert"},
      ${data.state ?? "AZ"},
      ${data.zip ?? null},
      ${data.price},
      ${data.beds ?? null},
      ${data.baths ?? null},
      ${data.sqft ?? null},
      ${data.property_type ?? "Single Family Residence"},
      ${data.status ?? "Coming Soon"},
      ${data.year_built ?? null},
      ${data.lot_size ?? null},
      ${data.hoa_dues ?? null},
      ${data.garage_spaces ?? null},
      ${data.description ?? null},
      ${data.neighborhood ?? null},
      ${data.latitude ?? null},
      ${data.longitude ?? null},
      ${data.image_urls && data.image_urls.length > 0 ? `{${data.image_urls.map((u: string) => `"${u.replace(/"/g, '\\"')}"`).join(",")}}` : "{}"}::text[],
      ${data.list_office_name ?? "Givenest"},
      ${data.is_active ?? true},
      ${data.sort_priority ?? 0}
    )
    RETURNING *
  `;
  return rows[0] as ManualListing;
}

export async function updateManualListing(
  id: string,
  data: Partial<ManualListing>
): Promise<ManualListing> {
  const { rows } = await sql`
    UPDATE manual_listings SET
      mls_number       = COALESCE(${data.mls_number ?? null}, mls_number),
      spark_listing_key = COALESCE(${data.spark_listing_key ?? null}, spark_listing_key),
      address          = COALESCE(${data.address ?? null}, address),
      city             = COALESCE(${data.city ?? null}, city),
      state            = COALESCE(${data.state ?? null}, state),
      zip              = COALESCE(${data.zip ?? null}, zip),
      price            = COALESCE(${data.price ?? null}, price),
      beds             = COALESCE(${data.beds ?? null}, beds),
      baths            = COALESCE(${data.baths ?? null}, baths),
      sqft             = COALESCE(${data.sqft ?? null}, sqft),
      property_type    = COALESCE(${data.property_type ?? null}, property_type),
      status           = COALESCE(${data.status ?? null}, status),
      year_built       = COALESCE(${data.year_built ?? null}, year_built),
      lot_size         = COALESCE(${data.lot_size ?? null}, lot_size),
      hoa_dues         = COALESCE(${data.hoa_dues ?? null}, hoa_dues),
      garage_spaces    = COALESCE(${data.garage_spaces ?? null}, garage_spaces),
      description      = COALESCE(${data.description ?? null}, description),
      neighborhood     = COALESCE(${data.neighborhood ?? null}, neighborhood),
      latitude         = COALESCE(${data.latitude ?? null}, latitude),
      longitude        = COALESCE(${data.longitude ?? null}, longitude),
      image_urls       = COALESCE(${data.image_urls != null ? (data.image_urls.length > 0 ? `{${data.image_urls.map((u: string) => `"${u.replace(/"/g, '\\"')}"`).join(",")}}` : "{}") : null}::text[], image_urls),
      list_office_name = COALESCE(${data.list_office_name ?? null}, list_office_name),
      is_active        = COALESCE(${data.is_active ?? null}, is_active),
      sort_priority    = COALESCE(${data.sort_priority ?? null}, sort_priority),
      updated_at       = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as ManualListing;
}

export async function deleteManualListing(id: string): Promise<void> {
  await sql`DELETE FROM manual_listings WHERE id = ${id}`;
}
