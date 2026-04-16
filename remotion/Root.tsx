import React from "react";
import { Composition } from "remotion";
import { WalkthroughCinematic } from "./compositions/reels/WalkthroughCinematic";
import { DEFAULT_REEL_INPUT_PROPS, type ReelInputProps } from "./types";

/**
 * Remotion's `<Composition>` constrains its `Props` generic to
 * `Record<string, unknown>`, which our strict `ReelInputProps` interface
 * doesn't extend (it has specific keys, no index signature). A localized
 * cast at the boundary satisfies the generic without weakening the typed
 * shape everywhere else — the composition itself still reads props as
 * `ReelInputProps`, Studio's schema editor still shows the fields, and the
 * render CLI still enforces the shape.
 */
const WalkthroughCinematicForComposition =
  WalkthroughCinematic as unknown as React.FC<Record<string, unknown>>;

/**
 * Composition registry. One `<Composition>` per reel template.
 *
 * Dimensions: 1080×1920 (9:16) — Instagram's vertical Reel spec. Every
 * modern phone screen is taller than this (iPhone is 9:19.5), but IG's
 * uploader crops/letterboxes anything narrower than 9:16, so 9:16 is the
 * ceiling even though "upright phone" colloquially means taller.
 *
 * Duration: 450 frames @ 30fps = 15s. 6 clips, avg 2.5s each. 15s is IG
 * Reel sweet-spot pacing — long enough to establish a listing, short enough
 * that viewers don't scroll away.
 */
const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;
const REEL_FPS = 30;
const REEL_DURATION_FRAMES = 450; // 15 seconds

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="walkthrough-cinematic"
        component={WalkthroughCinematicForComposition}
        durationInFrames={REEL_DURATION_FRAMES}
        fps={REEL_FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={
          DEFAULT_REEL_INPUT_PROPS as unknown as Record<string, unknown>
        }
      />
    </>
  );
};
