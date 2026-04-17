import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { KenBurnsDirection, ReelInputProps } from "../../types";
import { KenBurns } from "../shared/KenBurns";
import {
  Scrim,
  Kicker,
  EndCard,
  Wordmark,
} from "../shared/BrandOverlays";
import { loadFonts } from "../shared/fonts";

/**
 * Price-reveal Reel template.
 *
 * TikTok-native engagement format — builds curiosity through stat beats
 * without showing the price, then hard-cuts to a big price drop. Works
 * especially well on entry-tier listings ($400k–$800k) where the price
 * IS the hook. Higher dwell time because viewers stay for the reveal.
 *
 * No hook card in the brand sense — the hook *is* the suspense ladder
 * (beds → baths → sqft → city → ???). The price drop functions as both
 * payoff and the Lora statement.
 *
 * Structure (18s @ 30fps = 540 frames, 9 beats):
 *
 *   Frames    Beat  Photo              Overlay                   Motion
 *   -----------------------------------------------------------------------
 *   0–44      1     Hero exterior      "Guess the price" hook     slowZoomIn
 *   45–89     2     Interior wide      "5 BED · 5.5 BATH"         zoomIn
 *   90–134    3     Kitchen            "4,817 SQFT"               zoomIn
 *   135–179   4     Primary bedroom    "BUILT 2025"               zoomIn
 *   180–224   5     Living             "0.29 ACRES"               zoomIn
 *   225–269   6     Outdoor            "PHOENIX, AZ"              zoomIn
 *   270–389   7     Hero return        PRICE DROP (4s big)        hardCut
 *   390–464   8     Aerial             DONATION DROP              slowZoomIn
 *   465–539   9     Hero return        END CARD                   slowZoomIn
 *
 * Hard cuts throughout — builds punch. Tension beats use uppercase
 * sans-serif (statistics vibe) vs. the Lora italic used elsewhere, so
 * the price drop in Lora feels like a palate change from info to drama.
 *
 * Beats 4 & 5 (year built / lot size) gracefully fall back to a silent
 * photo beat if those fields aren't on the listing — never shows a
 * garbage card like "BUILT UNDEFINED".
 */

loadFonts();

/** 18s runtime — overridden per-composition in Root.tsx. */
export const PRICE_REVEAL_DURATION_FRAMES = 540;

const BRAND = {
  coral: "#E85A4F",
  white: "#FFFFFF",
};

const CLIPS: {
  start: number;
  duration: number;
  sourceIdx: number;
  motion: KenBurnsDirection;
}[] = [
  { start: 0,   duration: 45,  sourceIdx: 0, motion: "slowZoomIn" }, // 1. Question hook
  { start: 45,  duration: 45,  sourceIdx: 1, motion: "zoomIn" },     // 2. Beds/baths
  { start: 90,  duration: 45,  sourceIdx: 2, motion: "zoomIn" },     // 3. Sqft
  { start: 135, duration: 45,  sourceIdx: 3, motion: "zoomIn" },     // 4. Built
  { start: 180, duration: 45,  sourceIdx: 4, motion: "zoomIn" },     // 5. Lot size
  { start: 225, duration: 45,  sourceIdx: 5, motion: "zoomIn" },     // 6. City
  { start: 270, duration: 120, sourceIdx: 7, motion: "hardCut" },    // 7. PRICE DROP (4s)
  { start: 390, duration: 75,  sourceIdx: 6, motion: "slowZoomIn" }, // 8. Donation drop
  { start: 465, duration: 75,  sourceIdx: 7, motion: "slowZoomIn" }, // 9. End card
];

export const PriceReveal: React.FC<ReelInputProps> = ({
  ctaText,
  donationLabel,
  officeName,
  city,
  clips,
  yearBuilt,
  lotSize,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Pull the formatted price out of clip 4's overlay — buildReelScript stores
  // it as "Listed at $3,998,000"; strip the prefix.
  const rawPriceOverlay = clips[4]?.overlay ?? "";
  const priceText = rawPriceOverlay.replace(/^Listed at\s*/i, "");

  // Beds/baths overlay for beat 2 comes from clip[1].overlay.
  const bedsBaths = clips[1]?.overlay ?? "";
  // Sqft is at clip[2].overlay.
  const sqftText = clips[2]?.overlay ?? "";
  // Upcased lot size for beat 5 — "0.29 acres" → "0.29 ACRES".
  const lotText = lotSize?.toUpperCase() ?? "";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Clips — hard cuts. */}
      {CLIPS.map((clip, i) => (
        <Sequence
          key={i}
          from={clip.start}
          durationInFrames={clip.duration}
        >
          <KenBurns
            src={clips[clip.sourceIdx]?.imageUrl ?? ""}
            direction={clip.motion}
            durationInFrames={clip.duration}
          />
        </Sequence>
      ))}

      <Scrim />

      <AbsoluteFill>
        <Kicker city={city} />
      </AbsoluteFill>

      <AbsoluteFill>
        <Wordmark />
      </AbsoluteFill>

      {/* Beat 1 — question hook. */}
      <Sequence from={CLIPS[0].start} durationInFrames={CLIPS[0].duration}>
        <QuestionHook />
      </Sequence>

      {/* Beats 2–6 — suspense stats in uppercase sans. Year (beat 4) and
          lot size (beat 5) skip gracefully if the underlying fields aren't
          on the listing — the photo still plays, just without a stat card,
          becoming an accidental teaser beat. */}
      <Sequence from={CLIPS[1].start} durationInFrames={CLIPS[1].duration}>
        <StatCard text={bedsBaths.toUpperCase()} />
      </Sequence>
      <Sequence from={CLIPS[2].start} durationInFrames={CLIPS[2].duration}>
        <StatCard text={sqftText.toUpperCase()} />
      </Sequence>
      {yearBuilt ? (
        <Sequence from={CLIPS[3].start} durationInFrames={CLIPS[3].duration}>
          <StatCard text={`BUILT ${yearBuilt}`} />
        </Sequence>
      ) : null}
      {lotText ? (
        <Sequence from={CLIPS[4].start} durationInFrames={CLIPS[4].duration}>
          <StatCard text={lotText} />
        </Sequence>
      ) : null}
      <Sequence from={CLIPS[5].start} durationInFrames={CLIPS[5].duration}>
        <StatCard text={city.toUpperCase()} />
      </Sequence>

      {/* Beat 7 — PRICE DROP. Big spring-in, 4s hold. */}
      <Sequence from={CLIPS[6].start} durationInFrames={CLIPS[6].duration}>
        <PriceDrop priceText={priceText} />
      </Sequence>

      {/* Beat 8 — donation drop. Mirrors PriceDrop styling so the two
          dramatic beats (price + donation) feel like a pair — same big
          centered coral Lora italic, same small uppercase sans label. */}
      <Sequence from={CLIPS[7].start} durationInFrames={CLIPS[7].duration}>
        <DonationDrop amountLabel={donationLabel} />
      </Sequence>

      {/* Beat 9 — end card. */}
      <Sequence
        from={CLIPS[8].start}
        durationInFrames={durationInFrames - CLIPS[8].start}
      >
        <EndCard ctaText={ctaText} officeName={officeName} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/* Template-local overlays                                                    */
/* -------------------------------------------------------------------------- */

/** "Can you guess the price?" hook. Uses uppercase sans-serif to match the
 *  stats beats — the whole template's tone is "quiz show", not "editorial". */
const QuestionHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.6 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [30, 0]);

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
          fontFamily: "sans-serif",
          fontWeight: 800,
          color: BRAND.white,
          fontSize: 88,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: "36px 56px",
          borderRadius: 24,
          maxWidth: 940,
          textTransform: "uppercase",
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        Guess the price
      </div>
    </AbsoluteFill>
  );
};

/** Tension beat — uppercase sans-serif stat card. Snaps in fast, holds,
 *  fades out at the end. No spring — feels more like a deck slide advancing
 *  than a cinematic overlay. */
const StatCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          fontFamily: "sans-serif",
          fontWeight: 800,
          color: BRAND.white,
          fontSize: 108,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textAlign: "center",
          backgroundColor: "rgba(0,0,0,0.55)",
          padding: "36px 52px",
          borderRadius: 20,
          maxWidth: 960,
          textTransform: "uppercase",
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Donation drop — mirror of PriceDrop, one beat later. Same size + spring
 *  + palate (small uppercase sans label + huge Lora italic coral amount)
 *  so the two dramatic statements read as a pair: "here's the price /
 *  here's what it gives back." Sizing is a hair smaller than the price
 *  drop (140 vs 160) because the donation copy is longer. */
const DonationDrop: React.FC<{ amountLabel: string }> = ({ amountLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.8 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.7, 1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 40px",
      }}
    >
      <div
        style={{
          fontFamily: "sans-serif",
          fontWeight: 600,
          color: BRAND.white,
          fontSize: 34,
          letterSpacing: 4,
          textTransform: "uppercase",
          textAlign: "center",
          opacity,
          textShadow: "0 2px 6px rgba(0,0,0,0.65)",
          marginBottom: 12,
        }}
      >
        To a charity of your choice
      </div>
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          color: BRAND.coral,
          fontSize: 140,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textAlign: "center",
          textShadow: "0 6px 18px rgba(0,0,0,0.8)",
          display: "flex",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {amountLabel}
      </div>
    </AbsoluteFill>
  );
};

/** Price drop — the payoff beat. Huge centered price in Lora italic (palate
 *  shift from the sans stats), spring-in + scale-up for drama. */
const PriceDrop: React.FC<{ priceText: string }> = ({ priceText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.8 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.7, 1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 40px",
      }}
    >
      <div
        style={{
          fontFamily: "sans-serif",
          fontWeight: 600,
          color: BRAND.white,
          fontSize: 34,
          letterSpacing: 4,
          textTransform: "uppercase",
          textAlign: "center",
          opacity,
          textShadow: "0 2px 6px rgba(0,0,0,0.65)",
          marginBottom: 12,
        }}
      >
        Listed at
      </div>
      <div
        style={{
          fontFamily: "Lora",
          fontWeight: 600,
          fontStyle: "italic",
          color: BRAND.coral,
          fontSize: 160,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textAlign: "center",
          textShadow: "0 6px 18px rgba(0,0,0,0.8)",
          display: "flex",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {priceText}
      </div>
    </AbsoluteFill>
  );
};
