"use client";

// Chart renderer for AI BI Copilot – uses @json-render/react Renderer with custom SVG chart components.

import type { Spec } from "@json-render/core";
import {
  ActionProvider,
  type ComponentRenderer,
  Renderer,
  StateProvider,
  VisibilityProvider,
} from "@json-render/react";
import { Fallback, registry } from "@/components/chat/json-render-registry";

// ── Spec type helpers ─────────────────────────────────────────────────────────

/** Type guard: check that a parsed object is a valid json-render Spec */
export function isVisualizationSpec(v: unknown): v is Spec {
  if (!v || typeof v !== "object") {
    return false;
  }
  return true; // For simplicity, we assume any object could be a Spec. In production, add more checks here.
}

const fallback: ComponentRenderer = ({ element }) => (
  <Fallback type={element.type} />
);

// ── Renderer ──────────────────────────────────────────────────────────────────

/**
 * Renders a json-render Spec as a BI visualisation (chart or dashboard).
 * Uses @json-render/react Renderer under the hood.
 */
export function VisualizationRenderer({
  spec,
  loading,
}: {
  spec: Spec;
  loading: boolean;
}) {
  return (
    <div className="my-3 w-full max-w-2xl">
      <div className="rounded-xl border border-border/50 bg-card/40 p-4 shadow-sm">
        <StateProvider initialState={spec.state ?? {}}>
          <VisibilityProvider>
            <ActionProvider>
              <Renderer
                fallback={fallback}
                loading={loading}
                registry={registry}
                spec={spec}
              />
            </ActionProvider>
          </VisibilityProvider>
        </StateProvider>
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
  kind: "text" | "spec";
  content: string;
  spec?: Spec;
}> {
  const segments: Array<{
    kind: "text" | "spec";
    content: string;
    spec?: Spec;
  }> = [];

  const FENCE_RE = /```spec\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  match = FENCE_RE.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const raw = match[1].trim();

    try {
      let parsed: unknown;

      // 1️⃣ try normal JSON
      try {
        parsed = JSON.parse(raw);
      } catch {
        // 2️⃣ fallback JSONL
        parsed = raw
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => JSON.parse(line));
      }

      if (isVisualizationSpec(parsed)) {
        segments.push({
          kind: "spec",
          content: raw,
          spec: parsed,
        });
      } else {
        segments.push({ kind: "text", content: match[0] });
      }
    } catch {
      segments.push({ kind: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
    match = FENCE_RE.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({
      kind: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}
