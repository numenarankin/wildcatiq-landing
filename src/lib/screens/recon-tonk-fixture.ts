/**
 * Tonk Creek Operating, the neighbour the Recon pages size up for a deal, as
 * the RRC mirror would serve it: the P-5 record, officers, eight District 09
 * oil leases and 38 wellbores, its permits, completions and pluggings, and
 * the Harlan Ranch 1 completion packet. Everything here is simulated: Tonk
 * Creek is a fictional operator (`PERMIT_OPERATOR`), and its lease numbers
 * and APIs are made up.
 *
 * One source for every Tonk Creek number the site shows. The Harlan Ranch 3
 * permit is the Recon fixture's (`reconPermit`); the three Caddo offsets, their
 * first-year curve and the P-5 well count are the ones Orion quotes in
 * `orion-fixture.ts`; the operator dossier's trailing twelve months, the lease
 * dossiers and the Recon Orion answer all sum the same monthly series below.
 */
import type {
  CompletionReport,
  DispositionMonth,
  LeaseDossier,
  LeaseMonth,
  LeaseWell,
  OperatorTree,
  WellDossier,
  WellTypeName,
} from "@/lib/scout/rrc-types";
import type {
  OfficerRow,
  OperatorLease,
  OperatorPermit,
  OperatorProfile,
  OperatorWell,
  OperatorWellEvent,
  OperatorWellRates,
} from "@/lib/scout/types";
import { FIELD_NAME, FIELD_NO } from "./rrc-ids";
import { A3_LNG_LAT, HARLAN_3_PERMIT_NO, PERMIT_LNG_LAT, PERMIT_OPERATOR, milesBetween, reconPermit } from "./recon-fixture";
import { DOSSIER_THROUGH, wellLngLat } from "./recon-dossier-fixture";
import { LEASES as SKY_LEASES, PURCHASERS, WELLS as SKY_WELLS } from "./operator";

/* ---- The offsets Orion quotes ------------------------------------------- */

/**
 * Tonk Creek's three nearest producers, Caddo wells that came on in 2024 and
 * 2025: their first year averaged by month, bbl/d. A hyperbolic flush decline
 * (17.5 bbl/d initial, b 0.9, 15% a month nominal), the shape a small Caddo
 * buildup makes, rounded to a tenth as the RRC record divides out.
 */
export const OFFSET_FIRST_YEAR = Array.from({ length: 12 }, (_, t) => Math.round(caddoRate(t) * 10) / 10);

function caddoRate(t: number): number {
  return 17.5 / Math.pow(1 + 0.9 * 0.15 * t, 1 / 0.9);
}

/** The offsets as Orion lists them: name, distance and bearing from A-3, first month on, share of the average curve. */
export const OFFSETS = [
  { name: "Harlan Ranch 1", where: "0.9 mi W", online: "May 2024", share: 1.06 },
  { name: "Harlan Ranch 2", where: "1.2 mi NW", online: "Nov 2024", share: 0.99 },
  { name: "Stambaugh 6", where: "1.6 mi W", online: "Mar 2025", share: 0.95 },
] as const;

/** Tonk Creek's wellbores on the P-5: `TONK_WELLS.length`, checked below. */
export const NEIGHBOUR = { wells: 38 } as const;

export const TONK = PERMIT_OPERATOR;

/* ---- Geography ---------------------------------------------------------- */

const LNG_PER_MI = 1 / (69.17 * Math.cos((A3_LNG_LAT[1] * Math.PI) / 180));
const LAT_PER_MI = 1 / 69.0;

/** A point `mi` miles from A-3 on a compass bearing (degrees, 0 = north). */
function fromA3(mi: number, bearing: number): [number, number] {
  const r = (bearing * Math.PI) / 180;
  return [A3_LNG_LAT[0] + mi * Math.sin(r) * LNG_PER_MI, A3_LNG_LAT[1] + mi * Math.cos(r) * LAT_PER_MI];
}

/* ---- Leases and wells ---------------------------------------------------- */

/** District 09 as PDQ keys it (`rrc-districts.ts`). */
const PDQ_DISTRICT = "13";

export interface TonkLease {
  id: string;
  /** The RRC's upper-case lease name. */
  name: string;
  leaseNo: string;
  center: [number, number];
}

export const TONK_LEASES: TonkLease[] = [
  { id: "harlan", name: "HARLAN RANCH", leaseNo: "13844", center: fromA3(0.95, 300) },
  { id: "stambaugh", name: "STAMBAUGH", leaseNo: "11273", center: fromA3(1.7, 268) },
  { id: "mccluskey", name: 'MCCLUSKEY "A"', leaseNo: "12207", center: [-98.712, 33.158] },
  { id: "kisinger", name: "KISINGER", leaseNo: "10918", center: [-98.737, 33.114] },
  { id: "trammell", name: "TRAMMELL", leaseNo: "11592", center: [-98.761, 33.141] },
  { id: "dosher", name: "DOSHER", leaseNo: "10477", center: [-98.747, 33.081] },
  { id: "rollins", name: "ROLLINS", leaseNo: "12688", center: [-98.79, 33.104] },
  { id: "graves", name: "GRAVES", leaseNo: "13105", center: [-98.702, 33.049] },
];

type Kind = "producing" | "shut-in" | "injection" | "plugged";

interface TonkWellSpec {
  lease: string;
  no: string;
  /** Producing rate at the last reported cycle, bbl/d (old Strawn wells). */
  base?: number;
  /** A new Caddo well: first month on, and its share of the offset curve. */
  caddo?: { on: string; share: number };
  kind: Kind;
  /** `YYYY-MM`: a shut-in well's last month of production, or a plugged well's plug month. */
  until?: string;
  /** Exact position, for the three offsets Orion places by distance from A-3. */
  at?: [number, number];
}

const SPECS: TonkWellSpec[] = [
  { lease: "harlan", no: "1", kind: "producing", caddo: { on: "2024-05", share: 1.06 }, at: fromA3(0.9, 270) },
  { lease: "harlan", no: "2", kind: "producing", caddo: { on: "2024-11", share: 0.99 }, at: fromA3(1.2, 315) },
  { lease: "stambaugh", no: "1", kind: "producing", base: 1.4 },
  { lease: "stambaugh", no: "2", kind: "shut-in", base: 0.7, until: "2023-06" },
  { lease: "stambaugh", no: "3", kind: "producing", base: 1.1 },
  { lease: "stambaugh", no: "4", kind: "plugged", base: 0.5, until: "2019-08" },
  { lease: "stambaugh", no: "5", kind: "producing", base: 1.9 },
  { lease: "stambaugh", no: "6", kind: "producing", caddo: { on: "2025-03", share: 0.95 }, at: fromA3(1.6, 270) },
  { lease: "kisinger", no: "1", kind: "producing", base: 1.6 },
  { lease: "kisinger", no: "2", kind: "producing", base: 1.2 },
  { lease: "kisinger", no: "3", kind: "producing", base: 2.1 },
  { lease: "kisinger", no: "4", kind: "producing", base: 0.9 },
  { lease: "kisinger", no: "5W", kind: "injection" },
  { lease: "kisinger", no: "6", kind: "producing", base: 1.3 },
  { lease: "mccluskey", no: "1", kind: "producing", base: 1.8 },
  { lease: "mccluskey", no: "2", kind: "producing", base: 1.0 },
  { lease: "mccluskey", no: "3", kind: "plugged", base: 0.4, until: "2021-04" },
  { lease: "mccluskey", no: "4", kind: "producing", base: 1.5 },
  { lease: "mccluskey", no: "5", kind: "producing", base: 1.2 },
  { lease: "trammell", no: "1", kind: "producing", base: 2.2 },
  { lease: "trammell", no: "2", kind: "shut-in", base: 0.6, until: "2024-02" },
  { lease: "trammell", no: "3", kind: "producing", base: 1.3 },
  { lease: "trammell", no: "4W", kind: "injection" },
  { lease: "trammell", no: "5", kind: "producing", base: 1.7 },
  { lease: "dosher", no: "1", kind: "producing", base: 1.1 },
  { lease: "dosher", no: "2", kind: "plugged", base: 0.3, until: "2018-10" },
  { lease: "dosher", no: "3", kind: "shut-in", base: 0.5, until: "2022-11" },
  { lease: "dosher", no: "4", kind: "producing", base: 0.9 },
  { lease: "rollins", no: "1", kind: "producing", base: 1.5 },
  { lease: "rollins", no: "2", kind: "producing", base: 1.9 },
  { lease: "rollins", no: "3W", kind: "injection" },
  { lease: "rollins", no: "4", kind: "producing", base: 1.0 },
  { lease: "rollins", no: "5", kind: "shut-in", base: 0.6, until: "2025-01" },
  { lease: "rollins", no: "6", kind: "producing", base: 1.4 },
  { lease: "graves", no: "1", kind: "producing", base: 1.2 },
  { lease: "graves", no: "2", kind: "producing", base: 0.8 },
  { lease: "graves", no: "3", kind: "shut-in", base: 0.5, until: "2023-12" },
  { lease: "graves", no: "4", kind: "producing", base: 1.6 },
];

/** Harlan Ranch 1, 2 and Stambaugh 6 carry the newest APIs, beside Harlan Ranch 3's permit (50385871). */
const NEW_API: Record<string, string> = {
  "harlan-1": "50385514",
  "harlan-2": "50385577",
  "stambaugh-6": "50385630",
};

export interface TonkWell extends TonkWellSpec {
  key: string;
  api: string;
  /** "Harlan Ranch 1" */
  name: string;
  lngLat: [number, number];
  type: WellTypeName | "PLUGGED";
  /** `YYYY-MM-DD` the hole was completed. */
  completed: string;
  depth: number;
  gor: number;
}

const titleName = (n: string) =>
  n
    .toLowerCase()
    .replace(/(^|[\s"])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/^Mcc/, "McC");

function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** The new Caddo wells' completion dates and total depths. */
const CADDO_COMPLETED: Record<string, string> = {
  "harlan-1": "2024-04-26",
  "harlan-2": "2024-10-22",
  "stambaugh-6": "2025-02-18",
};
const CADDO_TD: Record<string, number> = { "harlan-1": 4420, "harlan-2": 4410, "stambaugh-6": 4385 };

export const TONK_WELLS: TonkWell[] = SPECS.map((s, i) => {
  const lease = TONK_LEASES.find((l) => l.id === s.lease)!;
  const idx = SPECS.filter((x) => x.lease === s.lease).indexOf(s);
  const key = `${s.lease}-${s.no}`;
  const ring: [number, number] = [
    lease.center[0] + 0.0055 * Math.cos(idx * 1.9 + i),
    lease.center[1] + 0.0042 * Math.sin(idx * 1.9 + i),
  ];
  // Old Strawn wells were completed between 1978 and 2009.
  const year = 1978 + Math.floor(noise(i + 3) * 31);
  const month = 1 + Math.floor(noise(i + 7) * 12);
  const day = 2 + Math.floor(noise(i + 11) * 26);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    ...s,
    key,
    api: NEW_API[key] ?? `5033${String(1118 + i * 167).padStart(4, "0")}`,
    name: `${titleName(lease.name).replace(/"a"/i, '"A"')} ${s.no}`,
    lngLat: s.at ?? ring,
    type:
      s.kind === "producing" ? "PRODUCING" : s.kind === "shut-in" ? "SHUT IN" : s.kind === "injection" ? "INJECTION" : "PLUGGED",
    completed: s.caddo ? CADDO_COMPLETED[key] : `${year}-${pad(month)}-${pad(day)}`,
    depth: s.caddo ? CADDO_TD[key] : 3100 + Math.round(noise(i + 13) * 9) * 50,
    gor: s.caddo ? 2.4 : 1.1 + Math.round(noise(i + 17) * 12) / 10,
  };
});


/* ---- Production ---------------------------------------------------------- */

const FIRST_CYCLE = "2016-01";
const DAYS = 30.4;

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/** Every reported cycle, oldest first, through the RRC's last (`DOSSIER_THROUGH`). */
export const TONK_CYCLES: string[] = Array.from(
  { length: monthsBetween(FIRST_CYCLE, DOSSIER_THROUGH) + 1 },
  (_, i) => addMonths(FIRST_CYCLE, i)
);

/** One well's oil for a cycle, bbl, unrounded. */
export function wellOil(w: TonkWell, cycle: string): number {
  if (w.kind === "injection") return 0;
  if (w.caddo) {
    const t = monthsBetween(w.caddo.on, cycle);
    if (t < 0) return 0;
    // The first year is the offset curve Orion charts; after it, the same decline carried on.
    const rate = t < 12 ? OFFSET_FIRST_YEAR[t] : caddoRate(t);
    return rate * w.caddo.share * DAYS;
  }
  if (w.until && cycle > w.until) return 0;
  const age = monthsBetween(cycle, DOSSIER_THROUGH) / 12;
  const wobble = 1 + 0.08 * (noise(TONK_WELLS.indexOf(w) * 97 + monthsBetween(FIRST_CYCLE, cycle)) - 0.5);
  return (w.base ?? 0) * Math.pow(0.95, -age) * wobble * DAYS;
}

export interface TonkCycle {
  cycle: string;
  oil: number;
  gas: number;
}

const leaseCache = new Map<string, TonkCycle[]>();

/** A lease's months, the sum over its wells rounded once to whole barrels and MCF, as the RRC carries it. */
export function tonkLeaseCycles(leaseId: string): TonkCycle[] {
  const hit = leaseCache.get(leaseId);
  if (hit) return hit;
  const wells = TONK_WELLS.filter((w) => w.lease === leaseId);
  const rows = TONK_CYCLES.map((cycle) => ({
    cycle,
    oil: Math.round(wells.reduce((a, w) => a + wellOil(w, cycle), 0)),
    gas: Math.round(wells.reduce((a, w) => a + wellOil(w, cycle) * w.gor, 0)),
  })).filter((c, i, all) => c.oil > 0 || all.slice(0, i).some((p) => p.oil > 0));
  leaseCache.set(leaseId, rows);
  return rows;
}

/** The trailing twelve reported cycles. */
export const LAST12 = TONK_CYCLES.slice(-12);

/** A lease's oil and casinghead over the trailing twelve cycles. */
export function leaseLast12(leaseId: string): { oil: number; gas: number } {
  const rows = tonkLeaseCycles(leaseId).filter((c) => LAST12.includes(c.cycle));
  return { oil: rows.reduce((a, c) => a + c.oil, 0), gas: rows.reduce((a, c) => a + c.gas, 0) };
}

/** The operator's trailing twelve: the sum of its leases'. */
export function tonkLast12(): { oil: number; gas: number } {
  return TONK_LEASES.reduce(
    (a, l) => {
      const x = leaseLast12(l.id);
      return { oil: a.oil + x.oil, gas: a.gas + x.gas };
    },
    { oil: 0, gas: 0 }
  );
}

/* ---- Distance to Sky ------------------------------------------------------ */

/** The Sky lease nearest a Tonk lease, and how far, in miles from lease centre to the nearest Sky well. */
export function nearestSky(leaseId: string): { lease: string; miles: number } {
  const c = TONK_LEASES.find((l) => l.id === leaseId)!.center;
  let best = { lease: "", miles: Infinity };
  for (const l of SKY_LEASES) {
    const wells = SKY_WELLS.filter((w) => w.lease === l.id);
    wells.forEach((_, i) => {
      const d = milesBetween(c, wellLngLat(l.id, i));
      if (d < best.miles) best = { lease: l.name, miles: d };
    });
  }
  return best;
}

/** The middle of the Tonk Creek leases, for a camera framing them. */
export const TONK_CENTER: [number, number] = [
  TONK_LEASES.reduce((a, l) => a + l.center[0], 0) / TONK_LEASES.length,
  TONK_LEASES.reduce((a, l) => a + l.center[1], 0) / TONK_LEASES.length,
];

/* ---- Lease dossiers ------------------------------------------------------- */

const FUEL_SHARE = 0.03;

function endingStock(leaseId: string, cycle: string): number {
  const x = noise(monthsBetween(FIRST_CYCLE, cycle) * 3 + leaseId.length * 31);
  return Math.round(60 + 120 * x);
}

function wellsOn(leaseId: string): TonkWell[] {
  return TONK_WELLS.filter((w) => w.lease === leaseId && w.kind !== "plugged");
}

function buildLease(l: TonkLease): LeaseDossier {
  const cycles = tonkLeaseCycles(l.id);
  const monthly: LeaseMonth[] = cycles.map((c) => {
    const end = endingStock(l.id, c.cycle);
    const open = endingStock(l.id, addMonths(c.cycle, -1));
    return {
      cycle: c.cycle,
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
      oil_tot_disp: Math.max(0, open + c.oil - end),
      gas_tot_disp: null,
      cond_tot_disp: null,
      csgd_tot_disp: c.gas,
      prod_report_filed: "Y",
      reported: true,
    };
  });
  const oil: DispositionMonth[] = monthly.map((m) => ({ cycle: m.cycle, codes: { "01": m.oil_tot_disp ?? 0 } }));
  const csgd: DispositionMonth[] = monthly.map((m) => {
    const fuel = Math.round(m.csgd_prod_vol * FUEL_SHARE);
    return { cycle: m.cycle, codes: { "01": fuel, "03": m.csgd_prod_vol - fuel } };
  });
  const last = DOSSIER_THROUGH;
  const wells: LeaseWell[] = wellsOn(l.id).map((w) => ({
    api_number: w.api,
    well_no: w.no,
    well_root_no: w.api.slice(3),
    well_type_name: w.type as WellTypeName,
    county_name: "YOUNG",
    lat: w.lngLat[1],
    lon: w.lngLat[0],
    oil_bbl_per_day: w.kind === "producing" ? Math.round((wellOil(w, last) / DAYS) * 10) / 10 : null,
    gas_mcf_per_day: w.kind === "producing" ? Math.round(((wellOil(w, last) * w.gor) / DAYS) * 10) / 10 : null,
  }));
  const sum = (f: (m: LeaseMonth) => number) => monthly.reduce((a, m) => a + f(m), 0);
  const p4Date = l.id === "harlan" ? "2024-05-01" : "2016-07-01";
  return {
    oil_gas_code: "O",
    district_no: PDQ_DISTRICT,
    district_name: "09",
    lease_no: l.leaseNo,
    lease_name: l.name,
    field_no: FIELD_NO,
    field_name: FIELD_NAME,
    field_type: "NON-PRORATED",
    gas_well_no: null,
    operator_no: TONK.no,
    operator_name: TONK.name,
    off_schedule: false,
    severance: false,
    monthly,
    disposition: { oil, gas: [], cond: [], csgd },
    counties: [
      {
        county_no: "503",
        county_name: "YOUNG",
        oil_prod_vol: sum((m) => m.oil_prod_vol),
        gas_prod_vol: 0,
        cond_prod_vol: 0,
        csgd_prod_vol: sum((m) => m.csgd_prod_vol),
      },
    ],
    wells,
    p4: {
      connections: [
        {
          product_code: "O",
          type_code: "H",
          gpn_no: "667884",
          operator_name: PURCHASERS.oil.toUpperCase(),
          actual_percent: 1,
          effective_date: p4Date,
          interstate: false,
          intrastate: true,
        },
        {
          product_code: "P",
          type_code: "G",
          gpn_no: "836401",
          operator_name: PURCHASERS.gas.toUpperCase(),
          actual_percent: 1,
          effective_date: p4Date,
          interstate: false,
          intrastate: true,
        },
      ],
      filings: [
        {
          effective_date: p4Date,
          approval_date: l.id === "harlan" ? "2024-05-22" : "2016-07-19",
          record_type: l.id === "harlan" ? "O" : "R",
          operator_no: TONK.no,
          operator_name: TONK.name,
          field_no: FIELD_NO,
          changes: l.id === "harlan" ? ["Operator", "Purchaser", "Gatherer"] : ["Operator"],
        },
      ],
    },
  };
}

const dossiers = new Map<string, LeaseDossier>();

/** A Tonk Creek lease's dossier by RRC lease number, or null for a lease it does not hold. */
export function tonkLeaseDossier(leaseNo: string): LeaseDossier | null {
  const l = TONK_LEASES.find((x) => x.leaseNo === leaseNo);
  if (!l) return null;
  if (!dossiers.has(leaseNo)) dossiers.set(leaseNo, buildLease(l));
  return dossiers.get(leaseNo)!;
}

/** Harlan Ranch, the lease the Recon lease screen evaluates. */
export const HARLAN_KEY = { oil_gas_code: "O", district_no: PDQ_DISTRICT, lease_no: "13844" };
export const HARLAN = TONK_LEASES[0];

/** Every lease Tonk Creek holds, as `getOperatorTree` returns it. */
export function tonkTree(): OperatorTree {
  return {
    operator_number: TONK.no,
    operator_name: TONK.name,
    leases: TONK_LEASES.map((l) => ({
      oil_gas_code: "O" as const,
      district_no: PDQ_DISTRICT,
      lease_no: l.leaseNo,
      lease_name: l.name,
      field_name: FIELD_NAME,
      wells: wellsOn(l.id).map((w) => ({
        api_number: w.api,
        well_no: w.no,
        lease_name: l.name,
        well_type_name: w.type as WellTypeName,
        county_name: "YOUNG",
      })),
    })),
  };
}

/* ---- The operator dossier ------------------------------------------------- */

const OFFICERS: OfficerRow[] = [
  { officer_name: "KISINGER, DALE T", officer_title: "PRESIDENT", officer_city: "GRAHAM", officer_state: "TX" },
  { officer_name: "KISINGER, MARCY L", officer_title: "SECRETARY", officer_city: "GRAHAM", officer_state: "TX" },
  { officer_name: "HOLLOWAY, REED", officer_title: "VICE PRESIDENT", officer_city: "GRAHAM", officer_state: "TX" },
];

const pos = (lngLat: [number, number]) => ({ lat: lngLat[1], lon: lngLat[0] });

/** Granted permits, newest first: three in 2026 (Harlan Ranch 3 is `reconPermit`), and the three that became the Caddo wells. */
const PERMITS: OperatorPermit[] = [
  {
    permit_number: HARLAN_3_PERMIT_NO,
    permit_seq: "99",
    lease_name: "HARLAN RANCH",
    well_number: "3",
    county_name: "YOUNG",
    district_name: "09",
    total_depth: typeof reconPermit.depth === "number" ? reconPermit.depth : 4400,
    filed_date: String(reconPermit.submitted),
    issued_date: "2026-10-24",
    expires_date: "2028-10-24",
    api_number: String(reconPermit.api),
    drilled: false,
    ...pos(PERMIT_LNG_LAT),
  },
  {
    permit_number: "0907731",
    permit_seq: "99",
    lease_name: "KISINGER",
    well_number: "7",
    county_name: "YOUNG",
    district_name: "09",
    total_depth: 4350,
    filed_date: "2026-05-28",
    issued_date: "2026-06-11",
    expires_date: "2028-06-11",
    api_number: "50385804",
    drilled: false,
    lat: null,
    lon: null,
  },
  {
    permit_number: "0902266",
    permit_seq: "99",
    lease_name: "STAMBAUGH",
    well_number: "7",
    county_name: "YOUNG",
    district_name: "09",
    total_depth: 4400,
    filed_date: "2026-02-17",
    issued_date: "2026-03-04",
    expires_date: "2028-03-04",
    api_number: "50385752",
    drilled: false,
    lat: null,
    lon: null,
  },
  ...(["stambaugh-6", "harlan-2", "harlan-1"] as const).map((k, i) => {
    const w = TONK_WELLS.find((x) => x.key === k)!;
    const issued = ["2024-12-09", "2024-08-26", "2024-02-12"][i];
    const [y, m, d] = issued.split("-");
    return {
      permit_number: ["0895140", "0889321", "0880457"][i],
      permit_seq: "99",
      lease_name: TONK_LEASES.find((l) => l.id === w.lease)!.name,
      well_number: w.no,
      county_name: "YOUNG",
      district_name: "09",
      total_depth: 4400,
      filed_date: ["2024-11-22", "2024-08-09", "2024-01-26"][i],
      issued_date: issued,
      expires_date: `${Number(y) + 2}-${m}-${d}`,
      api_number: w.api,
      drilled: true,
      lat: null,
      lon: null,
    };
  }),
];

function wellEvents(): OperatorWellEvent[] {
  return TONK_WELLS.flatMap((w) => {
    const l = TONK_LEASES.find((x) => x.id === w.lease)!;
    const base = {
      api_number: Number(w.api),
      lease_name: l.name,
      well_no: w.no,
      county_code: 503,
      oil_gas_code: "O",
      district: "09",
      lease_number: l.leaseNo,
    };
    const out: OperatorWellEvent[] = [{ ...base, completion_date: w.completed, plug_date: null }];
    if (w.kind === "plugged" && w.until) out.push({ ...base, completion_date: null, plug_date: `${w.until}-14` });
    return out;
  }).sort((a, b) => (b.completion_date ?? b.plug_date ?? "").localeCompare(a.completion_date ?? a.plug_date ?? ""));
}

export function tonkProfile(): OperatorProfile {
  const wells: OperatorWell[] = TONK_WELLS.map((w) => ({
    api_number: Number(w.api),
    admin_district: 9,
    county_code: 503,
    oil_gas_label: "Oil",
    is_plugged: w.kind === "plugged",
    total_depth: w.depth,
    latitude: w.lngLat[1],
    longitude: w.lngLat[0],
    lease_name: TONK_LEASES.find((l) => l.id === w.lease)!.name,
    well_no: w.no,
    activity: w.kind === "plugged" ? "plugged" : w.kind === "producing" ? "active" : "inactive",
    well_type: w.kind === "plugged" ? null : w.type,
  }));
  const leases: OperatorLease[] = TONK_LEASES.map((l) => {
    const x = leaseLast12(l.id);
    return {
      oil_gas_code: "O",
      district_no: Number(PDQ_DISTRICT),
      lease_no: Number(l.leaseNo),
      lease_name: l.name,
      well_count: wellsOn(l.id).length,
      oil_last12: x.oil,
      gas_last12: x.gas,
      months: 12,
      last_cycle: Number(DOSSIER_THROUGH.replace("-", "")),
      county_codes: [503],
    };
  });
  const t = tonkLast12();
  const events = wellEvents();
  return {
    operator: {
      operator_number: Number(TONK.no),
      operator_name: TONK.name,
      p5_status: "A",
      addr_line1: "PO BOX 1187",
      addr_line2: null,
      city: "GRAHAM",
      state: "TX",
      zip: 76450,
      zip_suffix: null,
      phone: 9405550192,
      last_p5_date: 20260812,
      oil_gatherer: PURCHASERS.oil.toUpperCase(),
      gas_gatherer: PURCHASERS.gas.toUpperCase(),
    },
    officers: OFFICERS,
    wellCount: wells.length,
    wells,
    capped: false,
    leases,
    leaseCount: leases.length,
    last12: { oil_last12: t.oil, gas_last12: t.gas, months: 12 },
    permits: PERMITS,
    permitTotal: PERMITS.length,
    wellEvents: events,
    wellEventsCapped: false,
  };
}

/** Each producing well's last reported month, as `getOperatorWellRates` returns it. */
export function tonkWellRates(): OperatorWellRates {
  const byApi: OperatorWellRates["byApi"] = {};
  for (const w of TONK_WELLS) {
    if (w.kind !== "producing") continue;
    const oil = wellOil(w, DOSSIER_THROUGH);
    byApi[Number(w.api)] = { cycle: DOSSIER_THROUGH, oil: Math.round(oil), gas: Math.round(oil * w.gor) };
  }
  return { byApi, capped: false };
}

/* ---- Harlan Ranch 1's well dossier --------------------------------------- */

export const HR1 = TONK_WELLS.find((w) => w.key === "harlan-1")!;

/** The W-2's formation record, tops in feet (the section a Graham-area vertical drills). */
const HR1_FORMATIONS: [string, number, "Y" | "N"][] = [
  ["STRAWN", 1258, "N"],
  ["STRAWN 3100 SAND", 3081, "N"],
  ["CADDO", 3934, "Y"],
  ["SMITHWICK", 4041, "N"],
  ["BEND CONGLOMERATE", 4186, "N"],
  ["BARNETT SHALE", 4281, "N"],
];

/** Perforated interval in the Caddo, feet. */
export const HR1_PERFS = { top: 3946, bottom: 3972 } as const;

export function harlanRanch1Dossier(): WellDossier {
  const lease = tonkLeaseDossier(HARLAN.leaseNo)!;
  const completed = HR1.completed.replace(/-/g, "");
  const row = {
    api_number: HR1.api,
    district: "09",
    county_code: "503",
    county_name: "YOUNG",
    oil_gas_code: "O" as const,
    lease_name: HARLAN.name,
    lease_number: HARLAN.leaseNo,
    field_number: FIELD_NO,
    field_name: FIELD_NAME,
    well_no: HR1.no,
    well_no_display: HR1.no,
    oil_unit_number: "",
    operator_name: TONK.name,
    operator_number: TONK.no,
    on_schedule: "Y" as const,
    completion_date: completed,
  };
  // The well's own months on the lease, by its share of the lease's wells.
  const share = (cycle: string) => {
    const all = wellsOn(HARLAN.id).reduce((a, w) => a + wellOil(w, cycle), 0);
    return all > 0 ? wellOil(HR1, cycle) / all : 0;
  };
  const byTest: LeaseMonth[] = lease.monthly.map((m) => {
    const s = share(m.cycle);
    return {
      ...m,
      oil_prod_vol: Math.round(m.oil_prod_vol * s),
      csgd_prod_vol: Math.round(m.csgd_prod_vol * s),
      oil_ending_bal: null,
      oil_tot_disp: null,
      csgd_tot_disp: null,
    };
  });
  const report: CompletionReport = {
    tracking_no: "312664",
    api_no: HR1.api,
    operator_no: TONK.no,
    operator_name: TONK.name,
    lease_name: HARLAN.name,
    well_no: HR1.no,
    field_no: FIELD_NO,
    field_name: FIELD_NAME,
    county_no: "503",
    county_name: "YOUNG",
    district: "09",
    well_type: "Producing",
    completion_type: "New well",
    purpose_of_filing: "Initial potential",
    completion_date: HR1.completed,
    spud_date: "2024-03-21",
    approved_date: "2024-06-14",
    wellbore_profile: "Vertical",
    total_acres: "320",
    producing_wells: "1",
    survey: "T E & L CO",
    survey_block: null,
    survey_section: "1442",
    survey_abstract: "A-1891",
    latitude: String(HR1.lngLat[1].toFixed(6)),
    longitude: String(HR1.lngLat[0].toFixed(6)),
    formations: HR1_FORMATIONS.map(([formation, depth, isolated]) => ({
      formation,
      depth: String(depth),
      depth_tmd: String(depth),
      encountered: "Y",
      isolated,
      remark: null,
    })),
    casing: [],
    otherSections: [
      { tag: "INITIAL POTENTIAL", rows: 1 },
      { tag: "ACID FRACTURE", rows: 1 },
      { tag: "CASING", rows: 2 },
      { tag: "TUBING", rows: 1 },
    ],
  };
  return {
    api_number: HR1.api,
    current: true,
    header: row,
    status: {
      well_type_name: "PRODUCING",
      wb_water_land_code: "Land Well",
      multi_comp_flag: "",
      api_depth: HR1.depth,
      wb_shut_in_date: "",
      wl_shut_in_date: "0",
      plug_date: "",
      plug_lease_name: HARLAN.name,
      plug_operator_name: TONK.name,
      completion_date: completed,
      orig_completion_dt: completed,
      curr_inact_yrs: 0,
      curr_inact_mos: 0,
      p5_org_status: "A",
      h15_status_code: "",
    },
    compliance: {
      wb_14b2_flag: "",
      flags: {
        ext_status: "",
        mech_integ: "",
        plg_ord_sf: "",
        pollution: "",
        fldops_hold: "",
        h15_prob: "",
        h15_delq: "",
        oper_delq: "",
        dist_sfp: "",
        dist_sf_clnup: "",
        dist_st_plg: "",
        good_faith: "",
        well_other: "",
      },
      surf_eqp_viol: "",
      w3x_viol: "",
    },
    filings: {
      w2_g1_filed_date: "20240531",
      w2_g1_date: "20240614",
      w3_file_date: "",
      p5_renewal_month: "8",
      p5_renewal_year: "2027",
      recent_permit: "0880457",
      recent_permit_lease_name: HARLAN.name,
      recent_permit_operator_no: TONK.no,
      modified_dt: "01-OCT-26 03.18.07.000000 AM",
    },
    location: {
      lat: HR1.lngLat[1],
      lon: HR1.lngLat[0],
      bottom_lat: HR1.lngLat[1],
      bottom_lon: HR1.lngLat[0],
      symbol_num: "4",
      reliability: "15",
      api10: HR1.api,
      stcode: "",
      abstract_label: "1891",
      survey_name: "T E & L CO",
      block_number: null,
    },
    completions: [row],
    production: lease.monthly,
    allocationShare: 1 / wellsOn(HARLAN.id).length,
    productionByTest: byTest,
    injection: null,
    construction: {
      filings: [
        {
          file_date: "2024-05-31",
          completion_date: HR1.completed,
          plug_back_ft: 4368,
          elevation: 1127,
          elevation_code: "GL",
          casing: [
            {
              seq: 1,
              size_in: 8.625,
              weight_lb_ft: 24,
              depth_set: 426,
              hole_size_in: 12.25,
              cement_amount: 275,
              cement_measure: "S",
              top_of_cement: "SURFACE",
            },
            {
              seq: 2,
              size_in: 5.5,
              weight_lb_ft: 15.5,
              depth_set: 4402,
              hole_size_in: 7.875,
              cement_amount: 190,
              cement_measure: "S",
              top_of_cement: "2,940",
            },
          ],
          perforations: [{ seq: 1, top_ft: HR1_PERFS.top, bottom_ft: HR1_PERFS.bottom, open_hole: false }],
        },
      ],
      total_depth: HR1.depth,
      shallowest_perf: HR1_PERFS.top,
      deepest_perf: HR1_PERFS.bottom,
      has_open_hole: false,
    },
    h15: [],
    w10: [
      {
        test_date: "2026-03-17",
        daily_oil: Math.round(wellOil(HR1, "2026-03") / DAYS),
        daily_water: 31,
        daily_gas: Math.round((wellOil(HR1, "2026-03") * HR1.gor) / DAYS),
        gas_oil_ratio: 2400,
        producing_method: "P",
        type_flag: "S",
        cycle: "2026-05-01",
      },
      {
        test_date: "2024-05-06",
        daily_oil: Math.round(OFFSET_FIRST_YEAR[0] * HR1.caddo!.share),
        daily_water: 12,
        daily_gas: Math.round(OFFSET_FIRST_YEAR[0] * HR1.caddo!.share * HR1.gor),
        gas_oil_ratio: 2400,
        producing_method: "P",
        type_flag: "W",
        cycle: "2024-07-01",
      },
    ],
    g10: [],
    plugging: [],
    completionReports: [report],
    w10Share: null,
  };
}

/** Where a camera frames Harlan Ranch: the lease, the permit and Johnson A 3 in one view. */
export const HARLAN_VIEW = {
  center: [(HARLAN.center[0] + A3_LNG_LAT[0]) / 2 - 0.004, HARLAN.center[1]] as [number, number],
  zoom: 13.2,
};

