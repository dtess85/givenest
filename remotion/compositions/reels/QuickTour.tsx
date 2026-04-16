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
 * The fast-paced cousin of walkthrough-cinematic. Same 15s total, but 8
 * clips instead of 6, punchier 1.5s mid-section beats, whip/hard-zoom
 * motion, no crossfades (hard cuts between clips), and an overlay on
 * every walkthrough clip instead of just half of them. Hook is shorter
 * (1.5s vs 2s) to get into the tour faster.
 *
 * The point of this template existing: prove that `shared/KenBurns` +
 * `shared/BrandOverlays` actually share between templates. If this works
 * without touching shared code, templates 3 and 4 are copy-paste. If not,
 * refactor now while there are only two templates to reconcile.
 *
 * Structure (15s @ 30fps = 450 frames):
 *
 *   Frames    Clip  Content                      Overlay            Motion
 *   --------------------------------------------------------------------------
 *   0–44      1     Hero exterior                HOOK                whipRight
 *   45–89     2     Interior wide                beds/baths          whipLeft
 *   90–134    3     Kitchen                      sqft                zoomIn
 *   135–179   4     Primary bedroom              city                whipRight
 *   180–224   5     Living                       Listed at {price}   whipLeft
 *   225–269   6     Outdoor / pool               {office} listing    zoomOut
 *   270–359   7     Aerial / exterior            DONATION pill       slowZoomIn
 *   360–450   8     Hero return                  END CARD            zoomIn
 *
 * Kicker + Wordmark + Scrim run full-duration (shared with
 * walkthrough-cinematic).
 */

loadFonts();

// Clip layout. Starts, durations in frames, and template-imposed Ken Burns
// motion per clip. QuickTour overrides whatever `clips[i].kenBurns` the
// caller sent (`buildReelScript` hard-codes slow/cinematic motion — good
// for walkthrough-cinematic, wrong for quick-tour's punchier pace). Future
// cleanup: move the per-clip motion decision to a template-aware builder
// in lib/social/caption.ts so this file doesn't need to know.
const CLIPS: {
  start: number;
  duration: number;
  motion: KenBurnsDirection;
}[] = [
  { start: 0,   duration: 45, motion: "whipRight" },   // 1. Hook
  { start: 45,  duration: 45, motion: "whipLeft" },    // 2. Interior wide
  { start: 90,  duration: 45, motion: "zoomIn" },      // 3. Kitchen
  { start: 135, duration: 45, motion: "whipRight" },   // 4. Bedroom
  { start: 180, duration: 45, motion: "whipLeft" },    // 5. Living
  { start: 225, duration: 45, motion: "zoomOut" },     // 6. Outdoor / reveal
  { start: 270, duration: 90, motion: "slowZoomIn" },  // 7. Donation — breathe
  { start: 360, duration: 90, motion: "zoomIn" },      // 8. End card
];

export const QuickTour: React.FC<ReelInputProps> = ({
  hookText,
  ctaText,
  donationLabel,
  officeName,
  city,
  clips,
}) => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Clips — hard cuts, no crossfade. Each Sequence just owns its
          own Ken Burns motion and mounts the clip for its duration. The
          motion direction comes from the template-local CLIPS table, not
          from `clips[i].kenBurns`, because buildReelScript picks motion
          for walkthrough-cinematic's pacing. */}
      {CLIPS.map((clip, i) => (
        <Sequence
          key={i}
          from={clip.start}
          durationInFrames={clip.duration}
        >
          <KenBurns
            src={clips[i]?.imageUrl ?? ""}
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

      {/* Per-clip overlays — clips 2–6 (every walkthrough beat). Pulls
          text from `clips[i].overlay`; same payload shape as
          walkthrough-cinematic uses. */}
      {CLIPS.slice(1, 6).map((clip, idx) => {
        const clipIndex = idx + 1; // 1..5
        const overlayText = clips[clipIndex]?.overlay ?? "";
        if (!overlayText) return null;
        return (
          <Sequence
            key={`overlay-${clipIndex}`}
            from={clip.start}
            durationInFrames={clip.duration}
          >
            <ClipOverlay text={overlayText} durationInFrames={clip.duration} />
          </Sequence>
        );
      })}

      {/* Donation badge — clip 7 (second-to-last). No entry fade wrapper
          here — the hard-cut into the longer donation beat lets the
          message land more punchily, truer to the quick-tour pace. */}
      <Sequence
        from={CLIPS[6].start}
        durationInFrames={CLIPS[6].duration}
      >
        <DonationBadge donationLabel={donationLabel} />
      </Sequence>

      {/* End card — clip 8 through end-of-reel. */}
      <Sequence
        from={CLIPS[7].start}
        durationInFrames={durationInFrames - CLIPS[7].start}
      >
        <EndCard ctaText={ctaText} officeName={officeName} />
      </Sequence>
    </AbsoluteFill>
  );
};
