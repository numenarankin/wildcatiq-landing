/**
 * The office manager on Facilities, asking Orion to set up a new lease: two
 * wells, two oil tanks, a water tank and a gas meter, the same records the
 * flow map's New facility menu makes one at a time.
 *
 * The turn is the app's write tools in the order a real one runs them. Each
 * call needs the id the one before it returned (a well needs its lease, the
 * battery its wells, a tank its battery), so the SDK pauses at every card:
 * `create_lease`, then `create_well` (both wells, one card), then
 * `create_battery`, then `create_tank` (all three, one card) and `create_meter`
 * together, since both only need the wells. Two reads come first: the lease
 * list, so the name is not taken, and the tank list, for Smith's tank size.
 *
 * Tank sizes are Smith's (operator.ts: 500 bbl, 1.67 bbl/in). Tank numbers
 * follow the operator's habit, one hundred per lease (T101 on Johnson A to
 * T501 on Roach Parrott), so Mabel Pruitt's are T601 and T602. Shares are
 * what the app writes for a new battery, tank and meter with wells on it: an
 * even split (`addBatteryMembers`, the tank and meter forms).
 *
 * `pruittGraph(n)` is the flow map after the first `n` writes are approved,
 * built by the app's own `buildFacilityGraph` on top of the operator's graph.
 * Nothing on the new lease has produced yet, so its cards carry no volumes.
 */
import type { Conversation } from "@/lib/ai/conversations";
import type { UIMessage } from "@/lib/ai/sdk";
import type { FacilityGraph, GraphInput } from "@/lib/facilities/graph";
import { flowMapGraph } from "./flow-map-fixture";
import { FIXTURE_TODAY, OPERATOR, TANKS } from "./operator";

const SMITH_TANK = TANKS.find((t) => t.id === "t-sm-201")!;

export const PRUITT = {
  lease: { id: "l-pruitt", name: "Mabel Pruitt" },
  wells: [
    { id: "w-mp1", name: "Mabel Pruitt 1" },
    { id: "w-mp2", name: "Mabel Pruitt 2" },
  ],
  battery: { id: "battery-l-pruitt", name: "Mabel Pruitt Battery" },
  oilTanks: [
    { id: "t-mp-601", tankNo: "601" },
    { id: "t-mp-602", tankNo: "602" },
  ],
  waterTank: { id: "t-mp-w1", tankNo: "1" },
  meter: { id: "meter-l-pruitt", meterNo: "1" },
} as const;

const wellIds = PRUITT.wells.map((w) => w.id);

/** The new records' names, for the approval cards' name lookup. */
export const PRUITT_NAMES: Record<string, string> = {
  [PRUITT.lease.id]: PRUITT.lease.name,
  [PRUITT.battery.id]: PRUITT.battery.name,
  ...Object.fromEntries(PRUITT.wells.map((w) => [w.id, w.name])),
};

export const PRUITT_QUESTION = `Set up a new lease, ${PRUITT.lease.name}, in ${OPERATOR.county} County. Two wells, two oil tanks, one water tank and a gas meter. Same size tanks as Smith.`;

const WHEN = new Date(`${FIXTURE_TODAY}T10:41:00`).getTime();

function read(name: string, i: number): UIMessage["parts"][number] {
  return { type: `tool-${name}`, toolCallId: `toolu_read_${name}_${i}`, state: "output-available", input: {}, output: { ok: true } };
}

/** One approval-gated write, waiting for its card to be approved. */
function write(name: string, key: string, input: Record<string, unknown>): UIMessage["parts"][number] {
  return {
    type: `tool-${name}`,
    toolCallId: `toolu_01Pruitt_${key}`,
    state: "approval-requested",
    input,
    approval: { id: `appr_pruitt_${key}` },
  };
}

const tankRow = { bblPerInch: SMITH_TANK.bblPerInch, capacityBbls: SMITH_TANK.capacityBbl };

const REPLY = `Done. ${PRUITT.lease.name} is on the map with ${PRUITT.wells[0].name} and 2 on its battery, which splits their oil evenly between T${PRUITT.oilTanks[0].tankNo} and T${PRUITT.oilTanks[1].tankNo}. W${PRUITT.waterTank.tankNo} takes both wells' water and M${PRUITT.meter.meterNo} their gas, 50% each.

The tanks match Smith's, ${SMITH_TANK.capacityBbl} bbl at ${SMITH_TANK.bblPerInch} bbl per inch. W${PRUITT.waterTank.tankNo} is not tied to a disposal well yet, and the lease has no RRC number. Tell me either and I will add it.`;

export function pruittLeaseThread(): Conversation {
  return {
    id: "conv-pruitt-lease",
    title: `New lease: ${PRUITT.lease.name}`,
    createdAt: WHEN,
    updatedAt: WHEN + 60_000,
    messages: [
      {
        id: "conv-pruitt-lease-u1",
        role: "user",
        metadata: { createdAt: new Date(WHEN).toISOString() },
        parts: [{ type: "text", text: PRUITT_QUESTION, state: "done" }],
      },
      {
        id: "conv-pruitt-lease-a1",
        role: "assistant",
        metadata: { createdAt: new Date(WHEN + 60_000).toISOString() },
        parts: [
          { type: "step-start" },
          read("list_leases", 0),
          read("list_tanks", 1),
          write("create_lease", "lease", {
            summary: `Create the ${PRUITT.lease.name} lease in ${OPERATOR.county} County`,
            rows: [{ name: PRUITT.lease.name, county: OPERATOR.county }],
          }),
          write("create_well", "wells", {
            summary: `Register ${PRUITT.wells[0].name} and 2 as producers on ${PRUITT.lease.name}`,
            rows: PRUITT.wells.map((w) => ({ name: w.name, county: OPERATOR.county, type: "producer", leaseId: PRUITT.lease.id })),
          }),
          write("create_battery", "battery", {
            summary: `Put both wells on a ${PRUITT.lease.name} battery`,
            rows: [{ name: PRUITT.battery.name, leaseId: PRUITT.lease.id, wellIds }],
          }),
          write("create_tank", "tanks", {
            summary: `Create T${PRUITT.oilTanks[0].tankNo} and T${PRUITT.oilTanks[1].tankNo} on the battery and W${PRUITT.waterTank.tankNo} for both wells' water`,
            rows: [
              ...PRUITT.oilTanks.map((t) => ({ product: "oil", tankNo: t.tankNo, ...tankRow, batteryId: PRUITT.battery.id })),
              {
                product: "water",
                waterService: "production",
                tankNo: PRUITT.waterTank.tankNo,
                ...tankRow,
                leaseId: PRUITT.lease.id,
                wellIds,
              },
            ],
          }),
          write("create_meter", "meter", {
            summary: `Create gas meter M${PRUITT.meter.meterNo} on ${PRUITT.lease.name} for both wells`,
            rows: [{ meterNo: PRUITT.meter.meterNo, leaseId: PRUITT.lease.id, wellIds, substance: "gas" }],
          }),
          { type: "text", text: REPLY, state: "done" },
        ],
      },
    ],
  };
}

const half = (facilityId: string) => wellIds.map((wellId) => ({ facilityId, wellId, straightPct: 50 }));

/** What the first `n` approved writes put on the map, in the turn's order. */
function pruittRecords(n: number): Partial<GraphInput> {
  const out: Partial<GraphInput> = {};
  if (n >= 1) out.leases = [{ id: PRUITT.lease.id, label: PRUITT.lease.name }];
  if (n >= 2) {
    out.wells = PRUITT.wells.map((w) => ({
      id: w.id,
      name: w.name,
      type: "producer" as const,
      leaseId: PRUITT.lease.id,
      oilProduction: 0,
      gasProduction: 0,
      saltWater: 0,
    }));
  }
  if (n >= 3) {
    out.batteries = [{ id: PRUITT.battery.id, name: PRUITT.battery.name, leaseId: PRUITT.lease.id }];
    out.batteryAllocations = half(PRUITT.battery.id);
  }
  if (n >= 4) {
    out.tanks = [
      ...PRUITT.oilTanks.map((t) => ({
        id: t.id,
        name: `${PRUITT.lease.name} T${t.tankNo}`,
        product: "oil" as const,
        leaseId: PRUITT.lease.id,
        batteryId: PRUITT.battery.id,
        injectionWellId: null,
        tankNo: t.tankNo,
      })),
      {
        id: PRUITT.waterTank.id,
        name: `${PRUITT.lease.name} W${PRUITT.waterTank.tankNo}`,
        product: "water" as const,
        leaseId: PRUITT.lease.id,
        batteryId: null,
        injectionWellId: null,
        tankNo: PRUITT.waterTank.tankNo,
      },
    ];
    out.tankAllocations = half(PRUITT.waterTank.id);
  }
  if (n >= 5) {
    out.meters = [
      {
        id: PRUITT.meter.id,
        name: `${PRUITT.lease.name} M${PRUITT.meter.meterNo}`,
        leaseId: PRUITT.lease.id,
        substance: "gas" as const,
        meterNo: PRUITT.meter.meterNo,
      },
    ];
    out.meterAllocations = half(PRUITT.meter.id);
  }
  return out;
}

/** The flow map after the first `n` of the turn's five writes are approved (0 to 5). */
export function pruittGraph(n: number): FacilityGraph {
  return flowMapGraph(pruittRecords(n));
}
