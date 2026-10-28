import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/lot71/projects";
import { Placeholder } from "./Placeholder";

// Visual treatment per lifecycle status — "available" is the one that
// should draw attention, so it uses the ochre fill. Sold/coming-soon stay
// quiet in a translucent black pill.
const statusStyles: Record<ProjectStatus, { label: string; className: string }> = {
  available: {
    label: "For sale",
    className: "bg-[#B8873D] text-white",
  },
  "coming-soon": {
    label: "Coming soon",
    className: "bg-white/90 text-[#121212]",
  },
  sold: {
    label: "Sold",
    className: "bg-black/35 text-white backdrop-blur-sm",
  },
};

// A single project tile — large image on top, meta row underneath.
// `size="feature"` makes the first card span wider on the home grid.
export default function ProjectCard({
  project,
  size = "default",
}: {
  project: Project;
  size?: "default" | "feature";
}) {
  const aspect = size === "feature" ? "aspect-[16/10]" : "aspect-[4/5]";

  return (
    <Link
      href={`/lot71/work/${project.slug}`}
      className="group block"
    >
      <div className={`relative ${aspect} w-full overflow-hidden bg-[#EEEAE1]`}>
        {project.hero.kind === "placeholder" ? (
          <Placeholder
            label={project.hero.label}
            tone={project.hero.tone}
            showLabel={false}
          />
        ) : project.hero.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.hero.src}
            alt={project.hero.alt ?? project.name}
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <video
            src={project.hero.src}
            poster={project.hero.poster}
            muted
            loop
            playsInline
            autoPlay
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span
            className={`rounded-full px-3 py-[6px] text-[10px] uppercase tracking-[0.18em] ${statusStyles[project.status].className}`}
          >
            {statusStyles[project.status].label}
          </span>
          <span className="rounded-full bg-black/35 px-3 py-[6px] text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {project.kind === "build" ? "New Build" : "Remodel"}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-6">
        <div>
          <h3 className="font-serif text-[22px] font-medium leading-tight text-[#121212]">
            {project.name}
          </h3>
          <p className="mt-[6px] text-[13px] text-[#6B6860]">
            {project.city}, {project.state} · {project.year}
          </p>
        </div>
        <span className="text-[12px] tracking-[0.14em] uppercase text-[#B8873D] opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </div>
    </Link>
  );
}
