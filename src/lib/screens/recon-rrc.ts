/**
 * Sky Resources as the RRC knows it: the P-5 number and name (the real
 * operator's), then one oil lease number per lease, an API per well and the
 * lease's monthly volumes, all simulated. Recon's dossiers and tree and the
 * Form PR records all read these, so a lease number or a September barrel
 * count is the same on every page. Volumes come from `dashboardFixture()`
 * (never typed), rounded to whole barrels and MCF per lease the way a PR
 * record carries them.
 *
 * The lease numbers and APIs were checked absent from the RRC's District 09
 * oil leases and Young County wellbores, so none of them is a real record.
 */
import { dashboardFixture } from "./dashboard-fixture";
import { tankMonthOf } from "./documents-tanks";
import { LEASES, OPERATOR, WELLS, type LeaseSpec } from "./operator";

export { FIELD_NAME, FIELD_NO, RRC_LEASE_NO, SKY_OPERATOR_NO, SKY_P5_NAME, WELL_API, apiDashed } from "./rrc-ids";

/** The RRC's upper-case lease name, as the lease master and the PR carry it. */
export const rrcLeaseName = (l: LeaseSpec) => l.name.toUpperCase();

export interface LeaseCycle {
  /** `YYYY-MM`. */
  month: string;
  oil: number;
  gas: number;
}

/**
 * A lease's months from the Dashboard's per-well series, oldest first: the
 * sum over the lease's wells, rounded once to whole barrels and MCF.
 * `throughMonth` drops the months after it (the RRC has not got them yet).
 */
export function leaseCycles(leaseId: string, throughMonth?: string): LeaseCycle[] {
  const fx = dashboardFixture();
  const series = fx.byWellMonthly.filter((s) => WELLS.find((w) => w.id === s.wellId)?.lease === leaseId);
  const months = series[0]?.monthly.map((m) => m.month) ?? [];
  return months
    .filter((m) => !throughMonth || m <= throughMonth)
    .map((month, i) => ({
      month,
      oil: Math.round(series.reduce((a, s) => a + s.monthly[i].oilBbl, 0)),
      gas: Math.round(series.reduce((a, s) => a + s.monthly[i].gasMcf, 0)),
    }));
}

/** One lease's volumes for one month (`YYYY-MM`). */
export function leaseMonth(leaseId: string, month: string): LeaseCycle {
  return leaseCycles(leaseId).find((c) => c.month === month) ?? { month, oil: 0, gas: 0 };
}

/**
 * Oil in each lease's tank at the end of August and September 2026, bbl: the
 * Documents page's tank month (`tankMonthOf`), so the Form PR's ending storage,
 * the lease dossier's "In tank" and the gauge sheets are one stock, and the
 * PR's disposition (opening + production - closing) is the barrels hauled.
 */
export const ENDING_STOCK: Record<string, { aug: number; sep: number }> = Object.fromEntries(
  LEASES.map((l) => {
    const m = tankMonthOf(l.id, "2026-09");
    return [l.id, { aug: Math.round(m.openingBbl), sep: Math.round(m.closingBbl) }];
  })
);

/** Oil in the lease's tanks at the end of a month: the gauges above, and a steady 60 to 180 bbl before them. */
export function endingStock(leaseId: string, month: string): number {
  const e = ENDING_STOCK[leaseId];
  if (month === "2026-09") return e.sep;
  if (month === "2026-08") return e.aug;
  const [y, m] = month.split("-").map(Number);
  const x = Math.sin((y * 12 + m) * 12.9898 + leaseId.length * 78.233) * 43758.5453;
  return Math.round(60 + 120 * (x - Math.floor(x)));
}

export { LEASES, OPERATOR, WELLS };
