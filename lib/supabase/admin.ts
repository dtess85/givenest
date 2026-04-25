/**
 * Service-role Supabase client. Only call from server-side code (route
 * handlers, server actions, cron). Never expose this in a client bundle.
 *
 * Used for admin operations that bypass RLS and require elevated privileges:
 *   - `auth.admin.inviteUserByEmail()` — sends a magic-link invite to a new
 *     landlord. Requires SUPABASE_SERVICE_ROLE_KEY.
 *   - Any future admin-only auth.users mutations.
 *
 * NOT used for ordinary table reads/writes — those go through `pg.Pool`
 * with `lib/db/index.ts`'s `sql` tag. We only reach for this client when the
 * Supabase REST API is the only path (auth.users management is one such
 * case; pg can't insert into auth.users without bypassing Supabase's invite
 * flow entirely).
 */

import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
