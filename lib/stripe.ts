/**
 * Shared Stripe client. Uses the API version pinned to the secret key in
 * the Stripe dashboard (omitting `apiVersion` defers to that). This avoids
 * the type mismatch we hit earlier when the SDK was upgraded but the inline
 * `apiVersion: "2024-06-20"` literal was left behind.
 *
 * Server-only — every call site is a route handler, server action, or cron.
 * Don't import from client components.
 */

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  cached = new Stripe(key);
  return cached;
}
