/** Format a number as USD with no decimals: $4,125 */
export const fmt = (n: number): string =>
  "$" + Math.round(n).toLocaleString("en-US");

/** Merge class names (simple version — no clsx dependency needed yet) */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
