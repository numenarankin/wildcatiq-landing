/**
 * The one operator every product screen shows: Sky Resources, Inc. of Graham,
 * a small Young County outfit on the Bend Arch (RRC District 09). The name and
 * P-5 number are the real operator's; everything else here is simulated:
 * leases, wells, rates, tanks, people and prices. Every page fixture derives
 * from this file, so a number that appears on two pages (Smith 2's rate,
 * September's barrels, the oil price) is the same number on both.
 *
 * The wells read like the Graham area: shallow verticals, 3,000 to 4,600 ft,
 * on rod pumps in the Strawn sands and the Caddo lime, a few barrels of oil a
 * day each under ten to twenty times as much saltwater, slow stripper declines
 * on the old wells and a steep first years on the one new Caddo well.
 */
import type { CommodityPrices } from "@/lib/analytics/types";

export const FIXTURE_TODAY = "2026-10-27";

export const OPERATOR = {
  name: "Sky Resources, Inc.",
  /** Compact form the RRC EDI file names use. */
  fileLabel: "SkyResources",
  owner: "Jim Morrow",
  ownerFirst: "Jim",
  email: "jim@sky-resources.example",
  phone: "(940) 555-0148",
  city: "Graham",
  /** A made-up mailing address for the statement header. */
  mailing: "PO Box 2210",
  zip: "76450",
  county: "Young",
  /** RRC county code. */
  countyCode: "503",
  district: "09",
  pumper: "Luis Ortega",
} as const;

export const PRICES: CommodityPrices = { oilPerBbl: 60.12, gasPerMcf: 2.41 };

export interface WellSpec {
  id: string;
  name: string;
  lease: string;
  /** Oil rate at the fixture's start, bbl/d, and annual effective decline. */
  oil0: number;
  decline: number;
  /** Gas to oil ratio, mcf per bbl. */
  gor: number;
  water: number;
  /** Month ordinal (0 = first month) the well came on; earlier months are zero. */
  on?: number;
  /** A shut-in window in day ordinals from the end of the daily series. */
  downDays?: [number, number];
}

export interface LeaseSpec {
  id: string;
  name: string;
  slug: string;
  nri: number;
}

export const LEASES: LeaseSpec[] = [
  { id: "l-johnson", name: "Johnson A", slug: "johnson-a", nri: 0.8125 },
  { id: "l-smith", name: "Smith", slug: "smith", nri: 0.78 },
  { id: "l-corbett", name: "Roy Corbett", slug: "roy-corbett", nri: 0.75 },
  { id: "l-young", name: "Fannie Young", slug: "fannie-young", nri: 0.8 },
  { id: "l-parrott", name: "Roach Parrott", slug: "roach-parrott", nri: 0.875 },
];

export const WELLS: WellSpec[] = [
  { id: "w-ja1", name: "Johnson A 1", lease: "l-johnson", oil0: 3.4, decline: 0.06, gor: 1.6, water: 38 },
  { id: "w-ja2", name: "Johnson A 2", lease: "l-johnson", oil0: 2.6, decline: 0.05, gor: 2.1, water: 27 },
  // The new well: a Caddo completion that came on in January 2025.
  { id: "w-ja3", name: "Johnson A 3", lease: "l-johnson", oil0: 11.5, decline: 0.32, gor: 2.4, water: 22, on: 14 },
  { id: "w-ja4", name: "Johnson A 4", lease: "l-johnson", oil0: 2.1, decline: 0.05, gor: 1.2, water: 46 },
  { id: "w-s1", name: "Smith 1", lease: "l-smith", oil0: 2.4, decline: 0.05, gor: 1.8, water: 35 },
  { id: "w-s2", name: "Smith 2", lease: "l-smith", oil0: 3.8, decline: 0.07, gor: 1.4, water: 52 },
  { id: "w-s3", name: "Smith 3", lease: "l-smith", oil0: 1.9, decline: 0.04, gor: 2.6, water: 24 },
  { id: "w-s4", name: "Smith 4", lease: "l-smith", oil0: 3.1, decline: 0.08, gor: 1.9, water: 41 },
  { id: "w-rc4", name: "Roy Corbett 4", lease: "l-corbett", oil0: 4.2, decline: 0.09, gor: 1.5, water: 58, downDays: [9, 14] },
  { id: "w-rc5", name: "Roy Corbett 5", lease: "l-corbett", oil0: 2.7, decline: 0.06, gor: 1.1, water: 33 },
  { id: "w-fy2", name: "Fannie Young 2A", lease: "l-young", oil0: 3.0, decline: 0.06, gor: 2.8, water: 44 },
  { id: "w-fy3", name: "Fannie Young 3", lease: "l-young", oil0: 2.2, decline: 0.05, gor: 2.2, water: 29 },
  { id: "w-rp7", name: "Roach Parrott 7", lease: "l-parrott", oil0: 1.8, decline: 0.04, gor: 0.9, water: 18 },
  { id: "w-rp8", name: "Roach Parrott 8", lease: "l-parrott", oil0: 1.4, decline: 0.04, gor: 0.7, water: 15 },
];

export const leaseOf = (w: WellSpec): LeaseSpec => LEASES.find((l) => l.id === w.lease)!;
export const wellByName = (name: string): WellSpec | undefined => WELLS.find((w) => w.name === name);

/**
 * Facilities per lease. Tank names follow the app's "T<lease><n>" habit; a
 * 500 bbl, 25 ft tank holds 1.67 bbl per inch.
 */
export interface TankSpec {
  id: string;
  name: string;
  lease: string;
  kind: "oil" | "water";
  capacityBbl: number;
  bblPerInch: number;
}

export const TANKS: TankSpec[] = [
  { id: "t-ja-101", name: "Johnson A T101", lease: "l-johnson", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-ja-102", name: "Johnson A T102", lease: "l-johnson", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-ja-w1", name: "Johnson A W1", lease: "l-johnson", kind: "water", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-sm-201", name: "Smith T201", lease: "l-smith", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-sm-202", name: "Smith T202", lease: "l-smith", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-sm-w1", name: "Smith W1", lease: "l-smith", kind: "water", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-rc-301", name: "Roy Corbett T301", lease: "l-corbett", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-fy-401", name: "Fannie Young T401", lease: "l-young", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
  { id: "t-rp-501", name: "Roach Parrott T501", lease: "l-parrott", kind: "oil", capacityBbl: 500, bblPerInch: 1.67 },
];

/** The SWD well Smith's water tank runs to. */
export const SWD = { id: "w-smswd1", name: "Smith SWD 1", lease: "l-smith", permittedBblPerDay: 1500 } as const;

/** Purchasers on the run tickets and statements. */
export const PURCHASERS = { oil: "Brushy Fork Crude", gas: "Elm Creek Midstream" } as const;

/** The oil purchaser's trucking arm and its letterhead (fictional, North Texas). */
export const OIL_PURCHASER = {
  legalName: "BRUSHY FORK CRUDE PURCHASING, L.P.",
  transporter: "Brushy Fork Transport",
  address: ["2615 Midwestern Pkwy, Suite 300", "Wichita Falls, TX 76308"],
  /** File-name stem the statements are saved under. */
  fileStem: "brushy-fork-crude",
} as const;

/**
 * Dated events more than one page cites. Roy Corbett 4 is the well the
 * dashboard fixture shuts in (`downDays`), so the brief, Orion and the
 * downtime log all name the same well and the same days.
 */
export const EVENTS = {
  rc4Downtime: { well: "w-rc4", from: "2026-10-13", to: "2026-10-18", reason: "Rod part, pump pulled and rerun" },
  smithGauge: { tank: "t-sm-201", date: "2026-10-26", feet: 3, inches: 11.25 },
  /** The Form PR month every page shows. */
  reportMonth: "2026-09",
} as const;
