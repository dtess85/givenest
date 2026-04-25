"use client";

import { useState, useTransition } from "react";

/**
 * Two-button surface on the billing page. "Add card" → Stripe Checkout
 * (mode=setup) so the landlord saves a card via SetupIntent without paying
 * anything. "Manage card" → Stripe billing portal once a card is on file.
 *
 * Both endpoints return `{ url }` on success; we navigate the browser to
 * the Stripe-hosted page rather than redirecting server-side, so the URL
 * fragment (which the portal sometimes uses) survives the round trip.
 */
export default function BillingActions({ ready }: { ready: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(endpoint: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {ready ? (
          <>
            <button
              onClick={() => go("/api/landlord/billing/portal")}
              disabled={pending}
              className="rounded-md bg-coral px-5 py-[10px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
            >
              {pending ? "Opening…" : "Manage card / view receipts"}
            </button>
            <button
              onClick={() => go("/api/landlord/billing/checkout")}
              disabled={pending}
              className="rounded-md border border-border bg-white px-5 py-[10px] text-[14px] font-medium hover:border-coral hover:text-coral disabled:opacity-60"
            >
              Replace card
            </button>
          </>
        ) : (
          <button
            onClick={() => go("/api/landlord/billing/checkout")}
            disabled={pending}
            className="rounded-md bg-coral px-5 py-[10px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
          >
            {pending ? "Opening Stripe…" : "Add a card"}
          </button>
        )}
      </div>
      {error && (
        <div className="mt-3 rounded-md border border-[#F5C2C2] bg-[#FDE2E2] p-3 text-[13px] text-[#A31F1F]">
          {error}
        </div>
      )}
    </>
  );
}
