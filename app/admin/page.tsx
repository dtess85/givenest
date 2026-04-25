"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const links = [
    { href: "/admin/listings/new", label: "Add listing", desc: "Import from Spark or create manually" },
    { href: "/admin/featured", label: "Featured", desc: "Manage featured agents, charities, and properties" },
    { href: "/admin/transactions/new", label: "Log closing", desc: "Record a completed transaction" },
    { href: "/admin/listings", label: "Listings", desc: "View and edit manual listings" },
    { href: "/admin/social", label: "Social posts", desc: "Instagram drafts & schedule" },
    { href: "/admin/landlords", label: "Landlords", desc: "Manage owners, properties, service log & invoices" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {/* Header */}
      <div className="border-b border-border bg-black px-8 py-4">
        <div className="mx-auto flex max-w-[860px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium text-white">
              give<span className="text-coral">nest</span>
            </a>
            <span className="text-white/30">|</span>
            <span className="text-[13px] text-white/60">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            {email && <span className="text-[12px] text-white/50">{email}</span>}
            <button
              onClick={handleSignOut}
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-8 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-medium tracking-[-0.01em]">Admin</h1>
        <p className="mb-8 text-[14px] text-muted">Manage listings, featured content, and closings.</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-[10px] border border-border bg-white px-5 py-4 transition-colors hover:border-coral"
            >
              <div className="text-[14px] font-medium group-hover:text-coral transition-colors">
                {link.label}
              </div>
              <div className="mt-1 text-[12px] text-muted">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
