import Link from "next/link";
import { listByStatus, type SocialPostRow } from "@/lib/db/social-posts";
import { listingDetailUrl } from "@/lib/constants/givenest";
import EditableCaption from "./EditableCaption";
import CopyButton from "./CopyButton";
import ScrollableHero, { type HeroImage } from "./ScrollableHero";
import GenerateReelPanel from "./GenerateReelPanel";
import PickClipsButton from "./PickClipsButton";

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

/** Human-readable label for image categories. */
const CATEGORY_LABEL: Record<string, string> = {
  exterior_front: "Front",
  exterior_back: "Backyard",
  aerial: "Aerial",
  kitchen: "Kitchen",
  living: "Living",
  dining: "Dining",
  primary_bedroom: "Primary BR",
  bedroom: "Bedroom",
  bath: "Bath",
  office: "Office",
  other_interior: "Interior",
  floorplan_or_map: "Floorplan",
  other: "Other",
};

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function PostCard({ row }: { row: SocialPostRow }) {
  const snap = row.listing_snapshot;
  const detailUrl = row.listing_slug ? listingDetailUrl(row.listing_slug) : null;

  /**
   * Which assets to surface as thumbnails under the hero preview, and what to
   * label each one.
   *   - CAROUSEL: `row.image_urls` holds the 5 slides in posting order.
   *   - REEL: Phase 1 doesn't have the rendered video yet (`image_urls=[]`).
   *           What *will* drive the Remotion render is `listing_snapshot.images[0..5]`,
   *           so show those as clip sources.
   *   - STORY: only the composed 9:16 PNG lives in `image_urls[0]` — already
   *            visible in the hero; no gallery needed.
   */
  const gallery: HeroImage[] = (() => {
    if (row.format === "CAROUSEL") {
      return (row.image_urls ?? []).map((url, i) => ({
        label: `Slide ${i + 1}`,
        url,
        category: row.image_categories?.[i] ?? null,
      }));
    }
    if (row.format === "REEL") {
      const sourceImages = (snap?.images ?? []).slice(0, 6);
      // REEL row has empty image_urls in Phase 1 — read the parallel category
      // array off the snapshot, which the drafter populates in lockstep.
      const snapCategories = snap?.image_categories ?? [];
      return sourceImages.map((url, i) => ({
        label: `Clip ${i + 1}`,
        url,
        category: snapCategories[i] ?? null,
      }));
    }
    return [];
  })();

  /** What to feed into <ScrollableHero>. For CAROUSEL and REEL this is the
   *  same list as `gallery` (slides / clips). For STORY, fall back to the
   *  single composed 9:16 PNG — arrows hide automatically when count ≤ 1. */
  const heroImages: HeroImage[] = (() => {
    if (gallery.length > 0) return gallery;
    // STORY (or any format with a standalone image URL but no multi-slide gallery)
    if (row.image_urls && row.image_urls.length > 0) {
      return row.image_urls.map((url, i) => ({
        label: `Image ${i + 1}`,
        url,
        category: row.image_categories?.[i] ?? null,
      }));
    }
    return [];
  })();
  const heroPlaceholder =
    row.format === "REEL" ? "Reel — video renders in Phase 2" : "No image";
  const galleryTitle =
    row.format === "CAROUSEL"
      ? `Carousel slides (${gallery.length})`
      : row.format === "REEL"
        ? `Reel source images (${gallery.length}${
            row.video_url
              ? ", video above"
              : ", awaiting render"
          })`
        : "";

  /** Match Instagram's native aspect ratio per format so the admin preview
   *  shows the full composed image without cropping:
   *    CAROUSEL → 4:5 (1080×1350)
   *    STORY    → 9:16 (1080×1920)
   *    REEL     → 9:16 (1080×1920)
   *    CHARITY  → 1:1  (placeholder until Phase 4)
   */
  const heroAspect =
    row.format === "CAROUSEL"
      ? "aspect-[4/5]"
      : row.format === "STORY" || row.format === "REEL"
        ? "aspect-[9/16]"
        : "aspect-square";

  // REEL rows swap the scrollable-hero for a <video> player once the
  // Remotion render has been uploaded and `video_url` is populated. Until
  // then they show the source-clips gallery (Phase 2 placeholder).
  const showReelVideo = row.format === "REEL" && !!row.video_url;

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white">
      {/* Hero — scrollable through all slides/clips. Aspect ratio matches
          the Instagram format so the full composed image is visible. */}
      <div className={`relative w-full bg-black ${heroAspect}`}>
        {showReelVideo ? (
          /* eslint-disable-next-line jsx-a11y/media-has-caption */
          <video
            src={row.video_url!}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <ScrollableHero
            images={heroImages}
            placeholderText={heroPlaceholder}
            categoryLabel={CATEGORY_LABEL}
          />
        )}
        {/* Top-left: format badge. `z-10` so it sits over the scroll chevrons. */}
        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${formatBadgeClass(row.format)}`}
        >
          {row.format}
        </span>
        {/* Top-right: status badge */}
        <span
          className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
        >
          {row.status}
        </span>
      </div>

      <div className="p-4">
        {/* Asset gallery — carousel slides or reel clip sources.
            Click any thumb to open the full-res image in a new tab. */}
        {gallery.length > 0 && (
          <div className="mb-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {galleryTitle}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {gallery.map((g, i) => (
                <a
                  key={i}
                  href={g.url}
                  target="_blank"
                  rel="noopener"
                  title={
                    g.category
                      ? `${g.label} · ${CATEGORY_LABEL[g.category] ?? g.category}`
                      : g.label
                  }
                  className="group relative block aspect-square overflow-hidden rounded-[4px] border border-border bg-[#F0EDEA] hover:border-coral transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.url}
                    alt={g.label}
                    className="h-full w-full object-cover"
                  />
                  {/* Category badge — always visible (small) so you can spot
                      classifier mistakes at a glance. */}
                  {g.category && (
                    <span className="absolute left-0.5 top-0.5 rounded-[2px] bg-black/60 px-1 py-[1px] text-[8px] font-medium uppercase tracking-wide text-white">
                      {CATEGORY_LABEL[g.category] ?? g.category}
                    </span>
                  )}
                  {/* Slide/Clip index overlay on hover */}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-[9px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {g.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

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

        {/* Caption — inline-editable */}
        <EditableCaption id={row.id} initialCaption={row.caption} />

        {/* Destination URL — not clickable in IG captions, surfaced here for
            manual use: Story link sticker, or Carousel/Reel "Learn More" CTA
            when boosted through Meta Ads Manager. */}
        {detailUrl && (
          <div className="mb-3 rounded-[6px] border border-border bg-[#FAF9F6] p-2.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {row.format === "STORY"
                  ? "Link sticker URL"
                  : "Learn More URL (paste into Meta Ads Manager when boosting)"}
              </span>
              <CopyButton text={detailUrl} />
            </div>
            <div className="truncate font-mono text-[11px] text-[#555]">
              {detailUrl}
            </div>
          </div>
        )}

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
            {row.format === "REEL" && snap && (
              <PickClipsButton
                rowId={row.id}
                addressLabel={`${snap.address} · ${snap.city}`}
                images={snap.images ?? []}
                imageCategories={snap.image_categories ?? []}
              />
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

        {/* Generate a reel on demand — produces a REEL draft for any listing */}
        <GenerateReelPanel />

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
