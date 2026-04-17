export const maxDuration = 60;

/**
 * Draft a day's worth of Instagram content for a single listing.
 *
 * Runs Mon/Wed/Fri (tier = ultra-luxury / luxury / entry-luxury) and produces
 * three rows in `social_posts`:
 *   - CAROUSEL: 5 Spark image URLs + long-form caption
 *   - STORY:    single Blob-hosted PNG composed via next/og + overlay caption
 *   - REEL:     placeholder row (video filled by the Phase 2 render cron)
 *
 * Protected by CRON_SECRET (Vercel auto-injects `Authorization: Bearer <secret>`
 * for scheduled jobs). Manual trigger pattern:
 *
 *   curl -X POST \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     'https://<host>/api/cron/social-draft-listing?day=mon'
 *
 * Accepts `?day=mon|wed|fri` for manual triggers. If omitted, derives the day
 * from today's weekday (UTC) — non-listing days are a no-op.
 *
 * NOTE (Phase 1): this route is NOT yet registered in `vercel.json`. Manual
 * trigger only until we've exercised it against a staging run.
 */

import { NextResponse } from "next/server";
import {
  buildCarouselCaption,
  buildReelCaption,
  buildReelScript,
  buildStoryOverlay,
} from "@/lib/social/caption";
import { dayFromDate, selectListingCandidate } from "@/lib/social/selection";
import { renderAndUploadStory } from "@/lib/social/story-render";
import { renderAndUploadCarouselSlides } from "@/lib/social/carousel-slide-render";
import { createDraft } from "@/lib/db/social-posts";
import type { ListingDay, SocialPostDraft } from "@/lib/social/types";
import { classifyListingImages } from "@/lib/social/image-classifier";
import { sortImagesForSocial, type OrderedImage } from "@/lib/social/image-order";

const CRON_SECRET = process.env.CRON_SECRET;

type HandlerResult =
  | { drafted: Array<{ id: string; format: "CAROUSEL" | "STORY" | "REEL"; slug: string }>; listingSlug: string }
  | { drafted: []; reason: string };

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request): Promise<NextResponse> {
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const dayParam = searchParams.get("day") as ListingDay | null;
  const day: ListingDay | null =
    dayParam && ["mon", "wed", "fri"].includes(dayParam)
      ? dayParam
      : dayFromDate(new Date());

  if (!day) {
    const result: HandlerResult = { drafted: [], reason: "not a listing day" };
    return NextResponse.json(result);
  }

  try {
    const candidate = await selectListingCandidate(day);
    if (!candidate) {
      const result: HandlerResult = { drafted: [], reason: "no qualifying candidate" };
      return NextResponse.json(result);
    }

    const { property: p, officeName, priceTier } = candidate;

    // Classify every listing image with Anthropic vision, then reorder into
    // social-friendly sequence. Cached on image-URL hash, so only the first
    // draft of a listing hits the API; re-runs are free. If the API key is
    // missing or classification fails outright, `ordered` falls back to the
    // original MLS order (category="other", conf=0 for everything).
    const sourceImages = p.images ?? [];
    let ordered: OrderedImage[];
    try {
      const classifications = await classifyListingImages(sourceImages);
      ordered = sortImagesForSocial(sourceImages, classifications);
    } catch (err) {
      console.error("[social-draft-listing] classification failed:", err);
      ordered = sourceImages.map((url, i) => ({
        url,
        category: "other" as const,
        confidence: 0,
        originalIndex: i,
      }));
    }
    const orderedUrls = ordered.map((o) => o.url);
    const orderedCategories = ordered.map((o) => o.category);

    // Freeze the reordered images into the snapshot so downstream consumers
    // (reel render, publisher cron) use the same order as the admin UI. We
    // also carry the parallel category array on the snapshot — the Reel row
    // leaves `image_urls` empty in Phase 1, so this is where the admin UI
    // reads per-clip categories from for REEL thumbnails.
    const snapshot = {
      ...p,
      images: orderedUrls,
      image_categories: orderedCategories,
      price_tier: priceTier,
    };

    // ── CAROUSEL ───────────────────────────────────────────────────────────
    // Composite each of the top 5 Spark photos into a branded 1080×1350 slide
    // (Lora tagline on slide 1, coral donation pill on every slide). Raw Spark
    // URLs would publish without any Givenest visual identity; the composited
    // PNGs are what actually get posted. If compositing fails for any reason
    // we fall back to the raw URLs so the draft still lands.
    const carouselSourceUrls = orderedUrls.slice(0, 5);
    const carouselCategories = orderedCategories.slice(0, 5);
    let carouselImageUrls: string[];
    try {
      const slides = await renderAndUploadCarouselSlides(p, carouselSourceUrls);
      carouselImageUrls = slides.map((s) => s.url);
    } catch (err) {
      console.error(
        "[social-draft-listing] CAROUSEL compositing failed for",
        p.slug,
        "— falling back to raw Spark URLs:",
        err
      );
      carouselImageUrls = carouselSourceUrls;
    }
    const carouselDraft: SocialPostDraft = {
      format: "CAROUSEL",
      listing_slug: p.slug,
      listing_source: "spark",
      listing_office_name: officeName,
      listing_snapshot: snapshot,
      caption: buildCarouselCaption(p, officeName),
      image_urls: carouselImageUrls,
      image_categories: carouselCategories,
    };
    const carouselRow = await createDraft(carouselDraft);

    // ── STORY ──────────────────────────────────────────────────────────────
    // Render-and-upload can fail (Blob hiccup, image source 404, etc.). We
    // swallow + log so a Story failure doesn't block the Carousel/Reel rows.
    const overlay = buildStoryOverlay(p);
    let storyRowId: string | null = null;
    try {
      const { url: storyUrl } = await renderAndUploadStory(p);
      const storyDraft: SocialPostDraft = {
        format: "STORY",
        listing_slug: p.slug,
        listing_source: "spark",
        listing_office_name: officeName,
        listing_snapshot: snapshot,
        caption: [overlay.topStrip, overlay.address, overlay.specs, overlay.price, overlay.donationBadge]
          .join(" · "),
        image_urls: [storyUrl],
      };
      const storyRow = await createDraft(storyDraft);
      storyRowId = storyRow.id;
    } catch (err) {
      console.error("[social-draft-listing] STORY render failed for", p.slug, err);
    }

    // ── REEL ───────────────────────────────────────────────────────────────
    // Phase 1: insert the row with video_url=null and empty image_urls. The
    // Phase 2 render cron picks it up and fills in the MP4. We feed the
    // reordered images into the reel script so clip 1 = hero, clip 2 = best
    // kitchen, etc. Rather than the raw MLS order.
    const reorderedProperty = { ...p, images: orderedUrls };
    const reelScript = buildReelScript(reorderedProperty, officeName);
    const reelDraft: SocialPostDraft = {
      format: "REEL",
      listing_slug: p.slug,
      listing_source: "spark",
      listing_office_name: officeName,
      listing_snapshot: snapshot,
      caption: buildReelCaption(p, officeName),
      image_urls: [],
      reel_hook_id: reelScript.hookId,
      reel_cta_id: reelScript.ctaId,
    };
    const reelRow = await createDraft(reelDraft);

    const drafted: HandlerResult = {
      listingSlug: p.slug,
      drafted: [
        { id: carouselRow.id, format: "CAROUSEL", slug: p.slug },
        ...(storyRowId ? [{ id: storyRowId, format: "STORY" as const, slug: p.slug }] : []),
        { id: reelRow.id, format: "REEL", slug: p.slug },
      ],
    };
    return NextResponse.json(drafted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[social-draft-listing] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
