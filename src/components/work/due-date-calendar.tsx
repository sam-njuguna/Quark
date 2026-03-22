"use client";

import { useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, XIcon } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { updateWork } from "@/actions/work/update";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DueDateCalendarProps {
  workId: string;
  dueDate?: Date | string | null;
  readonly?: boolean;
}

export function DueDateCalendar({ workId, dueDate, readonly }: DueDateCalendarProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const current = dueDate ? new Date(dueDate) : undefined;
  const isOverdue = current ? isBefore(startOfDay(current), startOfDay(new Date())) : false;

  function handleSelect(date: Date | undefined) {
    setOpen(false);
    startTransition(async () => {
      try {
        await updateWork(workId, { dueDate: date ?? null });
        toast.success(date ? "Due date set" : "Due date removed");
      } catch {
        toast.error("Failed to update due date");
      }
    });
  }

  if (readonly) {
    if (!current) return <span className="text-xs text-muted-foreground">No due date</span>;
    return (
      <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
        <CalendarIcon className="mr-1 size-3" />
        {format(current, "MMM d, yyyy")}
      </Badge>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          aria-label="Set due date"
          className={cn("gap-1.5 text-xs", isOverdue && "border-destructive text-destructive")}
        >
          <CalendarIcon className="size-3" />
          {current ? format(current, "MMM d, yyyy") : "Set due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={current}
          onSelect={handleSelect}
          initialFocus
          aria-label="Due date calendar"
        />
        {current && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => handleSelect(undefined)}
            >
              <XIcon className="mr-1 size-3" />
              Remove due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
