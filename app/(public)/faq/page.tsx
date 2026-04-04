"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    q: "How does Givenest make money?",
    a: "Givenest earns a real estate commission on each transaction — the same as any brokerage. The difference is that we donate 25% of that commission to a charity you choose. Our business model is built around closing great deals, not charging extra.",
  },
  {
    q: "Does the charity donation cost me anything?",
    a: "No — nothing. The donation comes entirely from Givenest's side of the commission. Your purchase price, seller proceeds, and closing costs are completely unaffected.",
  },
  {
    q: "What charities can I choose from?",
    a: "Any IRS-registered 501(c)(3) nonprofit in our database of 1.8M+ organizations. That includes local food banks, schools, churches, international relief organizations, animal shelters, hospitals, and more. If it's a registered nonprofit, you can choose it.",
  },
  {
    q: "When does the donation happen?",
    a: "The donation is processed at closing, funded from Givenest's commission. You'll receive a confirmation of the donation — including the organization's name and the amount donated.",
  },
  {
    q: "Can I change my charity before closing?",
    a: "Yes. You can update your charity selection any time before your closing date. We just need your final choice confirmed by closing day.",
  },
  {
    q: "Is the donation tax-deductible for me?",
    a: "The donation is made by Givenest, not by you personally — so you cannot claim it as a charitable deduction on your personal tax return. If you want to make a personal donation on top of what Givenest donates, we're happy to help facilitate that. Consult a tax professional for guidance specific to your situation.",
  },
  {
    q: "What markets does Givenest serve?",
    a: "We currently serve the greater Phoenix metropolitan area, including Gilbert, Mesa, Chandler, Scottsdale, Tempe, Phoenix, and surrounding communities. We're growing — reach out if you're in a neighboring area.",
  },
  {
    q: "How do I get started?",
    a: "For buyers, browse available homes and connect with a Givenest agent. For sellers, use our sell page to estimate your home value and charitable donation, then request a consultation. Either way, picking a charity is part of the fun.",
  },
  {
    q: "What if I don't know which charity to choose?",
    a: "That's completely fine. Our agents can walk you through options, and our charities page lets you search 1.8M+ nonprofits by name or category. You can also save favorites and decide later — we just need a selection by closing.",
  },
  {
    q: "Is Givenest a licensed real estate brokerage?",
    a: "Yes. Givenest is a licensed Arizona real estate brokerage. All of our agents hold valid Arizona Department of Real Estate licenses. See our Licensing page for details.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            FAQ
          </span>
          <h1 className="mb-5 font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Common{" "}
            <em className="text-coral">questions.</em>
          </h1>
          <p className="max-w-[460px] text-[17px] font-light leading-[1.8] text-muted">
            Everything you need to know about buying, selling, and giving with Givenest.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Accordion */}
      <div className="bg-[#F4F3EE] px-8 py-16">
        <div className="mx-auto max-w-[760px]">
          <div className="flex flex-col gap-2">
            {FAQS.map((item, i) => (
              <div key={i} className="rounded-[10px] border border-border bg-white overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span className="font-medium text-[15px]">{item.q}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`flex-shrink-0 text-muted transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openIndex === i && (
                  <div className="border-t border-border px-6 pb-5 pt-4 text-[14px] font-light leading-[1.8] text-muted">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[10px] border border-coral/20 bg-white p-6 text-center">
            <p className="mb-3 text-[15px] font-light text-muted">Still have questions?</p>
            <Link href="/contact" className="text-[15px] font-medium text-coral hover:underline">
              Get in touch →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
