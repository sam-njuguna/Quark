"use client";

import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/actions/availability";

const statusConfig: Record<AvailabilityStatus, { color: string; label: string }> = {
  available: { color: "bg-emerald-500", label: "Available" },
  busy: { color: "bg-amber-500", label: "Busy" },
  away: { color: "bg-yellow-400", label: "Away" },
  dnd: { color: "bg-red-500", label: "Do not disturb" },
  offline: { color: "bg-zinc-400", label: "Offline" },
};

interface PresenceIndicatorProps {
  status: AvailabilityStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function PresenceIndicator({
  status,
  size = "sm",
  showLabel = false,
  className,
}: PresenceIndicatorProps) {
  const config = statusConfig[status] ?? statusConfig.offline;
  const sizeClass = size === "sm" ? "size-2" : size === "md" ? "size-2.5" : "size-3";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full ring-2 ring-background shrink-0",
          sizeClass,
          config.color,
        )}
        title={config.label}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </span>
  );
}
