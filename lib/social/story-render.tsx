import { ImageResponse } from "next/og";
import { put } from "@vercel/blob";
import type { Property } from "@/lib/mock-data";
import { shortCity } from "@/lib/social/caption";
import { calcGivingPool } from "@/lib/commission";
import {
  BRAND,
  BrandTagline,
  DonationPill,
  brandFontsOption,
  pickTagline,
} from "@/lib/social/brand-overlay";

/**
 * Render a 9:16 (1080×1920) Story image: listing photo cropped-to-fit with
 * minimal brand overlays composited on top via Next.js built-in `ImageResponse`
 * (Satori-backed JSX → PNG). Upload the PNG to `@vercel/blob` and return its
 * public HTTPS URL — stored as `image_urls[0]` on the STORY draft row.
 *
 * Brand treatment (see `lib/social/brand-overlay.tsx`):
 *   - Top: rotated Lora tagline (e.g. "Every home does good", "1.8M+ charities.
 *     Your choice.", etc.) — picked deterministically from the listing slug.
 *   - Bottom: coral "~$X to a cause of your choice" donation pill + CTA.
 *   - NO address/specs/price — Stories are ephemeral, brand-forward visuals.
 *     The listing detail link goes in the Story link sticker at publish time.
 */

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export interface RenderedStory {
  /** Public HTTPS URL of the rendered PNG (hosted on Vercel Blob). */
  url: string;
  /** Bytes written. */
  size: number;
}

/**
 * Compose the 9:16 Story PNG + upload to Blob. Returns the public URL.
 *
 * Blob pathname is `social/stories/{slug}-{yyyymmdd}.png` so reruns of the
 * same day overwrite (Blob treats same pathname as replace via
 * `allowOverwrite: true`).
 */
export async function renderAndUploadStory(
  p: Property,
  opts?: { blobToken?: string }
): Promise<RenderedStory> {
  const primaryImage = p.images?.[0];
  if (!primaryImage) {
    throw new Error(`[story-render] listing ${p.slug} has no primary image`);
  }

  const city = shortCity(p.city);
  const donationLabel = `~${usd0.format(Math.round(calcGivingPool(p.price)))}`;
  const tagline = pickTagline(p.slug);
  const fonts = await brandFontsOption();

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
        {/* Background photo, cover-fit to 9:16 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt=""
          width={STORY_WIDTH}
          height={STORY_HEIGHT}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Dark scrim — heavier at top (tagline) and bottom (donation pill). */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.10) 25%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.70) 100%)",
            display: "flex",
          }}
        />

        {/* Top: kicker + rotated Lora tagline */}
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              color: BRAND.white,
              fontSize: 28,
              letterSpacing: 6,
              fontFamily: "sans-serif",
              fontWeight: 600,
              opacity: 0.85,
              display: "flex",
            }}
          >
            {`🏡 NEW AZ LISTING · ${city}`}
          </div>
          <BrandTagline fontSize={88} text={tagline.text} />
        </div>

        {/* Bottom: donation pill + CTA */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 140,
            padding: "0 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          <DonationPill
            amountLabel={donationLabel}
            fontSize={36}
            paddingX={36}
            paddingY={18}
          />
          <div
            style={{
              color: BRAND.white,
              fontSize: 34,
              fontFamily: "sans-serif",
              letterSpacing: 2,
              opacity: 0.85,
              display: "flex",
            }}
          >
            Tap to view on Givenest
          </div>
        </div>
      </div>
    ),
    {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      fonts,
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  const body = Buffer.from(arrayBuffer);
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const pathname = `social/stories/${p.slug}-${yyyymmdd}.png`;

  const { url } = await put(pathname, body, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: true,
    token: opts?.blobToken ?? process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { url, size: body.byteLength };
}
