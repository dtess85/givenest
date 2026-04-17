import React from "react";
import { interpolate, useCurrentFrame, Img } from "remotion";
import type { KenBurnsDirection } from "../../types";

/**
 * Ken Burns motion wrapper. Takes a single image and animates it over its
 * lifetime according to a named direction. The parent `<Sequence>` controls
 * *when* this renders; this component only knows about its own local time
 * via `useCurrentFrame()`.
 *
 * Motion curves:
 *   - slow*     — luxury / cinematic (walkthrough-cinematic template)
 *   - (default) — medium-intensity pan/zoom
 *   - whip*     — aggressive, TikTok-style fast motion (quick-tour in Phase 2)
 *   - hardCut   — no animation, pure static frame
 *
 * The image is rendered at 110-120% scale so zooms and pans don't reveal
 * the edge of the frame. Origin shift is done via `transform-origin` +
 * `scale()` so the motion is hardware-accelerated by Chromium.
 */

interface KenBurnsProps {
  /** Full-res image URL. Remotion's `<Img>` blocks until it's fully loaded
   *  before rendering the frame, so we don't get half-loaded images in the
   *  MP4. */
  src: string;
  /** Motion direction keyword. */
  direction: KenBurnsDirection;
  /** Total duration of this clip in frames. Used to normalize motion speed
   *  regardless of clip length. */
  durationInFrames: number;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  src,
  direction,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // Normalize progress 0→1 across the clip. Satori does its own interpolation
  // but we want a predictable linear ramp per frame.
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Resolve transform per direction. Scales >1.0 ensure we never see a hard
  // edge when panning or zooming.
  const { scale, translateX, translateY, origin } = resolveMotion(direction, t);

  // Fallback gray background for missing/broken image URLs so Remotion Studio
  // doesn't show a flash of the previous frame.
  if (!src) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#1a1a1a",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "absolute",
        inset: 0,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          transformOrigin: origin,
        }}
      />
    </div>
  );
};

interface MotionState {
  scale: number;
  translateX: number;
  translateY: number;
  origin: string;
}

function resolveMotion(
  direction: KenBurnsDirection,
  t: number
): MotionState {
  switch (direction) {
    case "slowZoomIn": {
      // 1.08 → 1.18 over the clip. Very gentle — reads as "breathing".
      return {
        scale: 1.08 + 0.10 * t,
        translateX: 0,
        translateY: 0,
        origin: "center center",
      };
    }
    case "zoomIn": {
      // 1.05 → 1.25 over the clip.
      return {
        scale: 1.05 + 0.20 * t,
        translateX: 0,
        translateY: 0,
        origin: "center center",
      };
    }
    case "zoomOut": {
      return {
        scale: 1.25 - 0.18 * t,
        translateX: 0,
        translateY: 0,
        origin: "center center",
      };
    }
    case "slowPanLeft": {
      // Pan 4% right→left over the clip at 1.12× scale. Subtle.
      return {
        scale: 1.12,
        translateX: 2 - 4 * t,
        translateY: 0,
        origin: "center center",
      };
    }
    case "slowPanRight": {
      return {
        scale: 1.12,
        translateX: -2 + 4 * t,
        translateY: 0,
        origin: "center center",
      };
    }
    case "panLeft": {
      // Pan 7% right→left at 1.18× scale.
      return {
        scale: 1.18,
        translateX: 3.5 - 7 * t,
        translateY: 0,
        origin: "center center",
      };
    }
    case "panRight": {
      return {
        scale: 1.18,
        translateX: -3.5 + 7 * t,
        translateY: 0,
        origin: "center center",
      };
    }
    case "whipLeft": {
      // Aggressive back-to-front ease, big motion. Used by quick-tour.
      // Exponential ease so the whip is fast at the start and settles.
      const eased = 1 - Math.pow(1 - t, 3);
      return {
        scale: 1.2,
        translateX: 8 - 16 * eased,
        translateY: 0,
        origin: "center center",
      };
    }
    case "whipRight": {
      const eased = 1 - Math.pow(1 - t, 3);
      return {
        scale: 1.2,
        translateX: -8 + 16 * eased,
        translateY: 0,
        origin: "center center",
      };
    }
    case "macro": {
      // Tight crop (1.7×) with slight vertical drift — simulates a
      // slow push-in from a macro lens. Used by details-closeup.
      return {
        scale: 1.7,
        translateX: 0,
        translateY: 1.5 - 3 * t,
        origin: "center center",
      };
    }
    case "macroPanRight": {
      // Same tight crop, but drifts horizontally. Alternates with "macro"
      // across beats so the template doesn't feel monotone.
      return {
        scale: 1.7,
        translateX: -2 + 4 * t,
        translateY: 0,
        origin: "center center",
      };
    }
    case "hardCut":
    default: {
      return {
        scale: 1.1,
        translateX: 0,
        translateY: 0,
        origin: "center center",
      };
    }
  }
}
