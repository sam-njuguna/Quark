"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PencilIcon,
  Trash2Icon,
  CirclePlus,
  ShieldAlertIcon,
} from "lucide-react";
import { updateTeam, deleteTeam, bulkDeleteTeams } from "@/actions/team/delete";
import { createTeam } from "@/actions/team/members";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string | null;
  memberCount?: number;
}

interface TeamManagementPanelProps {
  teams: Team[];
  isSuperAdmin?: boolean;
}

function EditTeamDialog({
  team,
  open,
  onOpenChange,
}: {
  team: Team;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(team.name);
  const [desc, setDesc] = useState(team.description ?? "");

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateTeam(team.id, {
          name: name.trim(),
          description: desc.trim() || null,
        });
        toast.success("Team updated");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update team");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>
            Update the team name or description.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [names, setNames] = useState(""); // one team per line

  const handleCreate = () => {
    const teamNames = names
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (teamNames.length === 0) return;
    startTransition(async () => {
      try {
        for (const name of teamNames) {
          await createTeam(name);
        }
        toast.success(
          teamNames.length === 1
            ? `Team "${teamNames[0]}" created`
            : `${teamNames.length} teams created`,
        );
        setNames("");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create team");
      }
    });
  };

  const count = names
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create teams</DialogTitle>
          <DialogDescription>
            Enter one team name per line to create multiple teams at once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label>Team names</Label>
          <Textarea
            placeholder={"Engineering\nDesign\nMarketing"}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            rows={5}
            className="resize-none font-mono text-sm"
            autoFocus
          />
          {count > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {count} team{count !== 1 ? "s" : ""} will be created
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={count === 0 || pending}
            className="gap-1.5"
          >
            <CirclePlus className="size-3.5" />
            {pending
              ? "Creating…"
              : `Create ${count > 1 ? `${count} teams` : "team"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamManagementPanel({
  teams,
  isSuperAdmin = false,
}: TeamManagementPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      selected.size === teams.length
        ? new Set()
        : new Set(teams.map((t) => t.id)),
    );
  };

  const handleDelete = (teamId: string) => {
    startTransition(async () => {
      try {
        await deleteTeam(teamId);
        toast.success("Team deleted");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      }
    });
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        await bulkDeleteTeams(Array.from(selected));
        toast.success(`${selected.size} teams deleted`);
        setSelected(new Set());
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to bulk delete");
      }
    });
    setBulkDeleteOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            Team Management
          </span>
          {isSuperAdmin && (
            <Badge variant="outline" className="text-[10px]">
              Super Admin
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && isSuperAdmin && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2Icon className="size-3" />
              Delete {selected.size}
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <CirclePlus className="size-3" />
            New team
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {isSuperAdmin && (
                <th className="w-10 px-3 py-2">
                  <Checkbox
                    checked={selected.size === teams.length && teams.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                Description
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 4 : 3}
                  className="px-3 py-8 text-center text-xs text-muted-foreground"
                >
                  No teams yet
                </td>
              </tr>
            ) : (
              teams.map((t) => (
                <tr
                  key={t.id}
                  className={cn(
                    "border-b last:border-b-0 hover:bg-muted/20 transition-colors",
                    selected.has(t.id) && "bg-primary/5",
                  )}
                >
                  {isSuperAdmin && (
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-xs">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                    {t.description || (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setEditTeam(t)}
                      >
                        <PencilIcon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(t.id)}
                        disabled={pending}
                      >
                        <Trash2Icon className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editTeam && (
        <EditTeamDialog
          team={editTeam}
          open={!!editTeam}
          onOpenChange={(v) => {
            if (!v) setEditTeam(null);
          }}
        />
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team and all its data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} teams?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected teams and their data.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete {selected.size} teams
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
