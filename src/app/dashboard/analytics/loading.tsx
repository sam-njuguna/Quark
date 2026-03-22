import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-56" />
      </div>

      {/* Flat KPI strip — 4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 first:pl-0 last:pr-0 space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Status strip — 3 cols */}
      <div className="grid grid-cols-3 divide-x divide-border/50 border border-border/40 rounded-md bg-card">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-44 w-full rounded" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-44 w-full rounded" />
        </div>
      </div>

      {/* Work by Stage */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Work by Type */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
