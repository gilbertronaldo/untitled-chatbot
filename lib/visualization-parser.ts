export type VisualizationType = "chart" | "dashboard" | "table" | "metric";
export type ChartType = "bar" | "line" | "pie";

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartSpec = {
  type: "chart";
  chartType: ChartType;
  title?: string;
  data: ChartDataPoint[];
};

export type MetricSpec = {
  type: "metric";
  title: string;
  value: number | string;
  delta?: number | string;
  trend?: "up" | "down" | "flat";
  description?: string;
};

export type TableSpec = {
  type: "table";
  title?: string;
  columns?: string[];
  rows: Record<string, string | number | null>[];
};

export type DashboardSpec = {
  type: "dashboard";
  title?: string;
  widgets: VisualizationSpec[];
  columns?: number;
};

export type VisualizationSpec =
  | ChartSpec
  | MetricSpec
  | TableSpec
  | DashboardSpec;

export type VisualizationSegment =
  | { kind: "text"; content: string }
  | {
      kind: "visualization";
      content: string;
      visualization: VisualizationSpec;
    };

const LANGUAGE_HINTS = new Set([
  "",
  "json",
  "visualization",
  "spec",
  "dashboard",
  "chart",
  "table",
  "metric",
  "kpi",
]);

export function parseVisualizationResponse(
  text: string
): VisualizationSegment[] {
  if (!text.trim()) {
    return [{ kind: "text", content: text }];
  }

  const segments: VisualizationSegment[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  match = fenceRegex.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      segments.push(...splitPlainJsonSegments(plain));
    }

    const language = match[1]?.trim().toLowerCase() ?? "";
    const raw = match[2]?.trim() ?? "";

    if (LANGUAGE_HINTS.has(language)) {
      const parsed = safeParseVisualization(raw);
      if (parsed) {
        segments.push({
          kind: "visualization",
          content: raw,
          visualization: parsed,
        });
      } else {
        segments.push({ kind: "text", content: match[0] });
      }
    } else {
      segments.push({ kind: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
    match = fenceRegex.exec(text);
  }

  if (lastIndex < text.length) {
    const remainder = text.slice(lastIndex);
    segments.push(...splitPlainJsonSegments(remainder));
  }

  const cleaned = segments.filter(
    (segment) =>
      segment.content.trim().length > 0 || segment.kind === "visualization"
  );

  return cleaned.length > 0 ? cleaned : [{ kind: "text", content: text }];
}

function splitPlainJsonSegments(text: string): VisualizationSegment[] {
  if (!text.includes("{")) {
    return [{ kind: "text", content: text }];
  }

  const segments: VisualizationSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf("{", cursor);
    if (start === -1) {
      segments.push({ kind: "text", content: text.slice(cursor) });
      break;
    }

    if (start > cursor) {
      segments.push({ kind: "text", content: text.slice(cursor, start) });
    }

    const extraction = extractBalancedJson(text, start);
    if (!extraction) {
      segments.push({ kind: "text", content: text.slice(start) });
      break;
    }

    const { json, end } = extraction;
    const parsed = safeParseVisualization(json);
    if (parsed) {
      segments.push({
        kind: "visualization",
        content: json,
        visualization: parsed,
      });
    } else {
      segments.push({ kind: "text", content: json });
    }
    cursor = end;
  }

  return segments;
}

function extractBalancedJson(
  text: string,
  startIndex: number
): { json: string; end: number } | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return { json: text.slice(startIndex, i + 1), end: i + 1 };
      }
    }
  }

  return null;
}

function safeParseVisualization(raw: string): VisualizationSpec | null {
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeVisualizationSpec(parsed);
    if (normalized) {
      console.debug("[visualization] Parsed visualization block", normalized);
    } else {
      console.warn("[visualization] Unsupported visualization schema", parsed);
    }
    return normalized;
  } catch (error) {
    try {
      const jsonl = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      for (const line of jsonl) {
        const parsed = JSON.parse(line);
        const normalized = normalizeVisualizationSpec(parsed);
        if (normalized) {
          console.debug(
            "[visualization] Parsed visualization JSONL block",
            normalized
          );
          return normalized;
        }
      }
    } catch (innerError) {
      console.debug("[visualization] Failed to parse visualization JSON", {
        error,
        innerError,
      });
    }
  }

  return null;
}

function normalizeVisualizationSpec(value: unknown): VisualizationSpec | null {
  if (Array.isArray(value)) {
    const widgets = value
      .map((entry) => normalizeVisualizationSpec(entry))
      .filter(Boolean) as VisualizationSpec[];
    if (widgets.length === 0) {
      return null;
    }
    return {
      type: "dashboard",
      title: "Dashboard",
      widgets,
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const rawType = String(value.type ?? value.kind ?? "").toLowerCase();
  const normalizedType = rawType === "kpi" ? "metric" : rawType;

  if (normalizedType === "dashboard") {
    return normalizeDashboardSpec(value);
  }

  if (normalizedType === "chart" || value.chartType) {
    return normalizeChartSpec(value);
  }

  if (normalizedType === "table") {
    return normalizeTableSpec(value);
  }

  if (normalizedType === "metric") {
    return normalizeMetricSpec(value);
  }

  return null;
}

function normalizeChartSpec(value: Record<string, unknown>): ChartSpec | null {
  const chartType = normalizeChartType(
    value.chartType ?? value.chart ?? value.kind
  );
  const title = stringOrUndefined(value.title ?? value.name);
  const rawData = value.data ?? value.series ?? value.values;

  if (!Array.isArray(rawData)) {
    return null;
  }

  const data = rawData
    .map((entry): ChartDataPoint | null => {
      if (!isRecord(entry)) {
        return null;
      }
      const label = stringOrUndefined(entry.label ?? entry.name);
      const value = numberOrNull(entry.value ?? entry.amount ?? entry.count);
      if (!label || value === null) {
        return null;
      }
      return { label, value };
    })
    .filter(Boolean) as ChartDataPoint[];

  if (data.length === 0) {
    return null;
  }

  return {
    type: "chart",
    chartType,
    title,
    data,
  };
}

function normalizeDashboardSpec(
  value: Record<string, unknown>
): DashboardSpec | null {
  const widgetsRaw =
    value.widgets ?? value.items ?? value.children ?? value.panels;
  if (!Array.isArray(widgetsRaw)) {
    return null;
  }

  const widgets = widgetsRaw
    .map((entry) => normalizeVisualizationSpec(entry))
    .filter(Boolean) as VisualizationSpec[];

  if (widgets.length === 0) {
    return null;
  }

  return {
    type: "dashboard",
    title: stringOrUndefined(value.title ?? value.name),
    widgets,
    columns: numberOrUndefined(value.columns ?? value.gridColumns),
  };
}

function normalizeMetricSpec(
  value: Record<string, unknown>
): MetricSpec | null {
  const title =
    stringOrUndefined(value.title ?? value.label ?? value.name) ?? "Key Metric";
  const metricValue =
    value.value ?? value.amount ?? value.metric ?? value.current;
  if (metricValue == null) {
    return null;
  }

  const delta = value.delta ?? value.change ?? value.variance;
  const trendRaw = stringOrUndefined(value.trend ?? value.direction);
  const trend = normalizeTrend(trendRaw, delta);

  return {
    type: "metric",
    title,
    value: metricValue as number | string,
    delta: delta as number | string | undefined,
    trend,
    description: stringOrUndefined(value.description ?? value.subtitle),
  };
}

function normalizeTableSpec(value: Record<string, unknown>): TableSpec | null {
  const rowsRaw = value.rows ?? value.data ?? value.items;
  if (!Array.isArray(rowsRaw)) {
    return null;
  }

  let rows: Record<string, string | number | null>[] = [];
  const columns = Array.isArray(value.columns ?? value.headers)
    ? (value.columns ?? value.headers)?.map(String)
    : undefined;

  if (rowsRaw.every((row) => Array.isArray(row))) {
    rows = rowsRaw.map((row) => {
      const record: Record<string, string | number | null> = {};
      const keys = columns ?? row.map((_, index) => `Column ${index + 1}`);
      keys.forEach((key, index) => {
        record[key] = valueOrNull(row[index]);
      });
      return record;
    });
  } else {
    rows = rowsRaw
      .map((row) => (isRecord(row) ? sanitizeRow(row) : null))
      .filter(Boolean) as Record<string, string | number | null>[];
  }

  if (rows.length === 0) {
    return null;
  }

  const inferredColumns =
    columns ?? Object.keys(rows[0] ?? {}).map((key) => key);

  return {
    type: "table",
    title: stringOrUndefined(value.title ?? value.name),
    columns: inferredColumns,
    rows,
  };
}

function normalizeChartType(value: unknown): ChartType {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("line")) {
    return "line";
  }
  if (normalized.includes("pie") || normalized.includes("donut")) {
    return "pie";
  }
  return "bar";
}

function normalizeTrend(
  trend: string | undefined,
  delta: unknown
): "up" | "down" | "flat" | undefined {
  if (trend) {
    if (trend.includes("up") || trend.includes("increase")) {
      return "up";
    }
    if (trend.includes("down") || trend.includes("decrease")) {
      return "down";
    }
    if (trend.includes("flat") || trend.includes("stable")) {
      return "flat";
    }
  }

  const numericDelta = numberOrNull(delta);
  if (numericDelta === null) {
    return undefined;
  }

  if (numericDelta > 0) {
    return "up";
  }
  if (numericDelta < 0) {
    return "down";
  }
  return "flat";
}

function sanitizeRow(
  row: Record<string, unknown>
): Record<string, string | number | null> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, valueOrNull(value)])
  );
}

function valueOrNull(value: unknown): string | number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value == null) {
    return null;
  }
  return String(value);
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function numberOrUndefined(value: unknown): number | undefined {
  const parsed = numberOrNull(value);
  return parsed === null ? undefined : parsed;
}

function stringOrUndefined(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
