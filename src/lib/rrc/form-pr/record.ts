/**
 * Identity of a Form PR record: which RRC record it reports, and the key the
 * draft tables, validator and upload matcher all agree on. Pure.
 */

import type { PrRecord } from "./spec";

/**
 * The record's RRC identifier: exactly one of oil lease number / gas ID,
 * drilling permit, or API number is set on a valid record (PR007/PR092).
 */
export function recordIdentifier(r: Pick<PrRecord, "leaseOrGasId" | "drillingPermitNo" | "apiNo">): string {
  return r.leaseOrGasId || r.drillingPermitNo || r.apiNo;
}

/**
 * "Same lease" in the RRC's sense: district + RRC identifier + commingle permit
 * (spec:147-148). e.g. `7B-O-33913`, `09-G-294664`, `08-O-12343-0234`.
 */
export function recordKey(
  r: Pick<PrRecord, "district" | "leaseType" | "leaseOrGasId" | "drillingPermitNo" | "apiNo" | "comminglePermitNo">
): string {
  const base = `${r.district}-${r.leaseType}-${recordIdentifier(r)}`;
  return r.comminglePermitNo ? `${base}-${r.comminglePermitNo}` : base;
}

/** PR item 2's length limit (spec:879). */
export const RECORD_UNIQUE_MAX = 20;

/**
 * PR item 2 as the operator reads it: the lease name with everything that is
 * not a letter or digit removed, upper case, cut to 20 (`Andrews "A"` gives
 * `ANDREWSA`, `HARMONSON 100 #1R` gives `HARMONSON1001R`). The RRC uses item 2
 * only to name a record on its rejected-records report and does not validate
 * it (spec:879-887), so the name the operator knows the lease by is the most
 * useful thing to put there. Empty when the name is blank; see `recordUnique`.
 */
export function leaseMnemonic(leaseName: string): string {
  return leaseName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, RECORD_UNIQUE_MAX);
}

/**
 * The fallback for item 2 when a record has no lease name: cycle + key without
 * the separators, e.g. `202608-7BO33913`, so an RRC rejection still names the
 * record in a form a person can read back.
 */
export function recordUnique(cycle: string, r: Parameters<typeof recordKey>[0]): string {
  const id = `${cycle}-${r.district}${r.leaseType}${recordIdentifier(r)}`;
  return (r.comminglePermitNo ? `${id}-${r.comminglePermitNo}` : id).slice(0, RECORD_UNIQUE_MAX);
}

/**
 * Item 2 for every record of a file: the lease mnemonic, else the fallback,
 * made distinct within the file. The RRC does not require distinct values, but
 * two records with the same one "preclude the filer utilizing this as an aid
 * to identification" (spec:885-887), and an oil lease and a gas ID can share a
 * lease name. The second and later holders of a name get `-2`, `-3`, ... in
 * record order, trimmed so the whole still fits in 20.
 */
export function assignRecordUniques(
  cycle: string,
  records: Pick<
    PrRecord,
    "leaseName" | "recordUnique" | "district" | "leaseType" | "leaseOrGasId" | "drillingPermitNo" | "apiNo" | "comminglePermitNo"
  >[]
): void {
  const seen = new Map<string, number>();
  for (const r of records) {
    const base = leaseMnemonic(r.leaseName) || recordUnique(cycle, r);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    if (n === 1) {
      r.recordUnique = base;
    } else {
      const suffix = `-${n}`;
      r.recordUnique = base.slice(0, RECORD_UNIQUE_MAX - suffix.length) + suffix;
    }
  }
}

/** An operator number as the RRC keys it: six digits, zero padded. */
export function padOperatorNo(n: string): string {
  const digits = n.replace(/\D/g, "");
  return digits ? digits.padStart(6, "0") : "";
}
