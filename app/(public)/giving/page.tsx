import Link from "next/link";

export default function Giving() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            The giving model
          </span>
          <h1 className="mb-5 max-w-[700px] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            How the giving{" "}
            <em className="text-coral">works.</em>
          </h1>
          <p className="max-w-[520px] text-[17px] font-light leading-[1.8] text-muted">
            At every Givenest closing, 25% of our commission goes directly to a charity you choose — before, during, or at closing. Here's exactly how it works.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* The model */}
      <div className="bg-[#F4F3EE] px-8 py-16">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: "♥",
                title: "You choose the charity",
                body: "Search from over 1.8 million IRS-registered nonprofits. Local or global, big or small — your choice, your values.",
              },
              {
                icon: "→",
                title: "We handle the donation",
                body: "Givenest donates 25% of our commission directly to your chosen nonprofit at closing via Every.org, a trusted giving platform.",
              },
              {
                icon: "$0",
                title: "You pay nothing extra",
                body: "The donation comes entirely from Givenest's commission. Your closing costs, agent fees, and purchase price are completely unaffected.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[10px] border border-border bg-white p-7">
                <div className="mb-4 text-[22px] text-coral">{item.icon}</div>
                <div className="mb-2 font-serif text-[20px] font-medium">{item.title}</div>
                <p className="text-[14px] font-light leading-[1.7] text-muted">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Math example */}
          <div className="rounded-[10px] border border-coral/20 bg-white p-7">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">Example</div>
            <h3 className="mb-4 font-serif text-[20px] font-medium">On a $750,000 sale</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Home sale price", value: "$750,000" },
                { label: "Typical commission (3%)", value: "$22,500" },
                { label: "Givenest donates (25%)", value: "$5,625", coral: true },
                { label: "Extra cost to you", value: "$0", coral: true },
              ].map((row) => (
                <div key={row.label} className="border-t border-border pt-3">
                  <div className="mb-1 text-[11px] text-muted">{row.label}</div>
                  <div className={`text-[20px] font-semibold ${row.coral ? "text-coral" : ""}`}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ callouts */}
      <div className="bg-white px-8 py-16">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="mb-8 font-serif text-[clamp(24px,3vw,34px)] font-medium tracking-[-0.02em]">Common questions</h2>
          <div className="flex flex-col gap-5">
            {[
              {
                q: "Is the donation tax-deductible for me?",
                a: "The donation is made by Givenest, not by you directly — so it's not deductible on your personal return. However, you're choosing where a meaningful gift goes, at no cost to you.",
              },
              {
                q: "What if I can't decide on a charity?",
                a: "Take your time. You can choose any time before closing. If you don't select one, we'll work with you to find a cause that resonates. We won't close without a charity selected.",
              },
              {
                q: "What charities qualify?",
                a: "Any IRS-registered 501(c)(3) nonprofit in our database of 1.8M+ organizations. This includes local charities, national nonprofits, religious organizations, schools, and international relief organizations.",
              },
              {
                q: "When does the donation actually happen?",
                a: "The donation is processed at closing, funded from Givenest's commission. You'll receive a confirmation of the donation with the nonprofit's details.",
              },
              {
                q: "Can I change my charity before closing?",
                a: "Absolutely. You can update your charity selection any time before closing day.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-[10px] border border-border p-6">
                <div className="mb-2 font-medium">{item.q}</div>
                <p className="text-[14px] font-light leading-[1.7] text-muted">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/faq" className="text-[13px] text-coral hover:underline">
              See all FAQs →
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#F4F3EE] px-8 py-14">
        <div className="mx-auto max-w-[1100px] flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-[clamp(22px,2.5vw,30px)] font-medium tracking-[-0.02em]">Browse 1.8M+ charities</h2>
            <p className="text-[14px] font-light text-muted">Search by name, cause, or location.</p>
          </div>
          <Link href="/charities" className="flex-shrink-0 rounded-md bg-coral px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a]">
            Find a charity →
          </Link>
        </div>
      </div>
    </div>
  );
}
