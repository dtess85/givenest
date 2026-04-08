import type { Metadata } from "next";
import { fetchSparkListing } from "@/lib/spark";
import { getManualListingById, manualListingToProperty } from "@/lib/db/listings";
import { fmt } from "@/lib/utils";

export async function generateMetadata(
  { params }: { params: { address: string } }
): Promise<Metadata> {
  const key = params.address;

  try {
    let property = null;

    if (key.startsWith("manual-")) {
      const id = key.slice("manual-".length);
      const row = await getManualListingById(id);
      if (row) property = manualListingToProperty(row);
    } else {
      property = await fetchSparkListing(key);
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
        url: `https://givenest.com/buy/${key}`,
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
