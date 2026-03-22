"use client";

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUpIcon } from "lucide-react";

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
          Weekly Velocity
        </CardTitle>
        <CardDescription>
          Your completed work over the last 8 weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart
              data={data}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="completed"
                fill="var(--color-completed)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUpIcon className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No completed work yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
