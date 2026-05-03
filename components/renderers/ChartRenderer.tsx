"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartSpec } from "@/lib/visualization-parser";

const COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#a855f7",
  "#f97316",
  "#14b8a6",
];

export function ChartRenderer({
  spec,
  loading = false,
}: {
  spec: ChartSpec;
  loading?: boolean;
}) {
  const data = spec.data.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const chartConfig: ChartConfig = {
    value: {
      label: spec.title ?? "Value",
      color: COLORS[0],
    },
  };

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground text-xs">No data available.</p>;
  }

  if (spec.chartType === "pie") {
    return (
      <ChartContainer className="h-56 w-full" config={chartConfig}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey="value"
            innerRadius={38}
            nameKey="label"
            outerRadius={70}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                fill={COLORS[index % COLORS.length]}
                key={`slice-${entry.label}`}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    );
  }

  if (spec.chartType === "line") {
    return (
      <ChartContainer className="h-52 w-full" config={chartConfig}>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tickLine={false} />
          <YAxis axisLine={false} tickLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            activeDot={{ r: 4 }}
            dataKey="value"
            dot={{ r: 3 }}
            stroke="var(--color-value)"
            strokeWidth={2}
          />
        </LineChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer className="h-52 w-full" config={chartConfig}>
      <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis axisLine={false} dataKey="label" tickLine={false} />
        <YAxis axisLine={false} tickLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
