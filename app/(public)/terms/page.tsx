export default function Terms() {
  return (
    <div className="bg-white px-8 py-[80px]">
      <div className="mx-auto max-w-[760px]">
        <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
          Legal
        </span>
        <h1 className="mb-2 font-serif text-[clamp(32px,4vw,48px)] font-medium leading-[1.1] tracking-[-0.02em]">
          Terms of Service
        </h1>
        <p className="mb-10 text-[13px] text-muted">Last updated: April 2026 · <em>Draft — pending legal review</em></p>

        <div className="flex flex-col gap-10 text-[15px] font-light leading-[1.8] text-[#3a3834]">
          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Agreement to terms</h2>
            <p>By accessing or using givenest.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services. Givenest reserves the right to update these terms at any time; continued use of the site constitutes acceptance of any changes.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Service description</h2>
            <p>Givenest is a licensed Arizona real estate brokerage. Our website provides information about buying and selling real estate in the greater Phoenix metropolitan area, as well as tools to browse charities and estimate potential charitable donations at closing. Givenest is not a law firm, financial advisor, or tax advisor. Nothing on this site constitutes legal, financial, or tax advice.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">The giving model</h2>
            <p className="mb-3">Givenest's charitable giving program works as follows:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>At each successfully closed real estate transaction, Givenest donates 25% of its earned commission to a nonprofit organization selected by the client.</li>
              <li>Donation amounts are based on Givenest's actual earned commission and may vary by transaction.</li>
              <li>Givenest makes no guarantee of a minimum donation amount.</li>
              <li>Donations are made by Givenest, not by the client. Clients should not claim these donations as personal charitable deductions without consulting a tax professional.</li>
              <li>Charitable donations are facilitated through Every.org, a registered 501(c)(3) fiscal sponsor and giving platform.</li>
            </ul>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Charity selection</h2>
            <p>Clients may select any IRS-registered 501(c)(3) nonprofit available through our platform. Givenest reserves the right to decline donation requests to organizations that have lost tax-exempt status, are under federal investigation, or violate our guidelines. In such cases, we will work with you to select an alternative charity.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Limitation of liability</h2>
            <p>Givenest's website and tools are provided "as is" without warranties of any kind. Estimated donation amounts shown on our platform are illustrative only and do not constitute a contractual commitment. To the maximum extent permitted by Arizona law, Givenest shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Intellectual property</h2>
            <p>All content on givenest.com — including text, logos, design, and code — is the property of Givenest and may not be reproduced without written permission.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Governing law</h2>
            <p>These terms are governed by the laws of the State of Arizona. Any disputes arising from these terms or your use of our services shall be resolved in the courts of Maricopa County, Arizona.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:dustin@givenest.com" className="text-coral hover:underline">dustin@givenest.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
