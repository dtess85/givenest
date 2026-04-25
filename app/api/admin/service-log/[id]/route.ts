/**
 * DELETE /api/admin/service-log/[id]
 *
 * Removes an unbilled service-log entry (admin made a mistake, e.g. wrong
 * property or duplicate entry). Once `billed_at` is stamped the entry is
 * locked — the helper's WHERE clause refuses to delete billed rows so we
 * never desync the local mirror from a finalized Stripe invoice.
 */

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { deleteServiceLog } from "@/lib/db/landlords";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteServiceLog(params.id);
  return NextResponse.json({ ok: true });
}
