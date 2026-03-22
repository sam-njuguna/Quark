"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { createWebhook, deleteWebhook, toggleWebhook } from "@/actions/webhooks";
import type { webhook } from "@/db/schema/webhooks";
import { WebhookIcon, TrashIcon, CopyIcon, CheckIcon, CirclePlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Webhook = typeof webhook.$inferSelect;

interface WebhooksManagerProps {
  teamId: string;
  initialWebhooks: Webhook[];
}

const EVENT_LIST = [
  "work.created", "work.stage_changed", "work.assigned",
  "work.completed", "work.blocked", "work.cancelled",
];

export function WebhooksManager({ teamId, initialWebhooks }: WebhooksManagerProps) {
  const [hooks, setHooks] = useState(initialWebhooks);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleAdd = () => {
    if (!url.trim() || !url.startsWith("http")) {
      toast.error("Please enter a valid URL starting with http(s)://");
      return;
    }
    startTransition(async () => {
      try {
        const created = await createWebhook(teamId, url.trim());
        setHooks((prev) => [...prev, created]);
        setUrl("");
        toast.success("Webhook registered");
      } catch {
        toast.error("Failed to register webhook");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteWebhook(id);
        setHooks((prev) => prev.filter((h) => h.id !== id));
        toast.success("Webhook removed");
      } catch {
        toast.error("Failed to remove webhook");
      }
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleWebhook(id, !current);
        setHooks((prev) =>
          prev.map((h) => (h.id === id ? { ...h, isActive: !current } : h)),
        );
      } catch {
        toast.error("Failed to update webhook");
      }
    });
  };

  const copySecret = (secret: string | null, id: string) => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Secret copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
        <p className="text-sm font-medium">Listening for events</p>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_LIST.map((e) => (
            <Badge key={e} variant="outline" className="font-mono text-xs">
              {e}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Register endpoint</p>
        <div className="flex gap-2">
          <Input
            placeholder="https://your-server.com/webhooks/quark"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} className="gap-1.5">
            <CirclePlus className="size-3.5" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Quark will POST a signed JSON payload to this URL on every matching event.
        </p>
      </div>

      <Separator />

      {hooks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <WebhookIcon className="size-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No webhooks registered</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add an endpoint above to start receiving events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((h) => (
            <div key={h.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-mono text-sm truncate">{h.url}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`size-1.5 rounded-full inline-block ${
                        h.isActive ? "bg-emerald-500" : "bg-zinc-400"
                      }`}
                    />
                    {h.isActive ? "Active" : "Paused"}
                    {h.lastTriggeredAt && (
                      <>
                        <span>·</span>
                        <span>
                          Last fired{" "}
                          {format(new Date(h.lastTriggeredAt), "MMM d, HH:mm")}
                        </span>
                        {h.lastStatusCode && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1 ${
                              h.lastStatusCode.startsWith("2")
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {h.lastStatusCode}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={h.isActive}
                    onCheckedChange={() => handleToggle(h.id, h.isActive)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(h.id)}
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
              {h.secret && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                  <p className="font-mono text-xs text-muted-foreground flex-1 truncate">
                    {h.secret}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0"
                    onClick={() => copySecret(h.secret, h.id)}
                  >
                    {copied === h.id ? (
                      <CheckIcon className="size-3 text-emerald-500" />
                    ) : (
                      <CopyIcon className="size-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
