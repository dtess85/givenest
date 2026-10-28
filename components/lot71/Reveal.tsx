"use client";

import { useEffect, useRef, useState } from "react";

// Reveal — fades + slides children up once they enter the viewport.
// Idempotent: toggles the class once on first intersection, then
// disconnects the observer.
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
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
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}
