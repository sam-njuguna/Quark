import {
  getSession,
  getUserTeams,
} from "@/actions/auth/session";
import { listAccessibleWork } from "@/actions/work/list";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { WorkFilters, WorkListTable, WorkCalendar } from "@/components/work";
import { FilterPresets } from "@/components/work/filter-presets";
import {
  WorkViewToggle,
  WorkTypeTabs,
} from "@/components/work/work-view-controls";
import { Button } from "@/components/ui/button";
import { CirclePlus, LayersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamMembers } from "@/actions/team/members";
import { getActiveTeamId } from "@/actions/team/active-team";

interface AllWorkPageProps {
  searchParams: Promise<{ stage?: string; type?: string; view?: string }>;
}

export default async function AllWorkPage({ searchParams }: AllWorkPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const view = params.view ?? "kanban";
  const workItems = await listAccessibleWork({
    stage: params.stage,
    type: params.type || undefined,
    limit: 200,
  });

  const teams = await getUserTeams(session.user.id);
  const activeTeamId = await getActiveTeamId(session.user.id);
  const currentTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];
  const teamMembers = currentTeam ? await getTeamMembers(currentTeam.id) : [];
  const availableUsers = teamMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? "",
    email: m.user.email ?? "",
    image: m.user.image ?? null,
    role: m.role,
    teamId: currentTeam.id,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">All Work</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {workItems.length} item{workItems.length !== 1 ? "s" : ""} from your
            teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WorkViewToggle currentView={view} />
          <Button asChild size="sm">
            <Link href="/dashboard/new">
              <CirclePlus className="mr-1.5 size-3.5" />
              New Work
            </Link>
          </Button>
        </div>
      </div>

      <WorkTypeTabs currentType={params.type} />

      <div className="flex items-center gap-2 flex-wrap">
        <WorkFilters currentStage={params.stage} currentType={params.type} />
        <FilterPresets />
      </div>

      {workItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-8 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
            <LayersIcon className="size-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">
            {params.stage || params.type
              ? "No items match"
              : "No work items yet"}
          </h3>
          <p className="mt-1.5 max-w-[240px] text-sm text-muted-foreground leading-relaxed">
            {params.stage || params.type
              ? "Try adjusting or clearing the active filters."
              : "Create your first work item to get started."}
          </p>
          <div className="mt-5 flex gap-2">
            {params.stage || params.type ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/all">Clear filters</Link>
              </Button>
            ) : null}
            <Button size="sm" asChild>
              <Link href="/dashboard/new">Create work</Link>
            </Button>
          </div>
        </div>
      ) : view === "list" ? (
        <WorkListTable workItems={workItems} availableUsers={availableUsers} />
      ) : view === "calendar" ? (
        <WorkCalendar workItems={workItems} />
      ) : (
        <KanbanBoard
          workItems={workItems}
          teamId={currentTeam?.id}
          availableUsers={availableUsers}
          availableTeams={teams.map((t) => ({ id: t.id, name: t.name }))}
          currentUserId={session.user.id}
          currentUserName={session.user.name ?? session.user.email ?? ""}
        />
      )}
    </div>
  );
}
