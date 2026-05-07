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

function formatCell(value: string | number | null) {
  if (value == null) {
    return "—";
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return value;
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

  const columns = spec.columns ?? Object.keys(spec.rows[0] ?? {});

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {spec.rows.map((row) => {
            const rowKey =
              String(row.id ?? row.app_id ?? row.appId ?? "") ||
              columns.map((column) => String(row[column] ?? "")).join("|");
            return (
              <TableRow key={rowKey}>
                {columns.map((column) => (
                  <TableCell key={`${rowKey}-${column}`}>
                    {formatCell(row[column] ?? null)}
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
