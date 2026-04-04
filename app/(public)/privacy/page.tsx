export default function Privacy() {
  return (
    <div className="bg-white px-8 py-[80px]">
      <div className="mx-auto max-w-[760px]">
        <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
          Legal
        </span>
        <h1 className="mb-2 font-serif text-[clamp(32px,4vw,48px)] font-medium leading-[1.1] tracking-[-0.02em]">
          Privacy Policy
        </h1>
        <p className="mb-10 text-[13px] text-muted">Last updated: April 2026 · <em>Draft — pending legal review</em></p>

        <div className="flex flex-col gap-10 text-[15px] font-light leading-[1.8] text-[#3a3834]">
          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Overview</h2>
            <p>Givenest ("we," "our," or "us") is an Arizona-licensed real estate brokerage. This Privacy Policy describes how we collect, use, and protect information you provide when using our website at givenest.com or contacting us directly. By using our site, you agree to the practices described here.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Information we collect</h2>
            <p className="mb-3">We collect information you voluntarily provide through our contact and lead capture forms, including:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Property details (e.g., estimated home value) when provided</li>
              <li>Charity preferences you select on our platform</li>
            </ul>
            <p className="mt-3">We may also automatically collect limited technical data when you visit our site, including approximate location data derived from your IP address (used solely to suggest locally relevant charities), browser type, and pages visited.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">How we use your information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Respond to your inquiries and connect you with a Givenest agent</li>
              <li>Facilitate real estate transactions on your behalf</li>
              <li>Process charitable donations at closing</li>
              <li>Improve our website and services</li>
              <li>Send you relevant updates about your transaction (not marketing)</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties. We do not share your data with advertisers or data brokers.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Cookies</h2>
            <p>Our website uses minimal cookies. We do not use advertising trackers or cross-site tracking. We may use basic analytics (e.g., page view counts) to understand how visitors use our site. You can disable cookies in your browser settings; this will not affect your ability to use our site.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Third-party services</h2>
            <p className="mb-3">We use the following third-party services that may process your data:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>Resend</strong> — email delivery for form submissions</li>
              <li><strong>Every.org</strong> — nonprofit search and donation processing</li>
              <li><strong>Vercel</strong> — website hosting and infrastructure</li>
            </ul>
            <p className="mt-3">Each of these services has its own privacy policy. We encourage you to review them if you have concerns.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Data retention</h2>
            <p>We retain your information for as long as necessary to fulfill the purposes described in this policy, or as required by Arizona real estate regulations. Lead inquiry data is retained for a maximum of 24 months. You may request deletion of your data at any time.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Your rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Request a copy of the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of any non-transactional communications</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@givenest.com" className="text-coral hover:underline">privacy@givenest.com</a>.</p>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="mb-3 font-serif text-[20px] font-medium text-black">Contact</h2>
            <p>For questions about this policy or your data, email us at <a href="mailto:privacy@givenest.com" className="text-coral hover:underline">privacy@givenest.com</a> or write to us at Givenest, Gilbert, Arizona.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
