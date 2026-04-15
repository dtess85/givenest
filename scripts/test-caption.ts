/**
 * Dev-only sanity check for the social-post caption builders.
 *
 * Pulls a handful of real Spark listings in the luxury tier, runs each through
 * `buildCarouselCaption` / `buildReelCaption` / `buildStoryOverlay`, and prints
 * the result to stdout so a human can eyeball the output before we start
 * writing drafts to the database.
 *
 * Usage:
 *   pnpm tsx scripts/test-caption.ts
 *   pnpm tsx scripts/test-caption.ts --tier=ultra
 *
 * No DB writes, no Blob uploads, no network beyond Spark. Safe to run as often
 * as you like against staging credentials.
 */

import { fetchSparkListings } from "@/lib/spark";
import {
  buildCarouselCaption,
  buildReelCaption,
  buildStoryOverlay,
} from "@/lib/social/caption";
import { buildReelScript } from "@/lib/social/caption";

type Tier = "ultra" | "luxury" | "entry";

const TIER_FILTERS: Record<Tier, string> = {
  ultra: "ListPrice Ge 3000000",
  luxury: "ListPrice Ge 900000 And ListPrice Lt 3000000",
  entry: "ListPrice Ge 750000 And ListPrice Lt 900000",
};

function parseArgs(): { tier: Tier; limit: number } {
  const args = process.argv.slice(2);
  let tier: Tier = "luxury";
  let limit = 5;
  for (const a of args) {
    if (a.startsWith("--tier=")) tier = a.split("=")[1] as Tier;
    if (a.startsWith("--limit=")) limit = Number(a.split("=")[1]) || 5;
  }
  return { tier, limit };
}

async function main() {
  const { tier, limit } = parseArgs();
  const filter = [
    "StateOrProvince Eq 'AZ'",
    "(MlsStatus Eq 'Active' Or MlsStatus Eq 'Coming Soon')",
    TIER_FILTERS[tier],
    "(City Eq 'Scottsdale' Or City Eq 'Paradise Valley' Or City Eq 'Gilbert' Or City Eq 'Cave Creek' Or City Eq 'Queen Creek')",
  ].join(" And ");

  const { listings } = await fetchSparkListings(filter, Math.max(limit * 3, 30), 1, "-ListingContractDate");

  // Apply photo-quality filter just like the real selector
  const good = listings.filter((p) => (p.images?.length ?? 0) >= 25);
  if (good.length === 0) {
    console.error(`No qualifying listings found for tier=${tier}.`);
    process.exit(1);
  }

  const sample = good.slice(0, limit);
  console.log(`\n=== Caption preview (tier=${tier}, n=${sample.length}) ===\n`);

  for (const p of sample) {
    const office = p.listOfficeName ?? "(no office)";
    const divider = "─".repeat(72);
    console.log(divider);
    console.log(`Listing: ${p.address}, ${p.city}`);
    console.log(`         $${p.price.toLocaleString()}  ·  ${p.beds}bd/${p.baths}ba/${p.sqft}sqft`);
    console.log(`         Listed by ${office}  ·  ${p.images?.length ?? 0} photos`);
    console.log();

    console.log("── CAROUSEL CAPTION ──");
    console.log(buildCarouselCaption(p, office));
    console.log();

    console.log("── REEL CAPTION ──");
    console.log(buildReelCaption(p, office));
    console.log();

    console.log("── REEL SCRIPT (hook + CTA + clip overlays) ──");
    const script = buildReelScript(p, office);
    console.log(`hook (${script.hookId}): ${script.hookText}`);
    console.log(`cta  (${script.ctaId}): ${script.ctaText}`);
    script.clips.forEach((c, i) => {
      console.log(`  clip ${i + 1} [${c.kenBurns}]: ${c.overlay}`);
    });
    console.log();

    console.log("── STORY OVERLAY ──");
    const overlay = buildStoryOverlay(p);
    console.log(JSON.stringify(overlay, null, 2));
    console.log();
  }

  console.log(`Done. Previewed ${sample.length} listing(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
