import { getSession, getUserTeams } from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { getAIStats, getAIActiveWork, getAIRecentCompleted } from "@/actions/work/ai-status";
import { getTeamMembers } from "@/actions/team/members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoaderIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const session = await getSession();
  const userId = session?.user?.id ?? "";

  const [teams] = await Promise.all([getUserTeams(userId)]);
  const activeTeamId = userId ? await getActiveTeamId(userId) : null;
  const currentTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  const [aiStats, aiActiveWork, aiCompleted] = await Promise.all([
    getAIStats(currentTeam?.id),
    getAIActiveWork(currentTeam?.id),
    getAIRecentCompleted(currentTeam?.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">AI Activity</h1>
        <p className="text-sm text-muted-foreground">
          Track AI agent work and performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <LoaderIcon className="size-4 text-blue-500 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.running}</div>
            <p className="text-xs text-muted-foreground">AI currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.completed}</div>
            <p className="text-xs text-muted-foreground">Tasks finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircleIcon className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.failed}</div>
            <p className="text-xs text-muted-foreground">Tasks failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <SparklesIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(aiStats.completed) + Number(aiStats.failed) > 0
                ? Math.round((Number(aiStats.completed) / (Number(aiStats.completed) + Number(aiStats.failed))) * 100)
                : 100}%
            </div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LoaderIcon className="size-4 text-blue-500 animate-spin" />
              Active AI Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiActiveWork.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AI work in progress</p>
            ) : (
              <div className="space-y-3">
                {aiActiveWork.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/work/${item.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LoaderIcon className="size-4 text-blue-500 animate-spin" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.stage.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="size-4 text-emerald-500" />
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed AI work</p>
            ) : (
              <div className="space-y-3">
                {aiCompleted.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/work/${item.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="size-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.aiCompletedAt
                            ? new Date(item.aiCompletedAt).toLocaleDateString()
                            : "Done"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="size-4 text-muted-foreground" />
            AI Work Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-blue-600">
                {aiStats.running}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-emerald-600">
                {aiStats.completed}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-red-600">
                {aiStats.failed}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
