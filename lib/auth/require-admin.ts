/**
 * Admin gate — wraps the existing `ADMIN_EMAILS`-list pattern that's already
 * enforced at the middleware level for /admin/* routes. Server actions and
 * route handlers re-run the check as defense-in-depth, since they can also
 * be invoked from outside an /admin/* page load.
 *
 * The same list (env `ADMIN_EMAILS`, comma-separated, falls back to the two
 * founders) is also referenced in `middleware.ts`. Keep the env var as the
 * single source of truth.
 */

import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ?? "dustin@givenest.com,kyndall@givenest.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

export interface AdminSession {
  email: string;
  /** Supabase auth.users id — useful as `invited_by` / `created_by` audit
   *  columns on landlord/document/service-log inserts. */
  userId: string;
}

export async function assertAdmin(): Promise<AdminSession> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return { email, userId: user!.id };
}
