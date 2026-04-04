import Link from "next/link";
import { fmt } from "@/lib/utils";
import { CHARITIES } from "@/lib/mock-data";

export default function FeaturedCharities() {
  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
              Featured charities
            </span>
            <h2 className="font-serif text-[clamp(20px,2.5vw,30px)] font-medium tracking-[-0.02em]">
              Causes already receiving
              <br />
              givenest donations.
            </h2>
          </div>
          <Link
            href="/charities"
            className="text-[13px] text-muted transition-colors hover:text-black"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-[14px]">
          {CHARITIES.map((c) => (
            <div
              key={c.id}
              className="overflow-hidden rounded-[10px] border border-border bg-white"
            >
              <div className="h-[3px] bg-coral" />
              <div className="p-5">
              <div className="mb-[6px] text-[10px] font-medium uppercase tracking-[0.08em] text-coral">
                {c.category}
              </div>
              <div className="mb-[3px] text-sm font-medium">{c.name}</div>
              <div className="mb-[14px] text-xs text-muted">{c.city}</div>
              <div className="mb-3 h-px bg-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-light text-muted">
                  {c.closings} closings
                </span>
                <span className="text-base font-semibold text-coral">
                  {fmt(c.total)}
                </span>
              </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
