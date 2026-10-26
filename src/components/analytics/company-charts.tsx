"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { usePageContextSlice } from "@/lib/ai/use-ai-context";
import { SLICE_PRIORITY } from "@/lib/ai/page-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AverageLine,
  AverageSwitch,
  ChartSettingsPopover,
  averageFooter,
  averageLegendItem,
  type AverageSpec,
} from "@/components/charts/chart-chrome";
import { useChartPrefs } from "@/components/charts/chart-prefs-context";
import { meanOf } from "@/lib/charts/average";
import { resolveDefaultRange } from "@/lib/charts/ranges";
import { cn } from "@/lib/utils";
import type { MonthlyRate } from "@/lib/wells/arps";
import {
  type FleetMonth,
  unitHistory,
  unitProjection,
  wellUnitKeys,
  type FleetDecline,
} from "@/lib/analytics/fleet-decline";
import { regimeDecline, regimeMonths, regimeRate, segmentedCurve } from "@/lib/wells/segments";
import { sumMonthly } from "@/lib/analytics/sum-monthly";
import {
  defaultDeclineWindow,
  fleetChartRows,
} from "@/lib/charts/decline-rows";
import {
  daysInMonth,
  measuredRateSeries,
  monthlyRateSeries,
} from "@/lib/analytics/monthly-rates";
import { bucketWellSeries } from "@/lib/analytics/chart-buckets";
import {
  DeclinePlotBody,
  declineChartConfig,
  DECLINE_FIT_COLOR,
  DECLINE_RATE_COLOR,
} from "@/components/charts/decline-plot";
import type {
  CommodityPrices,
  MonthlyProduction,
  WellDailySeries,
  WellMonthlySeries,
} from "@/lib/analytics/types";

/*
 * ONE CHART, PICKED FROM THE TITLE — the same shape every facility page uses
 * (`components/wells/production-chart.tsx`): the card's title IS the view menu,
 * the range presets sit at the right of the header, and exactly one plot is on
 * screen at a time.
 *
 * What changed is only what is on the menu. There used to be a Volume / Revenue
 * toggle, and Volume meant oil, gas and water sharing one pair of axes: barrels
 * and MCF are not the same quantity, and company gas runs one to two orders
 * above company oil, so the oil line lay flat along the bottom of a chart that
 * was supposedly about it. Each measure now has its own entry and its own axis,
 * and the two decline curves — oil and gas — are entries beside them. (BOE
 * views were here once; the headline card carries the BOE decline now, and a
 * priced-barrel line beside oil and gas was one more thing to read past.)
 */

export type View =
  | "oil"
  | "gas"
  | "revenue"
  | "water"
  | "decline-oil"
  | "decline-gas";

/** Menu order, and the first entry is what the card opens on. */
const VIEWS: { value: View; label: string }[] = [
  { value: "oil", label: "Oil production" },
  { value: "gas", label: "Gas production" },
  { value: "revenue", label: "Revenue" },
  { value: "water", label: "Salt water" },
  { value: "decline-oil", label: "Oil decline" },
  { value: "decline-gas", label: "Gas decline" },
];

/**
 * The window presets, each with the bucket its length is readable at.
 *
 * A month is the wrong grain for a quarter: a well down for a week disappears
 * into its month, and the last quarter is exactly the window an operator reads
 * for that. So the short windows plot the DAILY series — a day each for 1M, a
 * week each for 3M and 6M — and the long ones stay monthly, where a day would be
 * noise and a thousand points.
 *
 * `months` still bounds the monthly views; `days`/`bucket` drive the daily ones.
 */
const TIME_RANGES = [
  { value: "1M", days: 30, bucket: "day" },
  { value: "3M", days: 91, bucket: "week" },
  { value: "6M", days: 182, bucket: "week" },
  { value: "12M", months: 12, bucket: "month" },
  { value: "5Y", months: 60, bucket: "month" },
  { value: "All", months: Number.POSITIVE_INFINITY, bucket: "month" },
] as const;

type TimeRange = (typeof TIME_RANGES)[number]["value"];

/** What the production views open on: the last month, a day per point. The decline views ignore the presets. */
const DEFAULT_RANGE: TimeRange = "1M";

const ALL_LEASES = "all";

/** One entry of the chart's lease picker: a dashboard row and the wells behind it. */
export interface ChartLease {
  /** The dashboard row's key (lease id, or the unassigned bucket's). */
  key: string;
  /** Null for the unassigned bucket. */
  leaseId: string | null;
  name: string;
  wellIds: string[];
}

/** What `/api/analytics/company` returns: the whole history, and the fleet decline built from it. */
interface AllTimePayload {
  monthly: MonthlyProduction[];
  byWellMonthly: WellMonthlySeries[];
  /** Null when the server could not build it; absent from an older payload. */
  decline?: FleetDecline | null;
}

const OIL = "#059669";
const GAS = "#800000";
const WATER = "#4169e1";

const tickMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const tooltipMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
/** Day and week buckets are labelled by their date, not by their month. */
const tickDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const tooltipDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const compact = new Intl.NumberFormat("en-US", { notation: "compact" });
/** The NRI as it reads in the Revenue view's description ("78.12%"). */
const nriPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});
const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * The months' rates as the payload measured them, or null when it carries none
 * (an older payload) so the caller falls back to the calendar-day derivation.
 *
 * Same shape and same filtering as `monthlyRateSeries` — months at or below zero
 * are dropped, so the plotted points and the fitted points stay one set.
 */
/**
 * Shared with the server-side decline tool (`@/lib/analytics/decline-summary`),
 * so the number Orion states and the curve on this chart are one derivation.
 */
function measuredRates(
  rows: MonthlyProduction[],
  rateOf: (row: MonthlyProduction) => number | undefined
): MonthlyRate[] | null {
  return measuredRateSeries(rows, rateOf);
}

/** "YYYY-MM" → Date at the first of the month (UTC). */
function monthDate(month: string): Date {
  return new Date(`${month}-01T00:00:00Z`);
}

/** A bucket key back to a Date: "YYYY-MM-DD" as itself, "YYYY-MM" as its 1st. */
function keyDate(key: string): Date {
  return key.length > 7 ? new Date(`${key}T00:00:00Z`) : monthDate(key);
}



/** Which monthly column a production view plots, and how it is labelled. */
const MEASURES: Record<
  "oil" | "gas" | "revenue" | "water",
  {
    key: Extract<keyof MonthlyProduction, "oilBbl" | "gasMcf" | "revenue" | "water">;
    label: string;
    color: string;
    money?: boolean;
  }
> = {
  oil: { key: "oilBbl", label: "Oil (bbl/d)", color: OIL },
  gas: { key: "gasMcf", label: "Gas (MCF/d)", color: GAS },
  revenue: { key: "revenue", label: "Net revenue (mo)", color: OIL, money: true },
  water: { key: "water", label: "Salt water (bbl/d)", color: WATER },
};

/** Which stream a decline view fits, and the unit its rate is in. */
const DECLINES: Record<
  "decline-oil" | "decline-gas",
  { stream: "oil" | "gas"; unit: string; color: string }
> = {
  "decline-oil": { stream: "oil", unit: "bbl/d", color: OIL },
  "decline-gas": { stream: "gas", unit: "MCF/d", color: GAS },
};

export function CompanyCharts({
  data,
  wells,
  dailyByWell = [],
  prices,
  leases = [],
  nriByLease = {},
  companyNri = null,
  onDeclineChange,
  className,
  initialView = "oil",
  initialLease,
}: {
  data: MonthlyProduction[];
  wells: WellMonthlySeries[];
  /**
   * Recent measured production by DAY, per well — what the 1M/3M/6M windows
   * bucket. Per WELL and not company-wide on purpose: the company rate is the
   * sum of its wells' rates, and only the per-well grain can tell a well nobody
   * gauged this week from a well that stopped. Volumes only; revenue is priced
   * here, since a day has no accounting month to be official about.
   */
  dailyByWell?: WellDailySeries[];
  /** Live oil/gas prices: the fallback for a daily bucket that arrived unpriced,
   *  and the gas-to-oil ratio a lease's projection is summed at. */
  prices: CommodityPrices;
  /**
   * The picker's entries: the dashboard's lease rows, each with its wells, so a
   * lease on this chart is the same wells as its row in the table below and
   * its slice in the pie beside it.
   */
  leases?: ChartLease[];
  /**
   * The operator's NRI per lease row (absent = none entered), and the
   * revenue-weighted blend across the company. The Revenue view is NET of
   * whichever applies to the current selection: production valued at the
   * wellhead is the LEASE's revenue, and the royalty share of it never reaches
   * the operator. The view was already LABELLED "Net revenue" while plotting
   * gross, which is the version of this bug that does not look like one.
   */
  nriByLease?: Record<string, number>;
  companyNri?: number | null;
  /**
   * Report the fleet decline that arrived with the history, so the headline
   * card and the lease table read the SAME projection this chart draws. Fires
   * with null when there is none to report.
   */
  onDeclineChange?: (fleet: FleetDecline | null) => void;
  className?: string;
  /** landing: the view a product-page screen opens on (the app always opens on Oil production). */
  initialView?: View;
  /** landing: the lease row a product-page screen opens isolated (the app opens on all leases). */
  initialLease?: string;
}) {
  const [view, setView] = useState<View>(initialView);
  // Settings > Charts picks the opening preset (1M where the user has none)
  // and whether the average line starts drawn. Both are read once, at mount:
  // the gear's Average switch is this chart's own after that.
  const prefs = useChartPrefs();
  const [range, setRange] = useState<TimeRange>(() =>
    resolveDefaultRange(TIME_RANGES, prefs.defaultRange, DEFAULT_RANGE)
  );
  const [showAverage, setShowAverage] = useState(prefs.averageLine);
  const [leaseKey, setLeaseKey] = useState<string>(initialLease ?? ALL_LEASES);
  // The page ships only the default 12-month window; the full history is fetched
  // the first time someone reaches past it, and kept for the rest of the session.
  const [allTime, setAllTime] = useState<AllTimePayload | null>(null);
  const [loadingAll, setLoadingAll] = useState(true);

  /**
   * Range change. 5Y and All reach past what the page shipped, so they are what
   * trigger the full-history fetch — caused by the click, not by state
   * synchronising, so it belongs here rather than in an effect.
   */
  /**
   * PREFETCH THE WHOLE SERIES, once, right after the page paints.
   *
   * The page ships twelve months so it renders fast, but a decline fit needs
   * every month the company has held, and fetching only when a decline view was
   * picked meant staring at a spinner for five seconds — or worse, at a curve
   * fitted over a twelfth of the history that then jumped when the rest landed.
   *
   * So the rest is pulled in the background immediately. Nothing waits on it:
   * the twelve-month views are already drawn from the page's own payload, and by
   * the time anyone opens the menu it is usually here.
   *
   * `loadingAll` starts TRUE because the fetch starts with the component.
   *
   * THE REQUEST LIVES IN A REF, NOT A "STARTED" FLAG. Under StrictMode's
   * double-mount the first effect run starts the fetch and is then cleaned up;
   * a boolean guard stopped the second run from fetching again, but the first
   * run's cleanup had already marked its result as cancelled — so the only
   * request there was landed in a handler that ignored it, `loadingAll` never
   * cleared, and the decline card sat on its skeleton for the life of the page
   * in every dev session. Holding the promise instead lets the second mount
   * attach to the request the first one started.
   */
  const prefetch = useRef<Promise<AllTimePayload | null> | null>(null);
  useEffect(() => {
    // Logged at each step, because the decline card is the only figure on the
    // page computed off this fetch, and a blank card says nothing about why.
    if (!prefetch.current) {
      const startedAt = Date.now();
      const elapsed = () => `${Date.now() - startedAt}ms`;
      console.info("[decline-card] fetching /api/analytics/company");
      prefetch.current = fetch("/api/analytics/company")
        .then((r) => {
          if (r.ok) return r.json() as Promise<AllTimePayload>;
          console.warn(
            `[decline-card] /api/analytics/company returned ${r.status} after ${elapsed()}; ` +
              "the chart keeps the page's 12 months and the card reads null"
          );
          return null;
        })
        .then((d) => {
          if (!d) return null;
          const dec = d.decline;
          console.info(
            `[decline-card] history in ${elapsed()}: months=${d.monthly?.length ?? "?"} ` +
              (dec
                ? `decline: annual=${dec.annual == null ? "null" : `${(dec.annual * 100).toFixed(2)}%/yr`} ` +
                  `fitted=${dec.fitted}/${dec.producing} coverage=${(dec.coverage * 100).toFixed(0)}% ` +
                  `projection=${dec.projection?.boe?.length ?? 0}mo anchor=${dec.anchorMonth}`
                : `decline: ${dec === null ? "null (server failed to build it)" : "absent from payload"}`)
          );
          return d;
        })
        .catch((error: unknown) => {
          console.error(`[decline-card] fetch failed after ${elapsed()}`, error);
          return null;
        });
    }
    let cancelled = false;
    prefetch.current.then((d) => {
      if (cancelled) return;
      if (d) setAllTime(d);
      setLoadingAll(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectRange(next: TimeRange) {
    setRange(next);
  }

  const monthlyData = allTime?.monthly ?? data;
  const wellData = allTime?.byWellMonthly ?? wells;

  const selected =
    leaseKey === ALL_LEASES ? null : (leases.find((l) => l.key === leaseKey) ?? null);
  const selectedWells = useMemo(() => new Set(selected?.wellIds ?? []), [selected]);
  // A lease is its wells' series added up (`sumMonthly`) — volumes and rates
  // alike, the fold the company total is built with.
  const active = useMemo(
    () =>
      selected
        ? sumMonthly(wellData.filter((w) => selectedWells.has(w.wellId)))
        : monthlyData,
    [selected, selectedWells, wellData, monthlyData]
  );

  /*
   * Today, captured once per mount. Read inside the memos it would be a new
   * value on every render and refit the curve continuously; a chart does not
   * need to notice midnight passing while someone is looking at it.
   */
  const [now] = useState(() => new Date());

  const preset = TIME_RANGES.find((r) => r.value === range);
  const months =
    (preset && "months" in preset ? preset.months : undefined) ??
    Number.POSITIVE_INFINITY;
  const windowedRaw = Number.isFinite(months) ? active.slice(-months) : active;
  // One lease reads its own interest; "All leases" reads the company's
  // revenue-weighted blend (`companyNri`), the same figure the dashboard's net
  // revenue card shows — so the card and this chart cannot disagree.
  const revenueNri =
    leaseKey === ALL_LEASES ? companyNri : (nriByLease[leaseKey] ?? null);

  /*
   * PER DAY, not per bucket.
   *
   * Bucket totals made every bucket a different size and the one in progress a
   * fraction of one: six days into August the company looked to have fallen off
   * a cliff, when all that had happened was that August was six days old.
   * Dividing by the days each bucket actually covered puts every point on the
   * same footing.
   *
   * Revenue is the exception in units only: a dollars-per-day axis means nothing
   * to anyone, so it is carried back up to a MONTH at 365/12 days — the same
   * normalization the revenue cards use.
   */
  const perDay = useCallback(
    (
      key: string,
      totals: { oilBbl: number; gasMcf: number; water: number; revenue: number },
      days: number,
      official: boolean
    ) => {
      const span = Math.max(1, days);
      const net = revenueNri == null ? totals.revenue : totals.revenue * revenueNri;
      return {
        month: key,
        oilBbl: totals.oilBbl / span,
        gasMcf: totals.gasMcf / span,
        water: totals.water / span,
        revenue: (net / span) * (365 / 12),
        official,
      };
    },
    [revenueNri]
  );

  /*
   * The daily rows for the current selection, bucketed by day or week.
   *
   * BUILT PER WELL, THEN SUMMED — the company rate is the sum of its wells'
   * rates, exactly as it is everywhere else. Bucketing the company total instead
   * made every gap in gauging look like a fall: a week where eight of ten wells
   * were gauged carried eight wells' barrels, and the last bucket, where the
   * pumper simply has not been round yet, sat far under the real rate.
   *
   * Within a well, each stream is divided by the days IT was measured. An
   * unread bucket carries the well's previous rate forward, because a well is
   * producing between gauges and dropping it would make every unread well
   * subtract itself from the total. That holds for a lease as it does for the
   * company: both are sums of wells (`bucketWellSeries`, aggregate).
   *
   * Revenue is each day's volume at THAT DAY's realized price, priced on the
   * server (`dailySeriesFromRows`) and carried through the buckets beside the
   * volumes, so the line moves with the benchmark as well as with production.
   * A series that arrived unpriced is valued at today's price.
   */
  const bucketed = useMemo(() => {
    if (!preset || !("days" in preset)) return null;
    const series = selected
      ? dailyByWell.filter((w) => selectedWells.has(w.wellId))
      : dailyByWell;
    if (series.length === 0) return null;

    const buckets = bucketWellSeries(series, preset, true);
    if (buckets.length === 0) return null;

    return buckets.map((t) => {
      const gross = t.revenue ?? t.oil * prices.oilPerBbl + t.gas * prices.gasPerMcf;
      const net = revenueNri == null ? gross : gross * revenueNri;
      return {
        month: t.key,
        oilBbl: t.oil,
        gasMcf: t.gas,
        water: t.water,
        revenue: net * (365 / 12),
        official: false,
      };
    });
  }, [preset, selected, selectedWells, dailyByWell, prices, revenueNri]);

  /**
   * The monthly path — the long windows, and the series every decline view is
   * fitted over.
   *
   * The RATE comes from the payload (`oilBblPerDay`), where each well's volume
   * was divided by the days that well was gauged. Dividing the month's total by
   * its calendar days instead counts every ungauged day as a day of nothing, and
   * that is why August read 68.7 on the decline plot against 74.06 on the
   * production one — one month, one set of barrels, two denominators. The
   * calendar is the fallback for a payload that has no rates on it.
   */
  const monthlyRows = useMemo(() => {
    const currentMonth = now.toISOString().slice(0, 7);
    // Complete days only; today is half-finished. Floored at 1 so the 1st of the
    // month divides by the single day it has rather than by zero.
    const elapsed = Math.max(1, now.getUTCDate() - 1);
    return windowedRaw.map((m) => {
      const days = m.month === currentMonth ? elapsed : daysInMonth(m.month);
      if (m.oilBblPerDay == null) return perDay(m.month, m, days, m.official);
      const oil = m.oilBblPerDay;
      const gas = m.gasMcfPerDay ?? 0;
      const net = revenueNri == null ? m.revenue : m.revenue * revenueNri;
      return {
        month: m.month,
        oilBbl: oil,
        gasMcf: gas,
        water: m.waterBblPerDay ?? 0,
        // Revenue keeps the ledger's own figure for a settled month, so it is
        // still the month's money spread over the month's days.
        revenue: (net / days) * (365 / 12),
        official: m.official,
      };
    });
  }, [windowedRaw, now, perDay, revenueNri]);

  /*
   * A short window falls back to months when there are no daily rows for the
   * selection — an older well, or a payload built before the daily series
   * existed. Better a coarse plot than an empty one.
   */
  const windowed = bucketed ?? monthlyRows;

  // An unknown interest has nothing to net the gross down by, so the Revenue
  // view plots nothing and the description says why. Falling back to gross under
  // a "Net revenue" label is the overstatement this whole change removes.
  const revenueUnknown = view === "revenue" && revenueNri == null;

  const isDecline = view.startsWith("decline-");
  // A decline fit needs the whole series; until it arrives there is nothing
  // honest to draw (see the branch that renders this).
  const declineLoading = isDecline && !allTime && loadingAll;
  const decline = DECLINES[view as keyof typeof DECLINES];

  /*
   * ONE KIND OF DECLINE CURVE: the fleet's, or a lease's piece of it.
   *
   * Every well's oil and gas is fitted separately and summed (`fleet-decline`,
   * computed on the server and shipped with the full history): that sum is
   * the CURRENT LEG, from the month every well's curve exists through today
   * and on, and it is the headline's arithmetic. ALL LEASES draws the fleet's;
   * ONE LEASE draws its own units' share of the same runs (`unitHistory` +
   * `unitProjection`). Before that leg the per-well sum is a well short, so
   * the months before it are modelled as a FEW regimes of the summed series
   * (`segmentedCurve`: a rise, a fall, a floor, each one function), decided
   * backward from the leg's first month and pinned to its level there. One
   * curve, kinked only at the turns; never a line traced through the months.
   */
  const declineData = useMemo(() => {
    if (!decline) return null;
    // Rates where the payload carries them (volume ÷ the days each well was
    // gauged); volumes otherwise, which `monthlyRateSeries` then divides by the
    // calendar. The two must not be mixed — see `monthlyRows`.
    const volumeOf =
      decline.stream === "oil"
        ? (m: MonthlyProduction) => m.oilBbl
        : (m: MonthlyProduction) => m.gasMcf;
    const rateOf =
      decline.stream === "oil"
        ? (m: MonthlyProduction) => m.oilBblPerDay
        : (m: MonthlyProduction) => m.gasMcfPerDay;
    // `now` so the month in progress is averaged over the days it has had, not
    // over its full length — otherwise the curve ends on a cliff made of
    // calendar rather than of production.
    const rates = measuredRates(active, rateOf) ?? monthlyRateSeries(active, volumeOf, now);
    // The SAME window the well and lease charts open on: the last five years
    // OF DATA (`defaultDeclineWindow`), with the projection running past it.
    const window = defaultDeclineWindow(rates);
    // Nothing to draw until the fleet arrives — and nothing to draw if it could
    // not fit a single lease.
    const fleet = allTime?.decline ?? null;
    const units = selected ? wellUnitKeys(selected.wellIds) : null;
    const projection = !fleet
      ? []
      : units
        ? unitProjection(fleet, units)[decline.stream]
        : fleet.projection[decline.stream];
    const history = !fleet
      ? []
      : units
        ? unitHistory(fleet, units)[decline.stream]
        : fleet.history[decline.stream];
    const leg = history[0] ?? projection[0];
    const regimes = leg ? segmentedCurve(rates, leg.month, leg.rate) : [];
    const before: FleetMonth[] = regimeMonths(regimes).map((month) => ({
      month,
      rate: regimeRate(regimes, month) ?? 0,
      decline: regimeDecline(regimes, month),
    }));
    return {
      rows: fleetChartRows(rates, [...before, ...history, ...projection], window),
      annual: projection[0]?.decline ?? null,
    };
  }, [active, decline, now, selected, allTime]);

  /*
   * The fleet decline, reported up for the headline card.
   *
   * Always the company's number, whichever view or well is on screen: the card
   * is labelled for the company. Effect rather than a render-time call because
   * it writes to a parent.
   */
  const fleet = allTime?.decline ?? null;
  const boeAnnual = fleet?.annual ?? null;
  /*
   * NOT REPORTED UNTIL THE HISTORY IS IN, so the card's skeleton is replaced
   * once, by the final number. A failed fetch still reports: `loadingAll` clears
   * either way, and the card then reads null — a dash — rather than a number
   * fitted over the page's twelve months, which is the arithmetic this card no
   * longer shows.
   */
  useEffect(() => {
    if (loadingAll) return;
    console.info(
      `[decline-card] reporting ${boeAnnual == null ? "null (card shows a dash)" : `${(boeAnnual * 100).toFixed(2)}%/yr`} ` +
        `(history ${allTime ? "loaded" : "not loaded"}, decline ${allTime?.decline ? "present" : "missing"})`
    );
    onDeclineChange?.(fleet);
  }, [loadingAll, fleet, boeAnnual, onDeclineChange, allTime]);

  /* What the AI is answering about: the plot on screen, its range and its subject. */
  usePageContextSlice(
    "dashboard.chart",
    useMemo(
      () => ({
        priority: SLICE_PRIORITY.controls,
        label: "Dashboard chart",
        lines: [
          `chart: ${VIEWS.find((v) => v.value === view)?.label}`,
          `range: ${range}`,
          selected ? `isolated to lease: ${selected.name}` : "showing: all leases",
          "other charts on the menu: oil, gas, revenue, salt water, and decline curves for oil and gas",
          declineData?.annual != null
            ? `fitted 12-mo decline on this chart: ${(declineData.annual * 100).toFixed(0)}%`
            : isDecline
              ? "no decline curve: no series with six post-peak months to fit"
              : "",
        ].filter(Boolean),
      }),
      [view, range, selected, declineData, isDecline]
    )
  );

  /*
   * Shade the ESTIMATED TAIL — the months after the last one the accounting
   * ledger settled.
   *
   * Not "every month carrying an estimate": now that the series is built from
   * measured production (tanks and meters) rather than from hand-entered rows,
   * almost every month has at least one well the ledger has not settled, and
   * shading on that test washed the whole chart grey and said nothing. With no
   * settled month at all there is nothing to contrast against, so nothing is
   * shaded and the whole plot is understood as produced-and-valued.
   */
  const lastOfficial = windowed.reduce(
    (last, row, i) => (row.official ? i : last),
    -1
  );
  const lastMonth = windowed[windowed.length - 1]?.month;
  const shade =
    lastOfficial >= 0 && lastOfficial < windowed.length - 1 && lastMonth
      ? [windowed[lastOfficial + 1].month, lastMonth]
      : null;

  const measure = !isDecline ? MEASURES[view as keyof typeof MEASURES] : null;
  // What the measure plot draws: nothing while the interest is unknown.
  const plotted = revenueUnknown ? [] : windowed;
  // The mean of the points on screen for the view's measure, bucketed as they
  // are drawn. Decline draws none: its line is a fit, not a measurement.
  const averages: AverageSpec[] =
    showAverage && measure
      ? [{ label: "Average", value: meanOf(plotted, measure.key) }]
      : [];

  const declineRateLabel = `Monthly rate (${decline?.unit ?? "bbl/d"})`;
  // Decline views take the SHARED plot's config, so the lines, the swatches
  // below them and the well chart's are one set of colours. The measure views
  // keep their own commodity colour.
  const config: ChartConfig = measure
    ? { [measure.key]: { label: measure.label, color: measure.color } }
    : declineChartConfig(declineRateLabel);
  const legend = measure
    ? [
        { label: measure.label, color: measure.color },
        ...averages.filter((a) => a.value != null).map(averageLegendItem),
      ]
    : [
        { label: `Monthly rate (${decline?.unit})`, color: DECLINE_RATE_COLOR },
        { label: "Arps curve", color: DECLINE_FIT_COLOR },
      ];

  return (
    <Card className={cn("flex flex-col rounded-[0.15rem]", className)}>
      {/* A flex header (not the Card grid) so the controls wrap onto their own
          line when the card is too narrow, instead of overflowing its right
          edge. Same header the facility charts use. */}
      <div className="flex flex-row flex-wrap items-start gap-x-4 gap-y-2 px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger className="-mx-1 -my-0.5 inline-flex items-center gap-1 rounded-md px-1 py-0.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                {VIEWS.find((v) => v.value === view)?.label}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {VIEWS.map((o) => (
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
          {view === "revenue" ? (
            <CardDescription>
              {revenueNri == null
                ? "Net revenue needs the operator's interest — none entered"
                : `Monthly revenue net of ${nriPercent.format(revenueNri)} NRI`}
            </CardDescription>
          ) : null}
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <Select value={leaseKey} onValueChange={(v) => setLeaseKey(v ?? ALL_LEASES)}>
            <SelectTrigger size="sm" className="w-40 text-xs">
              <span className="truncate">
                {selected ? selected.name : "All leases"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LEASES}>All leases</SelectItem>
              {leases.map((l) => (
                <SelectItem key={l.key} value={l.key}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Decline views own their own span — the whole history plus five
              years — so there is nothing here for a preset to select. */}
          <div
            role="group"
            aria-label="Select time range"
            className={cn(
              "inline-flex items-center gap-0.5 rounded-sm bg-muted p-0.5",
              isDecline && "hidden"
            )}
          >
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={range === r.value}
                onClick={() => selectRange(r.value)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                  range === r.value &&
                    "bg-background text-foreground shadow-sm hover:text-foreground"
                )}
              >
                {r.value}
              </button>
            ))}
          </div>
          {/* Not on decline: its line is a fit, not a measurement. */}
          {isDecline ? null : (
            <ChartSettingsPopover>
              <AverageSwitch checked={showAverage} onChange={setShowAverage} />
            </ChartSettingsPopover>
          )}
        </div>
      </div>

      <CardContent>
        {declineLoading ? (
          /* Outside the chart container on purpose: that renders a
             ResponsiveContainer, which expects a chart element and clips
             anything else to nothing. The twelve months already loaded are not a
             short version of this curve — they are a different fit over a
             different peak — so the chart waits rather than showing a number
             about to move by tens of percent. */
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            Loading full history…
          </div>
        ) : (
        <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
          {measure ? (
            <LineChart
              data={plotted}
              margin={{ left: 12, right: 12, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              {shade && (
                <ReferenceArea
                  x1={shade[0]}
                  x2={shade[1]}
                  fill="var(--muted-foreground)"
                  fillOpacity={0.08}
                />
              )}
              {measure.money && (
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
              )}
              <MonthAxis />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) =>
                  measure.money ? compactUsd.format(v) : compact.format(v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const key = String(value);
                      // A week bucket is named by the day it starts, same as a
                      // day bucket — the axis is dates either way.
                      return key.length > 7
                        ? tooltipDayFormatter.format(keyDate(key))
                        : tooltipMonthFormatter.format(monthDate(key));
                    }}
                    footer={() => averageFooter(averages)}
                  />
                }
              />
              {averages.map((a) => (
                <AverageLine key={a.label} spec={a} />
              ))}
              <Line
                dataKey={measure.key}
                type="monotone"
                stroke={`var(--color-${String(measure.key)})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          ) : (
            /* The SAME plot the well and lease charts draw, not a lookalike:
               same colours, same dashed fit, same tooltip with the per-month
               decline read off the curve. */
            <DeclinePlotBody
              rows={declineData?.rows ?? []}
              rateLabel={declineRateLabel}
            />
          )}
        </ChartContainer>
        )}

        {/* Under the plot, where the facility charts put theirs: a legend above
            the chart is read before there is anything to attach it to. */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {legend.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-0.5 w-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
          {declineData?.annual != null && (
            <div className="flex items-baseline gap-1.5 text-xs">
              <span className="font-mono uppercase tracking-wider text-muted-foreground">
                Proj. 12-mo
              </span>
              <span className="font-semibold tabular-nums">
                {percent.format(declineData.annual * 100)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The x axis both plots share. The key is still `month` — it is whatever the
 * bucket is keyed by — so a day/week bucket is labelled by its DATE and a month
 * by its month.
 */
function MonthAxis() {
  return (
    <XAxis
      dataKey="month"
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      minTickGap={24}
      tickFormatter={(value: string) =>
        value.length > 7
          ? tickDayFormatter.format(keyDate(value))
          : tickMonthFormatter.format(monthDate(value))
      }
    />
  );
}
