/**
 * Dev script: pick one AZ listing from Spark, classify its photos, show the
 * proposed Carousel + Reel ordering. No DB writes to social_posts — but the
 * per-image classifications DO get cached in `listing_image_classifications`
 * so subsequent drafter runs pick them up for free.
 *
 * Usage:
 *   npm run test:classifier                 # default: one luxury tier listing
 *   npm run test:classifier -- --tier=ultra # ultra/luxury/entry
 */
import { selectListingCandidate } from "@/lib/social/selection";
import { classifyListingImages } from "@/lib/social/image-classifier";
import { sortImagesForSocial } from "@/lib/social/image-order";
import type { ListingDay } from "@/lib/social/types";

const TIER_TO_DAY: Record<string, ListingDay> = {
  ultra: "mon",
  luxury: "wed",
  entry: "fri",
};

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find((a) => a.startsWith("--tier="))?.split("=")[1] ?? "luxury";
  const day = TIER_TO_DAY[tierArg];
  if (!day) {
    console.error(`Unknown tier: ${tierArg}. Use ultra | luxury | entry.`);
    process.exit(1);
  }

  console.log(`\n[test-image-classifier] picking a ${tierArg} listing…\n`);
  const candidate = await selectListingCandidate(day);
  if (!candidate) {
    console.error("No candidate available for tier.");
    process.exit(1);
  }

  const { property: p, officeName } = candidate;
  const imgs = p.images ?? [];
  console.log(`Selected: ${p.address}, ${p.city}`);
  console.log(`  Price: $${p.price.toLocaleString()}   Photos: ${imgs.length}`);
  console.log(`  Listed by: ${officeName}\n`);

  console.log(`[classifier] running on ${imgs.length} images…`);
  const t0 = Date.now();
  const classifications = await classifyListingImages(imgs);
  console.log(`  ↳ ${Date.now() - t0}ms\n`);

  console.log("Raw (MLS order):");
  classifications.forEach((c, i) => {
    const pct = (c.confidence * 100).toFixed(0).padStart(3, " ");
    console.log(`  ${String(i).padStart(2, " ")}  ${c.category.padEnd(18, " ")}  ${pct}%`);
  });

  const ordered = sortImagesForSocial(imgs, classifications);

  console.log("\n→ Social-sorted (Carousel takes slots 1–5, Reel takes slots 1–6):");
  ordered.forEach((o, i) => {
    const marker = i < 5 ? "📸" : i < 6 ? "🎬" : "  ";
    const pct = (o.confidence * 100).toFixed(0).padStart(3, " ");
    console.log(
      `  ${marker} slot ${String(i + 1).padStart(2, " ")}  MLS#${String(o.originalIndex).padStart(2, " ")}  ` +
        `${o.category.padEnd(18, " ")}  ${pct}%`
    );
  });

  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
