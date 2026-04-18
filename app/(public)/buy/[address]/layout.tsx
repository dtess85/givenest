import type { Metadata } from "next";
import { fetchSparkListing } from "@/lib/spark";
import { getManualListingById, manualListingToProperty } from "@/lib/db/listings";
import { getSparkKeyByShortId } from "@/lib/db/listings-index";
import { parsePublicSlug } from "@/lib/short-id";
import { listingDetailUrl } from "@/lib/constants/givenest";
import { fmt } from "@/lib/utils";

export async function generateMetadata(
  { params }: { params: { address: string } }
): Promise<Metadata> {
  const slug = params.address;

  try {
    let property = null;

    if (slug.startsWith("manual-")) {
      const id = slug.slice("manual-".length);
      const row = await getManualListingById(id);
      if (row) property = manualListingToProperty(row);
    } else {
      const shortId = parsePublicSlug(slug);
      const sparkKey = shortId ? await getSparkKeyByShortId(shortId) : slug;
      if (sparkKey) property = await fetchSparkListing(sparkKey);
    }

    if (!property) {
      return { title: "Property | Givenest" };
    }

    const title = `${property.address} | ${fmt(property.price)} · Givenest`;
    const description = [
      property.beds ? `${property.beds} bed` : null,
      property.baths ? `${property.baths} bath` : null,
      property.sqft ? `${property.sqft.toLocaleString()} sqft` : null,
      property.city,
    ]
      .filter(Boolean)
      .join(" · ");

    const image = property.images?.[0];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: listingDetailUrl(property.slug),
        siteName: "Givenest",
        type: "website",
        ...(image && {
          images: [{ url: image, width: 1280, height: 960, alt: property.address }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return { title: "Property | Givenest" };
  }
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
