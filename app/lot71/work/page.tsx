import Link from "next/link";
import Nav from "@/components/lot71/Nav";
import Footer from "@/components/lot71/Footer";
import ProjectCard from "@/components/lot71/ProjectCard";
import Reveal from "@/components/lot71/Reveal";
import { projects } from "@/lib/lot71/projects";

export const metadata = {
  title: "Projects — LOT71 Designs",
};

export default function WorkIndex() {
  return (
    <>
      <Nav />

      <section className="px-6 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
            Projects
          </div>
          <h1 className="mt-6 font-serif text-[clamp(44px,5vw,72px)] font-medium leading-[1.05] tracking-[-0.015em]">
            Every home we&apos;ve built.
            <br />
            <em className="italic text-[#B8873D]">Each one, by its lot.</em>
          </h1>
          <p className="mt-7 max-w-[580px] text-[16px] leading-[1.9] text-[#2A2A26]">
            A small catalog on purpose. Each home here is one we bought,
            designed, built, and listed under our own name — labeled by its
            lot number.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex items-baseline justify-between gap-6 border-b border-[#E8E4DC] pb-5">
            <h2 className="font-serif text-[22px] font-medium">All projects</h2>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#6B6860]">
              {projects.length} {projects.length === 1 ? "home" : "homes"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-20 md:grid-cols-2">
            {projects.map((p, i) => (
              <Reveal key={p.slug} delay={i * 80}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 border-t border-[#E8E4DC] pt-16 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
              The next one
            </div>
            <h2 className="mt-5 font-serif text-[clamp(28px,2.8vw,38px)] font-medium leading-tight">
              Want a first look when the next home lists?
            </h2>
          </div>
          <Link
            href="/lot71/contact"
            className="inline-flex items-center gap-3 border border-[#121212] px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-[#121212] hover:bg-[#121212] hover:text-white"
          >
            Join the list →
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
