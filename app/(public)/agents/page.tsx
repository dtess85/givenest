"use client";

import Link from "next/link";

const team = [
  {
    initials: "KY",
    name: "Kyndall Yates",
    title: "Co-Founder · Salesperson",
    email: "kyndall@givenest.com",
    phone: "(480) 400-8690",
    instagram: "https://www.instagram.com/kdyates/",
  },
  {
    initials: "DT",
    name: "Dustin Tessendorf",
    title: "Co-Founder · Designated Broker",
    email: "dustin@givenest.com",
    phone: "(480) 779-7204",
    instagram: "https://www.instagram.com/dtess/",
  },
];

const differentiators = [
  {
    title: "Licensed in Arizona",
    desc: "You're working with a fully licensed professional, backed by the Givenest brokerage.",
  },
  {
    title: "Driven by more than commission",
    desc: "Your agent isn't just focused on the deal — they're invested in making your transaction meaningful.",
  },
  {
    title: "Guidance beyond the transaction",
    desc: "From choosing a cause to handling the details, your agent makes the giving simple and seamless.",
  },
  {
    title: "Full support, start to finish",
    desc: "From offer to closing, you're supported by experienced agents and a platform built to keep everything on track.",
  },
];

export default function Agents() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-[72px] pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            The team
          </span>
          <h1 className="mb-4 max-w-[640px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
            The team behind
            <br />
            <em className="text-coral">the impact.</em>
          </h1>
          <p className="max-w-[480px] text-[17px] font-light leading-[1.75] text-muted">
            Every Givenest closing is handled by licensed agents — bringing care,
            expertise, and meaning to every transaction.
          </p>
        </div>
      </div>

      {/* Team cards */}
      <div className="bg-pampas px-8 py-[72px]">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {team.map((agent) => (
              <div
                key={agent.name}
                className="overflow-hidden rounded-[12px] border border-border bg-white"
              >
                <div className="h-[3px] bg-coral" />
                <div className="p-7">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-coral text-base font-medium text-white">
                      {agent.initials}
                    </div>
                    <div>
                      <div className="mb-[3px] font-serif text-[19px] font-medium text-black">
                        {agent.name}
                      </div>
                      <div className="text-xs font-light text-muted">
                        {agent.title}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 h-px bg-border" />
                  <div className="flex flex-col gap-[6px]">
                    <a
                      href={`mailto:${agent.email}`}
                      className="text-[13px] font-light text-coral hover:underline"
                    >
                      {agent.email}
                    </a>
                    <a
                      href={`tel:${agent.phone.replace(/\D/g, "")}`}
                      className="text-[13px] font-light text-muted hover:text-black"
                    >
                      {agent.phone}
                    </a>
                    <a
                      href={agent.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-[2px] inline-block text-coral hover:opacity-70"
                      aria-label="Instagram"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Givenest agents */}
      <div className="bg-white px-8 py-[72px]">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 items-start gap-[80px] md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-serif text-[clamp(26px,3vw,38px)] font-medium leading-[1.2] tracking-[-0.02em] text-black">
                What makes our
                <br />
                <em className="text-coral">agents</em> different.
              </h2>
              <p className="text-[15px] font-light leading-[1.85] text-muted">
                Every Givenest agent is committed to more than just closing deals
                — they make every closing meaningful. They represent your
                interests, and the impact your transaction creates.
              </p>
            </div>
            <div>
              {differentiators.map(({ title, desc }) => (
                <div
                  key={title}
                  className="flex gap-[14px] border-b border-border py-4"
                >
                  <div className="mt-[7px] h-[6px] w-[6px] flex-shrink-0 rounded-full bg-coral" />
                  <div>
                    <div className="mb-1 text-sm font-semibold text-black">
                      {title}
                    </div>
                    <div className="text-[13px] font-light leading-[1.7] text-muted">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Join CTA */}
      <div className="bg-pampas px-8 py-[80px]">
        <div className="mx-auto max-w-[640px] text-center">
          <div className="mx-auto mb-8 h-[3px] w-12 bg-coral" />
          <h2 className="mb-4 font-serif text-[clamp(28px,3.5vw,44px)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
            A career worth
            <br />
            <em className="text-coral">talking about.</em>
          </h2>
          <p className="mb-10 text-base font-light leading-[1.85] text-muted">
            We&apos;re selective by design. If you believe real estate can do
            more than close deals, you&apos;ll fit right in.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:dustin@givenest.com"
              className="inline-block rounded-md bg-coral px-9 py-[14px] text-[15px] font-medium text-white transition-colors hover:bg-[#d4574a]"
            >
              Apply to join
            </a>
            <Link
              href="/buy"
              className="inline-block rounded-md border border-border px-9 py-[14px] text-[15px] font-light text-muted transition-colors hover:border-coral hover:text-coral"
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
