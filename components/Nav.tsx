"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "./Wordmark";

const links = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/charities", label: "Charities" },
  { href: "/agents", label: "Agents" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-8">
        <Link href="/">
          <Wordmark size={18} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors hover:text-black ${
                pathname === href
                  ? "font-medium text-black"
                  : "font-normal text-muted"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/buy"
            className="rounded-md bg-coral px-[18px] py-[9px] text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`h-[1.5px] w-5 bg-black transition-all ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
          <span className={`h-[1.5px] w-5 bg-black transition-all ${open ? "opacity-0" : ""}`} />
          <span className={`h-[1.5px] w-5 bg-black transition-all ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-white px-8 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`text-sm transition-colors ${
                  pathname === href
                    ? "font-medium text-black"
                    : "font-normal text-muted"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/buy"
              onClick={() => setOpen(false)}
              className="mt-2 inline-block rounded-md bg-coral px-[18px] py-[9px] text-center text-[13px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
