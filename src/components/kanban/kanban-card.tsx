"use client";

import type { Work } from "@/db/schema/work";
import { format, isPast, isToday } from "date-fns";
import {
  CalendarIcon,
  EyeIcon,
  AlertCircleIcon,
  UserPlusIcon,
  SparklesIcon,
  LoaderIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const typeConfig: Record<string, { dot: string; label: string }> = {
  task: { dot: "bg-blue-500", label: "Task" },
  meeting: { dot: "bg-violet-500", label: "Meeting" },
  research: { dot: "bg-amber-500", label: "Research" },
  code: { dot: "bg-emerald-500", label: "Code" },
  document: { dot: "bg-sky-500", label: "Doc" },
  communication: { dot: "bg-rose-500", label: "Comm" },
};

const priorityAccent: Record<number, string> = {
  1: "border-l-red-500",
  2: "border-l-amber-400",
  3: "border-l-border",
};

interface KanbanCardProps {
  item: Work;
  onClick?: () => void;
  teamName?: string | null;
  currentUserId?: string;
}

export function KanbanCard({
  item,
  onClick,
  teamName,
  currentUserId,
}: KanbanCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("workId", item.id);
  };

  const type = typeConfig[item.type] ?? {
    dot: "bg-muted-foreground",
    label: item.type,
  };
  const priority = item.priority ?? 2;
  const due = item.dueDate ? new Date(item.dueDate) : null;
  const isOverdue = due && isPast(due) && !isToday(due);
  const isDueToday = due && isToday(due);

  // Only the assigned user can drag their own work
  const isAssignedToMe = item.assignedTo === currentUserId;
  const isUnassigned = !item.assignedTo;
  const canDrag = isAssignedToMe;

  return (
    <div
      className={cn(
        "group select-none",
        " border bg-card px-3 py-2.5 mb-2",
        "border-l-[3px] transition-all duration-150",
        canDrag
          ? "cursor-grab hover:shadow-sm hover:-translate-y-px active:cursor-grabbing active:opacity-80 active:scale-[0.99]"
          : "cursor-default",
        priorityAccent[priority] ?? "border-l-border",
        isUnassigned && "opacity-70",
      )}
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      title={
        !canDrag && item.assignedTo
          ? "Only the assignee can move this card"
          : isUnassigned
            ? "Assign yourself to move this card"
            : ""
      }
    >
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0 opacity-80",
                type.dot,
              )}
            />
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
              {type.label}
            </span>
            {item.aiStatus === "running" && (
              <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <LoaderIcon className="size-2.5 animate-spin" />
                AI
              </span>
            )}
            {item.aiStatus === "assigned" && (
              <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <SparklesIcon className="size-2.5" />
                AI
              </span>
            )}
            {item.aiStatus === "completed" && (
              <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <SparklesIcon className="size-2.5" />
                Done
              </span>
            )}
            {item.aiStatus === "failed" && (
              <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                <AlertCircleIcon className="size-2.5" />
                Failed
              </span>
            )}
            {teamName && (
              <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/80 truncate max-w-[80px]">
                {teamName}
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-1">
            <Link
              href={`/dashboard/work/${item.id}`}
              className="flex-1 hover:underline"
            >
              <h4 className="text-sm font-medium leading-snug text-foreground line-clamp-2">
                {item.title}
              </h4>
            </Link>
            {onClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick();
                }}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                title="Quick view"
              >
                <EyeIcon className="size-3" />
              </button>
            )}
          </div>
        </div>

        {item.description && (
          <div
            className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed *:inline"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        )}

        {due && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isOverdue
                ? "text-red-500 dark:text-red-400"
                : isDueToday
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground/60",
            )}
          >
            <CalendarIcon className="size-3 shrink-0" />
            <span>{isToday(due) ? "Today" : format(due, "MMM d")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
