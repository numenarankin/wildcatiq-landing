/**
 * The flow map's operator, derived from the shared one (operator.ts): the same
 * five leases, fourteen wells, tanks and SWD well every page shows. The graph
 * is built by the app's own `buildFacilityGraph` from the same row shapes the
 * page feeds it, so the wiring on screen is derived the way the app derives
 * it, not drawn by hand.
 *
 * Every well's oil and gas rate is its last measured day in the dashboard
 * fixture (`wellRows`), and its saltwater the same day of `dailyByWell`, so a
 * card here and the dashboard's lease table quote one number. Meter and SWD
 * figures are computed from those same daily series.
 *
 * Wiring, per lease: every producing well on its lease battery (oil, which
 * fans out across the battery's oil tanks), on its lease gas meter, and on
 * its lease's saltwater tank where the lease has one. Smith W1 runs to
 * Smith SWD 1, and so does Johnson A W1, which makes Smith SWD 1 a shared
 * facility on the Johnson A lane. Smith's two oil tanks sell through the purchaser's
 * LACT drawn as operator connections.
 */
import {
  buildFacilityGraph,
  nodeId,
  type FacilityGraph,
  type GraphAllocation,
  type GraphInput,
  type GraphTank,
  type GraphWell,
} from "@/lib/facilities/graph";
import type { ReadoutSource } from "@/lib/facilities/flow-layout";
import type { FacilityCatalog } from "@/components/facilities/facility-create-menu";
import type { FacilityRows } from "@/components/facilities/facility-detail-modal";
import { dashboardFixture } from "./dashboard-fixture";
import { mobileFixture } from "./mobile-fixture";
import { leaseTank, morningStock } from "./documents-tanks";
import { FIXTURE_TODAY, LEASES as OP_LEASES, PURCHASERS, SWD, TANKS as OP_TANKS, WELLS as OP_WELLS } from "./operator";

const lease = (id: string) => OP_LEASES.find((l) => l.id === id)!;

/** The leases by name, for the screens that open on one. */
export const LEASES = {
  johnsonA: { id: "l-johnson", label: lease("l-johnson").name },
  smith: { id: "l-smith", label: lease("l-smith").name },
  royCorbett: { id: "l-corbett", label: lease("l-corbett").name },
  fannieYoung: { id: "l-young", label: lease("l-young").name },
  roachParrott: { id: "l-parrott", label: lease("l-parrott").name },
} as const;

/** The card the hero opens with highlighted: Smith 4, the hero well on every page. */
export const SELECTED_NODE_ID = nodeId("well", "w-s4");

const fx = dashboardFixture();
const lastDay = (wellId: string) => {
  const s = fx.dailyByWell.find((d) => d.wellId === wellId)!.daily;
  return s[s.length - 1];
};
const lastDays = (wellId: string, n: number) => {
  const s = fx.dailyByWell.find((d) => d.wellId === wellId)!.daily;
  return s.slice(s.length - n);
};

const PRODUCERS: GraphWell[] = OP_WELLS.map((w) => {
  const row = fx.wellRows.find((r) => r.wellId === w.id)!;
  return {
    id: w.id,
    name: w.name,
    type: "producer",
    leaseId: w.lease,
    oilProduction: row.oilBbl,
    gasProduction: row.gasMcf,
    saltWater: lastDay(w.id).water,
  };
});

const wellsOn = (leaseId: string) => OP_WELLS.filter((w) => w.lease === leaseId).map((w) => w.id);

/** Leases whose saltwater tank runs to Smith SWD 1. */
const SWD_LEASES = ["l-smith", "l-johnson"];

/**
 * Smith SWD 1's card is its 30-day disposal rate (graph.ts `disposalBblPerDay`):
 * the average daily saltwater of every well whose tank runs to it.
 */
const swdBblPerDay = (() => {
  const wells = SWD_LEASES.flatMap(wellsOn);
  const days = 30;
  const total = wells.reduce((a, id) => a + lastDays(id, days).reduce((b, d) => b + d.water, 0), 0);
  return Math.round(total / days);
})();

const WELLS: GraphWell[] = [
  ...PRODUCERS,
  {
    id: SWD.id,
    name: SWD.name,
    type: "injection",
    leaseId: SWD.lease,
    oilProduction: 0,
    gasProduction: 0,
    saltWater: 0,
    disposalBblPerDay: swdBblPerDay,
    permittedBblPerDay: SWD.permittedBblPerDay,
  },
];

const batteryId = (leaseId: string) => `battery-${leaseId}`;

const TANKS: GraphTank[] = OP_TANKS.map((t) => ({
  id: t.id,
  name: t.name,
  product: t.kind,
  leaseId: t.lease,
  batteryId: t.kind === "oil" ? batteryId(t.lease) : null,
  injectionWellId: t.kind === "water" && SWD_LEASES.includes(t.lease) ? SWD.id : null,
  tankNo: t.name.match(/(\d+)$/)?.[1] ?? null,
}));

const METERS = OP_LEASES.map((l) => ({
  id: `meter-${l.id}`,
  name: `${l.name} M1`,
  leaseId: l.id,
  substance: "gas" as const,
  meterNo: "1",
}));

const BATTERIES = OP_LEASES.map((l) => ({ id: batteryId(l.id), name: `${l.name} Battery`, leaseId: l.id }));

/** The Smith LACT. The app's graph has no LACT kind; a sales point the tanks
 *  feed is a haul-off (gatherer) node wired by hand, which is how an operator
 *  draws one on the real map. */
const LACT = { id: "gatherer-purchaser-lact", name: `${PURCHASERS.oil.split(" ").slice(0, 2).join(" ")} LACT` };

const alloc = (facilityId: string, wellId: string, pct = 100): GraphAllocation => ({
  facilityId,
  wellId,
  straightPct: pct,
});

const INPUT: GraphInput = {
  wells: WELLS,
  tanks: TANKS,
  meters: METERS,
  batteries: BATTERIES,
  leases: OP_LEASES.map((l) => ({ id: l.id, label: l.name })),
  gatherers: [LACT],
  // Water: each well runs to its lease's saltwater tank, where there is one.
  tankAllocations: OP_TANKS.filter((t) => t.kind === "water").flatMap((t) => wellsOn(t.lease).map((w) => alloc(t.id, w))),
  // Gas: wells sell through their lease's meter.
  meterAllocations: OP_LEASES.flatMap((l) => wellsOn(l.id).map((w) => alloc(`meter-${l.id}`, w))),
  // Oil: wells on their lease battery, which rolls out to the member tanks.
  batteryAllocations: OP_LEASES.flatMap((l) => wellsOn(l.id).map((w) => alloc(batteryId(l.id), w))),
};

const SMITH_OIL_TANKS = OP_TANKS.filter((t) => t.lease === "l-smith" && t.kind === "oil").map((t) => t.id);

/**
 * The graph, plus any records added on top of the operator's (a lease created
 * on screen and what goes on it), built by the same `buildFacilityGraph`.
 */
export function flowMapGraph(extra: Partial<GraphInput> = {}): FacilityGraph {
  const input: GraphInput = {
    wells: [...INPUT.wells, ...(extra.wells ?? [])],
    tanks: [...INPUT.tanks, ...(extra.tanks ?? [])],
    meters: [...INPUT.meters, ...(extra.meters ?? [])],
    batteries: [...INPUT.batteries, ...(extra.batteries ?? [])],
    leases: [...INPUT.leases, ...(extra.leases ?? [])],
    gatherers: [...(INPUT.gatherers ?? []), ...(extra.gatherers ?? [])],
    tankAllocations: [...INPUT.tankAllocations, ...(extra.tankAllocations ?? [])],
    meterAllocations: [...INPUT.meterAllocations, ...(extra.meterAllocations ?? [])],
    batteryAllocations: [...INPUT.batteryAllocations, ...(extra.batteryAllocations ?? [])],
  };
  const graph = buildFacilityGraph(input);
  // The two oil tanks sell through the LACT: operator-drawn connections
  // (`flow_connections` rows), named the way the graph names every edge.
  const smithOil = PRODUCERS.filter((w) => w.leaseId === "l-smith").reduce((sum, w) => sum + w.oilProduction, 0);
  const lact = nodeId("gatherer", LACT.id);
  for (const tank of SMITH_OIL_TANKS) {
    const from = nodeId("tank", tank);
    graph.edges.push({
      id: `${from}->${lact}:oil`,
      from,
      to: lact,
      substance: "oil",
      flow: smithOil / SMITH_OIL_TANKS.length,
      custom: true,
      connectionId: `conn-${tank}-lact`,
    });
  }
  // The LACT sits on the Smith lease, where it was drawn.
  const node = graph.nodes.find((n) => n.id === lact);
  if (node) {
    node.leaseId = LEASES.smith.id;
    node.substances = ["oil"];
    const smith = graph.territories.find((t) => t.leaseId === LEASES.smith.id);
    const unassigned = graph.territories.find((t) => t.leaseId == null);
    smith?.nodeIds.push(lact);
    if (unassigned) unassigned.nodeIds = unassigned.nodeIds.filter((id) => id !== lact);
  }
  graph.territories = graph.territories.filter((t) => t.nodeIds.length > 0 || t.leaseId != null);
  return graph;
}

/** A lease's gas as its meter reads it: the 14-day EMA of the wells' daily gas. */
function meterEma(leaseId: string): number {
  const ids = wellsOn(leaseId);
  const series = lastDays(ids[0], 30).map((_, i) => ids.reduce((a, id) => a + lastDays(id, 30)[i].gasMcf, 0));
  const alpha = 2 / (14 + 1);
  let ema = series[0];
  for (const v of series.slice(1)) ema = alpha * v + (1 - alpha) * ema;
  return Math.round(ema);
}

const mobile = mobileFixture();
const fillPct = (bbl: number, capacity: number) => Math.round((bbl / capacity) * 100);
const runTankFill = (leaseId: string) => {
  const t = leaseTank(leaseId);
  return fillPct(morningStock(leaseId, FIXTURE_TODAY), t.capacityBbl);
};

export const flowMapReadouts: ReadoutSource = {
  tankFillPct: {
    // This morning's gauge, the one the phone hero takes.
    "t-sm-201": mobile.gauge.fillPct,
    // Run this morning: what the truck left, the ticket's closing gauge.
    "t-sm-202": fillPct(mobile.ticket.closeIn * mobile.ticket.tank.bblPerInch, mobile.ticket.tank.capacityBbl),
    "t-sm-w1": 55,
    // Each lease's run tank: this morning's stock in the dashboard's tank record.
    "t-ja-101": runTankFill("l-johnson"),
    // The spare on Johnson A, holding a bottom.
    "t-ja-102": 6,
    "t-ja-w1": 37,
    "t-rc-301": runTankFill("l-corbett"),
    "t-fy-401": runTankFill("l-young"),
    "t-rp-501": runTankFill("l-parrott"),
  },
  meterLatest: Object.fromEntries(OP_LEASES.map((l) => [`meter-${l.id}`, meterEma(l.id)])),
};

export const flowMapCatalog: FacilityCatalog = {
  wells: PRODUCERS.map((w) => ({ id: w.id, name: w.name, leaseId: w.leaseId })),
  injectionWells: [{ id: SWD.id, name: SWD.name, leaseId: SWD.lease }],
  batteries: BATTERIES,
  gatherers: [LACT],
  leases: OP_LEASES.map((l) => ({ id: l.id, name: l.name })),
  tanks: OP_TANKS.map((t) => ({
    id: t.id,
    name: t.name,
    battery: t.kind === "oil" ? `${lease(t.lease).name} Battery` : "",
    bblPerInch: t.bblPerInch,
    leaseId: t.lease,
    product: t.kind,
  })),
  meters: METERS.map((m) => ({ id: m.id, name: m.name, leaseId: m.leaseId, substance: m.substance })),
};

/**
 * The detail modal's Settings and Allocation tabs read these; the landing port
 * of the modal renders its Connections tab only, which reads the graph's
 * edges, so nothing reads the rows.
 */
export const flowMapRows: FacilityRows = { tanks: [], meters: [], batteries: [], wells: [] };
