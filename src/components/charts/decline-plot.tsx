"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { monthTickLabel } from "@/lib/charts/date-ticks";
import type { DeclineRow } from "@/lib/charts/decline-rows";

/**
 * THE decline plot — the filed monthly rate, the fitted Arps curve over it
 * (the ramp up to the peak, when the history has one, then the decline), and
 * the tooltip that reads the decline off that curve.
 *
 * Extracted from the facility chart (`components/wells/production-chart.tsx`)
 * so the dashboard draws the SAME plot rather than its own lookalike. It had its
 * own before: different colours, a solid fit line, no per-month decline in the
 * tooltip, and a projection of a different length. Two implementations of one
 * chart is two chances to be wrong about the same well.
 *
 * Deliberately NOT a card. The facility chart wraps it in one with a view
 * picker; the dashboard drops it into the card it already has, with its own
 * title menu and well filter. Whatever owns the surround owns it.
 */

/** Grey for what was filed, blue for what was fitted — one pair everywhere. */
export const DECLINE_RATE_COLOR = "#94a3b8";
export const DECLINE_FIT_COLOR = "#0ea5e9";

const rateFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});
const declinePercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
const tooltipMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** The chart config both series read their colour from. */
export function declineChartConfig(rateLabel: string): ChartConfig {
  return {
    actual: { label: rateLabel, color: DECLINE_RATE_COLOR },
    fit: { label: "Arps curve", color: DECLINE_FIT_COLOR },
  };
}

export function DeclineTooltip({
  active,
  payload,
  rateLabel,
}: {
  active?: boolean;
  payload?: { payload?: DeclineRow }[];
  rateLabel: string;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const rows: { label: string; value: string; color: string }[] = [];
  if (row.actual != null) {
    rows.push({
      label: rateLabel,
      value: rateFormat.format(row.actual),
      color: DECLINE_RATE_COLOR,
    });
  }
  if (row.fit != null) {
    rows.push({
      label: "Arps curve",
      value: rateFormat.format(row.fit),
      color: DECLINE_FIT_COLOR,
    });
  }
  if (rows.length === 0) return null;

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">
        {tooltipMonthFormatter.format(new Date(`${row.month}-01T00:00:00Z`))}
      </div>
      <div className="grid gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex w-full items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: r.color }}
            />
            <div className="flex flex-1 items-center justify-between gap-3 leading-none">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {r.value}
              </span>
            </div>
          </div>
        ))}
        {row.decline != null ? (
          // Below the series, with no swatch: it is read OFF the fitted curve
          // rather than drawn beside it. Per year, because a decline quoted
          // without its period is meaningless. On the ramp up to the peak the
          // rate is rising, so the row is labelled for what it is and the
          // sign is dropped: "Incline 35%/yr", not "Decline −35%/yr".
          <div className="flex w-full items-center justify-between gap-3 border-t pt-1.5 leading-none">
            <span className="text-muted-foreground">
              {row.decline < 0 ? "Incline" : "Decline"}
            </span>
            <span className="font-mono font-medium tabular-nums text-foreground">
              {declinePercent.format(Math.abs(row.decline))}/yr
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The plot alone, for a caller that supplies its own `ChartContainer`. */
export function DeclinePlotBody({
  rows,
  rateLabel,
  logScale = false,
}: {
  rows: DeclineRow[];
  /** e.g. "Monthly rate (bbl/d)" — carries the unit, so it can't be assumed. */
  rateLabel: string;
  logScale?: boolean;
}) {
  return (
    <ComposedChart
      data={rows as unknown as Record<string, string | number>[]}
      margin={{ left: 12, right: 12, top: 8 }}
    >
      <CartesianGrid vertical={false} syncWithTicks />
      <XAxis
        dataKey="month"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={32}
        tickFormatter={(v) => monthTickLabel(String(v))}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={48}
        scale={logScale ? "log" : "auto"}
        domain={logScale ? ["auto", "auto"] : undefined}
        allowDataOverflow={logScale}
      />
      <ChartTooltip content={<DeclineTooltip rateLabel={rateLabel} />} />
      <Line
        dataKey="actual"
        type="monotone"
        stroke="var(--color-actual)"
        strokeWidth={2}
        dot={{ r: 2 }}
        connectNulls={false}
      />
      {/* Dashed, always: the fitted curve is a model, and it must not read as
          another measured series next to the one it was fitted to. */}
      <Line
        dataKey="fit"
        type="monotone"
        stroke="var(--color-fit)"
        strokeWidth={2}
        strokeDasharray="5 4"
        dot={false}
        connectNulls
      />
    </ComposedChart>
  );
}

/** The plot plus its container — what a caller without one of its own wants. */
export function DeclinePlot({
  rows,
  rateLabel,
  logScale = false,
  className = "aspect-auto h-[320px] w-full",
}: {
  rows: DeclineRow[];
  rateLabel: string;
  logScale?: boolean;
  className?: string;
}) {
  return (
    <ChartContainer config={declineChartConfig(rateLabel)} className={className}>
      <DeclinePlotBody rows={rows} rateLabel={rateLabel} logScale={logScale} />
    </ChartContainer>
  );
}
