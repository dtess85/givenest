"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    router.push("/buy");
  };

  return (
    <section className="relative flex min-h-[55vh] items-center overflow-hidden">
      {/* Background image */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/hero-home.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay — dark left, lighter right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.15) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-8 py-[100px] md:px-12">
        <div className="mb-5 inline-block rounded-full bg-coral px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
          Arizona&apos;s giving brokerage
        </div>
        <h1 className="mb-5 max-w-[700px] font-serif text-[clamp(38px,5vw,68px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)" }}>
          Every home funds a cause{" "}
          <em className="text-coral">you choose.</em>
        </h1>
        <p className="mb-10 max-w-[460px] text-[17px] font-normal leading-[1.8] text-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.8)" }}>
          Buy or sell on givenest and we donate to a charity of your choice at
          closing — at no extra cost.
        </p>

        {/* Search bar */}
        <div className="flex w-full max-w-[580px] overflow-hidden rounded-lg shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by city, zip, or address..."
            className="min-w-0 flex-1 border-none bg-white px-4 py-[18px] font-sans text-[15px] font-light text-black outline-none placeholder:text-[#c0bdb6] md:px-[22px]"
          />
          <button
            onClick={handleSearch}
            className="whitespace-nowrap bg-coral px-[30px] py-[18px] font-sans text-[15px] font-medium text-white transition-colors hover:bg-[#d4574a]"
          >
            Search homes
          </button>
        </div>

        <div className="mt-[18px] flex flex-wrap gap-7" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
          <Link
            href="/sell"
            className="text-[13px] text-white transition-colors hover:text-white/80"
          >
            Get a selling estimate →
          </Link>
          <Link
            href="/charities"
            className="text-[13px] text-white transition-colors hover:text-white/80"
          >
            Browse charities →
          </Link>
        </div>
      </div>
    </section>
  );
}
