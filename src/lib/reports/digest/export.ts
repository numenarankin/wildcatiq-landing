/**
 * Tabular export of a company digest (CSV / XLSX): the same three levels the PDF
 * reports - company headline, one row per lease, one row per well - as flat
 * tables. The PDF is the composite document; the spreadsheet formats give the
 * numbers behind it.
 *
 * Every table is DERIVED from `digest.leases`, which is the digest's only grouped
 * representation, so the exports, the email, and the PDF can't drift apart or
 * disagree on a total. Pure module (no DOM, no Node - `ExportSheet` is a
 * type-only import) so it is shared by the export route and unit-testable.
 */

import { columnsToCsv } from "@/lib/export/csv";
import { EXPORT_EXT, type ExportFormat } from "@/lib/export/mime";
import type { ColumnSpec } from "@/lib/export/columns";
import type { ExportSheet } from "@/lib/export/workbook-export";
import type {
  CompanyDigest,
  DigestRollupRow,
  DigestWellRow,
  KpiDelta,
} from "@/lib/reports/digest/types";

const r1 = (n: number): number => Math.round(n * 10) / 10;

/** The flat by-lease table: each lease section without its wells. */
export function leaseRollupRows(digest: CompanyDigest): DigestRollupRow[] {
  return digest.leases.map(({ name, oil, gas, water, oilSales, revenue }) => ({
    name,
    oil,
    gas,
    water,
    oilSales,
    revenue,
  }));
}

/** One well row per well across every lease, carrying its lease for context. */
export interface DigestWellExportRow extends DigestWellRow {
  leaseName: string;
}

/** The flat by-well table, in the PDF's order (lease by revenue, then well). */
export function wellRows(digest: CompanyDigest): DigestWellExportRow[] {
  return digest.leases.flatMap((lease) =>
    lease.wells.map((w) => ({ ...w, leaseName: lease.name }))
  );
}

/**
 * Oil Sold is only carried on the MONTHLY digest: there, the number comes from
 * purchaser settlements and means something. On a daily or weekly digest it is a
 * haul that happens to fall inside the window, which invites the reader to
 * compare it against production as if it were a shortfall. Callers pass
 * `includeOilSold` rather than reading the period, so the PDF, the sheets, and
 * the tests all opt in the same way.
 */
export function digestRollupColumns(
  includeOilSold = false
): ColumnSpec<DigestRollupRow>[] {
  return [
    { header: "Lease", value: (r) => r.name, width: 26 },
    { header: "Oil (bbl)", value: (r) => r1(r.oil), numeric: true },
    { header: "Gas (mcf)", value: (r) => r1(r.gas), numeric: true },
    { header: "Water (bbl)", value: (r) => r1(r.water), numeric: true },
    ...(includeOilSold
      ? [
          {
            header: "Oil Sold (bbl)",
            value: (r: DigestRollupRow) => r1(r.oilSales),
            numeric: true,
          },
        ]
      : []),
    { header: "Revenue", value: (r) => Math.round(r.revenue), money: true, width: 16 },
  ];
}

/**
 * Per-well columns. The lease column is dropped inside a lease's own section
 * (`withLease: false`), where repeating the lease name in every row is noise.
 *
 * Typed on `DigestWellRow` with the lease reached through the wider export row,
 * so the same spec serves a lease's own table (plain well rows) and the flat
 * by-well sheet (rows carrying their lease).
 */
export function digestWellColumns(
  includeOilSold = false,
  withLease = false
): ColumnSpec<DigestWellExportRow>[] {
  return [
    ...(withLease
      ? [
          {
            header: "Lease",
            value: (r: DigestWellExportRow) => r.leaseName,
            width: 22,
          },
        ]
      : []),
    { header: "Well", value: (r) => r.wellName, width: 26 },
    { header: "Oil (bbl)", value: (r) => r1(r.oil), numeric: true },
    { header: "Gas (mcf)", value: (r) => r1(r.gas), numeric: true },
    { header: "Water (bbl)", value: (r) => r1(r.water), numeric: true },
    ...(includeOilSold
      ? [
          {
            header: "Oil Sold (bbl)",
            value: (r: DigestWellExportRow) => r1(r.oilSales),
            numeric: true,
          },
        ]
      : []),
    { header: "Revenue", value: (r) => Math.round(r.revenue), money: true, width: 16 },
  ];
}

/** A company-headline row: the measure, the window's value, and the prior window. */
export interface DigestMetricRow {
  metric: string;
  value: number;
  prior: number | null;
  changePct: number | null;
}

export const DIGEST_METRIC_COLUMNS: ColumnSpec<DigestMetricRow>[] = [
  { header: "Metric", value: (m) => m.metric, width: 22 },
  { header: "Value", value: (m) => r1(m.value), numeric: true, width: 16 },
  { header: "Prior Period", value: (m) => (m.prior == null ? null : r1(m.prior)), numeric: true, width: 16 },
  { header: "Change %", value: (m) => (m.changePct == null ? null : Math.round(m.changePct)), numeric: true },
];

const metric = (name: string, d: KpiDelta): DigestMetricRow => ({
  metric: name,
  value: d.value,
  prior: d.prior,
  changePct: d.changePct,
});

/** The company headline as metric rows, mirroring the PDF's KPI tiles. */
export function companyMetricRows(digest: CompanyDigest): DigestMetricRow[] {
  const k = digest.kpis;
  const rows = [
    metric("Oil (bbl)", k.oil),
    metric("Gas (mcf)", k.gas),
    metric("Water (bbl)", k.water),
    ...(digest.period === "monthly" ? [metric("Oil Sold (bbl)", k.oilSales)] : []),
    metric(
      k.revenueBasis === "settled" ? "Revenue (settled)" : "Revenue (estimated)",
      k.revenue
    ),
  ];
  if (k.revenueBasis === "settled" && k.revenueEstimate != null) {
    rows.push({
      metric: "Revenue (estimated)",
      value: k.revenueEstimate,
      prior: null,
      changePct: k.revenueVariancePct,
    });
  }
  // Only shown when there is something to explain: settled dollars that had no
  // well to land on. Keeps the three levels reconciling to the headline.
  if (digest.unallocatedRevenue > 0) {
    rows.push({
      metric: "Revenue (unallocated)",
      value: digest.unallocatedRevenue,
      prior: null,
      changePct: null,
    });
  }
  return rows;
}

/**
 * The digest's three tables, in report order. XLSX renders them as three sheets
 * (plus the generated cover); CSV as a zip of three files.
 */
export function digestSheets(digest: CompanyDigest): ExportSheet<unknown>[] {
  const includeOilSold = digest.period === "monthly";
  return [
    {
      name: "Company",
      columns: DIGEST_METRIC_COLUMNS,
      rows: companyMetricRows(digest),
    },
    {
      name: "By Lease",
      columns: digestRollupColumns(includeOilSold),
      rows: leaseRollupRows(digest),
    },
    {
      name: "By Well",
      columns: digestWellColumns(includeOilSold, true),
      rows: wellRows(digest),
    },
  ] as ExportSheet<unknown>[];
}

/** The by-lease rollup as a standalone CSV (used by the email + tests). */
export function digestRollupToCsv(digest: CompanyDigest): string {
  return columnsToCsv(
    digestRollupColumns(digest.period === "monthly"),
    leaseRollupRows(digest)
  );
}

export function digestFilename(
  period: string,
  basis: string,
  format: ExportFormat
): string {
  const suffix = basis === "settled" ? "-settled" : "";
  return `company-digest-${period}${suffix}.${EXPORT_EXT[format]}`;
}
