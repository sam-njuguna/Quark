"use client";

import { useState, useTransition } from "react";
import {
  listAutomations,
  createAutomation,
  deleteAutomation,
  toggleAutomation,
} from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2Icon, ZapIcon } from "lucide-react";
import { toast } from "sonner";

type Automation = Awaited<ReturnType<typeof listAutomations>>[number];

const STAGES = ["new", "triaged", "in_progress", "awaiting_review", "revision", "blocked", "done", "cancelled"];
const ACTIONS = [
  { value: "notify_team", label: "Notify team" },
  { value: "trigger_webhook", label: "Trigger webhook" },
  { value: "auto_assign", label: "Auto-assign to lead" },
];

interface Props {
  teamId: string;
  initial: Automation[];
}

export function StageAutomationsManager({ teamId, initial }: Props) {
  const [automations, setAutomations] = useState<Automation[]>(initial);
  const [name, setName] = useState("");
  const [triggerStage, setTriggerStage] = useState("awaiting_review");
  const [action, setAction] = useState("notify_team");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const created = await createAutomation(teamId, { name: name.trim(), triggerStage, action });
        setAutomations((prev) => [...prev, created]);
        setName("");
        toast.success("Automation created");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteAutomation(id);
        setAutomations((prev) => prev.filter((a) => a.id !== id));
        toast.success("Automation deleted");
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleAutomation(id, isActive);
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Automation name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:col-span-1"
          disabled={isPending}
        />
        <Select value={triggerStage} onValueChange={setTriggerStage}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} disabled={isPending || !name.trim()} className="gap-2">
          <ZapIcon className="size-3.5" /> Add
        </Button>
      </div>

      {automations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No automations yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {automations.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <Switch
                checked={a.isActive}
                onCheckedChange={(v) => handleToggle(a.id, v)}
                disabled={isPending}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  When stage → <Badge variant="secondary" className="text-[10px] px-1">{a.triggerStage.replace(/_/g, " ")}</Badge>{" "}
                  then <span className="font-medium">{ACTIONS.find((x) => x.value === a.action)?.label ?? a.action}</span>
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive"
                onClick={() => handleDelete(a.id)}
                disabled={isPending}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
