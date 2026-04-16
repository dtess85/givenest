import React from "react";

/**
 * Shared Givenest brand treatment for all social image composition
 * (Stories, Carousel slides, and Phase 2 Reel hooks). One source of truth
 * for colors, tagline copy, donation-pill shape, and font loading so
 * every composed image looks like it came off the same press.
 */

/* -------------------------------------------------------------------------- */
/* Brand constants                                                            */
/* -------------------------------------------------------------------------- */

export const BRAND = {
  /** Coral accent used on hero italics and the donation pill. Matches
   *  Tailwind's `coral` token (globals.css → --coral). */
  coral: "#E85A4F",
  white: "#FFFFFF",
  black: "#000000",
};

/** Rotation pool of Lora taglines. Each post picks one deterministically
 *  from the listing slug so the same listing always gets the same tagline,
 *  but different listings get variety in the feed. */
export const TAGLINE_POOL = [
  { id: "does-good", text: "Every home does good" },
  { id: "funds-cause", text: "Every home funds a cause you choose." },
  { id: "next-home", text: "Your next home could fund a cause." },
  { id: "any-agent", text: "Work with any agent. Fund a cause." },
  { id: "1.8m", text: "1.8M+ charities. Your choice." },
] as const;

/** Deterministically pick a tagline from the pool based on a seed string
 *  (typically the listing slug). Same slug → same tagline every time. */
export function pickTagline(seed: string): (typeof TAGLINE_POOL)[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return TAGLINE_POOL[Math.abs(hash) % TAGLINE_POOL.length];
}

export const TAGLINE = {
  /** Default / fallback. Use `pickTagline(slug)` for rotation. */
  primary: TAGLINE_POOL[0].text,
  /** Shown on the donation pill. `{{AMOUNT}}` is replaced with the rendered
   *  dollar figure at compose time (e.g. "~$5,499"). */
  pillTemplate: "{{AMOUNT}} to a charity of your choice",
};

/* -------------------------------------------------------------------------- */
/* Font loading                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the Lora font bytes once per process and cache. `next/og`'s
 * `ImageResponse` needs TTF/OTF bytes passed in its `fonts` option —
 * Google Fonts' CSS2 endpoint points us at the right static URL, we
 * follow the redirect to grab bytes.
 *
 * Google Fonts serves a unique TTF per (family, weight, style) combo.
 * We want:
 *   - Lora 600 normal → used for "Every home does good" (primary)
 *   - Lora 600 italic → reserved for future "you choose." emphasis
 *
 * We fetch both on first use; subsequent calls within the same lambda
 * get the cached buffers.
 */
interface LoadedFonts {
  lora600: ArrayBuffer;
  lora600Italic: ArrayBuffer;
}

let _cachedFonts: LoadedFonts | null = null;
let _cachedFontsPromise: Promise<LoadedFonts> | null = null;

/** Grab a Google Fonts CSS2 stylesheet and pull the first `url(...)`
 *  pointing to a TTF out of it. We request as Googlebot UA so we get
 *  static TTF URLs instead of the woff2 served to modern browsers —
 *  Satori only reads TTF/OTF. */
async function fetchGoogleFontTtf(cssUrl: string): Promise<ArrayBuffer> {
  const cssRes = await fetch(cssUrl, {
    // Googlebot UA → serves TTF @font-face rules.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  if (!cssRes.ok) {
    throw new Error(`brand-overlay: Google Fonts CSS ${cssRes.status}`);
  }
  const css = await cssRes.text();
  const match = css.match(/url\((https:[^)]+)\)/);
  if (!match) {
    throw new Error("brand-overlay: no font URL in Google Fonts CSS");
  }
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) {
    throw new Error(`brand-overlay: font fetch ${fontRes.status}`);
  }
  return fontRes.arrayBuffer();
}

export async function loadBrandFonts(): Promise<LoadedFonts> {
  if (_cachedFonts) return _cachedFonts;
  if (_cachedFontsPromise) return _cachedFontsPromise;

  _cachedFontsPromise = (async () => {
    // NOTE: Google's CSS2 endpoint supports ital,wght@... for combined queries
    // but to keep parsing dead-simple we fetch each variant separately.
    const [lora600, lora600Italic] = await Promise.all([
      fetchGoogleFontTtf(
        "https://fonts.googleapis.com/css2?family=Lora:wght@600&display=swap"
      ),
      fetchGoogleFontTtf(
        "https://fonts.googleapis.com/css2?family=Lora:ital,wght@1,600&display=swap"
      ),
    ]);
    _cachedFonts = { lora600, lora600Italic };
    return _cachedFonts;
  })();

  return _cachedFontsPromise;
}

/** `fonts` array ready to drop into `new ImageResponse(…, { fonts: … })`. */
export async function brandFontsOption(): Promise<
  Array<{
    name: string;
    data: ArrayBuffer;
    style: "normal" | "italic";
    weight: 400 | 500 | 600 | 700;
  }>
> {
  const { lora600, lora600Italic } = await loadBrandFonts();
  return [
    { name: "Lora", data: lora600, style: "normal", weight: 600 },
    { name: "Lora", data: lora600Italic, style: "italic", weight: 600 },
  ];
}

/* -------------------------------------------------------------------------- */
/* Donation pill                                                              */
/* -------------------------------------------------------------------------- */

/** Render the coral "~$X to a cause of your choice" pill. `fontSize` /
 *  `padding` scale per format — Story is 9:16 (big), carousel slide is
 *  1080×1350 (medium). */
export function DonationPill({
  amountLabel,
  fontSize,
  paddingX,
  paddingY,
}: {
  /** Preformatted dollar string, e.g. "~$5,499". */
  amountLabel: string;
  fontSize: number;
  paddingX: number;
  paddingY: number;
}) {
  const text = TAGLINE.pillTemplate.replace("{{AMOUNT}}", amountLabel);
  return (
    <div
      style={{
        padding: `${paddingY}px ${paddingX}px`,
        backgroundColor: BRAND.coral,
        color: BRAND.white,
        fontSize,
        fontFamily: "sans-serif",
        fontWeight: 600,
        borderRadius: 999,
        display: "flex",
        alignSelf: "flex-start",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

/** Lora 600 tagline with semi-transparent dark background pill. */
export function BrandTagline({
  fontSize,
  color = BRAND.white,
  text,
}: {
  fontSize: number;
  color?: string;
  /** Override the tagline copy. Use `pickTagline(slug).text` for rotation. */
  text?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "Lora",
        fontWeight: 600,
        fontStyle: "italic",
        color,
        fontSize,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
        display: "flex",
        backgroundColor: "rgba(0,0,0,0.50)",
        padding: `${Math.round(fontSize * 0.22)}px ${Math.round(fontSize * 0.4)}px`,
        borderRadius: 20,
      }}
    >
      {text ?? TAGLINE.primary}
    </div>
  );
}
