export default function Licensing() {
  return (
    <div className="bg-white px-8 py-[80px]">
      <div className="mx-auto max-w-[760px]">
        <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
          Legal
        </span>
        <h1 className="mb-2 font-serif text-[clamp(32px,4vw,48px)] font-medium leading-[1.1] tracking-[-0.02em]">
          Licensing
        </h1>
        <p className="mb-10 text-[13px] text-muted">Arizona real estate licensing disclosures</p>

        <div className="flex flex-col gap-10 text-[15px] font-light leading-[1.8] text-[#3a3834]">
          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Brokerage license</h2>
            <p className="mb-4">Givenest is a licensed real estate brokerage in the State of Arizona, operating under the Arizona Department of Real Estate (ADRE).</p>
            <div className="rounded-[10px] border border-border bg-[#F4F3EE] p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: "Brokerage name", value: "Givenest" },
                  { label: "AZ DRE License #", value: "[License number — update before launch]" },
                  { label: "Designated broker", value: "Dustin Tessendorf" },
                  { label: "State", value: "Arizona" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{item.label}</div>
                    <div className="text-[15px] font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Equal Housing Opportunity</h2>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded border-2 border-black p-2 text-center text-[10px] font-bold leading-tight uppercase">
                <div className="text-[18px]">⌂</div>
                <div>Equal</div>
                <div>Housing</div>
                <div>Opportunity</div>
              </div>
              <p>
                Givenest is an Equal Housing Opportunity brokerage. We are committed to providing equal professional services to all persons regardless of race, color, religion, sex, handicap, familial status, national origin, sexual orientation, or gender identity. We comply with all federal and Arizona fair housing laws.
              </p>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Commissioner's Standards</h2>
            <p>All Givenest agents are licensed by the Arizona Department of Real Estate and adhere to the Arizona Commissioner's Rules and the Code of Ethics of the National Association of REALTORS®. For information about filing a complaint or verifying a license, visit the Arizona Department of Real Estate at:</p>
            <div className="mt-3">
              <a
                href="https://azre.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:underline"
              >
                azre.gov →
              </a>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Agency disclosure</h2>
            <p>Arizona law requires real estate licensees to provide a written agency disclosure to clients at first substantive contact. Givenest agents are required to present the Arizona Agency Disclosure form prior to entering into any buyer or seller representation agreement. This ensures you understand who the agent represents in your transaction.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Questions</h2>
            <p>For licensing questions or verification, contact us at <a href="mailto:dustin@givenest.com" className="text-coral hover:underline">dustin@givenest.com</a> or call <a href="tel:4807797204" className="text-coral hover:underline">(480) 779-7204</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
