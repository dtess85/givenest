import Link from "next/link";
import Nav from "@/components/lot71/Nav";
import Footer from "@/components/lot71/Footer";

export const metadata = {
  title: "Story — LOT71 Designs",
};

export default function StoryPage() {
  return (
    <>
      <Nav />

      <section className="px-6 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <div className="mx-auto max-w-[920px]">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
            The story
          </div>
          <h1 className="mt-6 font-serif text-[clamp(44px,5.5vw,80px)] font-medium leading-[1.03] tracking-[-0.02em]">
            Every home starts with a lot.
            <br />
            <em className="italic text-[#B8873D]">Ours started with Lot 71.</em>
          </h1>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto max-w-[760px] text-[17px] leading-[1.95] text-[#2A2A26]">
          <p>
            Lot 71 was a tract home. Nothing custom about it. We bought it,
            lived in it, and started imagining what it could be if a house
            like that had been drawn with any real care — where the light
            lands, what the thresholds feel like, how the kitchen opens to
            the yard.
          </p>
          <p className="mt-7">
            That&apos;s where this studio began. We named it after the lot,
            and we started building homes the way we wished ours had been
            built — one at a time, under our own name, finished to the
            standard we&apos;d want in a home we were going to live in.
          </p>
          <p className="mt-7">
            We don&apos;t take on client work and we don&apos;t repeat plans.
            Every home is a one-off we were willing to put our name on, then
            list.
          </p>
        </div>
      </section>

      <section className="border-t border-[#E8E4DC] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-serif text-[clamp(28px,3vw,42px)] font-medium leading-tight">
            See the homes.
          </h2>
          <Link
            href="/lot71/work"
            className="inline-flex items-center gap-3 border border-[#121212] px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-[#121212] hover:bg-[#121212] hover:text-white"
          >
            The portfolio →
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
