"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Hero() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    router.push("/buy");
  };

  return (
    <section className="bg-white px-8 pb-20 pt-[88px]">
      <div className="mx-auto max-w-[960px] text-center">
        <div className="mb-5 inline-block rounded-full bg-coral/[0.08] px-[10px] py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-coral">
          Arizona&apos;s giving brokerage
        </div>
        <h1 className="mb-5 font-serif text-[clamp(40px,5.5vw,72px)] font-semibold leading-[1.1] tracking-[-0.03em] text-black">
          Every home funds a cause{" "}
          <em className="text-coral">you choose.</em>
        </h1>
        <p className="mx-auto mb-10 max-w-[500px] text-[17px] font-light leading-[1.8] text-muted">
          Buy or sell with Givenest and we donate to a charity of your choice at
          closing — at no extra cost.
        </p>

        {/* Search bar */}
        <div className="mx-auto flex max-w-[600px] overflow-hidden rounded-lg border border-border shadow-[0_2px_20px_rgba(0,0,0,0.1)]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by city, zip, or address..."
            className="flex-1 border-none bg-white px-[22px] py-[18px] font-sans text-[15px] font-light text-black outline-none placeholder:text-[#c0bdb6]"
          />
          <button
            onClick={handleSearch}
            className="whitespace-nowrap bg-coral px-[30px] py-[18px] font-sans text-[15px] font-medium text-white transition-colors hover:bg-[#d4574a]"
          >
            Search homes
          </button>
        </div>

        <div className="mt-[18px] flex flex-wrap justify-center gap-7">
          <Link
            href="/sell"
            className="text-[13px] text-muted transition-colors hover:text-black"
          >
            Get a selling estimate →
          </Link>
          <Link
            href="/charities"
            className="text-[13px] text-muted transition-colors hover:text-black"
          >
            Browse charities →
          </Link>
        </div>
      </div>
    </section>
  );
}
