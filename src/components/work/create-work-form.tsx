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
import { listAgents } from "@/actions/agents";
import { AISuggestions } from "./ai-suggestions";
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
    title: "Review PR #",
    description: "Code review for pull request - check for bugs, quality, and standards",
  },
  {
    id: "research",
    label: "Research",
    title: "Research: ",
    description: "Research and summarise findings, include sources and recommendations",
  },
  {
    id: "draft_email",
    label: "Draft Email",
    title: "Draft: ",
    description: "Write a professional email draft",
  },
  {
    id: "meeting_notes",
    label: "Meeting Notes",
    title: "Meeting Notes: ",
    description: "Capture and distribute meeting notes with action items",
  },
  {
    id: "write_docs",
    label: "Write Docs",
    title: "Document: ",
    description: "Write technical documentation",
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
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [meetingTime, setMeetingTime] = useState("09:00");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubRepos, setGithubRepos] = useState<
    { full_name: string; name: string }[]
  >([]);
  const [selectedTeamId, setSelectedTeamId] = useState(
    teamId ?? defaultTeamId ?? "",
  );
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [availableAgents, setAvailableAgents] = useState<
    { id: string; name: string; agentType: string }[]
  >([]);
  const [customInstructions, setCustomInstructions] = useState("");

  useEffect(() => {
    if (!selectedTeamId) {
      setAvailableAgents([]);
      return;
    }
    listAgents(selectedTeamId)
      .then((agents) => {
        setAvailableAgents(agents.filter((a: any) => a.isActive));
      })
      .catch(() => {
        setAvailableAgents([]);
      });
  }, [selectedTeamId]);

  const isMeeting = false;
  const isCode = title.toLowerCase().includes("code") || 
                  title.toLowerCase().includes("fix") || 
                  title.toLowerCase().includes("implement") ||
                  title.toLowerCase().includes("build");

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
    setTitle(tpl.title);
    setDescription(tpl.description);
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
          description: description.trim() || undefined,
          dueDate: effectiveDueDate?.toISOString(),
          meetingUrl: isMeeting ? meetingUrl.trim() || undefined : undefined,
          githubRepo: isCode ? githubRepo || undefined : undefined,
          teamId: selectedTeamId || teamId || undefined,
          aiAgentId: selectedAgentId || undefined,
          aiCustomInstructions: selectedAgentId && customInstructions.trim() ? customInstructions.trim() : undefined,
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
        {title.length > 3 && <AISuggestions title={title} description={description} />}
      </div>

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
                onValueChange={(v) => {
                  setSelectedTeamId(v);
                  setSelectedAgentId("");
                }}
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
          
          {availableAgents.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="agent"
                className="text-xs font-medium text-muted-foreground"
              >
                AI Agent (optional)
              </Label>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any available agent" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No AI agents available
                    </div>
                  ) : (
                    availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {selectedAgentId && (
                <div className="space-y-2">
                  <Label
                    htmlFor="customInstructions"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Custom Instructions for AI
                  </Label>
                  <textarea
                    id="customInstructions"
                    placeholder="Describe rules/instructions the AI should follow (e.g., 'Use simple language', 'Include code examples', 'Focus on actionable steps')"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    disabled={isPending}
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
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
