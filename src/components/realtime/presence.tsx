"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OnlineUsersProps {
  users: Array<{
    id: string;
    name: string;
    image?: string;
  }>;
  maxDisplay?: number;
}

export function OnlineUsers({ users, maxDisplay = 4 }: OnlineUsersProps) {
  if (users.length === 0) return null;

  const displayUsers = users.slice(0, maxDisplay);
  const remaining = users.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {displayUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className="size-6 border-2 border-background hover:scale-110 transition-transform">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">Online</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-6 border-2 border-background bg-muted">
                <AvatarFallback className="text-[10px]">+{remaining}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">+{remaining} more online</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface OnlineIndicatorProps {
  isOnline: boolean;
  showLabel?: boolean;
}

export function OnlineIndicator({ isOnline, showLabel = false }: OnlineIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`size-2 rounded-full ${
          isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? "Live" : "Offline"}
        </span>
      )}
    </div>
  );
}
