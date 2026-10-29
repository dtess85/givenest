import type { Metadata } from "next";
import "./lot71.css";

const siteUrl = "https://lot71designs.com";
const siteDescription =
  "A small develop-and-build studio in Gilbert, Arizona. We build the homes, then we sell them — every detail designed, every finish chosen.";

export const metadata: Metadata = {
  // metadataBase lets Next resolve OG / twitter image URLs against the
  // brand's own domain even when served from the Givenest Vercel app.
  metadataBase: new URL(siteUrl),
  title: {
    default: "LOT71 Designs — Build, remodel, and design in Gilbert, Arizona",
    template: "%s — LOT71 Designs",
  },
  description: siteDescription,
  applicationName: "LOT71 Designs",
  openGraph: {
    type: "website",
    siteName: "LOT71 Designs",
    title: "LOT71 Designs — Homes we build. Then we sell.",
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOT71 Designs",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  // The root layout (Givenest) pins icons to /favicon.png with
  // explicit metadata, which overrides the per-route icon convention.
  // Override back here so lot71 tabs show their own mark.
  icons: {
    icon: [{ url: "/lot71/icon.png", type: "image/png" }],
    shortcut: "/lot71/icon.png",
  },
};

// Wraps every /lot71/* page in the LOT71 brand surface — scoped background
// color and a shared stacking context the nav fixes against. Nav/Footer
// are chosen per-page because the home page has a transparent-over-hero nav
// and the inner pages have the solid variant.
export default function Lot71Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lot71-brand min-h-screen bg-[#FAFAF7] text-[#121212]">
      {children}
    </div>
  );
}
