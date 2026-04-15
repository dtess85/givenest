import Link from "next/link";
import { listByStatus, type SocialPostRow } from "@/lib/db/social-posts";
import { listingDetailUrl } from "@/lib/constants/givenest";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return usd0.format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBadgeClass(format: SocialPostRow["format"]): string {
  switch (format) {
    case "CAROUSEL": return "bg-[#EEE8FF] text-[#5E3ABF]";
    case "STORY":    return "bg-[#FFF0E6] text-[#C8461F]";
    case "REEL":     return "bg-[#E6F6EC] text-[#1F7A40]";
    case "CHARITY":  return "bg-[#FFF8E0] text-[#8B6A00]";
  }
}

function statusBadgeClass(status: SocialPostRow["status"]): string {
  switch (status) {
    case "draft":      return "bg-[#F4F3EE] text-[#555]";
    case "rendering":  return "bg-[#E6F0FF] text-[#1F4FB8]";
    case "approved":   return "bg-[#E6F6EC] text-[#1F7A40]";
    case "publishing": return "bg-[#FFF0E6] text-[#C8461F]";
    case "published":  return "bg-[#1F7A40] text-white";
    case "failed":     return "bg-[#FDE2E2] text-[#A31F1F]";
    case "rejected":   return "bg-[#F0EDEA] text-[#777]";
    case "skipped":    return "bg-[#F0EDEA] text-[#777]";
  }
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function PostCard({ row }: { row: SocialPostRow }) {
  const snap = row.listing_snapshot;
  const previewImage: string | null = (() => {
    if (row.image_urls && row.image_urls.length > 0) return row.image_urls[0];
    if (snap?.images && snap.images.length > 0) return snap.images[0];
    return null;
  })();
  const detailUrl = row.listing_slug ? listingDetailUrl(row.listing_slug) : null;

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white">
      {/* Image */}
      <div className="relative h-[260px] w-full bg-[#F0EDEA]">
        {previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-muted">
            {row.format === "REEL" ? "Reel — video renders in Phase 2" : "No image"}
          </div>
        )}
        {/* Top-left: format badge */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${formatBadgeClass(row.format)}`}
        >
          {row.format}
        </span>
        {/* Top-right: status badge */}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
        >
          {row.status}
        </span>
      </div>

      <div className="p-4">
        {/* Listing specs */}
        {snap && (
          <div className="mb-3">
            <div className="text-[14px] font-medium">{snap.address}</div>
            <div className="text-[12px] text-muted">{snap.city}</div>
            <div className="mt-1 text-[12px] text-muted">
              {snap.beds ?? "—"} bd · {snap.baths ?? "—"} ba ·{" "}
              {snap.sqft?.toLocaleString() ?? "—"} sqft · {fmtPrice(snap.price)}
            </div>
            {row.listing_office_name && (
              <div className="mt-1 text-[11px] text-muted italic">
                Listed by {row.listing_office_name}
              </div>
            )}
          </div>
        )}

        {/* Caption */}
        <pre className="mb-3 max-h-[180px] overflow-auto whitespace-pre-wrap rounded-[6px] border border-border bg-[#FAF9F6] p-3 font-sans text-[12px] leading-relaxed text-[#333]">
          {row.caption}
        </pre>

        {/* Error (if any) */}
        {row.last_error_message && (
          <div className="mb-3 rounded-[6px] border border-[#F5C2C2] bg-[#FDE2E2] p-2 text-[11px] text-[#A31F1F]">
            {row.last_error_code ? `[${row.last_error_code}] ` : ""}
            {row.last_error_message}
          </div>
        )}

        {/* Meta + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span>Created {fmtDate(row.created_at)}</span>
            {snap?.mlsNumber && <span>MLS#{snap.mlsNumber}</span>}
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={row.caption} />
            {detailUrl && (
              <Link
                href={detailUrl}
                target="_blank"
                rel="noopener"
                className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral transition-colors"
              >
                View on Givenest
              </Link>
            )}
            {/* Phase 3: Approve / Reject / Post now (inert placeholders for now) */}
            <button
              disabled
              title="Approval wiring lands in Phase 3"
              className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] text-muted opacity-50"
            >
              Approve
            </button>
            <button
              disabled
              title="Approval wiring lands in Phase 3"
              className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] text-muted opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function AdminSocialPage() {
  let drafts: SocialPostRow[] = [];
  let recent: SocialPostRow[] = [];
  let loadError: string | null = null;

  try {
    [drafts, recent] = await Promise.all([
      listByStatus(["draft", "rendering"], 50),
      listByStatus(["approved", "publishing", "published", "failed", "rejected", "skipped"], 30),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {/* Header */}
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
            <span className="text-[13px] text-white">Social</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Social posts</h1>
        <p className="mb-8 text-[14px] text-muted">
          Instagram drafts land here from the Mon/Wed/Fri listing cron. Review,
          copy the caption, and post manually until auto-publish ships in Phase 3.
        </p>

        {loadError && (
          <div className="mb-6 rounded-[8px] border border-[#F5C2C2] bg-[#FDE2E2] p-3 text-[13px] text-[#A31F1F]">
            Failed to load posts: {loadError}
          </div>
        )}

        {/* Drafts */}
        <section className="mb-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-serif text-[20px] font-medium">Drafts</h2>
            <span className="text-[12px] text-muted">{drafts.length}</span>
          </div>
          {drafts.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-border bg-white/50 p-8 text-center text-[13px] text-muted">
              No drafts yet. Trigger the drafter with a CRON_SECRET-authenticated
              POST to <code>/api/cron/social-draft-listing?day=mon|wed|fri</code>.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-3">
              {drafts.map((row) => (
                <PostCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>

        {/* Recent / historical */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-serif text-[20px] font-medium">Recent</h2>
            <span className="text-[12px] text-muted">{recent.length}</span>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-border bg-white/50 p-6 text-center text-[13px] text-muted">
              Nothing here yet. Approved/published posts will appear after Phase 3 ships.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-3">
              {recent.map((row) => (
                <PostCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
