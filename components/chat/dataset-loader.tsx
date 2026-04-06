"use client";

// Dataset loader component – allows users to upload CSV/JSON files or select the example dataset

import { parse } from "papaparse";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { bankingDataset, datasetSchema } from "@/data/banking-dataset";

export interface LoadedDataset {
  name: string;
  records: Record<string, unknown>[];
  schema: string;
}

function buildSchema(records: Record<string, unknown>[], name: string): string {
  if (records.length === 0) {
    return `Dataset: ${name} (0 records)`;
  }
  const fields = Object.keys(records[0]);
  return `Dataset: ${name} (${records.length} records)\nFields: ${fields.join(", ")}`;
}

interface DatasetLoaderProps {
  onDatasetLoad: (dataset: LoadedDataset | null) => void;
  currentDataset: LoadedDataset | null;
}

export function DatasetLoader({
  onDatasetLoad,
  currentDataset,
}: DatasetLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadExample = useCallback(() => {
    const dataset: LoadedDataset = {
      name: "Banking Analytics Sample",
      records: bankingDataset as unknown as Record<string, unknown>[],
      schema: datasetSchema,
    };
    onDatasetLoad(dataset);
    setIsOpen(false);
  }, [onDatasetLoad]);

  const handleFile = useCallback(
    (file: File) => {
      setIsLoading(true);
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed: unknown = JSON.parse(e.target?.result as string);
            const raw = Array.isArray(parsed) ? parsed : [parsed];
            // Validate: each element must be a plain object
            const records = raw.filter(
              (r): r is Record<string, unknown> =>
                r !== null && typeof r === "object" && !Array.isArray(r)
            );
            if (records.length === 0) {
              toast.error("JSON file must contain an array of objects.");
              setIsLoading(false);
              return;
            }
            const dataset: LoadedDataset = {
              name: file.name,
              records,
              schema: buildSchema(records, file.name),
            };
            onDatasetLoad(dataset);
            setIsOpen(false);
          } catch {
            toast.error("Invalid JSON file.");
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsText(file);
      } else if (ext === "csv") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = parse<Record<string, unknown>>(
            e.target?.result as string,
            { header: true, skipEmptyLines: true }
          );
          const dataset: LoadedDataset = {
            name: file.name,
            records: result.data,
            schema: buildSchema(result.data, file.name),
          };
          onDatasetLoad(dataset);
          setIsLoading(false);
          setIsOpen(false);
        };
        reader.readAsText(file);
      } else {
        toast.error("Please upload a CSV or JSON file.");
        setIsLoading(false);
      }
    },
    [onDatasetLoad]
  );

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/40 px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-card/80 hover:text-foreground"
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        <span className="text-base leading-none">📊</span>
        <span>{currentDataset ? currentDataset.name : "Load Dataset"}</span>
        <span className="text-muted-foreground/50">▾</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-xl border border-border/50 bg-popover p-3 shadow-lg">
          <p className="mb-2 font-medium text-foreground text-xs">
            Load a dataset
          </p>

          <button
            className="mb-2 w-full rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-left text-xs transition-colors hover:bg-card hover:text-foreground"
            onClick={loadExample}
            type="button"
          >
            <span className="font-medium">Banking Analytics Sample</span>
            <br />
            <span className="text-muted-foreground">
              25 records – segments, AUM, credit data
            </span>
          </button>

          <div className="relative">
            <button
              className="w-full rounded-lg border border-dashed border-border/60 bg-transparent px-3 py-2 text-center text-muted-foreground text-xs transition-colors hover:border-border hover:bg-card/30"
              disabled={isLoading}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {isLoading ? "Loading…" : "Upload CSV or JSON"}
            </button>
            <input
              accept=".csv,.json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFile(file);
                }
                e.target.value = "";
              }}
              ref={fileRef}
              type="file"
            />
          </div>

          {currentDataset && (
            <button
              className="mt-2 w-full text-center text-muted-foreground/60 text-xs hover:text-muted-foreground"
              onClick={() => {
                onDatasetLoad(null);
                setIsOpen(false);
              }}
              type="button"
            >
              Clear dataset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
