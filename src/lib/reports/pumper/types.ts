/**
 * Pumper Report types - the shapes shared by the loader, the pure derive, the
 * exports, and the View modal.
 *
 * WHAT THIS REPORT IS FOR (client spec, 2026-07-26): month to date, what
 * percentage of the operator's facilities did the pumper actually visit each day?
 * The signal is simply whether anything was LOGGED against a facility on a day -  * a gauge, a meter reading. No reading means no visit; that is the whole
 * definition, and it is deliberately crude because it is the only evidence the
 * operator has that someone was on the lease.
 *
 * A "facility" is one of four things the pumper walks up to:
 *
 *  - a TANK BATTERY (oil) - visited when any tank on it is gauged that day, so a
 *    four-tank battery is one stop, not four;
 *  - a WATER TANK - per tank, because a water tank is its own stop;
 *  - a GAS METER;
 *  - a WATER METER (an SWD/injection meter).
 *
 * A standalone oil tank (linked to no battery) is carried as its own facility
 * rather than dropped - otherwise a real stop, and its readings, would vanish
 * from the coverage rate.
 *
 * Pure types: no React, no Node, safe to import anywhere.
 */

/** The kinds of facility a pumper visit is counted against. */
export type PumperFacilityKind =
  | "oil-battery"
  | "oil-tank"
  | "water-tank"
  | "gas-meter"
  | "water-meter";

/** How each kind is named to a reader (tables, chart labels, prose). */
export const FACILITY_KIND_LABEL: Record<PumperFacilityKind, string> = {
  "oil-battery": "Tank battery",
  "oil-tank": "Oil tank",
  "water-tank": "Water tank",
  "gas-meter": "Gas meter",
  "water-meter": "Water meter",
};

/**
 * Plural forms, spelled out rather than suffixed: "batterys" is what a naive
 * `${label}s` produces, and it appears in a document an operator hands to their
 * banker.
 */
export const FACILITY_KIND_PLURAL: Record<PumperFacilityKind, string> = {
  "oil-battery": "Tank batteries",
  "oil-tank": "Oil tanks",
  "water-tank": "Water tanks",
  "gas-meter": "Gas meters",
  "water-meter": "Water meters",
};

/**
 * Fixed reporting order for the kinds, so the by-kind block reads the same way
 * on every run regardless of what the org happens to own.
 */
export const FACILITY_KIND_ORDER: PumperFacilityKind[] = [
  "oil-battery",
  "oil-tank",
  "water-tank",
  "gas-meter",
  "water-meter",
];

/** One facility in the roster the coverage rate is measured against. */
export interface PumperFacility {
  /** Stable id, namespaced by source (`battery:<uuid>`, `tank:<uuid>`, `meter:<uuid>`). */
  id: string;
  name: string;
  kind: PumperFacilityKind;
}

/**
 * "Something was logged against this facility on this day." Emitted once per
 * underlying reading; the derive de-duplicates to one visit per facility-day, so
 * gauging three tanks on a battery is one visit, not three.
 */
export interface PumperLog {
  facilityId: string;
  /** ISO `YYYY-MM-DD`. */
  date: string;
}

/** One day's aggregate: how many facilities were visited, out of how many. */
export interface PumperDailyCoverage {
  date: string;
  facilitiesLogged: number;
  facilityCount: number;
  /** `facilitiesLogged / facilityCount × 100`; 0 when there are no facilities. */
  coveragePct: number;
}

/** One facility's visitation rate across the window. */
export interface PumperFacilityCoverage {
  facilityId: string;
  facilityName: string;
  kind: PumperFacilityKind;
  kindLabel: string;
  /** Days in the window with at least one logged reading. */
  daysLogged: number;
  daysInWindow: number;
  /** `daysLogged / daysInWindow × 100`. */
  coveragePct: number;
  /** Latest logged day IN THE WINDOW, or null if never logged in it. */
  lastLogged: string | null;
  /** Days from `lastLogged` to the window end, or null if never logged. */
  daysSinceLast: number | null;
}

/** Coverage rolled up to a facility kind. */
export interface PumperKindCoverage {
  kind: PumperFacilityKind;
  kindLabel: string;
  facilityCount: number;
  /** Facility-days logged across this kind. */
  daysLogged: number;
  /** `daysLogged / (facilityCount × daysInWindow) × 100`. */
  coveragePct: number;
}

/** The whole report: window, headline rates, the daily series, the table. */
export interface PumperCoverageReport {
  /** Inclusive ISO window bounds and the label printed under the title. */
  from: string;
  to: string;
  windowLabel: string;
  daysInWindow: number;
  facilityCount: number;
  /** Facility-days with a logged reading. */
  facilityDaysLogged: number;
  /** `facilityCount × daysInWindow` - the denominator of the headline rate. */
  facilityDaysPossible: number;
  /**
   * The headline: facility-days logged / facility-days possible × 100. Equal by
   * construction to the mean of `daily[].coveragePct`, which is what the line
   * chart plots - the number and the chart cannot disagree.
   */
  aggregateCoveragePct: number;
  /** Facilities with no logged reading anywhere in the window. */
  facilitiesNeverLogged: number;
  daily: PumperDailyCoverage[];
  /** Worst coverage first: the actionable order. */
  facilities: PumperFacilityCoverage[];
  byKind: PumperKindCoverage[];
}
