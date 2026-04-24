"use client";

import { useState, useTransition } from "react";
import { generateReelAction } from "./actions";
import type { ReelTarget } from "@/lib/social/reel-target";

/**
 * Generate-a-reel control at the top of /admin/social.
 *
 * Four modes:
 *   - URL     — paste a givenest.com/buy URL (or any /buy/<key> path/slug).
 *   - Price   — min/max, picks a random Active listing in range.
 *   - City    — picks a random Active listing in that city.
 *   - Random  — any Active listing.
 *
 * On success, emits a row in social_posts and the page revalidates so the
 * new REEL card shows up. Clip-picking happens on the card itself via
 * <PickReelClipsModal>.
 *
 * Render (MP4) is intentionally still a CLI step — this just creates the
 * draft row. The success toast tells the admin the exact command.
 */

type Mode = "url" | "price" | "city" | "random";

const MODE_LABEL: Record<Mode, string> = {
  url: "URL",
  price: "Price",
  city: "City",
  random: "Random",
};

export default function GenerateReelPanel() {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "ok"; label: string; slug: string; classified: boolean }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  function submit() {
    setResult({ kind: "idle" });

    const target: ReelTarget | null = (() => {
      if (mode === "url") {
        if (!url.trim()) return null;
        return { mode: "url", url: url.trim() };
      }
      if (mode === "price") {
        const min = minPrice ? Number(minPrice) : undefined;
        const max = maxPrice ? Number(maxPrice) : undefined;
        if (min == null && max == null) return null;
        return { mode: "price", minPrice: min, maxPrice: max };
      }
      if (mode === "city") {
        if (!city.trim()) return null;
        return { mode: "city", city: city.trim() };
      }
      return { mode: "random" };
    })();

    if (!target) {
      setResult({ kind: "err", message: "Fill in the fields for this mode." });
      return;
    }

    startTransition(async () => {
      const res = await generateReelAction(target);
      if (!res.ok) {
        setResult({ kind: "err", message: res.error ?? "Something went wrong." });
        return;
      }
      setResult({
        kind: "ok",
        label: res.label ?? "listing",
        slug: res.id ?? "",
        classified: !!res.classified,
      });
    });
  }

  const disabled = pending;

  return (
    <section className="mb-6 rounded-[10px] border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Generate a reel</h2>
          <p className="text-[12px] text-muted">
            Create a REEL draft for any Spark listing. Pick clips on the new card, then run
            <code className="mx-1 rounded bg-[#F4F3EE] px-1">pnpm remotion:render --slug &lt;slug&gt;</code>
            locally to render the MP4.
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-3 flex gap-1">
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              mode === m
                ? "bg-foreground text-white"
                : "bg-[#F4F3EE] text-foreground hover:bg-[#ECE9E4]"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Per-mode inputs */}
      <div className="mb-3 flex flex-wrap items-end gap-2">
        {mode === "url" && (
          <label className="flex flex-1 min-w-[280px] flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-muted">Givenest URL or slug</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://givenest.com/buy/20260107225523567873000000"
              className="rounded-[6px] border border-border bg-white px-3 py-2 text-sm"
              disabled={disabled}
            />
          </label>
        )}

        {mode === "price" && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-muted">Min $</span>
              <input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="800000"
                className="w-[140px] rounded-[6px] border border-border bg-white px-3 py-2 text-sm"
                disabled={disabled}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-muted">Max $</span>
              <input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="1500000"
                className="w-[140px] rounded-[6px] border border-border bg-white px-3 py-2 text-sm"
                disabled={disabled}
              />
            </label>
          </>
        )}

        {mode === "city" && (
          <label className="flex flex-1 min-w-[220px] flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-muted">City</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Gilbert"
              className="rounded-[6px] border border-border bg-white px-3 py-2 text-sm"
              disabled={disabled}
            />
          </label>
        )}

        {mode === "random" && (
          <p className="text-[12px] text-muted">Picks any random Active listing.</p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="rounded-[6px] bg-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* Result */}
      {result.kind === "ok" && (
        <div className="rounded-[6px] border border-[#E6F6EC] bg-[#F0FAF4] p-3 text-[13px]">
          <div className="mb-1 font-semibold text-[#1F7A40]">
            Draft created · {result.label}
          </div>
          <div className="text-muted">
            {result.classified
              ? "Photos were classified with Vision — kitchen/living/backyard are ordered first. Click “Pick clips” on the new card to tweak."
              : "Photos are in raw MLS order (set ANTHROPIC_API_KEY to auto-order). Click “Pick clips” on the new card to pick specific photos."}
          </div>
        </div>
      )}
      {result.kind === "err" && (
        <div className="rounded-[6px] border border-[#FDE2E2] bg-[#FFF5F5] p-3 text-[13px] text-[#A31F1F]">
          {result.message}
        </div>
      )}
    </section>
  );
}
