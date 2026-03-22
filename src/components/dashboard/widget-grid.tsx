"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboardIcon } from "lucide-react";

export interface WidgetConfig {
  id: string;
  label: string;
  defaultVisible: boolean;
}

const STORAGE_KEY = "quark-dashboard-widgets";

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: "stats", label: "KPI Stats", defaultVisible: true },
  { id: "kanban", label: "Kanban Board", defaultVisible: true },
  { id: "recent-activity", label: "Recent Activity", defaultVisible: true },
  { id: "my-work", label: "My Work List", defaultVisible: true },
  { id: "workload", label: "Team Workload", defaultVisible: false },
  { id: "quick-actions", label: "Quick Actions", defaultVisible: true },
];

function getInitialVisibility(): Record<string, boolean> {
  if (typeof window === "undefined") {
    return Object.fromEntries(
      AVAILABLE_WIDGETS.map((w) => [w.id, w.defaultVisible]),
    );
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Record<string, boolean>;
  } catch {
    // ignore
  }
  return Object.fromEntries(
    AVAILABLE_WIDGETS.map((w) => [w.id, w.defaultVisible]),
  );
}

interface WidgetGridProps {
  children: (visibleWidgets: Set<string>) => React.ReactNode;
}

export function WidgetGrid({ children }: WidgetGridProps) {
  const [visibility, setVisibility] =
    useState<Record<string, boolean>>(getInitialVisibility);

  // Persist to localStorage whenever visibility changes (skip on server)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
    } catch {
      // ignore
    }
  }, [visibility]);

  function toggle(id: string) {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const visibleSet = new Set(
    Object.entries(visibility)
      .filter(([, v]) => v)
      .map(([k]) => k),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <LayoutDashboardIcon className="size-3.5" />
              Widgets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Dashboard widgets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {AVAILABLE_WIDGETS.map((widget) => (
              <DropdownMenuCheckboxItem
                key={widget.id}
                checked={visibility[widget.id] ?? widget.defaultVisible}
                onCheckedChange={() => toggle(widget.id)}
              >
                {widget.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children(visibleSet)}
    </div>
  );
}
