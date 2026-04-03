import Hero from "@/components/home/Hero";
import MathStrip from "@/components/home/MathStrip";
import HowItWorks from "@/components/home/HowItWorks";
// import FeedAndStats from "@/components/home/FeedAndStats";
import FeaturedCharities from "@/components/home/FeaturedCharities";
import FinalCTA from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <MathStrip />
      <HowItWorks />
      {/* <FeedAndStats /> */}
      <FeaturedCharities />
      <FinalCTA />
    </>
  );
}
