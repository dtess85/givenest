interface WordmarkProps {
  size?: number;
  dark?: boolean;
}

export default function Wordmark({ size = 18, dark = false }: WordmarkProps) {
  return (
    <span className="inline-flex items-baseline gap-px">
      <span
        className="font-serif font-semibold not-italic"
        style={{ fontSize: size, color: dark ? "#FAF9F7" : "var(--color-black)" }}
      >
        give
      </span>
      <span
        className="font-serif font-semibold italic"
        style={{ fontSize: size, color: "var(--color-coral)" }}
      >
        nest
      </span>
    </span>
  );
}
