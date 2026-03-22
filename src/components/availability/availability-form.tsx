"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setMyAvailability } from "@/actions/availability";
import { PresenceIndicator } from "./presence-indicator";
import { toast } from "sonner";
import type { WeeklySchedule } from "@/db/schema/availability";
import type { AvailabilityStatus } from "@/actions/availability";

const DAYS: { key: keyof WeeklySchedule; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

// Generate time options in 30-minute intervals
const TIME_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: 48 },
  (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    const value = `${hours.toString().padStart(2, "0")}:${minutes}`;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const label = `${displayHours}:${minutes} ${period}`;
    return { value, label };
  },
);

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "away", label: "Away" },
  { value: "dnd", label: "Do not disturb" },
  { value: "offline", label: "Offline" },
];

interface AvailabilityFormProps {
  initialStatus: AvailabilityStatus;
  initialNote: string | null;
  initialSchedule: WeeklySchedule;
  initialTimezone: string;
  initialShowAvailability: boolean;
}

export function AvailabilityForm({
  initialStatus,
  initialNote,
  initialSchedule,
  initialTimezone,
  initialShowAvailability,
}: AvailabilityFormProps) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<AvailabilityStatus>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [schedule, setSchedule] = useState<WeeklySchedule>(initialSchedule);
  const [timezone] = useState(initialTimezone);
  const [showAvailability, setShowAvailability] = useState(
    initialShowAvailability,
  );

  const updateDay = (
    day: keyof WeeklySchedule,
    field: "isAvailable" | "startTime" | "endTime",
    value: boolean | string,
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await setMyAvailability({
          status,
          statusNote: note.trim() || null,
          timezone,
          weeklySchedule: schedule,
          showAvailability,
        });
        toast.success("Availability updated");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to save availability",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Current Status
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                status === opt.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <PresenceIndicator status={opt.value} size="sm" />
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Input
            placeholder="Status note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-8 text-xs max-w-xs"
          />
        </div>
      </div>

      <Separator />

      {/* Visibility toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            Show my availability to teammates
          </p>
          <p className="text-xs text-muted-foreground">
            Let team members see your current status and schedule
          </p>
        </div>
        <Switch
          checked={showAvailability}
          onCheckedChange={setShowAvailability}
        />
      </div>

      <Separator />

      {/* Weekly schedule */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Weekly Schedule
        </Label>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="w-10 text-xs text-muted-foreground font-medium">
                  {label}
                </div>
                <Switch
                  checked={day.isAvailable}
                  onCheckedChange={(v) => updateDay(key, "isAvailable", v)}
                  className="scale-90"
                />
                {day.isAvailable ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={day.startTime}
                      onValueChange={(v) => updateDay(key, "startTime", v)}
                    >
                      <SelectTrigger size="sm" className="w-24 h-7">
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">–</span>
                    <Select
                      value={day.endTime}
                      onValueChange={(v) => updateDay(key, "endTime", v)}
                    >
                      <SelectTrigger size="sm" className="w-24 h-7">
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/50">
                    Not available
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={pending} size="sm">
          {pending ? "Saving…" : "Save Availability"}
        </Button>
      </div>
    </div>
  );
}
