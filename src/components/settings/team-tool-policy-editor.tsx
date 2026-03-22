"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon } from "lucide-react";
import { setTeamToolPolicy } from "@/actions/api-keys/tool-policy";
import { toast } from "sonner";

const MCP_TOOLS = [
  { name: "create_work", label: "Create Work", category: "write" },
  { name: "list_work", label: "List Work", category: "read" },
  { name: "list_my_work", label: "List My Work", category: "read" },
  { name: "get_work", label: "Get Work", category: "read" },
  { name: "update_work_stage", label: "Update Stage", category: "write" },
  { name: "start_work", label: "Start Work", category: "write" },
  { name: "submit_work", label: "Submit Work", category: "write" },
  { name: "approve_work", label: "Approve Work", category: "write" },
  { name: "reject_work", label: "Reject Work", category: "write" },
  { name: "block_work", label: "Block Work", category: "write" },
  { name: "cancel_work", label: "Cancel Work", category: "write" },
  { name: "assign_work", label: "Assign Work", category: "write" },
  { name: "add_comment", label: "Add Comment", category: "write" },
  { name: "list_comments", label: "List Comments", category: "read" },
  { name: "get_my_pending_work", label: "Get Pending Work", category: "read" },
  { name: "get_my_review_queue", label: "Get Review Queue", category: "read" },
];

interface TeamToolPolicyEditorProps {
  teamId: string;
  teamName: string;
  initialBlockedTools: string[];
}

export function TeamToolPolicyEditor({
  teamId,
  teamName,
  initialBlockedTools,
}: TeamToolPolicyEditorProps) {
  const [blocked, setBlocked] = useState<Set<string>>(
    new Set(initialBlockedTools),
  );
  const [, startTransition] = useTransition();

  const toggleBlock = (toolName: string, allowed: boolean) => {
    const next = new Set(blocked);
    if (allowed) {
      next.delete(toolName);
    } else {
      next.add(toolName);
    }
    setBlocked(next);
    startTransition(async () => {
      try {
        await setTeamToolPolicy(teamId, Array.from(next));
        toast.success(`Tool policy updated for ${teamName}`);
      } catch (e) {
        setBlocked(blocked);
        toast.error(e instanceof Error ? e.message : "Failed to update policy");
      }
    });
  };

  const readTools = MCP_TOOLS.filter((t) => t.category === "read");
  const writeTools = MCP_TOOLS.filter((t) => t.category === "write");
  const blockedCount = blocked.size;

  const renderGroup = (
    label: string,
    tools: { name: string; label: string; category: string }[],
  ) => (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-1">
        {tools.map((tool) => {
          const allowed = !blocked.has(tool.name);
          return (
            <div
              key={tool.name}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`policy-${tool.name}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {tool.label}
                  </Label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {tool.name}
                  </Badge>
                </div>
              </div>
              <Switch
                id={`policy-${tool.name}`}
                checked={allowed}
                onCheckedChange={(v) => toggleBlock(tool.name, v)}
                className="ml-4 shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-3.5 text-violet-500" />
        <span>
          {blockedCount === 0
            ? "All tools allowed for this team"
            : `${blockedCount} tool${blockedCount !== 1 ? "s" : ""} blocked for this team`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Blocked tools cannot be enabled by any member of <strong>{teamName}</strong>, regardless of their personal settings.
      </p>
      {renderGroup("Read operations", readTools)}
      {renderGroup("Write operations", writeTools)}
    </div>
  );
}
