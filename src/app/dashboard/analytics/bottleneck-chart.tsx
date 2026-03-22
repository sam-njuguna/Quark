"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";

interface BottleneckChartProps {
  data: { stage: string; avgDays: number; count: number }[];
}

const stageLabels: Record<string, string> = {
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  revision: "Revision",
  blocked: "Blocked",
};

export function BottleneckChart({ data }: BottleneckChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClockIcon className="size-4" />
          Bottlenecks
        </CardTitle>
        <CardDescription>Average days spent in each stage</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((b) => (
              <div key={b.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize">
                    {stageLabels[b.stage] || b.stage.replace(/_/g, " ")}
                  </span>
                  <span className="text-muted-foreground">
                    {b.avgDays}d avg · {b.count} items
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      b.avgDays > 3
                        ? "bg-red-500"
                        : b.avgDays > 1
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min((b.avgDays / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClockIcon className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No active bottlenecks
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
