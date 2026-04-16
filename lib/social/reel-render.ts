import { put } from "@vercel/blob";
import fs from "node:fs/promises";

/**
 * Reel MP4 upload helpers.
 *
 * Phase 2 local-MVP: the render is kicked off by
 * `scripts/render-reel-local.ts`, which writes an MP4 to `./out/` and then
 * calls `uploadReelToBlob()` here to push it to Vercel Blob and stamp
 * `social_posts.video_url`.
 *
 * Phase 2 production (Lambda, later): this same file will grow a
 * `renderReelOnLambda()` function that calls `renderMediaOnLambda`, polls
 * for the S3 URL, streams it down, and re-uploads to Blob — so the admin
 * UI can reference a stable first-party URL. Keeping the upload helper in
 * this module now means that later wiring is a one-import change.
 */

export interface UploadReelResult {
  /** Public Blob URL for the MP4. */
  url: string;
  /** MP4 byte size — surfaced for logging / sanity-checking. */
  size: number;
}

/**
 * Upload a local MP4 file to Vercel Blob. Filename pattern matches the
 * Story / Carousel conventions (social/<format>/<slug>-<yyyymmdd>.mp4)
 * so the Blob console groups them nicely.
 *
 * `addRandomSuffix: true` means re-renders of the same slug/date don't
 * collide. The returned URL is the one to stamp on `social_posts.video_url`.
 */
export async function uploadReelToBlob(
  filePath: string,
  slug: string,
  opts?: { blobToken?: string }
): Promise<UploadReelResult> {
  const body = await fs.readFile(filePath);
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const pathname = `social/reels/${slug}-${yyyymmdd}.mp4`;

  const { url } = await put(pathname, body, {
    access: "public",
    contentType: "video/mp4",
    addRandomSuffix: true,
    token: opts?.blobToken ?? process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { url, size: body.byteLength };
}
