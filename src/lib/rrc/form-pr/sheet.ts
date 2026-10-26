/**
 * The filing, readable.
 *
 * The EDI file is 50 delimited fields with no headings — correct for the RRC's
 * parser and unreadable to the person who has to stand behind it. The same
 * records go two other ways from here:
 *
 *   - `PR_SHEET_COLUMNS`: every field, labelled as the spec labels it, for the
 *     spreadsheet download.
 *   - `summaryRows`: the few figures an operator checks before filing — what
 *     each lease produced, what left, what is in the tanks.
 *
 * Both read the SAME `PrRecord[]` the file is written from, so a number on the
 * screen and a number in the file cannot drift apart.
 */

import type { ColumnSpec } from "@/lib/export/columns";
import { GAS_DISP_KEYS, LIQ_DISP_KEYS, PR_FIELDS, type PrFieldKey, type PrRecord } from "./spec";
import { recordKey } from "./record";

/** Every PR field as a spreadsheet column, in the spec's own order. */
export const PR_SHEET_COLUMNS: ColumnSpec<PrRecord>[] = PR_FIELDS.map((f) => ({
  header: f.label,
  value: (r: PrRecord) => {
    const v = r[f.key];
    if (f.kind === "lit") return "PR";
    if (f.kind === "yn") return v ? "Y" : "N";
    if (v === null || v === "") return null;
    return v as string | number;
  },
  numeric: f.kind === "vol" || f.kind === "disp",
  width: f.kind === "text" ? Math.min(Math.max(f.max, 12), 34) : undefined,
}));

const sum = (r: PrRecord, keys: readonly (keyof PrRecord)[]): number =>
  keys.reduce((s, k) => s + ((r[k] as number | null) ?? 0), 0);

export interface SummaryRow {
  record: string;
  lease: string;
  field: string;
  /** "Oil" or "Gas well", as the record type reads. */
  kind: string;
  oilProduction: number;
  oilDisposed: number;
  oilEndingStorage: number;
  gasProduction: number;
  gasDisposed: number;
  corrected: boolean;
}

/** One line per record: what an operator checks before they file. */
export function summaryRows(records: PrRecord[]): SummaryRow[] {
  return records.map((r) => ({
    record: recordKey(r),
    lease: (r.leaseName as string) || "",
    field: (r.fieldName as string) || "",
    kind: r.leaseType === "G" ? "Gas well" : "Oil lease",
    oilProduction: (r.liqProduction as number | null) ?? 0,
    oilDisposed: sum(r, LIQ_DISP_KEYS),
    oilEndingStorage: (r.liqEndingStorage as number | null) ?? 0,
    gasProduction: (r.gasProduction as number | null) ?? 0,
    gasDisposed: sum(r, GAS_DISP_KEYS),
    corrected: Boolean(r.corrected),
  }));
}

/** The summary as its own sheet, so the spreadsheet opens on something legible. */
export const SUMMARY_COLUMNS: ColumnSpec<SummaryRow>[] = [
  { header: "Record", value: (r) => r.record, width: 16 },
  { header: "Lease", value: (r) => r.lease, width: 26 },
  { header: "Field", value: (r) => r.field, width: 26 },
  { header: "Type", value: (r) => r.kind, width: 10 },
  { header: "Oil Produced (bbl)", value: (r) => r.oilProduction, numeric: true },
  { header: "Oil Disposed (bbl)", value: (r) => r.oilDisposed, numeric: true },
  { header: "Oil In Tanks (bbl)", value: (r) => r.oilEndingStorage, numeric: true },
  { header: "Gas Produced (MCF)", value: (r) => r.gasProduction, numeric: true },
  { header: "Gas Disposed (MCF)", value: (r) => r.gasDisposed, numeric: true },
  { header: "Corrected", value: (r) => (r.corrected ? "Y" : "N"), width: 11 },
];

/**
 * All fifty fields, grouped the way an operator reads a record rather than the
 * order the file writes them. Every field is in exactly one group: the review
 * screen shows the whole record or it is not a review. `fieldGroupsCover` is
 * the guard, asserted in the tests.
 */
export const FIELD_GROUPS: { title: string; keys: PrFieldKey[] }[] = [
  {
    title: "Record",
    keys: [
      "reportType", "recordUnique", "operatorNo", "district", "leaseType", "leaseOrGasId",
      "drillingPermitNo", "apiNo", "cycle", "corrected", "leaseTotalLine", "comminglePermitNo",
      "commingleRemark",
    ],
  },
  { title: "Names", keys: ["fieldName", "leaseName", "gasWellNo"] },
  {
    title: "Gas (MCF)",
    keys: [
      "gasProduction", "gasDisp1", "gasDisp2", "gasDisp3", "gasDisp4", "gasDisp4Remark", "gasDisp5",
      "gasDisp6", "gasDisp7", "gasDisp7Plant", "gasDisp8", "gasDisp10", "gasDisp10Remark",
      "gasDisp11", "gasDisp11Remark",
    ],
  },
  {
    title: "Oil / condensate (bbl)",
    keys: [
      "liqProduction", "liqDisp0", "liqDisp1", "liqDisp2", "liqDisp3", "liqDisp3Remark", "liqDisp4",
      "liqDisp4Remark", "liqDisp5", "liqDisp6", "liqDisp6Remark", "liqDisp71", "liqDisp72",
      "liqDisp73", "liqDisp74", "liqDisp75", "liqDisp75Remark", "liqDisp8", "liqEndingStorage",
    ],
  },
];

/** Every field the grouping places, in order, for comparing against the spec. */
export function fieldGroupsCover(): PrFieldKey[] {
  return FIELD_GROUPS.flatMap((g) => g.keys);
}
