"use client";

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

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-8">
        <Link href="/">
          <Wordmark size={18} />
        </Link>
        <div className="flex items-center gap-7">
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
      </div>
    </nav>
  );
}
