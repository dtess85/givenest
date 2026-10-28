interface WordmarkProps {
  size?: number;
  dark?: boolean;
  showSub?: boolean;
}

// LOT71 wordmark — monospaced-feeling tracked caps for "LOT71", with an
// optional thin "DESIGNS" sub-label beneath. Accent color is swapped out
// for white on dark backgrounds.
export default function Wordmark({
  size = 18,
  dark = false,
  showSub = true,
}: WordmarkProps) {
  const fg = dark ? "#FAF9F7" : "#121212";
  const accent = dark ? "#E7C57A" : "#B8873D";
  return (
    <span className="inline-flex items-baseline gap-[0.35em] leading-none">
      <span
        className="font-serif font-semibold not-italic"
        style={{
          fontSize: size,
          letterSpacing: "0.14em",
          color: fg,
        }}
      >
        LOT
        <span style={{ color: accent }}>71</span>
      </span>
      {showSub && (
        <span
          className="font-serif italic"
          style={{
            fontSize: size,
            // Match the LOT fg color so it stays white on hero and black
            // when the nav is scrolled over a light background.
            color: fg,
          }}
        >
          Designs
        </span>
      )}
    </span>
  );
}
