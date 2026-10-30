"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDownIcon, Settings2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO, format } from "date-fns";
import {
  AverageLine,
  AverageSwitch,
  CustomRangeFields,
  FullscreenChartOverlay,
  FullscreenToggle,
  RangePresets,
  averageFooter,
  averageLegendItem,
  useFullscreenCard,
  type AverageSpec,
} from "@/components/charts/chart-chrome";
import { useChartPrefs } from "@/components/charts/chart-prefs-context";
import { meanOf } from "@/lib/charts/average";
import {
  PRODUCTION_RANGES,
  bucketDaysFor,
  bucketRows,
  resolveDefaultRange,
  windowRows,
  type CustomRange,
} from "@/lib/charts/ranges";
import { cn } from "@/lib/utils";
import type { ProductionPoint } from "@/lib/wells/wells";
import type { FinancialPoint } from "@/lib/accounting/types";
import {
  dailyProduction,
  type Segment,
  type SeriesMode,
} from "@/lib/tanks/tank-series";
import {
  completeMonths,
  fitDecline,
  withoutDailyOutliers,
  type FitOpts,
  type MonthlyRate,
} from "@/lib/wells/arps";
import {
  declineChartRows,
  defaultDeclineWindow,
  monthOrdinal,
  ordinalToYm,
  type DeclineRow,
} from "@/lib/charts/decline-rows";
import {
  DeclinePlotBody,
  DECLINE_FIT_COLOR,
  DECLINE_RATE_COLOR,
} from "@/components/charts/decline-plot";
import {
  dateTickLabel,
  monthTickLabel,
  needsYearTicks,
} from "@/lib/charts/date-ticks";
import { pricesOn, type DatedPrices } from "@/lib/pricing/dated-prices";

type View =
  | "production"
  | "production-gas"
  | "production-water"
  | "economics"
  | "level"
  | "level-water"
  | "decline"
  | "decline-gas";

const productionConfig = {
  oil: { label: "Oil (bbl/d)", color: "#059669" },
  gas: { label: "Gas (MCF/d)", color: "#800000" },
  water: { label: "Water (bbl/d)", color: "#0369a1" },
  ema7: { label: "7-day EMA", color: "#f59e0b" },
  ema14: { label: "14-day EMA", color: "#7c3aed" },
  // Secondary-commodity (right-axis) EMAs — their own colors so oil and gas EMAs
  // never collide on a dual-axis chart (e.g. a lease's oil + gas).
  ema7Sec: { label: "7-day EMA", color: "#0d9488" },
  ema14Sec: { label: "14-day EMA", color: "#0891b2" },
} satisfies ChartConfig;

/** Capitalize a commodity for legend labels ("oil" → "Oil"). */
function cap(c: Commodity): string {
  return c === "oil" ? "Oil" : c === "gas" ? "Gas" : "Water";
}

/** Which commodity carries the chart's PRIMARY (left-axis) series — the one that
 *  gets EMAs and the log-scale guard. Oil for tanks/wells/leases/batteries; gas
 *  for a metered gas chart. */
/*
 * Water is a commodity here in the charting sense only — a stream with its own
 * daily rate, unit and axis. It is never priced, never declined and never the
 * secondary series on someone else's axis; it gets its own entries in the
 * picker, exactly as oil and gas do on a split chart.
 */
type Commodity = "oil" | "gas" | "water";
const UNIT: Record<Commodity, string> = {
  oil: "bbl/d",
  gas: "MCF/d",
  water: "bbl/d",
};

const EMA_SHORT = 7;
const EMA_LONG = 14;

/** Streaming EMA state: null until `period` days, then seeded with their SMA. */
interface EmaState {
  period: number;
  k: number;
  seen: number;
  seed: number;
  value: number | null;
}
function emaStep(s: EmaState, v: number): number | null {
  s.seen += 1;
  if (s.seen < s.period) s.seed += v;
  else if (s.seen === s.period) {
    s.seed += v;
    s.value = s.seed / s.period;
  } else s.value = v * s.k + (s.value as number) * (1 - s.k);
  return s.value;
}
function newEma(period: number): EmaState {
  return { period, k: 2 / (period + 1), seen: 0, seed: 0, value: null };
}

/**
 * Attach 7- and 14-day exponential moving averages for BOTH the primary and the
 * secondary commodity, computed over the FULL series (before any range window) so
 * a value inside a visible window is seeded from prior data. Each EMA only STARTS
 * once its window is full (seeded with the SMA of its first N days), so neither
 * begins on day one. Only non-null days of that stream count toward its window;
 * gap days plot no point. `ema7`/`ema14` track the primary; `ema7Sec`/`ema14Sec`
 * track the secondary (so oil and gas each get their OWN EMAs on a dual chart).
 */
function withMovingAverages(rows: ProdRow[], primary: Commodity): ProdRow[] {
  const secondary: Commodity = primary === "oil" ? "gas" : "oil";
  const s7 = newEma(EMA_SHORT);
  const s14 = newEma(EMA_LONG);
  const s7Sec = newEma(EMA_SHORT);
  const s14Sec = newEma(EMA_LONG);
  return rows.map((r) => {
    const p = r[primary];
    const q = r[secondary];
    return {
      ...r,
      ema7: p == null ? null : emaStep(s7, p),
      ema14: p == null ? null : emaStep(s14, p),
      ema7Sec: q == null ? null : emaStep(s7Sec, q),
      ema14Sec: q == null ? null : emaStep(s14Sec, q),
    };
  });
}

const economicsConfig = {
  netRevenue: { label: "Net revenue", color: "#059669" },
} satisfies ChartConfig;

/** The NRI as it reads in the Revenue view's description ("78.12%"). */
const nriPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

/** A drawn point's label: its day, or the span it averages ("Mar 1 – Mar 7, 2026"). */
function bucketLabel(date: string, from: string | undefined): string {
  if (!from || from === date) return tooltipDateFormatter.format(new Date(date));
  const start = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(from));
  return `${start} – ${tooltipDateFormatter.format(new Date(date))}`;
}

/** Calendar days in the month of an ISO date. */
function daysInMonth(date: string): number {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const levelConfig = {
  bbls: { label: "Stock (bbl)", color: "#059669" },
} satisfies ChartConfig;

const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const tooltipMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const axisCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

interface ProdRow {
  date: string;
  oil: number | null;
  gas: number | null;
  water: number | null;
  ema7?: number | null;
  ema14?: number | null;
  /** EMAs of the SECONDARY commodity (right axis), when the chart is dual. */
  ema7Sec?: number | null;
  ema14Sec?: number | null;
}

interface EconRow {
  month: string;
  netRevenue: number;
}

interface LevelRow {
  date: string;
  bbls: number;
}

/**
 * The same window over MONTHLY rows (the economics view). Counted in months
 * rather than rows so the selector means the same span it does on the daily
 * views, and cut by the calendar rather than by row count so a month with no
 * revenue doesn't buy the window an extra month of history.
 */
function windowMonths<T extends { month: string }>(
  rows: T[],
  range: string,
  custom: CustomRange | null
): T[] {
  if (custom) {
    // Compared as `YYYY-MM` on both sides: a row's month is a full date in the
    // priced path ("2026-08-01") and a month key in the ledger one.
    const from = custom.from.slice(0, 7);
    const to = custom.to.slice(0, 7);
    return rows.filter(
      (r) => r.month.slice(0, 7) >= from && r.month.slice(0, 7) <= to
    );
  }
  const months =
    PRODUCTION_RANGES.find((r) => r.value === range)?.months ??
    Number.POSITIVE_INFINITY;
  if (!Number.isFinite(months) || rows.length === 0) return rows;
  const last = rows.reduce((m, r) => (r.month > m ? r.month : m), rows[0].month);
  const cutoff = ordinalToYm(monthOrdinal(last.slice(0, 7)) - (months - 1));
  return rows.filter((r) => r.month.slice(0, 7) >= cutoff);
}



export function ProductionChart({
  data,
  rawData,
  history,
  economics = [],
  segments,
  gasDaily,
  monthlyRates,
  gasMonthlyRates,
  prices,
  datedPrices,
  nri = null,
  levelSeries,
  levelCapacity = null,
  levelLabel = "Stock",
  waterDaily,
  waterLevelSeries,
  waterLevelCapacity = null,
  primary = "oil",
  singleAxis = false,
  splitCommodities = false,
  showRevenue = true,
  fitOpts,
}: {
  /** Daily production. When `segments`/`rawData` are absent this is shown as-is;
   * otherwise it is the REGULARIZED oil series (the toggle's "on" state). */
  data: ProductionPoint[];
  /** The RAW (un-regularized) oil counterpart of `data`, for aggregate charts
   * (well / lease / battery) that can't derive it client-side from segments.
   * Its presence enables the Regularize toggle; only its oil is read. */
  rawData?: ProductionPoint[];
  /**
   * Public-record production for the periods BEFORE `data` begins — the state's
   * monthly filings spread flat across their days (`rrc/lease-history.ts`).
   *
   * Seeded underneath the measured series so the chart opens on the lease's real
   * history instead of an empty graph. The two never overlap: the server cuts
   * this strictly before the first measured day, and a measured value wins on any
   * date that somehow appears in both. Estimated, so it feeds the plotted line
   * and the decline fit and nothing that is presented as a measurement.
   */
  history?: {
    oil: { date: string; value: number }[];
    gas: { date: string; value: number }[];
  };
  /** Monthly ledger revenue (fallback economics when no `prices` are supplied). */
  economics?: FinancialPoint[];
  /** Phase-2 oil segments — enables the raw/regularized toggle, derived client-side. */
  segments?: Segment[];
  /** Daily gas series (MCF/day) for the right axis, when metered separately. */
  gasDaily?: { date: string; mcf: number }[];
  /** Post-peak monthly oil rates for the decline trendline fit (primary/left axis). */
  monthlyRates?: MonthlyRate[];
  /** Post-peak monthly GAS rates (MCF/d) for a SECOND per-commodity Arps decline
   *  curve on the right axis. When present, the Decline view plots oil and gas
   *  declines together (used by the lease page). Absent → oil-only, unchanged. */
  gasMonthlyRates?: MonthlyRate[];
  /** Realized prices for the series-based economics view: today's, the fallback. */
  prices?: { oilPerBbl: number; gasPerMcf: number };
  /**
   * The same prices on each row's OWN date (`pricesOn`), so the revenue line
   * moves with the benchmark as well as with production. Without it every day
   * is valued at `prices`, and a flat field through a rally draws flat.
   */
  datedPrices?: DatedPrices;
  /**
   * The operator's net revenue interest in whatever this chart covers (0..1),
   * resolved by `operatorNri` / `facilityNri` so this and the page's revenue
   * stat card read the same position.
   *
   * Revenue is plotted NET of it. Production priced at the wellhead is what the
   * LEASE earned, and on a lease with royalty owners most of that leaves before
   * it is the operator's — a gross line under a "Revenue" heading overstated
   * every one of these charts.
   *
   * NULL (nobody has entered the interest) draws no line and says so, rather
   * than falling back to gross: that is the same overstatement, and it would be
   * the harder one to catch for wearing the right label. Ledger revenue is
   * unaffected — those rows are settled receipts, already net.
   */
  nri?: number | null;
  /** Stock (barrels on hand) over time — enables the Level view (tank/battery). */
  levelSeries?: LevelRow[];
  /**
   * Total shell capacity of whatever `levelSeries` sums, drawn on the Level view
   * as the line the stock cannot cross. Null when it is unknown — a line summed
   * over only the tanks that HAVE a capacity would sit below the real ceiling
   * and read as an overfill that never happened.
   */
  levelCapacity?: number | null;
  /** Label for the Level view option (defaults to "Stock"). */
  levelLabel?: string;
  /**
   * Daily produced-water rate (bbl/day) — adds a "Water production" option to
   * the picker.
   *
   * A separate prop rather than a third field on `data` because water arrives
   * from its own engine (the attribution graph / the water tanks' series), on
   * its own days, and pretending it shares the oil rows' dates would invent
   * zeros on every day nobody hauled.
   */
  waterDaily?: { date: string; bbls: number }[];
  /** Barrels of water on hand over time — adds a "Water stock" option. */
  waterLevelSeries?: LevelRow[];
  /** Shell capacity of whatever `waterLevelSeries` sums; null when unknown. */
  waterLevelCapacity?: number | null;
  /** Commodity of the PRIMARY (left-axis) series — "oil" (default) or "gas".
   *  Gas drives a metered gas chart: EMAs, decline, and log scale follow it. */
  primary?: Commodity;
  /** Plot the secondary commodity on the PRIMARY axis instead of a second one.
   *  Use when the two streams read on a comparable scale and a dual axis just
   *  adds confusion (e.g. a lease's oil + gas). */
  singleAxis?: boolean;
  /**
   * Give oil and gas a view each in the picker ("Oil" / "Gas") instead of one
   * combined "Production". Barrels and MCF are different units on different
   * scales, so on a lease the two together flattened the smaller stream; this
   * shows one commodity at a time, in the SAME chart card — the picker chooses
   * which, exactly as it chooses Revenue or a decline curve.
   */
  splitCommodities?: boolean;
  /**
   * Offer the Revenue view. A battery hides it: its oil is allocated out to the
   * member wells, so a revenue line drawn here would be a second, unreconciled
   * answer to a number the wells and the lease already report.
   */
  showRevenue?: boolean;
  /**
   * Override the Arps fit's thresholds. Production passes nothing and gets the
   * shipped tuning; `/dev/decline` passes its sliders so the curve on this exact
   * chart moves with them. Kept as a pass-through rather than a second fitting
   * path, so the lab cannot drift from what the app draws.
   */
  fitOpts?: FitOpts;
}) {
  /*
   * A water-only facility (a saltwater battery) has no oil series at all, so
   * opening on an empty "Production" graph would be a blank chart above a picker
   * whose other option holds everything. Open on the stream it actually has.
   */
  const waterOnly =
    data.length === 0 &&
    (rawData?.length ?? 0) === 0 &&
    (segments?.length ?? 0) === 0 &&
    (gasDaily?.length ?? 0) === 0 &&
    (history?.oil?.length ?? 0) === 0 &&
    (waterDaily?.length ?? 0) > 0;
  const [view, setView] = useState<View>(
    waterOnly ? "production-water" : "production"
  );

  // The primary (left-axis) series and its counterpart on the right axis. When
  // the commodities are split the picker decides the primary, and the other
  // stream is not drawn at all (`hasSecondary` below).
  const split = splitCommodities;
  const primaryKey: Commodity =
    view === "production-water"
      ? "water"
      : split
        ? view === "production-gas"
          ? "gas"
          : "oil"
        : primary;
  const secondaryKey: Commodity = primaryKey === "oil" ? "gas" : "oil";
  const hasLevel = levelSeries != null && levelSeries.length > 0;
  const hasWater = waterDaily != null && waterDaily.length > 0;
  const hasWaterLevel = waterLevelSeries != null && waterLevelSeries.length > 0;
  const hasGasDecline = gasMonthlyRates != null && gasMonthlyRates.length > 0;
  const hasPrimaryDecline = monthlyRates != null && monthlyRates.length > 0;
  /*
   * Whether the picker offers oil and gas decline separately. Gated on the same
   * flag that splits production, so the two halves of the card agree about
   * whether this facility has two commodities. A meter page passes its gas rates
   * as `monthlyRates` with `primary="gas"` and never splits, which is why the
   * view — not the commodity — chooses the series below.
   */
  const splitDecline = Boolean(splitCommodities) && hasGasDecline;
  const viewOptions: { value: View; label: string }[] = [
    ...(split
      ? [
          { value: "production" as View, label: "Oil production" },
          { value: "production-gas" as View, label: "Gas production" },
        ]
      : waterOnly
        ? // Nothing to plot under it, and no "Production" that means water.
          []
        : [
            {
              value: "production" as View,
              // Named when there is a second production view to tell it from.
              label: hasWater ? "Oil production" : "Production",
            },
          ]),
    ...(showRevenue
      ? [{ value: "economics" as View, label: "Net revenue" }]
      : []),
    /*
     * Water is two more OPTIONS, never a second chart under this one. Its
     * production and its level are the same two questions the oil half answers,
     * asked of the other fluid, so they belong in the same picker — a battery
     * holding both reads Oil production / Water production / Oil stock / Water
     * stock and draws exactly one of them.
     */
    ...(hasWater
      ? [{ value: "production-water" as View, label: "Water production" }]
      : []),
    ...(hasLevel
      ? [
          {
            value: "level" as View,
            // Two levels need telling apart; one does not.
            label: hasWaterLevel ? "Oil stock" : levelLabel,
          },
        ]
      : []),
    ...(hasWaterLevel
      ? [{ value: "level-water" as View, label: "Water stock" }]
      : []),
    /*
     * Oil and gas decline are two CHARTS, not two lines on one. They are
     * different units on different scales, and the dual axis they used to share
     * meant neither curve could be read against its own gridlines — the same
     * reason production splits above. One commodity, one axis, picked here.
     */
    ...(hasPrimaryDecline
      ? [
          {
            value: "decline" as View,
            label: splitDecline ? "Oil decline" : "Decline",
          },
        ]
      : []),
    ...(splitDecline
      ? [{ value: "decline-gas" as View, label: "Gas decline" }]
      : []),
  ];

  // Settings > Charts picks the opening preset (3M where the user has none)
  // and whether the average line starts drawn. Both are read once, at mount:
  // the gear's Average switch is this chart's own after that.
  const prefs = useChartPrefs();
  const [range, setRange] = useState<string>(() =>
    resolveDefaultRange(PRODUCTION_RANGES, prefs.defaultRange, "3M")
  );
  const [custom, setCustom] = useState<CustomRange | null>(null);
  const [showAverage, setShowAverage] = useState(prefs.averageLine);
  /*
   * The decline window, kept SEPARATE from the production one above.
   * Production defaults to a 3-month preset, which is meaningless for a decline
   * curve fitted over decades of monthly filings; and a decline range of
   * 2018-2024, carried into the production view, would silently window it and
   * hide its preset buttons (`showRange` turns off whenever a custom range is
   * set). Two windows because they are two questions.
   */
  const [declineRange, setDeclineRange] = useState<{
    from: string;
    to: string;
  } | null>(() =>
    // Opens on the last five years OF DATA (see `defaultDeclineWindow`), not on
    // everything: a lease's filings run back decades, and thirty years squeezed
    // onto one axis renders the recent history — the part a decline is read
    // from — as a few pixels against the left edge. Clearing the dates still
    // gives the full record. Computed once from the streams present at mount so
    // switching between Oil and Gas holds the span still rather than
    // re-framing the chart under the reader.
    defaultDeclineWindow([...(monthlyRates ?? []), ...(gasMonthlyRates ?? [])])
  );
  const [mode, setMode] = useState<SeriesMode>("regularized");
  // Default view: production line + the 14-day EMA. The 7-day is opt-in.
  const [showEma7, setShowEma7] = useState(false);
  const [showEma14, setShowEma14] = useState(true);
  const [logScale, setLogScale] = useState(false);
  const fs = useFullscreenCard();
  const fullscreen = fs.fullscreen;

  const isEconomics = view === "economics";
  const isWaterLevel = view === "level-water";
  const isLevel = view === "level" || isWaterLevel;
  const isGasDecline = view === "decline-gas";
  const isDecline = view === "decline" || isGasDecline;
  const isProduction =
    view === "production" ||
    view === "production-gas" ||
    view === "production-water";
  // Presence (not non-empty) signals a regularizable SERIES chart, so the toggle
  // shows even before any readings exist. `hasSegments` still gates the client
  // derivation path (it needs actual segments to resample).
  const hasSegments = segments != null && segments.length > 0;
  const isSeriesChart = segments != null || rawData != null;
  const hasRaw = rawData != null && rawData.length > 0;
  const regularizable = isSeriesChart;

  // --- Production rows -------------------------------------------------------
  const prodRows = useMemo<ProdRow[]>(() => {
    // History first, so a measured value for the same day overwrites it. The
    // server already guarantees no overlap; this makes the precedence explicit
    // rather than dependent on that guarantee holding forever.
    const oilByDate = new Map<string, number>();
    for (const p of history?.oil ?? []) oilByDate.set(p.date, p.value);
    if (hasSegments) {
      for (const p of dailyProduction(segments!, { mode }))
        oilByDate.set(p.date, p.bbls);
    } else if (hasRaw && mode === "raw") {
      for (const p of rawData!) oilByDate.set(p.date, p.oilProduction);
    } else {
      for (const p of data) oilByDate.set(p.date, p.oilProduction);
    }
    const gasByDate = new Map<string, number>();
    for (const p of history?.gas ?? []) gasByDate.set(p.date, p.value);
    if (gasDaily && gasDaily.length > 0) {
      for (const g of gasDaily) gasByDate.set(g.date, g.mcf);
    } else {
      // A recorded zero is a reading, not a missing day. Skipping falsy values
      // dropped every no-gas day on the floor, so a lease that measures gas and
      // makes none had no gas rows at all and its Gas chart came up blank.
      for (const p of data)
        if (p.gasProduction != null) gasByDate.set(p.date, p.gasProduction);
    }
    // Water on its OWN days: a day nobody hauled or gauged water is a day water
    // was not measured, not a zero-water day.
    const waterByDate = new Map<string, number>();
    for (const w of waterDaily ?? []) waterByDate.set(w.date, w.bbls);
    // Artifacts are not drawn: a negative day, or a day several times the days
    // around it (`withoutDailyOutliers`). Each stream is judged on its own.
    const cleaned = (byDate: Map<string, number>) =>
      new Map(
        withoutDailyOutliers(
          [...byDate.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, value]) => ({ date, value }))
        ).map((p) => [p.date, p.value] as const)
      );
    const oilClean = cleaned(oilByDate);
    const gasClean = cleaned(gasByDate);
    const waterClean = cleaned(waterByDate);
    const dates = [
      ...new Set([
        ...oilClean.keys(),
        ...gasClean.keys(),
        ...waterClean.keys(),
      ]),
    ].sort();
    return withMovingAverages(
      dates.map((date) => ({
        date,
        oil: oilClean.get(date) ?? null,
        gas: gasClean.get(date) ?? null,
        water: waterClean.get(date) ?? null,
      })),
      primaryKey
    );
  }, [
    hasSegments,
    segments,
    hasRaw,
    rawData,
    data,
    gasDaily,
    waterDaily,
    history,
    mode,
    primaryKey,
  ]);

  // Whether the non-primary commodity has data worth a second axis (a metered
  // gas chart has no oil, so it stays single-axis).
  // Split charts draw the selected commodity only — the other one has its own
  // entry in the picker, so plotting it here would put both back on one graph.
  const hasSecondary =
    !split &&
    // Water is drawn alone. It shares no axis with oil or gas: barrels of
    // saltwater against barrels of crude on one scale reads as though the two
    // were comparable quantities of the same thing.
    primaryKey !== "water" &&
    prodRows.some((r) => {
      const v = r[secondaryKey];
      return v != null && v > 0;
    });
  // A second Y-axis only when there's a secondary series AND we weren't asked to
  // keep everything on one axis. When single-axis, the secondary series (and its
  // EMAs) ride the primary axis.
  const dualAxis = hasSecondary && !singleAxis;
  const secondaryAxisId = dualAxis ? secondaryKey : primaryKey;

  // --- Decline fit ----------------------------------------------------------
  // The month still in progress is drawn but never fitted, as the dashboard's
  // fleet fit does: a few days' average is not a month's rate, and a low or
  // high partial month at the end of the series swung the curve.
  const fit = useMemo(() => {
    const rates = completeMonths(monthlyRates ?? []);
    return rates.length > 0 ? fitDecline(rates, fitOpts) : null;
  }, [monthlyRates, fitOpts]);
  // Second (gas) Arps fit for the lease's two-commodity decline chart.
  const gasFit = useMemo(() => {
    const rates = completeMonths(gasMonthlyRates ?? []);
    return rates.length > 0 ? fitDecline(rates, fitOpts) : null;
  }, [gasMonthlyRates, fitOpts]);
  // --- Decline rows ---------------------------------------------------------
  // ONE commodity, the one the picker chose. Selected by VIEW rather than by
  // commodity because a gas meter page passes its gas rates as `monthlyRates`
  // with `primary="gas"`: keying off the commodity would send it looking in
  // `gasMonthlyRates`, which that page does not pass, and empty its chart.
  //
  // The row/window arithmetic lives in `@/lib/charts/decline-rows` so it can be
  // checked against a hand-computed oracle without rendering a chart.
  const declineFit = isGasDecline ? gasFit : fit;
  const declineRows = useMemo<DeclineRow[]>(
    () =>
      declineChartRows(
        isGasDecline ? (gasMonthlyRates ?? []) : (monthlyRates ?? []),
        declineFit,
        declineRange,
        logScale
      ),
    [isGasDecline, gasMonthlyRates, monthlyRates, declineFit, declineRange, logScale]
  );

  // --- Filtered production rows (+ log guard) -------------------------------
  const filteredProd = useMemo<ProdRow[]>(() => {
    // Windowed, then averaged into the range's buckets (daily, weekly,
    // monthly — `bucketDaysFor`), so a long range reads as a trend rather than
    // a year of jagged gauge days. The EMAs were run on the daily rows first.
    let rows: ProdRow[] = bucketRows(windowRows(prodRows, range, custom), bucketDaysFor(range, custom));
    // Nothing recorded for this commodity anywhere in the window means the
    // facility made none of it, which is a fact worth drawing: plot it flat at
    // zero rather than handing back a blank card the reader cannot tell from a
    // broken chart. Only when the WHOLE window is blank — a partly-measured
    // series keeps its gaps, because a day nobody read is not a day of zero.
    if (rows.length > 0 && !rows.some((r) => r[primaryKey] != null)) {
      rows = rows.map((r) => ({ ...r, [primaryKey]: 0 }));
    }
    if (logScale) {
      rows = rows.map((r) => {
        const p = r[primaryKey];
        return {
          ...r,
          [primaryKey]: p != null && p > 0 ? p : null,
          ema7: r.ema7 != null && r.ema7 > 0 ? r.ema7 : null,
          ema14: r.ema14 != null && r.ema14 > 0 ? r.ema14 : null,
        };
      });
    }
    return rows;
  }, [prodRows, custom, range, logScale, primaryKey]);

  // An all-zero window would otherwise ask recharts for a zero-height domain,
  // which pins the line to the frame and labels every tick "0". Give it a real
  // range so the flat line reads as a line sitting on zero.
  const flatZero =
    !logScale &&
    filteredProd.length > 0 &&
    filteredProd.every((r) => {
      const v = r[primaryKey];
      return v == null || v === 0;
    });

  // --- Level rows -----------------------------------------------------------
  // `bbls` is null only under a log axis, where a 0 reading cannot be drawn.
  const filteredLevel = useMemo<{ date: string; bbls: number | null }[]>(() => {
    const rows = windowRows(
      (isWaterLevel ? waterLevelSeries : levelSeries) ?? [],
      range,
      custom
    );
    // Same log guard as production: an emptied tank's 0 becomes a gap.
    if (!logScale) return rows;
    return rows.map((r) => ({ ...r, bbls: r.bbls > 0 ? r.bbls : null }));
  }, [isWaterLevel, waterLevelSeries, levelSeries, range, custom, logScale]);
  /** The ceiling drawn on whichever level view is showing. */
  const shownCapacity = isWaterLevel ? waterLevelCapacity : levelCapacity;

  // A daily axis labels its ticks by day inside a year ("Mar 15") and by month
  // and year once the window crosses one ("Dec '25") — decided by what is on
  // screen, since the presets window by row count and a sparse series' 12M can
  // reach back further than a dense one's 5Y.
  const prodYearTicks = needsYearTicks(
    filteredProd[0]?.date,
    filteredProd.at(-1)?.date
  );
  const levelYearTicks = needsYearTicks(
    filteredLevel[0]?.date,
    filteredLevel.at(-1)?.date
  );

  // --- Economics rows -------------------------------------------------------
  const econRows = useMemo<EconRow[]>(() => {
    // Revenue is summed over the WHOLE series and the window applied to the
    // monthly result: aggregating first and cutting second is what keeps a
    // month's total the same figure whichever range is selected.
    const all: EconRow[] = prices
      ? // Priced production is GROSS to the lease, so an unknown interest has
        // nothing to net it down by and the view stays empty (see `nri`).
        nri == null
        ? []
        : (() => {
            const byMonth = new Map<string, number>();
            let last = "";
            for (const r of prodRows) {
              const m = r.date.slice(0, 7);
              const p = pricesOn(datedPrices, prices, r.date);
              const rev = (r.oil ?? 0) * p.oilPerBbl + (r.gas ?? 0) * p.gasPerMcf;
              byMonth.set(m, (byMonth.get(m) ?? 0) + rev * nri);
              if (r.date > last) last = r.date;
            }
            // The month still in progress has only run part of its days, so its
            // bar would read as a collapse next to full months. Scale it to a
            // full month's pace by the days it has covered so far.
            if (last) {
              const m = last.slice(0, 7);
              const days = daysInMonth(last);
              const covered = Number(last.slice(8, 10));
              if (covered < days && byMonth.has(m)) {
                byMonth.set(m, (byMonth.get(m) ?? 0) * (days / covered));
              }
            }
            return [...byMonth.entries()]
              .map(([m, netRevenue]) => ({ month: `${m}-01`, netRevenue }))
              .sort((a, b) => (a.month < b.month ? -1 : 1));
          })()
      : // Ledger revenue is what was actually received — already net.
        economics.map((e) => ({ month: e.month, netRevenue: e.netRevenue }));
    return windowMonths(all, range, custom);
  }, [prices, datedPrices, nri, prodRows, economics, range, custom]);

  // --- Average lines --------------------------------------------------------
  // The mean of the rows on screen for the view's plotted series: the bucketed
  // production rows (so a 12M chart averages its weekly points), the windowed
  // level rows, the windowed revenue months. Decline draws none: its line is a
  // fit, not a measurement. A dual chart averages each commodity on its own
  // axis, the secondary in its own color so the two reds cannot be confused.
  const averages: AverageSpec[] = !showAverage
    ? []
    : isProduction
      ? [
          {
            label: hasSecondary ? `${cap(primaryKey)} average` : "Average",
            value: meanOf(filteredProd, primaryKey),
            yAxisId: primaryKey,
          },
          ...(hasSecondary
            ? [
                {
                  label: `${cap(secondaryKey)} average`,
                  value: meanOf(filteredProd, secondaryKey),
                  yAxisId: secondaryAxisId,
                  color: productionConfig[secondaryKey].color,
                },
              ]
            : []),
        ]
      : isLevel
        ? [{ label: "Average", value: meanOf(filteredLevel, "bbls") }]
        : isEconomics
          ? [{ label: "Average", value: meanOf(econRows, "netRevenue") }]
          : [];

  // Decline labels carry the primary commodity's unit (bbl/d vs MCF/d).
  const declineConfigLocal = {
    actual: {
      label: `Monthly rate (${UNIT[isGasDecline ? "gas" : primaryKey]})`,
      color: DECLINE_RATE_COLOR,
    },
    fit: { label: "Arps curve", color: DECLINE_FIT_COLOR },
  } satisfies ChartConfig;
  const config = isEconomics
    ? economicsConfig
    : isLevel
      ? levelConfig
      : isDecline
        ? declineConfigLocal
        : productionConfig;
  const title = viewOptions.find((o) => o.value === view)?.label ?? "";
  const prodDescription = regularizable
    ? mode === "regularized"
      ? "Regularized daily production"
      : "Raw daily production"
    : "Daily production";
  const description = isEconomics
    ? prices
      ? nri == null
        ? "Net revenue needs the operator's interest. None entered for this lease"
        : `Monthly revenue net of ${nriPercent.format(nri)} NRI`
      : "Monthly revenue received"
    : isLevel
      ? "Barrels on hand"
      : isDecline
        ? declineRows.length === 0 && declineRange
          ? // An end before the start, or a window outside the filed months.
            "No months in the selected range"
          : declineFit
            ? "Monthly rate + Arps curve (18-mo projection)"
            : "Monthly rate. Not enough post-peak data to fit a curve"
        : `${prodDescription}${dualAxis ? " · dual axis" : ""}`;

  // Simple horizontal key (line + label) for the production view's visible series,
  // rendered under the x-axis at bottom-right.
  const legendItems = isProduction
    ? [
        { key: primaryKey, ...productionConfig[primaryKey] },
        ...(hasSecondary
          ? [{ key: secondaryKey, ...productionConfig[secondaryKey] }]
          : []),
        // EMAs are labeled by commodity so a dual chart's oil vs gas EMAs read
        // clearly. The secondary EMAs only appear when there's a second series.
        ...(showEma14
          ? [
              {
                key: "ema14",
                label: `${cap(primaryKey)} 14-day EMA`,
                color: productionConfig.ema14.color,
              },
              ...(hasSecondary
                ? [
                    {
                      key: "ema14Sec",
                      label: `${cap(secondaryKey)} 14-day EMA`,
                      color: productionConfig.ema14Sec.color,
                    },
                  ]
                : []),
            ]
          : []),
        ...(showEma7
          ? [
              {
                key: "ema7",
                label: `${cap(primaryKey)} 7-day EMA`,
                color: productionConfig.ema7.color,
              },
              ...(hasSecondary
                ? [
                    {
                      key: "ema7Sec",
                      label: `${cap(secondaryKey)} 7-day EMA`,
                      color: productionConfig.ema7Sec.color,
                    },
                  ]
                : []),
            ]
          : []),
        ...averages.filter((a) => a.value != null).map(averageLegendItem),
      ]
    : isDecline
      ? [
          { key: "actual", ...declineConfigLocal.actual },
          ...(declineFit ? [{ key: "fit", ...declineConfigLocal.fit }] : []),
        ]
      : averages.filter((a) => a.value != null).map(averageLegendItem);
  const legend =
    legendItems.length > 0 ? (
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 px-4 pb-0 pt-5 text-xs text-muted-foreground">
        {legendItems.map((it) => (
          <span key={it.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: it.color }}
            />
            {it.label}
          </span>
        ))}
      </div>
    ) : null;

  const chart = (
    <div className={cn("flex w-full flex-col", fullscreen && "h-full")}>
      <ChartContainer
        config={config}
        className={cn(
          "aspect-auto w-full",
          fullscreen ? "min-h-0 flex-1" : "h-[320px]"
        )}
      >
      {isEconomics ? (
        <ComposedChart
          data={econRows as unknown as Record<string, string | number>[]}
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
            width={64}
            tickFormatter={(v) => axisCurrencyFormatter.format(Number(v))}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) => tooltipMonthFormatter.format(new Date(v as string))}
                footer={() => averageFooter(averages)}
              />
            }
          />
          {averages.map((a) => (
            <AverageLine key={a.label} spec={a} />
          ))}
          <Line
            dataKey="netRevenue"
            type="monotone"
            stroke="var(--color-netRevenue)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      ) : isLevel ? (
        <ComposedChart
          data={filteredLevel as unknown as Record<string, string | number>[]}
          margin={{ left: 12, right: 12, top: 8 }}
        >
          <CartesianGrid vertical={false} syncWithTicks />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={40}
            tickFormatter={(v) => dateTickLabel(String(v), levelYearTicks)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            scale={logScale ? "log" : "auto"}
            allowDataOverflow={logScale}
            /* Keep the capacity line in frame: a nearly empty battery would
               otherwise scale the axis to its stock and push the ceiling off
               the top of the chart, which is the one place it has to be.
               A log axis has no 0, so its floor is the data's. */
            domain={
              shownCapacity == null
                ? logScale
                  ? ["auto", "auto"]
                  : undefined
                : [
                    logScale ? "auto" : 0,
                    (max: number) => Math.max(max, shownCapacity),
                  ]
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) => tooltipDateFormatter.format(new Date(v as string))}
                footer={() => averageFooter(averages)}
              />
            }
          />
          {averages.map((a) => (
            <AverageLine key={a.label} spec={a} />
          ))}
          {shownCapacity == null ? null : (
            <ReferenceLine
              y={shownCapacity}
              stroke="var(--destructive)"
              strokeDasharray="4 4"
              label={{
                value: "Max",
                position: "insideTopRight",
                fill: "var(--destructive)",
                fontSize: 11,
              }}
            />
          )}
          <Line
            dataKey="bbls"
            type="monotone"
            stroke="var(--color-bbls)"
            strokeWidth={2}
            dot={false}
            connectNulls={logScale}
          />
        </ComposedChart>
      ) : isDecline ? (
        <DeclinePlotBody
          rows={declineRows}
          rateLabel={declineConfigLocal.actual.label}
          logScale={logScale}
        />
      ) : (
        <ComposedChart
          data={filteredProd as unknown as Record<string, string | number>[]}
          margin={{ left: 12, right: 12, top: 8 }}
        >
          {/* Pinned to the LEFT axis by id. A grid with no `yAxisId` looks up
              axis 0, which this chart doesn't have (its axes are named for their
              commodity) — so it found no ticks to draw against and drew only the
              plot's top and bottom. `syncWithTicks` puts a line on every tick
              the axis actually labels, rather than on its own interpolation. */}
          <CartesianGrid vertical={false} yAxisId={primaryKey} syncWithTicks />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={40}
            tickFormatter={(v) => dateTickLabel(String(v), prodYearTicks)}
          />
          <YAxis
            yAxisId={primaryKey}
            orientation="left"
            tickLine={false}
            axisLine={false}
            width={48}
            scale={logScale ? "log" : "auto"}
            domain={
              logScale ? ["auto", "auto"] : flatZero ? [0, 1] : undefined
            }
            allowDataOverflow={logScale}
          />
          {dualAxis ? (
            <YAxis
              yAxisId={secondaryKey}
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={48}
            />
          ) : null}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v, payload) =>
                  bucketLabel(String(v), (payload?.[0]?.payload as { from?: string } | undefined)?.from)
                }
                footer={() => averageFooter(averages)}
              />
            }
          />
          {averages.map((a) => (
            <AverageLine key={a.label} spec={a} />
          ))}
          <Line
            yAxisId={primaryKey}
            dataKey={primaryKey}
            type="monotone"
            stroke={`var(--color-${primaryKey})`}
            strokeWidth={2}
            dot={false}
            connectNulls={logScale}
          />
          {showEma14 ? (
            <Line
              yAxisId={primaryKey}
              dataKey="ema14"
              type="monotone"
              stroke="var(--color-ema14)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ) : null}
          {showEma7 ? (
            <Line
              yAxisId={primaryKey}
              dataKey="ema7"
              type="monotone"
              stroke="var(--color-ema7)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ) : null}
          {hasSecondary ? (
            <Line
              yAxisId={secondaryAxisId}
              dataKey={secondaryKey}
              type="monotone"
              stroke={`var(--color-${secondaryKey})`}
              strokeWidth={2}
              dot={false}
            />
          ) : null}
          {hasSecondary && showEma14 ? (
            <Line
              yAxisId={secondaryAxisId}
              dataKey="ema14Sec"
              type="monotone"
              stroke="var(--color-ema14Sec)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ) : null}
          {hasSecondary && showEma7 ? (
            <Line
              yAxisId={secondaryAxisId}
              dataKey="ema7Sec"
              type="monotone"
              stroke="var(--color-ema7Sec)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      )}
      </ChartContainer>
      {legend}
    </div>
  );

  // Range selector shows for every dated view — daily (production, level) and
  // monthly (economics). Only the decline view sets its own horizon (the fit
  // plus an 18-month projection), and a custom range replaces the presets.
  const showRange = !isDecline && !custom;

  const controls = (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
      {showRange ? <RangePresets range={range} onChange={setRange} /> : null}
      <Popover>
          <PopoverTrigger
            aria-label="Chart settings"
            className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings2Icon className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 space-y-3 text-sm">
            {isProduction && regularizable ? (
              <label className="flex items-center justify-between gap-2">
                <span>Regularize</span>
                <Switch
                  checked={mode === "regularized"}
                  onCheckedChange={(v) => setMode(v ? "regularized" : "raw")}
                />
              </label>
            ) : null}
            {/* Both production views, not just oil: the EMAs are computed for
                whichever commodity the picker made primary, so a Gas chart draws
                them too and needs the same switches to turn them off. */}
            {isProduction ? (
              <>
                <label className="flex items-center justify-between gap-2">
                  <span>14-day EMA</span>
                  <Switch checked={showEma14} onCheckedChange={setShowEma14} />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>7-day EMA</span>
                  <Switch checked={showEma7} onCheckedChange={setShowEma7} />
                </label>
              </>
            ) : null}
            {/* Not on decline: its line is a fit, not a measurement. */}
            {!isDecline ? (
              <AverageSwitch checked={showAverage} onChange={setShowAverage} />
            ) : null}
            {/* Not on economics: net revenue goes negative, which a log axis
                cannot draw. */}
            {!isEconomics ? (
              <label className="flex items-center justify-between gap-2">
                <span>Log scale</span>
                <Switch checked={logScale} onCheckedChange={setLogScale} />
              </label>
            ) : null}
            {/* Decline frames itself with the inline dates beside the gear;
                economics never had a custom window and keeps its presets. */}
            {!isDecline && !isEconomics ? (
              <CustomRangeFields custom={custom} onChange={setCustom} />
            ) : null}
          </PopoverContent>
        </Popover>
      {/*
        The decline window, inline rather than behind the settings gear.
        Production has five preset buttons and hides its custom range in the
        popover; decline has no presets — its span is decades of monthly filings
        plus an 18-month projection, and the two dates ARE how you frame it. Side
        by side, not stacked as in the popover, because they sit in a header row
        rather than a 224px-wide panel.
      */}
      {isDecline ? (
        <div
          role="group"
          aria-label="Decline range"
          className="flex items-center gap-1.5"
        >
          <DatePicker
            value={declineRange?.from ? parseISO(declineRange.from) : null}
            placeholder="Range start"
            className="h-7 px-2 text-xs"
            onChange={(d) =>
              setDeclineRange((c) => {
                const from = d ? format(d, "yyyy-MM-dd") : "";
                return { from, to: c?.to ?? "" };
              })
            }
          />
          <DatePicker
            value={declineRange?.to ? parseISO(declineRange.to) : null}
            placeholder="Range end"
            className="h-7 px-2 text-xs"
            onChange={(d) =>
              setDeclineRange((c) => {
                const to = d ? format(d, "yyyy-MM-dd") : "";
                return { from: c?.from ?? "", to };
              })
            }
          />
          {declineRange ? (
            <button
              type="button"
              aria-label="Clear decline range"
              onClick={() => setDeclineRange(null)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      <FullscreenToggle fs={fs} />
    </div>
  );

  // A flex header (not the Card grid) so the controls wrap onto their own line
  // when the card is too narrow to fit them beside the title, instead of
  // overflowing the card's right edge.
  const header = (
    <div className="flex flex-row flex-wrap items-start gap-x-4 gap-y-2 px-4">
      <div className="flex min-w-0 flex-col gap-1">
        <CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger className="-mx-1 -my-0.5 inline-flex items-center gap-1 rounded-md px-1 py-0.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              {title}
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {viewOptions.map((o) => (
                <DropdownMenuItem
                  key={o.value}
                  className="cursor-pointer"
                  onClick={() => setView(o.value)}
                >
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {controls}
    </div>
  );

  return (
    <>
      <Card className="rounded-[0.15rem]">
        {header}
        <CardContent>{chart}</CardContent>
      </Card>
      <FullscreenChartOverlay fs={fs} header={header}>
        {chart}
      </FullscreenChartOverlay>
    </>
  );
}
