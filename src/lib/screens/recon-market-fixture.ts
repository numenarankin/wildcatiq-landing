/**
 * Recon's Market view on Young County: the RRC's own rollups as the app's
 * `getMarketData` returns them (`MarketData`). Series run 36 cycles and stop
 * at the reported edge, 2026-07, the way the query drops unpublished cycles.
 * The mirror is loaded through 2026-09.
 *
 * Scale: Texas files about 170 million bbl of oil a month, District 09 about
 * 1.4 million, Young County about 52,000 (the RRC's own 2026 cycles run
 * 48,000 to 56,000). Sky's simulated month is about 1,000 bbl
 * (`recon-rrc.ts`), so it is nowhere near a top board and is left off them.
 * The boards are statewide, which is why they read Permian and Eagle Ford;
 * their operators and leases are fictional names absent from the P-5 list.
 */
import type { AreaSeries, CycleTotals, MarketData, RankedRow } from "@/lib/scout/rrc-types";

export const MARKET_REPORTED = "2026-07";
export const MARKET_LOADED = "2026-09";
const CYCLES = 36;

function wobble(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function cycleAt(back: number): string {
  const d = new Date(Date.UTC(2026, 6 - back, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * One area's monthly totals, oldest first, from its latest month and a yearly
 * growth rate (Permian counties grow, the old districts slide).
 */
function series(last: Omit<CycleTotals, "cycle">, growth: number, seed: number): CycleTotals[] {
  const out: CycleTotals[] = [];
  for (let back = CYCLES - 1; back >= 0; back--) {
    const f = Math.pow(1 + growth, -back / 12);
    const n = (s: number) => 1 + 0.025 * wobble(seed * 31 + back * 7 + s);
    out.push({
      cycle: cycleAt(back),
      oil: Math.round(last.oil * f * n(1)),
      gas: Math.round(last.gas * f * n(2)),
      cond: Math.round(last.cond * f * n(3)),
      csgd: Math.round(last.csgd * f * n(4)),
    });
  }
  return out;
}

/** District rollups keyed by the PDQ code, labelled with the real district. */
const DISTRICTS: { key: string; label: string; last: Omit<CycleTotals, "cycle">; growth: number }[] = [
  { key: "01", label: "01", last: { oil: 14_820_000, gas: 9_610_000, cond: 2_140_000, csgd: 38_900_000 }, growth: -0.02 },
  { key: "02", label: "02", last: { oil: 9_870_000, gas: 31_400_000, cond: 3_960_000, csgd: 22_100_000 }, growth: -0.03 },
  { key: "03", label: "03", last: { oil: 1_910_000, gas: 6_480_000, cond: 610_000, csgd: 2_870_000 }, growth: -0.06 },
  { key: "04", label: "04", last: { oil: 640_000, gas: 41_200_000, cond: 1_480_000, csgd: 1_120_000 }, growth: 0.04 },
  { key: "05", label: "05", last: { oil: 118_000, gas: 38_900_000, cond: 96_000, csgd: 214_000 }, growth: -0.05 },
  { key: "06", label: "06", last: { oil: 702_000, gas: 79_600_000, cond: 1_210_000, csgd: 1_640_000 }, growth: 0.03 },
  { key: "07", label: "6E", last: { oil: 412_000, gas: 1_870_000, cond: 18_000, csgd: 921_000 }, growth: -0.07 },
  { key: "08", label: "7B", last: { oil: 1_160_000, gas: 4_620_000, cond: 88_000, csgd: 2_210_000 }, growth: -0.04 },
  { key: "09", label: "7C", last: { oil: 7_410_000, gas: 10_800_000, cond: 412_000, csgd: 27_300_000 }, growth: 0.02 },
  { key: "10", label: "08", last: { oil: 85_400_000, gas: 42_700_000, cond: 6_920_000, csgd: 281_600_000 }, growth: 0.05 },
  { key: "11", label: "8A", last: { oil: 8_960_000, gas: 1_040_000, cond: 31_000, csgd: 14_800_000 }, growth: -0.01 },
  { key: "13", label: "09", last: { oil: 1_380_000, gas: 6_910_000, cond: 302_000, csgd: 3_480_000 }, growth: -0.05 },
  { key: "14", label: "10", last: { oil: 1_020_000, gas: 22_300_000, cond: 1_870_000, csgd: 3_960_000 }, growth: -0.04 },
];

/** Permian counties and the two big Eagle Ford counties, keyed by RRC county code. */
const COUNTIES: { key: string; label: string; district: string; last: Omit<CycleTotals, "cycle">; growth: number }[] = [
  { key: "503", label: "YOUNG", district: "13", last: { oil: 52_300, gas: 62_400, cond: 1_400, csgd: 76_500 }, growth: -0.06 },
  { key: "237", label: "JACK", district: "13", last: { oil: 47_400, gas: 323_000, cond: 2_900, csgd: 321_000 }, growth: -0.05 },
  { key: "317", label: "MARTIN", district: "10", last: { oil: 11_520_000, gas: 1_380_000, cond: 214_000, csgd: 31_700_000 }, growth: 0.07 },
  { key: "329", label: "MIDLAND", district: "10", last: { oil: 18_940_000, gas: 2_110_000, cond: 402_000, csgd: 58_300_000 }, growth: 0.06 },
  { key: "227", label: "HOWARD", district: "10", last: { oil: 7_860_000, gas: 610_000, cond: 96_000, csgd: 17_900_000 }, growth: 0.08 },
  { key: "003", label: "ANDREWS", district: "10", last: { oil: 4_270_000, gas: 380_000, cond: 41_000, csgd: 9_160_000 }, growth: 0.01 },
  { key: "389", label: "REEVES", district: "10", last: { oil: 9_310_000, gas: 12_800_000, cond: 1_960_000, csgd: 54_700_000 }, growth: 0.04 },
  { key: "301", label: "LOVING", district: "10", last: { oil: 8_120_000, gas: 6_420_000, cond: 1_310_000, csgd: 38_400_000 }, growth: 0.05 },
  { key: "461", label: "UPTON", district: "09", last: { oil: 3_980_000, gas: 1_920_000, cond: 128_000, csgd: 14_100_000 }, growth: 0.03 },
  { key: "383", label: "REAGAN", district: "09", last: { oil: 1_840_000, gas: 760_000, cond: 52_000, csgd: 7_380_000 }, growth: -0.02 },
  { key: "173", label: "GLASSCOCK", district: "09", last: { oil: 2_910_000, gas: 290_000, cond: 37_000, csgd: 10_200_000 }, growth: 0.04 },
  { key: "115", label: "DAWSON", district: "11", last: { oil: 1_160_000, gas: 41_000, cond: 2_000, csgd: 1_380_000 }, growth: 0.02 },
  { key: "135", label: "ECTOR", district: "10", last: { oil: 2_340_000, gas: 210_000, cond: 18_000, csgd: 4_960_000 }, growth: -0.01 },
  { key: "475", label: "WARD", district: "10", last: { oil: 4_060_000, gas: 3_910_000, cond: 512_000, csgd: 19_800_000 }, growth: 0.03 },
  { key: "255", label: "KARNES", district: "01", last: { oil: 4_820_000, gas: 3_470_000, cond: 610_000, csgd: 11_900_000 }, growth: -0.03 },
  { key: "283", label: "LA SALLE", district: "01", last: { oil: 2_610_000, gas: 4_180_000, cond: 540_000, csgd: 7_020_000 }, growth: -0.02 },
];

const districts: AreaSeries[] = DISTRICTS.map((d, i) => ({ key: d.key, label: d.label, monthly: series(d.last, d.growth, 10 + i) }));
const counties: AreaSeries[] = COUNTIES.map((c, i) => ({
  key: c.key,
  label: c.label,
  district_no: c.district,
  monthly: series(c.last, c.growth, 40 + i),
}));

/** Texas is the sum of its districts, cycle by cycle. */
const statewide: CycleTotals[] = districts[0].monthly.map((m, k) => {
  const sum = (f: keyof Omit<CycleTotals, "cycle">) => districts.reduce((a, d) => a + d.monthly[k][f], 0);
  return { cycle: m.cycle, oil: sum("oil"), gas: sum("gas"), cond: sum("cond"), csgd: sum("csgd") };
});

/** Trailing twelve reported cycles, summed: what the boards rank on. */
function trailing(monthly: CycleTotals[]): { oil: number; gas: number } {
  const last = monthly.slice(-12);
  return { oil: last.reduce((a, m) => a + m.oil, 0), gas: last.reduce((a, m) => a + m.gas, 0) };
}

const WELLS_BY_COUNTY: Record<string, number> = {
  "329": 11_842, "317": 6_418, "389": 5_137, "301": 2_964, "227": 5_903, "475": 3_381, "255": 3_976, "003": 7_206,
};

const topCounties: RankedRow[] = COUNTIES.map((c, i) => ({
  key: c.key,
  label: c.label,
  ...trailing(counties[i].monthly),
  months: 12,
  count: WELLS_BY_COUNTY[c.key],
}))
  .sort((a, b) => b.oil - a.oil)
  .slice(0, 8);

/** A board row from one month's oil and gas, as a 12-cycle window. */
const board = (key: string, label: string, oil: number, gas: number, count?: number, sub?: string): RankedRow => ({
  key,
  label,
  oil: oil * 12,
  gas: gas * 12,
  months: 12,
  count,
  sub: sub ?? null,
});

const topFields: RankedRow[] = [
  board("85279300", "SPRABERRY (TREND AREA)", 52_600_000, 171_400_000, 31_574),
  board("70279900", "PHANTOM (WOLFCAMP)", 21_900_000, 118_300_000, 4_212),
  board("27135750", "EAGLEVILLE (EAGLE FORD-1)", 9_240_000, 24_800_000, 6_887),
  board("27135700", "EAGLEVILLE (EAGLE FORD-2)", 3_610_000, 31_700_000, 2_931),
  board("33233001", "GARDEN CITY, S. (WOLFCAMP)", 2_480_000, 9_120_000, 1_603),
  board("73927001", "SUGARKANE (EAGLE FORD)", 2_010_000, 26_400_000, 1_948),
];

const topOperators: RankedRow[] = [
  board("612204", "MESA BASIN ENERGY LP", 12_940_000, 41_800_000, 6_214),
  board("101886", "CAPROCK PERMIAN OPERATING LLC", 10_180_000, 33_600_000, 5_071),
  board("846217", "SANDHILL RESOURCES INC", 8_710_000, 29_900_000, 4_388),
  board("653421", "PERMIAN BASIN OPERATING LLC", 6_820_000, 21_200_000, 3_165),
  board("298176", "LLANO ESTACADO E&P LLC", 5_940_000, 18_100_000, 2_907),
  board("471950", "RED DRAW OPERATING COMPANY", 4_380_000, 15_600_000, 2_114),
];

const topLeases: RankedRow[] = [
  board("O/10/53618", "TARZAN UNIT 4-9", 214_600, 512_300, undefined, "MESA BASIN ENERGY LP"),
  board("O/10/54102", "BREEDLOVE 'B' 32-29", 198_400, 471_900, undefined, "CAPROCK PERMIAN OPERATING LLC"),
  board("O/10/52877", "STANTON NORTH 12-1", 176_200, 438_100, undefined, "SANDHILL RESOURCES INC"),
  board("O/10/55031", "GRADY 17-20 UNIT", 162_900, 402_800, undefined, "PERMIAN BASIN OPERATING LLC"),
  board("O/10/53390", "WOODY 38-35 A", 149_700, 377_600, undefined, "LLANO ESTACADO E&P LLC"),
];

export const reconMarket: MarketData = {
  statewide,
  districts,
  counties,
  topCounties,
  topFields,
  topOperators,
  topLeases,
  lastReportedCycle: MARKET_REPORTED,
  lastLoadedCycle: MARKET_LOADED,
};

/** The county the screen opens scoped to: Young, where Sky operates. */
export const MARKET_SCOPE = "503";
