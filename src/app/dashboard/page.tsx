import { getSession, getUserTeams } from "@/actions/auth/session";
import { listMyWork } from "@/actions/work/list";
import { getActiveTeamId } from "@/actions/team/active-team";
import { listMyActivity } from "@/actions/activity/list";
import { getMyAnalytics } from "@/actions/work/analytics";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ActivityFeed } from "@/components/activity";
import { Button } from "@/components/ui/button";
import { CirclePlus, ActivityIcon, InboxIcon } from "lucide-react";
import Link from "next/link";
import { getTeamMembers } from "@/actions/team/members";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id ?? "";

  const [teams] = await Promise.all([getUserTeams(userId)]);

  const activeTeamId = userId ? await getActiveTeamId(userId) : null;
  const currentTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  const teamMembers = currentTeam ? await getTeamMembers(currentTeam.id) : [];
  const availableUsers = teamMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? "",
    email: m.user.email ?? "",
    image: m.user.image ?? null,
    role: m.role,
    teamId: currentTeam?.id ?? "",
  }));

  const [workItems, activities, analytics] = await Promise.all([
    listMyWork(),
    listMyActivity(10),
    getMyAnalytics(),
  ]);

  const userName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          Good {getTimeOfDay()}, {userName}
        </h1>
        <Button asChild size="sm">
          <Link href="/dashboard/new">
            <CirclePlus className="mr-1.5 size-3.5" />
            New Work
          </Link>
        </Button>
      </div>

      {/* Flat KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {[
          {
            label: "Total",
            value: analytics.total,
            sub: "all items",
            color: "",
          },
          {
            label: "Active",
            value: analytics.active,
            sub: "in progress",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Completed",
            value: analytics.completed,
            sub: `${analytics.completionRate}% rate`,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Review",
            value: analytics.awaitingReview,
            sub:
              analytics.blocked > 0
                ? `${analytics.blocked} blocked`
                : "no blockers",
            color:
              analytics.blocked > 0
                ? "text-red-600 dark:text-red-400"
                : "text-violet-600 dark:text-violet-400",
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

      <div className="w-full space-y-6">
        <div>
          {workItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 px-8 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                <InboxIcon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">Nothing assigned yet</h3>
              <p className="mt-1.5 max-w-[240px] text-xs text-muted-foreground leading-relaxed">
                Create a work item or connect an AI agent via MCP to start
                collaborating.
              </p>
              <div className="mt-5 flex gap-2">
                <Button asChild size="sm">
                  <Link href="/dashboard/new">Create work</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings?tab=mcp">Connect agent</Link>
                </Button>
              </div>
            </div>
          ) : (
            <KanbanBoard
              workItems={workItems}
              teamId={currentTeam?.id}
              availableUsers={availableUsers}
              availableTeams={teams.map((t) => ({ id: t.id, name: t.name }))}
              currentUserId={session?.user?.id}
              currentUserName={
                session?.user?.name ?? session?.user?.email ?? ""
              }
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-border/50">
            <ActivityIcon className="size-3 text-muted-foreground/60" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Activity
            </span>
          </div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
