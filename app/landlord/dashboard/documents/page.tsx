import { requireLandlord } from "@/lib/auth/require-landlord";
import {
  listDocumentsForLandlord,
  listPropertiesForOwner,
} from "@/lib/db/landlords";
import DashboardHeader from "../DashboardHeader";

export const dynamic = "force-dynamic";

const DOC_KIND_LABEL: Record<string, string> = {
  pma: "Property management agreement",
  lease: "Lease",
  inspection: "Inspection",
  statement: "Statement",
  other: "Other",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function LandlordDocumentsPage() {
  const { user, landlord } = await requireLandlord();
  const [documents, properties] = await Promise.all([
    listDocumentsForLandlord(landlord.id),
    listPropertiesForOwner(landlord.id),
  ]);
  const propertyById = new Map(properties.map((p) => [p.id, p]));

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <DashboardHeader email={user.email ?? ""} />

      <div className="mx-auto max-w-[860px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Documents</h1>
        <p className="mb-8 text-[14px] text-muted">
          Property management agreement, lease copies, inspection reports, and monthly statements. Givenest staff upload these as they&apos;re created — reach out if anything is missing.
        </p>

        {documents.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border bg-white/50 p-8 text-center text-[13px] text-muted">
            No documents on file yet.
          </div>
        ) : (
          <div className="rounded-[10px] border border-border bg-white">
            {documents.map((d, i) => {
              const property = d.property_id ? propertyById.get(d.property_id) : null;
              return (
                <div
                  key={d.id}
                  className={`flex items-center justify-between gap-4 p-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div>
                    <div className="text-[14px] font-medium">{d.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      <span className="rounded-full bg-[#EEE8FF] px-2 py-0.5 text-[10px] font-semibold text-[#5E3ABF]">
                        {DOC_KIND_LABEL[d.kind] ?? d.kind}
                      </span>
                      <span className="ml-2">Uploaded {fmtDate(d.uploaded_at)}</span>
                      {property && <span className="ml-2">· {property.address}</span>}
                      {!property && d.property_id == null && <span className="ml-2">· All properties</span>}
                    </div>
                  </div>
                  <a
                    href={d.blob_url}
                    target="_blank"
                    rel="noopener"
                    className="rounded-md border border-border bg-white px-4 py-[8px] text-[13px] font-medium hover:border-coral hover:text-coral"
                  >
                    View / download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
