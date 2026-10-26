/**
 * Form PR EDI writer: header + records to the file text the RRC's Secure File
 * Upload accepts (spec:809-1132). Pure.
 *
 * The byte-level shape is the golden file `__tests__/fixtures/PR_00BOC.EDI`, a
 * 202607 report the RRC accepted (26 records, Borderline Operating). Where the
 * spec is silent or the file contradicts the plan's F1-F6 defaults
 * (`docs/plans/rrc-form-pr.md`), the file wins:
 *  - tab delimited, declared as `TAB` in header item 1;
 *  - CRLF after every line, including the last;
 *  - a trailing delimiter after the last field of every line (header and
 *    record), so a record line has 50 fields and 50 tabs;
 *  - every numeric column is written, `0` when there is nothing: production,
 *    ending storage AND each disposition column;
 *  - the retired gas code 4 column (item 18) holds a single space;
 *  - report type `PR` with no trailing space; text fields empty when blank.
 * `golden.test.ts` holds the writer to that file byte for byte.
 *
 * The writer never repairs data. A value it cannot write faithfully (a decimal
 * volume, a negative one, an over-long name) throws. Callers that hand out a
 * file whatever the state of the ledger ask `recordWriteError` first and leave
 * that record out, rather than writing a number the operator did not produce.
 */

import { PR_FIELDS, type PrHeader, type PrRecord } from "./spec";

export const DELIMITER_CHAR = { rcb: "}", tab: "\t" } as const;
/** Header item 1 as the accepted file spells it. */
export const DELIMITER_TOKEN = { rcb: "rcb", tab: "TAB" } as const;
export const EOL = "\r\n";

/** Item 18, gas code 4, retired 2021-09: the accepted file writes one space. */
const GAS_CODE_4_BLANK = " ";

/** Strip what would break the record structure: both delimiters and line breaks. */
export function sanitizeText(s: string): string {
  return s.replace(/[}\t\r\n]/g, " ").replace(/ {2,}/g, " ").trim();
}

/** A volume column: always a number, `0` when there is nothing to report. */
function volume(v: number | null, label: string): string {
  if (v == null) return "0";
  if (!Number.isInteger(v) || v < 0) {
    throw new Error(`Form PR writer: ${label} must be a whole number >= 0, got ${v}`);
  }
  return String(v);
}

/** One PR record's fields as strings, in file order. */
export function recordFields(r: PrRecord): string[] {
  return PR_FIELDS.map((f) => {
    const raw = r[f.key];
    let out: string;
    switch (f.kind) {
      case "lit":
        out = "PR";
        break;
      case "yn":
        out = raw ? "Y" : "N";
        break;
      case "vol":
        out = volume(raw as number | null, f.label);
        break;
      case "disp":
        // Nothing under the retired code (null, or a 0 left by a merge) is
        // the space; the validator reads both as absent (PR064/065).
        out =
          f.key === "gasDisp4" && (raw == null || raw === 0)
            ? GAS_CODE_4_BLANK
            : volume(raw as number | null, f.label);
        break;
      default:
        out = sanitizeText(String(raw ?? ""));
    }
    if (out.length > f.max) {
      throw new Error(`Form PR writer: ${f.label} "${out}" exceeds ${f.max} characters`);
    }
    return out;
  });
}

/**
 * Why this record cannot be written, or null when it can. The RRC's format has
 * no way to say "minus 51 barrels", so a record the ledger leaves impossible
 * cannot go in the file at all.
 */
export function recordWriteError(r: PrRecord): string | null {
  try {
    recordFields(r);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message.replace(/^Form PR writer: /, "") : String(e);
  }
}

/** The Identifying Record's fields, with the record count taken from `count`. */
export function headerFields(h: PrHeader, count: number): string[] {
  return [
    DELIMITER_TOKEN[h.delimiter],
    sanitizeText(h.agentUserId),
    sanitizeText(h.agentName),
    sanitizeText(h.agentEmail),
    h.agentPhone.replace(/\D/g, ""),
    String(count),
    h.currentProductionMonth ? "Y" : "N",
  ];
}

/**
 * The whole file. Header first, one line per record, a delimiter after the
 * last field and CRLF after every line.
 */
export function writePrFile(header: PrHeader, records: PrRecord[]): string {
  const d = DELIMITER_CHAR[header.delimiter];
  const lines = [
    headerFields(header, records.length).join(d),
    ...records.map((r) => recordFields(r).join(d)),
  ];
  return lines.map((l) => l + d + EOL).join("");
}

/** One file of an export. */
export interface PrExportFile {
  /** `PR_{operator}_{cycle}.EDI`, with `_corrected` on the late/corrected half. */
  name: string;
  text: string;
  records: PrRecord[];
  currentProductionMonth: boolean;
}

/**
 * Split a draft into the files the RRC allows. Current-month reports must not
 * share a file with late or corrected ones (spec:814), and header item 7 says
 * which kind the file holds (spec:858-862). A current-cycle draft with some
 * corrected records therefore becomes two files.
 */
export function planExportFiles(
  header: Omit<PrHeader, "recordCount" | "currentProductionMonth">,
  records: PrRecord[],
  opts: { cycle: string; currentCycle: string; operatorLabel: string }
): PrExportFile[] {
  const isCurrent = opts.cycle === opts.currentCycle;
  const current = isCurrent ? records.filter((r) => !r.corrected) : [];
  const late = isCurrent ? records.filter((r) => r.corrected) : records;
  const base = `PR_${opts.operatorLabel}_${opts.cycle}`;
  const files: PrExportFile[] = [];
  const make = (recs: PrRecord[], cur: boolean, suffix: string) => {
    const h: PrHeader = { ...header, recordCount: recs.length, currentProductionMonth: cur };
    files.push({ name: `${base}${suffix}.EDI`, text: writePrFile(h, recs), records: recs, currentProductionMonth: cur });
  };
  if (current.length > 0) make(current, true, "");
  if (late.length > 0) make(late, false, current.length > 0 ? "_corrected" : "");
  return files;
}
