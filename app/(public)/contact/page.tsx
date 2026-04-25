"use client";

import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) return;
    setSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "contact" }),
      });
    } finally {
      setSending(false);
      setSubmitted(true);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-white px-8 pb-16 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
            Contact
          </span>
          <h1 className="mb-5 font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Get in{" "}
            <em className="text-coral">touch.</em>
          </h1>
          <p className="max-w-[460px] text-[17px] font-light leading-[1.8] text-muted">
            Questions about buying, selling, or our giving model? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Contact + form */}
      <div className="bg-[#F4F3EE] px-8 py-16">
        <div className="mx-auto max-w-[1100px] grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          {/* Left — contact info */}
          <div>
            <h2 className="mb-6 font-serif text-[22px] font-medium tracking-[-0.02em]">Contact details</h2>
            <div className="flex flex-col gap-5">
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Email</div>
                <a href="mailto:hello@givenest.com" className="text-[15px] text-coral hover:underline">
                  hello@givenest.com
                </a>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Phone</div>
                <a href="tel:4807797204" className="text-[15px] hover:text-coral transition-colors">
                  (480) 779-7204
                </a>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Location</div>
                <div className="text-[15px]">Gilbert, Arizona</div>
                <div className="text-[13px] text-muted">Serving Arizona</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Press inquiries</div>
                <a href="mailto:press@givenest.com" className="text-[15px] text-coral hover:underline">
                  press@givenest.com
                </a>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-[12px] border border-border bg-white p-7">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 text-[32px]">✓</div>
                <div className="mb-2 font-serif text-[22px] font-medium">Message sent</div>
                <p className="text-[14px] font-light text-muted">We&apos;ll get back to you within one business day.</p>
              </div>
            ) : (
              <>
                <h2 className="mb-5 font-serif text-[20px] font-medium tracking-[-0.01em]">Send us a message</h2>
                <div className="flex flex-col gap-3">
                  <input
                    className="w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    type="email"
                    className="w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  />
                  <input
                    type="tel"
                    className="w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral"
                    placeholder="Phone (optional)"
                    value={formData.phone}
                    onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <textarea
                    className="w-full rounded-md border border-border bg-white px-[14px] py-[11px] text-sm outline-none placeholder:text-[#c0bdb6] focus:border-coral resize-none"
                    placeholder="How can we help?"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.email || sending}
                    className={`w-full rounded-md bg-coral py-[12px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
                      !formData.name || !formData.email || sending ? "cursor-default opacity-40" : "cursor-pointer"
                    }`}
                  >
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
