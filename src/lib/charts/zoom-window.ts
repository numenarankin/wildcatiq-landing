/**
 * A scroll-wheel step over a window of monthly rows.
 *
 * The window is a start index and a span over an oldest-first series. Zooming
 * IN narrows the span, zooming OUT widens it, and the month under the cursor
 * stays under the cursor: `anchor` is where the pointer sits across the plot,
 * 0 at the left edge and 1 at the right, and the month there before the step
 * is the month there after it, to the nearest row.
 *
 * `ZOOM_STEP` is the span ratio per wheel notch; `MIN_SPAN` is where zooming
 * in stops, because a chart of two months is a chart of one line segment.
 */
export const ZOOM_STEP = 1.25;
export const MIN_SPAN = 3;

export interface ZoomWindow {
  start: number;
  span: number;
}

export function zoomWindow(
  current: ZoomWindow,
  total: number,
  direction: "in" | "out",
  anchor: number
): ZoomWindow {
  if (total <= 0) return { start: 0, span: 0 };
  const frac = Math.min(1, Math.max(0, anchor));
  const want = direction === "in" ? current.span / ZOOM_STEP : current.span * ZOOM_STEP;
  const span = Math.min(total, Math.max(Math.min(MIN_SPAN, total), Math.round(want)));
  // The row under the cursor, before and after, as an index into the series.
  const anchorRow = current.start + frac * (current.span - 1);
  let start = Math.round(anchorRow - frac * (span - 1));
  start = Math.min(total - span, Math.max(0, start));
  return { start, span };
}
