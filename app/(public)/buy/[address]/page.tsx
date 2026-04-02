"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug, AGENTS } from "@/lib/mock-data";
import { fmt } from "@/lib/utils";
import GivingPanel from "@/components/GivingPanel";

export default function PropertyDetail() {
  const params = useParams();
  const property = getPropertyBySlug(params.address as string);

  if (!property) {
    return (
      <div className="mx-auto max-w-[1100px] px-8 py-20 text-center">
        <h1 className="font-serif text-2xl font-medium">Property not found</h1>
        <Link href="/buy" className="mt-4 inline-block text-sm text-coral hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10">
      <Link
        href="/buy"
        className="mb-6 inline-block text-[13px] text-muted transition-colors hover:text-black"
      >
        ← Back to search
      </Link>

      <div className="grid grid-cols-1 items-start gap-11 lg:grid-cols-[1fr_360px]">
        {/* Left column — property info */}
        <div>
          <div className="mb-6 flex h-[240px] items-end rounded-[10px] bg-[#F5F4F2] p-6">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-[0.06em] text-muted">
                {property.type}
              </div>
              <h1 className="mb-[3px] font-serif text-[26px] font-medium tracking-[-0.02em]">
                {property.address}
              </h1>
              <div className="text-[13px] text-muted">{property.city}</div>
            </div>
          </div>

          <div className="mb-6 flex gap-7">
            {[
              ["Price", fmt(property.price)],
              ["Beds", property.beds],
              ["Baths", property.baths],
              ["Sqft", property.sqft.toLocaleString()],
            ].map(([k, v]) => (
              <div key={k as string}>
                <div className="mb-[3px] text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
                  {k}
                </div>
                <div className="text-base font-semibold">{v}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 h-px bg-border" />

          <h3 className="mb-[14px] font-serif text-[17px] font-medium tracking-[-0.01em]">
            givenest agents
          </h3>
          <div className="flex flex-col gap-2">
            {AGENTS.map((a) => (
              <div
                key={a.initials}
                className="flex items-center gap-[14px] rounded-[10px] border border-border bg-white p-[14px_18px]"
              >
                <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-[#F0EFED] text-[11px] font-medium text-muted">
                  {a.initials}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{a.name}</div>
                  <div className="mt-px text-xs text-muted">{a.markets}</div>
                </div>
                <div className="mr-[10px] text-right">
                  <div className="text-[15px] font-semibold text-coral">
                    {a.closings}
                  </div>
                  <div className="text-[10px] text-cloudy">closings</div>
                </div>
                <button className="rounded-md border border-border px-[14px] py-[7px] text-xs transition-all hover:border-coral hover:text-coral">
                  Request
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — Giving Panel (sticky) */}
        <div className="sticky top-[68px]">
          <GivingPanel price={property.price} variant="property" />
        </div>
      </div>
    </div>
  );
}
