import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-coral px-8 py-[72px]">
      <div className="mx-auto max-w-[500px] text-center">
        <h2 className="mb-[14px] font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em] text-white">
          Your next home could
          <br />
          fund a <em className="text-white/80">cause.</em>
        </h2>
        <p className="mb-7 text-sm font-light leading-[1.8] text-white/70">
          Search homes, estimate your giving, or join as a partner agent.
        </p>
        <div className="flex justify-center gap-[10px]">
          <Link
            href="/buy"
            className="rounded-md bg-white px-[22px] py-[11px] text-sm font-medium text-coral transition-colors hover:bg-white/90"
          >
            Browse homes
          </Link>
          <Link
            href="/agents"
            className="rounded-md border border-white/40 px-[22px] py-[11px] text-sm font-normal text-white transition-all hover:border-white hover:bg-white/10"
          >
            Join as agent
          </Link>
        </div>
      </div>
    </section>
  );
}
