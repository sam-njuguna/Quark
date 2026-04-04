"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { WorkDetailSheet } from "@/components/work/work-detail-sheet";
import { updateStage } from "@/actions/work/update-stage";
import { approveWork } from "@/actions/work/approve";
import { rejectWork } from "@/actions/work/reject";
import { blockWork } from "@/actions/work/block";
import { addComment } from "@/actions/comments/add";
import { getWork } from "@/actions/work/get";
import { createSprint } from "@/actions/sprints";
import { pushWorkItemToCalendar } from "@/actions/integrations/push-to-calendar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Work } from "@/db/schema/work";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarOffIcon,
  CalendarPlusIcon,
  ZapIcon,
  FlameIcon,
  CalendarIcon,
  EyeIcon,
  CirclePlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  task: "bg-blue-500",
  meeting: "bg-purple-500",
  research: "bg-amber-500",
  code: "bg-emerald-500",
  document: "bg-sky-500",
  communication: "bg-rose-500",
};

type WorkDetail = Awaited<ReturnType<typeof getWork>>;

interface Sprint {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  teamId: string;
}

interface WorkCalendarProps {
  workItems: Work[];
  teamId?: string;
  googleConnected?: boolean;
  sprints?: Sprint[];
  canManageSprints?: boolean;
}

const sprintColors = [
  "bg-violet-100/70 dark:bg-violet-900/30 border-violet-300/60 dark:border-violet-700/50",
  "bg-blue-100/70 dark:bg-blue-900/30 border-blue-300/60 dark:border-blue-700/50",
  "bg-emerald-100/70 dark:bg-emerald-900/30 border-emerald-300/60 dark:border-emerald-700/50",
  "bg-amber-100/70 dark:bg-amber-900/30 border-amber-300/60 dark:border-amber-700/50",
];

function PushToCalendarButton({ workId }: { workId: string }) {
  const [pending, startTransition] = useTransition();
  const handlePush = () => {
    startTransition(async () => {
      try {
        const result = await pushWorkItemToCalendar(workId);
        if (result.success) {
          toast.success("Added to Google Calendar", {
            action: result.eventUrl
              ? {
                  label: "Open",
                  onClick: () => window.open(result.eventUrl, "_blank"),
                }
              : undefined,
          });
        } else {
          toast.error(result.error ?? "Failed to push to calendar");
        }
      } catch {
        toast.error("Failed to push to calendar");
      }
    });
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handlePush();
      }}
      disabled={pending}
      className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
      title="Push to Google Calendar"
    >
      <CalendarPlusIcon className="size-3" />
    </button>
  );
}

function CreateSprintDialog({
  open,
  onOpenChange,
  teamId,
  defaultStart,
  defaultEnd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamId: string;
  defaultStart?: Date;
  defaultEnd?: Date;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd);

  const handleCreate = () => {
    if (!name.trim() || !startDate || !endDate) return;
    startTransition(async () => {
      try {
        await createSprint({
          name: name.trim(),
          teamId,
          startDate,
          endDate,
          goal: goal.trim() || undefined,
        });
        toast.success(`Sprint "${name}" created`);
        setName("");
        setGoal("");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create sprint");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
          <DialogDescription>
            Sprints appear as coloured bands on the calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sprint-name">Sprint name</Label>
            <Input
              id="sprint-name"
              placeholder="Sprint 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-9",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-3.5" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-9",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-3.5" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sprint-goal">
              Goal <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="sprint-goal"
              placeholder="What should the team achieve?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !startDate || !endDate || pending}
            className="gap-1.5"
          >
            <ZapIcon className="size-3.5" />
            {pending ? "Creating…" : "Create Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkCalendar({
  workItems,
  teamId,
  googleConnected = false,
  sprints = [],
  canManageSprints = false,
}: WorkCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openId, setOpenId] = useState<string | null>(null);
  const [workDetail, setWorkDetail] = useState<WorkDetail | null>(null);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const itemsByDay = (day: Date) =>
    workItems.filter((w) => w.dueDate && isSameDay(new Date(w.dueDate), day));

  const noDateItems = workItems.filter((w) => !w.dueDate);

  const handleOpen = async (item: Work) => {
    setOpenId(item.id);
    setWorkDetail(item as unknown as WorkDetail);
    try {
      const full = await getWork(item.id);
      setWorkDetail(full);
    } catch {}
  };

  const openItem = workItems.find((w) => w.id === openId);

  // Compute sprint for each day
  const sprintForDay = (
    day: Date,
  ): { sprint: Sprint; colorIdx: number } | null => {
    for (let i = 0; i < sprints.length; i++) {
      const s = sprints[i];
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      if (isWithinInterval(day, { start, end })) {
        return { sprint: s, colorIdx: i % sprintColors.length };
      }
    }
    return null;
  };

  const activeSprints = sprints.filter((s) => s.status === "active");
  const planningSprints = sprints.filter((s) => s.status === "planning");

  return (
    <>
      <div className="space-y-4">
        {/* Month navigation + sprint controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            {activeSprints.length > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] border-violet-300 text-violet-600 dark:text-violet-400"
              >
                <FlameIcon className="size-2.5" />
                {activeSprints[0].name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canManageSprints && teamId && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5 gap-1.5 mr-1"
                onClick={() => setSprintDialogOpen(true)}
              >
                <CirclePlus className="size-4" />
                Sprint
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Sprint legend */}
        {sprints.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {[...activeSprints, ...planningSprints].slice(0, 4).map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "inline-block size-2 rounded-sm border",
                    sprintColors[i % sprintColors.length],
                  )}
                />
                <span>{s.name}</span>
                <span className="text-muted-foreground/50">
                  {format(new Date(s.startDate), "MMM d")}–
                  {format(new Date(s.endDate), "MMM d")}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        <div className="rounded-lg border overflow-hidden">
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="px-3 py-2 text-xs font-medium text-muted-foreground text-center border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, di) => {
                const items = itemsByDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const sprintMatch = sprintForDay(day);
                return (
                  <div
                    key={di}
                    className={cn(
                      "min-h-24 p-2 border-r last:border-r-0 relative",
                      !inMonth && "bg-muted/20",
                      sprintMatch && sprintColors[sprintMatch.colorIdx],
                    )}
                  >
                    {sprintMatch && (
                      <div className="absolute top-0.5 right-0.5 text-[8px] text-muted-foreground/50 font-medium truncate max-w-[80%] text-right leading-tight">
                        {sprintMatch.sprint.name}
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1",
                        today && "bg-primary text-primary-foreground",
                        !today && inMonth && "text-foreground",
                        !today && !inMonth && "text-muted-foreground/40",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="w-full text-left group cursor-pointer"
                        >
                          <Link
                            href={`/dashboard/work/${item.id}`}
                            className={cn(
                              "flex items-center gap-1 rounded px-1 py-0.5 text-xs hover:opacity-80 transition-opacity",
                              item.stage === "done"
                                ? "bg-muted text-muted-foreground line-through"
                                : "bg-background/80 text-foreground shadow-sm",
                            )}
                          >
                            <span
                              className={`size-1.5 rounded-full shrink-0 ${typeColors[item.type] ?? "bg-zinc-400"}`}
                            />
                            <span className="truncate leading-tight flex-1">
                              {item.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpen(item);
                              }}
                              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                              title="Quick view"
                            >
                              <EyeIcon className="size-3" />
                            </button>
                            {googleConnected && (
                              <PushToCalendarButton workId={item.id} />
                            )}
                          </Link>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1">
                          +{items.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* No-date items */}
        {noDateItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarOffIcon className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {noDateItems.length} item{noDateItems.length !== 1 ? "s" : ""}{" "}
                with no due date
              </p>
              {googleConnected && (
                <span className="text-[10px] text-muted-foreground/60">
                  · hover an item to push it to Google Calendar
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {noDateItems.map((item) => (
                <div key={item.id} className="flex items-center gap-1 group">
                  <Link href={`/dashboard/work/${item.id}`}>
                    <Badge
                      variant="outline"
                      className="gap-1 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <span
                        className={`size-1.5 rounded-full ${typeColors[item.type] ?? "bg-zinc-400"}`}
                      />
                      {item.title}
                    </Badge>
                  </Link>
                  <button
                    onClick={() => handleOpen(item)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                    title="Quick view"
                  >
                    <EyeIcon className="size-3" />
                  </button>
                  {googleConnected && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <PushToCalendarButton workId={item.id} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {openItem && workDetail && (
        <WorkDetailSheet
          work={workDetail as Parameters<typeof WorkDetailSheet>[0]["work"]}
          open={openId !== null}
          onOpenChange={(o) => {
            if (!o) setOpenId(null);
          }}
          onApprove={async (id) => {
            await approveWork(id);
            router.refresh();
          }}
          onReject={async (id, feedback) => {
            await rejectWork(id, feedback);
            router.refresh();
          }}
          onBlock={async (id, reason) => {
            await blockWork(id, reason);
            router.refresh();
          }}
          onAddComment={async (id, content) => {
            await addComment({ workId: id, content });
            const full = await getWork(id);
            setWorkDetail(full);
          }}
          aiAgentInfo={workDetail.aiAgentInfo as any}
        />
      )}

      {canManageSprints && teamId && (
        <CreateSprintDialog
          open={sprintDialogOpen}
          onOpenChange={setSprintDialogOpen}
          teamId={teamId}
          defaultStart={monthStart}
          defaultEnd={monthEnd}
        />
      )}
    </>
  );
}
