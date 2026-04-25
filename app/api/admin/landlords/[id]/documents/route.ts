/**
 * POST /api/admin/landlords/[id]/documents
 *
 * Multipart upload — admin attaches a PMA / lease / inspection / statement
 * PDF (or any file) to a landlord, optionally scoped to one of their
 * properties. The file goes to Vercel Blob; we store the public URL +
 * metadata in `landlord_documents`.
 *
 * Blob path: `landlord-docs/<landlord_id>/<random>-<sanitized-filename>`.
 * The random prefix prevents filename guessing — public Blob URLs are
 * already random-suffixed by Vercel, but the prefix gives us a clean
 * collision-free namespace within a single landlord folder for the rare
 * case of two docs with the same filename.
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { assertAdmin } from "@/lib/auth/require-admin";
import {
  createDocument,
  getLandlordById,
  getPropertyById,
  type LandlordDocKind,
} from "@/lib/db/landlords";
import { sendDocumentUploadedNotification } from "@/lib/email/landlord";

const DOC_KINDS: LandlordDocKind[] = [
  "pma",
  "lease",
  "inspection",
  "statement",
  "other",
];

// Browsers/old phones occasionally upload absurdly large attachments. 25 MB
// is more than enough for a scanned PMA + lease — go bigger only if needed.
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let admin;
  try {
    admin = await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const landlord = await getLandlordById(params.id);
  if (!landlord) {
    return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
  }

  // FormData parser — required for multipart uploads. Browser sends the file
  // under "file"; we accept additional text fields for kind/title/property.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB limit` },
      { status: 413 }
    );
  }

  const kindStr = (form.get("kind") as string) || "other";
  const kind = (DOC_KINDS as string[]).includes(kindStr)
    ? (kindStr as LandlordDocKind)
    : "other";
  const title = ((form.get("title") as string) || file.name).trim();
  const propertyIdRaw = form.get("property_id");
  const propertyId = typeof propertyIdRaw === "string" && propertyIdRaw ? propertyIdRaw : null;

  // If a property scope was given, confirm it belongs to THIS landlord —
  // prevents accidental cross-landlord attachment via a swapped property_id.
  if (propertyId) {
    const property = await getPropertyById(propertyId);
    if (!property || property.owner_id !== landlord.id) {
      return NextResponse.json(
        { error: "property_id does not belong to this landlord" },
        { status: 400 }
      );
    }
  }

  // Sanitize: keep alphanumerics, dashes, underscores, dots. Other chars
  // (including spaces) become underscores. Limits the on-disk path to
  // safe characters even with weird filenames.
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const prefix = crypto.randomUUID().slice(0, 8);
  const blobPath = `landlord-docs/${landlord.id}/${prefix}-${sanitized}`;

  const { url } = await put(blobPath, file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
    allowOverwrite: false,
  });

  const doc = await createDocument({
    landlord_id: landlord.id,
    property_id: propertyId,
    kind,
    title: title || file.name,
    blob_url: url,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: admin.userId,
  });

  // Notify the landlord (respects comm_prefs.email). Fire-and-forget.
  void sendDocumentUploadedNotification(landlord, doc);

  return NextResponse.json({ document: doc });
}
