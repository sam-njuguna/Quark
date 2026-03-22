"use client";

import { format, differenceInDays, startOfDay, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";

interface WorkItem {
  id: string;
  title: string;
  type: string;
  stage: string;
  priority: number | null;
  dueDate: Date | string | null;
  createdAt: Date | string;
  assignedTo: string | null;
}

interface WorkTimelineProps {
  items: WorkItem[];
}

const stageColors: Record<string, string> = {
  new: "bg-zinc-200",
  triaged: "bg-blue-300",
  in_progress: "bg-amber-300",
  awaiting_review: "bg-purple-300",
  revision: "bg-orange-300",
  blocked: "bg-red-400",
  done: "bg-emerald-400",
  cancelled: "bg-zinc-300",
};

const ROW_H = 36;
const LABEL_W = 200;
const DAY_W = 28;

export function WorkTimeline({ items }: WorkTimelineProps) {
  const today = startOfDay(new Date());

  const itemsWithDates = items
    .filter((i) => i.createdAt)
    .map((item) => {
      const start = startOfDay(new Date(item.createdAt));
      const end = item.dueDate
        ? startOfDay(new Date(item.dueDate))
        : addDays(start, 7);
      return { ...item, start, end };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (itemsWithDates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <CalendarIcon className="mb-3 size-10 opacity-30" />
          <p className="text-sm">No work items with dates to display</p>
        </CardContent>
      </Card>
    );
  }

  const minDate = itemsWithDates.reduce(
    (min, i) => (i.start < min ? i.start : min),
    itemsWithDates[0].start,
  );
  const maxDate = itemsWithDates.reduce(
    (max, i) => (i.end > max ? i.end : max),
    itemsWithDates[0].end,
  );

  const totalDays = differenceInDays(maxDate, minDate) + 2;
  const totalWidth = totalDays * DAY_W;

  const months: Array<{ label: string; left: number; width: number }> = [];
  let cursor = new Date(minDate);
  while (cursor <= maxDate) {
    const left = differenceInDays(cursor, minDate) * DAY_W;
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const end = nextMonth > maxDate ? addDays(maxDate, 1) : nextMonth;
    const width = differenceInDays(end, cursor) * DAY_W;
    months.push({ label: format(monthStart, "MMM yyyy"), left, width });
    cursor = nextMonth;
  }

  const todayLeft = differenceInDays(today, minDate) * DAY_W;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Timeline / Gantt</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_W + totalWidth }} className="relative">
            {/* Month headers */}
            <div className="flex border-b" style={{ marginLeft: LABEL_W }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="shrink-0 border-r px-1 py-1 text-[10px] font-medium text-muted-foreground"
                  style={{ width: m.width }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Today indicator */}
            {todayLeft >= 0 && todayLeft <= totalWidth && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-500/50 pointer-events-none"
                style={{ left: LABEL_W + todayLeft + DAY_W / 2 }}
              />
            )}

            {/* Rows */}
            {itemsWithDates.map((item) => {
              const barLeft = differenceInDays(item.start, minDate) * DAY_W;
              const barWidth = Math.max(
                (differenceInDays(item.end, item.start) + 1) * DAY_W,
                DAY_W,
              );
              const color = stageColors[item.stage] ?? "bg-zinc-200";

              return (
                <div
                  key={item.id}
                  className="flex items-center border-b last:border-b-0 hover:bg-muted/40 transition-colors"
                  style={{ height: ROW_H }}
                >
                  <div
                    className="flex shrink-0 items-center gap-2 px-3"
                    style={{ width: LABEL_W }}
                  >
                    <Link
                      href={`/dashboard/work/${item.id}`}
                      className="truncate text-xs font-medium hover:underline"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                  </div>

                  <div
                    className="relative"
                    style={{ width: totalWidth, height: ROW_H }}
                  >
                    <div
                      className={`absolute top-2 h-6 rounded-md ${color} flex items-center px-2`}
                      style={{ left: barLeft, width: barWidth }}
                    >
                      <span className="truncate text-[10px] font-medium text-zinc-800">
                        {format(item.start, "MMM d")}
                        {" – "}
                        {format(item.end, "MMM d")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 border-t px-4 py-3">
          {Object.entries(stageColors).map(([stage, color]) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div className={`size-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-muted-foreground capitalize">
                {stage.replace("_", " ")}
              </span>
            </div>
          ))}
          <Badge variant="outline" className="ml-auto text-[10px]">
            <CalendarIcon className="mr-1 size-2.5" />
            Today: {format(today, "MMM d")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
