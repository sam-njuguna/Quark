import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* KPI strip — flat divide-x */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 first:pl-0 last:pr-0 space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Stage Health + Workload */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Skeleton className="h-2.5 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3 w-28 shrink-0" />
                <Skeleton className="h-1 flex-1 rounded-full" />
                <Skeleton className="h-3 w-6 shrink-0" />
                <Skeleton className="h-3 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-2.5 w-16" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sprints */}
      <div className="space-y-4">
        <Skeleton className="h-2.5 w-14" />
        <Skeleton className="h-40 rounded-lg" />
      </div>

      {/* Board */}
      <div className="space-y-4">
        <Skeleton className="h-2.5 w-12" />
        <div className="flex gap-4 overflow-x-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-60 shrink-0 flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              {Array.from({ length: i % 2 === 0 ? 2 : 3 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-md border border-l-[3px] border-l-border bg-card p-3 space-y-2"
                >
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
