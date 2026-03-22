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
} from "recharts";
import { TrendingUpIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VelocityChartProps {
  data: { week: string; completed: number }[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  const chartConfig = {
    completed: {
      label: "Completed",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUpIcon className="size-4" />
          Velocity (completions/week)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="completed"
                fill="var(--color-completed)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No completed work yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
