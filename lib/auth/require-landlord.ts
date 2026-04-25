/**
 * Server-side helpers that gate /landlord/* pages and API routes.
 *
 * Why not in middleware? Middleware runs on the Edge runtime by default in
 * Next 14, where `pg.Pool` (Node-only) can't connect. So middleware does the
 * auth-cookie check, and these helpers do the role binding via Postgres.
 *
 * Pattern (mirrors `assertAdmin()` in app/admin/social/actions.ts):
 *   - `requireLandlord()` — call from layouts/pages/route handlers. Returns
 *     `{ user, landlord }` on success. Redirects (in pages) or throws
 *     (in route handlers) if the user isn't a landlord.
 *   - `getLandlordOrNull()` — same lookup but without redirecting; useful
 *     when the page can render in both states (e.g. landing pages).
 *
 * On first login after an admin invite, `landlords.auth_user_id` is NULL.
 * The bind step here matches by case-insensitive email and stamps
 * `auth_user_id` so subsequent requests are O(1) on the indexed column.
 */

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  bindLandlordAuthUser,
  getLandlordByAuthUserId,
  getLandlordByEmail,
  type Landlord,
} from "@/lib/db/landlords";

export interface LandlordSession {
  user: User;
  landlord: Landlord;
}

/**
 * Resolve the current request's landlord row, or null if the visitor isn't
 * authenticated / isn't a landlord. Doesn't redirect — caller handles flow.
 */
export async function getLandlordOrNull(): Promise<LandlordSession | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fast path: indexed lookup by auth_user_id (set on first successful bind).
  let landlord = await getLandlordByAuthUserId(user.id);
  if (landlord) return { user, landlord };

  // Slow path: brand-new login — admin pre-created a landlord row with this
  // email but `auth_user_id` is still NULL. Bind it.
  if (!user.email) return null;
  const byEmail = await getLandlordByEmail(user.email);
  if (!byEmail) return null;
  if (byEmail.auth_user_id && byEmail.auth_user_id !== user.id) {
    // Email matched but a different auth_user_id is already bound — refuse
    // to silently overwrite. Admin would need to unblock manually.
    return null;
  }
  landlord = await bindLandlordAuthUser(byEmail.id, user.id);
  if (!landlord) return null;
  return { user, landlord };
}

/**
 * Page-side gate. Use in server components / page.tsx files. Redirects to
 * /landlord/login when not signed in, or to / when signed in but the user
 * isn't a landlord (matches the admin-routes pattern of redirecting away
 * rather than 403'ing).
 */
export async function requireLandlord(): Promise<LandlordSession> {
  const session = await getLandlordOrNull();
  if (!session) {
    // We don't know whether the failure was "not logged in" or "logged in
    // but not a landlord". The login page handles both — if they're already
    // signed in, it'll show a "this account isn't a landlord" hint.
    redirect("/landlord/login");
  }
  return session;
}

/**
 * Route-handler-side gate. Throws on failure with a status the caller can
 * surface as 401/403. Doesn't redirect — route handlers return JSON.
 */
export async function requireLandlordForApi(): Promise<LandlordSession> {
  const session = await getLandlordOrNull();
  if (!session) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return session;
}
