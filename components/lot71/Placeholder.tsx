import type { MediaTone } from "@/lib/lot71/projects";

const tones: Record<MediaTone, { from: string; to: string; fg: string }> = {
  warm:   { from: "#D7C8B0", to: "#B49B74", fg: "#F7F3EC" },
  stone:  { from: "#E6E1D7", to: "#C9C1B2", fg: "#4A4639" },
  ochre:  { from: "#C6973A", to: "#8B6322", fg: "#FBF4E3" },
  shadow: { from: "#2D2A24", to: "#1A1812", fg: "#D7CBAE" },
  clay:   { from: "#B98869", to: "#7E573F", fg: "#F6E8DA" },
};

export function Placeholder({
  label,
  tone,
  showLabel = true,
}: {
  label: string;
  tone: MediaTone;
  showLabel?: boolean;
}) {
  const t = tones[tone];
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)`,
      }}
      aria-label={label}
      role="img"
    >
      {/* subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {showLabel && (
        <div
          className="absolute bottom-5 left-5 font-serif text-[13px] italic tracking-wide"
          style={{ color: t.fg, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
