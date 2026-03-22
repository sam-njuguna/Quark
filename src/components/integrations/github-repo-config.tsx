"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setGithubRepo } from "@/actions/integrations";
import { toast } from "sonner";
import { GitBranchIcon, CheckIcon, Loader2Icon, PencilIcon } from "lucide-react";

interface GitHubRepoConfigProps {
  integrationId: string;
  currentRepo?: string | null;
  webhookUrl: string;
}

export function GitHubRepoConfig({
  integrationId,
  currentRepo,
  webhookUrl,
}: GitHubRepoConfigProps) {
  const [editing, setEditing] = useState(!currentRepo);
  const [value, setValue] = useState(currentRepo ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await setGithubRepo(integrationId, trimmed);
        toast.success("Repository linked");
        setEditing(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  return (
    <div className="border-t pt-3 mt-1 space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
        <GitBranchIcon className="size-3" />
        Repository
      </p>

      {!editing && currentRepo ? (
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {currentRepo}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="size-3" />
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              placeholder="owner/repo  or  https://github.com/owner/repo"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-xs font-mono"
              disabled={isPending}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button
              size="sm"
              className="h-8 gap-1 px-2.5 text-xs shrink-0"
              onClick={handleSave}
              disabled={isPending || !value.trim()}
            >
              {isPending ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <CheckIcon className="size-3" />
              )}
              Save
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            e.g. <span className="font-mono">Nvision-Group-LLC/quark</span>
          </p>
        </div>
      )}

      {currentRepo && (
        <div className="rounded-md bg-muted/40 border px-3 py-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Webhook URL — paste into GitHub repo settings
          </p>
          <code className="text-[11px] font-mono text-muted-foreground break-all select-all">
            {webhookUrl}
          </code>
          <p className="text-[11px] text-muted-foreground/50 pt-0.5">
            Go to <strong>repo → Settings → Webhooks → Add webhook</strong>. Set
            Content-Type: <code>application/json</code>. Select events: Pull
            requests, Pushes.
          </p>
        </div>
      )}
    </div>
  );
}
