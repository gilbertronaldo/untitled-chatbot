"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MetricSpec } from "@/lib/visualization-parser";

function formatValue(value: number | string) {
  if (typeof value === "number") {
    if (Math.abs(value) >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString();
    }
    return value.toFixed(0);
  }
  return value;
}

export function KPIWidget({
  spec,
  loading = false,
}: {
  spec: MetricSpec;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  const trend = spec.trend ?? "flat";
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-500"
      : trend === "down"
        ? "text-rose-500"
        : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {spec.title}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">
          {formatValue(spec.value)}
        </span>
        {spec.delta != null && (
          <span className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon size={14} />
            {spec.delta}
          </span>
        )}
      </div>
      {spec.description && (
        <p className="text-muted-foreground text-xs">{spec.description}</p>
      )}
    </div>
  );
}
