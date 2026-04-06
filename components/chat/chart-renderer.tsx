"use client";

// Chart renderer for AI BI Copilot – uses @json-render/react Renderer with custom SVG chart components.

import type { Spec } from "@json-render/core";
import {
  type ComponentRegistry,
  type ComponentRenderer,
  Renderer,
} from "@json-render/react";
import type { ReactNode } from "react";

// ── Data types ────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  title: string;
  data: ChartDataPoint[];
}

interface DashboardProps {
  title: string;
}

// ── Colour palette ─────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sanitize a string for use as an SVG element ID */
function sanitizeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
}

// ── Chart components ──────────────────────────────────────────────────────────

const BarChart: ComponentRenderer<ChartProps> = ({ element }) => {
  const { title, data } = element.props;
  if (!data?.length) {
    return null;
  }

  const width = 400;
  const height = 220;
  const padding = { top: 24, right: 16, bottom: 56, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value));
  const barWidth = Math.max(8, (chartWidth / data.length) * 0.6);
  const barGap = chartWidth / data.length;
  const yTicks = 4;
  const yTickStep = Math.ceil(maxVal / yTicks / 10) * 10 || 1;

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <svg
        aria-label={title}
        height={height}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const val = i * yTickStep;
            if (val > maxVal * 1.1) {
              return null;
            }
            const y = chartHeight - (val / (maxVal * 1.1)) * chartHeight;
            return (
              <g key={val}>
                <line
                  stroke="currentColor"
                  strokeDasharray="3,3"
                  strokeOpacity={0.15}
                  x1={0}
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                />
                <text
                  dominantBaseline="middle"
                  fill="currentColor"
                  fontSize={10}
                  opacity={0.5}
                  textAnchor="end"
                  x={-6}
                  y={y}
                >
                  {val >= 1_000_000
                    ? `${(val / 1_000_000).toFixed(0)}M`
                    : val >= 1000
                      ? `${(val / 1000).toFixed(0)}K`
                      : val}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const x = i * barGap + (barGap - barWidth) / 2;
            const barH =
              maxVal > 0 ? (d.value / (maxVal * 1.1)) * chartHeight : 0;
            const y = chartHeight - barH;
            return (
              <g key={d.label}>
                <rect
                  fill={COLORS[i % COLORS.length]}
                  height={barH}
                  rx={3}
                  width={barWidth}
                  x={x}
                  y={y}
                />
                <text
                  dominantBaseline="hanging"
                  fill="currentColor"
                  fontSize={10}
                  opacity={0.6}
                  textAnchor="middle"
                  transform={`rotate(-35, ${x + barWidth / 2}, ${chartHeight + 6})`}
                  x={x + barWidth / 2}
                  y={chartHeight + 6}
                >
                  {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
                </text>
              </g>
            );
          })}
          <line
            stroke="currentColor"
            strokeOpacity={0.2}
            x1={0}
            x2={0}
            y1={0}
            y2={chartHeight}
          />
          <line
            stroke="currentColor"
            strokeOpacity={0.2}
            x1={0}
            x2={chartWidth}
            y1={chartHeight}
            y2={chartHeight}
          />
        </g>
      </svg>
    </div>
  );
};

const LineChart: ComponentRenderer<ChartProps> = ({ element }) => {
  const { title, data } = element.props;
  if (!data?.length) {
    return null;
  }

  const width = 400;
  const height = 220;
  const padding = { top: 24, right: 16, bottom: 48, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * chartWidth;
    const y =
      chartHeight -
      ((d.value - minVal) / range) * chartHeight * 0.9 -
      chartHeight * 0.05;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points.at(-1)?.x} ${chartHeight} L 0 ${chartHeight} Z`;
  const gradId = `lg-${sanitizeId(title)}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <svg
        aria-label={title}
        height={height}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.3} />
            <stop offset="100%" stopColor={COLORS[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left},${padding.top})`}>
          <path d={areaD} fill={`url(#${gradId})`} stroke="none" />
          <path d={pathD} fill="none" stroke={COLORS[0]} strokeWidth={2} />
          {points.map((p) => (
            <circle cx={p.x} cy={p.y} fill={COLORS[0]} key={p.label} r={3} />
          ))}
          {points.map((p, i) => (
            <text
              dominantBaseline="hanging"
              fill="currentColor"
              fontSize={10}
              key={`lbl-${p.label}`}
              opacity={0.6}
              textAnchor={
                i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
              }
              x={p.x}
              y={chartHeight + 6}
            >
              {p.label.length > 6 ? `${p.label.slice(0, 5)}…` : p.label}
            </text>
          ))}
          <line
            stroke="currentColor"
            strokeOpacity={0.2}
            x1={0}
            x2={0}
            y1={0}
            y2={chartHeight}
          />
          <line
            stroke="currentColor"
            strokeOpacity={0.2}
            x1={0}
            x2={chartWidth}
            y1={chartHeight}
            y2={chartHeight}
          />
        </g>
      </svg>
    </div>
  );
};

const PieChart: ComponentRenderer<ChartProps> = ({ element }) => {
  const { title, data } = element.props;
  if (!data?.length) {
    return null;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return null;
  }

  const cx = 80;
  const cy = 80;
  const r = 70;
  let startAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const slice = {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: COLORS[i % COLORS.length],
      label: d.label,
      pct: Math.round((d.value / total) * 100),
    };
    startAngle = endAngle;
    return slice;
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <svg
          aria-label={title}
          height={170}
          role="img"
          viewBox="0 0 160 160"
          width={170}
        >
          {slices.map((s) => (
            <path d={s.d} fill={s.color} key={s.label} />
          ))}
        </svg>
        <div className="flex flex-col gap-1.5">
          {slices.map((s) => (
            <div className="flex items-center gap-2 text-xs" key={s.label}>
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-foreground/70">
                {s.label}: <strong className="text-foreground">{s.pct}%</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Dashboard wrapper – renders its children (chart elements) in a responsive grid */
const Dashboard: ComponentRenderer<DashboardProps> = ({
  element,
  children,
}: {
  element: { props: DashboardProps };
  children?: ReactNode;
}) => (
  <div className="my-1 w-full">
    <p className="mb-3 font-semibold text-foreground text-sm">
      {element.props.title}
    </p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  </div>
);

// ── Component registry ────────────────────────────────────────────────────────

/**
 * Registry of BI visualisation components for use with @json-render/react Renderer.
 * Maps component type names → React component implementations.
 */
const biRegistry: ComponentRegistry = {
  BarChart: BarChart as ComponentRenderer<any>,
  LineChart: LineChart as ComponentRenderer<any>,
  PieChart: PieChart as ComponentRenderer<any>,
  Dashboard: Dashboard as ComponentRenderer<any>,
};

// ── Spec type helpers ─────────────────────────────────────────────────────────

/** Type guard: check that a parsed object is a valid json-render Spec */
export function isVisualizationSpec(v: unknown): v is Spec {
  if (!v || typeof v !== "object") {
    return false;
  }
  const o = v as Record<string, unknown>;
  return (
    typeof o.root === "string" &&
    o.elements !== null &&
    typeof o.elements === "object"
  );
}

// ── Renderer ──────────────────────────────────────────────────────────────────

/**
 * Renders a json-render Spec as a BI visualisation (chart or dashboard).
 * Uses @json-render/react Renderer under the hood.
 */
export function VisualizationRenderer({ spec }: { spec: Spec }) {
  return (
    <div className="my-3 w-full max-w-2xl">
      <div className="rounded-xl border border-border/50 bg-card/40 p-4 shadow-sm">
        <Renderer registry={biRegistry} spec={spec} />
      </div>
    </div>
  );
}

// ── Text parser ───────────────────────────────────────────────────────────────

/**
 * Parses visualization JSON blocks from AI message text.
 * Returns an array of {text, visualization} segments.
 */
export function parseVisualizationBlocks(text: string): Array<{
  kind: "text" | "visualization";
  content: string;
  spec?: Spec;
}> {
  const segments: Array<{
    kind: "text" | "visualization";
    content: string;
    spec?: Spec;
  }> = [];

  const FENCE_RE = /```visualization\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
  while ((match = FENCE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    try {
      const parsed: unknown = JSON.parse(match[1].trim());
      if (isVisualizationSpec(parsed)) {
        segments.push({
          kind: "visualization",
          content: match[1],
          spec: parsed,
        });
      } else {
        segments.push({ kind: "text", content: match[0] });
      }
    } catch {
      // JSON parse failed – treat as plain text
      segments.push({ kind: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}
