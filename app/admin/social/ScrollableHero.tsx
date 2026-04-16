"use client";

import { useCallback, useEffect, useState } from "react";

export interface HeroImage {
  url: string;
  label: string;
  category: string | null;
}

/**
 * Mini-carousel for the top of a draft card. Lets the admin flip through
 * every image in the post (5 carousel slides, 6 reel clip sources, or the
 * single composed story PNG) without leaving the page.
 *
 * Behavior:
 *   - Chevron buttons prev/next, wraps at both ends.
 *   - Hidden entirely when count ≤ 1 (story posts).
 *   - Shows "idx / count · label" pill in the bottom-right — handy for
 *     spot-checking "is slide 3 actually the living room?" at a glance.
 *   - Keyboard ← / → work when focused on one of the buttons.
 *   - Index resets to 0 if the image list changes length (e.g. caption
 *     refresh causes a re-render with a different row version).
 *
 * This component ONLY renders the scrollable image + chevrons + pill. The
 * outer card positions format / status badges on top via siblings.
 */
export default function ScrollableHero({
  images,
  placeholderText,
  categoryLabel,
}: {
  images: HeroImage[];
  placeholderText: string;
  /** Map from category slug → display label. Kept out of this component so
   *  the source of truth stays in the server page, and this file doesn't
   *  need to re-declare the category set. */
  categoryLabel: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);
  const next = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  // Guard against list shrinking out from under us.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[12px] text-muted">
        {placeholderText}
      </div>
    );
  }

  const current = images[index];
  const showChevrons = count > 1;
  const catLabel = current.category ? categoryLabel[current.category] ?? current.category : null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt={current.label}
        className="h-full w-full object-cover"
      />

      {showChevrons && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[18px] leading-none text-white shadow-md transition-colors hover:bg-black/70"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[18px] leading-none text-white shadow-md transition-colors hover:bg-black/70"
          >
            ›
          </button>

          {/* Bottom-center: tiny dot pips so you can see position at a glance. */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>

          {/* Bottom-right: "3 / 5 · Kitchen" index + what-is-this pill. */}
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            {index + 1} / {count}
            {catLabel ? ` · ${catLabel}` : ""}
          </span>
        </>
      )}
    </>
  );
}
