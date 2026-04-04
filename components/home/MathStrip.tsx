import Link from "next/link";

export default function MathStrip() {
  return (
    <div className="bg-black px-8 py-[18px]">
      <div className="mx-auto max-w-[960px]">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
          $750,000 home purchase/sale → ~$5,625 to a cause → $0 cost to you →{" "}
        </span>
        <Link
          href="/giving"
          className="text-[15px] font-semibold tracking-[-0.01em] text-white underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          every home does good
        </Link>
      </div>
    </div>
  );
}
