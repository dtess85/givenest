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
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
      }}
    >
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          color: BRAND.white,
          fontSize: 72,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.60)",
          padding: "32px 44px",
          borderRadius: 24,
          maxWidth: 940,
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
        top: 100,
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
          letterSpacing: 4,
          fontFamily: "sans-serif",
          fontWeight: 600,
          padding: "14px 36px",
          borderRadius: 999,
          whiteSpace: "nowrap",
        }}
      >
        {`NEW AZ LISTING · ${city}`}
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
        bottom: 240,
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
        bottom: 70,
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
        paddingBottom: 200,
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
      </div>
    </AbsoluteFill>
  );
};
