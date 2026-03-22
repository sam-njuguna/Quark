import { Skeleton } from "@/components/ui/skeleton";

export default function HierarchyLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Org chart canvas with node cards */}
      <div className="relative rounded-lg border bg-muted/10 h-[600px] overflow-hidden">
        {/* Root node */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <div className="rounded-md border bg-card px-4 py-2.5 w-40 space-y-1.5 shadow-xs">
            <Skeleton className="h-3.5 w-24 mx-auto" />
            <Skeleton className="h-2.5 w-16 mx-auto" />
          </div>
        </div>
        {/* Child nodes row 1 */}
        <div className="absolute top-44 w-full flex justify-center gap-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border bg-card px-3 py-2 w-32 space-y-1"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          ))}
        </div>
        {/* Child nodes row 2 */}
        <div className="absolute top-72 w-full flex justify-center gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border bg-card px-3 py-2 w-28 space-y-1"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
