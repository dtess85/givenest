/**
 * One-off: load out/wagon.json, classify its images with Anthropic vision,
 * reorder via sortImagesForSocial, and rewrite the file with the new image
 * order. Used before running `pnpm remotion:render --from out/wagon.json`
 * so the local renderer picks interior / exterior_back clips instead of
 * walking the raw MLS order (which ended on shed shots).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { classifyListingImages } from "@/lib/social/image-classifier";
import { sortImagesForSocial } from "@/lib/social/image-order";

async function main() {
  const file = path.resolve("out/wagon.json");
  const bundle = JSON.parse(await fs.readFile(file, "utf8")) as {
    property: { images: string[]; [k: string]: unknown };
    officeName: string;
    slug: string;
  };

  const imgs = bundle.property.images ?? [];
  console.log(`[reorder] classifying ${imgs.length} images…`);
  const classifications = await classifyListingImages(imgs);
  const ordered = sortImagesForSocial(imgs, classifications);

  console.log("\nNew order (first 10):");
  ordered.slice(0, 10).forEach((o, i) => {
    console.log(
      `  ${String(i + 1).padStart(2, " ")}  MLS#${String(o.originalIndex).padStart(2, " ")}  ${o.category}`
    );
  });

  bundle.property.images = ordered.map((o) => o.url);
  await fs.writeFile(file, JSON.stringify(bundle, null, 2));
  console.log(`\n[reorder] rewrote ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
