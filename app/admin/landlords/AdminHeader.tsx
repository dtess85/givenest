import Link from "next/link";

/**
 * Shared header for /admin/landlords/* pages. Matches the inline
 * `font-sans give<span coral>nest</span>` logo used by every other admin
 * tab (`/admin`, `/admin/listings/*`, `/admin/transactions/*`,
 * `/admin/social`, `/admin/featured`) so the brand mark stays consistent
 * as the user clicks between tabs. The /landlord/* portal uses a separate
 * <Wordmark> brand mark — admin is intentionally a different visual mode
 * (lightweight ops UI vs. customer-facing brand surface).
 *
 * Breadcrumb visibility fix: separators bumped from `text-white/30` →
 * `/40` and link text from `text-white/60` → `/85`. The original values
 * rendered as nearly invisible against pure black; the new opacities
 * read at a glance while still de-emphasizing the trail vs. the
 * current-page label (which stays at full white).
 */
export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined = current page (rendered as plain text)
}

export default function AdminHeader({ trail }: { trail: BreadcrumbItem[] }) {
  return (
    <div className="border-b border-border bg-black px-8 py-4">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-1">
        <a href="/" className="font-sans text-[16px] font-medium text-white">
          give<span className="text-coral">nest</span>
        </a>
        {trail.length > 0 && <span className="text-white/40">|</span>}
        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span key={`${item.label}-${i}`} className="flex items-center gap-3">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[13px] text-white/85 transition-colors hover:text-white"
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
