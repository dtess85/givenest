import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/lot71/Nav";
import Footer from "@/components/lot71/Footer";
import HeroMedia from "@/components/lot71/HeroMedia";
import { Placeholder } from "@/components/lot71/Placeholder";
import {
  getAdjacentProjects,
  getProject,
  projects,
  type Media,
} from "@/lib/lot71/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getProject(params.slug);
  if (!p) return {};
  return {
    title: `${p.name} — LOT71 Designs`,
    description: p.summary,
  };
}

function GalleryItem({ media }: { media: Media }) {
  if (media.kind === "placeholder") {
    return (
      <Placeholder label={media.label} tone={media.tone} showLabel={true} />
    );
  }
  if (media.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.src}
        alt={media.alt ?? ""}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <video
      src={media.src}
      poster={media.poster}
      muted
      loop
      playsInline
      autoPlay
      className="h-full w-full object-cover"
    />
  );
}

export default function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = getProject(params.slug);
  if (!project) notFound();
  const { prev, next } = getAdjacentProjects(project.slug);

  return (
    <>
      <Nav overHero />

      {/* HERO */}
      <section className="relative flex min-h-[90vh] items-end">
        <HeroMedia media={project.hero} priority />
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-20 pt-32 md:px-10 md:pb-28">
          <div className="fade-up">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-[#E7C57A]">
                {project.kind === "build" ? "New Build" : "Remodel"} ·{" "}
                {project.year}
              </span>
              {project.status === "available" && (
                <span className="inline-block rounded-full bg-[#B8873D] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                  For sale
                </span>
              )}
              {project.status === "coming-soon" && (
                <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#121212]">
                  Coming soon
                </span>
              )}
              {project.status === "sold" && (
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  Sold
                </span>
              )}
            </div>
            <h1
              className="font-serif text-[clamp(44px,6vw,88px)] font-medium leading-[1.02] tracking-[-0.02em] text-white"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              {project.name}
            </h1>
            <p
              className="mt-5 max-w-[560px] text-[17px] leading-[1.7] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8), 0 2px 16px rgba(0,0,0,0.7)" }}
            >
              {project.summary}
            </p>
            {(project.status === "available" ||
              project.status === "coming-soon") && (
              <div className="mt-7 flex flex-wrap items-center gap-5">
                <Link
                  href={project.listingUrl ?? `/lot71/contact?project=${project.slug}`}
                  className="inline-flex items-center gap-3 bg-white px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-[#121212] transition-colors hover:bg-[#E7C57A]"
                >
                  {project.status === "coming-soon"
                    ? "Get on the list"
                    : "Inquire about this home"}{" "}
                  →
                </Link>
                {project.price && (
                  <span
                    className="text-[14px] text-white"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    {project.price}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BODY + SPECS */}
      <section className="border-b border-[#E8E4DC] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-14 md:grid-cols-[1.4fr_1fr] md:gap-24">
          <div className="text-[16px] leading-[1.95] text-[#2A2A26]">
            {project.description.map((p, i) => (
              <p key={i} className={i > 0 ? "mt-6" : ""}>
                {p}
              </p>
            ))}
          </div>

          <aside>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
              Details
            </div>
            <dl className="mt-6 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
              {project.specs.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline justify-between py-4"
                >
                  <dt className="text-[12px] uppercase tracking-[0.14em] text-[#6B6860]">
                    {s.label}
                  </dt>
                  <dd className="font-serif text-[16px] text-[#121212]">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-[12px] leading-[1.7] text-[#6B6860]">
              {project.city}, {project.state}
            </p>
          </aside>
        </div>
      </section>

      {/* GALLERY */}
      <section className="px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            {project.gallery.map((m, i) => (
              <div
                key={i}
                className={`relative overflow-hidden bg-[#EEEAE1] ${
                  i % 3 === 0 ? "aspect-[4/5]" : "aspect-[5/4]"
                }`}
              >
                <GalleryItem media={m} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INQUIRE BAND — surfaces for both for-sale and coming-soon homes.
          Copy and CTA adapt to the status. */}
      {(project.status === "available" || project.status === "coming-soon") && (
        <section className="bg-[#F4F1E8] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B8873D]">
                {project.status === "coming-soon" ? "Coming soon" : "Interested?"}
              </div>
              <h2 className="mt-5 font-serif text-[clamp(26px,2.8vw,38px)] font-medium leading-tight">
                {project.status === "coming-soon"
                  ? `Want a first look at ${project.name}?`
                  : `Come see ${project.name}.`}
              </h2>
              {project.price && (
                <p className="mt-3 text-[14px] text-[#6B6860]">
                  {project.price}
                </p>
              )}
            </div>
            <Link
              href={project.listingUrl ?? `/lot71/contact?project=${project.slug}`}
              className="inline-flex items-center gap-3 bg-[#121212] px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-white hover:bg-[#B8873D]"
            >
              {project.status === "coming-soon"
                ? "Get on the list"
                : "Inquire about this home"}{" "}
              →
            </Link>
          </div>
        </section>
      )}

      {/* NEXT / PREV */}
      <section className="border-t border-[#E8E4DC] px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-2">
          <Link
            href={`/lot71/work/${prev.slug}`}
            className="group block"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#6B6860]">
              ← Previous
            </div>
            <div className="mt-3 font-serif text-[26px] font-medium text-[#121212] group-hover:text-[#B8873D]">
              {prev.name}
            </div>
            <div className="mt-1 text-[13px] text-[#6B6860]">
              {prev.city}, {prev.state} · {prev.year}
            </div>
          </Link>
          <Link
            href={`/lot71/work/${next.slug}`}
            className="group block md:text-right"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#6B6860]">
              Next →
            </div>
            <div className="mt-3 font-serif text-[26px] font-medium text-[#121212] group-hover:text-[#B8873D]">
              {next.name}
            </div>
            <div className="mt-1 text-[13px] text-[#6B6860]">
              {next.city}, {next.state} · {next.year}
            </div>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
