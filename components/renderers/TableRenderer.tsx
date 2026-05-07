"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TableSpec } from "@/lib/visualization-parser";

function normalizeColumn(column: unknown, index: number) {
  if (typeof column === "string" && column.trim()) {
    return column.trim();
  }

  if (typeof column === "number" && Number.isFinite(column)) {
    return String(column);
  }

  if (column && typeof column === "object" && !Array.isArray(column)) {
    const record = column as Record<string, unknown>;
    const key =
      stringOrUndefined(record.key) ??
      stringOrUndefined(record.id) ??
      stringOrUndefined(record.accessorKey) ??
      stringOrUndefined(record.accessor) ??
      stringOrUndefined(record.field) ??
      stringOrUndefined(record.name) ??
      stringOrUndefined(record.label) ??
      stringOrUndefined(record.header);

    if (key) {
      return key;
    }
  }

  return `Column ${index + 1}`;
}

function uniqueColumns(columns: unknown[]) {
  const seen = new Map<string, number>();

  return columns.map((column, index) => {
    const base = normalizeColumn(column, index);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    const key = count === 0 ? base : `${base} ${count + 1}`;
    return { key, label: base };
  });
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatCell(value: unknown) {
  if (value == null) {
    return "—";
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function getRowKey(
  row: Record<string, unknown>,
  columns: { key: string; label: string }[]
) {
  return (
    String(row.id ?? row.app_id ?? row.appId ?? "") ||
    columns.map((column) => String(row[column.key] ?? "")).join("|")
  );
}

function uniqueRows(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[]
) {
  const seen = new Map<string, number>();

  return rows.map((row, index) => {
    const base = getRowKey(row, columns) || `Row ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    const key = count === 0 ? base : `${base} ${count + 1}`;
    return { key, row };
  });
}

export function TableRenderer({
  spec,
  loading = false,
}: {
  spec: TableSpec;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!spec.rows.length) {
    return <p className="text-muted-foreground text-xs">No rows available.</p>;
  }

  const columns = uniqueColumns(
    spec.columns ?? Object.keys(spec.rows[0] ?? {})
  );
  const rows = uniqueRows(spec.rows, columns);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ key: rowKey, row }) => {
            return (
              <TableRow key={rowKey}>
                {columns.map((column) => (
                  <TableCell key={`${rowKey}-${column.key}`}>
                    {formatCell(row[column.key] ?? null)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
