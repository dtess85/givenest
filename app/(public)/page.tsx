import Hero from "@/components/home/Hero";
import MathStrip from "@/components/home/MathStrip";
import HowItWorks from "@/components/home/HowItWorks";
import FeedAndStats from "@/components/home/FeedAndStats";
import FeaturedCharities from "@/components/home/FeaturedCharities";
import FinalCTA from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <MathStrip />
      <HowItWorks />
      <section className="border-t border-border bg-white px-8 py-16">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-16 md:grid-cols-2">
          <FeedAndStats />
          <FeaturedCharities />
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
