/**
 * The digest's charts, drawn once against a swappable set of SVG primitives.
 *
 * The same chart has to appear in two places that cannot share a renderer: the
 * PDF (react-pdf's `<Svg>` primitives, Node only) and the browser (real DOM
 * `<svg>` elements). Writing them twice guarantees they drift - a padding here,
 * a legend column width there - and then "the preview" stops being a preview.
 * So the drawing lives here exactly once, parameterized by which element set to
 * emit; `./charts` binds it to react-pdf and `./charts-dom` binds it to the DOM,
 * and the two renders are identical by construction.
 *
 * Every coordinate still comes from the pure `./chart-scale` helpers; this file
 * only maps those coordinates onto elements. It imports NO renderer, so it is
 * safe on both sides.
 *
 * Every trend is a BAR chart (client spec, 2026-07-26): a bar per day reads as
 * "what did this day produce", which is how an operator thinks about a daily
 * digest, and it degrades honestly when a day is missing (no bar, rather than a
 * line interpolating across the gap). The line chart is kept for the HTML email
 * path, which is unchanged.
 */

import type { ComponentType, ReactElement } from "react";
import { BODY_TEXT_HEX, MUTED_TEXT_HEX, RULE_HEX } from "@/lib/export/style";
import type { DigestDailyPoint } from "@/lib/reports/digest/types";
import {
  bars,
  linePoints,
  niceCeil,
  pieSlices,
  polylineString,
  scaleX,
  seriesMax,
  sliceColor,
  yTicks,
  CHART_COLORS,
  type PlotDims,
} from "@/lib/reports/digest/chart-scale";

export { CHART_COLORS };

const WIDTH = 520;
const HEIGHT = 184;

/**
 * Gap between a chart's title baseline (y=9) and the top of its plot. The title
 * sat almost on the first gridline before; a chart reads as a titled block only
 * when the title has air under it.
 */
const TITLE_GAP = 28;

/**
 * Widths for two charts sharing a row (the page's content box is 508pt). A trend
 * chart carries ~90 daily bars and needs the room; a pie is a circle plus its
 * legend, so it reads fine in the remaining third.
 */
export const WIDE_WIDTH = 332;
export const NARROW_WIDTH = 168;

/**
 * The elements a chart is built from. react-pdf's `Svg`/`G`/`Rect`/… and the DOM's
 * `svg`/`g`/`rect`/… take the same props for everything used here (`x`, `y`,
 * `fill`, `stroke`, `strokeWidth`, `textAnchor`, `style.fontSize`), which is what
 * makes one implementation possible.
 */
export interface ChartPrimitives {
  /** Root element; receives whatever `rootProps` returns for a given size. */
  Svg: ComponentType<Record<string, unknown>>;
  G: ComponentType<Record<string, unknown>>;
  Rect: ComponentType<Record<string, unknown>>;
  Line: ComponentType<Record<string, unknown>>;
  Path: ComponentType<Record<string, unknown>>;
  Polyline: ComponentType<Record<string, unknown>>;
  Text: ComponentType<Record<string, unknown>>;
  /** Root props for a chart of this intrinsic size (react-pdf wants width and
   *  height; the DOM wants a viewBox so the chart scales to its container). */
  rootProps: (width: number, height: number) => Record<string, unknown>;
  /**
   * Typeface for the chart's own labels. react-pdf resolves a font per text
   * node, so the PDF binding has to name it here or the axis reverts to the
   * built-in Helvetica while the rest of the page is Figtree; the DOM binding
   * sets it once on the `<svg>` and leaves this undefined.
   */
  textFont?: string;
}

/**
 * Plot box for a chart of `width`. Half-width charts (two side by side on a lease
 * page) keep the same paddings - the axis labels are the same size whatever the
 * chart's width, so shrinking the gutters would clip them.
 */
function dimsFor(width: number, height = HEIGHT): PlotDims {
  return {
    width,
    height,
    padLeft: 44,
    padRight: 12,
    padTop: TITLE_GAP,
    padBottom: 24,
  };
}

const DIMS: PlotDims = dimsFor(WIDTH);

/**
 * Shorten a label to `max` characters, dropping the MIDDLE rather than the tail.
 *
 * Facility names share long prefixes and differ at the end ("Ellenburger Deep
 * Unit A #3" vs "... B #1"), so a tail truncation renders every slice of a lease
 * identically. Keeping both ends keeps them distinguishable.
 */
function shorten(label: string, max: number): string {
  if (label.length <= max) return label;
  // Favour the tail: that is where the well number lives.
  const tail = Math.max(6, Math.ceil((max - 1) / 2));
  const head = max - 1 - tail;
  return `${label.slice(0, head).trimEnd()}…${label.slice(-tail)}`;
}

/** Compact number label for axis ticks (1.2k, 3.4M, or a small integer). */
function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${round1(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${round1(n / 1_000)}k`;
  return `${Math.round(n)}`;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Short `M/D` label for an ISO date (no timezone dependence). */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** True when a series has nothing worth plotting (no points, or all flat zero). */
function isEmptySeries(series: DigestDailyPoint[]): boolean {
  return series.length === 0 || series.every((p) => p.value === 0);
}

export interface BarChartProps {
  title: string;
  series: DigestDailyPoint[];
  color?: string;
  /** Legend label for the first series; only shown when `second` is present. */
  label?: string;
  /** A second series drawn beside the first, sharing the axis. */
  second?: { series: DigestDailyPoint[]; color: string; label: string };
  width?: number;
}

export interface PieChartProps {
  title: string;
  data: { label: string; value: number }[];
  /** Formats a slice's value for the legend (e.g. currency or barrels). */
  format?: (n: number) => string;
  width?: number;
}

export interface LineChartProps {
  title: string;
  series: DigestDailyPoint[];
  color?: string;
}

/** Bind the charts to one set of SVG primitives. */
export function buildDigestCharts(p: ChartPrimitives): {
  BarChart: (props: BarChartProps) => ReactElement;
  PieChart: (props: PieChartProps) => ReactElement;
  LineChart: (props: LineChartProps) => ReactElement;
} {
  const { Svg, G, Rect, Line, Path, Polyline, Text, rootProps } = p;
  const font = p.textFont ? { fontFamily: p.textFont } : {};

  /** Centered "no data" note so an empty chart reads as intentional, not broken. */
  function EmptyNote({ width = WIDTH }: { width?: number }): ReactElement {
    return (
      <Text
        x={width / 2}
        y={HEIGHT / 2 + 8}
        style={{ fontSize: 9, ...font }}
        fill={MUTED_TEXT_HEX}
        textAnchor="middle"
      >
        No production in this range
      </Text>
    );
  }

  function GridAndAxis({
    max,
    dates,
    dims = DIMS,
  }: {
    max: number;
    dates: string[];
    dims?: PlotDims;
  }): ReactElement {
    const ticks = yTicks(max, 4, dims);
    const baseline = dims.height - dims.padBottom;
    // Show up to 5 evenly-spaced x labels (always first + last when >1). A narrow
    // chart gets 3, otherwise the dates collide.
    const n = dates.length;
    const wanted = dims.width < 300 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
    const labelIdx =
      n <= 1 ? dates.map((_, i) => i) : wanted.map((f) => Math.round((n - 1) * f));
    const uniqueIdx = [...new Set(labelIdx)];
    return (
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
              {compact(t.value)}
            </Text>
          </G>
        ))}
        {uniqueIdx.map((idx) => (
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
      </G>
    );
  }

  /** A titled line chart of one daily series. */
  function LineChart({
    title,
    series,
    color = CHART_COLORS.oil,
  }: LineChartProps): ReactElement {
    const values = series.map((pt) => pt.value);
    const dates = series.map((pt) => pt.date);
    const max = niceCeil(seriesMax(values));
    const pts = linePoints(values, max, DIMS);
    return (
      <Svg {...rootProps(WIDTH, HEIGHT + 16)}>
        <Text x={0} y={9} style={{ fontSize: 9, ...font }} fill={BODY_TEXT_HEX}>
          {title}
        </Text>
        <G>
          {isEmptySeries(series) ? (
            <EmptyNote />
          ) : (
            <>
              <GridAndAxis max={max} dates={dates} />
              <Polyline
                points={polylineString(pts)}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
              />
            </>
          )}
        </G>
      </Svg>
    );
  }

  /**
   * A titled pie chart with a legend beside it: share of a total by category
   * (revenue by lease, well allocation within a lease).
   *
   * Sized to sit next to its legend rather than above it, so a lease section can
   * carry a bar chart and a pie side by side without spilling onto a second page.
   * An empty or all-zero input renders the same "no data" note the trend charts
   * use, never an empty circle.
   */
  function PieChart({
    title,
    data,
    format = (n: number) => String(Math.round(n)),
    width = WIDTH,
  }: PieChartProps): ReactElement {
    // Narrow (sharing a row with another chart): smaller circle, legend beneath it
    // rather than beside, because there is no room for a column of labels.
    const narrow = width < 300;
    const radius = narrow ? 40 : 52;
    const cx = narrow ? width / 2 : radius + 8;
    const cy = radius + TITLE_GAP + 8;
    const slices = pieSlices(data, cx, cy, radius);
    const height = narrow
      ? cy + radius + 14 + slices.length * 11
      : cy + radius + 8;

    return (
      <Svg {...rootProps(width, height)}>
        <Text x={0} y={9} style={{ fontSize: 9, ...font }} fill={BODY_TEXT_HEX}>
          {title}
        </Text>
        {slices.length === 0 ? (
          <Text
            x={width / 2}
            y={height / 2}
            style={{ fontSize: 9, ...font }}
            fill={MUTED_TEXT_HEX}
            textAnchor="middle"
          >
            Nothing to allocate in this range
          </Text>
        ) : (
          <G>
            {slices.map((slice, i) => (
              <Path
                key={i}
                d={slice.path}
                fill={sliceColor(slice.colorIndex)}
                stroke="#FFFFFF"
                strokeWidth={0.75}
              />
            ))}
            {/* Legend: swatch, label, value, share. Beside the circle when wide,
                stacked beneath it when narrow. Two columns once it is long. */}
            {slices.map((slice, i) => {
              const perColumn = 6;
              const col = narrow ? 0 : Math.floor(i / perColumn);
              const rowY = narrow
                ? cy + radius + 16 + i * 11
                : TITLE_GAP + 8 + (i % perColumn) * 13;
              const x = narrow ? 2 : radius * 2 + 26 + col * 190;
              return (
                <G key={`l${i}`}>
                  <Rect
                    x={x}
                    y={rowY - 6}
                    width={7}
                    height={7}
                    fill={sliceColor(slice.colorIndex)}
                  />
                  <Text
                    x={x + 12}
                    y={rowY}
                    style={{ fontSize: 7.5, ...font }}
                    fill={BODY_TEXT_HEX}
                  >
                    {`${shorten(slice.label, narrow ? 22 : 28)}  ${format(slice.value)} (${Math.round(slice.share * 100)}%)`}
                  </Text>
                </G>
              );
            })}
          </G>
        )}
      </Svg>
    );
  }

  /**
   * A titled bar chart of one or two daily series.
   *
   * Two series (oil with water on the same chart, per the client) are drawn as
   * grouped bars on a SHARED axis, with a legend. Shared is the honest choice
   * here: both are barrels, so "we make three times more water than oil" is the
   * insight, and a second axis would flatter the smaller stream into looking
   * comparable.
   *
   * `width` lets two charts share a row (see {@link WIDE_WIDTH}).
   */
  function BarChart({
    title,
    series,
    color = CHART_COLORS.revenue,
    label,
    second,
    width = WIDTH,
  }: BarChartProps): ReactElement {
    const dims = dimsFor(width);
    const values = series.map((pt) => pt.value);
    const dates = series.map((pt) => pt.date);
    const secondValues = second?.series.map((pt) => pt.value) ?? [];
    // One axis across both series, so the bars are comparable.
    const max = niceCeil(Math.max(seriesMax(values), seriesMax(secondValues)));
    const empty =
      isEmptySeries(series) && (!second || isEmptySeries(second.series));

    const primary = bars(values, max, dims);
    const secondary = second ? bars(secondValues, max, dims) : [];
    // Grouped: each day's slot is split in two, first series on the left.
    const half = (b: { w: number }): number => (second ? b.w / 2 : b.w);
    const legendY = dims.height + 11;

    return (
      <Svg {...rootProps(width, dims.height + (second ? 26 : 16))}>
        <Text x={0} y={9} style={{ fontSize: 9, ...font }} fill={BODY_TEXT_HEX}>
          {title}
        </Text>
        <G>
          {empty ? (
            <EmptyNote width={width} />
          ) : (
            <>
              <GridAndAxis max={max} dates={dates} dims={dims} />
              {primary.map((b, i) => (
                <Rect
                  key={`p${i}`}
                  x={b.x}
                  y={b.y}
                  width={half(b)}
                  height={b.h}
                  fill={color}
                />
              ))}
              {secondary.map((b, i) => (
                <Rect
                  key={`s${i}`}
                  x={b.x + b.w / 2}
                  y={b.y}
                  width={b.w / 2}
                  height={b.h}
                  fill={second!.color}
                />
              ))}
              {second ? (
                <G>
                  <Rect
                    x={dims.padLeft}
                    y={legendY - 6}
                    width={7}
                    height={7}
                    fill={color}
                  />
                  <Text
                    x={dims.padLeft + 11}
                    y={legendY}
                    style={{ fontSize: 7.5, ...font }}
                    fill={BODY_TEXT_HEX}
                  >
                    {label ?? "Series 1"}
                  </Text>
                  <Rect
                    x={dims.padLeft + 82}
                    y={legendY - 6}
                    width={7}
                    height={7}
                    fill={second.color}
                  />
                  <Text
                    x={dims.padLeft + 93}
                    y={legendY}
                    style={{ fontSize: 7.5, ...font }}
                    fill={BODY_TEXT_HEX}
                  >
                    {second.label}
                  </Text>
                </G>
              ) : null}
            </>
          )}
        </G>
      </Svg>
    );
  }

  return { BarChart, PieChart, LineChart };
}
