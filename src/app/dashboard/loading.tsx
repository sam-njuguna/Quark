import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Flat KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 first:pl-0 last:pr-0 space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* 2-col: kanban + activity sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-60 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between pb-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-6" />
              </div>
              {Array.from({
                length: i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 4 : 1,
              }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-md border border-l-[3px] border-l-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-1.5 rounded-full" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  {j % 2 === 0 && <Skeleton className="h-3 w-16 mt-1" />}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Activity sidebar */}
        <div>
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-border/50">
            <Skeleton className="size-3 rounded" />
            <Skeleton className="h-2.5 w-14" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="size-6 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
