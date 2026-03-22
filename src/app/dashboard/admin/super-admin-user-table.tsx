"use client";

import { useState, useTransition, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, ShieldOffIcon } from "lucide-react";
import { setUserSystemRole, listAllUsers } from "@/actions/admin/users";
import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  systemRole: string;
  createdAt: Date;
};

export function SuperAdminUserTable({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listAllUsers().then(setUsers).catch(console.error);
  }, []);

  const handleToggleRole = (user: UserRow) => {
    const newRole = user.systemRole === "super_admin" ? "user" : "super_admin";
    startTransition(async () => {
      try {
        await setUserSystemRole(user.id, newRole);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, systemRole: newRole } : u)),
        );
        toast.success(
          newRole === "super_admin"
            ? `${user.name} promoted to super admin`
            : `${user.name} demoted to user`,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  };

  if (!users.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-xs text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border divide-y">
      {users.map((user) => {
        const isSelf = user.id === currentUserId;
        const isSuperAdmin = user.systemRole === "super_admin";
        const initials = user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={user.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <Avatar className="size-8 rounded-md shrink-0">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="rounded-md text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{user.name}</p>
                {isSuperAdmin && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 border-violet-300 text-violet-600 dark:text-violet-400"
                  >
                    super_admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            {!isSelf && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1.5 text-xs"
                disabled={isPending}
                onClick={() => handleToggleRole(user)}
              >
                {isSuperAdmin ? (
                  <>
                    <ShieldOffIcon className="size-3.5 text-muted-foreground" />
                    Demote
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="size-3.5 text-violet-500" />
                    Promote
                  </>
                )}
              </Button>
            )}
            {isSelf && (
              <span className="text-xs text-muted-foreground shrink-0">You</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
