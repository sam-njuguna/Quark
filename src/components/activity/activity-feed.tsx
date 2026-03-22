"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  SendIcon,
  MessageSquareIcon,
  AlertTriangleIcon,
  UserPlusIcon,
  PlusCircleIcon,
  ArrowRightIcon,
} from "lucide-react";

interface ActivityItem {
  id: string;
  workId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  work: {
    id: string;
    title: string;
    type: string;
  } | null;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  showWorkTitle?: boolean;
}

const actionConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  created: {
    icon: PlusCircleIcon,
    label: "created",
    color: "text-blue-500",
  },
  stage_changed: {
    icon: ArrowRightIcon,
    label: "moved",
    color: "text-amber-500",
  },
  assigned: {
    icon: UserPlusIcon,
    label: "assigned",
    color: "text-purple-500",
  },
  submitted: {
    icon: SendIcon,
    label: "submitted",
    color: "text-sky-500",
  },
  approved: {
    icon: CheckCircleIcon,
    label: "approved",
    color: "text-emerald-500",
  },
  rejected: {
    icon: XCircleIcon,
    label: "requested revision on",
    color: "text-orange-500",
  },
  blocked: {
    icon: AlertTriangleIcon,
    label: "blocked",
    color: "text-red-500",
  },
  cancelled: {
    icon: XCircleIcon,
    label: "cancelled",
    color: "text-zinc-500",
  },
  commented: {
    icon: MessageSquareIcon,
    label: "commented on",
    color: "text-blue-500",
  },
  started: {
    icon: PlayIcon,
    label: "started working on",
    color: "text-amber-500",
  },
};

function getActionDescription(
  action: string,
  metadata: Record<string, unknown> | null,
): string {
  if (action === "stage_changed" && metadata) {
    const from = metadata.from as string;
    const to = metadata.to as string;
    return `moved from ${from?.replace("_", " ")} to ${to?.replace("_", " ")}`;
  }
  return actionConfig[action]?.label || action;
}

export function ActivityFeed({
  activities,
  showWorkTitle = true,
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = actionConfig[activity.action] || {
            icon: ArrowRightIcon,
            label: activity.action,
            color: "text-zinc-500",
          };
          const Icon = config.icon;
          const initials =
            activity.user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?";

          return (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="size-8">
                <AvatarImage src={activity.user?.image || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-start gap-2">
                  <Icon className={`mt-0.5 size-4 ${config.color}`} />
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.user?.name || activity.user?.email || "Someone"}
                    </span>{" "}
                    {getActionDescription(activity.action, activity.metadata)}
                    {showWorkTitle && activity.work && (
                      <>
                        {" "}
                        <span className="font-medium">
                          {activity.work.title}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {typeof activity.metadata?.feedback === "string" && (
                  <p className="ml-6 text-sm text-muted-foreground italic">
                    &ldquo;{activity.metadata.feedback}&rdquo;
                  </p>
                )}
                {typeof activity.metadata?.reason === "string" && (
                  <p className="ml-6 text-sm text-muted-foreground italic">
                    Reason: {activity.metadata.reason}
                  </p>
                )}
                {typeof activity.metadata?.content === "string" &&
                  activity.action === "commented" && (
                    <p className="ml-6 text-sm text-muted-foreground">
                      {activity.metadata.content.slice(0, 100)}
                      {activity.metadata.content.length > 100 && "..."}
                    </p>
                  )}
                <p className="ml-6 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
