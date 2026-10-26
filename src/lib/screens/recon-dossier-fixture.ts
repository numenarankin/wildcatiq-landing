/**
 * Sky Resources' simulated leases as Recon's mirror would serve them: one
 * `LeaseDossier` per lease and the operator tree Browse lists. Every volume is
 * `leaseCycles()` (the Dashboard's per-well series summed per lease and
 * rounded), so every row the dossier shows equals the Dashboard's month. The
 * RRC publishes about three months behind, so the dossier ends at the last
 * reported cycle, July, as the Market view does. On an oil lease the RRC books the gas as
 * casinghead, so the Dashboard's gas lands in `csgd_prod_vol`.
 */
import type {
  DispositionMonth,
  LeaseDossier,
  LeaseMonth,
  LeaseWell,
  OperatorTree,
} from "@/lib/scout/rrc-types";
import { dashboardFixture } from "./dashboard-fixture";
import { PURCHASERS } from "./operator";
import {
  FIELD_NAME,
  FIELD_NO,
  LEASES,
  OPERATOR,
  RRC_LEASE_NO,
  WELLS,
  WELL_API,
  SKY_OPERATOR_NO,
  SKY_P5_NAME,
  endingStock,
  leaseCycles,
  rrcLeaseName,
} from "./recon-rrc";
import { MARKET_REPORTED } from "./recon-market-fixture";

/** The last cycle the RRC has published: the dossier stops where the Market view does. */
export const DOSSIER_THROUGH = MARKET_REPORTED;

/** District 09 as PDQ keys it (`rrc-districts.ts`). */
const PDQ_DISTRICT = "13";

/**
 * Surface locations (simulated): the five leases sit in the country west and
 * north of Graham, Young County, around the Recon permit (`reconPermit`).
 */
export const LEASE_CENTER: Record<string, [number, number]> = {
  "l-johnson": [-98.662, 33.131],
  "l-smith": [-98.628, 33.162],
  "l-corbett": [-98.701, 33.098],
  "l-young": [-98.556, 33.181],
  "l-parrott": [-98.64, 33.072],
};

/** Where a lease's i-th well sits: a small ring around the lease centre. */
export function wellLngLat(leaseId: string, i: number): [number, number] {
  const [lng, lat] = LEASE_CENTER[leaseId];
  return [lng + 0.005 * Math.cos(i * 2.1), lat + 0.004 * Math.sin(i * 2.1)];
}


/** "Johnson A 3" -> "3", "Fannie Young 2A" -> "2A". */
const wellNo = (name: string) => name.split(" ").at(-1) ?? name;

function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const FUEL_SHARE = 0.03;

function buildLease(leaseId: string): LeaseDossier {
  const lease = LEASES.find((l) => l.id === leaseId)!;
  const wells = WELLS.filter((w) => w.lease === leaseId);
  const fx = dashboardFixture();
  const cycles = leaseCycles(leaseId, DOSSIER_THROUGH);

  const monthly: LeaseMonth[] = cycles.map((c) => {
    const end = endingStock(leaseId, c.month);
    const open = endingStock(leaseId, prevMonth(c.month));
    return {
      cycle: c.month,
      oil_prod_vol: c.oil,
      // Young County Regular is non-prorated: the RRC carries no oil allowable.
      oil_allow: null,
      oil_ending_bal: end,
      gas_prod_vol: 0,
      gas_allow: null,
      gas_lift_inj_vol: null,
      cond_prod_vol: 0,
      cond_limit: null,
      cond_ending_bal: null,
      csgd_prod_vol: c.gas,
      csgd_limit: null,
      csgd_gas_lift: null,
      oil_tot_disp: open + c.oil - end,
      gas_tot_disp: null,
      cond_tot_disp: null,
      csgd_tot_disp: c.gas,
      prod_report_filed: "Y",
      reported: true,
    };
  });

  const oilDisp: DispositionMonth[] = monthly.map((m) => ({ cycle: m.cycle, codes: { "01": m.oil_tot_disp ?? 0 } }));
  const csgdDisp: DispositionMonth[] = monthly.map((m) => {
    const fuel = Math.round(m.csgd_prod_vol * FUEL_SHARE);
    return { cycle: m.cycle, codes: { "01": fuel, "03": m.csgd_prod_vol - fuel } };
  });

  const leaseWells: LeaseWell[] = wells.map((w, i) => {
    const s = fx.byWellMonthly.find((x) => x.wellId === w.id);
    const last = s?.monthly.find((m) => m.month === DOSSIER_THROUGH);
    return {
      api_number: WELL_API[w.id],
      well_no: wellNo(w.name),
      well_root_no: WELL_API[w.id].slice(3),
      well_type_name: "PRODUCING",
      county_name: "YOUNG",
      lat: wellLngLat(leaseId, i)[1],
      lon: wellLngLat(leaseId, i)[0],
      oil_bbl_per_day: last?.oilBblPerDay ?? null,
      gas_mcf_per_day: last?.gasMcfPerDay ?? null,
    };
  });

  const sum = (f: (m: LeaseMonth) => number) => monthly.reduce((a, m) => a + f(m), 0);

  return {
    oil_gas_code: "O",
    district_no: PDQ_DISTRICT,
    district_name: OPERATOR.district,
    lease_no: RRC_LEASE_NO[leaseId],
    lease_name: rrcLeaseName(lease),
    field_no: FIELD_NO,
    field_name: FIELD_NAME,
    field_type: "NON-PRORATED",
    gas_well_no: null,
    operator_no: SKY_OPERATOR_NO,
    operator_name: SKY_P5_NAME,
    off_schedule: false,
    severance: false,
    monthly,
    disposition: { oil: oilDisp, gas: [], cond: [], csgd: csgdDisp },
    counties: [
      {
        county_no: OPERATOR.countyCode,
        county_name: "YOUNG",
        oil_prod_vol: sum((m) => m.oil_prod_vol),
        gas_prod_vol: 0,
        cond_prod_vol: 0,
        csgd_prod_vol: sum((m) => m.csgd_prod_vol),
      },
    ],
    wells: leaseWells,
    p4: {
      connections: [
        {
          product_code: "O",
          type_code: "H",
          gpn_no: "667884",
          operator_name: PURCHASERS.oil.toUpperCase(),
          actual_percent: 1,
          effective_date: "2024-03-01",
          interstate: false,
          intrastate: true,
        },
        {
          product_code: "P",
          type_code: "G",
          gpn_no: "836401",
          operator_name: PURCHASERS.gas.toUpperCase(),
          actual_percent: 1,
          effective_date: "2024-03-01",
          interstate: false,
          intrastate: true,
        },
      ],
      filings: [
        {
          effective_date: "2024-03-01",
          approval_date: "2024-03-19",
          record_type: "R",
          operator_no: SKY_OPERATOR_NO,
          operator_name: SKY_P5_NAME,
          field_no: FIELD_NO,
          changes: ["Operator", "Purchaser", "Gatherer"],
        },
      ],
    },
  };
}

const byLeaseNo = new Map<string, LeaseDossier>();

/** The dossier for an RRC lease key, or null for a lease Sky does not hold. */
export function reconLeaseDossier(leaseNo: string): LeaseDossier | null {
  const id = Object.keys(RRC_LEASE_NO).find((k) => RRC_LEASE_NO[k] === leaseNo);
  if (!id) return null;
  if (!byLeaseNo.has(leaseNo)) byLeaseNo.set(leaseNo, buildLease(id));
  return byLeaseNo.get(leaseNo)!;
}

/** Johnson A, the lease the Dossiers section opens. */
export const JOHNSON_A_KEY = { oil_gas_code: "O", district_no: PDQ_DISTRICT, lease_no: RRC_LEASE_NO["l-johnson"] };

/** Every lease Sky holds, as `getOperatorTree` returns it. */
export function skyTree(): OperatorTree {
  return {
    operator_number: SKY_OPERATOR_NO,
    operator_name: SKY_P5_NAME,
    leases: LEASES.map((l) => ({
      oil_gas_code: "O" as const,
      district_no: PDQ_DISTRICT,
      lease_no: RRC_LEASE_NO[l.id],
      lease_name: rrcLeaseName(l),
      field_name: FIELD_NAME,
      wells: WELLS.filter((w) => w.lease === l.id).map((w) => ({
        api_number: WELL_API[w.id],
        well_no: wellNo(w.name),
        lease_name: rrcLeaseName(l),
        well_type_name: "PRODUCING" as const,
        county_name: "YOUNG",
      })),
    })),
  };
}
