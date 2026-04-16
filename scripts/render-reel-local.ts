/**
 * Local Reel renderer — pulls one listing snapshot, builds a ReelScript,
 * renders the WalkthroughCinematic composition to an MP4 via Remotion's Node
 * renderer, writes the file to `./out/`, then (by default) uploads the MP4
 * to Vercel Blob and stamps `social_posts.video_url` on the REEL row so it
 * shows up playable in `/admin/social`.
 *
 * Two source modes:
 *   (A) HTTP (default): fetch the most-recent draft REEL row via the running
 *       Next.js dev server at http://localhost:3000/api/dev/reel-source.
 *       The dev server can reach Supabase; a direct `pg` connection from this
 *       script cannot (Supabase's direct DB host is IPv6-only, and macOS's
 *       default resolver only requests A records).
 *   (B) File: `--from <file.json>` loads `{ property, officeName, slug }` from
 *       a local JSON. Used when you want a fully offline render.
 *
 * Usage:
 *   pnpm remotion:render                             # walkthrough-cinematic, upload+persist
 *   pnpm remotion:render --template quick-tour        # quick-tour template
 *   pnpm remotion:render --slug <slug>                # render a specific slug
 *   pnpm remotion:render --from ./demo.json           # render from a local snapshot JSON
 *   pnpm remotion:render --local-only                 # render MP4 to ./out/ only (no upload)
 */
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs/promises";

import { buildReelScript } from "@/lib/social/caption";
import { pickTagline } from "@/lib/social/brand-overlay";
import { uploadReelToBlob } from "@/lib/social/reel-render";
import type { Property } from "@/lib/mock-data";
import type { ReelInputProps } from "../remotion/types";

/** Registered composition IDs in remotion/Root.tsx. Keep in sync. */
const VALID_COMPOSITIONS = ["walkthrough-cinematic", "quick-tour"] as const;
type CompositionId = (typeof VALID_COMPOSITIONS)[number];

const DEFAULT_COMPOSITION: CompositionId = "walkthrough-cinematic";
const OUT_DIR = path.resolve(process.cwd(), "out");
const DEV_BASE = process.env.DRAFT_BASE_URL ?? "http://localhost:3000";

interface ListingBundle {
  property: Property;
  officeName: string;
  slug: string;
  /** Optional — when present we can PATCH video_url on the exact REEL row. */
  reelId?: string;
}

/* -------------------------------------------------------------------------- */
/* Arg parsing — tiny, zero-dep                                               */
/* -------------------------------------------------------------------------- */

function parseArgs(argv: string[]): {
  slug?: string;
  fromFile?: string;
  localOnly: boolean;
  template: CompositionId;
} {
  const args: {
    slug?: string;
    fromFile?: string;
    localOnly: boolean;
    template: CompositionId;
  } = {
    localOnly: false,
    template: DEFAULT_COMPOSITION,
  };
  for (let i = 2; i < argv.length; i++) {
    const cur = argv[i];
    if (cur === "--slug" || cur === "-s") args.slug = argv[++i];
    else if (cur === "--from" || cur === "-f") args.fromFile = argv[++i];
    else if (cur === "--local-only") args.localOnly = true;
    else if (cur === "--template" || cur === "-t") {
      const next = argv[++i] as CompositionId;
      if (!VALID_COMPOSITIONS.includes(next)) {
        console.error(
          `Unknown --template "${next}". Valid: ${VALID_COMPOSITIONS.join(", ")}`
        );
        process.exit(1);
      }
      args.template = next;
    }
  }
  return args;
}

/* -------------------------------------------------------------------------- */
/* Source A — HTTP fetch via dev server                                       */
/* -------------------------------------------------------------------------- */

async function fetchFromDevServer(slug?: string): Promise<ListingBundle> {
  const url = new URL("/api/dev/reel-source", DEV_BASE);
  if (slug) url.searchParams.set("slug", slug);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
  });
  if (!res.ok) {
    throw new Error(
      `dev-server fetch failed: ${res.status} ${await res.text().catch(() => "")}`
    );
  }
  const json = (await res.json()) as ListingBundle;
  if (!json.property?.images?.length) {
    throw new Error("dev-server returned listing without images");
  }
  return json;
}

/* -------------------------------------------------------------------------- */
/* Source B — file                                                            */
/* -------------------------------------------------------------------------- */

async function loadFromFile(filePath: string): Promise<ListingBundle> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as ListingBundle;
  if (!parsed.property || !parsed.officeName || !parsed.slug) {
    throw new Error(
      `${filePath}: expected { property, officeName, slug } JSON`
    );
  }
  return parsed;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const { slug, fromFile, localOnly, template } = parseArgs(process.argv);

  const src: ListingBundle = fromFile
    ? await loadFromFile(fromFile)
    : await fetchFromDevServer(slug);

  const { property, officeName, slug: listingSlug, reelId } = src;
  console.log(`[render-reel] template: ${template}`);
  console.log(`[render-reel] listing: ${property.address} (${listingSlug})`);
  console.log(`[render-reel] images: ${property.images?.length ?? 0}`);

  /* ---- Build input props ---------------------------------------------- */
  const tagline = pickTagline(listingSlug);
  const script = buildReelScript(property, officeName, {
    taglineText: tagline.text,
  });

  const inputProps: ReelInputProps = {
    hookText: script.hookText,
    ctaText: script.ctaText,
    taglineText: script.taglineText,
    donationLabel: script.donationLabel,
    officeName: script.officeName,
    city: script.city,
    clips: script.clips,
  };

  console.log(`[render-reel] hook: ${inputProps.hookText}`);
  console.log(`[render-reel] cta:  ${inputProps.ctaText}`);
  console.log(`[render-reel] tagline: ${inputProps.taglineText}`);

  /* ---- Bundle --------------------------------------------------------- */
  console.log(`[render-reel] bundling Remotion project…`);
  const bundleLocation = await bundle({
    entryPoint: path.resolve("remotion/index.ts"),
    webpackOverride: (c) => c,
  });

  /* ---- Select composition & render ----------------------------------- */
  // Cast to the generic Record shape Remotion's renderer API expects. Our
  // ReelInputProps interface has specific keys; Remotion's renderer is
  // generic over `Record<string, unknown>`. Same boundary-cast trick used
  // in remotion/Root.tsx at the Composition registration.
  const rendererInputProps = inputProps as unknown as Record<string, unknown>;

  console.log(`[render-reel] selecting composition ${template}…`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: template,
    inputProps: rendererInputProps,
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  // Template in the filename so renders of the same listing via different
  // templates don't clobber each other in ./out/.
  const outputPath = path.join(
    OUT_DIR,
    `reel-${listingSlug}-${template}-${yyyymmdd}.mp4`
  );

  console.log(`[render-reel] rendering MP4 → ${outputPath}`);
  const start = Date.now();

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: rendererInputProps,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      process.stdout.write(`\r[render-reel] progress: ${pct}%   `);
    },
  });

  const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
  const stats = await fs.stat(outputPath);
  console.log(
    `\n[render-reel] done in ${elapsedSec}s · ${(stats.size / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`[render-reel] output: ${outputPath}`);

  /* ---- Upload + persist (unless --local-only) ------------------------ */

  if (localOnly) {
    console.log(`[render-reel] --local-only: skipping Blob upload + DB update`);
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      `[render-reel] BLOB_READ_WRITE_TOKEN not set — skipping upload. ` +
        `Set it in .env.local or pass --local-only.`
    );
    return;
  }

  console.log(`[render-reel] uploading to Vercel Blob…`);
  const uploadStart = Date.now();
  const { url: blobUrl, size } = await uploadReelToBlob(outputPath, listingSlug, {
    template,
  });
  const uploadSec = ((Date.now() - uploadStart) / 1000).toFixed(1);
  console.log(
    `[render-reel] uploaded in ${uploadSec}s · ${(size / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`[render-reel] blob url: ${blobUrl}`);

  if (!reelId) {
    console.log(
      `[render-reel] no reelId in source bundle (likely --from a file) — ` +
        `skipping DB stamp`
    );
    return;
  }

  console.log(`[render-reel] stamping video_url on row ${reelId}…`);
  const patchRes = await fetch(`${DEV_BASE}/api/dev/reel-video-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
    },
    body: JSON.stringify({ id: reelId, videoUrl: blobUrl }),
  });
  if (!patchRes.ok) {
    throw new Error(
      `PATCH video_url failed: ${patchRes.status} ${await patchRes.text().catch(() => "")}`
    );
  }
  console.log(
    `[render-reel] DB stamped — admin preview should now play the Reel ✓`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
