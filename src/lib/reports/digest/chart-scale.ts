/**
 * Pure geometry for the hand-built digest charts - no React, no react-pdf.
 *
 * Turns a numeric series plus a plot box into pixel coordinates: a "nice" axis
 * max, evenly-spaced x positions, y positions scaled to the axis, a polyline
 * string for line charts, bar rectangles for bar charts, and y-axis ticks.
 * Isolated here so the coordinate math is unit-testable without rendering a PDF.
 */

/** Commodity / series colors for digest charts (shared by PDF + email SVG). */
export const CHART_COLORS = {
  oil: "#800000",
  gas: "#4169e1",
  water: "#0891b2",
  revenue: "#059669",
} as const;

export interface PlotDims {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Bar {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Tick {
  value: number;
  y: number;
}

const plotWidth = (d: PlotDims): number => d.width - d.padLeft - d.padRight;
const plotHeight = (d: PlotDims): number => d.height - d.padTop - d.padBottom;

/**
 * Round a positive value up to a "nice" axis maximum (1, 2, 2.5, 5, or 10 times
 * a power of ten). A max of 0 or less returns 1 so charts of an all-zero series
 * still have a valid, non-degenerate axis.
 */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}

/** The largest value in a series (0 for an empty series). */
export function seriesMax(values: number[]): number {
  return values.reduce((m, v) => (v > m ? v : m), 0);
}

/** X pixel for the i-th of `count` evenly-spaced points (count 1 → centered). */
export function scaleX(index: number, count: number, d: PlotDims): number {
  const w = plotWidth(d);
  if (count <= 1) return d.padLeft + w / 2;
  return d.padLeft + (w * index) / (count - 1);
}

/** Y pixel for `value` against `max` (value 0 → baseline, max → top). */
export function scaleY(value: number, max: number, d: PlotDims): number {
  const h = plotHeight(d);
  const m = max > 0 ? max : 1;
  const clamped = value < 0 ? 0 : value;
  return d.padTop + h - (h * clamped) / m;
}

/** Line-chart points for a series scaled to a nice max. */
export function linePoints(
  values: number[],
  max: number,
  d: PlotDims
): Point[] {
  return values.map((v, i) => ({
    x: scaleX(i, values.length, d),
    y: scaleY(v, max, d),
  }));
}

/** A react-pdf `<Polyline points>` string ("x,y x,y ..."). */
export function polylineString(points: Point[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

/**
 * Bar rectangles for a series scaled to a nice max. Bars are centered in evenly-
 * spaced slots with `gapRatio` (0–1) of each slot left as gap.
 */
export function bars(
  values: number[],
  max: number,
  d: PlotDims,
  gapRatio = 0.3
): Bar[] {
  const w = plotWidth(d);
  const n = values.length;
  if (n === 0) return [];
  const slot = w / n;
  const barW = slot * (1 - gapRatio);
  const baseline = d.padTop + plotHeight(d);
  return values.map((v, i) => {
    const y = scaleY(v, max, d);
    return {
      x: d.padLeft + slot * i + (slot - barW) / 2,
      y,
      w: barW,
      h: Math.max(0, baseline - y),
    };
  });
}

/** Evenly-spaced y-axis ticks from 0 to `max` (inclusive), `count` intervals. */
export function yTicks(max: number, count: number, d: PlotDims): Tick[] {
  const m = max > 0 ? max : 1;
  const n = count < 1 ? 1 : count;
  const ticks: Tick[] = [];
  for (let i = 0; i <= n; i++) {
    const value = (m * i) / n;
    ticks.push({ value, y: scaleY(value, m, d) });
  }
  return ticks;
}

/** Round to 2 decimals to keep SVG coordinate strings compact. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Pie geometry -----------------------------------------------------------

/** A pie slice, ready to render as an SVG path. */
export interface Slice {
  label: string;
  value: number;
  /** Share of the total, 0..1. */
  share: number;
  /** SVG path for the wedge (move to centre, arc, close). */
  path: string;
  /** Where a leader label sits, just outside the arc's midpoint. */
  labelX: number;
  labelY: number;
  /** Index into the caller's color ramp. */
  colorIndex: number;
}

/** A point on a circle at `angle` radians, measured clockwise from 12 o'clock. */
function onCircle(
  cx: number,
  cy: number,
  r: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + r * Math.sin(angle),
    y: cy - r * Math.cos(angle),
  };
}

/** Round to 2dp so the emitted path strings stay short and stable. */
const r2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Wedge paths for a pie chart, largest slice first, starting at 12 o'clock and
 * running clockwise.
 *
 * Slices with a non-positive value are dropped (a lease that produced nothing has
 * no wedge, and a zero-width wedge renders as a stray line). An all-zero or empty
 * input returns `[]`, which the renderer shows as a "no data" note rather than an
 * empty circle. A single 100% slice is emitted as two half-arcs, because SVG's
 * arc command cannot describe a full circle in one sweep (start and end points
 * would coincide and most renderers draw nothing).
 */
export function pieSlices(
  data: { label: string; value: number }[],
  cx: number,
  cy: number,
  radius: number
): Slice[] {
  const usable = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = usable.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return [];

  const TAU = Math.PI * 2;
  let angle = 0;
  return usable.map((d, i) => {
    const share = d.value / total;
    const sweep = share * TAU;
    const start = angle;
    const end = angle + sweep;
    const mid = angle + sweep / 2;
    angle = end;

    const p0 = onCircle(cx, cy, radius, start);
    const p1 = onCircle(cx, cy, radius, end);
    const label = onCircle(cx, cy, radius * 1.18, mid);

    // A full circle needs two arcs; anything else is one arc, with the
    // large-arc flag set past a half turn.
    const path =
      share >= 0.999
        ? [
            `M ${r2(cx)} ${r2(cy - radius)}`,
            `A ${r2(radius)} ${r2(radius)} 0 0 1 ${r2(cx)} ${r2(cy + radius)}`,
            `A ${r2(radius)} ${r2(radius)} 0 0 1 ${r2(cx)} ${r2(cy - radius)}`,
            "Z",
          ].join(" ")
        : [
            `M ${r2(cx)} ${r2(cy)}`,
            `L ${r2(p0.x)} ${r2(p0.y)}`,
            `A ${r2(radius)} ${r2(radius)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${r2(p1.x)} ${r2(p1.y)}`,
            "Z",
          ].join(" ");

    return {
      label: d.label,
      value: d.value,
      share,
      path,
      labelX: r2(label.x),
      labelY: r2(label.y),
      colorIndex: i,
    };
  });
}

/**
 * Categorical ramp for pie slices - one hue per lease/well, ordered so adjacent
 * wedges stay distinguishable in greyscale as well as in colour (these documents
 * get printed). Wraps if there are more slices than colours.
 */
export const PIE_COLORS = [
  "#800000",
  "#4169e1",
  "#0891b2",
  "#059669",
  "#b45309",
  "#6d28d9",
  "#be123c",
  "#0f766e",
  "#a16207",
  "#1e3a8a",
] as const;

/** The colour for slice `i`, wrapping the ramp. */
export function sliceColor(i: number): string {
  return PIE_COLORS[i % PIE_COLORS.length];
}
