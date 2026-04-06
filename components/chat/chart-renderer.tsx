"use client";

// Chart renderer for AI BI Copilot – renders JSON visualization instructions as SVG charts

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSpec {
  type: "chart";
  chartType: "bar" | "line" | "pie";
  title: string;
  data: ChartDataPoint[];
}

export interface DashboardSpec {
  type: "dashboard";
  title: string;
  widgets: ChartSpec[];
}

export type VisualizationSpec = ChartSpec | DashboardSpec;

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

function BarChart({ spec }: { spec: ChartSpec }) {
  const { data, title } = spec;
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
          {/* Y-axis gridlines and labels */}
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

          {/* Bars */}
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

          {/* Axes */}
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
}

function LineChart({ spec }: { spec: ChartSpec }) {
  const { data, title } = spec;
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
          <linearGradient id={`lineGrad-${title}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.3} />
            <stop offset="100%" stopColor={COLORS[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left},${padding.top})`}>
          <path d={areaD} fill={`url(#lineGrad-${title})`} stroke="none" />
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
}

function PieChart({ spec }: { spec: ChartSpec }) {
  const { data, title } = spec;
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
    const midAngle = startAngle + angle / 2;
    const lx = cx + (r + 14) * Math.cos(midAngle);
    const ly = cy + (r + 14) * Math.sin(midAngle);
    const slice = {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: COLORS[i % COLORS.length],
      label: d.label,
      value: d.value,
      pct: Math.round((d.value / total) * 100),
      lx,
      ly,
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
}

function ChartCard({ spec }: { spec: ChartSpec }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 shadow-sm">
      {spec.chartType === "bar" && <BarChart spec={spec} />}
      {spec.chartType === "line" && <LineChart spec={spec} />}
      {spec.chartType === "pie" && <PieChart spec={spec} />}
    </div>
  );
}

export function VisualizationRenderer({ spec }: { spec: VisualizationSpec }) {
  if (spec.type === "chart") {
    return (
      <div className="my-3 w-full max-w-lg">
        <ChartCard spec={spec} />
      </div>
    );
  }

  if (spec.type === "dashboard") {
    return (
      <div className="my-3 w-full">
        <p className="mb-3 font-semibold text-foreground text-sm">
          {spec.title}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {spec.widgets.map((widget, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: widget order is stable
            <ChartCard key={i} spec={widget} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Parses visualization JSON blocks from AI message text.
 * Returns an array of {text, visualization} segments.
 */
export function parseVisualizationBlocks(text: string): Array<{
  kind: "text" | "visualization";
  content: string;
  spec?: VisualizationSpec;
}> {
  const segments: Array<{
    kind: "text" | "visualization";
    content: string;
    spec?: VisualizationSpec;
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
      const spec = JSON.parse(match[1].trim()) as VisualizationSpec;
      segments.push({ kind: "visualization", content: match[1], spec });
    } catch {
      // If JSON parse fails, treat as plain text
      segments.push({ kind: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}
