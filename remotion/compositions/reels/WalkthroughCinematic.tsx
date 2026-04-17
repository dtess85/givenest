import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  interpolate,
  useCurrentFrame,
} from "remotion";
import type { ReelInputProps } from "../../types";
import { KenBurns } from "../shared/KenBurns";
import {
  Scrim,
  HookCard,
  Kicker,
  ClipOverlay,
  DonationBadge,
  EndCard,
  Wordmark,
  ClipFade,
} from "../shared/BrandOverlays";
import { loadFonts } from "../shared/fonts";

/**
 * Walkthrough-cinematic Reel template.
 *
 * Structure (15s @ 30fps = 450 frames, 6 clips):
 *
 *   Frames    Clip  Content                                      Overlay
 *   ---------------------------------------------------------------------
 *   0–59      1     Hero exterior — slow zoom-in                  HOOK
 *   60–149    2     Interior wide                                 beds/baths
 *   150–224   3     Kitchen                                       sqft
 *   225–299   4     Living                                        listed at {price}
 *   300–374   5     Aerial / exterior                             DONATION pill
 *   375–449   6     Hero return / aerial                          END CARD (CTA + office)
 *
 * Kicker ("NEW AZ LISTING · City") runs for the full duration as a persistent
 * top-bar. Dark scrim runs full duration to keep overlays legible.
 *
 * Fades: every clip gets an 8-frame crossfade at the start via opacity
 * interpolation inside <Sequence> — no hard cuts, true to "cinematic" pacing.
 */

loadFonts();

// Clip layout — frame-accurate durations, where each beat starts, and
// which `clips[i]` (from buildReelScript's 8-clip payload) sources each
// beat's image + overlay. Explicit sourceIdx means buildReelScript can add
// new clip slots (e.g. city, office attribution) without silently
// reshuffling what walkthrough-cinematic shows.
const CLIPS: {
  start: number;
  duration: number;
  sourceIdx: number;
}[] = [
  { start: 0,   duration: 60, sourceIdx: 0 }, // 1. Hook
  { start: 60,  duration: 90, sourceIdx: 1 }, // 2. Interior — beds/baths
  { start: 150, duration: 75, sourceIdx: 2 }, // 3. Kitchen — sqft
  { start: 225, duration: 75, sourceIdx: 4 }, // 4. Living — price (skips city at idx 3)
  { start: 300, duration: 75, sourceIdx: 6 }, // 5. Donation beat — aerial
  { start: 375, duration: 75, sourceIdx: 7 }, // 6. End card — hero return
];

// Crossfade duration between clips (in frames). 8 frames ≈ 0.27s @ 30fps.
const CROSSFADE_FRAMES = 8;

export const WalkthroughCinematic: React.FC<ReelInputProps> = ({
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
      {/* Full-duration clips with crossfades. Each Sequence owns its own
          Ken Burns motion; opacity interpolation handles the fade-in. Pulls
          image + motion from `clips[sourceIdx]` rather than by position, so
          the template controls which slots of the payload it cares about. */}
      {CLIPS.map((clip, i) => (
        <Sequence
          key={i}
          from={clip.start}
          durationInFrames={clip.duration + CROSSFADE_FRAMES}
        >
          <ClipFade fadeInFrames={CROSSFADE_FRAMES}>
            <KenBurns
              src={clips[clip.sourceIdx]?.imageUrl ?? ""}
              direction={clips[clip.sourceIdx]?.kenBurns ?? "slowZoomIn"}
              durationInFrames={clip.duration + CROSSFADE_FRAMES}
            />
          </ClipFade>
        </Sequence>
      ))}

      {/* Full-duration scrim — dims the photo so white/coral overlays stay
          readable against bright exteriors. */}
      <Scrim />

      {/* Persistent top kicker — visible the entire video. */}
      <AbsoluteFill>
        <Kicker city={city} />
      </AbsoluteFill>

      {/* Persistent bottom wordmark — "givenest" watermark on every clip. */}
      <AbsoluteFill>
        <Wordmark />
      </AbsoluteFill>

      {/* Hook card — first clip only. */}
      <Sequence from={CLIPS[0].start} durationInFrames={CLIPS[0].duration}>
        <HookCard hookText={hookText} />
      </Sequence>

      {/* Per-clip text overlays for beats 2–4. Skip beat 1 (hook), beat 5
          (donation), beat 6 (end card) — those have their own full-screen
          cards. Each overlay pulls from `clips[sourceIdx].overlay`. */}
      {CLIPS.slice(1, 4).map((clip, idx) => {
        const beatNumber = idx + 2; // 2..4 (for key / debug)
        const overlayText = clips[clip.sourceIdx]?.overlay ?? "";
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

      {/* Donation badge — second-to-last clip (index 4). Lands right before
          the end card so the charity message is the penultimate beat. */}
      <Sequence
        from={CLIPS[4].start}
        durationInFrames={CLIPS[4].duration}
      >
        <DonationFadeIn>
          <DonationBadge donationLabel={donationLabel} />
        </DonationFadeIn>
      </Sequence>

      {/* End card on final clip (clip 6, index 5). */}
      <Sequence
        from={CLIPS[5].start}
        durationInFrames={durationInFrames - CLIPS[5].start}
      >
        <EndCard ctaText={ctaText} officeName={officeName} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/* Local helpers — keep them in this file since they're template-specific.    */
/* -------------------------------------------------------------------------- */

/** Mini spring for the donation badge — pops in at the start of its
 *  sequence and holds until the end. */
const DonationFadeIn: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 12], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ opacity, transform: `translateY(${translateY}px)` }}
    >
      {children}
    </AbsoluteFill>
  );
};
