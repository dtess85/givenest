"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  type: string;
  message: string;
};

const empty: FormState = {
  name: "",
  email: "",
  phone: "",
  type: "",
  message: "",
};

const inquiryTypes = [
  "Interested in a specific home",
  "Notify me when the next one lists",
  "Press / media",
  "Something else",
];

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setState("sending");
    try {
      const res = await fetch("/api/lot71/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-col items-start justify-center rounded-sm border border-[#E8E4DC] bg-white p-10">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
          Message sent
        </div>
        <h3 className="mt-5 font-serif text-[28px] font-medium leading-tight">
          Thanks for the note.
        </h3>
        <p className="mt-4 max-w-[380px] text-[15px] leading-[1.8] text-[#2A2A26]">
          We&apos;ll read it carefully and reply within a few business days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-sm border border-[#E8E4DC] bg-white p-8 md:p-10"
    >
      <Field
        label="Your name"
        required
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
      />
      <Field
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
      />
      <Field
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
      />
      <SelectField
        label="What's your interest?"
        value={form.type}
        options={inquiryTypes}
        onChange={(v) => setForm((f) => ({ ...f, type: v }))}
      />
      <TextareaField
        label="Anything else to add?"
        placeholder="Which home, timing, must-haves, questions…"
        value={form.message}
        onChange={(v) => setForm((f) => ({ ...f, message: v }))}
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-8 inline-flex w-full items-center justify-center gap-3 bg-[#121212] px-7 py-4 text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#B8873D] disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send →"}
      </button>
      {state === "error" && (
        <p className="mt-4 text-[12px] text-[#C44] leading-[1.6]">
          Something went wrong. Try again, or email us directly at{" "}
          <a
            href="mailto:studio@lot71designs.com"
            className="underline"
          >
            studio@lot71designs.com
          </a>
          .
        </p>
      )}
      <p className="mt-4 text-[11px] leading-[1.6] text-[#6B6860]">
        We read every note and reply within a few business days.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="mb-6 block">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#6B6860]">
        {label}
        {required && <span className="ml-1 text-[#B8873D]">*</span>}
      </div>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-[#E8E4DC] bg-transparent py-3 text-[15px] text-[#121212] outline-none transition-colors focus:border-[#B8873D]"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#6B6860]">
        {label}
        {required && <span className="ml-1 text-[#B8873D]">*</span>}
      </div>
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full resize-none border-b border-[#E8E4DC] bg-transparent py-3 text-[15px] text-[#121212] placeholder-[#B8B5AC] outline-none transition-colors focus:border-[#B8873D]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="mb-6 block">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#6B6860]">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-[#E8E4DC] bg-transparent py-3 text-[15px] text-[#121212] outline-none transition-colors focus:border-[#B8873D]"
      >
        <option value="">Choose one…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
