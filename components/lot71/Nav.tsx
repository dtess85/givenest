"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "./Wordmark";

const links = [
  { href: "/lot71/work", label: "Work" },
  { href: "/lot71/story", label: "Story" },
  { href: "/lot71/contact", label: "Contact" },
];

export default function Nav({ overHero = false }: { overHero?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  // On hero pages, the nav floats over the media and inverts to white until
  // the user scrolls past the hero.
  const transparent = overHero && !scrolled;

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
        transparent
          ? "bg-transparent"
          : "border-b border-[#E8E4DC] bg-[#FAFAF7]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6 md:px-10">
        <Link href="/lot71" className="flex-shrink-0">
          <Wordmark size={16} dark={transparent} />
        </Link>

        <div className="ml-auto hidden items-center gap-9 md:flex">
          {links.map(({ href, label }) => {
            const active =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`text-[13px] tracking-[0.08em] uppercase transition-colors ${
                  transparent
                    ? "text-white/90 hover:text-white"
                    : active
                      ? "text-[#121212]"
                      : "text-[#6B6860] hover:text-[#121212]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`h-[1.5px] w-5 transition-all ${
              transparent ? "bg-white" : "bg-[#121212]"
            } ${open ? "translate-y-[6.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-[1.5px] w-5 transition-all ${
              transparent ? "bg-white" : "bg-[#121212]"
            } ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`h-[1.5px] w-5 transition-all ${
              transparent ? "bg-white" : "bg-[#121212]"
            } ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#E8E4DC] bg-[#FAFAF7] px-6 pb-8 pt-5 md:hidden">
          <div className="flex flex-col gap-5">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="text-[13px] uppercase tracking-[0.08em] text-[#121212]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
