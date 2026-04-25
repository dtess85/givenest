/**
 * DELETE /api/admin/documents/[id]
 *
 * Soft-deletes a landlord document — sets `deleted_at` so the row stays for
 * audit but is hidden from the landlord doc viewer. The Vercel Blob object
 * stays around (cheap; we don't bother purging unless storage cost grows).
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { softDeleteDocument } from "@/lib/db/landlords";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await softDeleteDocument(params.id);
  return NextResponse.json({ ok: true });
}
