"use client";

import { useEffect, useRef } from "react";

type Props = {
  videoId: string;
  startAt?: number;
  endAt?: number;
  alt?: string;
};

// Minimal shape of Vimeo's Player SDK — just the methods we touch.
// Lets us avoid pulling in `@types/vimeo__player` or using `any`.
type VimeoTimeEvent = { seconds: number };
type VimeoPlayer = {
  ready: () => Promise<void>;
  setCurrentTime: (seconds: number) => Promise<number>;
  on: (
    event: "timeupdate",
    handler: (data: VimeoTimeEvent) => void
  ) => void;
  off: (
    event: "timeupdate",
    handler: (data: VimeoTimeEvent) => void
  ) => void;
};
type VimeoGlobal = {
  Vimeo?: {
    Player: new (iframe: HTMLIFrameElement) => VimeoPlayer;
  };
};

// Vimeo background video with support for a sub-clip loop.
// - Uses Vimeo's `background=1` for autoplay / muted / no controls.
// - Loads the Player SDK on mount and seeks to `startAt` once ready.
// - On every `timeupdate`, snaps back to `startAt` if time has crossed
//   `endAt` OR if the native loop wrapped the player back near zero.
// - Falls back silently to a plain full-length looping embed if the SDK
//   is blocked or fails to load.
export default function VimeoBackground({
  videoId,
  startAt = 0,
  endAt,
  alt,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    let player: VimeoPlayer | undefined;
    let onTime: ((d: VimeoTimeEvent) => void) | undefined;

    const vimeoGlobal = () => window as unknown as VimeoGlobal;

    const loadSdk = () =>
      new Promise<void>((resolve, reject) => {
        if (vimeoGlobal().Vimeo?.Player) return resolve();
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-vimeo-sdk="1"]'
        );
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () =>
            reject(new Error("vimeo sdk"))
          );
          return;
        }
        const s = document.createElement("script");
        s.src = "https://player.vimeo.com/api/player.js";
        s.async = true;
        s.dataset.vimeoSdk = "1";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("vimeo sdk"));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadSdk();
        if (cancelled || !iframeRef.current) return;
        const PlayerCtor = vimeoGlobal().Vimeo?.Player;
        if (!PlayerCtor) return;
        const p: VimeoPlayer = new PlayerCtor(iframeRef.current);
        player = p;
        await p.ready();
        if (cancelled) return;
        if (startAt > 0) {
          try {
            await p.setCurrentTime(startAt);
          } catch {
            // Ignore — initial seek is nice-to-have; the fragment `#t=` in
            // the iframe URL already biases toward the correct start.
          }
        }
        // Native `loop=1` would snap back to 0, not to startAt. Treat a jump
        // backward to anywhere clearly before startAt as a wrap and re-seek.
        const wrapFloor = Math.max(0, startAt - 2);
        onTime = ({ seconds }) => {
          if (endAt !== undefined && seconds >= endAt) {
            p.setCurrentTime(startAt);
            return;
          }
          if (startAt > 0 && seconds < wrapFloor) {
            p.setCurrentTime(startAt);
          }
        };
        p.on("timeupdate", onTime);
      } catch {
        // SDK blocked or failed; the iframe still plays via background=1.
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (player && onTime) player.off("timeupdate", onTime);
      } catch {
        // player may already be gone
      }
    };
  }, [videoId, startAt, endAt]);

  return (
    <div
      aria-label={alt ?? ""}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "max(100vw, 177.78vh)",
        height: "max(56.25vw, 100vh)",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&muted=1&dnt=1#t=${startAt}s`}
        allow="autoplay; fullscreen; picture-in-picture"
        style={{ width: "100%", height: "100%", border: 0 }}
        title={alt ?? "Background video"}
      />
    </div>
  );
}
