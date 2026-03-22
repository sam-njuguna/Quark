"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { KanbanColumn } from "./kanban-column";
import { KanbanAutoRefresh } from "./kanban-auto-refresh";
import { workStages } from "@/db/schema/work";
import type { WorkWithTeam } from "./kanban-column";
import { updateStage } from "@/actions/work/update-stage";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/use-presence";

const stageLabels: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  revision: "Revision",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
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

interface KanbanBoardProps {
  workItems: WorkWithTeam[];
  teamId?: string;
  availableUsers?: AvailableUser[];
  availableTeams?: AvailableTeam[];
  onRefresh?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

export function KanbanBoard({
  workItems,
  teamId,
  availableUsers = [],
  availableTeams = [],
  onRefresh,
  currentUserId,
  currentUserName,
}: KanbanBoardProps) {
  const [items, setItems] = useState(workItems);
  const [, startTransition] = useTransition();

  const boardRef = useRef<HTMLDivElement>(null);
  const lastCursorBroadcast = useRef<number>(0);

  const {
    isConnected,
    onlineUsers,
    otherCursors,
    broadcastCardMove,
    broadcastCursor,
  } = usePresence({
    teamId: teamId ?? "",
    userId: currentUserId ?? "",
    userName: currentUserName ?? "",
    onCardMove: useCallback((workId: string, stage: string) => {
      setItems((prev) =>
        prev.map((item) => (item.id === workId ? { ...item, stage } : item)),
      );
    }, []),
  });

  const throttledBroadcastCursor = useCallback(
    (cursor: { x: number; y: number }) => {
      const now = Date.now();
      if (now - lastCursorBroadcast.current > 50) {
        lastCursorBroadcast.current = now;
        broadcastCursor(cursor);
      }
    },
    [broadcastCursor],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      throttledBroadcastCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [throttledBroadcastCursor],
  );

  const handleDrop = (workId: string, newStage: string) => {
    const prev = items.find((i) => i.id === workId)?.stage;
    setItems((prev) =>
      prev.map((item) =>
        item.id === workId ? { ...item, stage: newStage } : item,
      ),
    );

    if (prev && prev !== newStage) {
      broadcastCardMove(workId, newStage);
    }

    startTransition(async () => {
      try {
        await updateStage(workId, newStage, undefined, true);
      } catch (e) {
        setItems((cur) =>
          cur.map((item) =>
            item.id === workId ? { ...item, stage: prev ?? item.stage } : item,
          ),
        );
        toast.error(e instanceof Error ? e.message : "Failed to move card");
      }
    });
  };

  const handleCreateSuccess = () => {
    onRefresh?.();
  };

  const activeStages = workStages.filter((stage) => stage !== "cancelled");

  return (
    <>
      <KanbanAutoRefresh intervalMs={30_000} />
      {teamId && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isConnected
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-muted-foreground",
              )}
            />
            {onlineUsers.length > 0
              ? `${onlineUsers.length} online`
              : isConnected
                ? "Live"
                : "Connecting..."}
          </Badge>
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((user) => (
                <Avatar
                  key={user.id}
                  className="size-6 border-2 border-background"
                  title={user.name}
                >
                  <AvatarImage
                    src={
                      availableUsers.find((u) => u.id === user.id)?.image ??
                      undefined
                    }
                  />
                  <AvatarFallback className="text-[10px]">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {onlineUsers.length > 5 && (
                <div className="size-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div
        ref={boardRef}
        className="relative flex gap-4 scrollbar-thin overflow-x-auto pb-4"
        onMouseMove={handleMouseMove}
      >
        {otherCursors.map((cursor) => (
          <div
            key={cursor.id}
            className="absolute pointer-events-none z-50 transition-all duration-75"
            style={{
              left: cursor.cursor.x,
              top: cursor.cursor.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-md"
            >
              <path
                d="M5.65376 3.08862C5.12778 2.88761 4.53336 3.29838 4.53336 3.87206V19.1279C4.53336 19.7016 5.12778 20.1124 5.65376 19.9114L9.88542 18.4113C9.96643 18.3808 10.0336 18.3808 10.1146 18.4113L14.3463 19.9114C14.8723 20.1124 15.4667 19.7016 15.4667 19.1279V3.87206C15.4667 3.29838 14.8723 2.88761 14.3463 3.08862L10.1146 4.58868C10.0336 4.61918 9.96643 4.61918 9.88542 4.58868L5.65376 3.08862Z"
                fill="#7c3aed"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <div className="absolute left-5 top-4 rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap shadow-sm">
              {cursor.name}
            </div>
          </div>
        ))}
        {activeStages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={stageLabels[stage]}
            items={items.filter((item) => item.stage === stage)}
            onDrop={handleDrop}
            teamId={teamId}
            availableUsers={availableUsers}
            availableTeams={availableTeams}
            onCreateSuccess={handleCreateSuccess}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </>
  );
}
