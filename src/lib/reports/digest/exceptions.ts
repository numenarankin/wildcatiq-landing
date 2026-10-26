/**
 * The digest's exception scan - pure, no I/O, no React.
 *
 * WHAT COUNTS AS AN EXCEPTION (client spec, 2026-07-26):
 *
 *  1. **Production, at the BATTERY.** A battery whose recent production diverges
 *     from its own 30-day moving average by more than ±20%, for oil OR gas.
 *     Reported per battery, not per well.
 *
 *     Days the stream was not measured are excluded, not averaged as zero: a
 *     battery nobody gauged is not a battery that made nothing (see
 *     `DailyTotals.measured`).
 *
 *     Critically, the trigger is NOT "production went to zero": some wells keep
 *     reporting a non-zero trickle after they are shut down, so a zero test both
 *     misses real outages and can never fire on those wells. The moving-average
 *     band is the only trigger, which catches a shut-in well as a large negative
 *     variance whether or not its number reaches zero.
 *
 *     Trade-off the client accepted when choosing battery-level aggregation: one
 *     well down inside a multi-well battery can be diluted by its siblings and
 *     not trip the band. Sensitivity is traded for a shorter, facility-level list.
 *
 *  2. **Pumper comments.** Comments and daily-reading remarks are a data source,
 *     not just colour: a comment that says a facility is down, leaking, or
 *     waiting on service is an exception even when the volumes look normal
 *     (a well shut in this morning still shows yesterday's barrels).
 *
 * Explicitly NOT an exception: a commodity price move. Exceptions are purely
 * operational - things the operator can go and fix. Price context lives on the
 * digest as summary stats instead (see `./price-moves`).
 *
 * Deterministic and dependency-free so every rule is unit-testable without a
 * database. Thresholds are exported so the document, the tests, and the copy all
 * quote the same number.
 */

import type { CompanyProductionRow } from "@/lib/reports/types";
import { companyDailyTotals } from "@/lib/reports/derive";
import type {
  DigestComment,
  DigestException,
} from "@/lib/reports/digest/types";

/** Divergence from the 30-day moving average that constitutes an exception. */
export const VARIANCE_THRESHOLD_PCT = 20;

/** Days in the moving-average baseline. */
export const BASELINE_DAYS = 30;

/** Days of recent production compared against the baseline. */
export const RECENT_DAYS = 3;

/**
 * Words in a pumper's comment that mean "something is wrong here". Matched
 * case-insensitively on word boundaries so "downhole" doesn't read as "down".
 * Deliberately conservative: a false positive costs a line on the cover page,
 * a false negative hides a dead well.
 */
export const TROUBLE_PHRASES = [
  "down",
  "shut in",
  "shut-in",
  "shutin",
  "off line",
  "offline",
  "not running",
  "no flow",
  "won't run",
  "wont run",
  "leak",
  "leaking",
  "spill",
  "failed",
  "failure",
  "broke",
  "broken",
  "stuck",
  "frozen",
  "froze",
  "waiting on",
  "needs repair",
  "tripped",
  "overflow",
  "parted",
] as const;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;

const inRange = (date: string, start: string, end: string): boolean =>
  date >= start && date <= end;

/** Signed percent change from `baseline` to `recent`, or null when undefined. */
function variancePct(recent: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return ((recent - baseline) / Math.abs(baseline)) * 100;
}

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "39% under" / "24% over" - how the bullets read. */
function moveWords(pct: number): string {
  return `${Math.abs(Math.round(pct))}% ${pct < 0 ? "under" : "over"}`;
}

export interface ProductionScanInput {
  /** All production history up to the window end (the baseline needs the past). */
  rows: CompanyProductionRow[];
  /** Last day the digest covers; the scan's "today". */
  windowEnd: string;
  /** wellId → battery name. Wells with no battery group under `fallbackScope`. */
  batteryByWell: Record<string, string>;
  /** Scope name for wells that belong to no battery. */
  fallbackScope?: string;
  thresholdPct?: number;
}

/**
 * Battery-level production exceptions: recent (3-day) vs the 30-day moving
 * average, for oil and gas, most divergent first.
 */
export function batteryProductionExceptions(
  input: ProductionScanInput
): DigestException[] {
  const {
    rows,
    windowEnd,
    batteryByWell,
    fallbackScope = "Unassigned",
    thresholdPct = VARIANCE_THRESHOLD_PCT,
  } = input;

  // Group the history by battery, then reduce each to a daily series.
  const byBattery = new Map<string, CompanyProductionRow[]>();
  for (const r of rows) {
    if (r.date > windowEnd) continue;
    const scope = batteryByWell[r.wellId] || fallbackScope;
    const list = byBattery.get(scope) ?? [];
    list.push(r);
    byBattery.set(scope, list);
  }

  const out: DigestException[] = [];
  for (const [scope, batteryRows] of byBattery) {
    const daily = companyDailyTotals(batteryRows);
    if (daily.length === 0) continue;

    for (const metric of ["oil", "gas"] as const) {
      /*
       * MEASURED days only.
       *
       * A daily row exists for the union of the battery's three streams, so a
       * day the gas meter was read and no tank gauged carries oil 0. Averaging
       * that as production is how a gauge gap became a shut-in battery on the
       * cover page - the same fault `exceptionReport` was fixed for, and the
       * flags to fix it were already on the rows.
       */
      const series = daily
        .filter((d) => d.measured[metric])
        .map((d) => d[metric]);
      if (series.length === 0) continue;
      const baseline = mean(series.slice(-BASELINE_DAYS));
      const recent = mean(series.slice(-RECENT_DAYS));
      const pct = variancePct(recent, baseline);
      // A battery with no baseline for this stream (a gas-free oil battery, or a
      // brand-new facility) has no band to be outside of - not an exception.
      if (pct == null) continue;
      if (Math.abs(pct) < thresholdPct) continue;
      const unit = metric === "oil" ? "bbl" : "mcf";
      out.push({
        kind: "production",
        scope,
        metric,
        baseline,
        recent,
        variancePct: pct,
        message:
          `${scope}: ${metric} is running ${moveWords(pct)} its ${BASELINE_DAYS}-day average ` +
          `(${num.format(recent)} ${unit}/day against ${num.format(baseline)}).`,
      });
    }
  }

  return out.sort(
    (a, b) => (a.variancePct ?? 0) - (b.variancePct ?? 0)
  );
}

/** Whether a comment body reads like a problem report. */
export function readsAsTrouble(body: string): boolean {
  const text = body.toLowerCase();
  return TROUBLE_PHRASES.some((phrase) => {
    // Word-boundary match so "downhole"/"downtime" don't match "down".
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  });
}

/**
 * Exceptions mined from the pumper's own words, for comments inside the window.
 * One per comment, newest first, capped by `limit` so a chatty day can't push
 * the volume exceptions off the cover page.
 */
export function commentExceptions(
  comments: DigestComment[],
  window: { start: string; end: string },
  limit = 8
): DigestException[] {
  return comments
    .filter((c) => inRange(c.date, window.start, window.end))
    .filter((c) => readsAsTrouble(c.body))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
    .map((c) => ({
      kind: "comment" as const,
      scope: c.facilityName,
      metric: c.facilityType,
      baseline: null,
      recent: null,
      variancePct: null,
      message: `${c.facilityName} (${c.date}): "${c.body.trim()}"`,
    }));
}

export interface ExceptionScanInput extends ProductionScanInput {
  /** Window the digest covers, for comment-derived exceptions. */
  window: { start: string; end: string };
  /** Pumper comments to mine; omit to skip the comment trigger. */
  comments?: DigestComment[];
  /** Cap on the exceptions surfaced, across all three triggers. */
  maxExceptions?: number;
}

/**
 * The whole scan: battery production, then what the pumper said.
 *
 * OPERATIONAL ONLY. Commodity price moves are deliberately not exceptions (client,
 * 2026-07-26): an exception is something the operator can go and fix, and a market
 * move mixed into that list pushes the actionable items down the page. Prices are
 * still reported, as summary stats on the monthly digest.
 *
 * Ordered by how directly it can be acted on - the facility numbers first, then
 * the comments. Truncated as a whole so the cover page stays a cover page.
 */
export function scanExceptions(input: ExceptionScanInput): DigestException[] {
  const production = batteryProductionExceptions(input);
  const comments = input.comments
    ? commentExceptions(input.comments, input.window)
    : [];
  return [...production, ...comments].slice(0, input.maxExceptions ?? 12);
}
