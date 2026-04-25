import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getLandlordById,
  listDocumentsForLandlord,
  listInvoicesForLandlord,
  listPropertiesForOwner,
  listServiceLogForProperty,
} from "@/lib/db/landlords";
import LandlordPageClient from "./LandlordPageClient";

export const dynamic = "force-dynamic";

export default async function AdminLandlordDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const landlord = await getLandlordById(params.id);
  if (!landlord) notFound();

  // Fetch everything we need to render the full edit surface in one shot.
  // Service log is keyed per-property, so we fetch the latest 50 for each
  // property here and ship the map down to the client.
  const [properties, documents, invoices] = await Promise.all([
    listPropertiesForOwner(params.id),
    listDocumentsForLandlord(params.id),
    listInvoicesForLandlord(params.id),
  ]);

  const serviceLogByProperty: Record<string, Awaited<ReturnType<typeof listServiceLogForProperty>>> = {};
  await Promise.all(
    properties.map(async (p) => {
      serviceLogByProperty[p.id] = await listServiceLogForProperty(p.id, 50);
    })
  );

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium text-white">
              give<span className="text-coral">nest</span>
            </a>
            <span className="text-white/30">|</span>
            <Link href="/admin" className="text-[13px] text-white/60 hover:text-white transition-colors">
              Admin
            </Link>
            <span className="text-white/30">/</span>
            <Link href="/admin/landlords" className="text-[13px] text-white/60 hover:text-white transition-colors">
              Landlords
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-[13px] text-white">{landlord.name}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <LandlordPageClient
          landlord={landlord}
          initialProperties={properties}
          initialDocuments={documents}
          initialInvoices={invoices}
          initialServiceLogByProperty={serviceLogByProperty}
        />
      </div>
    </div>
  );
}
