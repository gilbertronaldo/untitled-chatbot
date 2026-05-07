"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardSpec,
  VisualizationSpec,
} from "@/lib/visualization-parser";

export function DashboardRenderer({
  spec,
  renderWidget,
  loading = false,
}: {
  spec: DashboardSpec;
  renderWidget: (widget: VisualizationSpec, index: number) => React.ReactNode;
  loading?: boolean;
}) {
  const columns = spec.columns && spec.columns > 0 ? spec.columns : 3;
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="flex flex-col gap-3">
      {spec.title && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {spec.title}
          </h3>
          <p className="text-muted-foreground text-xs">
            AI-generated dashboard widgets
          </p>
        </div>
      )}
      {loading ? (
        <div className={`grid gap-3 ${gridClass}`}>
          {spec.widgets.length > 0
            ? spec.widgets.map((widget) => (
                <Skeleton
                  className="h-36 w-full"
                  key={`dash-skeleton-${widget.type}-${"title" in widget ? (widget.title ?? "widget") : "widget"}`}
                />
              ))
            : ["primary", "secondary", "tertiary"].map((key) => (
                <Skeleton
                  className="h-36 w-full"
                  key={`dash-skeleton-fallback-${key}`}
                />
              ))}
        </div>
      ) : (
        <div className={`grid gap-3 ${gridClass}`}>
          {spec.widgets.map((widget, index) => renderWidget(widget, index))}
        </div>
      )}
    </div>
  );
}
