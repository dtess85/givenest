"use client";

interface AgentCardProps {
  name: string;
  officeName: string | null;
  primaryCity: string | null;
  activeListingCount: number;
  isGivenest: boolean;
  onSelect: () => void;
}

export default function AgentCard({
  name,
  officeName,
  primaryCity,
  activeListingCount,
  isGivenest,
  onSelect,
}: AgentCardProps) {
  const initials = name
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg border bg-white px-4 py-3 text-left transition-colors hover:border-coral ${
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
      <div className="flex-shrink-0 rounded-md border border-border px-3 py-[6px] text-[12px] transition-colors hover:border-coral hover:text-coral">
        Request
      </div>
    </button>
  );
}
