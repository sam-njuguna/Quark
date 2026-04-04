import { getSession, getUserTeams } from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { eq, desc, and, count } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddTaskButton } from "@/components/agents/add-task-button";
import { ShowApiKeyButton } from "@/components/agents/show-api-key-button";
import {
  ArrowLeftIcon,
  BotIcon,
  ActivityIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayCircleIcon,
} from "lucide-react";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id: agentId } = await params;

  const userId = session?.user?.id ?? "";
  const [teams] = await Promise.all([getUserTeams(userId)]);
  const activeTeamId = userId ? await getActiveTeamId(userId) : null;
  const currentTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  if (!currentTeam) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No team found
      </div>
    );
  }

  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(and(eq(agent.id, agentId), eq(agent.teamId, currentTeam.id)))
    .limit(1);

  if (!agentRecord) {
    notFound();
  }

  const [tasks, statsResult, logs] = await Promise.all([
    db
      .select()
      .from(agentTask)
      .where(eq(agentTask.agentId, agentId))
      .orderBy(desc(agentTask.createdAt))
      .limit(20),

    db
      .select({
        total: count(),
      })
      .from(agentTask)
      .where(eq(agentTask.agentId, agentId)),

    db
      .select()
      .from(agentWorkLog)
      .where(eq(agentWorkLog.agentId, agentId))
      .orderBy(desc(agentWorkLog.createdAt))
      .limit(50),
  ]);

  const stats = statsResult[0]?.total ?? 0;

  const statusCounts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    assigned: tasks.filter((t) => t.status === "assigned").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/team">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <BotIcon className="size-6" />
            <h1 className="text-xl font-semibold tracking-tight">
              {agentRecord.name}
            </h1>
            <Badge variant={agentRecord.isActive ? "default" : "secondary"}>
              {agentRecord.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {agentRecord.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {agentRecord.description}
            </p>
          )}
        </div>
        {agentRecord.config?.apiKey && (
          <div className="flex items-center gap-2">
            <ShowApiKeyButton apiKey={agentRecord.config.apiKey} />
          </div>
        )}
      </div>

      {agentRecord.config?.systemPrompt && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agent Rules & Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/50 p-3 rounded-md max-h-60 overflow-y-auto">
              {agentRecord.config.systemPrompt}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-border/50 border-y border-border/50 py-4">
        <div className="px-4 first:pl-0 last:pr-0 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Total
          </p>
          <p className="text-2xl font-bold tabular-nums">{stats}</p>
        </div>
        <div className="px-4 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Pending
          </p>
          <p className="text-2xl font-bold tabular-nums text-amber-600">
            {statusCounts.pending}
          </p>
        </div>
        <div className="px-4 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Running
          </p>
          <p className="text-2xl font-bold tabular-nums text-blue-600">
            {statusCounts.inProgress}
          </p>
        </div>
        <div className="px-4 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Done
          </p>
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {statusCounts.completed}
          </p>
        </div>
        <div className="px-4 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Failed
          </p>
          <p className="text-2xl font-bold tabular-nums text-red-600">
            {statusCounts.failed}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
              <AddTaskButton agentId={agentId} />
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-zinc-100 text-zinc-700",
                    assigned: "bg-blue-100 text-blue-700",
                    in_progress: "bg-amber-100 text-amber-700",
                    completed: "bg-emerald-100 text-emerald-700",
                    failed: "bg-red-100 text-red-700",
                  };
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50"
                    >
                      <div className="truncate max-w-[200px]">
                        {task.title}
                      </div>
                      <Badge
                        variant="outline"
                        className={statusColors[task.status]}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No logs yet</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ClockIcon className="size-3" />
                        <span className="text-xs">
                          {format(
                            new Date(log.createdAt),
                            "MMM d, h:mm:ss a"
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      </div>
                      {log.message && (
                        <p className="mt-1 ml-5 text-xs">{log.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {agentRecord.lastSeenAt && (
        <p className="text-xs text-muted-foreground text-center">
          Last seen: {format(new Date(agentRecord.lastSeenAt), "PPp")}
        </p>
      )}
    </div>
  );
}
