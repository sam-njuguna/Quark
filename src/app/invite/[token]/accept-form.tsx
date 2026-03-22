"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CrownIcon,
  ShieldIcon,
  UsersIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { acceptInvitationWithSession } from "@/actions/team/members";

interface Invitation {
  id: string;
  email: string;
  role: string;
  team: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AcceptInvitationFormProps {
  invitation: Invitation;
  inviteToken: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <CrownIcon className="size-4 text-amber-500" />,
  lead: <ShieldIcon className="size-4 text-blue-500" />,
  member: <UsersIcon className="size-4 text-muted-foreground" />,
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  lead: "Lead",
  member: "Member",
};

export function AcceptInvitationForm({
  invitation,
  inviteToken,
}: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);

    try {
      await acceptInvitationWithSession(inviteToken);
      toast.success("Welcome to the team!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept invitation",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm select-none"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          Q
        </div>
        <span
          className="text-base font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          Quark
        </span>
      </div>

      <div>
        <h1
          className="text-2xl font-semibold tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          You&apos;re Invited
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review the invitation details below.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-center py-4">
          <div className="rounded-full bg-muted p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {invitation.team.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            {invitation.team.name}
          </h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            {roleIcons[invitation.role] ?? roleIcons.member}
            <span className="font-medium">
              {roleLabels[invitation.role] ?? invitation.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-3 text-sm">
            <UserIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Invited by</p>
              <p className="font-medium truncate">
                {invitation.inviter?.name ??
                  invitation.inviter?.email ??
                  "Unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MailIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Invited email</p>
              <p className="font-medium truncate">{invitation.email}</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Accepting..." : "Accept Invitation"}
      </Button>
    </div>
  );
}
