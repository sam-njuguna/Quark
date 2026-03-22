"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  UserPlusIcon,
  MoreHorizontalIcon,
  TrashIcon,
  ShieldIcon,
  CrownIcon,
  UsersIcon,
  MailIcon,
  XIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  inviteMemberByEmail,
  updateMemberRoleAction,
  removeMemberAction,
  bulkRemoveMembers,
  cancelInvitation,
} from "@/actions/team/members";

interface Member {
  id: string;
  role: "member" | "lead" | "admin";
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  inviter: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface TeamMembersManagerProps {
  teamId: string;
  teamName: string;
  members: Member[];
  invitations?: Invitation[];
  currentUserId: string;
  currentUserRole: "member" | "lead" | "admin";
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <CrownIcon className="size-3.5 text-amber-500" />,
  lead: <ShieldIcon className="size-3.5 text-blue-500" />,
  member: <UsersIcon className="size-3.5 text-muted-foreground" />,
};

const roleOrder = { admin: 0, lead: 1, member: 2 };

export function TeamMembersManager({
  teamId,
  teamName,
  members: initialMembers,
  invitations: initialInvitations = [],
  currentUserId,
  currentUserRole,
}: TeamMembersManagerProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "lead" | "admin">(
    "member",
  );
  const [, startTransition] = useTransition();

  const canManage = currentUserRole === "lead" || currentUserRole === "admin";

  const sorted = [...members].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role],
  );

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
    const removable = sorted.filter((m) => m.user.id !== currentUserId);
    if (selected.size === removable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(removable.map((m) => m.id)));
    }
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    startTransition(async () => {
      try {
        await inviteMemberByEmail(teamId, inviteEmail.trim(), inviteRole);
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        setInviteOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to invite");
      }
    });
  };

  const handleRevokeInvite = (invitationId: string) => {
    startTransition(async () => {
      try {
        await cancelInvitation(invitationId);
        setInvitations((prev) =>
          prev.filter((i) => i.id !== invitationId),
        );
        toast.success("Invitation revoked");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to revoke");
      }
    });
  };

  const handleRoleChange = (
    memberId: string,
    role: "member" | "lead" | "admin",
  ) => {
    startTransition(async () => {
      try {
        await updateMemberRoleAction(teamId, memberId, role);
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
        );
        toast.success("Role updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  };

  const handleRemove = (memberId: string) => {
    startTransition(async () => {
      try {
        await removeMemberAction(teamId, memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
        toast.success("Member removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove");
      }
    });
  };

  const handleBulkRemove = () => {
    const ids = Array.from(selected);
    startTransition(async () => {
      try {
        await bulkRemoveMembers(teamId, ids);
        setMembers((prev) => prev.filter((m) => !ids.includes(m.id)));
        setSelected(new Set());
        toast.success(
          `${ids.length} member${ids.length !== 1 ? "s" : ""} removed`,
        );
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to remove members",
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {canManage && (
            <Checkbox
              checked={
                selected.size > 0 &&
                selected.size ===
                  sorted.filter((m) => m.user.id !== currentUserId).length
              }
              onCheckedChange={toggleAll}
              aria-label="Select all"
            />
          )}
          <span className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && canManage && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <TrashIcon className="size-3.5" />
                  Remove {selected.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remove {selected.size} member
                    {selected.size !== 1 ? "s" : ""}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    They will lose access to {teamName} immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkRemove}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <UserPlusIcon className="size-3.5" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite to {teamName}</DialogTitle>
                  <DialogDescription>
                    Send an invitation email. They&apos;ll be able to join after
                    accepting.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Email address</Label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) =>
                        setInviteRole(v as typeof inviteRole)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          Member — can view and work on items
                        </SelectItem>
                        <SelectItem value="lead">
                          Lead — can manage work and members
                        </SelectItem>
                        <SelectItem value="admin">
                          Admin — full team control
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                    Send invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Separator />

      {/* Member list */}
      <div className="space-y-1">
        {sorted.map((m) => {
          const isSelf = m.user.id === currentUserId;
          const isChecked = selected.has(m.id);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isChecked ? "bg-muted" : "hover:bg-muted/40"}`}
            >
              {canManage && !isSelf && (
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleSelect(m.id)}
                  aria-label={`Select ${m.user.name}`}
                />
              )}
              {(isSelf || !canManage) && <div className="w-4" />}
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={m.user.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {m.user.name?.slice(0, 2).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.user.name ?? m.user.email}
                  {isSelf && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {m.user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canManage && !isSelf ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      handleRoleChange(m.id, v as typeof m.role)
                    }
                  >
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <span className="flex items-center gap-1.5">
                          {roleIcons.member} Member
                        </span>
                      </SelectItem>
                      <SelectItem value="lead">
                        <span className="flex items-center gap-1.5">
                          {roleIcons.lead} Lead
                        </span>
                      </SelectItem>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-1.5">
                          {roleIcons.admin} Admin
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="capitalize text-xs gap-1">
                    {roleIcons[m.role]}
                    {m.role}
                  </Badge>
                )}
                {canManage && !isSelf && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontalIcon className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <TrashIcon className="mr-2 size-3.5" />
                            Remove from team
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove {m.user.name ?? m.user.email}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              They will lose access to {teamName} immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(m.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Invitations */}
      {canManage && invitations.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">
                {invitations.length} pending invitation
                {invitations.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <MailIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {inv.inviter?.name ?? inv.inviter?.email ?? "Unknown"} invited
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="capitalize text-xs gap-1 shrink-0"
                  >
                    {roleIcons[inv.role] ?? roleIcons.member}
                    {inv.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => handleRevokeInvite(inv.id)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Permissions legend */}
      <Separator />
      <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Permissions
        </p>
        <div className="grid gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {roleIcons.member}
            <span>
              <strong className="text-foreground">Member</strong> — view and
              work on assigned items, submit for review
            </span>
          </div>
          <div className="flex items-center gap-2">
            {roleIcons.lead}
            <span>
              <strong className="text-foreground">Lead</strong> — all member
              permissions + invite members, change roles, manage work
            </span>
          </div>
          <div className="flex items-center gap-2">
            {roleIcons.admin}
            <span>
              <strong className="text-foreground">Admin</strong> — all lead
              permissions + team settings, webhooks, billing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
