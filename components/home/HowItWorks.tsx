const steps = [
  {
    number: "01",
    title: "Find your home",
    desc: "Search Arizona listings. See the donation amount on every property.",
    link: { label: "Browse homes", href: "/buy" },
  },
  {
    number: "02",
    title: "Choose your cause",
    desc: "Select any charity in the country. Your choice is tied to your transaction.",
    link: { label: "Browse charities", href: "/charities" },
  },
  {
    number: "03",
    title: "Choose your agent",
    desc: "Work with a givenest agent. They handle the deal—we make the donation.",
    link: { label: "Find an agent", href: "/agents" },
  },
];

import Link from "next/link";

export default function HowItWorks() {
  return (
    <>
    <section className="bg-pampas px-8 py-16">
      <div className="mx-auto max-w-[960px]">
        <h2 className="font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em] text-black">
          How it works
        </h2>
        <p className="mb-10 mt-2 text-[15px] font-light text-muted">
          Three steps. Zero extra cost.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-lg border border-border bg-white px-7 py-12"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#D5DFDB] font-serif text-[14px] italic font-normal text-black/40">
                {step.number}
              </div>
              <div className="mb-[6px] font-serif text-[15px] font-semibold leading-[1.3] text-black">
                {step.title}
              </div>
              <div className="mb-5 font-serif text-sm font-normal leading-[1.75] text-muted">
                {step.desc}
              </div>
              <Link
                href={step.link.href}
                className="text-[13px] font-medium text-coral transition-colors hover:text-[#d4574a]"
              >
                {step.link.label} →
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
    <div className="bg-coral px-8 py-[18px]">
      <div className="mx-auto max-w-[960px]">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
          Free for every client. Always.
        </span>
      </div>
    </div>
    </>
  );
}
