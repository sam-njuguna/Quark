import { getSession } from "@/actions/auth/session";
import { redirect } from "next/navigation";
import {
  getMyAnalytics,
  getMyVelocityByWeek,
  getMyBottleneckStages,
  getMyWorkloadSummary,
} from "@/actions/work/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TargetIcon, FlameIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { VelocityChart } from "./velocity-chart";
import { BottleneckChart } from "./bottleneck-chart";

const stageLabels: Record<string, string> = {
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  revision: "Revision",
  blocked: "Blocked",
};

export default async function MyAnalyticsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [analytics, velocity, bottlenecks, workload] = await Promise.all([
    getMyAnalytics(),
    getMyVelocityByWeek(),
    getMyBottleneckStages(),
    getMyWorkloadSummary(),
  ]);

  const weekTrend = workload.thisWeek >= workload.lastWeek ? "up" : "down";
  const monthTrend = workload.thisMonth >= workload.lastMonth ? "up" : "down";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">My Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Personal performance metrics and workload insights
        </p>
      </div>

      {/* Completion strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-y border-border/50 py-4">
        {[
          {
            label: "Completed",
            value: analytics.completed,
            sub: `${analytics.completionRate}% rate`,
            trend:
              analytics.completionRate >= 50
                ? ("up" as const)
                : ("down" as const),
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "This Week",
            value: workload.thisWeek,
            sub: `${workload.lastWeek > workload.thisWeek ? "-" : "+"}${Math.abs(workload.thisWeek - workload.lastWeek)} vs last`,
            trend: weekTrend,
            color: "",
          },
          {
            label: "This Month",
            value: workload.thisMonth,
            sub: `${workload.lastMonth > workload.thisMonth ? "-" : "+"}${Math.abs(workload.thisMonth - workload.lastMonth)} vs last`,
            trend: monthTrend,
            color: "",
          },
          {
            label: "Avg / Week",
            value: workload.avgPerWeek,
            sub:
              workload.streak > 0 ? `${workload.streak}wk streak` : "no streak",
            trend: "neutral" as const,
            color: "",
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
              className={cn(
                "text-3xl font-bold tabular-nums tracking-tight",
                stat.color,
              )}
            >
              {stat.value}
            </p>
            <p
              className={cn(
                "text-xs",
                stat.trend === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : stat.trend === "down"
                    ? "text-red-500"
                    : "text-muted-foreground/60",
              )}
            >
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-3 divide-x divide-border/50 border border-border/40 rounded-md bg-card">
        {[
          {
            label: "Active",
            value: analytics.active,
            sub: "in progress",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Review",
            value: analytics.awaitingReview,
            sub: "pending action",
            color: "text-violet-600 dark:text-violet-400",
          },
          {
            label: "Cycle Time",
            value: analytics.avgCycleDays ? `${analytics.avgCycleDays}d` : "—",
            sub: analytics.avgCycleDays ? "avg creation→done" : "no data",
            color: "",
          },
        ].map((stat) => (
          <div key={stat.label} className="px-5 py-4 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {stat.label}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground/60">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VelocityChart data={velocity} />
        <BottleneckChart data={bottlenecks} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            <FlameIcon className="size-3.5" />
            Work by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.byStageCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.byStageCounts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([stage, count]) => (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">
                        {stageLabels[stage] || stage.replace(/_/g, " ")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                    <Progress
                      value={(count / analytics.total) * 100}
                      className="h-1"
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TargetIcon className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No work items yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            <TargetIcon className="size-3.5" />
            Work by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.byTypeCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(analytics.byTypeCounts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                  </Badge>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TargetIcon className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No work items yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
