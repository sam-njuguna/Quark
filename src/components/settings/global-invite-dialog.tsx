"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlusIcon, CirclePlus } from "lucide-react";
import { inviteMemberByEmail } from "@/actions/team/members";
import { toast } from "sonner";

interface ManageableTeam {
  id: string;
  name: string;
  role?: string | null;
}

interface GlobalInviteDialogProps {
  teams: ManageableTeam[];
  defaultTeamId?: string;
  onOpenCreateTeam?: () => void;
}

export function GlobalInviteDialog({
  teams,
  defaultTeamId,
  onOpenCreateTeam,
}: GlobalInviteDialogProps) {
  const manageableTeams = teams.filter((t) =>
    ["lead", "admin"].includes(t.role ?? ""),
  );

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "lead" | "admin">("member");
  const [teamId, setTeamId] = useState(
    defaultTeamId ?? manageableTeams[0]?.id ?? "",
  );
  const [, startTransition] = useTransition();

  const handleInvite = () => {
    if (!email.trim() || !teamId) return;
    startTransition(async () => {
      try {
        await inviteMemberByEmail(teamId, email.trim(), role);
        const teamName = manageableTeams.find((t) => t.id === teamId)?.name;
        toast.success(`Invitation sent to ${email}${teamName ? ` for ${teamName}` : ""}`);
        setEmail("");
        setRole("member");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send invitation");
      }
    });
  };

  if (manageableTeams.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <UserPlusIcon className="size-3.5" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation email. The recipient will join the team you select.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="gi-email">Email address</Label>
            <Input
              id="gi-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {manageableTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                  {onOpenCreateTeam && (
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        onOpenCreateTeam();
                      }}
                    >
                      <CirclePlus className="size-3.5" />
                      Create new team…
                    </button>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "member" | "lead" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!email.trim() || !teamId} className="gap-1.5">
            <UserPlusIcon className="size-3.5" />
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
