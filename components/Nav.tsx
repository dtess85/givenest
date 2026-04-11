"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "./Wordmark";
import ListingSearch from "./ListingSearch";

const links = [
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/charities", label: "Charities" },
  { href: "/agents", label: "Agents" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Hero already owns the big search bar on the home page, so we only surface
  // the compact nav search once the user has navigated anywhere else.
  const showSearch = pathname !== "/";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-6 px-8">
        <Link href="/" className="flex-shrink-0">
          <Wordmark size={18} />
        </Link>

        {/* Compact search — hidden on home page and mobile */}
        {showSearch && (
          <div className="hidden min-w-0 flex-1 md:block lg:max-w-[420px]">
            <ListingSearch variant="nav" />
          </div>
        )}

        {/* Desktop nav */}
        <div className={`hidden items-center gap-7 md:flex ${showSearch ? "ml-auto" : "ml-auto"}`}>
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

        {/* Mobile spacer pushes hamburger right when search is hidden */}
        {!showSearch && <div className="flex-1 md:hidden" />}

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
