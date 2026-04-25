import { notFound } from "next/navigation";
import {
  getLandlordById,
  listDocumentsForLandlord,
  listInvoicesForLandlord,
  listPropertiesForOwner,
  listServiceLogForProperty,
} from "@/lib/db/landlords";
import AdminHeader from "../AdminHeader";
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
      <AdminHeader trail={[
        { label: "Admin", href: "/admin" },
        { label: "Landlords", href: "/admin/landlords" },
        { label: landlord.name },
      ]} />

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
