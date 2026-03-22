"use client";

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { BarChart2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BottleneckChartProps {
  data: { stage: string; avgDays: number; count: number }[];
}

export function BottleneckChart({ data }: BottleneckChartProps) {
  const chartConfig = {
    avgDays: {
      label: "Avg Days",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart2Icon className="size-4" />
          Bottleneck — Avg days in stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 50, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.replace(/_/g, " ")}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgDays" radius={[0, 3, 3, 0]}>
                {data.map((b) => (
                  <Cell
                    key={b.stage}
                    fill={
                      b.avgDays > 3
                        ? "#ef4444"
                        : b.avgDays > 1
                          ? "#f59e0b"
                          : "#22c55e"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No active work
          </p>
        )}
      </CardContent>
    </Card>
  );
}
