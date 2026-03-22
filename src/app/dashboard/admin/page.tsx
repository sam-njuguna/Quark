import {
  getSession,
  getUserTeams,
  getSystemRole,
  isPrivilegedUser,
} from "@/actions/auth/session";
import {
  getTeamAnalytics,
  getTeamMemberWorkloads,
  getVelocityByWeek,
  getBottleneckStages,
} from "@/actions/work/analytics";
import { getTeamMembers } from "@/actions/team/members";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  TrendingUpIcon,
  BarChart3Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { VelocityChart } from "./velocity-chart";
import { BottleneckChart } from "./bottleneck-chart";
import { SuperAdminUserTable } from "./super-admin-user-table";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const privileged = await isPrivilegedUser(session.user.id);
  if (!privileged) redirect("/dashboard");

  const systemRole = await getSystemRole(session.user.id);
  const isSuperAdmin = systemRole === "super_admin";

  const teams = await getUserTeams(session.user.id);

  if (!teams.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <UsersIcon className="size-8 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">No teams found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create or join a team to see org-level analytics.
        </p>
      </div>
    );
  }

  const teamsWithData = await Promise.all(
    teams.map(async (team) => {
      const [analytics, workloads, members, velocity, bottlenecks] =
        await Promise.all([
          getTeamAnalytics(team.id),
          getTeamMemberWorkloads(team.id),
          getTeamMembers(team.id),
          getVelocityByWeek(team.id),
          getBottleneckStages(team.id),
        ]);
      return { team, analytics, workloads, members, velocity, bottlenecks };
    }),
  );

  const orgTotal = teamsWithData.reduce((s, t) => s + t.analytics.total, 0);
  const orgCompleted = teamsWithData.reduce(
    (s, t) => s + t.analytics.completed,
    0,
  );
  const orgActive = teamsWithData.reduce((s, t) => s + t.analytics.active, 0);
  const orgBlocked = teamsWithData.reduce((s, t) => s + t.analytics.blocked, 0);
  const orgMembers = teamsWithData.reduce((s, t) => s + t.members.length, 0);
  const orgCompletionRate =
    orgTotal > 0 ? Math.round((orgCompleted / orgTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Organisation-wide metrics across {teams.length} team
          {teams.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Flat KPI strip — no cards, just numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {[
          { label: "Total", value: orgTotal, sub: "work items", color: "" },
          {
            label: "Active",
            value: orgActive,
            sub: "in progress",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Completed",
            value: orgCompleted,
            sub: `${orgCompletionRate}% rate`,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Blocked",
            value: orgBlocked,
            sub: "need attention",
            color:
              orgBlocked > 0
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground",
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

      {/* People */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="size-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            People &mdash; {orgMembers} member{orgMembers !== 1 ? "s" : ""}{" "}
            across {teams.length} team{teams.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teamsWithData.map(({ team, members, workloads }) => (
            <div
              key={team.id}
              className="rounded-md border bg-card overflow-hidden"
            >
              {/* Team header */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b bg-muted/30">
                <div className="flex size-6 items-center justify-center rounded bg-primary/15 text-primary text-[11px] font-bold shrink-0">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm flex-1 truncate">
                  {team.name}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {members.length}
                </span>
              </div>
              {/* Members */}
              <div className="divide-y divide-border/40">
                {members.map((m) => {
                  const wl = workloads.find((w) => w.userId === m.user.id);
                  const maxWl = Math.max(...workloads.map((w) => w.active), 1);
                  const pct = wl ? wl.active / maxWl : 0;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <Avatar className="size-6 shrink-0">
                        <AvatarImage src={m.user.image ?? undefined} />
                        <AvatarFallback className="text-[9px] font-semibold bg-muted">
                          {m.user.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">
                            {m.user.name ?? m.user.email}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                            {wl ? `${wl.active} active` : "0 active"}
                          </span>
                        </div>
                        {/* Activity bar */}
                        <div className="mt-1 h-0.5 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/40 transition-all"
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          m.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : m.role === "lead"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts per team */}
      {teamsWithData.map(({ team, velocity, bottlenecks, analytics }) => (
        <div key={team.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3Icon className="size-3.5 text-muted-foreground/50" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {team.name}
            </span>
            {analytics.avgCycleDays && (
              <span className="ml-auto text-xs text-muted-foreground">
                Avg cycle{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {analytics.avgCycleDays}d
                </span>
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <VelocityChart data={velocity} />
            <BottleneckChart data={bottlenecks} />
          </div>
        </div>
      ))}

      {/* Per-team performance — flat table layout */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="size-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Team Performance
          </span>
        </div>
        <div className="rounded-md border bg-card overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_60px_60px_60px_60px_80px] gap-4 px-4 py-2 border-b bg-muted/30 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            <span>Team</span>
            <span className="text-right">Total</span>
            <span className="text-right">Active</span>
            <span className="text-right">Review</span>
            <span className="text-right">Blocked</span>
            <span>Completion</span>
          </div>
          {/* Rows */}
          {teamsWithData.map(({ team, analytics }, idx) => (
            <div
              key={team.id}
              className={`grid grid-cols-[1fr_60px_60px_60px_60px_80px] gap-4 px-4 py-3 items-center ${
                idx < teamsWithData.length - 1
                  ? "border-b border-border/40"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded bg-primary/15 text-primary text-[10px] font-bold shrink-0">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium truncate">
                  {team.name}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-right">
                {analytics.total}
              </span>
              <span className="text-sm tabular-nums text-right text-amber-600 dark:text-amber-400 font-medium">
                {analytics.active}
              </span>
              <span className="text-sm tabular-nums text-right text-violet-600 dark:text-violet-400 font-medium">
                {analytics.awaitingReview}
              </span>
              <span
                className={`text-sm tabular-nums text-right font-medium ${
                  analytics.blocked > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground/50"
                }`}
              >
                {analytics.blocked}
              </span>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${analytics.completionRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground ml-2 w-8 text-right shrink-0">
                    {analytics.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-violet-500" />
            <h2 className="text-base font-semibold">System Roles</h2>
            <Badge
              variant="outline"
              className="text-[10px] text-violet-600 border-violet-300"
            >
              Super Admin Only
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Promote users to super_admin to grant cross-team visibility and
            all-teams access.
          </p>
          <SuperAdminUserTable currentUserId={session.user.id} />
        </div>
      )}
    </div>
  );
}
