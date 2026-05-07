"use client";

import type { Spec } from "@json-render/core";
import {
  ActionProvider,
  type ComponentRenderer,
  Renderer,
  StateProvider,
  VisibilityProvider,
} from "@json-render/react";
import { Component, type ReactNode } from "react";
import { Fallback, registry } from "@/components/chat/json-render-registry";
import { ChartRenderer } from "@/components/renderers/ChartRenderer";
import { DashboardRenderer } from "@/components/renderers/DashboardRenderer";
import { KPIWidget } from "@/components/renderers/KPIWidget";
import { TableRenderer } from "@/components/renderers/TableRenderer";
import { cn } from "@/lib/utils";
import type { VisualizationSpec } from "@/lib/visualization-parser";

const jsonRenderFallback: ComponentRenderer = ({ element }) => (
  <Fallback type={element.type} />
);

class VisualizationErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[visualization] Renderer crashed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="text-muted-foreground text-xs">
            Visualization unavailable.
          </p>
        )
      );
    }
    return this.props.children;
  }
}

export function JsonRenderVisualizationRenderer({
  spec,
  loading = false,
}: {
  spec: Spec;
  loading?: boolean;
}) {
  return (
    <VisualizationErrorBoundary>
      <StateProvider initialState={spec.state ?? {}}>
        <VisibilityProvider>
          <ActionProvider>
            <Renderer
              fallback={jsonRenderFallback}
              loading={loading}
              registry={registry}
              spec={spec}
            />
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </VisualizationErrorBoundary>
  );
}

export function VisualizationRenderer({
  spec,
  loading = false,
  compact = false,
  depth = 0,
}: {
  spec: VisualizationSpec;
  loading?: boolean;
  compact?: boolean;
  depth?: number;
}) {
  const containerClass = cn(
    "rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm",
    compact ? "h-full" : "h-auto",
    depth > 0 && "bg-card/70"
  );

  const wrapperClass = cn(
    "w-full",
    compact ? "" : "my-3",
    depth === 0 ? "max-w-4xl" : ""
  );

  const renderContent = () => {
    switch (spec.type) {
      case "chart":
        return (
          <div className="flex flex-col gap-3">
            {spec.title && (
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {spec.title}
                </h4>
                <p className="text-muted-foreground text-xs">
                  {spec.chartType.toUpperCase()} chart
                </p>
              </div>
            )}
            <ChartRenderer loading={loading} spec={spec} />
          </div>
        );
      case "metric":
        return <KPIWidget loading={loading} spec={spec} />;
      case "table":
        return (
          <div className="flex flex-col gap-3">
            {spec.title && (
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {spec.title}
                </h4>
                <p className="text-muted-foreground text-xs">
                  Data table snapshot
                </p>
              </div>
            )}
            <TableRenderer loading={loading} spec={spec} />
          </div>
        );
      case "dashboard":
        return (
          <DashboardRenderer
            loading={loading}
            renderWidget={(widget, index) => (
              <VisualizationRenderer
                compact={true}
                depth={depth + 1}
                key={getWidgetKey(widget, index)}
                loading={loading}
                spec={widget}
              />
            )}
            spec={spec}
          />
        );
      default:
        console.warn("[visualization] Unsupported visualization type", spec);
        return (
          <p className="text-muted-foreground text-xs">
            Unsupported visualization type.
          </p>
        );
    }
  };

  return (
    <VisualizationErrorBoundary
      fallback={
        <div className={wrapperClass}>
          <div className={containerClass}>
            <p className="text-muted-foreground text-xs">
              Unable to render visualization.
            </p>
          </div>
        </div>
      }
    >
      <div className={wrapperClass}>
        <div className={containerClass}>{renderContent()}</div>
      </div>
    </VisualizationErrorBoundary>
  );
}

function getWidgetKey(widget: VisualizationSpec, fallback: number) {
  if ("title" in widget && widget.title) {
    return `${widget.type}-${widget.title}`;
  }
  if (widget.type === "chart") {
    return `${widget.type}-${widget.chartType}`;
  }
  return `${widget.type}-${fallback}`;
}
