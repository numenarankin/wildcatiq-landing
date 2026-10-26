/**
 * Charts inside markdown.
 *
 * The digest's markdown rendering has to carry its charts, not a text stand-in
 * for them - so a chart is emitted as a fenced ```chart block holding its spec,
 * and the markdown renderer swaps that block for the real chart component (see
 * `app/dev/reports/sample-markdown.tsx`). The chart is drawn by the same code the
 * PDF uses, so the two are identical.
 *
 * A spec is plain JSON: it survives the string round-trip, and a renderer that
 * doesn't understand it degrades to showing the spec rather than to showing
 * nothing.
 *
 * Pure module - safe to import anywhere.
 */

import type { DigestDailyPoint } from "@/lib/reports/digest/types";

/** How a pie's slice values are labelled in its legend. */
export type ChartValueFormat = "usd" | "bbl" | "plain";

export interface BarChartSpec {
  kind: "bar";
  title: string;
  series: DigestDailyPoint[];
  color: string;
  /** Legend label for the first series; only used with `second`. */
  label?: string;
  /** A second series drawn beside the first on a shared axis (oil vs water). */
  second?: { series: DigestDailyPoint[]; color: string; label: string };
  /** Intrinsic width; omit for full width, `WIDE_WIDTH` when sharing a row. */
  width?: number;
}

export interface PieChartSpec {
  kind: "pie";
  title: string;
  data: { label: string; value: number }[];
  format: ChartValueFormat;
  width?: number;
}

/** Two charts side by side, as the PDF's lease page puts gas next to the pie. */
export interface ChartRowSpec {
  kind: "row";
  charts: (BarChartSpec | PieChartSpec)[];
}

/**
 * The Pumper Report's coverage line: a percentage series on a fixed 0 to 100
 * axis, with the period average as a reference line. Carried here because the
 * fence is the protocol for ANY report chart inside markdown, not just the
 * digest's; the drawing lives in `@/lib/reports/pumper/coverage-chart`.
 */
export interface CoverageChartSpec {
  kind: "coverage";
  title: string;
  series: DigestDailyPoint[];
  averagePct?: number;
  width?: number;
}

export type DigestChartSpec =
  | BarChartSpec
  | PieChartSpec
  | ChartRowSpec
  | CoverageChartSpec;

/** The fence language the renderer looks for (`language-chart`). */
export const CHART_FENCE = "chart";

/** One chart as a fenced markdown block. */
export function chartFence(spec: DigestChartSpec): string {
  return ["```" + CHART_FENCE, JSON.stringify(spec), "```"].join("\n");
}

/** Parse a fence body back into a spec; null when it isn't a chart after all. */
export function parseChartSpec(body: string): DigestChartSpec | null {
  try {
    const spec = JSON.parse(body) as DigestChartSpec;
    return spec?.kind === "bar" ||
      spec?.kind === "pie" ||
      spec?.kind === "row" ||
      spec?.kind === "coverage"
      ? spec
      : null;
  } catch {
    return null;
  }
}
