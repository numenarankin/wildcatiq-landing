/**
 * The Pumper Report's math - pure, no I/O, no React, no clock reads.
 *
 * One definition of a visit: a facility is visited on a day if ANY reading was
 * logged against it that day. Everything here follows from that.
 *
 *  - Multiple readings on one facility-day collapse to ONE visit (three tanks
 *    gauged on a battery is one stop; two meter reads at 08:00 and 17:00 is one
 *    day covered). Counting readings instead of days would let a diligent morning
 *    on one battery paper over a week of missed stops elsewhere.
 *  - Every facility in the roster is in the denominator every day of the window,
 *    including facilities that were never visited - those are precisely what the
 *    report exists to surface, so they must not be silently dropped.
 *  - The headline rate and the plotted daily series are the same quantity summed
 *    two ways (facility-days / possible facility-days, vs the mean of the daily
 *    rates), which is asserted in the tests rather than assumed.
 *
 * Known simplification: the roster is the org's CURRENTLY active facilities, held
 * constant across the window. A facility added mid-month therefore carries the
 * days before it existed as missed visits. The alternative - deriving each
 * facility's start date from its first-ever reading - would make a genuinely idle
 * facility look perfectly covered, which is the worse failure for a report whose
 * job is to find gaps.
 */

import type { ReportWindow } from "@/lib/reports/windows";
import {
  FACILITY_KIND_LABEL,
  FACILITY_KIND_ORDER,
  type PumperCoverageReport,
  type PumperDailyCoverage,
  type PumperFacility,
  type PumperFacilityCoverage,
  type PumperKindCoverage,
  type PumperLog,
} from "@/lib/reports/pumper/types";

const DAY_MS = 86_400_000;

/** Every ISO day from `from` to `to`, inclusive. Empty if `to` precedes `from`. */
export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= end; t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Percent, guarding the empty-roster case so an org with no facilities reads 0. */
function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : (part / whole) * 100;
}

export interface PumperCoverageInput {
  /** The facilities coverage is measured against (the denominator). */
  facilities: PumperFacility[];
  /** Logged readings; duplicates per facility-day are expected and collapsed. */
  logs: PumperLog[];
  /** The window the report covers. */
  window: ReportWindow;
}

/**
 * Turn a facility roster plus its logged readings into the report: the daily
 * aggregate series for the chart, the per-facility visitation table, and the
 * headline rates.
 *
 * Logs outside the window, and logs against a facility that is not in the roster
 * (an inactive tank, a deleted meter), are ignored - the denominator and the
 * numerator have to describe the same set of facilities or the rate is fiction.
 */
export function buildPumperCoverage(
  input: PumperCoverageInput
): PumperCoverageReport {
  const { facilities, logs, window } = input;
  const days = eachDay(window.from, window.to);
  const daysInWindow = days.length;
  const known = new Map(facilities.map((f) => [f.id, f]));

  // facility id → the set of days it was logged on (de-duplication happens here).
  const daysByFacility = new Map<string, Set<string>>();
  // day → the set of facilities logged that day.
  const facilitiesByDay = new Map<string, Set<string>>();

  for (const log of logs) {
    const day = log.date.slice(0, 10);
    if (day < window.from || day > window.to) continue;
    if (!known.has(log.facilityId)) continue;
    const forFacility = daysByFacility.get(log.facilityId) ?? new Set<string>();
    forFacility.add(day);
    daysByFacility.set(log.facilityId, forFacility);
    const forDay = facilitiesByDay.get(day) ?? new Set<string>();
    forDay.add(log.facilityId);
    facilitiesByDay.set(day, forDay);
  }

  const facilityCount = facilities.length;

  const daily: PumperDailyCoverage[] = days.map((date) => {
    const facilitiesLogged = facilitiesByDay.get(date)?.size ?? 0;
    return {
      date,
      facilitiesLogged,
      facilityCount,
      coveragePct: pct(facilitiesLogged, facilityCount),
    };
  });

  const rows: PumperFacilityCoverage[] = facilities.map((f) => {
    const logged = daysByFacility.get(f.id);
    const daysLogged = logged?.size ?? 0;
    const lastLogged = logged
      ? [...logged].sort().at(-1) ?? null
      : null;
    return {
      facilityId: f.id,
      facilityName: f.name,
      kind: f.kind,
      kindLabel: FACILITY_KIND_LABEL[f.kind],
      daysLogged,
      daysInWindow,
      coveragePct: pct(daysLogged, daysInWindow),
      lastLogged,
      daysSinceLast:
        lastLogged == null
          ? null
          : Math.round(
              (Date.parse(`${window.to}T00:00:00Z`) -
                Date.parse(`${lastLogged}T00:00:00Z`)) /
                DAY_MS
            ),
    };
  });

  // Worst coverage first - the point of the table is which facilities are being
  // missed. Ties break on name so two runs of the same data order identically.
  rows.sort(
    (a, b) =>
      a.coveragePct - b.coveragePct ||
      a.facilityName.localeCompare(b.facilityName)
  );

  const byKind: PumperKindCoverage[] = FACILITY_KIND_ORDER.map((kind) => {
    const inKind = rows.filter((r) => r.kind === kind);
    const daysLogged = inKind.reduce((s, r) => s + r.daysLogged, 0);
    return {
      kind,
      kindLabel: FACILITY_KIND_LABEL[kind],
      facilityCount: inKind.length,
      daysLogged,
      coveragePct: pct(daysLogged, inKind.length * daysInWindow),
    };
  }).filter((k) => k.facilityCount > 0);

  const facilityDaysLogged = rows.reduce((s, r) => s + r.daysLogged, 0);
  const facilityDaysPossible = facilityCount * daysInWindow;

  return {
    from: window.from,
    to: window.to,
    windowLabel: window.label,
    daysInWindow,
    facilityCount,
    facilityDaysLogged,
    facilityDaysPossible,
    aggregateCoveragePct: pct(facilityDaysLogged, facilityDaysPossible),
    facilitiesNeverLogged: rows.filter((r) => r.daysLogged === 0).length,
    daily,
    facilities: rows,
    byKind,
  };
}

/** The daily series as `{date, value}` points, for the chart primitives. */
export function coveragePoints(
  report: PumperCoverageReport
): { date: string; value: number }[] {
  return report.daily.map((d) => ({ date: d.date, value: d.coveragePct }));
}
