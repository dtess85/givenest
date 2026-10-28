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
    <span className="inline-flex flex-col items-start leading-none">
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
          className="font-sans"
          style={{
            fontSize: Math.max(8, Math.round(size * 0.42)),
            letterSpacing: "0.32em",
            marginTop: Math.max(2, Math.round(size * 0.18)),
            color: dark ? "#8E8A82" : "#6B6860",
          }}
        >
          DESIGNS
        </span>
      )}
    </span>
  );
}
