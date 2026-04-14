"use client";

import { getInitials } from "@/lib/utils";

interface AgentCardProps {
  name: string;
  officeName: string | null;
  primaryCity: string | null;
  activeListingCount: number;
  isGivenest: boolean;
  isFavorite?: boolean;
  onSelect: () => void;
  onToggleFavorite?: () => void;
}

export default function AgentCard({
  name,
  officeName,
  primaryCity,
  activeListingCount,
  isGivenest,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: AgentCardProps) {
  const initials = getInitials(name);

  return (
    <div
      className={`flex w-full items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-colors ${
        isGivenest ? "border-coral/40" : "border-border"
      }`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-medium text-white">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium truncate">{name}</span>
          {isGivenest && (
            <span className="flex-shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-coral">
              Givenest
            </span>
          )}
        </div>
        {officeName && (
          <div className="text-[11px] text-muted truncate">{officeName}</div>
        )}
        <div className="flex items-center gap-2 text-[11px] text-muted">
          {primaryCity && <span>{primaryCity}</span>}
          {activeListingCount > 0 && (
            <>
              {primaryCity && <span className="text-border">·</span>}
              <span>{activeListingCount} active listing{activeListingCount !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-1.5 text-coral transition-colors hover:text-[#d4574a]"
            aria-label={isFavorite ? "Remove from saved" : "Save agent"}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              />
            </svg>
          </button>
        )}
        <button
          onClick={onSelect}
          className="rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral"
        >
          Request
        </button>
      </div>
    </div>
  );
}
