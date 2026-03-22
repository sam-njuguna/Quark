"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createRecurringWork,
  deleteRecurringWork,
  toggleRecurringWork,
} from "@/actions/recurring";
import type { recurringWork } from "@/db/schema/recurring-work";
import { RepeatIcon, TrashIcon, CirclePlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type RecurringWork = typeof recurringWork.$inferSelect;

interface RecurringWorkManagerProps {
  teamId: string;
  initialItems: RecurringWork[];
}

const PATTERN_LABELS: Record<string, string> = {
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RecurringWorkManager({
  teamId,
  initialItems,
}: RecurringWorkManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const [pattern, setPattern] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState("task");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        const created = await createRecurringWork({
          teamId,
          pattern,
          templateTitle: title.trim(),
          templateType: workType,
          dayOfWeek: pattern === "weekly" ? dayOfWeek : undefined,
          dayOfMonth: pattern === "monthly" ? dayOfMonth : undefined,
        });
        setItems((prev) => [...prev, created]);
        setTitle("");
        setShowForm(false);
        toast.success("Recurring work created");
      } catch {
        toast.error("Failed to create recurring work");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteRecurringWork(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Recurring work deleted");
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleRecurringWork(id, !current);
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isActive: !current } : i)),
        );
      } catch {
        toast.error("Failed to update");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Recurring work is auto-created on the specified schedule. A background
          runner must be configured to execute these schedules.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={() => setShowForm((v) => !v)}
        >
          <CirclePlus className="size-3.5" />
          New
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">New recurring item</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title template</Label>
              <Input
                placeholder="Weekly team standup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Work type</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "task",
                    "meeting",
                    "research",
                    "code",
                    "document",
                    "communication",
                  ].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pattern</Label>
              <Select
                value={pattern}
                onValueChange={(v) =>
                  setPattern(v as "daily" | "weekly" | "monthly")
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pattern === "weekly" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Day of week</Label>
                <Select
                  value={String(dayOfWeek)}
                  onValueChange={(v) => setDayOfWeek(Number(v))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {pattern === "monthly" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Day of month</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleCreate}>
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <RepeatIcon className="size-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No recurring work yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create templates for work that repeats on a schedule.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <RepeatIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.templateTitle}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 capitalize"
                >
                  {item.templateType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {PATTERN_LABELS[item.pattern]}
                  {item.pattern === "weekly" &&
                    item.dayOfWeek != null &&
                    ` · ${DAY_NAMES[item.dayOfWeek]}`}
                  {item.pattern === "monthly" &&
                    item.dayOfMonth != null &&
                    ` · day ${item.dayOfMonth}`}
                </span>
                {item.nextRunAt && (
                  <span className="text-xs text-muted-foreground">
                    · next {format(new Date(item.nextRunAt), "MMM d")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={item.isActive}
                onCheckedChange={() => handleToggle(item.id, item.isActive)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(item.id)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
