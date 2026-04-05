"use client";

import { useState } from "react";
import Link from "next/link";

export default function CharityBillingPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  async function handleManage() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <div className="border-b border-border bg-white px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <a href="/" className="font-sans text-[16px] font-medium">give<span className="text-coral">nest</span></a>
          <span className="text-border">|</span>
          <Link href="/charity/dashboard" className="text-[13px] text-muted hover:text-black">Dashboard</Link>
          <span className="text-border">/</span>
          <span className="text-[13px]">Billing</span>
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-8 py-14">
        <h1 className="mb-3 font-serif text-[28px] font-medium tracking-[-0.01em]">Partner subscription</h1>
        <p className="mb-10 text-[14px] font-light text-muted">
          A Givenest partner profile lets you customize your page with photos, videos, your mission, and more — and keeps your charity prominently featured to buyers and sellers.
        </p>

        <div className="mb-6 rounded-[12px] border border-border bg-white p-8">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Partner profile</div>
          <div className="mb-4 flex items-end gap-1">
            <span className="font-serif text-[40px] font-semibold">$49</span>
            <span className="mb-2 text-[15px] text-muted">/month</span>
          </div>
          <ul className="mb-8 flex flex-col gap-2 text-[14px] font-light text-[#3a3834]">
            {[
              "Fully customizable profile page",
              "Cover photo, logo, gallery (up to 8 images)",
              "Video embed (YouTube or Vimeo)",
              "Mission + description copy",
              "Real-time giving history from Givenest closings",
              "Featured on the charities browse page",
              "\"Partner\" badge on your profile",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[3px] text-coral">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-md bg-coral py-[13px] text-[15px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
          >
            {loading ? "Redirecting..." : "Subscribe — $49/mo"}
          </button>
        </div>

        <button
          onClick={handleManage}
          disabled={loading}
          className="w-full rounded-md border border-border bg-white py-[11px] text-[14px] font-medium text-black transition-colors hover:border-coral hover:text-coral disabled:opacity-60"
        >
          Manage existing subscription →
        </button>
      </div>
    </div>
  );
}
