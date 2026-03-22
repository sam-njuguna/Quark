"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { setToolEnabled } from "@/actions/api-keys/tool-settings";
import { toast } from "sonner";

const MCP_TOOLS = [
  {
    name: "create_work",
    label: "Create Work",
    desc: "Create new work items",
    category: "write",
  },
  {
    name: "list_work",
    label: "List Work",
    desc: "List work items with filters",
    category: "read",
  },
  {
    name: "list_my_work",
    label: "List My Work",
    desc: "List work assigned to the agent",
    category: "read",
  },
  {
    name: "get_work",
    label: "Get Work",
    desc: "Get full details of a work item",
    category: "read",
  },
  {
    name: "update_work_stage",
    label: "Update Stage",
    desc: "Move a work item to any stage",
    category: "write",
  },
  {
    name: "start_work",
    label: "Start Work",
    desc: "Mark work as in_progress",
    category: "write",
  },
  {
    name: "submit_work",
    label: "Submit Work",
    desc: "Submit completed work for review",
    category: "write",
  },
  {
    name: "approve_work",
    label: "Approve Work",
    desc: "Approve and mark work as done",
    category: "write",
  },
  {
    name: "reject_work",
    label: "Reject Work",
    desc: "Reject and send back for revision",
    category: "write",
  },
  {
    name: "block_work",
    label: "Block Work",
    desc: "Mark work as blocked with reason",
    category: "write",
  },
  {
    name: "cancel_work",
    label: "Cancel Work",
    desc: "Cancel a work item",
    category: "write",
  },
  {
    name: "assign_work",
    label: "Assign Work",
    desc: "Assign work to a user",
    category: "write",
  },
  {
    name: "add_comment",
    label: "Add Comment",
    desc: "Add a comment to a work item",
    category: "write",
  },
  {
    name: "list_comments",
    label: "List Comments",
    desc: "List comments on a work item",
    category: "read",
  },
  {
    name: "get_my_pending_work",
    label: "Get Pending Work",
    desc: "Get triaged and in-progress work",
    category: "read",
  },
  {
    name: "get_my_review_queue",
    label: "Get Review Queue",
    desc: "Get work awaiting review",
    category: "read",
  },
];

interface McpToolTogglesProps {
  initialDisabled: string[];
  readOnly?: boolean;
  teamBlockedTools?: string[];
}

export function McpToolToggles({
  initialDisabled,
  readOnly = false,
  teamBlockedTools = [],
}: McpToolTogglesProps) {
  const [disabled, setDisabled] = useState<Set<string>>(
    new Set(initialDisabled),
  );
  const [, startTransition] = useTransition();

  const toggle = (toolName: string, enabled: boolean) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.delete(toolName);
      } else {
        next.add(toolName);
      }
      return next;
    });
    startTransition(async () => {
      try {
        await setToolEnabled(toolName, enabled);
      } catch (e) {
        setDisabled((prev) => {
          const next = new Set(prev);
          if (enabled) {
            next.add(toolName);
          } else {
            next.delete(toolName);
          }
          return next;
        });
        toast.error(e instanceof Error ? e.message : "Failed to update tool");
      }
    });
  };

  const readTools = MCP_TOOLS.filter((t) => t.category === "read");
  const writeTools = MCP_TOOLS.filter((t) => t.category === "write");

  const renderGroup = (
    label: string,
    tools: { name: string; label: string; desc: string; category: string }[],
  ) => (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-1">
        {tools.map((tool) => {
          const enabled = !disabled.has(tool.name);
          return (
            <div
              key={tool.name}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`tool-${tool.name}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {tool.label}
                  </Label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {tool.name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tool.desc}
                </p>
              </div>
              <Switch
                id={`tool-${tool.name}`}
                checked={enabled && !teamBlockedTools.includes(tool.name)}
                onCheckedChange={(v) =>
                  !readOnly &&
                  !teamBlockedTools.includes(tool.name) &&
                  toggle(tool.name, v)
                }
                disabled={readOnly || teamBlockedTools.includes(tool.name)}
                className="ml-4 shrink-0"
              />
              {teamBlockedTools.includes(tool.name) && (
                <Badge
                  variant="outline"
                  className="ml-2 text-[9px] px-1.5 border-amber-300 text-amber-600 dark:text-amber-400 shrink-0"
                >
                  team policy
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const enabledCount = MCP_TOOLS.length - disabled.size;

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Tool toggles are managed by your team admin. Contact an admin to
          change tool access.
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {enabledCount} of {MCP_TOOLS.length} tools enabled. Disabled tools will
        not be available to AI agents using your API key.
      </p>
      {renderGroup("Read operations", readTools)}
      {renderGroup("Write operations", writeTools)}
    </div>
  );
}
