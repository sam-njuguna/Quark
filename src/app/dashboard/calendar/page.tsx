import {
  getSession,
  isPrivilegedUser,
  getUserTeams,
} from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { listWork, listAllTeamsWork } from "@/actions/work/list";
import { getTeamIntegrations } from "@/actions/integrations";
import { getTeamSprints } from "@/actions/sprints";
import { getTeamMembersAvailability } from "@/actions/availability";
import { WorkCalendar } from "@/components/work/work-calendar";
import { TeamAvailabilityView } from "@/components/availability/team-availability-view";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ExternalLinkIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const [teams, activeTeamId, privileged] = await Promise.all([
    getUserTeams(userId),
    getActiveTeamId(userId),
    isPrivilegedUser(userId),
  ]);

  const currentTeam =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null;

  const currentUserRole =
    (currentTeam as { role?: string } | null)?.role ?? "member";
  const canManageSprints =
    ["lead", "admin"].includes(currentUserRole) || privileged;

  const [workItems, integrations, sprints, teamAvailability] =
    await Promise.all([
      privileged
        ? listAllTeamsWork({ limit: 500 }).catch(() => [])
        : currentTeam
          ? listWork({ teamId: currentTeam.id, limit: 500 }).catch(() => [])
          : Promise.resolve([]),
      currentTeam
        ? getTeamIntegrations(currentTeam.id).catch(() => [])
        : Promise.resolve([]),
      currentTeam
        ? getTeamSprints(currentTeam.id).catch(() => [])
        : Promise.resolve([]),
      currentTeam
        ? getTeamMembersAvailability(currentTeam.id).catch(() => [])
        : Promise.resolve([]),
    ]);

  const googleIntegration =
    integrations.find((i) => i.type === "google_calendar") ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {privileged
              ? "All teams · work items with due dates"
              : currentTeam
                ? `${currentTeam.name} · work items with due dates`
                : "Your work items with due dates"}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/new">
            <CalendarIcon className="mr-1.5 size-3.5" />
            Add Work
          </Link>
        </Button>
      </div>

      {!googleIntegration && currentTeam && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Connect Google Calendar</p>
              <p className="text-xs text-muted-foreground">
                Sync meeting work items and see team member availability
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 text-xs"
          >
            <Link href="/dashboard/integrations">
              <ExternalLinkIcon className="size-3" />
              Connect
            </Link>
          </Button>
        </div>
      )}

      {googleIntegration && currentTeam && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10 px-4 py-2.5">
          <UsersIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Google Calendar connected
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500">
              Meeting work items sync automatically · team availability visible
              when scheduling
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="shrink-0 text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
          >
            <Link href="/dashboard/integrations">
              <ExternalLinkIcon className="size-3" />
              Manage
            </Link>
          </Button>
        </div>
      )}

      <WorkCalendar
        workItems={workItems}
        teamId={currentTeam?.id}
        googleConnected={!!googleIntegration}
        sprints={sprints}
        canManageSprints={canManageSprints}
      />

      {currentTeam && teamAvailability.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Team Availability</h3>
            <span className="text-xs text-muted-foreground">
              · {teamAvailability.filter((m) => m.showAvailability).length}{" "}
              members sharing
            </span>
          </div>
          <TeamAvailabilityView members={teamAvailability} />
        </div>
      )}
    </div>
  );
}
