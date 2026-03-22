"use client";

import { useState, useTransition } from "react"; // useTransition used for startTransition
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BellIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { listMyActivity } from "@/actions/activity/list";
import { useRouter } from "next/navigation";

type Activity = Awaited<ReturnType<typeof listMyActivity>>[number];

const actionLabels: Record<string, string> = {
  created: "created",
  stage_changed: "moved",
  assigned: "was assigned",
  submitted: "submitted work for review",
  approved: "was approved",
  rejected: "was sent back for revision",
  blocked: "was blocked",
  cancelled: "was cancelled",
  commented: "left a comment on",
};

const actionColors: Record<string, string> = {
  created: "bg-blue-500",
  stage_changed: "bg-amber-500",
  assigned: "bg-purple-500",
  submitted: "bg-indigo-500",
  approved: "bg-emerald-500",
  rejected: "bg-orange-500",
  blocked: "bg-red-500",
  cancelled: "bg-zinc-400",
  commented: "bg-sky-500",
};

function ActivityItem({ item }: { item: Activity }) {
  const label = actionLabels[item.action] ?? item.action;
  const dot = actionColors[item.action] ?? "bg-zinc-400";

  return (
    <div className="flex gap-3 py-3 px-1">
      <div className="mt-1.5 shrink-0">
        <span className={`block size-2 rounded-full ${dot}`} />
      </div>
      <div className="flex-1 space-y-0.5 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-medium">
            {item.user?.name || item.user?.email || "Someone"}
          </span>{" "}
          <span className="text-muted-foreground">{label}</span>{" "}
          {item.work?.title && (
            <span className="font-medium truncate">{item.work.title}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  initialActivities: Activity[];
  unreadCount: number;
}

export function NotificationCenter({
  initialActivities,
  unreadCount,
}: NotificationCenterProps) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [seen, setSeen] = useState(false);
  const [, startTransition] = useTransition();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !seen) {
      setSeen(true);
      startTransition(async () => {
        const fresh = await listMyActivity(20);
        setActivities(fresh);
      });
    }
  };

  const displayCount = seen ? 0 : unreadCount;

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 relative"
          aria-label="Notifications"
        >
          <BellIcon className="size-4" />
          {displayCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {displayCount > 9 ? "9+" : displayCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0 px-1 text-xs text-muted-foreground"
              onClick={() => router.push("/dashboard")}
            >
              View all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BellIcon className="size-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y px-3">
              {activities.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
