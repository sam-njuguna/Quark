import { getSession, getUserTeams } from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { listTeamWork } from "@/actions/work/list";
import {
  getTeamAnalytics,
  getTeamMemberWorkloads,
} from "@/actions/work/analytics";
import { getTeamSprints, getSprintBurndown } from "@/actions/sprints";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { SprintManager } from "@/components/sprints/sprint-manager";
import { AgentList } from "@/components/agents/agent-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  UsersIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  ZapIcon,
  TargetIcon,
  CirclePlus,
} from "lucide-react";
import Link from "next/link";

function StageHealthRow({
  count,
  target,
  label,
}: {
  count: number;
  target: number;
  label: string;
}) {
  const pct = Math.min(count / Math.max(target * 2, 1), 1);
  const status = count === 0 ? "ok" : count <= target ? "warn" : "crit";
  const barColor =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  const dot =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  const textColor =
    status === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : status === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-40 shrink-0">
        <span className={`size-1.5 rounded-full ${dot}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span
        className={`text-sm font-medium tabular-nums w-8 text-right ${textColor}`}
      >
        {count}
      </span>
      <span className="text-xs text-muted-foreground w-20 shrink-0">
        target &lt; {target}
      </span>
    </div>
  );
}

export default async function TeamPage() {
  const session = await getSession();
  const userId = session!.user!.id;
  const [teams, activeTeamId] = await Promise.all([
    getUserTeams(userId),
    getActiveTeamId(userId),
  ]);
  const currentTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];
  const currentUserRole = (currentTeam as { role?: string })?.role ?? "member";
  const canManageTeam = ["lead", "admin"].includes(currentUserRole);

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Team analytics and work overview
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <UsersIcon className="size-8 text-muted-foreground mb-4" />
          <h3 className="text-base font-semibold">No team found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Create or join a team to see team-wide analytics and work.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/settings?tab=teams">Manage Teams</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [workItems, analytics, workloads, sprints] = await Promise.all([
    listTeamWork(currentTeam.id),
    getTeamAnalytics(currentTeam.id),
    getTeamMemberWorkloads(currentTeam.id),
    getTeamSprints(currentTeam.id),
  ]);

  const activeSprint = sprints.find((s) => s.status === "active");
  const burndown = activeSprint
    ? await getSprintBurndown(activeSprint.id)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {currentTeam.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Team analytics · {analytics.total} total work items
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/new">
            <CirclePlus className="size-3.5" />
            Create Work
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {[
          {
            label: "Total",
            value: analytics.total,
            sub: "all time",
            color: "",
          },
          {
            label: "Completed",
            value: analytics.completed,
            sub: `${analytics.completionRate}% rate`,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Avg Cycle",
            value:
              analytics.avgCycleDays !== null
                ? `${analytics.avgCycleDays}d`
                : "—",
            sub: "creation → done",
            color:
              analytics.avgCycleDays === null
                ? ""
                : analytics.avgCycleDays <= 3
                  ? "text-emerald-600 dark:text-emerald-400"
                  : analytics.avgCycleDays <= 7
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",
          },
          {
            label: "Active",
            value: analytics.active,
            sub: `${analytics.blocked} blocked`,
            color:
              analytics.blocked > 0 ? "text-amber-600 dark:text-amber-400" : "",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="px-6 first:pl-0 last:pr-0 max-sm:px-4 space-y-0.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {stat.label}
            </p>
            <p
              className={`text-3xl font-bold tabular-nums tracking-tight ${stat.color}`}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground/60">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Stage Health + Workload */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Stage Health */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="size-3.5 text-muted-foreground/60" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Stage Health
            </h2>
          </div>
          <div className="space-y-3">
            <StageHealthRow
              count={analytics.byStageCounts["new"] ?? 0}
              target={5}
              label="New"
            />
            <StageHealthRow
              count={analytics.byStageCounts["blocked"] ?? 0}
              target={2}
              label="Blocked"
            />
            <StageHealthRow
              count={analytics.byStageCounts["awaiting_review"] ?? 0}
              target={10}
              label="Awaiting review"
            />
            <StageHealthRow
              count={analytics.byStageCounts["revision"] ?? 0}
              target={5}
              label="In revision"
            />
          </div>

          {/* By type breakdown */}
          {Object.keys(analytics.byTypeCounts).length > 0 && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <ZapIcon className="size-3.5 text-muted-foreground/50" />
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Work by type
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.byTypeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, cnt]) => (
                    <div
                      key={type}
                      className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
                    >
                      <span className="capitalize text-muted-foreground">
                        {type}
                      </span>
                      <span className="font-semibold tabular-nums">{cnt}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Workload Distribution */}
        {workloads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-3.5 text-muted-foreground/60" />
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Workload
              </h2>
            </div>
            <div className="space-y-3">
              {workloads
                .sort((a, b) => b.active - a.active)
                .map((member) => {
                  const maxActive = Math.max(
                    ...workloads.map((m) => m.active),
                    1,
                  );
                  const pct = member.active / maxActive;
                  const isHeavy = member.active > 8;
                  return (
                    <div key={member.userId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[140px]">
                          {member.name}
                        </span>
                        <span
                          className={`tabular-nums ${isHeavy ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-muted-foreground"}`}
                        >
                          {member.active} active
                          {member.awaitingReview > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {member.awaitingReview} reviewing
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isHeavy ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Sprints */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TargetIcon className="size-3.5 text-muted-foreground/60" />
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Sprints
          </h2>
        </div>
        <SprintManager
          sprints={sprints}
          teamId={currentTeam.id}
          burndownData={burndown ?? []}
          burndownTotal={burndown?.length ?? 0}
          canManage={canManageTeam}
        />
      </div>

      <Separator />

        {/* Kanban */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Board
          </h2>
          {workItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <CheckCircle2Icon className="size-8 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold">No active work</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Assign work to your team to see it on the board.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/new">Create team work</Link>
              </Button>
            </div>
          ) : (
            <KanbanBoard
              workItems={workItems}
              teamId={currentTeam.id}
              currentUserId={session!.user!.id}
              currentUserName={session!.user!.name ?? session!.user!.email ?? ""}
            />
          )}
        </div>

        <AgentList teamId={currentTeam.id} />
      </div>
    );
  }
