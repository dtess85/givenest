/**
 * Local Reel renderer — pulls one listing snapshot, builds a ReelScript,
 * renders the WalkthroughCinematic composition to an MP4 via Remotion's Node
 * renderer, writes the file to `./out/`.
 *
 * Two source modes:
 *   (A) HTTP (default): fetch the most-recent draft REEL row via the running
 *       Next.js dev server at http://localhost:3000/api/admin/social/latest-reel.
 *       The dev server can reach Supabase; a direct `pg` connection from this
 *       script cannot (Supabase's direct DB host is IPv6-only, and macOS's
 *       default resolver only requests A records).
 *   (B) File: `--from <file.json>` loads `{ property, officeName, slug }` from
 *       a local JSON. Used when you want a fully offline render.
 *
 * Usage:
 *   pnpm remotion:render                      # pull latest draft REEL from local dev
 *   pnpm remotion:render --slug <slug>        # pull a specific slug from local dev
 *   pnpm remotion:render --from ./demo.json   # render from a local snapshot JSON
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
import type { Property } from "@/lib/mock-data";
import type { ReelInputProps } from "../remotion/types";

const COMPOSITION_ID = "walkthrough-cinematic";
const OUT_DIR = path.resolve(process.cwd(), "out");
const DEV_BASE = process.env.DRAFT_BASE_URL ?? "http://localhost:3000";

interface ListingBundle {
  property: Property;
  officeName: string;
  slug: string;
}

/* -------------------------------------------------------------------------- */
/* Arg parsing — tiny, zero-dep                                               */
/* -------------------------------------------------------------------------- */

function parseArgs(argv: string[]): { slug?: string; fromFile?: string } {
  const args: { slug?: string; fromFile?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    const cur = argv[i];
    if (cur === "--slug" || cur === "-s") args.slug = argv[++i];
    else if (cur === "--from" || cur === "-f") args.fromFile = argv[++i];
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
  const { slug, fromFile } = parseArgs(process.argv);

  const src: ListingBundle = fromFile
    ? await loadFromFile(fromFile)
    : await fetchFromDevServer(slug);

  const { property, officeName, slug: listingSlug } = src;
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
  console.log(`[render-reel] selecting composition ${COMPOSITION_ID}…`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: COMPOSITION_ID,
    inputProps,
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const outputPath = path.join(
    OUT_DIR,
    `reel-${listingSlug}-${yyyymmdd}.mp4`
  );

  console.log(`[render-reel] rendering MP4 → ${outputPath}`);
  const start = Date.now();

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
