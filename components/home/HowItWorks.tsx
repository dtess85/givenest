const steps = [
  {
    number: "01",
    title: "Find your home",
    desc: "Search Arizona listings. Every property shows the exact dollar amount Givenest will donate to charity at closing.",
  },
  {
    number: "02",
    title: "Choose a charity",
    desc: "Pick any 501(c)(3) in the country. Your choice is saved to your transaction.",
  },
  {
    number: "03",
    title: "Get a Givenest agent",
    desc: "Get matched with a licensed Givenest agent. They handle your transaction and 30% of their commission goes to your chosen charity at closing.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-pampas px-8 py-20">
      <div className="mx-auto max-w-[960px]">
        <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-semibold leading-[1.15] tracking-[-0.02em] text-black">
          How it works
        </h2>
        <p className="mb-[52px] mt-2 text-[15px] font-light text-muted">
          Three steps. Zero extra cost.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-lg border border-border bg-white p-8 pb-9"
            >
              <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-warm-1 font-serif text-[22px] italic font-normal text-black/35">
                {step.number}
              </div>
              <div className="mb-[10px] font-sans text-base font-bold leading-[1.3] text-black">
                {step.title}
              </div>
              <div className="text-sm font-light leading-[1.75] text-muted">
                {step.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-coral px-8 py-5 text-center">
          <span className="text-base font-bold text-white tracking-[-0.01em]">
            Free for every client. Always.
          </span>
        </div>
      </div>
    </section>
  );
}
