/**
 * The Pumper Report's coverage chart, drawn once against a swappable set of SVG
 * primitives - the same trick the digest charts use, for the same reason: the PDF
 * (react-pdf `<Svg>`, Node only) and the in-app View modal (real DOM `<svg>`)
 * cannot share a renderer, and drawing it twice guarantees the preview drifts
 * from the document. `./chart-pdf` and `./chart-dom` are the two bindings.
 *
 * A LINE chart, not a bar chart (client spec): this series is one continuous
 * quantity - the share of the field that got a visit - and the shape of the line
 * is the point (weekends dipping, a stretch where nobody went out). That is the
 * opposite of the digest's per-day production bars, where each day stands alone.
 *
 * Two decisions that make it read honestly:
 *
 *  - The axis is FIXED at 0–100%. A percentage auto-scaled to its own maximum
 *    lies: a month that never cleared 40% coverage would fill the plot and look
 *    complete. The empty space above the line is the information.
 *  - A dashed reference line marks the window's aggregate rate - the same number
 *    printed as the headline stat, so the chart and the stat visibly agree.
 *
 * Coordinates come from the pure `chart-scale` helpers (shared with the digest);
 * this file only maps them onto elements and imports no renderer.
 */

import type { ReactElement } from "react";
import { BODY_TEXT_HEX, MUTED_TEXT_HEX, RULE_HEX } from "@/lib/export/style";
import type { ChartPrimitives } from "@/lib/reports/digest/chart-elements";
import {
  linePoints,
  polylineString,
  scaleX,
  scaleY,
  yTicks,
  type PlotDims,
} from "@/lib/reports/digest/chart-scale";

/** Content width of a portrait letter page inside the export margins (52pt each). */
export const PAGE_WIDTH = 508;

const HEIGHT = 190;

/** Gap between the title baseline and the top of the plot (matches the digest). */
const TITLE_GAP = 28;

/** Coverage is a share of a whole: the axis is the whole, always. */
const AXIS_MAX = 100;

const LINE_COLOR = "#0f766e";

function dimsFor(width: number): PlotDims {
  return {
    width,
    height: HEIGHT,
    padLeft: 40,
    padRight: 14,
    padTop: TITLE_GAP,
    padBottom: 24,
  };
}

/** Short `M/D` label for an ISO date (no timezone dependence). */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export interface CoveragePoint {
  date: string;
  /** Percent, 0–100. */
  value: number;
}

export interface CoverageChartProps {
  title: string;
  series: CoveragePoint[];
  /** The window's aggregate rate, drawn as the dashed reference line. */
  averagePct?: number;
  width?: number;
}

/** Bind the coverage chart to one set of SVG primitives. */
export function buildCoverageChart(p: ChartPrimitives): {
  CoverageChart: (props: CoverageChartProps) => ReactElement;
} {
  const { Svg, G, Rect, Line, Polyline, Text, rootProps } = p;
  const font = p.textFont ? { fontFamily: p.textFont } : {};

  function CoverageChart({
    title,
    series,
    averagePct,
    width = PAGE_WIDTH,
  }: CoverageChartProps): ReactElement {
    const dims = dimsFor(width);
    const values = series.map((pt) => pt.value);
    const dates = series.map((pt) => pt.date);
    const ticks = yTicks(AXIS_MAX, 4, dims);
    const baseline = dims.height - dims.padBottom;
    const pts = linePoints(values, AXIS_MAX, dims);
    // Up to 5 evenly-spaced x labels (3 on a narrow chart), always including the
    // first and last day so the range is readable off the axis itself.
    const n = dates.length;
    const wanted = width < 300 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
    const labelIdx =
      n <= 1 ? dates.map((_, i) => i) : wanted.map((f) => Math.round((n - 1) * f));
    const avgY =
      averagePct == null ? null : scaleY(averagePct, AXIS_MAX, dims);
    // The reference label sits at the LEFT end of its line, on whichever side the
    // series is not: with the label pinned to one side it ends up struck through
    // by the line whenever the series happens to finish near the average. The
    // opening quarter decides, since that is where the label goes.
    const opening = values.slice(0, Math.max(1, Math.ceil(n / 4)));
    const openingMean =
      opening.reduce((s, v) => s + v, 0) / Math.max(1, opening.length);
    const labelBelow = averagePct != null && openingMean >= averagePct;
    const labelY = avgY == null ? 0 : labelBelow ? avgY + 10 : avgY - 4;

    return (
      <Svg {...rootProps(width, dims.height + 16)}>
        <Text x={0} y={9} style={{ fontSize: 9, ...font }} fill={BODY_TEXT_HEX}>
          {title}
        </Text>
        {n === 0 ? (
          <Text
            x={width / 2}
            y={dims.height / 2}
            style={{ fontSize: 9, ...font }}
            fill={MUTED_TEXT_HEX}
            textAnchor="middle"
          >
            No days in this range
          </Text>
        ) : (
          <G>
            {ticks.map((t, i) => (
              <G key={`t${i}`}>
                <Line
                  x1={dims.padLeft}
                  y1={t.y}
                  x2={dims.width - dims.padRight}
                  y2={t.y}
                  stroke={RULE_HEX}
                  strokeWidth={0.5}
                />
                <Text
                  x={dims.padLeft - 5}
                  y={t.y + 3}
                  style={{ fontSize: 7, ...font }}
                  fill={MUTED_TEXT_HEX}
                  textAnchor="end"
                >
                  {`${Math.round(t.value)}%`}
                </Text>
              </G>
            ))}
            {[...new Set(labelIdx)].map((idx) => (
              <Text
                key={`x${idx}`}
                x={scaleX(idx, n, dims)}
                y={baseline + 12}
                style={{ fontSize: 7, ...font }}
                fill={MUTED_TEXT_HEX}
                textAnchor="middle"
              >
                {shortDate(dates[idx])}
              </Text>
            ))}
            {avgY == null ? null : (
              <G>
                <Line
                  x1={dims.padLeft}
                  y1={avgY}
                  x2={dims.width - dims.padRight}
                  y2={avgY}
                  stroke={MUTED_TEXT_HEX}
                  strokeWidth={0.75}
                  strokeDasharray="3 2"
                />
                {/* A white pad behind the label so it stays legible where the
                    reference line crosses a gridline. */}
                <Rect
                  x={dims.padLeft + 2}
                  y={labelY - 7}
                  width={52}
                  height={10}
                  fill="#FFFFFF"
                />
                <Text
                  x={dims.padLeft + 4}
                  y={labelY}
                  style={{ fontSize: 7, ...font }}
                  fill={MUTED_TEXT_HEX}
                >
                  {/* One decimal, the same as the headline stat: the reference
                      line exists to agree with that number, so it has to print
                      the same string. */}
                  {`avg ${Math.round((averagePct ?? 0) * 10) / 10}%`}
                </Text>
              </G>
            )}
            <Polyline
              points={polylineString(pts)}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={1.5}
            />
          </G>
        )}
      </Svg>
    );
  }

  return { CoverageChart };
}
