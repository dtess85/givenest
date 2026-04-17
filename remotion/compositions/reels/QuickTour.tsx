import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from "remotion";
import type { KenBurnsDirection, ReelInputProps } from "../../types";
import { KenBurns } from "../shared/KenBurns";
import {
  Scrim,
  HookCard,
  Kicker,
  ClipOverlay,
  DonationBadge,
  EndCard,
  Wordmark,
} from "../shared/BrandOverlays";
import { loadFonts } from "../shared/fonts";

/**
 * Quick-tour Reel template.
 *
 * The fast-paced cousin of walkthrough-cinematic. Punchy 1.5s mid-section
 * beats, whip/hard-zoom motion, hard cuts (no crossfades), and an overlay
 * on every walkthrough clip. Hook is shorter (1.5s vs 2s) to get into the
 * tour faster.
 *
 * The point of this template existing: prove that `shared/KenBurns` +
 * `shared/BrandOverlays` actually share between templates.
 *
 * Structure (13.5s @ 30fps = 405 frames, 7 beats):
 *
 *   Frames    Beat  Content                      Overlay            Source  Motion
 *   ---------------------------------------------------------------------------------
 *   0–44      1     Hero exterior                HOOK               clip 0  whipRight
 *   45–89     2     Interior wide                beds/baths         clip 1  whipLeft
 *   90–134    3     Kitchen                      sqft               clip 2  zoomIn
 *   135–179   4     Primary bedroom              year+lot (or $sf)  clip 3  whipRight
 *   180–224   5     Living                       Listed at {price}  clip 4  whipLeft
 *   225–314   6     Aerial / exterior            DONATION pill      clip 6  slowZoomIn
 *   315–404   7     Hero return                  END CARD           clip 7  zoomIn
 *
 * Kicker + Wordmark + Scrim run full-duration (shared with
 * walkthrough-cinematic).
 */

loadFonts();

/** 13.5s runtime — shorter than the 15s default because the silent
 *  outdoor beat was cut. Overridden per-composition in Root.tsx. */
export const QUICK_TOUR_DURATION_FRAMES = 405;

// Clip layout. Each entry now carries explicit `sourceIdx` so removing
// middle beats doesn't scramble the 1:1 mapping to the 8-slot payload.
const CLIPS: {
  start: number;
  duration: number;
  sourceIdx: number;
  motion: KenBurnsDirection;
}[] = [
  { start: 0,   duration: 45, sourceIdx: 0, motion: "whipRight" },   // 1. Hook
  { start: 45,  duration: 45, sourceIdx: 1, motion: "whipLeft" },    // 2. Interior wide
  { start: 90,  duration: 45, sourceIdx: 2, motion: "zoomIn" },      // 3. Kitchen
  { start: 135, duration: 45, sourceIdx: 3, motion: "whipRight" },   // 4. Bedroom
  { start: 180, duration: 45, sourceIdx: 4, motion: "whipLeft" },    // 5. Living
  { start: 225, duration: 90, sourceIdx: 6, motion: "slowZoomIn" },  // 6. Donation — breathe
  { start: 315, duration: 90, sourceIdx: 7, motion: "zoomIn" },      // 7. End card
];

export const QuickTour: React.FC<ReelInputProps> = ({
  hookText,
  ctaText,
  donationLabel,
  officeName,
  city,
  clips,
  yearBuilt,
  lotSize,
  pricePerSqft,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Beat 4's overlay — city was too redundant with the persistent "NEW AZ
  // LISTING · {city}" kicker. Pick a real detail stat instead, with the
  // same priority as details-closeup: year+lot first (architectural
  // context), then year alone, lot alone, or $/sqft. Returns null if
  // nothing specific is available — beat 4 then plays silent rather than
  // showing fluff.
  const beat4Caption: string | null = (() => {
    const yearPart = yearBuilt ? `Built ${yearBuilt}` : null;
    const lotPart = lotSize ? `${lotSize} lot` : null;
    const combined = [yearPart, lotPart].filter(Boolean).join(" · ");
    if (combined) return combined;
    if (pricePerSqft) return pricePerSqft;
    return null;
  })();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Clips — hard cuts, no crossfade. Each Sequence just owns its
          own Ken Burns motion and mounts the clip for its duration. Pulls
          image from `clips[sourceIdx]` (not by position) so removing or
          rearranging beats doesn't scramble the payload mapping. */}
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

      {/* Full-duration scrim — same as walkthrough-cinematic. Keeps
          overlays readable on bright exteriors. */}
      <Scrim />

      {/* Persistent top kicker (full duration). */}
      <AbsoluteFill>
        <Kicker city={city} />
      </AbsoluteFill>

      {/* Persistent bottom wordmark (full duration). */}
      <AbsoluteFill>
        <Wordmark />
      </AbsoluteFill>

      {/* Hook card — clip 1 only. */}
      <Sequence from={CLIPS[0].start} durationInFrames={CLIPS[0].duration}>
        <HookCard hookText={hookText} />
      </Sequence>

      {/* Per-beat overlays for beats 2–5. Beats pull from payload
          `clips[sourceIdx].overlay`; beat 4 swaps the redundant city
          label for a year/lot/$-per-sqft detail. Empty strings render
          nothing — the photo plays silent. */}
      {CLIPS.slice(1, 5).map((clip, idx) => {
        const beatNumber = idx + 2; // 2..5
        // Beat 4 uses the computed year/lot caption (or fallback), else
        // pull overlay straight from the payload slot this beat sources.
        const overlayText =
          beatNumber === 4
            ? beat4Caption
            : clips[clip.sourceIdx]?.overlay ?? "";
        if (!overlayText) return null;
        return (
          <Sequence
            key={`overlay-${beatNumber}`}
            from={clip.start}
            durationInFrames={clip.duration}
          >
            <ClipOverlay text={overlayText} durationInFrames={clip.duration} />
          </Sequence>
        );
      })}

      {/* Donation badge — beat 6 (second-to-last). No entry fade wrapper
          here — the hard-cut into the longer donation beat lets the
          message land more punchily, truer to the quick-tour pace. */}
      <Sequence
        from={CLIPS[5].start}
        durationInFrames={CLIPS[5].duration}
      >
        <DonationBadge donationLabel={donationLabel} />
      </Sequence>

      {/* End card — beat 7 through end-of-reel. */}
      <Sequence
        from={CLIPS[6].start}
        durationInFrames={durationInFrames - CLIPS[6].start}
      >
        <EndCard ctaText={ctaText} officeName={officeName} />
      </Sequence>
    </AbsoluteFill>
  );
};
