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

// Clip layout — frame-accurate durations & where each clip starts.
const CLIPS: { start: number; duration: number }[] = [
  { start: 0,   duration: 60 },   // 1. Hook (2s) — statement has time to land
  { start: 60,  duration: 90 },   // 2. Interior wide (3s) — settling shot
  { start: 150, duration: 75 },   // 3. Kitchen (2.5s)
  { start: 225, duration: 75 },   // 4. Living (2.5s)
  { start: 300, duration: 75 },   // 5. Donation beat (2.5s)
  { start: 375, duration: 75 },   // 6. End card (2.5s)
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
          Ken Burns motion; opacity interpolation handles the fade-in. */}
      {CLIPS.map((clip, i) => (
        <Sequence
          key={i}
          from={clip.start}
          durationInFrames={clip.duration + CROSSFADE_FRAMES}
        >
          <ClipFade fadeInFrames={CROSSFADE_FRAMES}>
            <KenBurns
              src={clips[i]?.imageUrl ?? ""}
              direction={clips[i]?.kenBurns ?? "slowZoomIn"}
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

      {/* Per-clip text overlays for clips 2–4. Skip clip 1 (hook), clip 5
          (donation), clip 6 (end card) — those have their own full-screen cards. */}
      {CLIPS.slice(1, 4).map((clip, idx) => {
        const clipIndex = idx + 1; // 1..3
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

/** Opacity-ramp wrapper used for cross-fading clips. Just fades in; the
 *  underlying clip under it handles its own Ken Burns. */
const ClipFade: React.FC<{
  fadeInFrames: number;
  children: React.ReactNode;
}> = ({ fadeInFrames, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
  );
};

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
