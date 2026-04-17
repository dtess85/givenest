import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { KenBurnsDirection, ReelInputProps } from "../../types";
import { KenBurns } from "../shared/KenBurns";
import {
  Scrim,
  HookCard,
  Kicker,
  DonationBadge,
  EndCard,
  Wordmark,
  ClipFade,
  Vignette,
  CornerCaption,
} from "../shared/BrandOverlays";
import { loadFonts } from "../shared/fonts";

/**
 * Details-closeup Reel template — "product photography".
 *
 * Distinct visual language from walkthrough-cinematic so it doesn't feel
 * like the same tour at a different speed:
 *
 *   - Tight macro crops (1.7× scale via new `macro` / `macroPanRight`
 *     motion) — the photo reads as a detail, not a wide.
 *   - Vignette overlay — soft radial darkening at the edges pulls the
 *     viewer's eye to the center. Magazine-photo feel.
 *   - No big centered ClipOverlay pills. Instead, small Lora italic
 *     CornerCaptions anchor to the bottom-left — reads like photo credits
 *     / captions in a coffee-table book.
 *   - Longer crossfades (18f ≈ 0.6s) so transitions feel like dissolves.
 *
 * Structure (17s @ 30fps = 510 frames, 6 beats — 3 caption-bearing
 * macro beats back-to-back, no silent beat in between):
 *
 *   Frames    Beat  Photo                 Caption              Source  Motion
 *   ----------------------------------------------------------------------------
 *   0–59      1     Hero exterior         HookCard             clip 0  slowZoomIn
 *   60–149    2     Interior macro        address              clip 1  macro
 *   150–239   3     Kitchen macro         year built + lot     clip 2  macroPanRight
 *   240–329   4     Living macro          $/sqft               clip 4  macro
 *   330–419   5     Aerial / outdoor      DONATION             clip 6  slowZoomIn
 *   420–509   6     Hero return           END CARD             clip 7  slowZoomIn
 *
 * Donation + EndCard are kept because those are brand requirements — every
 * reel closes the same way.
 */

loadFonts();

const CROSSFADE_FRAMES = 18;

/** 17s runtime — overridden per-composition in Root.tsx. */
export const DETAILS_CLOSEUP_DURATION_FRAMES = 510;

const CLIPS: {
  start: number;
  duration: number;
  sourceIdx: number;
  motion: KenBurnsDirection;
}[] = [
  { start: 0,   duration: 60, sourceIdx: 0, motion: "slowZoomIn" },    // 1. Hook
  { start: 60,  duration: 90, sourceIdx: 1, motion: "macro" },         // 2. Macro — address
  { start: 150, duration: 90, sourceIdx: 2, motion: "macroPanRight" }, // 3. Macro — year/lot
  { start: 240, duration: 90, sourceIdx: 4, motion: "macro" },         // 4. Macro — $/sqft
  { start: 330, duration: 90, sourceIdx: 6, motion: "slowZoomIn" },    // 5. Donation
  { start: 420, duration: 90, sourceIdx: 7, motion: "slowZoomIn" },    // 6. End card
];

export const DetailsCloseup: React.FC<ReelInputProps> = ({
  hookText,
  ctaText,
  donationLabel,
  officeName,
  city,
  clips,
  address,
  yearBuilt,
  lotSize,
  pricePerSqft,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Pick 2 corner captions from the listing's meatiest fields. Ordered by
  // specificity — address is most distinctive (luxury-real-estate language
  // leads with location), then year/lot (architectural context), then
  // $/sqft (market fluency). Fall back through the list if fields are
  // missing so we never show a generic fluff line.
  const detailCaptions = buildDetailCaptions({
    address,
    yearBuilt,
    lotSize,
    pricePerSqft,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Clips with long crossfades + macro-heavy KenBurns. */}
      {CLIPS.map((clip, i) => (
        <Sequence
          key={i}
          from={clip.start}
          durationInFrames={clip.duration + CROSSFADE_FRAMES}
        >
          <ClipFade fadeInFrames={CROSSFADE_FRAMES}>
            <KenBurns
              src={clips[clip.sourceIdx]?.imageUrl ?? ""}
              direction={clip.motion}
              durationInFrames={clip.duration + CROSSFADE_FRAMES}
            />
          </ClipFade>
        </Sequence>
      ))}

      {/* Vignette + scrim — vignette darkens edges, scrim darkens top/bottom
          for text legibility. Layered. */}
      <Vignette />
      <Scrim />

      <AbsoluteFill>
        <Kicker city={city} />
      </AbsoluteFill>

      <AbsoluteFill>
        <Wordmark />
      </AbsoluteFill>

      {/* Hook — big centered card on beat 1 (same brand treatment as other
          templates; we don't differentiate the hook). */}
      <Sequence from={CLIPS[0].start} durationInFrames={CLIPS[0].duration}>
        <HookCard hookText={hookText} />
      </Sequence>

      {/* Corner captions on all 3 macro beats — small Lora italic,
          bottom-left, reads like photo credits in a coffee-table book. */}
      {detailCaptions[0] && (
        <Sequence from={CLIPS[1].start} durationInFrames={CLIPS[1].duration}>
          <CornerCaption
            text={detailCaptions[0]}
            corner="bottom-left"
            durationInFrames={CLIPS[1].duration}
          />
        </Sequence>
      )}
      {detailCaptions[1] && (
        <Sequence from={CLIPS[2].start} durationInFrames={CLIPS[2].duration}>
          <CornerCaption
            text={detailCaptions[1]}
            corner="bottom-left"
            durationInFrames={CLIPS[2].duration}
          />
        </Sequence>
      )}
      {detailCaptions[2] && (
        <Sequence from={CLIPS[3].start} durationInFrames={CLIPS[3].duration}>
          <CornerCaption
            text={detailCaptions[2]}
            corner="bottom-left"
            durationInFrames={CLIPS[3].duration}
          />
        </Sequence>
      )}

      {/* Donation — beat 5. */}
      <Sequence from={CLIPS[4].start} durationInFrames={CLIPS[4].duration}>
        <DonationBadge donationLabel={donationLabel} />
      </Sequence>

      {/* End card — beat 6. */}
      <Sequence
        from={CLIPS[5].start}
        durationInFrames={durationInFrames - CLIPS[5].start}
      >
        <EndCard ctaText={ctaText} officeName={officeName} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Pick up to 3 corner captions for the macro beats, drawn from real
 * listing fields. Priority order (most distinctive first):
 *
 *   1. address          — "4248 E Patricia Jane Drive"
 *   2. yearBuilt+lot    — "Built 2025 · 0.29 acre lot"
 *                         (or just year / just lot if one is missing)
 *   3. pricePerSqft     — "$830/sqft"
 *
 * We return up to 3 entries. If fewer are available, later beats render
 * without a caption (the photo speaks for itself). Never falls back to
 * generic fluff like "Custom finishes" — if we can't say something
 * specific, say nothing.
 */
function buildDetailCaptions(args: {
  address?: string;
  yearBuilt?: number;
  lotSize?: string;
  pricePerSqft?: string;
}): [string | undefined, string | undefined, string | undefined] {
  const candidates: string[] = [];

  if (args.address?.trim()) {
    candidates.push(args.address.trim());
  }

  // Architectural context — combine year + lot if we have both, else just one.
  const yearPart = args.yearBuilt ? `Built ${args.yearBuilt}` : null;
  const lotPart = args.lotSize ? `${args.lotSize} lot` : null;
  const archPart = [yearPart, lotPart].filter(Boolean).join(" · ");
  if (archPart) candidates.push(archPart);

  if (args.pricePerSqft) {
    candidates.push(args.pricePerSqft);
  }

  return [candidates[0], candidates[1], candidates[2]];
}
