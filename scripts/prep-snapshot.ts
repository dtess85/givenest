/**
 * One-off: fetch a single Spark listing, classify its photos with Anthropic
 * vision, reorder into social-friendly sequence, and write the snapshot JSON
 * the render-reel-local script consumes via --from. Used to render a reel
 * for a listing that has no social_posts draft yet.
 *
 * Without the classifier pass we'd use raw MLS order — which for Sotheby's-
 * style listings usually puts 4–5 exterior/entrance shots up front. After
 * classification the reel opens on hero → kitchen → living → primary →
 * backyard.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fetchSparkListing } from "../lib/spark";
import { classifyListingImages } from "../lib/social/image-classifier";
import { sortImagesForSocial } from "../lib/social/image-order";

async function main() {
  const SLUG = process.argv[2];
  if (!SLUG) {
    console.error("usage: tsx scripts/prep-snapshot.ts <spark-listing-key>");
    process.exit(1);
  }

  const property = await fetchSparkListing(SLUG, { noCache: true });
  if (!property) {
    console.error(`listing ${SLUG} not found on Spark`);
    process.exit(1);
  }

  const images = property.images ?? [];
  console.log(`images: ${images.length} (unordered from Spark)`);

  let orderedImages: string[] = images;
  let orderedCategories: string[] = images.map(() => "other");
  if (process.env.ANTHROPIC_API_KEY && images.length > 0) {
    console.log(`classifying ${images.length} images with Anthropic Vision…`);
    const classifications = await classifyListingImages(images);
    const ordered = sortImagesForSocial(images, classifications);
    orderedImages = ordered.map((o) => o.url);
    orderedCategories = ordered.map((o) => o.category);
    console.log(
      `first 8 categories: ${orderedCategories.slice(0, 8).join(", ")}`
    );
  } else {
    console.warn(
      "ANTHROPIC_API_KEY not set — skipping image classification, " +
        "images will render in raw MLS order."
    );
  }

  const propertyWithOrderedImages = { ...property, images: orderedImages };
  const officeName = property.listOfficeName ?? "Listing brokerage";
  const bundle = {
    property: propertyWithOrderedImages,
    officeName,
    slug: SLUG,
    image_categories: orderedCategories,
  };

  mkdirSync(resolve(process.cwd(), "out"), { recursive: true });
  const outPath = resolve(process.cwd(), "out", `snapshot-${SLUG}.json`);
  writeFileSync(outPath, JSON.stringify(bundle, null, 2));

  console.log(`price:  ${property.price}`);
  console.log(`office: ${officeName}`);
  console.log(`wrote:  ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
