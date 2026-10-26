/**
 * The coverage chart bound to real DOM `<svg>` elements - the in-app View modal.
 * Same drawing code as the PDF (`./coverage-chart`), same coordinates, so the
 * preview is the document.
 *
 * No renderer imports and no browser APIs, so it renders on the server too.
 */

import type { ComponentType } from "react";
import type { ChartPrimitives } from "@/lib/reports/digest/chart-elements";
import { buildCoverageChart } from "@/lib/reports/pumper/coverage-chart";

const primitives: ChartPrimitives = {
  Svg: "svg" as unknown as ComponentType<Record<string, unknown>>,
  G: "g" as unknown as ComponentType<Record<string, unknown>>,
  Rect: "rect" as unknown as ComponentType<Record<string, unknown>>,
  Line: "line" as unknown as ComponentType<Record<string, unknown>>,
  Path: "path" as unknown as ComponentType<Record<string, unknown>>,
  Polyline: "polyline" as unknown as ComponentType<Record<string, unknown>>,
  Text: "text" as unknown as ComponentType<Record<string, unknown>>,
  // A viewBox instead of a fixed point size, so the chart scales to its column
  // instead of overflowing; the app typeface is named explicitly, matching the
  // Figtree the PDF embeds.
  rootProps: (width, height) => ({
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    style: {
      height: "auto",
      fontFamily: "var(--font-sans), Figtree, system-ui, sans-serif",
    },
  }),
};

export const CoverageChartDom = buildCoverageChart(primitives).CoverageChart;
