/**
 * Extra rows for the phone screens in `components/screens/product/mobile/`
 * (run ticket, lease), on top of `mobileFixture()`.
 *
 * What is typed here is what a pumper reads off a ticket rather than a rate:
 * the scanned ticket's departure time and BS&W.
 */
import { mobileFixture } from "./mobile-fixture";
import { LEASES, SWD, TANKS, WELLS } from "./operator";

const SMITH = LEASES.find((l) => l.id === "l-smith")!;

function build() {
  const m = mobileFixture();
  return {
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
