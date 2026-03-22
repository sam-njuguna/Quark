"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  CirclePlus,
  MoreHorizontalIcon,
  PlayIcon,
  CheckCircleIcon,
  TrashIcon,
  CalendarIcon,
  TargetIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SprintBurndownChart } from "./sprint-burndown-chart";

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  goal?: string | null;
}

interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface SprintManagerProps {
  sprints: Sprint[];
  teamId: string;
  burndownData?: BurndownPoint[];
  burndownTotal?: number;
  canManage?: boolean;
}

export function SprintManager({
  sprints,
  teamId,
  burndownData = [],
  burndownTotal = 0,
  canManage = false,
}: SprintManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [newSprint, setNewSprint] = useState<{
    name: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    goal: string;
  }>({
    name: "",
    startDate: undefined,
    endDate: undefined,
    goal: "",
  });

  const activeSprint = sprints.find((s) => s.status === "active");
  const planningSprints = sprints.filter((s) => s.status === "planning");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/sprints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newSprint.name,
            goal: newSprint.goal,
            teamId,
            startDate: newSprint.startDate,
            endDate: newSprint.endDate,
          }),
        });

        if (!res.ok) throw new Error("Failed to create sprint");

        toast.success("Sprint created");
        setShowCreate(false);
        setNewSprint({
          name: "",
          startDate: undefined,
          endDate: undefined,
          goal: "",
        });
        router.refresh();
      } catch {
        toast.error("Failed to create sprint");
      }
    });
  };

  const handleStartSprint = async (sprintId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sprints/${sprintId}/start`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to start sprint");
        toast.success("Sprint started");
        router.refresh();
      } catch {
        toast.error("Failed to start sprint");
      }
    });
  };

  const handleCompleteSprint = async (sprintId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sprints/${sprintId}/complete`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to complete sprint");
        toast.success("Sprint completed");
        router.refresh();
      } catch {
        toast.error("Failed to complete sprint");
      }
    });
  };

  const handleDeleteSprint = async (sprintId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sprints/${sprintId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete sprint");
        toast.success("Sprint deleted");
        router.refresh();
      } catch {
        toast.error("Failed to delete sprint");
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sprints</h2>
          <p className="text-sm text-muted-foreground">
            Plan and track work in time-boxed iterations
          </p>
        </div>
        {canManage && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <CirclePlus className="mr-2 size-4" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Define your sprint duration and goals
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-name">Sprint Name *</Label>
                <Input
                  id="sprint-name"
                  placeholder="e.g., Sprint 1, Q1 Week 1"
                  value={newSprint.name}
                  onChange={(e) =>
                    setNewSprint({ ...newSprint, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-xs h-9",
                          !newSprint.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-3.5" />
                        {newSprint.startDate
                          ? format(newSprint.startDate, "MMM d, yyyy")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSprint.startDate}
                        onSelect={(date) =>
                          setNewSprint({ ...newSprint, startDate: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-xs h-9",
                          !newSprint.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-3.5" />
                        {newSprint.endDate
                          ? format(newSprint.endDate, "MMM d, yyyy")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSprint.endDate}
                        onSelect={(date) =>
                          setNewSprint({ ...newSprint, endDate: date })
                        }
                        disabled={(date) =>
                          newSprint.startDate ? date < newSprint.startDate : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-goal">Sprint Goal</Label>
                <Textarea
                  id="sprint-goal"
                  placeholder="What do you want to achieve this sprint?"
                  rows={3}
                  value={newSprint.goal}
                  onChange={(e) =>
                    setNewSprint({ ...newSprint, goal: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint} disabled={isPending}>
                {isPending ? "Creating..." : "Create Sprint"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{activeSprint.name}</CardTitle>
                <Badge variant="default">Active</Badge>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteSprint(activeSprint.id)}
                    disabled={isPending}
                  >
                    <CheckCircleIcon className="mr-2 size-4" />
                    Complete
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteSprint(activeSprint.id)}
                        className="text-destructive"
                      >
                        <TrashIcon className="mr-2 size-4" />
                        Delete Sprint
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            <CardDescription>
              {formatDate(activeSprint.startDate)} -{" "}
              {formatDate(activeSprint.endDate)}
              {activeSprint.goal && ` • ${activeSprint.goal}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SprintBurndownChart
              data={burndownData}
              totalItems={burndownTotal}
            />
          </CardContent>
        </Card>
      )}

      {/* Planning Sprints */}
      {planningSprints.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Planning
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planningSprints.map((sprint) => (
              <Card key={sprint.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{sprint.name}</CardTitle>
                    <Badge variant="secondary">Planning</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    {formatDate(sprint.startDate)} -{" "}
                    {formatDate(sprint.endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sprint.goal && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {sprint.goal}
                    </p>
                  )}
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStartSprint(sprint.id)}
                        disabled={isPending || !!activeSprint}
                      >
                        <PlayIcon className="mr-1 size-3" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSprint(sprint.id)}
                        disabled={isPending}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Completed
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedSprints.slice(0, 6).map((sprint) => (
              <Card key={sprint.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{sprint.name}</CardTitle>
                    <Badge variant="outline">Done</Badge>
                  </div>
                  <CardDescription>
                    {formatDate(sprint.startDate)} -{" "}
                    {formatDate(sprint.endDate)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sprints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TargetIcon className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No sprints yet. Create your first sprint to get started.
          </p>
        </div>
      )}
    </div>
  );
}
