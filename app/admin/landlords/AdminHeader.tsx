import Link from "next/link";
import Wordmark from "@/components/Wordmark";

/**
 * Shared header for /admin/landlords/* pages. Black bar with the Givenest
 * brand mark on the left and a breadcrumb trail on the right.
 *
 * Why a shared component: the three landlord admin pages (list / new /
 * detail) had subtly different inline implementations. Two pre-existing
 * issues this fixes:
 *   1. The logo was rendered as `font-sans <give><span coral>nest</span></a>`
 *      instead of the canonical <Wordmark> (serif italic per the brand).
 *   2. Breadcrumb separators at `text-white/30` and link text at
 *      `text-white/60` against pure black were essentially invisible.
 *      Bumped to /50 and /80 respectively so the chain reads at a glance.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined = current page (rendered as plain text)
}

export default function AdminHeader({ trail }: { trail: BreadcrumbItem[] }) {
  return (
    <div className="border-b border-border bg-black px-8 py-4">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-1">
        <Link href="/" aria-label="Givenest home" className="inline-flex items-center">
          <Wordmark size={18} dark />
        </Link>
        {trail.length > 0 && <span className="text-white/40">|</span>}
        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span key={`${item.label}-${i}`} className="flex items-center gap-3">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[13px] text-white/80 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[13px] text-white">{item.label}</span>
              )}
              {!isLast && <span className="text-white/40">/</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
