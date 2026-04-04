export default function Press() {
  const placeholderArticles = [
    {
      outlet: "Arizona Republic",
      headline: "This Gilbert brokerage donates to charity at every closing — and it costs buyers nothing",
      date: "Coming soon",
    },
    {
      outlet: "Phoenix Business Journal",
      headline: "Givenest brings purpose-driven model to Arizona real estate market",
      date: "Coming soon",
    },
    {
      outlet: "AZ Big Media",
      headline: "Meet the brokerage turning home sales into charitable giving",
      date: "Coming soon",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Media
          </span>
          <h1 className="mb-5 max-w-[700px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Givenest in{" "}
            <em className="text-coral">the news.</em>
          </h1>
          <p className="max-w-[480px] text-[17px] font-light leading-[1.8] text-muted">
            We&apos;re just getting started. Press coverage and media appearances coming soon — check back as we grow.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Press contact + kit */}
      <div className="bg-[#F4F3EE] px-8 py-12">
        <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-[10px] border border-border bg-white p-6">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">Press contact</div>
            <div className="mb-1 font-serif text-[20px] font-medium">Get in touch</div>
            <p className="mb-4 text-[14px] font-light leading-[1.7] text-muted">
              For media inquiries, interview requests, or story pitches, reach us at:
            </p>
            <a href="mailto:press@givenest.com" className="text-[15px] font-medium text-coral hover:underline">
              press@givenest.com
            </a>
          </div>
          <div className="rounded-[10px] border border-border bg-white p-6">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">Media kit</div>
            <div className="mb-1 font-serif text-[20px] font-medium">Brand assets</div>
            <p className="mb-4 text-[14px] font-light leading-[1.7] text-muted">
              Logos, brand guidelines, photography, and leadership bios are available on request.
            </p>
            <a href="mailto:press@givenest.com" className="text-[13px] text-coral hover:underline">
              Request media kit →
            </a>
          </div>
        </div>
      </div>

      {/* Brand facts */}
      <div className="bg-white px-8 py-12">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="mb-8 font-serif text-[22px] font-medium tracking-[-0.02em]">Brand facts</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { label: "Founded", value: "2024" },
              { label: "Headquartered", value: "Gilbert, AZ" },
              { label: "Markets served", value: "Greater Phoenix metro" },
              { label: "Commission to charity", value: "25% at every closing" },
            ].map((item) => (
              <div key={item.label} className="border-t-2 border-coral pt-3">
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{item.label}</div>
                <div className="text-[16px] font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Placeholder articles */}
      <div className="bg-[#F4F3EE] px-8 py-12">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="mb-6 font-serif text-[22px] font-medium tracking-[-0.02em]">Coverage</h2>
          <div className="flex flex-col gap-4">
            {placeholderArticles.map((a) => (
              <div key={a.headline} className="flex items-start gap-5 rounded-[10px] border border-border bg-white p-5 opacity-50">
                <div className="flex-1">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{a.outlet}</div>
                  <div className="font-medium leading-snug">{a.headline}</div>
                </div>
                <div className="flex-shrink-0 rounded-full bg-[#F4F3EE] px-3 py-1 text-[11px] text-muted">{a.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
