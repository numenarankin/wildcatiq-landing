/**
 * Texas RRC Form PR EDI: the record layouts and code sets, transcribed from the
 * RRC's "Oil and Gas Production Report (Form PR): Online filing of Production
 * Reports and EDI requirements", 08/01/2022
 * (`docs/rrc-form-pr/edi-filing-requirements-2022-08-01.txt`, cited `spec:NNN`).
 *
 * Pure data + tiny helpers. The writer, reader and validator all walk
 * `PR_FIELDS`, so field order and max lengths live in exactly one place.
 * Plan: `docs/plans/rrc-form-pr.md`.
 */

/** Districts the RRC accepts in PR item 4 (spec:892). Real labels, not PDQ codes. */
export const PR_DISTRICTS = [
  "01", "02", "03", "04", "05", "06", "6E", "7B", "7C", "08", "8A", "09", "10",
] as const;
export type PrDistrict = (typeof PR_DISTRICTS)[number];

/** Liquid code 2 (tank car or barge) is valid only in these (PR057/058, spec:588). */
export const TANK_CAR_DISTRICTS: readonly string[] = ["02", "03", "04"];

/** Two-letter flare/vent authority codes for gas codes 10/11 (spec:1116-1118). */
export const FLARE_AUTHORITIES = ["AR", "AE", "EP", "EX"] as const;
export type FlareAuthority = (typeof FLARE_AUTHORITIES)[number];

/** Liquid disposition codes a non-sale (disposition) run ticket can carry. */
export const TICKET_DISP_CODES = [3, 4, 5, 6, 8, 71, 72, 73, 74, 75] as const;
export type TicketDispCode = (typeof TICKET_DISP_CODES)[number];

/** Cycles on/after this carry gas codes 10/11 and must leave code 4 blank (spec:25-38). */
export const FLARE_CODES_FROM = "202109";
/** Cycles on/after this REQUIRE the 10/11 authority remark (spec:41-42). */
export const FLARE_REMARK_REQUIRED_FROM = "202201";
/** Earliest cycle the RRC accepts late/corrected reports for (spec:74-76). */
export const FIRST_CYCLE = "199301";

/**
 * How a field is written.
 *  - `lit`: the literal report type.
 *  - `text`: free text, sanitized and length-checked.
 *  - `yn`: boolean written `Y` / `N`.
 *  - `cycle`: `YYYYMM`.
 *  - `vol`: a production or storage volume, `0` when there is nothing.
 *  - `disp`: a disposition volume, also `0` when there is nothing. The plan
 *    read PR041/042/068/069 (spec:475) as forbidding a bare `0`; the accepted
 *    golden file writes `0` in every disposition column, so that is the rule.
 *    `gasDisp4` (retired) is the one exception: a single space (write.ts).
 */
export type FieldKind = "lit" | "text" | "yn" | "cycle" | "vol" | "disp";

interface FieldDef {
  readonly key: string;
  readonly label: string;
  readonly max: number;
  readonly kind: FieldKind;
}

/** The 50 PR record fields, in file order (spec:870-1132). */
export const PR_FIELDS = [
  { key: "reportType", label: "Report Type", max: 3, kind: "lit" },
  { key: "recordUnique", label: "Record Unique", max: 20, kind: "text" },
  { key: "operatorNo", label: "Operator Number", max: 6, kind: "text" },
  { key: "district", label: "District", max: 2, kind: "text" },
  { key: "leaseType", label: "Lease Type", max: 1, kind: "text" },
  { key: "leaseOrGasId", label: "Oil Lease Number / Gas ID", max: 6, kind: "text" },
  { key: "drillingPermitNo", label: "Drilling Permit Number", max: 6, kind: "text" },
  { key: "apiNo", label: "API Number", max: 8, kind: "text" },
  { key: "corrected", label: "Corrected Report", max: 1, kind: "yn" },
  { key: "leaseTotalLine", label: "Lease Total Line", max: 1, kind: "yn" },
  { key: "comminglePermitNo", label: "Commingle Permit Number", max: 5, kind: "text" },
  { key: "commingleRemark", label: "Commingle One-time Use Remark", max: 50, kind: "text" },
  { key: "cycle", label: "Cycle Date", max: 6, kind: "cycle" },
  { key: "gasProduction", label: "Gas Formation Production", max: 9, kind: "vol" },
  { key: "gasDisp1", label: "Gas Code 1 Lease/Field Fuel", max: 9, kind: "disp" },
  { key: "gasDisp2", label: "Gas Code 2 Transmission Line", max: 9, kind: "disp" },
  { key: "gasDisp3", label: "Gas Code 3 Processing Plant", max: 9, kind: "disp" },
  { key: "gasDisp4", label: "Gas Code 4 Vented or Flared", max: 9, kind: "disp" },
  { key: "gasDisp4Remark", label: "Gas Code 4 Remark", max: 20, kind: "text" },
  { key: "gasDisp5", label: "Gas Code 5 Gas Lift", max: 9, kind: "disp" },
  { key: "gasDisp6", label: "Gas Code 6 Pressure Maintenance", max: 9, kind: "disp" },
  { key: "gasDisp7", label: "Gas Code 7 Carbon Black", max: 9, kind: "disp" },
  { key: "gasDisp7Plant", label: "Gas Code 7 Plant Name", max: 50, kind: "text" },
  { key: "gasDisp8", label: "Gas Code 8 Underground Storage", max: 9, kind: "disp" },
  { key: "liqProduction", label: "Liquid Production", max: 7, kind: "vol" },
  { key: "liqDisp0", label: "Liquid Code 0 Pipeline", max: 7, kind: "disp" },
  { key: "liqDisp1", label: "Liquid Code 1 Truck", max: 7, kind: "disp" },
  { key: "liqDisp2", label: "Liquid Code 2 Tank Car or Barge", max: 7, kind: "disp" },
  { key: "liqDisp3", label: "Liquid Code 3 Net Tank Cleaning", max: 7, kind: "disp" },
  { key: "liqDisp3Remark", label: "Liquid Code 3 Remark", max: 50, kind: "text" },
  { key: "liqDisp4", label: "Liquid Code 4 Circulating", max: 7, kind: "disp" },
  { key: "liqDisp4Remark", label: "Liquid Code 4 Remark", max: 50, kind: "text" },
  { key: "liqDisp5", label: "Liquid Code 5 Lost", max: 7, kind: "disp" },
  { key: "liqDisp6", label: "Liquid Code 6 Sedimentation", max: 7, kind: "disp" },
  { key: "liqDisp6Remark", label: "Liquid Code 6 Remark", max: 50, kind: "text" },
  { key: "liqDisp71", label: "Liquid Code 71 Operator Change", max: 7, kind: "disp" },
  { key: "liqDisp72", label: "Liquid Code 72 Road Oil", max: 7, kind: "disp" },
  { key: "liqDisp73", label: "Liquid Code 73 Lease Use", max: 7, kind: "disp" },
  { key: "liqDisp74", label: "Liquid Code 74 Lost to Formation", max: 7, kind: "disp" },
  { key: "liqDisp75", label: "Liquid Code 75 Other", max: 7, kind: "disp" },
  { key: "liqDisp75Remark", label: "Liquid Code 75 Remark", max: 50, kind: "text" },
  { key: "liqDisp8", label: "Liquid Code 8 Skim Liquid", max: 7, kind: "disp" },
  { key: "liqEndingStorage", label: "Liquid Ending Storage", max: 7, kind: "vol" },
  { key: "fieldName", label: "Field Name", max: 32, kind: "text" },
  { key: "leaseName", label: "Lease Name", max: 32, kind: "text" },
  { key: "gasWellNo", label: "Gas Well Number", max: 6, kind: "text" },
  { key: "gasDisp10", label: "Gas Code 10 Flared", max: 9, kind: "disp" },
  { key: "gasDisp10Remark", label: "Gas Code 10 Remark", max: 20, kind: "text" },
  { key: "gasDisp11", label: "Gas Code 11 Vented", max: 9, kind: "disp" },
  { key: "gasDisp11Remark", label: "Gas Code 11 Remark", max: 20, kind: "text" },
] as const satisfies readonly FieldDef[];

export type PrFieldDef = (typeof PR_FIELDS)[number];
export type PrFieldKey = PrFieldDef["key"];

type KindOf<K extends PrFieldKey> = Extract<PrFieldDef, { key: K }>["kind"];
type ValueOf<Kind extends FieldKind> = Kind extends "lit"
  ? "PR"
  : Kind extends "yn"
    ? boolean
    : Kind extends "vol" | "disp"
      ? number | null
      : string;

/** One PR record. Volumes are whole numbers; `null` writes an empty field. */
export type PrRecord = { [K in PrFieldKey]: ValueOf<KindOf<K>> };

export type PrVolumeKey = Extract<PrFieldDef, { kind: "vol" | "disp" }>["key"];
export type PrTextKey = Extract<PrFieldDef, { kind: "text" }>["key"];

export const PR_FIELD_BY_KEY: ReadonlyMap<PrFieldKey, PrFieldDef & { order: number }> =
  new Map(PR_FIELDS.map((f, i) => [f.key, { ...f, order: i + 1 }]));

/** Gas disposition columns, all summed by the gas out-of-balance rule (PR078/079). */
export const GAS_DISP_KEYS = [
  "gasDisp1", "gasDisp2", "gasDisp3", "gasDisp4", "gasDisp5", "gasDisp6",
  "gasDisp7", "gasDisp8", "gasDisp10", "gasDisp11",
] as const satisfies readonly PrVolumeKey[];

/** Liquid disposition columns, all summed by the liquid out-of-balance rule (PR051/052). */
export const LIQ_DISP_KEYS = [
  "liqDisp0", "liqDisp1", "liqDisp2", "liqDisp3", "liqDisp4", "liqDisp5",
  "liqDisp6", "liqDisp71", "liqDisp72", "liqDisp73", "liqDisp74", "liqDisp75",
  "liqDisp8",
] as const satisfies readonly PrVolumeKey[];

/** Which liquid column a coded disposition ticket lands in. */
export const LIQ_DISP_KEY_BY_CODE: Record<TicketDispCode, PrVolumeKey> = {
  3: "liqDisp3",
  4: "liqDisp4",
  5: "liqDisp5",
  6: "liqDisp6",
  8: "liqDisp8",
  71: "liqDisp71",
  72: "liqDisp72",
  73: "liqDisp73",
  74: "liqDisp74",
  75: "liqDisp75",
};

/** The remark column a coded disposition's explanation goes in, where one exists. */
export const LIQ_REMARK_KEY_BY_CODE: Partial<Record<TicketDispCode, PrTextKey>> = {
  3: "liqDisp3Remark",
  4: "liqDisp4Remark",
  6: "liqDisp6Remark",
  75: "liqDisp75Remark",
};

/** The Identifying Record (spec:835-862). */
export interface PrHeader {
  delimiter: "rcb" | "tab";
  agentUserId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  /** Set by the writer from the records it writes; ignored on input. */
  recordCount: number;
  currentProductionMonth: boolean;
}

export const HEADER_FIELDS = [
  { key: "delimiter", label: "Delimiter", max: 3 },
  { key: "agentUserId", label: "Agent userID", max: 9 },
  { key: "agentName", label: "Agent name", max: 50 },
  { key: "agentEmail", label: "Agent e-mail address", max: 50 },
  { key: "agentPhone", label: "Agent phone number", max: 10 },
  { key: "recordCount", label: "Record Count", max: 9 },
  { key: "currentProductionMonth", label: "Current Production Month", max: 1 },
] as const;

/** A record with every field empty; the base the builder and reader fill. */
export function emptyRecord(): PrRecord {
  const out: Record<string, unknown> = {};
  for (const f of PR_FIELDS) {
    out[f.key] =
      f.kind === "lit" ? "PR"
      : f.kind === "yn" ? false
      : f.kind === "vol" || f.kind === "disp" ? null
      : "";
  }
  return out as PrRecord;
}

// --- Cycles -----------------------------------------------------------------

/** `YYYYMM` for a date (ISO `YYYY-MM-DD` or a `Date`). */
export function cycleOf(date: string): string {
  return date.slice(0, 4) + date.slice(5, 7);
}

/** Is this a well-formed `YYYYMM` for a real month (PR093)? */
export function isCycle(value: string): boolean {
  if (!/^\d{6}$/.test(value)) return false;
  const m = Number(value.slice(4));
  return m >= 1 && m <= 12;
}

/** The cycle `n` months after `cycle` (negative goes back). */
export function addCycles(cycle: string, n: number): string {
  const y = Number(cycle.slice(0, 4));
  const m = Number(cycle.slice(4)) - 1 + n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}${String(mm + 1).padStart(2, "0")}`;
}

/**
 * The current production cycle on `today` (ISO date): the month before today's.
 * Its report is due by the last day of today's month (Form PR instructions).
 */
export function currentCycle(today: string): string {
  return addCycles(cycleOf(today), -1);
}

/** Has the cycle's month ended by `today`, so the RRC accepts it (spec:817, PR094)? */
export function cycleHasEnded(cycle: string, today: string): boolean {
  return cycle < cycleOf(today);
}

/** ISO first and last day of a cycle month. */
export function cycleBounds(cycle: string): { from: string; to: string } {
  const y = Number(cycle.slice(0, 4));
  const m = Number(cycle.slice(4));
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

/** Due date (ISO): the last day of the month after the cycle. */
export function cycleDueDate(cycle: string): string {
  return cycleBounds(addCycles(cycle, 1)).to;
}

/** "August 2026" for a cycle. */
export function cycleLabel(cycle: string): string {
  const y = Number(cycle.slice(0, 4));
  const m = Number(cycle.slice(4));
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
