import { requireLandlord } from "@/lib/auth/require-landlord";
import DashboardHeader from "../DashboardHeader";
import BillingActions from "./BillingActions";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function LandlordBillingPage() {
  const { user, landlord } = await requireLandlord();
  const ready = !!landlord.billing_setup_at && !!landlord.default_payment_method_id;

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <DashboardHeader email={user.email ?? ""} />

      <div className="mx-auto max-w-[760px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Billing</h1>
        <p className="mb-8 text-[14px] text-muted">
          One saved payment method. We charge it monthly on the 1st for the prior month&apos;s service log entries plus your management fee. No subscription — you only pay for what was actually done.
        </p>

        <div className="rounded-[10px] border border-border bg-white p-6">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Status</div>
          {ready ? (
            <>
              <div className="font-serif text-[22px] font-medium tracking-[-0.01em] text-emerald-700">
                Card on file
              </div>
              <p className="mt-1 text-[13px] text-muted">
                Set up {fmtDate(landlord.billing_setup_at)}. Update or remove your card via the Stripe billing portal.
              </p>
            </>
          ) : (
            <>
              <div className="font-serif text-[22px] font-medium tracking-[-0.01em]">No payment method yet</div>
              <p className="mt-1 text-[13px] text-muted">
                Add a card to enable monthly billing. We never charge it without a corresponding service or fee on record.
              </p>
            </>
          )}

          <div className="mt-6">
            <BillingActions ready={ready} />
          </div>
        </div>

        <p className="mt-6 text-[12px] text-muted">
          We use Stripe Checkout for card setup; your card data never touches Givenest&apos;s servers.
        </p>
      </div>
    </div>
  );
}
