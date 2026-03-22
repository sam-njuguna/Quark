import { Skeleton } from "@/components/ui/skeleton";

export default function NewWorkLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back nav */}
      <Skeleton className="h-7 w-24 rounded-md" />

      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Form card */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="p-4 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>

          {/* Assignee + Due date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
