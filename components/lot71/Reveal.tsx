"use client";

import { useEffect, useRef, useState } from "react";

// Reveal — fades + slides children up once they enter the viewport.
// Idempotent: toggles the class once on first intersection, then
// disconnects the observer. Always wraps in a <div> for simplicity;
// if semantic markup matters, the caller can pass semantic children.
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    // Honor reduced-motion: fade in immediately with no transform.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const style: React.CSSProperties = {
    transition: "opacity 900ms ease, transform 900ms ease",
    transitionDelay: `${delay}ms`,
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(18px)",
    willChange: "opacity, transform",
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
