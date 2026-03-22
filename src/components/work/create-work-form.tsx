"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/editor/rich-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createWork } from "@/actions/work/create";
import { listGithubRepos } from "@/actions/integrations/github";
import { format } from "date-fns";
import {
  CalendarIcon,
  CirclePlus,
  XIcon,
  Loader2Icon,
  ZapIcon,
  VideoIcon,
  ClockIcon,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "pr_review",
    label: "PR Review",
    type: "code" as const,
    title: "Review PR #",
    description: "Code review for pull request",
    instructions:
      "Review the pull request for code quality, bugs, and adherence to standards. Check logic, edge cases, and test coverage.",
    successCriteria: [
      "All comments addressed",
      "No critical bugs found",
      "Tests pass",
    ],
    priority: 1,
  },
  {
    id: "research",
    label: "Research Brief",
    type: "research" as const,
    title: "Research: ",
    description: "Research and summarise findings",
    instructions:
      "Research the topic thoroughly. Summarise key findings, trade-offs, and a recommended approach. Include sources.",
    successCriteria: [
      "Summary under 500 words",
      "At least 3 sources cited",
      "Recommendation included",
    ],
    priority: 2,
  },
  {
    id: "draft_email",
    label: "Draft Email",
    type: "communication" as const,
    title: "Draft: ",
    description: "Write and review email draft",
    instructions:
      "Draft a professional email. Keep it concise and clear. Include subject line, greeting, body, and call to action.",
    successCriteria: [
      "Under 200 words",
      "Clear call to action",
      "Professional tone",
    ],
    priority: 2,
  },
  {
    id: "meeting_notes",
    label: "Meeting Notes",
    type: "meeting" as const,
    title: "Meeting Notes: ",
    description: "Capture and distribute meeting notes",
    instructions:
      "Attend or review the meeting recording. Document attendees, agenda, decisions made, and action items with owners.",
    successCriteria: [
      "Action items listed with owners",
      "Decisions captured",
      "Shared with attendees",
    ],
    priority: 3,
  },
  {
    id: "write_docs",
    label: "Write Docs",
    type: "document" as const,
    title: "Document: ",
    description: "Write technical documentation",
    instructions:
      "Write clear, accurate documentation. Include overview, usage examples, parameters/options, and edge cases.",
    successCriteria: [
      "Examples included",
      "Reviewed for accuracy",
      "Published to docs site",
    ],
    priority: 2,
  },
];

const workTypes = [
  { value: "task", label: "Task", description: "General work item" },
  {
    value: "meeting",
    label: "Meeting",
    description: "Schedule or meeting notes",
  },
  {
    value: "research",
    label: "Research",
    description: "Research and analysis",
  },
  { value: "code", label: "Code", description: "Development work" },
  {
    value: "document",
    label: "Document",
    description: "Documentation or writing",
  },
  {
    value: "communication",
    label: "Communication",
    description: "Emails, messages",
  },
];

const priorities = [
  {
    value: 1,
    label: "P1 - High",
    description: "Urgent, needs immediate attention",
  },
  { value: 2, label: "P2 - Medium", description: "Important but not urgent" },
  { value: 3, label: "P3 - Low", description: "Can wait, nice to have" },
];

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  teamId: string;
}

interface AvailableTeam {
  id: string;
  name: string;
}

interface CreateWorkFormProps {
  teamId?: string;
  availableUsers?: AvailableUser[];
  availableTeams?: AvailableTeam[];
  onSuccess?: () => void;
  onCancel?: () => void;
  isPrivileged?: boolean;
  defaultTeamId?: string;
}

export function CreateWorkForm({
  teamId,
  availableUsers = [],
  availableTeams = [],
  onSuccess,
  onCancel,
  isPrivileged = false,
  defaultTeamId,
}: CreateWorkFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("task");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<number>(2);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [meetingTime, setMeetingTime] = useState("09:00");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubRepos, setGithubRepos] = useState<
    { full_name: string; name: string }[]
  >([]);
  const [successCriteria, setSuccessCriteria] = useState<string[]>([]);
  const [newCriteria, setNewCriteria] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(
    teamId ?? defaultTeamId ?? "",
  );

  const isMeeting = type === "meeting";
  const isCode = type === "code";

  useEffect(() => {
    if (!isCode || !selectedTeamId) return;
    let cancelled = false;
    listGithubRepos(selectedTeamId)
      .then((repos) => {
        if (cancelled) return;
        setGithubRepos(repos);
        if (repos.length === 1) setGithubRepo(repos[0].full_name);
      })
      .catch(() => {
        if (!cancelled) setGithubRepos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isCode, selectedTeamId]);

  const getMeetingDueDate = () => {
    if (!dueDate) return undefined;
    const [h, m] = meetingTime.split(":").map(Number);
    const d = new Date(dueDate);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const applyTemplate = (tpl: (typeof TEMPLATES)[number]) => {
    setType(tpl.type);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setInstructions(tpl.instructions);
    setPriority(tpl.priority);
    setSuccessCriteria(tpl.successCriteria);
  };

  const addCriteria = () => {
    if (newCriteria.trim()) {
      setSuccessCriteria([...successCriteria, newCriteria.trim()]);
      setNewCriteria("");
    }
  };

  const removeCriteria = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        const effectiveDueDate = isMeeting ? getMeetingDueDate() : dueDate;
        await createWork({
          title: title.trim(),
          type: type as
            | "task"
            | "meeting"
            | "research"
            | "code"
            | "document"
            | "communication",
          description: description.trim() || undefined,
          instructions: instructions.trim() || undefined,
          priority,
          dueDate: effectiveDueDate?.toISOString(),
          meetingUrl: isMeeting ? meetingUrl.trim() || undefined : undefined,
          githubRepo: isCode ? githubRepo || undefined : undefined,
          successCriteria:
            successCriteria.length > 0 ? successCriteria : undefined,
          teamId: selectedTeamId || teamId || undefined,
          assignedTo: assignedTo || undefined,
        });

        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create work");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ZapIcon className="size-4 text-primary" />
          <p className="text-sm font-medium">Quick templates</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl) => (
            <Button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl)}
              disabled={isPending}
              variant={"outline"}
              className="text-muted-foreground hover:text-primary border-dashed"
            >
              <span className="size-1.5 rounded-full bg-current opacity-50" />
              {tpl.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Title - Most prominent */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          What needs to be done?
        </Label>
        <Input
          id="title"
          placeholder="e.g., Review PR #123, Schedule team meeting, Write documentation..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          className="text-base "
          autoFocus
        />
      </div>

      {/* Type and Priority in a row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="type"
            className="text-xs font-medium text-muted-foreground"
          >
            Type
          </Label>
          <Select value={type} onValueChange={setType} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="priority"
            className="text-xs font-medium text-muted-foreground"
          >
            Priority
          </Label>
          <Select
            value={priority.toString()}
            onValueChange={(v) => setPriority(parseInt(v))}
            disabled={isPending}
          >
            <SelectTrigger value={priority.toString()} className=" w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((p) => (
                <SelectItem key={p.value} value={p.value.toString()}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        p.value === 1 && "bg-red-500",
                        p.value === 2 && "bg-amber-500",
                        p.value === 3 && "bg-muted-foreground",
                      )}
                    />
                    <span>{p.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team and Assignee */}
      {(availableUsers.length > 0 ||
        (isPrivileged && availableTeams.length > 0)) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {isPrivileged && availableTeams.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="team"
                className="text-xs font-medium text-muted-foreground"
              >
                Team
              </Label>
              <Select
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="assignee"
                className="text-xs font-medium text-muted-foreground"
              >
                Assign to
              </Label>
              <Select
                value={assignedTo}
                onValueChange={setAssignedTo}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Due Date */}
      <div className={cn("grid gap-4", isMeeting ? "sm:grid-cols-2" : "")}>
        <div className="space-y-2">
          <Label
            htmlFor="dueDate"
            className="text-xs font-medium text-muted-foreground"
          >
            {isMeeting ? "Meeting Date" : "Due Date"}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9",
                  !dueDate && "text-muted-foreground",
                )}
                disabled={isPending}
              >
                <CalendarIcon className=" size-3.5" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {isMeeting && (
          <div className="space-y-2">
            <Label
              htmlFor="meetingTime"
              className="text-xs font-medium text-muted-foreground"
            >
              Meeting Time
            </Label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                id="meetingTime"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="pl-9 "
                disabled={isPending}
              />
            </div>
          </div>
        )}
      </div>

      {/* Meeting URL */}
      {isMeeting && (
        <div className="space-y-2">
          <Label
            htmlFor="meetingUrl"
            className="text-xs font-medium text-muted-foreground"
          >
            Meeting Link
          </Label>
          <div className="relative">
            <VideoIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="meetingUrl"
              type="url"
              placeholder="https://meet.google.com/... or Zoom link"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="pl-9 h-9"
              disabled={isPending}
            />
          </div>
        </div>
      )}

      {/* GitHub for code tasks */}
      {isCode && (
        <div className="space-y-3 rounded- border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Github className="size-4" />
            <Label className="text-sm font-medium">GitHub Repository</Label>
          </div>
          {githubRepos.length > 0 ? (
            <Select
              value={githubRepo}
              onValueChange={setGithubRepo}
              disabled={isPending}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {githubRepos.map((r) => (
                  <SelectItem
                    key={r.full_name}
                    value={r.full_name}
                    className="font-mono text-xs"
                  >
                    {r.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selectedTeamId ? (
            <p className="text-xs text-muted-foreground">
              No GitHub integration connected for this team.
            </p>
          ) : null}
          {githubRepo && (
            <p className="text-xs text-muted-foreground">
              A GitHub issue will be created and linked to this work item.
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Description
        </Label>
        <RichEditor
          placeholder="Provide more context about this work..."
          onChange={(html) => setDescription(html)}
          disabled={isPending}
        />
      </div>

      {/* AI Instructions - Collapsible feel */}
      <details className="group  border">
        <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ZapIcon className="size-4 text-primary" />
            <span>AI Instructions</span>
            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>
          <svg
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
        <div className="border-t p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Instructions
            </Label>
            <RichEditor
              placeholder="e.g., Review the code changes, check for security issues, ensure tests pass..."
              onChange={(html) => setInstructions(html)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              These instructions will be shown to the AI agent working on this
              task.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Success Criteria
            </Label>
            <div className="space-y-2">
              {successCriteria.map((criteria, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2  bg-muted/50 border px-3 py-2 text-sm"
                >
                  <span className="flex-1">{criteria}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0"
                    onClick={() => removeCriteria(index)}
                    disabled={isPending}
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a success criterion..."
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCriteria();
                    }
                  }}
                  className=""
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={addCriteria}
                  disabled={isPending || !newCriteria.trim()}
                >
                  <CirclePlus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CirclePlus className="size-4" />
              Create Work
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
