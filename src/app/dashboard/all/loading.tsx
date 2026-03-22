import { Skeleton } from "@/components/ui/skeleton";

export default function AllWorkLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-7 rounded-md ${i === 0 ? "w-14" : "w-16"}`}
          />
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-60 shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between pb-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-5" />
            </div>
            {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
              <div
                key={j}
                className="rounded-md border border-l-[3px] border-l-border bg-card p-3 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <Skeleton className="size-1.5 rounded-full" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
