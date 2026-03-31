import Link from "next/link";

export default function AgentCTA() {
  return (
    <section className="bg-white px-8 py-16">
      <div className="mx-auto max-w-[720px] text-center">
        <span className="mb-4 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
          For agents
        </span>
        <h2 className="mb-3 font-serif text-[clamp(24px,3vw,38px)] font-semibold leading-[1.2] tracking-[-0.02em] text-black">
          Join as an agent.{" "}
          <em className="text-coral">Build a brand worth talking about.</em>
        </h2>
        <p className="mx-auto mb-8 max-w-[480px] text-sm font-light leading-[1.8] text-muted">
          Most brokerages offer splits and tools. None offer meaning. Givenest
          gives you something no other brokerage can — a reason for clients to
          choose you.
        </p>
        <Link
          href="/agents"
          className="inline-block rounded-md bg-coral px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d4574a]"
        >
          Learn more →
        </Link>
      </div>
    </section>
  );
}
