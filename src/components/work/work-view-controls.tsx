"use client";

import { useQueryState } from "nuqs";
import { KanbanIcon, ListIcon, CalendarIcon } from "lucide-react";

const WORK_TYPES = [
  { value: "", label: "All" },
  { value: "task", label: "Tasks" },
  { value: "code", label: "Code" },
  { value: "research", label: "Research" },
  { value: "meeting", label: "Meetings" },
  { value: "document", label: "Documents" },
  { value: "communication", label: "Comms" },
];

interface WorkViewControlsProps {
  currentView: string;
  currentType?: string;
}

export function WorkViewControls({
  currentView,
  currentType,
}: WorkViewControlsProps) {
  const [type, setType] = useQueryState("type", {
    defaultValue: "",
    shallow: false,
  });
  const [view, setView] = useQueryState("view", {
    defaultValue: "kanban",
    shallow: false,
  });

  const activeType = type ?? currentType ?? "";
  const activeView = view ?? currentView;

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
        {[
          {
            value: "kanban",
            icon: <KanbanIcon className="size-3.5" />,
            label: "Board",
          },
          {
            value: "list",
            icon: <ListIcon className="size-3.5" />,
            label: "List",
          },
          {
            value: "calendar",
            icon: <CalendarIcon className="size-3.5" />,
            label: "Calendar",
          },
        ].map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeView === v.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      {/* Type tabs — rendered separately via a portal-like approach */}
      <div
        data-type-tabs
        className="flex items-center gap-1 border-b"
        style={{ display: "contents" }}
      >
        {WORK_TYPES.map((wt) => {
          const isActive = activeType === wt.value;
          return (
            <button
              key={wt.value}
              onClick={() => setType(wt.value || null)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {wt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function WorkTypeTabs({ currentType }: { currentType?: string }) {
  const [type, setType] = useQueryState("type", {
    defaultValue: "",
    shallow: false,
  });

  const activeType = type ?? currentType ?? "";

  return (
    <div className="flex items-center gap-1 border-b">
      {WORK_TYPES.map((wt) => {
        const isActive = activeType === wt.value;
        return (
          <button
            key={wt.value}
            onClick={() => setType(wt.value || null)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {wt.label}
          </button>
        );
      })}
    </div>
  );
}

export function WorkViewToggle({ currentView }: { currentView: string }) {
  const [view, setView] = useQueryState("view", {
    defaultValue: "kanban",
    shallow: false,
  });

  const activeView = view ?? currentView;

  return (
    <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
      {[
        {
          value: "kanban",
          icon: <KanbanIcon className="size-3.5" />,
          label: "Board",
        },
        {
          value: "list",
          icon: <ListIcon className="size-3.5" />,
          label: "List",
        },
        {
          value: "calendar",
          icon: <CalendarIcon className="size-3.5" />,
          label: "Calendar",
        },
      ].map((v) => (
        <button
          key={v.value}
          onClick={() => setView(v.value)}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
            activeView === v.value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {v.icon}
          {v.label}
        </button>
      ))}
    </div>
  );
}
