/**
 * The digest's charts bound to real DOM `<svg>` elements - the in-app rendering
 * (the report gallery's markdown view).
 *
 * Same drawing code as the PDF (`./chart-elements`), same coordinates, same
 * colors, so what you read on screen is what lands in the emailed document. The
 * only difference is the root element: a `viewBox` instead of a fixed point size,
 * so the chart scales down on a narrow screen instead of overflowing, and
 * the app's own typeface is named explicitly, which is the same one the PDF now
 * embeds (see `PDF_FONT`), so the two renderings share their text metrics.
 *
 * No renderer imports, no browser APIs - renders on the server.
 */

import type { ComponentType } from "react";
import {
  buildDigestCharts,
  CHART_COLORS,
  NARROW_WIDTH,
  WIDE_WIDTH,
  type ChartPrimitives,
} from "@/lib/reports/digest/chart-elements";

export { CHART_COLORS, NARROW_WIDTH, WIDE_WIDTH };

const primitives: ChartPrimitives = {
  Svg: "svg" as unknown as ComponentType<Record<string, unknown>>,
  G: "g" as unknown as ComponentType<Record<string, unknown>>,
  Rect: "rect" as unknown as ComponentType<Record<string, unknown>>,
  Line: "line" as unknown as ComponentType<Record<string, unknown>>,
  Path: "path" as unknown as ComponentType<Record<string, unknown>>,
  Polyline: "polyline" as unknown as ComponentType<Record<string, unknown>>,
  Text: "text" as unknown as ComponentType<Record<string, unknown>>,
  rootProps: (width, height) => ({
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    // No width cap: the chart fills whatever column it is given and the viewBox
    // scales every coordinate - bars, axis, labels and legend - by one factor,
    // so it stays the PDF's chart, just larger on a screen wider than a page.
    style: {
      height: "auto",
      fontFamily: "var(--font-sans), Figtree, system-ui, sans-serif",
    },
  }),
};

const charts = buildDigestCharts(primitives);

export const BarChartDom = charts.BarChart;
export const PieChartDom = charts.PieChart;
export const LineChartDom = charts.LineChart;
