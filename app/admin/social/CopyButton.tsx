"use client";

import { useState } from "react";

/** Small client-only button for copying a caption to the clipboard. The
 *  /admin/social page is a Server Component and only needs this one sliver
 *  of interactivity. */
export default function CopyButton({ text, label = "Copy caption" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard can fail inside sandboxed iframes — fall back to a prompt
          window.prompt("Copy caption:", text);
        }
      }}
      className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral transition-colors"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
