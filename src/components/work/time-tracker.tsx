"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  startTimer,
  stopTimer,
  addManualTimeEntry,
  getWorkTimeLogs,
  deleteTimeLog,
  getTotalTimeForWork,
} from "@/actions/time-tracking";
import { PlayIcon, SquareIcon, CirclePlus, Trash2Icon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TimeLog {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  note: string | null;
}

interface TimeTrackerProps {
  workId: string;
  initialLogs?: TimeLog[];
  initialTotal?: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function TimeTracker({ workId, initialLogs = [], initialTotal = 0 }: TimeTrackerProps) {
  const [logs, setLogs] = useState<TimeLog[]>(initialLogs);
  const [totalSeconds, setTotalSeconds] = useState(initialTotal);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ startedAt: "", endedAt: "", note: "" });
  const [timerNote, setTimerNote] = useState("");

  // Tick elapsed while timer is running
  useEffect(() => {
    if (!activeLogId) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [activeLogId]);

  function refreshData() {
    startTransition(async () => {
      const [newLogs, newTotal] = await Promise.all([
        getWorkTimeLogs(workId),
        getTotalTimeForWork(workId),
      ]);
      setLogs(newLogs as TimeLog[]);
      setTotalSeconds(newTotal);
    });
  }

  function handleStart() {
    startTransition(async () => {
      try {
        const log = await startTimer({ workId, note: timerNote || undefined });
        setActiveLogId(log.id);
        setElapsed(0);
        setTimerNote("");
        toast.success("Timer started");
      } catch {
        toast.error("Failed to start timer");
      }
    });
  }

  function handleStop() {
    if (!activeLogId) return;
    startTransition(async () => {
      try {
        await stopTimer({ logId: activeLogId });
        setActiveLogId(null);
        setElapsed(0);
        refreshData();
        toast.success("Timer stopped");
      } catch {
        toast.error("Failed to stop timer");
      }
    });
  }

  function handleManualAdd() {
    startTransition(async () => {
      try {
        await addManualTimeEntry({
          workId,
          startedAt: manualForm.startedAt,
          endedAt: manualForm.endedAt,
          note: manualForm.note || undefined,
        });
        setManualOpen(false);
        setManualForm({ startedAt: "", endedAt: "", note: "" });
        refreshData();
        toast.success("Time entry added");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add entry");
      }
    });
  }

  function handleDelete(logId: string) {
    startTransition(async () => {
      try {
        await deleteTimeLog(logId);
        refreshData();
        toast.success("Entry deleted");
      } catch {
        toast.error("Failed to delete entry");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <ClockIcon className="size-4" />
            Time Tracking
          </span>
          <Badge variant="secondary" className="text-xs font-mono">
            {formatDuration(totalSeconds + (activeLogId ? elapsed : 0))} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Timer controls */}
        <div className="flex gap-2">
          <Input
            placeholder="What are you working on?"
            value={timerNote}
            onChange={(e) => setTimerNote(e.target.value)}
            className="h-8 text-xs"
            disabled={!!activeLogId || isPending}
          />
          {activeLogId ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              disabled={isPending}
              className="shrink-0"
            >
              <SquareIcon className="size-3.5 mr-1" />
              {formatDuration(elapsed)}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStart}
              disabled={isPending}
              className="shrink-0"
            >
              <PlayIcon className="size-3.5 mr-1" />
              Start
            </Button>
          )}
        </div>

        {/* Manual entry */}
        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground">
              <CirclePlus className="size-3 mr-1" />
              Add manual entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add time entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Start</Label>
                <Input
                  type="datetime-local"
                  value={manualForm.startedAt}
                  onChange={(e) => setManualForm((f) => ({ ...f, startedAt: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input
                  type="datetime-local"
                  value={manualForm.endedAt}
                  onChange={(e) => setManualForm((f) => ({ ...f, endedAt: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Note (optional)</Label>
                <Textarea
                  placeholder="What did you work on?"
                  value={manualForm.note}
                  onChange={(e) => setManualForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleManualAdd}
                disabled={!manualForm.startedAt || !manualForm.endedAt || isPending}
                className="w-full"
              >
                Add entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Log list */}
        {logs.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded-md border px-2.5 py-1.5 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                    {log.durationSeconds != null
                      ? formatDuration(log.durationSeconds)
                      : "running…"}
                    <span className="text-[10px]">
                      {format(new Date(log.startedAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-muted-foreground truncate max-w-[200px]">{log.note}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(log.id)}
                  disabled={isPending}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
