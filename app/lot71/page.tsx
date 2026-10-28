import Link from "next/link";
import Nav from "@/components/lot71/Nav";
import Footer from "@/components/lot71/Footer";
import HeroMedia from "@/components/lot71/HeroMedia";
import ProjectCard from "@/components/lot71/ProjectCard";
import Reveal from "@/components/lot71/Reveal";
import { projects, type Media } from "@/lib/lot71/projects";

const materials = [
  { title: "Lime-washed plaster", note: "Hand-troweled. Soft under morning light." },
  { title: "Rift white oak", note: "Grain running one direction. Nothing busy." },
  { title: "Honed limestone", note: "A cool floor your feet actually like." },
  { title: "Soft brass", note: "The hardware patinas into itself." },
];

// Home page hero media — its own asset, not pinned to any one project.
// Currently a Vimeo background embed looped over a sub-clip (0:13 → 1:27).
// Swap `videoId`, `startAt`, `endAt` or change `kind` to point at a
// self-hosted mp4 or a static image later.
const homeHero: Media = {
  kind: "vimeo",
  videoId: "1182779598",
  startAt: 13,
  endAt: 87,
  alt: "LOT71 Designs — studio hero",
};


export default function Lot71Home() {
  return (
    <>
      <Nav overHero />

      {/* HERO — the studio's own hero media (see `homeHero` above). Swap in
          a real looping video when ready. */}
      <section className="relative flex min-h-[92vh] items-end">
        <HeroMedia media={homeHero} priority />
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-24 pt-32 md:px-10 md:pb-32">
          <div className="fade-up max-w-[720px]">
            <div className="mb-6 inline-block text-[10px] uppercase tracking-[0.3em] text-[#E7C57A]">
              Design · Build · Sell
            </div>
            <h1
              className="font-serif text-[clamp(44px,6vw,82px)] font-medium leading-[1.05] tracking-[-0.015em] text-white"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              We build the homes.
              <br />
              <em className="font-serif italic text-[#E7C57A]">
                Then we sell them.
              </em>
            </h1>
            <p
              className="mt-7 max-w-[560px] text-[17px] leading-[1.75] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8), 0 2px 16px rgba(0,0,0,0.7)" }}
            >
              A small studio in Gilbert, Arizona. Every home designed in full
              with the person who&apos;ll live in it in mind — every detail
              planned, every finish chosen. Not another spec.{" "}
              <em className="italic text-[#E7C57A]">A home designed.</em>
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-7">
              <Link
                href="/lot71/work"
                className="group inline-flex items-center gap-3 border border-white/70 px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#121212]"
              >
                See the homes
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/lot71/story"
                className="text-[13px] uppercase tracking-[0.18em] text-white hover:text-[#E7C57A]"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                The story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO STRIP */}
      <section className="border-b border-[#E8E4DC] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-14 md:grid-cols-[1fr_1.3fr] md:gap-24">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
              The studio
            </div>
            <h2 className="mt-6 font-serif text-[clamp(32px,3.4vw,46px)] font-medium leading-[1.15] tracking-[-0.01em]">
              Quiet from the street.
              <br />
              Generous once you&apos;re inside.
            </h2>
          </div>
          <div className="text-[16px] leading-[1.9] text-[#2A2A26]">
            <p>
              LOT71 is a small design-and-build studio in Gilbert, Arizona.
              We don&apos;t take on client work. We buy the lot or the house,
              we draw the home in full, and we build it like we were
              building it for ourselves — every window sized, every sightline
              planned, every finish chosen with the person who&apos;ll end
              up here in mind. Then we list it.
            </p>
            <p className="mt-6">
              Our work tends to read quiet from the street and generous once
              you&apos;re inside. We like plaster. We like white oak. We like
              windows that are sized for a specific tree. We care about where
              the light lands at four o&apos;clock.
            </p>
            <Link
              href="/lot71/story"
              className="mt-8 inline-flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-[#B8873D] hover:text-[#9B6F2C]"
            >
              How LOT71 started →
            </Link>
          </div>
        </div>
      </section>


      {/* PROJECTS */}
      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-16">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
              Projects
            </div>
            <h2 className="mt-5 font-serif text-[clamp(30px,3vw,42px)] font-medium leading-[1.15] tracking-[-0.01em]">
              Every home, by its lot.
            </h2>
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

      {/* MATERIALS & APPROACH */}
      <section className="bg-[#EEEAE1] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-[1fr_1.3fr] md:gap-24">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
                Approach
              </div>
              <h2 className="mt-6 font-serif text-[clamp(30px,3vw,44px)] font-medium leading-[1.15] tracking-[-0.01em]">
                A short list of things we <em className="italic text-[#B8873D]">use well.</em>
              </h2>
              <p className="mt-7 max-w-[420px] text-[16px] leading-[1.9] text-[#2A2A26]">
                We keep the material palette tight on purpose. The projects
                read as one studio because they are — the same handful of
                materials, used honestly, finished with care.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {materials.map((m, i) => (
                <li key={m.title}>
                  <Reveal delay={i * 90}>
                    <div className="border-l-2 border-[#B8873D] pl-5">
                      <div className="font-serif text-[20px] font-medium leading-tight text-[#121212]">
                        {m.title}
                      </div>
                      <div className="mt-2 text-[14px] leading-[1.7] text-[#6B6860]">
                        {m.note}
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative overflow-hidden bg-[#1A1812] px-6 py-28 text-white md:px-10 md:py-36">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[620px]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#E7C57A]">
              The next one is always coming
            </div>
            <h2 className="mt-6 font-serif text-[clamp(32px,3.4vw,48px)] font-medium leading-[1.15] tracking-[-0.01em]">
              Interested in a LOT71 home?{" "}
              <em className="italic text-[#E7C57A]">Join the list.</em>
            </h2>
            <p className="mt-7 text-[16px] leading-[1.9] text-white/80">
              We build a short list of homes each year. If you&apos;d like a
              first look at the next one — or want to ask about one that&apos;s
              already up — reach out.
            </p>
            <Link
              href="/lot71/contact"
              className="mt-10 inline-flex items-center gap-3 border border-white/70 px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#121212]"
            >
              Get in touch
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
