import type { Media } from "@/lib/lot71/projects";
import { Placeholder } from "./Placeholder";
import VimeoBackground from "./VimeoBackground";

// HeroMedia renders a Project's hero Media as the background of a
// full-bleed section. Handles:
//   - placeholder : stylized gradient block (dev mode until real assets land)
//   - image       : static poster via <img>
//   - video       : muted, autoplay, loop, playsInline — iOS-safe background video
//   - vimeo       : Vimeo iframe with background=1, scaled to cover
export default function HeroMedia({
  media,
  priority = false,
  overlay = true,
}: {
  media: Media;
  priority?: boolean;
  overlay?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {media.kind === "placeholder" && (
        <Placeholder label={media.label} tone={media.tone} showLabel={false} />
      )}

      {media.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.src}
          alt={media.alt ?? ""}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
        />
      )}

      {media.kind === "video" && (
        <video
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      )}

      {media.kind === "vimeo" && (
        <VimeoBackground
          videoId={media.videoId}
          startAt={media.startAt}
          endAt={media.endAt}
          alt={media.alt}
        />
      )}

      {overlay && (
        <>
          {/* Top scrim — keeps the floating nav legible on any hero tone */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-44"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0) 100%)",
            }}
          />
          {/* Main overlay — darkens the content area so copy reads over any photo */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.75) 100%)",
            }}
          />
        </>
      )}
    </div>
  );
}
