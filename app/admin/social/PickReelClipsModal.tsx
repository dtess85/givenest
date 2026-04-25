"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { pickReelClipsAction } from "./actions";

/**
 * Pick which photos from a listing go into the 8 reel clip slots.
 *
 * Opens as a modal over the /admin/social page. Top row: the 8 clip slots in
 * order (click to remove). Bottom: the full listing photo grid with category
 * badges (click to fill the next empty slot; click again to remove from the
 * slot sequence).
 *
 * Save calls `pickReelClipsAction`, which rewrites `listing_snapshot.images`
 * so the picked URLs land in positions 0..N-1 — the existing Remotion render
 * path reads images[0..7], so no other changes are needed to get the picks
 * into the rendered MP4.
 */

const CATEGORY_LABEL: Record<string, string> = {
  exterior_front: "Front",
  exterior_back: "Backyard",
  aerial: "Aerial",
  kitchen: "Kitchen",
  living: "Living",
  dining: "Dining",
  primary_bedroom: "Primary BR",
  bedroom: "Bedroom",
  bath: "Bath",
  office: "Office",
  other_interior: "Interior",
  floorplan_or_map: "Floorplan",
  other: "Other",
};

/** How many clip slots the price-reveal/quick-tour reels consume. Kept as a
 *  soft UI target — save still works with fewer picks, the remaining slots
 *  fall back to the next snapshot images. */
const TARGET_SLOTS = 8;

interface PickReelClipsModalProps {
  open: boolean;
  onClose: () => void;
  rowId: string;
  /** Listing address shown in the modal header for context. */
  addressLabel: string;
  /** Full photo pool for this listing (typically ~30–60 URLs). */
  images: string[];
  /** Parallel array of categories. May be shorter than `images` if the row
   *  pre-dates classification — missing entries render without a badge. */
  imageCategories: string[];
}

export default function PickReelClipsModal({
  open,
  onClose,
  rowId,
  addressLabel,
  images,
  imageCategories,
}: PickReelClipsModalProps) {
  // First TARGET_SLOTS URLs are the current picks (everything after is the
  // reserve pool). The modal lets admins rearrange/replace just the picks.
  const initialPicks = useMemo(
    () => images.slice(0, TARGET_SLOTS),
    [images]
  );

  const [picks, setPicks] = useState<string[]>(initialPicks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Reset local state whenever the modal opens with a fresh row.
  useEffect(() => {
    if (open) {
      setPicks(initialPicks);
      setError(null);
    }
  }, [open, initialPicks]);

  // Close on ESC. Keeps focus with the modal DOM so this doesn't fight with
  // other escape handlers on the page.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function togglePick(url: string) {
    setPicks((prev) => {
      const idx = prev.indexOf(url);
      if (idx !== -1) {
        // Already picked — remove it from the sequence.
        return prev.filter((u) => u !== url);
      }
      if (prev.length >= TARGET_SLOTS) {
        // Pool is full — reject rather than silently bumping the last pick
        // (less surprising than an auto-replace).
        setError(`Pick at most ${TARGET_SLOTS} photos. Remove one first.`);
        return prev;
      }
      setError(null);
      return [...prev, url];
    });
  }

  function removeSlot(slotIndex: number) {
    setPicks((prev) => prev.filter((_, i) => i !== slotIndex));
    setError(null);
  }

  function save() {
    if (picks.length === 0) {
      setError("Pick at least one photo.");
      return;
    }
    startTransition(async () => {
      const res = await pickReelClipsAction(rowId, picks);
      if (!res.ok) {
        setError(res.error ?? "Save failed.");
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      // Click the backdrop to close — but not clicks inside the panel.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Pick reel clips"
    >
      <div className="flex h-full max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-[12px] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Pick reel clips</h2>
            <p className="text-[12px] text-muted">{addressLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] px-2 py-1 text-sm text-muted hover:bg-[#F4F3EE]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Picked slots */}
        <div className="border-b border-border bg-[#FAFAF8] px-5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Clip order ({picks.length}/{TARGET_SLOTS})
            </div>
            {picks.length > 0 && (
              <button
                type="button"
                onClick={() => setPicks([])}
                className="text-[11px] text-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: TARGET_SLOTS }).map((_, i) => {
              const url = picks[i];
              return (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-[4px] border border-border bg-[#F0EDEA]"
                >
                  {url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Clip ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0 text-[12px] leading-5 text-white hover:bg-black"
                        aria-label={`Remove clip ${i + 1}`}
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {i + 1}
                      </span>
                    </>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[11px] text-muted">
                      {i + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo pool */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            All photos ({images.length})
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {images.map((url, i) => {
              const pickIdx = picks.indexOf(url);
              const picked = pickIdx !== -1;
              const category = imageCategories[i];
              return (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => togglePick(url)}
                  className={`group relative block aspect-square overflow-hidden rounded-[4px] border-2 bg-[#F0EDEA] transition-colors ${
                    picked ? "border-coral" : "border-transparent hover:border-border"
                  }`}
                  title={category ? CATEGORY_LABEL[category] ?? category : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {picked && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[11px] font-semibold text-white">
                      {pickIdx + 1}
                    </span>
                  )}
                  {category && (
                    <span className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/75 to-transparent px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {CATEGORY_LABEL[category] ?? category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {error ? (
            <p className="text-[12px] text-[#A31F1F]">{error}</p>
          ) : (
            <p className="text-[12px] text-muted">
              Click a photo to add it · click again to remove · the order shown here is the clip order.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[6px] px-3 py-1.5 text-sm text-muted hover:bg-[#F4F3EE]"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-[6px] bg-coral px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save clip order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
