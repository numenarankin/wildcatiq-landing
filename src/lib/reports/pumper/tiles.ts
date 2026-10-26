/**
 * The Pumper Report's headline stat tiles, defined once for every surface that
 * shows them.
 *
 * Same pattern as the digest's `@/lib/reports/digest/kpi-tiles`: the PDF draws
 * these as bordered tiles, the markdown rendering emits them as a `kpi` fence
 * (see `../digest/kpi-embed`) that the renderer turns into the same cards, and
 * the narrator reads them as the opening figures. One list, so a tile's label,
 * value, or colour cannot differ between renderings.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

import type { KpiTile } from "@/lib/reports/digest/kpi-tiles";
import type { PumperCoverageReport } from "@/lib/reports/pumper/types";

const pct1 = (n: number): string => `${Math.round(n * 10) / 10}%`;

/** The four figures the report opens with. */
export function pumperTiles(report: PumperCoverageReport): KpiTile[] {
  const missed = report.facilitiesNeverLogged;
  return [
    {
      label: "Coverage",
      value: pct1(report.aggregateCoveragePct),
      note: `${report.facilityDaysLogged} of ${report.facilityDaysPossible} facility-days`,
      tone: "flat",
    },
    {
      label: "Facilities",
      value: String(report.facilityCount),
      note: "",
      tone: "flat",
    },
    {
      label: "Days in range",
      value: String(report.daysInWindow),
      note: "",
      tone: "flat",
    },
    {
      // A facility nobody visited is the one finding on this page worth colour.
      label: "Never visited",
      value: String(missed),
      note:
        missed === 0
          ? "every facility got at least one visit"
          : "no reading anywhere in the range",
      tone: missed === 0 ? "flat" : "down",
    },
  ];
}
