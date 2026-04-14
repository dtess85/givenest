/** Format a number as USD with no decimals: $4,125 */
export const fmt = (n: number): string =>
  "$" + Math.round(n).toLocaleString("en-US");

/** Merge class names (simple version — no clsx dependency needed yet) */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Avatar initials from a person's name — first + last word only.
 * Middle names/initials are skipped, so "Teresa M Porpiglia" → "TP".
 * Single-word names yield one letter; empty input yields "".
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0].toUpperCase();
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (first + last).toUpperCase();
}
