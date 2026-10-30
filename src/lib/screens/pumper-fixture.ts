/**
 * The Pumper page's phone screens: Smith 4's Info tab and its oil well tests,
 * on top of `mobileFixture()` (the pumper, the Smith tanks, this morning's run
 * off Smith T202) and the dashboard's daily record.
 *
 * Info. The rows are the phone's default producing-well sheet
 * (mobile-background src/lib/well-info-template.ts `defaultInfoFields`), the
 * list an org gets until an admin edits it in Settings. Smith 4 is a ~3,400 ft
 * Strawn well on a rod pump, so the tubing tally, seating nipple, rod string
 * and casing agree with one another, and the tank counts are the Smith lease's
 * own tanks (operator.ts `TANKS`).
 *
 * Tests. Three 48-hour oil tests, Smith 4 isolated to Smith T202 with the rest
 * of the battery (Smith 1 to 3) on Smith T201, each gauged 07:00 to 07:00
 * (documents-tanks.ts `GAUGE_TIME`). Every barrel is the dashboard's daily
 * record for those days:
 * - Smith T202 rises by Smith 4's oil and nothing else, and then sits; its
 *   gauges chain backward from the 10' 6 1/4" the purchaser opened it at this
 *   morning (mobileFixture().ticket.openIn), so the last test's close is that
 *   gauge.
 * - Smith T201 opens at the lease record's morning gauge (`morningStock`) and
 *   rises by Smith 1 to 3's oil.
 * The windows are June, July and August, clear of any haul (a haul inside the
 * window is netted in, and none is needed here) and of the months whose T201
 * gauges and loads other screens show (September, and October's).
 * Gauges are set to the quarter inch, as the wheel enters them; the test's
 * barrels are the gauge differences at the tanks' 1.67 bbl/in.
 */
import { dashboardFixture } from "./dashboard-fixture";
import { GAUGE_TIME, morningStock } from "./documents-tanks";
import { mobileFixture } from "./mobile-fixture";
import { LEASES, TANKS, WELLS } from "./operator";

const SMITH = LEASES.find((l) => l.id === "l-smith")!;
export const PUMPER_WELL = WELLS.find((w) => w.id === "w-s4")!;
const tank = (id: string) => TANKS.find((t) => t.id === id)!;
export const ISOLATION_TANK = tank("t-sm-202");
export const CONTROL_TANK = tank("t-sm-201");

const quarter = (n: number) => Math.round(n * 4) / 4;

function addDays(iso: string, d: number): string {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}

/* ---------------------------------- Info ---------------------------------- */

/**
 * Smith 4's tubing: 108 joints of 2 3/8" EUE, strapped between 31.12 and
 * 31.88 ft. Deterministic, so the tally and its depth never move.
 */
const TUBING_JOINTS: number[] = Array.from({ length: 108 }, (_, i) => Math.round((31.12 + ((i * 37) % 77) / 100) * 100) / 100);

function buildInfo() {
  const depth = TUBING_JOINTS.reduce((a, j) => a + j, 0);
  // The seating nipple sits on top of the last joint (the mud anchor); the
  // pump seats there, so the rod string reaches the same depth.
  const sn = depth - TUBING_JOINTS[TUBING_JOINTS.length - 1];
  const ftLabel = (n: number) => `${Math.round(n).toLocaleString("en-US")} ft`;
  // 16 ft polish rod, then 25 ft rods to the pump.
  const rods = Math.floor((sn - 16) / 25);
  const oilTanks = TANKS.filter((t) => t.lease === SMITH.id && t.kind === "oil").length;
  const waterTanks = TANKS.filter((t) => t.lease === SMITH.id && t.kind === "water").length;

  /** label → stored value, every slot on the sheet filled. */
  const values: [string, string][] = [
    ["KB", "11 ft"],
    ["Downhole pump", "20-125-RHBC-12-4"],
    ["SN", ftLabel(sn)],
    ["Tubing", "2 3/8\" EUE 8rd J-55"],
    ["Polish rod", "1 1/4\" x 16 ft"],
    ["Polish rod liner", "1 1/2\" x 10 ft"],
    ["Rod subs", "3/4\" x 4 ft, 2 ft"],
    ["Rods", `${rods} x 3/4" grade D`],
    ["Casing", "5 1/2\" 15.5#"],
    ["Casing depth", "3,540 ft"],
    ["Rod depth", ftLabel(sn)],
    ["Plug back or bridge plugs", "3,497 ft PBTD"],
    ["Top of cement", "2,180 ft"],
    ["Surface casing", "8 5/8\" 24#"],
    ["Surface casing depth", "318 ft"],
    ["Pumping unit", "Lufkin C-114D-143-64"],
    ["Motor", "15 hp electric"],
    ["Sheave", "7.5\""],
    ["Belts", "3 x B-128"],
    ["Chemical", "Corrosion inhibitor"],
    ["Treatment rate", "1 qt per week"],
    ["Treatment method", "Batch down annulus"],
    ["Chemical vendor", "Brazos Valley Chemical"],
    ["Oil tanks good", String(oilTanks)],
    ["Oil tanks bad", "0"],
    ["Water tanks good", String(waterTanks)],
    ["Water tanks bad", "0"],
  ];
  return { tubingJoints: TUBING_JOINTS, tubingDepthFt: depth, rows: values.map(([label, value]) => ({ label, value })) };
}

/* ---------------------------------- Tests --------------------------------- */

export interface PumperReading {
  tankId: string;
  date: string;
  time: string;
  /** Top gauge, inches. */
  gauge: number;
  bbls: number;
}

export interface PumperWellTest {
  id: string;
  startAt: string;
  endAt: string;
  testDate: string;
  isolationTankId: string;
  controlTankIds: string[];
  oilBbls: number;
  controlBbls: number;
  frac: number;
  readings: PumperReading[];
}

/** First mornings of the three windows; each runs two days. */
const TEST_STARTS = ["2026-06-16", "2026-07-21", "2026-08-11"];

function buildTests(): PumperWellTest[] {
  const fx = dashboardFixture();
  const dailyOf = (wellId: string) => new Map(fx.dailyByWell.find((d) => d.wellId === wellId)!.daily.map((p) => [p.date, p.oilBbl]));
  const s4 = dailyOf(PUMPER_WELL.id);
  const rest = WELLS.filter((w) => w.lease === SMITH.id && w.id !== PUMPER_WELL.id).map((w) => dailyOf(w.id));
  const restOn = (date: string) => rest.reduce((a, m) => a + (m.get(date) ?? 0), 0);
  const bpiIso = ISOLATION_TANK.bblPerInch;
  const bpiCtl = CONTROL_TANK.bblPerInch;

  for (const d1 of TEST_STARTS) {
    const haul = fx.runTickets.find((t) => t.leaseId === SMITH.id && (t.date === d1 || t.date === addDays(d1, 1)));
    if (haul) throw new Error(`pumper-fixture: a Smith haul on ${haul.date} falls inside the test from ${d1}`);
  }

  // Smith T202, backward from this morning's opening gauge.
  let iso = mobileFixture().ticket.openIn;
  const isoGauges = new Map<string, [number, number, number]>();
  for (const d1 of [...TEST_STARTS].reverse()) {
    const d2 = addDays(d1, 1);
    const g3 = iso;
    const g2 = quarter(g3 - (s4.get(d2) ?? 0) / bpiIso);
    const g1 = quarter(g2 - (s4.get(d1) ?? 0) / bpiIso);
    isoGauges.set(d1, [g1, g2, g3]);
    iso = g1;
  }

  return TEST_STARTS.map((d1, i) => {
    const d2 = addDays(d1, 1);
    const d3 = addDays(d1, 2);
    const [i1, i2, i3] = isoGauges.get(d1)!;
    const c1 = quarter(morningStock(SMITH.id, d1) / bpiCtl);
    const c2 = quarter(c1 + restOn(d1) / bpiCtl);
    const c3 = quarter(c2 + restOn(d2) / bpiCtl);
    const oilBbls = (i3 - i1) * bpiIso;
    const controlBbls = (c3 - c1) * bpiCtl;
    const reading = (tankId: string, date: string, gauge: number, bpi: number): PumperReading => ({ tankId, date, time: GAUGE_TIME, gauge, bbls: gauge * bpi });
    return {
      id: `wt-s4-${i + 1}`,
      startAt: `${d1}T${GAUGE_TIME}:00Z`,
      endAt: `${d3}T${GAUGE_TIME}:00Z`,
      testDate: d3,
      isolationTankId: ISOLATION_TANK.id,
      controlTankIds: [CONTROL_TANK.id],
      oilBbls,
      controlBbls,
      frac: oilBbls / (oilBbls + controlBbls),
      readings: [
        reading(ISOLATION_TANK.id, d1, i1, bpiIso),
        reading(ISOLATION_TANK.id, d2, i2, bpiIso),
        reading(ISOLATION_TANK.id, d3, i3, bpiIso),
        reading(CONTROL_TANK.id, d1, c1, bpiCtl),
        reading(CONTROL_TANK.id, d2, c2, bpiCtl),
        reading(CONTROL_TANK.id, d3, c3, bpiCtl),
      ],
    };
  });
}

function build() {
  return {
    well: PUMPER_WELL,
    pumper: mobileFixture().members.pumper,
    info: buildInfo(),
    /** Newest first, as `listWellTestsByWell` returns them. */
    tests: buildTests().reverse(),
  };
}

export type PumperFixture = ReturnType<typeof build>;

let cached: PumperFixture | null = null;
export function pumperFixture(): PumperFixture {
  return (cached ??= build());
}
