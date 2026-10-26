/**
 * Extra rows for the phone screens in `components/screens/product/mobile/`
 * (meter reading, run ticket, lease, note), on top of `mobileFixture()`.
 *
 * Rates come from the dashboard fixture's daily series, never typed. What is
 * typed here is what a pumper reads off a face or a ticket rather than a rate:
 * the meter's config figures and opening counter, and the scanned ticket's
 * departure time and BS&W.
 */
import { dashboardFixture } from "./dashboard-fixture";
import { mobileFixture } from "./mobile-fixture";
import { LEASES, SWD, TANKS, WELLS } from "./operator";

const SMITH = LEASES.find((l) => l.id === "l-smith")!;

/** The Smith wells' gas on one day, summed off the daily series. */
function smithGasOn(date: string): number {
  const fx = dashboardFixture();
  return WELLS.filter((w) => w.lease === SMITH.id).reduce((sum, w) => {
    const day = fx.dailyByWell.find((d) => d.wellId === w.id)?.daily.find((d) => d.date === date);
    return sum + (day?.gasMcf ?? 0);
  }, 0);
}

/** Every Smith day on record, summed: what the counter has advanced by. */
function smithGasThrough(date: string): number {
  const fx = dashboardFixture();
  return WELLS.filter((w) => w.lease === SMITH.id).reduce((sum, w) => {
    const series = fx.dailyByWell.find((d) => d.wellId === w.id)?.daily ?? [];
    return sum + series.filter((d) => d.date <= date).reduce((a, d) => a + d.gasMcf, 0);
  }, 0);
}

function build() {
  const m = mobileFixture();
  /** The counter as it stood before the daily series begins. */
  const OPENING_INDEX = 186_412;
  return {
    /**
     * Smith M1's last reading, taken on Oct 26: the day before's total, the
     * flow rate on the face that morning, the counter and the config. A new
     * reading on Oct 27 opens prefilled from it (meter-reading-form.ts
     * `seedForm`), the counter left blank with this one greyed behind it.
     */
    meterPrevious: {
      date: m.meter.yesterday.date,
      yesterdayMcf: smithGasOn("2026-10-25"),
      mcf: m.meter.yesterday.volumeMcf,
      cumulativeMcf: Math.round(OPENING_INDEX + smithGasThrough("2026-10-25")),
      orifice: 0.5,
      differential: 21.6,
      separator: 35,
      heater: 110,
    },
    /** Reading time on the new meter form (`nowTime()` when it opened). */
    meterNowTime: "07:52",
    /** The scanned ticket's printed fields beyond mobileFixture().ticket. */
    ticketPrinted: { departureTime: "08:10", bsW: 0.3 },
    smithFacilities: {
      oilTanks: TANKS.filter((t) => t.lease === SMITH.id && t.kind === "oil").map((t) => t.name),
      waterTanks: TANKS.filter((t) => t.lease === SMITH.id && t.kind === "water").map((t) => t.name),
      gasMeters: [m.meter.name],
      swdWells: [SWD.name],
      batteries: ["Smith Battery"],
      wells: WELLS.filter((w) => w.lease === SMITH.id).map((w) => w.name),
    },
  };
}

export type MobileAFixture = ReturnType<typeof build>;

let cached: MobileAFixture | null = null;
export function mobileAFixture(): MobileAFixture {
  return (cached ??= build());
}
