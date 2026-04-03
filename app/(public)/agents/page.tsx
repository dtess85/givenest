"use client";

import { useState } from "react";
import { AGENTS } from "@/lib/mock-data";

const values = [
  "You believe real estate can mean more than a commission check.",
  "You want a story your clients are proud to share.",
  "You're connected to causes and communities you care about.",
  "You'd rather build something meaningful than chase another split.",
];

const cards = [
  {
    title: "The listing wins itself",
    desc: "Clients choose you because your transaction does something theirs never has before. The story closes listings.",
  },
  {
    title: "Charities send referrals",
    desc: "Every charity you fund becomes a referral source. Their donors are buying homes. You already have their trust.",
  },
  {
    title: "Your impact compounds",
    desc: "Eight closings a year generates $33,000 to charity. Your brand becomes a documented story no competitor can copy.",
  },
];

const fields = [
  { label: "Full name", key: "name", placeholder: "Your full name" },
  { label: "AZ License number", key: "license", placeholder: "AZ-XXXXXXX" },
  { label: "Markets served", key: "markets", placeholder: "e.g. Scottsdale, Phoenix, Gilbert" },
  { label: "Email", key: "email", placeholder: "your@email.com" },
];

export default function Agents() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", license: "", markets: "", email: "" });

  return (
    <div>
      {/* Hero */}
      <section className="bg-white px-8 pb-[88px] pt-[52px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            For agents
          </span>
          <h1 className="mb-6 font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em] text-black">
            A career worth{" "}
            <em className="text-coral">talking about.</em>
          </h1>
          <p className="mb-12 max-w-[480px] text-lg font-light leading-[1.85] text-muted">
            Most brokerages offer splits and tools. None offer meaning. givenest
            gives you something no other brokerage can — a reason for clients to
            choose you.
          </p>
          <button
            onClick={() =>
              document
                .getElementById("apply")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="rounded-md bg-coral px-10 py-4 text-base font-medium text-white transition-colors hover:bg-[#d4574a]"
          >
            Schedule a conversation →
          </button>
        </div>
      </section>

      {/* Meet the team */}
      <section className="bg-white px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Our agents
          </span>
          <h2 className="mb-8 font-serif text-[clamp(22px,2.8vw,36px)] font-medium tracking-[-0.02em] text-black">
            The team behind the giving.
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-[10px] border border-border bg-white p-6"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[15px] font-semibold text-white">
                    {agent.initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-black">{agent.name}</div>
                    <div className="text-xs font-light text-muted">{agent.markets}</div>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xs font-light text-muted">Closings</span>
                  <span className="text-base font-semibold text-coral">{agent.closings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the brokerage */}
      <section className="bg-white px-8 pb-4 pt-16">
        <div className="mx-auto max-w-[720px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Join the brokerage
          </span>
          <h2 className="font-serif text-[clamp(22px,2.8vw,36px)] font-medium tracking-[-0.02em] text-black">
            Become part of something{" "}
            <em className="text-coral">worth sharing.</em>
          </h2>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-pampas px-8 py-20">
        <div className="mx-auto max-w-[720px]">
          <p className="mb-5 font-serif text-[clamp(20px,2.5vw,32px)] font-medium leading-[1.5] tracking-[-0.01em] text-black">
            &ldquo;Hire me, and your closing generates a donation to the charity{" "}
            <em className="text-coral">you choose.</em>&rdquo;
          </p>
          <p className="text-[15px] font-light text-muted">
            No other agent in Arizona can say this.
          </p>
        </div>
      </section>

      {/* Three value cards */}
      <section className="bg-pampas px-8 pb-20">
        <div className="mx-auto grid max-w-[960px] grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-border bg-white px-7 py-8"
            >
              <div className="mb-5 h-[3px] w-8 bg-coral" />
              <div className="mb-[10px] text-[15px] font-bold leading-[1.3] text-black">
                {card.title}
              </div>
              <div className="text-sm font-light leading-[1.75] text-muted">
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who we're looking for */}
      <section className="bg-white px-8 py-20">
        <div className="mx-auto max-w-[720px]">
          <h2 className="mb-3 font-serif text-[clamp(24px,3vw,40px)] font-semibold tracking-[-0.02em] text-black">
            Who we&apos;re looking for.
          </h2>
          <p className="mb-10 text-[15px] font-light text-muted">
            We don&apos;t need hundreds of agents. We need the right ones.
          </p>
          <div className="flex flex-col gap-[10px]">
            {values.map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-lg border border-border bg-pampas px-[22px] py-[18px]"
              >
                <div className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-coral" />
                <span className="text-[15px] font-light leading-[1.6] text-black">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="bg-pampas px-8 py-20">
        <div className="mx-auto max-w-[520px]">
          <h2 className="mb-[10px] font-serif text-[clamp(24px,3vw,38px)] font-semibold leading-[1.2] tracking-[-0.02em] text-black">
            Let&apos;s talk.
          </h2>
          <p className="mb-10 text-[15px] font-light leading-[1.8] text-muted">
            Tell us a little about yourself. We review every application
            personally and respond within 24 hours.
          </p>

          {step === 0 ? (
            <div className="flex flex-col gap-[14px]">
              {fields.map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="mb-[6px] block text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    {label}
                  </label>
                  <input
                    className="w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <button
                onClick={() => setStep(1)}
                className="mt-2 w-full rounded-md bg-coral py-[14px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]"
              >
                Submit application →
              </button>
              <p className="text-center text-xs font-light text-muted">
                Reviewed personally by Dustin or Kyndall. You&apos;ll hear back
                within 24 hours.
              </p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-coral bg-coral/10">
                <span className="text-[22px] text-coral">&#10003;</span>
              </div>
              <div className="mb-[10px] font-serif text-2xl font-semibold text-black">
                Application received.
              </div>
              <div className="text-sm font-light leading-[1.8] text-muted">
                Dustin or Kyndall will reach out personally within 24 hours.
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
