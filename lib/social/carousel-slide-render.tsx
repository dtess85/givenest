import { ImageResponse } from "next/og";
import { put } from "@vercel/blob";
import type { Property } from "@/lib/mock-data";
import { calcGivingPool } from "@/lib/commission";
import {
  BRAND,
  BrandTagline,
  DonationPill,
  Wordmark,
  brandFontsOption,
  pickTagline,
} from "@/lib/social/brand-overlay";

/**
 * Render Instagram carousel slides as branded 1080×1350 (4:5 portrait) PNGs.
 * Each slide composites a listing photo full-bleed, then overlays the
 * "Every home does good" Lora tagline + coral "~$X to a cause of your choice"
 * donation pill — the same brand treatment used on Stories.
 *
 * Why 4:5: Instagram's maximum vertical aspect ratio in the feed. A 1:1 square
 * would waste ~25% of the visible real estate on phones. 4:5 is the canonical
 * "biggest-possible feed post" dimension.
 *
 * Every slide gets the same brand treatment: "Every home does good" Lora
 * tagline at the top, coral "~$X to a cause of your choice" pill at the
 * bottom-left. Consistent branding across the swipe means the Givenest
 * identity stays visible even if a viewer lingers on slide 3.
 *
 * Returns one uploaded Blob URL per input image. Uploads in parallel.
 */

const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1350;

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export interface RenderedCarouselSlide {
  url: string;
  size: number;
}

export async function renderAndUploadCarouselSlides(
  p: Property,
  imageUrls: string[],
  opts?: { blobToken?: string }
): Promise<RenderedCarouselSlide[]> {
  if (imageUrls.length === 0) return [];

  const donationLabel = `~${usd0.format(Math.round(calcGivingPool(p.price)))}`;
  const tagline = pickTagline(p.slug);
  const fonts = await brandFontsOption();
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const blobToken = opts?.blobToken ?? process.env.BLOB_READ_WRITE_TOKEN;

  return Promise.all(
    imageUrls.map((url, index) =>
      renderOneSlide({
        photoUrl: url,
        slug: p.slug,
        slideIndex: index,
        donationLabel,
        taglineText: tagline.text,
        fonts,
        yyyymmdd,
        blobToken,
      })
    )
  );
}

/** Render + upload a single branded slide. */
async function renderOneSlide({
  photoUrl,
  slug,
  slideIndex,
  donationLabel,
  taglineText,
  fonts,
  yyyymmdd,
  blobToken,
}: {
  photoUrl: string;
  slug: string;
  slideIndex: number;
  donationLabel: string;
  taglineText: string;
  fonts: Awaited<ReturnType<typeof brandFontsOption>>;
  yyyymmdd: string;
  blobToken: string | undefined;
}): Promise<RenderedCarouselSlide> {
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: BRAND.black,
          fontFamily: "Lora",
        }}
      >
        {/* Background photo, cover-fit to 4:5 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Scrim — seated at top (for the Lora tagline) and bottom (for the
            coral donation pill). The middle 45% stays clean so the listing
            photo reads through undisturbed. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.10) 28%, rgba(0,0,0,0.10) 58%, rgba(0,0,0,0.75) 100%)",
            display: "flex",
          }}
        />

        {/* "Every home does good" Lora tagline — top of every slide. */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 60,
            right: 60,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <BrandTagline fontSize={72} text={taglineText} maxWidth={960} />
        </div>

        {/* Donation pill: bottom-left on every slide. */}
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 120,
            display: "flex",
          }}
        >
          <DonationPill
            amountLabel={donationLabel}
            fontSize={45}
            paddingX={42}
            paddingY={21}
          />
        </div>

        {/* Persistent "givenest" wordmark — bottom-right. */}
        <div
          style={{
            position: "absolute",
            right: 56,
            bottom: 56,
            display: "flex",
          }}
        >
          <Wordmark fontSize={44} />
        </div>
      </div>
    ),
    {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fonts,
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  const body = Buffer.from(arrayBuffer);
  // Slide index in pathname so reruns overwrite predictably; random suffix
  // from Blob avoids clashes with concurrent re-runs.
  const pathname = `social/carousel/${slug}-${yyyymmdd}-slide${slideIndex + 1}.png`;

  const { url } = await put(pathname, body, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: true,
    token: blobToken,
  });

  return { url, size: body.byteLength };
}
