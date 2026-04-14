/**
 * Skeleton shown in the RSC Suspense fallback while the initial listings
 * query resolves on the server. Visual match for the skeleton BuyClient
 * renders during client-side fetches.
 */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white animate-pulse">
      <div className="h-[180px] bg-[#F0EDEA]" />
      <div className="px-[18px] py-4">
        <div className="mb-2 h-4 w-24 rounded bg-[#E8E5E0]" />
        <div className="mb-1 h-3 w-40 rounded bg-[#E8E5E0]" />
        <div className="mb-4 h-3 w-28 rounded bg-[#E8E5E0]" />
        <div className="flex gap-4 mb-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-6 w-10 rounded bg-[#E8E5E0]" />)}
        </div>
        <div className="h-px bg-border mb-3" />
        <div className="flex justify-between">
          <div className="h-3 w-24 rounded bg-[#E8E5E0]" />
          <div className="h-4 w-16 rounded bg-[#E8E5E0]" />
        </div>
      </div>
    </div>
  );
}

export default function BuySkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] px-8 pb-20 pt-6">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
