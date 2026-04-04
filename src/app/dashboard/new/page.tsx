import { CreateWorkForm } from "@/components/work/create-work-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { listAllUsers } from "@/actions/team/users";
import {
  getUserTeams,
  getSession,
  isPrivilegedUser,
} from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";

export default async function NewWorkPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const [allUsers, teams, privileged] = await Promise.all([
    listAllUsers().catch(() => []),
    userId ? getUserTeams(userId).catch(() => []) : Promise.resolve([]),
    userId ? isPrivilegedUser(userId) : Promise.resolve(false),
  ]);

  const defaultTeamId =
    userId && !privileged
      ? ((await getActiveTeamId(userId)) ?? undefined)
      : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
          asChild
        >
          <Link href="/dashboard/all">
            <ArrowLeftIcon className="size-3.5" />
            Back
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New Work</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Create a work item for yourself or assign it to your team
        </p>
      </div>

      <CreateWorkForm
        availableUsers={allUsers}
        availableTeams={teams}
        isPrivileged={privileged}
        defaultTeamId={defaultTeamId}
      />
    </div>
  );
}
