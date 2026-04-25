"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Black top bar shown on every /landlord/dashboard/* page. Mirrors the
 * /admin top bar visually so the brand reads consistently across portals,
 * but with landlord-specific section links and a sign-out button.
 *
 * Pure client component — needs the Supabase browser client for sign-out
 * and the active-link highlight depends on the current pathname.
 */
export default function DashboardHeader({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/landlord/login");
    router.refresh();
  }

  const links = [
    { href: "/landlord/dashboard", label: "Overview" },
    { href: "/landlord/dashboard/profile", label: "Profile" },
    { href: "/landlord/dashboard/documents", label: "Documents" },
    { href: "/landlord/dashboard/billing", label: "Billing" },
  ];

  return (
    <div className="border-b border-border bg-black px-8 py-4">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a href="/" className="font-sans text-[16px] font-medium text-white">
            give<span className="text-coral">nest</span>
          </a>
          <span className="text-white/30">|</span>
          <span className="text-[13px] text-white/60">Owner portal</span>
        </div>
        <nav className="flex items-center gap-5 text-[13px]">
          {links.map((l) => {
            const active = l.href === "/landlord/dashboard"
              ? pathname === l.href
              : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`}
              >
                {l.label}
              </Link>
            );
          })}
          <span className="text-white/20">|</span>
          <span className="text-[12px] text-white/40">{email}</span>
          <button onClick={signOut} className="text-[13px] text-white/60 transition-colors hover:text-white">
            Sign out
          </button>
        </nav>
      </div>
    </div>
  );
}
