import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-3 w-56" />
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

      {/* People section */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-7 rounded" />
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="size-5 rounded-full shrink-0" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts per team */}
      <div className="space-y-4">
        <Skeleton className="h-2.5 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>

      {/* Team performance */}
      <div className="space-y-4">
        <Skeleton className="h-2.5 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="rounded bg-muted/50 p-2 space-y-1">
                    <Skeleton className="h-5 w-6 mx-auto" />
                    <Skeleton className="h-2.5 w-10 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
