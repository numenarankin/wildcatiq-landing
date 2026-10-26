import type { LeaseSummaryRow, LeaseWellRow } from "@/lib/analytics/lease-summaries";

/**
 * The wells a lease row expands into, keyed by the row's key.
 *
 * Only wells with something ALLOCATED to them on their last measured day: a
 * well allocated nothing (shut in, or a battery with the whole allocation on
 * its siblings) has a zero on every column and would only pad the list. The
 * rows come from the same rollup the lease row was summed from
 * (`getLeaseSummaries`), so a lease's wells add up to it exactly; the test
 * beside this pins that.
 */
export function wellsByRow(
  rows: readonly LeaseSummaryRow[],
  wells: readonly LeaseWellRow[]
): Map<string, LeaseWellRow[]> {
  const out = new Map<string, LeaseWellRow[]>();
  const keyByLease = new Map<string | null, string>(rows.map((r) => [r.leaseId, r.key]));
  for (const w of wells) {
    if (!(w.oilBbl > 0 || w.gasMcf > 0)) continue;
    const key = keyByLease.get(w.leaseId ?? null);
    if (key === undefined) continue;
    const at = out.get(key);
    if (at) at.push(w);
    else out.set(key, [w]);
  }
  return out;
}
