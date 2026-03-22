"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceIndicator } from "./presence-indicator";
import type { AvailabilityStatus } from "@/actions/availability";
import type { WeeklySchedule } from "@/db/schema/availability";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_KEYS: (keyof WeeklySchedule)[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

interface MemberAvailability {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  status: AvailabilityStatus;
  statusNote: string | null;
  showAvailability: boolean;
  weeklySchedule: WeeklySchedule | null;
}

interface TeamAvailabilityViewProps {
  members: MemberAvailability[];
}

export function TeamAvailabilityView({ members }: TeamAvailabilityViewProps) {
  const visible = members.filter((m) => m.showAvailability);

  if (visible.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No team members have shared their availability yet.
      </p>
    );
  }

  const todayIdx = new Date().getDay(); // 0=Sun…6=Sat

  return (
    <div className="space-y-3">
      {/* Quick status row */}
      <div className="flex flex-wrap gap-2">
        {visible.map((m) => {
          const initials = m.name.slice(0, 2).toUpperCase();
          return (
            <div
              key={m.userId}
              className="flex items-center gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5"
              title={m.statusNote ?? undefined}
            >
              <div className="relative">
                <Avatar className="size-6">
                  <AvatarImage src={m.image ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <PresenceIndicator status={m.status} size="sm" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate max-w-[100px]">
                  {m.name}
                </p>
                {m.statusNote && (
                  <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {m.statusNote}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly schedule grid */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-[120px]">
                Member
              </th>
              {DAYS.map((d, i) => (
                <th
                  key={d}
                  className={cn(
                    "px-1 py-1.5 text-center font-medium text-muted-foreground",
                    i === todayIdx && "bg-primary/10 text-primary",
                  )}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr
                key={m.userId}
                className="border-b last:border-b-0 hover:bg-muted/10"
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <PresenceIndicator status={m.status} size="sm" />
                    <span className="truncate max-w-[90px] font-medium">
                      {m.name}
                    </span>
                  </div>
                </td>
                {DAY_KEYS.map((key, i) => {
                  const day = m.weeklySchedule?.[key];
                  return (
                    <td
                      key={key}
                      className={cn(
                        "px-1 py-2 text-center",
                        i === todayIdx && "bg-primary/5",
                      )}
                    >
                      {day?.isAvailable ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-[9px] text-muted-foreground leading-none">
                            {day.startTime}–{day.endTime}
                          </span>
                        </div>
                      ) : (
                        <span className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
