import { ImageResponse } from "next/og";
import { put } from "@vercel/blob";
import type { Property } from "@/lib/mock-data";
import { buildStoryOverlay } from "@/lib/social/caption";

/**
 * Render a 9:16 (1080×1920) Story image: listing photo cropped-to-fit with
 * text overlays composited on top via Next.js built-in `ImageResponse`
 * (Satori-backed JSX → PNG). Upload the PNG to `@vercel/blob` and return its
 * public HTTPS URL — stored as `image_urls[0]` on the STORY draft row.
 *
 * Why `next/og`: zero-install, no sharp/FFmpeg, already available in the
 * Next.js runtime. Story images are the one thing we DO need to compose
 * (vs. Carousels which just reference Spark image URLs verbatim).
 */

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

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
  const overlay = buildStoryOverlay(p);
  const primaryImage = p.images?.[0];
  if (!primaryImage) {
    throw new Error(`[story-render] listing ${p.slug} has no primary image`);
  }

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#000",
          fontFamily: "Georgia, serif",
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
        {/* Dark scrim so overlay text stays legible on any photo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.80) 100%)",
            display: "flex",
          }}
        />
        {/* Top strip */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#fff",
            fontSize: 44,
            letterSpacing: 4,
            fontFamily: "sans-serif",
            fontWeight: 600,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {overlay.topStrip}
        </div>
        {/* Bottom content block: address + specs + price + donation + CTA */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 160,
            padding: "0 80px",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 76, lineHeight: 1.1, fontWeight: 600 }}>
            {overlay.address}
          </div>
          <div
            style={{
              fontSize: 42,
              fontFamily: "sans-serif",
              opacity: 0.92,
            }}
          >
            {overlay.specs}
          </div>
          <div style={{ fontSize: 64, fontWeight: 700 }}>{overlay.price}</div>
          <div
            style={{
              alignSelf: "flex-start",
              marginTop: 12,
              padding: "16px 28px",
              backgroundColor: "#E85A4F",
              color: "#fff",
              fontSize: 34,
              fontFamily: "sans-serif",
              fontWeight: 600,
              borderRadius: 999,
              display: "flex",
            }}
          >
            {overlay.donationBadge}
          </div>
        </div>
        {/* Bottom strip CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#fff",
            fontSize: 36,
            fontFamily: "sans-serif",
            letterSpacing: 2,
            opacity: 0.85,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {overlay.bottomStrip}
        </div>
      </div>
    ),
    {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  // @vercel/blob's PutBody expects Buffer/Blob/stream — a raw Uint8Array isn't
  // assignable. Wrap in a Node Buffer (zero-copy view over the same bytes).
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
