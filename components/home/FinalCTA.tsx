import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-pampas px-8 py-[72px]">
      <div className="mx-auto max-w-[500px] text-center">
        <h2 className="mb-[14px] font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em] text-black">
          Your next home could
          <br />
          fund a <em className="text-coral">cause.</em>
        </h2>
        <p className="mb-7 text-sm font-light leading-[1.8] text-muted">
          Search homes, estimate your giving, or learn more about us.
        </p>
        <div className="flex justify-center gap-[10px]">
          <Link
            href="/buy"
            className="rounded-md bg-coral px-[22px] py-[11px] text-sm font-medium text-white transition-colors hover:bg-[#d4574a]"
          >
            Browse homes
          </Link>
          <Link
            href="/agents"
            className="rounded-md bg-black px-[22px] py-[11px] text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}
