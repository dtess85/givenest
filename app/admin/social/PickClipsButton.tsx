"use client";

import { useState } from "react";
import PickReelClipsModal from "./PickReelClipsModal";

/**
 * Thin client wrapper that owns the modal's open/close state. The surrounding
 * card renders server-side, so the button itself is the only client boundary
 * per REEL row — the modal mounts lazily on first open.
 */
export default function PickClipsButton({
  rowId,
  addressLabel,
  images,
  imageCategories,
}: {
  rowId: string;
  addressLabel: string;
  images: string[];
  imageCategories: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral transition-colors"
      >
        Pick clips
      </button>
      {open && (
        <PickReelClipsModal
          open={open}
          onClose={() => setOpen(false)}
          rowId={rowId}
          addressLabel={addressLabel}
          images={images}
          imageCategories={imageCategories}
        />
      )}
    </>
  );
}
