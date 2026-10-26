/**
 * The phone screens' data, derived from the shared operator (operator.ts) and
 * the dashboard fixture's per-well rates, so a figure on a phone screen is the
 * figure the dashboard and the flow map show for the same well or tank.
 *
 * The gauge loop: yesterday's stick on Smith T201 is `EVENTS.smithGauge`
 * (Oct 26, 3' 11 1/4"). Today's stick is the tank's morning stock in the
 * dashboard's tank record (`morningStock`, the same record the gauge sheet and
 * the run statement read), converted at the tank's 1.67 bbl/in and set to the
 * nearest quarter, which is all the phone's wheel offers
 * (measurement-wheel.tsx QUARTER_STEPS).
 */
import { dashboardFixture } from "./dashboard-fixture";
import { morningStock } from "./documents-tanks";
import { EVENTS, FIXTURE_TODAY, LEASES, OPERATOR, PURCHASERS, TANKS, WELLS } from "./operator";

export { FIXTURE_TODAY, OPERATOR };

const tank = (id: string) => TANKS.find((t) => t.id === id)!;

/** The tank the hero gauges. */
export const GAUGE_TANK = tank(EVENTS.smithGauge.tank);

const SMITH = LEASES.find((l) => l.id === "l-smith")!;

/** wildcat-phone src/lib/measurement.ts `inchesToParts`. */
export function inchesToParts(inches: number): { feet: number; inches: number; sixteenths: number } {
  const total = Math.max(0, Math.round((inches || 0) * 16));
  const feet = Math.floor(total / 192);
  const rem = total - feet * 192;
  return { feet, inches: Math.floor(rem / 16), sixteenths: rem % 16 };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** wildcat-phone src/lib/measurement.ts `sixteenthLabel`. */
export function sixteenthLabel(s: number): string {
  if (s <= 0) return "0";
  const g = gcd(s, 16);
  return `${s / g}/${16 / g}`;
}

/** wildcat-phone src/lib/measurement.ts `formatFeetInches`, e.g. 99.25 → 8' 3 1/4". */
export function formatFeetInches(inches: number): string {
  const p = inchesToParts(inches);
  const frac = p.sixteenths === 0 ? "" : ` ${sixteenthLabel(p.sixteenths)}`;
  return `${p.feet}' ${p.inches}${frac}"`;
}

/** tank-gauge-modal.tsx `bbl2`. */
export const bbl2 = (n: number): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function build() {
  const fx = dashboardFixture();
  const smithWells = fx.wellRows.filter((r) => r.leaseId === SMITH.id);
  const smithOil = smithWells.reduce((a, r) => a + r.oilBbl, 0);
  const smithGas = smithWells.reduce((a, r) => a + r.gasMcf, 0);

  const yesterdayIn = EVENTS.smithGauge.feet * 12 + EVENTS.smithGauge.inches;
  const todayIn = Math.round((morningStock(SMITH.id, FIXTURE_TODAY) / GAUGE_TANK.bblPerInch) * 4) / 4;
  const todayBbl = todayIn * GAUGE_TANK.bblPerInch;
  const changeBbl = (todayIn - yesterdayIn) * GAUGE_TANK.bblPerInch;

  // Smith M1, the lease's gas meter: yesterday's figures are the Smith wells'
  // gas on the day before the fixture's last day.
  const dayBefore = (wellId: string) => {
    const s = fx.dailyByWell.find((d) => d.wellId === wellId)!.daily;
    return s[s.length - 2];
  };
  const meterYesterdayMcf = smithWells.reduce((a, r) => a + dayBefore(r.wellId).gasMcf, 0);

  // A run off Smith T202 this morning. The gauges are what the ticket
  // printed; the barrels are derived from them at the tank's strapping.
  const runTank = tank("t-sm-202");
  const openIn = 10 * 12 + 6.25;
  const closeIn = 1 * 12 + 0.5;

  return {
    gauge: {
      tank: GAUGE_TANK,
      yesterday: { date: EVENTS.smithGauge.date, inches: yesterdayIn, bbl: yesterdayIn * GAUGE_TANK.bblPerInch },
      today: { date: FIXTURE_TODAY, time: "7:40 AM", inches: todayIn, bbl: todayBbl, changeBbl },
      parts: { yesterday: inchesToParts(yesterdayIn), today: inchesToParts(todayIn) },
      fillPct: Math.round((todayBbl / GAUGE_TANK.capacityBbl) * 100),
    },
    smith: { oilBblPerDay: smithOil, gasMcfPerDay: smithGas },
    meter: {
      name: "Smith M1",
      yesterday: { date: "2026-10-26", volumeMcf: meterYesterdayMcf },
    },
    ticket: {
      tank: runTank,
      purchaser: PURCHASERS.oil,
      number: "418827",
      date: FIXTURE_TODAY,
      openIn,
      closeIn,
      bbl: (openIn - closeIn) * runTank.bblPerInch,
    },
    offline: { pending: 3 },
    note: { well: WELLS.find((w) => w.id === "w-s4")!, body: "Smith 4 pumping off, cut time 2 hrs" },
    members: { owner: OPERATOR.owner, pumper: OPERATOR.pumper },
  };
}

export type MobileFixture = ReturnType<typeof build>;

let cached: MobileFixture | null = null;
export function mobileFixture(): MobileFixture {
  return (cached ??= build());
}
