"use client";

import { useState } from "react";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { KanbanCardWithDetail } from "./kanban-card-with-detail";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Work } from "@/db/schema/work";
import { cn } from "@/lib/utils";
import { QuickCreateButton } from "@/components/work/create-work-dialog";

const stageAccent: Record<string, string> = {
  new: "bg-slate-400",
  triaged: "bg-blue-500",
  in_progress: "bg-indigo-500",
  awaiting_review: "bg-amber-500",
  revision: "bg-orange-500",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
  cancelled: "bg-muted-foreground",
};

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  teamId: string;
}

interface AvailableTeam {
  id: string;
  name: string;
}

export type WorkWithTeam = Work & { teamName?: string | null };

interface KanbanColumnProps {
  stage: string;
  label: string;
  items: WorkWithTeam[];
  onDrop: (workId: string, newStage: string) => void;
  teamId?: string;
  availableUsers?: AvailableUser[];
  availableTeams?: AvailableTeam[];
  onCreateSuccess?: () => void;
  currentUserId?: string;
}

export function KanbanColumn({
  stage,
  label,
  items,
  onDrop,
  teamId,
  availableUsers = [],
  availableTeams = [],
  onCreateSuccess,
  currentUserId,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const CARD_H = 88; // approximate card height in px
  const VIRTUALIZE_THRESHOLD = 20;
  const shouldVirtualize = items.length > VIRTUALIZE_THRESHOLD;
  const { containerRef, onScroll, virtualItems, totalHeight } = useVirtualList({
    itemCount: items.length,
    itemHeight: CARD_H,
    containerHeight: 560,
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };
  const handleDragLeave = () => setIsOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const workId = e.dataTransfer.getData("workId");
    if (workId) onDrop(workId, stage);
  };

  return (
    <div
      className={cn(
        "group flex w-[272px] shrink-0 flex-col  border bg-muted/40 transition-colors",
        isOver && "bg-primary/5 ring-1 ring-primary/30",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <span
          className={cn(
            "size-2 rounded-full shrink-0",
            stageAccent[stage] ?? "bg-muted-foreground",
          )}
        />
        <h3 className="text-xs font-semibold tracking-wide uppercase text-foreground/70 flex-1">
          {label}
        </h3>
        <span
          className={cn(
            "tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
            items.length > 0
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground",
          )}
        >
          {items.length}
        </span>
        {teamId && (
          <QuickCreateButton
            teamId={teamId}
            stage={stage}
            availableUsers={availableUsers}
            availableTeams={availableTeams}
            onSuccess={onCreateSuccess}
          />
        )}
      </div>
      {shouldVirtualize ? (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-2"
          style={{ height: 560 }}
          onScroll={onScroll}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {virtualItems.map(({ index, start }) => (
              <div
                key={items[index].id}
                style={{ position: "absolute", top: start, left: 0, right: 0 }}
                className="pb-1.5"
              >
                <KanbanCardWithDetail
                  item={items[index]}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-4">
            {items.map((item) => (
              <KanbanCardWithDetail
                key={item.id}
                item={item}
                currentUserId={currentUserId}
              />
            ))}
            {items.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground/60">
                  Drop cards here
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
