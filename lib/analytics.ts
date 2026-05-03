import type { ChartDataPoint } from "@/lib/visualization-parser";

export type DataRecord = Record<string, unknown>;

export function groupBy<T extends DataRecord>(
  records: T[],
  keyFn: (record: T) => string
): Record<string, T[]> {
  return records.reduce<Record<string, T[]>>((acc, record) => {
    const key = keyFn(record);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {});
}

export function sumBy<T>(records: T[], valueFn: (record: T) => number): number {
  return records.reduce((sum, record) => sum + valueFn(record), 0);
}

export function averageBy<T>(
  records: T[],
  valueFn: (record: T) => number
): number {
  if (records.length === 0) {
    return 0;
  }
  return sumBy(records, valueFn) / records.length;
}

export function distributionBy<T>(
  records: T[],
  keyFn: (record: T) => string
): ChartDataPoint[] {
  const grouped = groupBy(records, keyFn);
  return Object.entries(grouped).map(([label, items]) => ({
    label,
    value: items.length,
  }));
}

export function aggregateBy<T>(
  records: T[],
  keyFn: (record: T) => string,
  valueFn: (record: T) => number
): ChartDataPoint[] {
  const grouped = groupBy(records, keyFn);
  return Object.entries(grouped).map(([label, items]) => ({
    label,
    value: sumBy(items, valueFn),
  }));
}

export function averageByGroup<T>(
  records: T[],
  keyFn: (record: T) => string,
  valueFn: (record: T) => number
): ChartDataPoint[] {
  const grouped = groupBy(records, keyFn);
  return Object.entries(grouped).map(([label, items]) => ({
    label,
    value: averageBy(items, valueFn),
  }));
}

export function utilization(balance: number, limit: number): number {
  if (!Number.isFinite(balance) || !Number.isFinite(limit) || limit === 0) {
    return 0;
  }
  return balance / limit;
}
