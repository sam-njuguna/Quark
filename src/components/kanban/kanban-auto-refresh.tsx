"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface KanbanAutoRefreshProps {
  intervalMs?: number;
}

export function KanbanAutoRefresh({ intervalMs = 30_000 }: KanbanAutoRefreshProps) {
  const router = useRouter();
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [router, intervalMs]);

  return null;
}
