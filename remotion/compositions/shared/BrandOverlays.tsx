import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Reel-specific brand overlays. Mirrors the visual language used on Stories
 * and Carousel slides (see `lib/social/brand-overlay.tsx` / `story-render.tsx`)
 * so all three formats look like they came off the same press:
 *
 *   - White rounded-full pill + black text   → kicker ("NEW AZ LISTING · City")
 *   - Lora italic on semi-transparent black  → rotating brand tagline
 *   - Coral rounded-square pill              → donation callout
 *   - White rounded-full pill + black text   → end-card CTA ("Learn More" / "DM")
 *
 * Everything here is intentionally stateless / input-only so the render is
 * deterministic. Entry animations use `spring()` so hook/overlay/CTA pops in
 * naturally without a hard flash-in.
 */

const BRAND = {
  coral: "#E85A4F",
  white: "#FFFFFF",
  black: "#000000",
};

/* -------------------------------------------------------------------------- */
/* Dark scrim — softens overlays against busy listing photos.                 */
/* -------------------------------------------------------------------------- */

export const Scrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 25%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.70) 100%)",
    }}
  />
);

/* -------------------------------------------------------------------------- */
/* ClipFade — opacity ramp wrapper used for crossfades between clips.         */
/* -------------------------------------------------------------------------- */

/**
 * Wraps a clip so it fades in over `fadeInFrames`. Used by templates that
 * crossfade between beats (walkthrough-cinematic, details-closeup, lifestyle).
 * Quick-tour and price-reveal intentionally skip this for hard-cut pacing.
 *
 * The calling template places this INSIDE a `<Sequence>` whose duration
 * covers the clip + the fade-in — that's how one clip can fade in while the
 * previous one is still on screen. Stacking order in the AbsoluteFill tree
 * handles the crossfade visually; no explicit blend mode needed.
 */
export const ClipFade: React.FC<{
  fadeInFrames: number;
  children: React.ReactNode;
}> = ({ fadeInFrames, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/* -------------------------------------------------------------------------- */
/* Hook card — shown in first ~2s, big Lora statement on dark pill.           */
/* -------------------------------------------------------------------------- */

interface HookCardProps {
  hookText: string;
}

export const HookCard: React.FC<HookCardProps> = ({ hookText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring in over ~0.4s, then hold. We unmount the hook via <Sequence> in
  // the parent composition — here we just handle the entry ramp.
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.6 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        // Sit above the Wordmark (bottom: 240) — same clearance EndCard uses.
        paddingBottom: 340,
        paddingLeft: 60,
        paddingRight: 60,
      }}
    >
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          color: BRAND.white,
          fontSize: 44,
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.55)",
          padding: "20px 28px",
          borderRadius: 18,
          maxWidth: 820,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {hookText}
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/* Kicker — "NEW AZ LISTING · City" in the top safe area on every clip.       */
/* -------------------------------------------------------------------------- */

interface KickerProps {
  city: string;
}

export const Kicker: React.FC<KickerProps> = ({ city }) => {
  return (
    <div
      style={{
        position: "absolute",
        // Pulled deep into the safe area — Instagram's username avatar row
        // + audio track eats ~220px from the top of a 1920px-tall Reel on
        // modern phones. 100 used to get clipped by the audio track.
        top: 240,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: BRAND.white,
          color: BRAND.black,
          fontSize: 36,
          letterSpacing: 0,
          fontFamily: "Lora",
          fontWeight: 500,
          fontStyle: "italic",
          padding: "14px 36px",
          borderRadius: 999,
          whiteSpace: "nowrap",
        }}
      >
        {`New AZ listing · ${city}`}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Clip overlay — short text over the center/lower-third of each clip.        */
/* -------------------------------------------------------------------------- */

interface ClipOverlayProps {
  text: string;
  durationInFrames: number;
}

export const ClipOverlay: React.FC<ClipOverlayProps> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring in, hold, spring out during the last ~8 frames.
  const enter = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 140, mass: 0.6 },
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = enter * exit;
  const translateY = interpolate(enter, [0, 1], [20, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 380,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          color: BRAND.white,
          fontSize: 70,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.55)",
          padding: "20px 32px",
          borderRadius: 18,
          maxWidth: 960,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Donation pill — coral, rounded square, anchored near the bottom.           */
/* -------------------------------------------------------------------------- */

interface DonationBadgeProps {
  donationLabel: string;
}

export const DonationBadge: React.FC<DonationBadgeProps> = ({
  donationLabel,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        // Raised from 240 → 360 to clear the lifted Wordmark (bottom: 240)
        // and to stay out of Instagram's bottom chrome.
        bottom: 360,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
      }}
    >
      <div
        style={{
          backgroundColor: BRAND.coral,
          color: BRAND.white,
          fontSize: 52,
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          padding: "22px 44px",
          borderRadius: 16,
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 920,
          letterSpacing: "-0.01em",
        }}
      >
        {`${donationLabel} to a charity of your choice`}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Vignette — radial darkening, softens image edges (editorial feel).         */
/* -------------------------------------------------------------------------- */

/**
 * Vignette overlay — concentric dark radial gradient. Used by
 * `details-closeup` to give each frame a "spotlight" feel, pulling the
 * viewer's eye to the center of the crop (where the macro detail sits).
 * Not a replacement for Scrim — they stack (vignette darkens edges,
 * scrim darkens top/bottom for text legibility).
 */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
    }}
  />
);

/* -------------------------------------------------------------------------- */
/* CornerCaption — small Lora italic caption anchored to a frame corner.      */
/* -------------------------------------------------------------------------- */

/**
 * Small editorial-style caption that sits in a frame corner, à la a
 * magazine photo credit. Not a big centered pill — the whole point is
 * that it reads as photo meta, not as a primary message. Used by
 * `details-closeup` to label details without hijacking the composition.
 */
export const CornerCaption: React.FC<{
  text: string;
  /** Which corner to anchor to. Defaults to "bottom-left". */
  corner?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  durationInFrames: number;
}> = ({ text, corner = "bottom-left", durationInFrames }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = enter * exit;

  // Keep corners well inside the safe area — IG crops ~100px off the top
  // and ~200px off the bottom for chrome, so pin to ~180 top / ~240 bottom.
  const positionStyle: React.CSSProperties = (() => {
    switch (corner) {
      case "bottom-left":  return { left: 60, bottom: 240 };
      case "bottom-right": return { right: 60, bottom: 240 };
      case "top-left":     return { left: 60, top: 180 };
      case "top-right":    return { right: 60, top: 180 };
    }
  })();

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        display: "flex",
        maxWidth: 640,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          color: BRAND.white,
          fontSize: 34,
          lineHeight: 1.3,
          letterSpacing: "0.01em",
          textShadow: "0 2px 8px rgba(0,0,0,0.75)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CounterText — animated number tween (stats-heavy template).                */
/* -------------------------------------------------------------------------- */

/**
 * Animates a number from 0 to `to` over the life of its sequence, using a
 * spring so the counter eases into its final value rather than ticking
 * linearly. `format(n)` turns the interpolated value into a display string
 * (e.g. `"$" + Math.round(n).toLocaleString()`).
 *
 * Used by `stats-heavy` for the infographic feel. Each number beat becomes
 * a moment of "watching it count up", which is a different register from
 * the rest of the templates where text just appears.
 */
export const CounterText: React.FC<{
  to: number;
  format: (n: number) => string;
  /** Fraction of the clip over which the counter animates. Rest is hold. */
  rampFraction?: number;
  /** Typography hook; accepts any style. */
  style?: React.CSSProperties;
}> = ({ to, format, rampFraction = 0.65, style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Spring from 0 → 1 over the ramp window, then hold at 1.
  const rampFrames = Math.max(1, Math.floor(durationInFrames * rampFraction));
  const progress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 120, mass: 1 },
    durationInFrames: rampFrames,
  });
  const value = progress * to;

  return <div style={style}>{format(value)}</div>;
};

/* -------------------------------------------------------------------------- */
/* Wordmark — persistent "givenest" watermark, bottom-center on every clip.   */
/* -------------------------------------------------------------------------- */

/**
 * Text-based wordmark matching the nav header pattern
 * (`give<span className="text-coral">nest</span>`). Rendered as plain text
 * so it scales crisply at any frame size — no PNG asset to ship or version.
 *
 * Sits above the safe-area bottom (above Instagram's UI chrome — captions,
 * like button, etc. — which typically covers the bottom ~200px on phones).
 */
export const Wordmark: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        // Lifted well above Instagram's bottom chrome — action rail (heart/
        // comment/share), caption row, and the home indicator take the
        // bottom ~200px of the Reel frame on modern phones. 70 was deep
        // inside that unsafe zone and getting cropped.
        bottom: 240,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontSize: 48,
          color: BRAND.white,
          letterSpacing: "-0.01em",
          display: "flex",
          textShadow: "0 2px 8px rgba(0,0,0,0.55)",
        }}
      >
        <span style={{ fontStyle: "normal" }}>give</span>
        <span style={{ color: BRAND.coral, fontStyle: "italic" }}>nest</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* End card — CTA over the final clip + attribution + Learn More pill.        */
/* -------------------------------------------------------------------------- */

interface EndCardProps {
  ctaText: string;
  officeName: string;
}

export const EndCard: React.FC<EndCardProps> = ({ ctaText, officeName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.7 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        // Raised from 200 → 340 so the CTA + "Listed by" stack sits above
        // the lifted Wordmark (bottom: 240) and clears IG's bottom chrome.
        paddingBottom: 340,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* CTA copy — Instagram adds its own "Learn More" / link button when
            a link is attached to the Reel, so we don't need one baked in. */}
        <div
          style={{
            fontFamily: "Lora",
            fontWeight: 600,
            fontStyle: "italic",
            color: BRAND.white,
            fontSize: 64,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            textAlign: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: "20px 32px",
            borderRadius: 18,
            maxWidth: 900,
          }}
        >
          {ctaText}
        </div>
        {officeName.trim().toLowerCase() !== "givenest" && (
          <div
            style={{
              fontFamily: "sans-serif",
              fontWeight: 500,
              color: BRAND.white,
              fontSize: 26,
              letterSpacing: 1,
              textAlign: "center",
              opacity: 0.85,
              textShadow: "0 2px 6px rgba(0,0,0,0.6)",
            }}
          >
            {`Listed by ${officeName}`}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
