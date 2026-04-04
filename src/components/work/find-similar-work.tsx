"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SparklesIcon } from "lucide-react";
import { getSimilarWork } from "@/actions/search/semantic";

interface SimilarWork {
  id: string;
  title: string;
  similarity: number;
}

interface FindSimilarWorkProps {
  workId: string;
}

export function FindSimilarWork({ workId }: FindSimilarWorkProps) {
  const [similar, setSimilar] = useState<SimilarWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const data = await getSimilarWork(workId, 5);
        setSimilar(data);
      } catch (e) {
        setError("Could not load similar work");
      } finally {
        setLoading(false);
      }
    }
    fetchSimilar();
  }, [workId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || similar.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-muted/20 flex items-center gap-2">
        <SparklesIcon className="size-3.5 text-amber-500" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Similar Work
        </p>
      </div>
      <div className="px-4 py-3 space-y-2">
        {similar.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/work/${item.id}`}
            className="flex items-center justify-between group"
          >
            <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
              {item.title}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {Math.round(item.similarity * 100)}% match
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
