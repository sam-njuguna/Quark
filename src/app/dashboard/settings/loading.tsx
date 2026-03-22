import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-52" />
      </div>

      {/* Tab list — 8 tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-8 rounded-md ${i === 0 ? "w-16" : i < 3 ? "w-20" : "w-24"}`}
          />
        ))}
      </div>

      {/* Profile tab content */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="p-4 space-y-4">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-lg shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          {/* Form fields */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-destructive/20 bg-card">
        <div className="px-4 py-3 border-b border-destructive/20">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
