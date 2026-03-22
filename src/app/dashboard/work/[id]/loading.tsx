import { Skeleton } from "@/components/ui/skeleton";

export default function WorkDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-6 max-sm:px-4">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>

      {/* Header — badges + title + meta */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* 3-col grid: content + sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main — 2 col */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description card */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>

          {/* Instructions card */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className="p-4">
              <Skeleton className="h-24 w-full rounded" />
            </div>
          </div>

          {/* Comments */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-2.5 w-20" />
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-4">
          {/* Details card */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-2.5 w-14" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Actions card */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-2.5 w-16" />
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
