"use client";

import { useState } from "react";

interface Props {
  thumbnails: string[];
  address: string;
  aboveFold?: boolean;
  pills?: React.ReactNode;
}

export default function ListingCardMedia({ thumbnails, address, aboveFold, pills }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  // Once true, never resets — gates secondary photo rendering
  const [interacted, setInteracted] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Set on first touch to distinguish touch vs pointer devices
  const [touchDevice, setTouchDevice] = useState(false);

  const hasMultiple = thumbnails.length > 1;
  const showScrollStrip = interacted && touchDevice;
  const showDesktopArrows = hasMultiple && hovered && !touchDevice;

  return (
    <div
      className="relative h-[180px] overflow-hidden bg-[#F5F4F2]"
      onMouseEnter={() => { if (!touchDevice) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => {
        if (!touchDevice) setTouchDevice(true);
        if (!interacted) setInteracted(true);
      }}
    >
      {/* Mobile: scroll-snap strip (only rendered after first touch) */}
      {showScrollStrip ? (
        <div
          className="flex h-full snap-x snap-mandatory overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {thumbnails.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={i === 0 ? address : `${address} photo ${i + 1}`}
              loading={aboveFold && i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full flex-shrink-0 snap-center object-cover"
            />
          ))}
        </div>
      ) : (
        /* Desktop + pre-touch: single image, src swaps on arrow click */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnails[photoIndex] ?? thumbnails[0]}
          alt={address}
          loading={aboveFold ? "eager" : "lazy"}
          decoding="async"
          // @ts-expect-error — fetchpriority is a valid HTML attribute, React types lag behind
          fetchpriority={aboveFold ? "high" : "auto"}
          className={`h-full w-full object-cover transition-transform duration-300 ${!interacted ? "group-hover:scale-[1.03]" : ""}`}
        />
      )}

      {/* Status / label pills */}
      {pills}

      {/* Desktop arrow buttons — appear on hover, fire src swap */}
      {showDesktopArrows && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setInteracted(true);
              setPhotoIndex((i) => (i - 1 + thumbnails.length) % thumbnails.length);
            }}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.85)] shadow-sm hover:bg-white"
            aria-label="Previous photo"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setInteracted(true);
              setPhotoIndex((i) => (i + 1) % thumbnails.length);
            }}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.85)] shadow-sm hover:bg-white"
            aria-label="Next photo"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Photo counter (desktop only, after first arrow click, multi-photo) */}
      {hasMultiple && interacted && !touchDevice && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(0,0,0,0.5)] px-[8px] py-[3px] text-[10px] text-white">
          {photoIndex + 1} / {thumbnails.length}
        </div>
      )}
    </div>
  );
}
