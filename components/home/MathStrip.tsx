import Link from "next/link";

export default function MathStrip() {
  return (
    <div className="bg-black px-8 py-[18px]">
      <div className="mx-auto max-w-[960px]">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
          $750,000 home purchase/sale → ~$5,625 to a cause → $0 cost to you → every home does good
        </span>
        <Link
          href="/giving"
          className="ml-4 text-[15px] font-medium text-white hover:opacity-70 transition-opacity whitespace-nowrap"
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}
