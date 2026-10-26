/**
 * Pumper Report → markdown: the text rendering of the PDF.
 *
 * It carries EVERYTHING the PDF carries, in the PDF's order: the narrative, the
 * headline tiles (as a ```kpi fence the renderer turns into the same cards), the
 * methodology note, the coverage chart (as a ```chart fence the renderer draws
 * with the very code the PDF draws it with), and both tables. Same reasoning as
 * the digest's markdown: a text view that quietly dropped the tiles and the chart
 * would be the most misleading kind of preview, because it looks complete.
 *
 * Everything reads from the same `PumperCoverageReport` the PDF renders, so the
 * two cannot disagree on a number.
 *
 * Pure module (no React, no Node) - safe to import anywhere.
 */

import { formatCell, type ColumnSpec } from "@/lib/export/columns";
import { chartFence } from "@/lib/reports/digest/chart-embed";
import { kpiFence } from "@/lib/reports/digest/kpi-embed";
import { COVERAGE_CHART_TITLE, COVERAGE_METHOD_NOTE } from "@/lib/reports/pumper/copy";
import { coveragePoints } from "@/lib/reports/pumper/coverage";
import {
  PUMPER_DAILY_COLUMNS,
  PUMPER_FACILITY_COLUMNS,
} from "@/lib/reports/pumper/export";
import { pumperTiles } from "@/lib/reports/pumper/tiles";
import {
  FACILITY_KIND_PLURAL,
  type PumperCoverageReport,
} from "@/lib/reports/pumper/types";

const pct1 = (n: number): string => `${Math.round(n * 10) / 10}%`;

/** A markdown table from a shared column set, so headers match every format. */
function table<T>(columns: ColumnSpec<T>[], rows: T[]): string {
  const head = `| ${columns.map((c) => c.header).join(" | ")} |`;
  const rule = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) =>
      `| ${columns.map((c) => formatCell(c.value(row), c)).join(" | ")} |`
  );
  return [head, rule, ...body].join("\n");
}

/** "Tank batteries 69.2% (5) · Gas meters 71.9% (4)" - where the gap sits. */
function byKindSentence(report: PumperCoverageReport): string {
  return report.byKind
    .map(
      (k) =>
        `${k.facilityCount === 1 ? k.kindLabel : FACILITY_KIND_PLURAL[k.kind]} ` +
        `${pct1(k.coveragePct)} (${k.facilityCount})`
    )
    .join(" · ");
}

export function pumperReportToMarkdown(
  report: PumperCoverageReport,
  /** The narrative (see `./summary`); omitted leaves the block out. */
  summary?: string
): string {
  const out: string[] = [
    `# Pumper Report`,
    `${report.windowLabel} · facility coverage`,
    "",
  ];

  if (summary) out.push(`## Headline`, "", summary, "");

  if (report.facilityCount === 0) {
    out.push(
      "No active tanks or meters are on file, so there is nothing to measure coverage against.",
      ""
    );
    return out.join("\n");
  }

  // The same tiles the PDF draws, from the same list.
  out.push(kpiFence(pumperTiles(report)), "", `_${COVERAGE_METHOD_NOTE}_`, "");

  out.push(
    `## Daily coverage`,
    "",
    // The same chart the PDF draws, drawn by the same code.
    chartFence({
      kind: "coverage",
      title: COVERAGE_CHART_TITLE,
      series: coveragePoints(report),
      averagePct: report.aggregateCoveragePct,
    }),
    "",
    `By type: ${byKindSentence(report)}`,
    "",
    table(PUMPER_DAILY_COLUMNS, report.daily),
    "",
    `## Visitation rate by facility`,
    "",
    table(PUMPER_FACILITY_COLUMNS, report.facilities),
    ""
  );

  return out.join("\n");
}
