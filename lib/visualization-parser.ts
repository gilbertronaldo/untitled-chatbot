export type VisualizationType = "chart" | "dashboard" | "table" | "metric";
export type ChartType = "bar" | "line" | "pie";

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartSpec = {
  type: "chart";
  chartType: ChartType;
  title: string;
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

const STRUCTURED_BLOCK_REGEX =
  /<(analysis|visualization)>([\s\S]*?)<\/(analysis|visualization)>/gi;

export function parseVisualizationResponse(
  text: string
): VisualizationSegment[] {
  console.debug("[visualization] Raw AI response", {
    raw: text.slice(0, 4000),
  });

  if (!text.trim()) {
    return [{ kind: "text", content: text }];
  }

  const taggedSegments = parseTaggedSegments(text);
  if (taggedSegments !== null) {
    return finalizeSegments(taggedSegments, "");
  }

  const segments: VisualizationSegment[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  for (;;) {
    const match = fenceRegex.exec(text);
    if (!match) {
      break;
    }
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
        console.error(
          "[visualization] Ignoring malformed visualization fence",
          {
            raw: raw.slice(0, 1000),
          }
        );
      }
    } else {
      segments.push({ kind: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainder = text.slice(lastIndex);
    segments.push(...splitPlainJsonSegments(remainder));
  }

  return finalizeSegments(segments, text);
}

function parseTaggedSegments(text: string): VisualizationSegment[] | null {
  STRUCTURED_BLOCK_REGEX.lastIndex = 0;

  const matches = [...text.matchAll(STRUCTURED_BLOCK_REGEX)];
  if (matches.length === 0) {
    return null;
  }

  const segments: VisualizationSegment[] = [];

  for (const match of matches) {
    const openingTag = match[1]?.toLowerCase();
    const closingTag = match[3]?.toLowerCase();
    if (!openingTag || openingTag !== closingTag) {
      continue;
    }

    const rawBlock = match[2]?.trim() ?? "";

    if (openingTag === "analysis") {
      if (rawBlock) {
        segments.push({ kind: "text", content: rawBlock });
      }
      continue;
    }

    console.debug("[visualization] Extracted visualization block", {
      raw: rawBlock.slice(0, 4000),
    });

    const jsonBlock = extractJsonOnly(rawBlock);
    if (!jsonBlock) {
      console.error(
        "[visualization] Visualization block did not contain JSON",
        {
          raw: rawBlock.slice(0, 1000),
        }
      );
      continue;
    }

    const parsed = safeParseVisualization(jsonBlock);
    if (parsed) {
      segments.push({
        kind: "visualization",
        content: jsonBlock,
        visualization: parsed,
      });
    }
  }

  return segments;
}

function splitPlainJsonSegments(text: string): VisualizationSegment[] {
  const start = findNextJsonStart(text);
  if (start === -1) {
    return [{ kind: "text", content: text }];
  }

  const segments: VisualizationSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextStart = findNextJsonStart(text, cursor);
    if (nextStart === -1) {
      segments.push({ kind: "text", content: text.slice(cursor) });
      break;
    }

    if (nextStart > cursor) {
      segments.push({ kind: "text", content: text.slice(cursor, nextStart) });
    }

    const extraction = extractBalancedJsonValue(text, nextStart);
    if (!extraction) {
      segments.push({ kind: "text", content: text.slice(nextStart) });
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

function extractJsonOnly(raw: string): string | null {
  const startIndex = findNextJsonStart(raw);
  if (startIndex === -1) {
    return null;
  }

  const extraction = extractBalancedJsonValue(raw, startIndex);
  return extraction?.json ?? null;
}

function extractBalancedJsonValue(
  text: string,
  startIndex: number
): { json: string; end: number } | null {
  const stack: string[] = [];
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

    if (char === "{" || char === "[") {
      stack.push(char);
      continue;
    }

    if (char === "}" || char === "]") {
      const expected = char === "}" ? "{" : "[";
      if (stack.at(-1) !== expected) {
        return null;
      }
      stack.pop();
      if (stack.length === 0) {
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

  const candidates = collectJsonCandidates(raw);
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      console.debug("[visualization] Parsed JSON result", parsed);

      const normalized = normalizeVisualizationSpec(parsed);
      if (normalized) {
        console.debug(
          "[visualization] Parsed visualization result",
          normalized
        );
        return normalized;
      }

      console.error("[visualization] Visualization schema validation failed", {
        parsed,
      });
    } catch (error) {
      console.error("[visualization] Failed to parse visualization JSON", {
        candidate: candidate.slice(0, 1000),
        error: getErrorMessage(error),
      });
    }
  }

  console.error("[visualization] Failed to parse visualization block", {
    raw: raw.slice(0, 1000),
  });

  return null;
}

function normalizeVisualizationSpec(value: unknown): VisualizationSpec | null {
  if (isRecord(value)) {
    const wrapped =
      value.visualization ?? value.spec ?? value.result ?? value.output;
    if (wrapped && wrapped !== value) {
      return normalizeVisualizationSpec(wrapped);
    }
  }

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
  const rawChartType = value.chartType ?? value.chart ?? value.kind;
  const chartTypeName = stringOrUndefined(rawChartType);
  const title = stringOrUndefined(value.title ?? value.name);
  const rawData = value.data ?? value.series ?? value.values;

  if (!chartTypeName || !title || !Array.isArray(rawData)) {
    return null;
  }

  let data = rawData
    .map((entry): ChartDataPoint | null => {
      if (!isRecord(entry)) {
        return null;
      }
      const label = stringOrUndefined(
        entry.label ??
          entry.name ??
          entry.category ??
          entry.x ??
          entry.key ??
          entry.dimension
      );
      const value = numberOrNull(
        entry.value ??
          entry.amount ??
          entry.count ??
          entry.y ??
          entry.total ??
          entry.metric
      );
      if (!label || value === null) {
        return null;
      }
      return { label, value };
    })
    .filter(Boolean) as ChartDataPoint[];

  if (data.length === 0) {
    const categoryKey = stringOrUndefined(
      value.xKey ?? value.categoryKey ?? value.labelKey
    );
    const metricKey = stringOrUndefined(
      value.yKey ?? value.valueKey ?? value.metricKey
    );
    if (categoryKey && metricKey) {
      data = rawData
        .map((entry): ChartDataPoint | null => {
          if (!isRecord(entry)) {
            return null;
          }
          const label = stringOrUndefined(entry[categoryKey]);
          const metric = numberOrNull(entry[metricKey]);
          if (!label || metric === null) {
            return null;
          }
          return { label, value: metric };
        })
        .filter(Boolean) as ChartDataPoint[];
    }
  }

  if (data.length === 0) {
    return null;
  }

  return {
    type: "chart",
    chartType: normalizeChartType(chartTypeName),
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
    columns: numberOrUndefined(
      value.columns ??
        value.gridColumns ??
        (isRecord(value.layout) ? value.layout.columns : undefined)
    ),
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

function collectJsonCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  const candidates = new Set<string>([trimmed]);

  const firstJsonStart = findNextJsonStart(trimmed);
  if (firstJsonStart >= 0) {
    const balanced = extractBalancedJsonValue(trimmed, firstJsonStart);
    if (balanced) {
      candidates.add(balanced.json);
    }
  }

  const jsonl = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of jsonl) {
    if (line.startsWith("{") || line.startsWith("[")) {
      candidates.add(line);
    }
  }

  return [...candidates];
}

function findNextJsonStart(text: string, startIndex = 0): number {
  const objectStart = text.indexOf("{", startIndex);
  const arrayStart = text.indexOf("[", startIndex);

  if (objectStart === -1) {
    return arrayStart;
  }

  if (arrayStart === -1) {
    return objectStart;
  }

  return Math.min(objectStart, arrayStart);
}

function finalizeSegments(
  segments: VisualizationSegment[],
  fallbackText: string
): VisualizationSegment[] {
  const cleaned = dedupeVisualizations(segments).filter(
    (segment) =>
      segment.kind === "visualization" || segment.content.trim().length > 0
  );

  if (cleaned.length > 0) {
    return cleaned;
  }

  return [{ kind: "text", content: fallbackText }];
}

function dedupeVisualizations(
  segments: VisualizationSegment[]
): VisualizationSegment[] {
  const seen = new Set<string>();

  return segments.filter((segment) => {
    if (segment.kind !== "visualization") {
      return true;
    }

    const signature = JSON.stringify(segment.visualization);
    if (seen.has(signature)) {
      console.debug("[visualization] Dropped duplicate visualization", {
        signature,
      });
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
