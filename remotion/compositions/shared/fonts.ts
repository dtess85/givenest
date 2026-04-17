import { loadFont as loadLora } from "@remotion/google-fonts/Lora";

/**
 * Load Lora 600 normal + Lora 600 italic (brand tagline) for use inside
 * Remotion compositions. `@remotion/google-fonts` resolves the TTF files at
 * import time and wires them into the Remotion bundler so the headless
 * Chromium that renders frames has the font available.
 *
 * Call once per composition module (idempotent at the SDK level — it caches
 * resolved fonts by style). The SDK's `loadFont(style, options)` signature
 * takes exactly one style string per call, so we fire two.
 *
 * Mirrors the server-side font loading we do in `lib/social/brand-overlay.tsx`
 * for the next/og renderer, but tailored to Remotion's import machinery.
 */
export const loadFonts = () => {
  loadLora("normal", { subsets: ["latin"], weights: ["600"] });
  loadLora("italic", { subsets: ["latin"], weights: ["600"] });
};
