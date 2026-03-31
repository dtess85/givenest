export default function Sell() {
  return (
    <div className="mx-auto max-w-[1100px] px-8 py-20">
      <span className="mb-3 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
        Seller portal
      </span>
      <h1 className="font-serif text-[clamp(26px,3.5vw,44px)] font-medium leading-[1.2] tracking-[-0.02em]">
        Sell your home.{" "}
        <em className="text-coral">Grow a cause.</em>
      </h1>
      <p className="mt-4 text-sm font-light text-muted">
        Seller estimate calculator coming in Phase 2.
      </p>
    </div>
  );
}
