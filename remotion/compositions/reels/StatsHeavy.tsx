import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { KenBurnsDirection, ReelInputProps } from "../../types";
import { KenBurns } from "../shared/KenBurns";
import {
  Kicker,
  EndCard,
  Wordmark,
  CounterText,
} from "../shared/BrandOverlays";
import { loadFonts } from "../shared/fonts";

/**
 * Stats-heavy Reel template — "infographic".
 *
 * Each beat features a big counter-animation for a key listing stat. The
 * photo is dimmed heavily (60% overlay) so the stat is the focal point —
 * this reverses the usual figure/ground from the other templates where
 * the photo is primary and text is secondary.
 *
 * Structure (15s @ 30fps = 450 frames, 7 beats):
 *
 *   Frames    Beat  Photo              Counter                     Source
 *   ------------------------------------------------------------------------------
 *   0–59      1     Hero exterior      hookText (no counter)       clip 0
 *   60–119    2     Interior wide      BEDROOMS · 5                clip 1
 *   120–179   3     Kitchen            BATHROOMS · 5.5             clip 2
 *   180–239   4     Bedroom            SQUARE FEET · 4,817         clip 3
 *   240–299   5     Living             LISTED AT · $3,998,000      clip 4
 *   300–389   6     Aerial             DONATION · $24,988 (coral)  clip 6
 *   390–449   7     Hero return        END CARD                    clip 7
 *
 * Every stat beat is 2s with a spring-eased count-up over the first 65%
 * (~1.3s ramp), then holds for the rest of the beat. Satisfying to watch.
 *
 * No ClipOverlay, no HookCard big-pill, no mid-reel DonationBadge pill —
 * the counter on beat 6 IS the donation statement, just styled coral.
 * Radically different register from walkthrough/details-closeup.
 */

loadFonts();

const BRAND = {
  coral: "#E85A4F",
  white: "#FFFFFF",
  black: "#000000",
};

// Extract plain numeric values from the source property snapshot. Passed
// through clip overlays on the payload, so we parse them out here.
function parseNum(s: string | undefined): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const CLIPS: {
  start: number;
  duration: number;
  sourceIdx: number;
  motion: KenBurnsDirection;
}[] = [
  { start: 0,   duration: 60, sourceIdx: 0, motion: "slowZoomIn" }, // 1. Hook
  { start: 60,  duration: 60, sourceIdx: 1, motion: "zoomIn" },     // 2. Beds
  { start: 120, duration: 60, sourceIdx: 2, motion: "zoomIn" },     // 3. Baths
  { start: 180, duration: 60, sourceIdx: 3, motion: "zoomIn" },     // 4. Sqft
  { start: 240, duration: 60, sourceIdx: 4, motion: "zoomIn" },     // 5. Price
  { start: 300, duration: 90, sourceIdx: 6, motion: "slowZoomIn" }, // 6. Donation (3s)
  { start: 390, duration: 60, sourceIdx: 7, motion: "slowZoomIn" }, // 7. End card
];

export const StatsHeavy: React.FC<ReelInputProps> = ({
  hookText,
  ctaText,
  donationLabel,
  officeName,
  city,
  clips,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Parse numeric targets from the payload's overlay strings.
  const bedsTarget = parseNum(clips[1]?.overlay?.split(" bed")[0]);
  // "5 bed · 5.5 bath" — split to get baths
  const bathsTarget = parseNum(
    clips[1]?.overlay?.split("·")[1]?.split(" bath")[0]
  );
  const sqftTarget = parseNum(clips[2]?.overlay);
  const priceTarget = parseNum(clips[4]?.overlay);
  const donationTarget = parseNum(donationLabel);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Clips, dimmed heavily so the counter is the star. */}
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

      {/* Heavy dimmer — pushes the photo to near-background so the numbers
          read as primary. Different from regular Scrim (gradient edges);
          this is a flat 60% darken. */}
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />

      <AbsoluteFill>
        <Kicker city={city} />
      </AbsoluteFill>

      <AbsoluteFill>
        <Wordmark />
      </AbsoluteFill>

      {/* Beat 1 — hook. Lora italic centered statement, not a counter. */}
      <Sequence from={CLIPS[0].start} durationInFrames={CLIPS[0].duration}>
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
              fontSize: 68,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              textAlign: "center",
              maxWidth: 940,
            }}
          >
            {hookText}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Beats 2–5: stat counters. Label on top, big counter on bottom. */}
      <Sequence from={CLIPS[1].start} durationInFrames={CLIPS[1].duration}>
        <StatBeat
          label="Bedrooms"
          to={bedsTarget}
          format={(n) => String(Math.round(n))}
        />
      </Sequence>
      <Sequence from={CLIPS[2].start} durationInFrames={CLIPS[2].duration}>
        <StatBeat
          label="Bathrooms"
          to={bathsTarget}
          format={(n) => n.toFixed(1).replace(/\.0$/, "")}
        />
      </Sequence>
      <Sequence from={CLIPS[3].start} durationInFrames={CLIPS[3].duration}>
        <StatBeat
          label="Square feet"
          to={sqftTarget}
          format={(n) => Math.round(n).toLocaleString()}
        />
      </Sequence>
      <Sequence from={CLIPS[4].start} durationInFrames={CLIPS[4].duration}>
        <StatBeat
          label="Listed at"
          to={priceTarget}
          format={(n) => `$${Math.round(n).toLocaleString()}`}
        />
      </Sequence>

      {/* Beat 6 — donation counter in coral. Functions as the brand
          "donation pill" for this template — no separate badge. */}
      <Sequence from={CLIPS[5].start} durationInFrames={CLIPS[5].duration}>
        <StatBeat
          label="Donated to a charity of your choice"
          to={donationTarget}
          format={(n) => `~$${Math.round(n).toLocaleString()}`}
          color={BRAND.coral}
        />
      </Sequence>

      {/* Beat 7 — standard end card. */}
      <Sequence
        from={CLIPS[6].start}
        durationInFrames={durationInFrames - CLIPS[6].start}
      >
        <EndCard ctaText={ctaText} officeName={officeName} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/* StatBeat — label on top, animated counter on bottom.                       */
/* -------------------------------------------------------------------------- */

const StatBeat: React.FC<{
  label: string;
  to: number;
  format: (n: number) => string;
  color?: string;
}> = ({ label, to, format, color = BRAND.white }) => {
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontWeight: 600,
            color: BRAND.white,
            fontSize: 32,
            letterSpacing: 4,
            textTransform: "uppercase",
            textAlign: "center",
            opacity: 0.85,
            textShadow: "0 2px 6px rgba(0,0,0,0.5)",
            maxWidth: 900,
          }}
        >
          {label}
        </div>
        <CounterText
          to={to}
          format={format}
          style={{
            fontFamily: "Lora",
            fontWeight: 600,
            fontStyle: "italic",
            color,
            fontSize: 180,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textAlign: "center",
            textShadow: "0 4px 14px rgba(0,0,0,0.65)",
            display: "flex",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
