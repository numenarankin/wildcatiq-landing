/**
 * Flow-map layout (the `/facilities` page) — a workflow-builder view of one
 * commodity's path through the operation: producing wells on the left, then each
 * facility the stream passes through, left to right, until it leaves (a haul-off,
 * a sales meter, an injection well).
 *
 * It reads the SAME `FacilityGraph` the hex map reads (`buildFacilityGraph`), so
 * both views quote the same wiring and the same rates. What differs is the
 * arrangement: one commodity at a time, ranked into stage columns by how far
 * downstream a facility sits, grouped into per-lease lanes.
 *
 * Pure and deterministic (no randomness, no DOM): same graph + filter always
 * lays out identically, so the canvas can re-derive on every filter change and
 * the whole thing unit-tests without a browser.
 */

import type {
  FacilityEdge,
  FacilityGraph,
  FacilityKind,
  FacilityNode,
  FlowView,
  Substance,
} from "@/lib/facilities/graph";

/** Every stream, in the order the page names them. */
export const ALL_SUBSTANCES: Substance[] = ["oil", "gas", "water"];

/** The streams a view draws: one, or all three. */
export function substancesIn(view: FlowView): Substance[] {
  return view === "all" ? ALL_SUBSTANCES : [view];
}

/** Card size in canvas units (px at zoom 1). */
export const FLOW_NODE = { width: 232, height: 74 };

const COL_GAP = 96; // horizontal gap between stage columns
const ROW_GAP = 22; // vertical gap between cards in a column
/** Lease-name strip at the top of a lane; the canvas sizes its header to match. */
export const LANE_HEADER = 32;
const LANE_PAD_X = 18;
const LANE_PAD_Y = 14;
const LANE_GAP = 32; // gap between lease lanes, both axes
const STAGE_BAND = 30; // stage-label row above a single lane
const MARGIN = 44; // outer padding around the whole map
/**
 * Lanes are packed into rows toward this width-to-height ratio rather than
 * stacked in one column: an operation with twenty one-well leases stacked is a
 * mile-long ribbon that fits the screen only at unreadable zoom.
 */
const TARGET_ASPECT = 16 / 9;

export interface FlowNode {
  node: FacilityNode;
  /** Top-left corner in canvas units. */
  x: number;
  y: number;
  /** Stage column (0 = furthest upstream). */
  rank: number;
  /** Lane (connected flow) this card sits in. */
  laneId: string;
  /**
   * True when the node is only here because a scoped-to lease flows into or out
   * of it (a shared SWD well, a haul-off). Drawn muted: it is context, not part
   * of the selected lease.
   */
  external: boolean;
}

export interface FlowLane {
  id: string;
  /** The lease(s) the flow runs on — a label, not the grouping. */
  name: string;
  /**
   * The lease this lane is ON, when it is on exactly one: the lease id, or null
   * for the unassigned lane. `undefined` when the flow crosses leases — that is
   * a lane, but it is not a lease anything can be moved into.
   */
  leaseId: string | null | undefined;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeIds: string[];
}

export interface FlowStage {
  rank: number;
  /** Column heading, e.g. "Wells", "Tanks", "Tanks / Meters". */
  label: string;
  x: number;
  y: number;
  width: number;
}

/**
 * Stage headings are emitted only when the map is a single lane (one lease in
 * scope). Across a packed grid of lanes each lane has its own columns, so one
 * banner of headings would label nothing.
 */

export interface FlowLayout {
  /** The view this was built for; "all" draws every stream on one canvas. */
  substance: FlowView;
  nodes: FlowNode[];
  edges: FacilityEdge[];
  lanes: FlowLane[];
  stages: FlowStage[];
  width: number;
  height: number;
}

export interface FlowFilter {
  /** One stream, or "all" of them at once. */
  substance: FlowView;
  /** `null` = every lease. */
  leaseId: string | null;
  /**
   * The viewport's WIDTH / HEIGHT — a ratio, not a pixel count.
   *
   * Deliberately unitless. The first attempt at this passed the viewport's width
   * in CSS pixels into a target measured in canvas units, and the map is then
   * fit-zoomed: at 65% the canvas is half again as wide as the screen, so the
   * packer was told to fill about one wide lane and every lease started a new
   * row — the exact failure it was meant to fix. A ratio cannot be wrong about
   * its units.
   *
   * Omitted (server render, tests) it falls back to {@link TARGET_ASPECT}.
   */
  viewportAspect?: number;
}

/**
 * Where each kind sits in a commodity's chain, for facilities nothing is wired
 * to yet. Oil runs wells → tanks; gas runs wells → meters; water runs wells →
 * meters → tanks → disposal wells (`buildFacilityGraph`).
 */
const STAGE_RANK: Record<FlowView, Record<FacilityKind, number>> = {
  oil: { well: 0, injection: 2, tank: 1, meter: 1, battery: 1, gatherer: 2 },
  gas: { well: 0, injection: 2, tank: 2, meter: 1, battery: 2, gatherer: 2 },
  water: { well: 0, injection: 3, tank: 2, meter: 1, battery: 2, gatherer: 3 },
  // Every stream at once: the oil arrangement, which already seats tanks and
  // meters side by side one column past the wells, with disposal after them.
  all: { well: 0, injection: 2, tank: 1, meter: 1, battery: 1, gatherer: 2 },
};

/** Plural stage heading per facility kind. */
const KIND_PLURAL: Record<FacilityKind, string> = {
  well: "Wells",
  injection: "SWD Wells",
  tank: "Tanks",
  meter: "Meters",
  battery: "Batteries",
  gatherer: "Haul-off",
};

/** Stable kind order inside a mixed stage heading. */
const KIND_ORDER: FacilityKind[] = [
  "well",
  "meter",
  "tank",
  "battery",
  "injection",
  "gatherer",
];

/**
 * The rate to headline on a card, in this commodity's unit — the well's OWN rate
 * for the commodity being shown, never its headline stream (a gas view must not
 * label a well with its oil rate). Facilities that measure nothing themselves
 * (tanks, meters, haul-off) return null; their throughput is the edge labels.
 */
export function nodeRate(node: FacilityNode, substance: Substance): number | null {
  if (node.metrics) {
    const rate = node.metrics[substance];
    if (rate > 0) return rate;
    // Allocated and making nothing is a MEASUREMENT — a 0% share, a shut-in
    // well, a battery that produced nothing this window — and reads "0".
    // Blank is reserved for a well nobody has allocated, where there is no
    // number to be had.
    return node.allocated?.includes(substance) ? 0 : null;
  }
  // An injection well's `flow` is what it TOOK (30-day disposal rate), which is
  // water and only water.
  if (node.kind === "injection") return substance === "water" ? node.flow : null;
  return null;
}

/** Current-state numbers the cards carry, keyed by the facility's record id. */
export interface ReadoutSource {
  /** Percent full (0-100) per tank id. */
  tankFillPct: Record<string, number>;
  /** Latest reading per GAS meter id, in MCF/day. */
  meterLatest: Record<string, number>;
  /** Disposal rate per WATER meter id, bbl/day — a rate, not the stored index. */
  waterMeterBblPerDay?: Record<string, number>;
}

/** What a card shows: one number and the unit it is in. */
export interface Readout {
  value: number;
  unit: string;
}

/**
 * The number a facility carries on its card, by kind:
 * - a well, its production of the commodity on screen, per day;
 * - a tank, how full it is;
 * - a meter, its current rate: MCF/day on gas, bbl/day disposed on water. The
 *   water figure is a RATE, not the cumulative index the meter stores — an
 *   odometer reading has no meaning beside a tank's "% full" or a well's bbl/d,
 *   and it only ever goes up.
 *
 * Null when the facility has no such number (a tank with no capacity on file
 * has no percentage, and inventing one is worse than an empty card).
 */
export function facilityReadout(
  node: FacilityNode,
  substance: FlowView,
  source: ReadoutSource
): Readout | null {
  if (node.kind === "tank") {
    const pct = source.tankFillPct[node.refId];
    return pct == null ? null : { value: pct, unit: "% full" };
  }
  if (node.kind === "meter") {
    if (node.substances[0] === "water") {
      const rate = source.waterMeterBblPerDay?.[node.refId];
      return rate == null ? null : { value: rate, unit: "bbl/d" };
    }
    const latest = source.meterLatest[node.refId];
    return latest == null ? null : { value: latest, unit: "mcf/d" };
  }
  // A well on the all-streams view has three rates, not one; the card draws
  // them itself (`FlowMapNode.rates`) rather than this picking a favourite.
  if (substance === "all") return null;
  const rate = nodeRate(node, substance);
  return rate == null ? null : { value: rate, unit: flowUnitOf(substance) };
}

/**
 * A rate as a card PRINTS it: one decimal below 100, whole numbers above.
 *
 * Lives here, beside `facilityReadout`, because what a card shows and what the
 * page's totals add up are the same fact. The headline is the sum of these
 * rounded values ({@link companyTotals}), so the column an operator adds by eye
 * and the number above it are the same arithmetic.
 */
export function roundRate(value: number): number {
  return Math.abs(value) < 100 ? Math.round(value * 10) / 10 : Math.round(value);
}

/**
 * The company's daily production, per commodity: every PRODUCING well's card
 * value, added up.
 *
 * Not filtered by the commodity or lease on screen — this is what the operation
 * makes, not what the current view draws. Injection wells are excluded: an SWD
 * well's number is what it TOOK, and adding disposal to production would count
 * the same barrels twice.
 */
export function companyTotals(nodes: FacilityNode[]): Record<Substance, number> {
  const total: Record<Substance, number> = { oil: 0, gas: 0, water: 0 };
  for (const node of nodes) {
    if (node.kind !== "well") continue;
    for (const substance of ["oil", "gas", "water"] as Substance[]) {
      total[substance] += roundRate(nodeRate(node, substance) ?? 0);
    }
  }
  return total;
}

/** Unit for a substance's rate. Gas is mcf/d; oil and water are bbl/d. */
function flowUnitOf(substance: Substance): string {
  return substance === "gas" ? "mcf/d" : "bbl/d";
}

/**
 * Total allocated inflow to a node along the drawn edges, or null when nothing
 * upstream carries a number. This is the sum of what the map itself shows
 * arriving, not an independently measured volume.
 */
export function inboundTotal(edges: FacilityEdge[], nodeId: string): number | null {
  let sum = 0;
  let seen = false;
  for (const e of edges) {
    if (e.to !== nodeId || e.flow == null) continue;
    sum += e.flow;
    seen = true;
  }
  return seen ? sum : null;
}

/** Stage heading for the kinds sitting in one column. */
function stageLabel(kinds: Set<FacilityKind>): string {
  const present = KIND_ORDER.filter((k) => kinds.has(k));
  return present.map((k) => KIND_PLURAL[k]).join(" / ") || "Stage";
}

/**
 * Longest-path ranking: a node sits one column past its deepest feeder. Cycles
 * (possible once operators draw their own `flow_connections`) cost their own
 * back-edge and nothing else — an unresolved node lands in column 0 rather than
 * hanging the layout.
 */
function rankNodes(ids: string[], edges: FacilityEdge[]): Map<string, number> {
  const rank = new Map<string, number>();
  const indeg = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const id of ids) {
    indeg.set(id, 0);
    out.set(id, []);
  }
  for (const e of edges) {
    if (e.from === e.to) continue;
    out.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }

  const queue = ids.filter((id) => indeg.get(id) === 0);
  for (const id of queue) rank.set(id, 0);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    for (const to of out.get(id)!) {
      rank.set(to, Math.max(rank.get(to) ?? 0, (rank.get(id) ?? 0) + 1));
      indeg.set(to, indeg.get(to)! - 1);
      if (indeg.get(to) === 0) queue.push(to);
    }
  }
  for (const id of ids) if (!rank.has(id)) rank.set(id, 0);
  return rank;
}

/**
 * Bottom-left skyline packing: lay boxes of mixed size into a target width,
 * each one at the lowest position it fits, tallest first.
 *
 * Shelf packing (one row of lanes at a time) wasted the map: a station with
 * thirteen feeder wells is one very tall lane, and every small lease lane went
 * BELOW it rather than beside it, so seeing everything meant zooming out past
 * readable while half the canvas sat empty. This fills that space.
 *
 * Pure and deterministic — same boxes, same layout.
 */
function packBoxes(
  boxes: { width: number; height: number }[],
  targetWidth: number,
  gap: number
): { positions: { x: number; y: number }[]; width: number; height: number } {
  // Tallest first: the big lane claims its corner, and the small ones fill in
  // around it instead of queueing underneath.
  const order = boxes
    .map((b, i) => ({ b, i }))
    .sort((p, q) => q.b.height - p.b.height || p.i - q.i);

  const skyline: { x: number; width: number; y: number }[] = [
    { x: 0, width: Math.max(targetWidth, ...boxes.map((b) => b.width + gap)), y: 0 },
  ];
  const positions: { x: number; y: number }[] = new Array(boxes.length);
  let width = 0;
  let height = 0;

  /** The highest skyline point under [x, x + w), or null if it runs off the end. */
  const topUnder = (x: number, w: number): number | null => {
    let y = 0;
    let covered = 0;
    for (const seg of skyline) {
      if (seg.x + seg.width <= x) continue;
      if (seg.x >= x + w) break;
      y = Math.max(y, seg.y);
      covered = Math.min(x + w, seg.x + seg.width) - x;
    }
    return covered >= w ? y : null;
  };

  for (const { b, i } of order) {
    const w = b.width + gap;
    const h = b.height + gap;
    let best: { x: number; y: number } | null = null;
    for (const seg of skyline) {
      if (seg.x + w > targetWidth && seg.x > 0) continue;
      const y = topUnder(seg.x, w);
      if (y == null) continue;
      if (!best || y < best.y || (y === best.y && seg.x < best.x)) {
        best = { x: seg.x, y };
      }
    }
    const at = best ?? { x: 0, y: height };
    positions[i] = at;
    width = Math.max(width, at.x + b.width);
    height = Math.max(height, at.y + b.height);

    // Raise the skyline over the footprint, then merge equal-height neighbours.
    const next: typeof skyline = [];
    for (const seg of skyline) {
      const left = { ...seg, width: Math.min(seg.width, at.x - seg.x) };
      if (left.width > 0) next.push(left);
      const rightX = Math.max(seg.x, at.x + w);
      const rightW = seg.x + seg.width - rightX;
      if (rightW > 0) next.push({ x: rightX, width: rightW, y: seg.y });
    }
    next.push({ x: at.x, width: w, y: at.y + h });
    next.sort((p, q) => p.x - q.x);
    skyline.length = 0;
    for (const seg of next) {
      const last = skyline[skyline.length - 1];
      if (last && last.y === seg.y && last.x + last.width === seg.x) {
        last.width += seg.width;
      } else skyline.push(seg);
    }
  }

  return { positions, width, height };
}

/**
 * Pack the lanes at whatever width leaves the map most readable.
 *
 * The thing to maximize is the ZOOM the map will be read at, which for a
 * fit-to-screen canvas is `min(viewW / W, viewH / H)` — and no single target
 * width optimizes that. `sqrt(area × aspect)`, the estimator this replaces, is a
 * statement about the shape of the content that ignores the screen; on lanes
 * that are wide and short it lands below one lane's width, the floor takes over,
 * and every lease gets its own row with the canvas empty either side.
 *
 * There is no closed form — laying unequal boxes into a strip is NP-hard — but
 * the search is tiny and exact enough. A shelf can only break where a lane ends,
 * so the only widths worth trying are the CUMULATIVE SUMS of the lane widths:
 * O(n) candidates, one pack each. Fifteen lanes is fifteen packs of ~15² simple
 * comparisons — a few thousand operations, well under a millisecond, in a memo
 * that reruns only when the filter changes.
 *
 * Ties go to the narrower canvas, so a map that fits either way is the tighter
 * one rather than an arbitrary one.
 */
function bestPacking(
  boxes: { width: number; height: number }[],
  viewportAspect: number,
  gap: number
): { positions: { x: number; y: number }[]; width: number; height: number } {
  const widest = Math.max(...boxes.map((b) => b.width));
  const total = boxes.reduce((sum, b) => sum + b.width + gap, 0);

  // Every width a shelf could sensibly break at: widest lane, widest two, and so
  // on up to all of them on one row. Sorted widest-first to match the packer's
  // own order, so a candidate corresponds to a row it could actually produce.
  const widths = [...boxes.map((b) => b.width + gap)].sort((a, b) => b - a);
  const candidates = new Set<number>([widest + gap, total]);
  let run = 0;
  for (const w of widths) {
    run += w;
    if (run >= widest + gap) candidates.add(run);
  }

  let best: {
    packed: ReturnType<typeof packBoxes>;
    scale: number;
    width: number;
  } | null = null;
  for (const target of candidates) {
    const packed = packBoxes(boxes, target, gap);
    if (packed.width <= 0 || packed.height <= 0) continue;
    // The fit zoom this layout would be read at, in arbitrary units: the
    // viewport cancels except for its shape, which is all we were given.
    const scale = Math.min(viewportAspect / packed.width, 1 / packed.height);
    if (
      best == null ||
      scale > best.scale + 1e-9 ||
      (Math.abs(scale - best.scale) <= 1e-9 && packed.width < best.width)
    ) {
      best = { packed, scale, width: packed.width };
    }
  }
  return best?.packed ?? packBoxes(boxes, widest + gap, gap);
}

/**
 * Lay one commodity's flow out as stage columns inside per-lease lanes.
 *
 * Scope rules:
 * - Nodes kept are those that handle the commodity plus both ends of every edge
 *   carrying it (so a gatherer, which handles "nothing", still appears when oil
 *   is hauled to it).
 * - With a lease selected, its nodes are joined by whatever they flow into or
 *   out of elsewhere, flagged `external` — a lease whose water leaves for a
 *   shared SWD well must show where the water goes.
 */
/** Lane key for facilities on no lease at all. */
const UNASSIGNED_LANE = "__unassigned__";

export function buildFlowLayout(graph: FacilityGraph, filter: FlowFilter): FlowLayout {
  const { substance, leaseId } = filter;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  // 1. Commodity scope: one stream's edges, or every stream's on the all view.
  const shown = substancesIn(substance);
  const substanceEdges = graph.edges.filter(
    (e) => shown.includes(e.substance) && byId.has(e.from) && byId.has(e.to)
  );
  const wired = new Set<string>();
  for (const e of substanceEdges) {
    wired.add(e.from);
    wired.add(e.to);
  }
  /*
   * Every PRODUCING well is on every commodity's map, wired or not.
   *
   * A well's `substances` are read off what it has REPORTED, and a well that
   * reports no saltwater is not a well that makes none — it is usually a well
   * whose water has not been wired to a meter or a tank yet, which is exactly
   * the well an operator opens the saltwater map to plumb. Hiding it leaves the
   * saltwater view showing only the disposal end and nothing to connect to it.
   * Tanks and meters stay typed by what they hold: an oil tank is never a
   * saltwater card.
   */
  let kept = graph.nodes.filter(
    (n) =>
      wired.has(n.id) ||
      n.kind === "well" ||
      n.substances.some((s) => shown.includes(s))
  );

  // 2. Lease scope: the lease's own nodes plus their direct counterparties.
  const external = new Set<string>();
  if (leaseId != null) {
    const onLease = new Set(
      kept.filter((n) => n.leaseId === leaseId).map((n) => n.id)
    );
    const neighbours = new Set<string>();
    for (const e of substanceEdges) {
      if (onLease.has(e.from) && !onLease.has(e.to)) neighbours.add(e.to);
      if (onLease.has(e.to) && !onLease.has(e.from)) neighbours.add(e.from);
    }
    kept = kept.filter((n) => onLease.has(n.id) || neighbours.has(n.id));
    for (const id of neighbours) external.add(id);
  }

  /*
   * One card per id. A caller that overlays optimistic nodes on the server's can
   * hand the same facility over twice, and the same id twice shares one entry in
   * every position map below — the lane sizes itself to a card that is not where
   * it thinks it is, and the card lands outside the lane.
   */
  const seenIds = new Set<string>();
  kept = kept.filter((n) => !seenIds.has(n.id) && seenIds.add(n.id));

  const keptIds = new Set(kept.map((n) => n.id));
  const edges = substanceEdges.filter((e) => keptIds.has(e.from) && keptIds.has(e.to));

  /*
   * Leases with nothing on them at all, which get a lane of their own.
   *
   * A lease is created before the facilities that sit on it, and until this the
   * map had no way to show one: lanes are built from nodes, so a brand-new lease
   * was invisible everywhere on this page and creating one from its own menu
   * looked like it had failed. An empty lane is where its first tank goes.
   *
   * Only leases with no facilities WHATEVER, not leases whose facilities are all
   * on another commodity — a Roach lane on the oil view with the water tanks
   * hidden would say Roach has no oil equipment when it may have plenty.
   */
  const emptyLeases = graph.territories.filter(
    (t) =>
      t.leaseId != null &&
      t.nodeIds.length === 0 &&
      (filter.leaseId == null || t.leaseId === filter.leaseId)
  );

  if (kept.length === 0 && emptyLeases.length === 0) {
    return {
      substance,
      nodes: [],
      edges: [],
      lanes: [],
      stages: [],
      width: 0,
      height: 0,
    };
  }

  // 3. Stage columns: longest-path rank, then compacted so empty columns never
  //    leave a gap (oil goes well → tank with no meter stage in between).
  const rawRank = rankNodes(
    kept.map((n) => n.id),
    edges
  );
  /*
   * A facility WIRED TO NOTHING still belongs in its own column.
   *
   * Rank comes from the longest path into a node, so anything with no edges
   * ranks 0 — and an unwired tank landed in the WELLS column beside the wells,
   * under a heading that then read "Wells / Tanks". What it is, is enough to
   * place it: a tank belongs in the tanks column whether or not anything feeds
   * it yet, which is exactly the state an operator is in halfway through setting
   * a lease up.
   */
  const onAnEdge = new Set(edges.flatMap((e) => [e.from, e.to]));
  for (const n of kept) {
    if (!onAnEdge.has(n.id)) rawRank.set(n.id, STAGE_RANK[substance][n.kind]);
  }

  const usedRanks = [...new Set([...rawRank.values()])].sort((a, b) => a - b);
  const rankIndex = new Map(usedRanks.map((r, i) => [r, i]));
  const rank = new Map(
    [...rawRank].map(([id, r]) => [id, rankIndex.get(r)!] as const)
  );
  const columnCount = usedRanks.length;

  /*
   * 4. Lanes are CONNECTED FLOWS, not leases.
   *
   * Grouping by lease scattered the wells feeding one meter across the whole
   * canvas — a Hughes meter fed by ten wells on nine leases drew ten lines
   * across everything between them. What the operator is reading is the flow, so
   * the flow is the grouping: everything that reaches everything else sits in
   * one lane, feeders stacked in the column beside what they feed. The lease
   * survives as the lane's NAME (and on each card), which is what it was
   * actually being used for.
   */
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let walk = id;
    while (parent.get(walk) !== root) {
      const next = parent.get(walk)!;
      parent.set(walk, root);
      walk = next;
    }
    return root;
  };
  for (const n of kept) parent.set(n.id, n.id);
  const union = (x: string, y: string) => {
    const a = find(x);
    const b = find(y);
    if (a !== b) parent.set(a, b);
  };
  for (const e of edges) union(e.from, e.to);

  /*
   * A facility WIRED TO NOTHING joins its lease's lane rather than standing on
   * its own. Nothing connects it, so the flow grouping has nothing to say about
   * it, and one card per lane turned the saltwater map — where most producing
   * wells have no water wiring yet — into a field of one-card boxes with the
   * same lease name repeated down the page. The lease is what is left to group
   * it by, so it groups by lease: it lands in the lane the flow ENDING on that
   * lease already owns, or opens that lease's own lane if there is no such flow.
   * Only a facility on no lease is left out, and those gather under Unassigned.
   */
  const linked = new Set<string>();
  for (const e of edges) {
    linked.add(e.from);
    linked.add(e.to);
  }
  const isolated = kept.filter((n) => !linked.has(n.id));
  if (isolated.length > 0) {
    /** Lease → the lane that lease's flows end in (the first and biggest). */
    const laneByLease = new Map<string, string>();
    const components = new Map<string, FacilityNode[]>();
    for (const n of kept) {
      if (!linked.has(n.id)) continue;
      const root = find(n.id);
      (components.get(root) ?? components.set(root, []).get(root)!).push(n);
    }
    const claim = (lease: string | null, root: string) => {
      const key = lease ?? UNASSIGNED_LANE;
      if (!laneByLease.has(key)) laneByLease.set(key, root);
    };
    for (const [root, members] of components) {
      const deepest = Math.max(...members.map((n) => rawRank.get(n.id)!));
      const ends = [
        ...new Set(members.filter((n) => rawRank.get(n.id) === deepest).map((n) => n.leaseId)),
      ];
      // A flow ending on two leases belongs to neither, so it claims neither.
      if (ends.length === 1) claim(ends[0], root);
    }
    for (const n of isolated) {
      const key = n.leaseId ?? UNASSIGNED_LANE;
      const target = laneByLease.get(key);
      if (target) union(n.id, target);
      else laneByLease.set(key, find(n.id));
    }
  }

  const laneOrder: string[] = [];
  const keptByLane = new Map<string, FacilityNode[]>();
  for (const n of kept) {
    const lane = find(n.id);
    const members = keptByLane.get(lane);
    if (members) members.push(n);
    else {
      keptByLane.set(lane, [n]);
      laneOrder.push(lane);
    }
  }

  /*
   * Lane label: the lease of the facility the flow ENDS at — the disposal well
   * the water goes to, the tank the oil lands in. Naming it after the feeders
   * ("Brown + 8 more") named the wrong thing: a station is known by where it
   * delivers, and its feeders are wells from all over.
   */
  const territoryName = new Map<string | null, string>(
    graph.territories.map((t) => [t.leaseId, t.name])
  );
  const territoryRank = new Map<string | null, number>(
    graph.territories.map((t, i) => [t.leaseId, i])
  );
  const laneName = new Map<string, string>();
  const laneLease = new Map<string, string | null | undefined>();
  // The empty leases join here, after the flows, each as its own bare lane.
  for (const t of emptyLeases) {
    const lane = `lease:${t.leaseId}`;
    keptByLane.set(lane, []);
    laneOrder.push(lane);
    laneName.set(lane, t.name);
    laneLease.set(lane, t.leaseId);
  }
  for (const lane of laneOrder) {
    const members = keptByLane.get(lane)!;
    if (members.length === 0) continue; // an empty lease: already named

    // One lease across every card in it, or none: what a card dropped in here
    // would be moved onto (`FlowLane.leaseId`).
    const memberLeases = [...new Set(members.map((n) => n.leaseId))];
    laneLease.set(lane, memberLeases.length === 1 ? memberLeases[0] : undefined);

    const deepest = Math.max(...members.map((n) => rank.get(n.id)!));
    const endLeases = [
      ...new Set(
        members.filter((n) => rank.get(n.id) === deepest).map((n) => n.leaseId)
      ),
    ].sort((a, b) => (territoryRank.get(a) ?? 0) - (territoryRank.get(b) ?? 0));
    const names = endLeases.map((l) => territoryName.get(l) ?? "Unassigned");
    laneName.set(
      lane,
      names.length <= 2 ? names.join(" + ") : `${names[0]} + ${names.length - 1} more`
    );
  }
  // Biggest flows first, so the map opens on the stations that matter.
  laneOrder.sort((a, b) => {
    const size = keptByLane.get(b)!.length - keptByLane.get(a)!.length;
    return size !== 0 ? size : laneName.get(a)!.localeCompare(laneName.get(b)!);
  });

  // 5. Columns are compacted PER LANE: a flow that goes well → tank is two
  //    columns wide even when some other flow has a meter stage between them.
  const laneCol = new Map<string, number>();
  const laneCols = new Map<string, number>();
  for (const lane of laneOrder) {
    const ranks = [
      ...new Set(keptByLane.get(lane)!.map((n) => rank.get(n.id)!)),
    ].sort((a, b) => a - b);
    const index = new Map(ranks.map((r, i) => [r, i]));
    for (const n of keptByLane.get(lane)!) laneCol.set(n.id, index.get(rank.get(n.id)!)!);
    // An empty lease still takes one column's width: it is a card-sized space
    // with a name on it, not a sliver.
    laneCols.set(lane, Math.max(1, ranks.length));
  }

  // 6. Row ORDER inside each (lane, column): the mean row of a card's feeders,
  //    so lines cross as little as the data allows; name breaks ties.
  const rowOf = new Map<string, number>();
  const feeders = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const e of edges) {
    (feeders.get(e.to) ?? feeders.set(e.to, []).get(e.to)!).push(e.from);
    (children.get(e.from) ?? children.set(e.from, []).get(e.from)!).push(e.to);
  }
  for (let col = 0; col < columnCount; col++) {
    for (const lane of laneOrder) {
      const group = keptByLane
        .get(lane)!
        .filter((n) => rank.get(n.id) === col)
        .map((n) => {
          const parents = (feeders.get(n.id) ?? [])
            .map((p) => rowOf.get(p))
            .filter((r): r is number => r != null);
          const bary =
            parents.length > 0
              ? parents.reduce((a, b) => a + b, 0) / parents.length
              : Number.POSITIVE_INFINITY;
          return { node: n, bary };
        })
        .sort((a, b) =>
          a.bary !== b.bary
            ? a.bary - b.bary
            : a.node.name.localeCompare(b.node.name) || a.node.id.localeCompare(b.node.id)
        );
      group.forEach((g, i) => rowOf.set(g.node.id, i));
    }
  }

  /*
   * 7. Row POSITION: a card sits level with the middle of what it connects to.
   *
   * Ten wells feeding one meter put the meter halfway down the ten, and one tank
   * feeding two SWD wells puts the pair centred on the tank. Passes run
   * downstream (centre on feeders) then upstream (centre on what it feeds), and
   * each column is packed in row order afterwards so cards keep their order and
   * never overlap; the packed block is then shifted back onto the average it
   * wanted, which is what does the centring.
   */
  const PITCH = FLOW_NODE.height + ROW_GAP;
  const yOf = new Map<string, number>();
  const laneHeightRaw = new Map<string, number>();

  for (const lane of laneOrder) {
    const members = keptByLane.get(lane)!;
    if (members.length === 0) {
      laneHeightRaw.set(lane, FLOW_NODE.height);
      continue;
    }
    const cols = laneCols.get(lane) ?? 1;
    const byCol: FacilityNode[][] = Array.from({ length: cols }, () => []);
    for (const n of members) byCol[laneCol.get(n.id)!].push(n);
    for (const column of byCol) {
      column.sort((a, b) => rowOf.get(a.id)! - rowOf.get(b.id)!);
    }
    // Start from the plain stacking, then refine.
    for (const column of byCol) {
      column.forEach((n, i) => yOf.set(n.id, i * PITCH));
    }

    const centre = (id: string) => yOf.get(id)! + FLOW_NODE.height / 2;
    /** Place a column at `desired` centres, keeping order, gaps, and the mean. */
    const settle = (column: FacilityNode[], desired: (number | null)[]) => {
      const known = desired.filter((d): d is number => d != null);
      if (known.length === 0) return;
      const seed = known.reduce((a, b) => a + b, 0) / known.length;
      const wanted = desired.map((d) => (d ?? seed) - FLOW_NODE.height / 2);
      const placed: number[] = [];
      for (let i = 0; i < column.length; i++) {
        placed.push(i === 0 ? wanted[i] : Math.max(wanted[i], placed[i - 1] + PITCH));
      }
      // Shift the packed block back onto the average position it asked for.
      const drift =
        wanted.reduce((sum, w, i) => sum + (w - placed[i]), 0) / column.length;
      column.forEach((n, i) => yOf.set(n.id, placed[i] + drift));
    };

    for (let pass = 0; pass < 2; pass++) {
      for (let c = 1; c < cols; c++) {
        settle(
          byCol[c],
          byCol[c].map((n) => {
            const ups = (feeders.get(n.id) ?? []).filter((p) => yOf.has(p));
            return ups.length
              ? ups.reduce((sum, p) => sum + centre(p), 0) / ups.length
              : null;
          })
        );
      }
      for (let c = cols - 2; c >= 0; c--) {
        settle(
          byCol[c],
          byCol[c].map((n) => {
            const downs = (children.get(n.id) ?? []).filter((d) => yOf.has(d));
            return downs.length
              ? downs.reduce((sum, d) => sum + centre(d), 0) / downs.length
              : null;
          })
        );
      }
    }

    const tops = members.map((n) => yOf.get(n.id)!);
    const top = Math.min(...tops);
    for (const n of members) yOf.set(n.id, yOf.get(n.id)! - top);
    laneHeightRaw.set(
      lane,
      Math.max(...members.map((n) => yOf.get(n.id)!)) + FLOW_NODE.height
    );
  }

  // 8. Lane boxes, sized to their own contents, shelf-packed toward
  //    TARGET_ASPECT. A single lane skips the packing and keeps a stage band.
  const boxes = laneOrder.map((lane) => ({
    lane,
    width:
      2 * LANE_PAD_X +
      (laneCols.get(lane) ?? 1) * FLOW_NODE.width +
      Math.max(0, (laneCols.get(lane) ?? 1) - 1) * COL_GAP,
    height: LANE_HEADER + 2 * LANE_PAD_Y + (laneHeightRaw.get(lane) ?? 0),
  }));

  const single = boxes.length === 1;
  const widest = Math.max(...boxes.map((b) => b.width));
  const packed = single
    ? packBoxes(boxes, widest + LANE_GAP, LANE_GAP)
    : bestPacking(boxes, filter.viewportAspect ?? TARGET_ASPECT, LANE_GAP);
  const originX = MARGIN;
  const originY = MARGIN + (single ? STAGE_BAND : 0);

  const lanes: FlowLane[] = [];
  const nodes: FlowNode[] = [];

  boxes.forEach((box, i) => {
    const laneX = originX + packed.positions[i].x;
    const laneY = originY + packed.positions[i].y;

    for (const n of keptByLane.get(box.lane)!) {
      nodes.push({
        node: n,
        x: laneX + LANE_PAD_X + laneCol.get(n.id)! * (FLOW_NODE.width + COL_GAP),
        y: laneY + LANE_HEADER + LANE_PAD_Y + yOf.get(n.id)!,
        rank: rank.get(n.id)!,
        laneId: box.lane,
        external: external.has(n.id),
      });
    }

    lanes.push({
      id: box.lane,
      name: laneName.get(box.lane) ?? "Unassigned",
      leaseId: laneLease.get(box.lane),
      x: laneX,
      y: laneY,
      width: box.width,
      height: box.height,
      nodeIds: keptByLane.get(box.lane)!.map((n) => n.id),
    });
  });

  // 9. Stage headings, from the kinds actually standing in each column — single
  //    lane only (see FlowStage).
  const stages: FlowStage[] = [];
  if (single && kept.length > 0) {
    const kindsByCol = new Map<number, Set<FacilityKind>>();
    for (const n of kept) {
      const col = laneCol.get(n.id)!;
      (kindsByCol.get(col) ?? kindsByCol.set(col, new Set()).get(col)!).add(n.kind);
    }
    for (let col = 0; col < (laneCols.get(laneOrder[0]) ?? 0); col++) {
      stages.push({
        rank: col,
        label: stageLabel(kindsByCol.get(col) ?? new Set()),
        x: MARGIN + LANE_PAD_X + col * (FLOW_NODE.width + COL_GAP),
        y: MARGIN,
        width: FLOW_NODE.width,
      });
    }
  }

  return {
    substance,
    nodes,
    edges,
    lanes,
    stages,
    width: originX + packed.width + MARGIN,
    height: originY + packed.height + MARGIN,
  };
}

// --- Trunk routing ----------------------------------------------------------

/** Distance the junction stands off the left edge of the cards it feeds. */
const TRUNK_GAP = 46;
/** Feeders below this stay as their own curves — a junction for two is noise. */
const MIN_TRUNK_SOURCES = 3;
/** Room a junction needs between the feeders' right edge and the target's left. */
const TRUNK_CLEARANCE = 64;

/**
 * Many feeders converging on one facility, drawn as one stream: every well
 * curves into a shared junction just upstream of the tank (or meter), and the
 * junction runs on as a single line. Sixteen wells on two tanks is 32 crossing
 * curves drawn edge by edge, which is unreadable — and wrong about the
 * operation, where those wells really do share a header.
 *
 * The merge is a point, not a bus bar: the feeders stay curves that gather like
 * a river delta rather than snapping to right angles.
 *
 * Targets bundle together when they sit in the same lane and column AND take the
 * same set of feeders, so a pair of tanks on one battery share a junction that
 * splits at the end instead of each growing its own.
 */
export interface FlowBundle {
  id: string;
  substance: Substance;
  /** Where the feeders meet — the single point the streams merge at. */
  junction: { x: number; y: number };
  /** One per feeder: its right port, which curves into the junction. */
  stubs: { nodeId: string; x: number; y: number }[];
  /** One per fed facility: its left port, which the junction curves into. */
  exits: { nodeId: string; x: number; y: number; flow: number | null }[];
  edgeIds: string[];
}

export interface FlowRouting {
  bundles: FlowBundle[];
  /** Edges drawn as their own curve (everything not in a bundle). */
  direct: FacilityEdge[];
}

/**
 * Split a laid-out map's edges into trunk bundles + the curves left over. Pure
 * geometry over `buildFlowLayout`'s output, so it tests without a canvas.
 */
export function routeFlowEdges(layout: FlowLayout): FlowRouting {
  const placed = new Map(layout.nodes.map((n) => [n.node.id, n]));
  const leftPort = (id: string) => {
    const p = placed.get(id)!;
    return { x: p.x, y: p.y + FLOW_NODE.height / 2 };
  };
  const rightPort = (id: string) => {
    const p = placed.get(id)!;
    return { x: p.x + FLOW_NODE.width, y: p.y + FLOW_NODE.height / 2 };
  };

  // Inbound edges per target AND stream, then targets grouped by (lane, column,
  // stream, feeder set): the tanks on one battery take the same wells and so
  // share one trunk. Per stream because the all view draws every stream at
  // once, and a trunk is one stream's merge, in that stream's colour.
  const inbound = new Map<string, FacilityEdge[]>();
  const inboundKey = (targetId: string, substance: Substance) => `${targetId}|${substance}`;
  for (const e of layout.edges) {
    if (!placed.has(e.from) || !placed.has(e.to)) continue;
    const k = inboundKey(e.to, e.substance);
    (inbound.get(k) ?? inbound.set(k, []).get(k)!).push(e);
  }

  const groups = new Map<string, string[]>();
  for (const [k, edges] of inbound) {
    const sources = [...new Set(edges.map((e) => e.from))].sort();
    if (sources.length < MIN_TRUNK_SOURCES) continue;
    const targetId = edges[0].to;
    const t = placed.get(targetId)!;
    const key = `${t.laneId ?? "-"}|${t.x}|${edges[0].substance}|${sources.join(",")}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(k);
  }

  const bundles: FlowBundle[] = [];
  const bundled = new Set<string>();

  for (const [key, inboundKeys] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const keys = [...inboundKeys].sort();
    const edges = keys.flatMap((k) => inbound.get(k)!);
    const ids = [...new Set(edges.map((e) => e.to))];
    const substance = edges[0].substance;
    const sources = [...new Set(edges.map((e) => e.from))].sort();

    const maxSourceRight = Math.max(...sources.map((id) => rightPort(id).x));
    const minTargetLeft = Math.min(...ids.map((id) => leftPort(id).x));
    // Not enough room to stand a trunk between the two columns (a feeder that
    // sits level with or right of what it feeds) — leave those as curves.
    if (minTargetLeft - maxSourceRight < TRUNK_CLEARANCE) continue;

    const stubs = sources.map((id) => ({ nodeId: id, ...rightPort(id) }));
    const exits = ids.map((id) => ({
      nodeId: id,
      ...leftPort(id),
      flow: inboundTotal(inbound.get(inboundKey(id, substance))!, id),
    }));
    // The junction sits just upstream of what it feeds, level with the middle of
    // those cards, so the single stream runs into them nearly straight.
    const junction = {
      x: minTargetLeft - TRUNK_GAP,
      y: exits.reduce((sum, e) => sum + e.y, 0) / exits.length,
    };

    bundles.push({
      id: `trunk:${key}`,
      substance,
      junction,
      stubs,
      exits,
      edgeIds: edges.map((e) => e.id),
    });
    for (const e of edges) bundled.add(e.id);
  }

  return {
    bundles,
    direct: layout.edges.filter((e) => !bundled.has(e.id)),
  };
}


/**
 * The edge whose drawn line passes closest to a canvas point, within `radius`,
 * or null.
 *
 * Measured against the straight segment between the two cards' anchors rather
 * than the bezier actually stroked: the curve never leaves the neighbourhood of
 * that segment, and hit-testing what the eye reads as "the line between these
 * two boxes" is the point. Pure, so the threshold can be tested without a
 * canvas.
 */
export function edgeAtPoint(
  layout: FlowLayout,
  edges: FacilityEdge[],
  point: { x: number; y: number },
  radius = 28
): FacilityEdge | null {
  const at = new Map(layout.nodes.map((n) => [n.node.id, n]));
  let best: { edge: FacilityEdge; d: number } | null = null;
  for (const e of edges) {
    const a = at.get(e.from);
    const b = at.get(e.to);
    if (!a || !b) continue;
    const p1 = {
      x: a.x + FLOW_NODE.width,
      y: a.y + FLOW_NODE.height / 2,
    };
    const p2 = { x: b.x, y: b.y + FLOW_NODE.height / 2 };
    const d = distanceToSegment(point, p1, p2);
    if (d <= radius && (best == null || d < best.d)) best = { edge: e, d };
  }
  return best?.edge ?? null;
}

/** Shortest distance from `p` to the segment `a`–`b`. */
function distanceToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  // A zero-length segment is a point; fall back to the point distance rather
  // than dividing by zero into NaN, which compares false against every radius.
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  const cx = a.x + t * vx;
  const cy = a.y + t * vy;
  return Math.hypot(p.x - cx, p.y - cy);
}


/**
 * Keep the map STILL: the page is packed once, when it loads (or the filter
 * changes), and every rebuild after that only SCOOCHES.
 *
 * `buildFlowLayout` is a pure function of the graph, so adding one facility
 * re-ranks, re-lanes and re-packs everything, and the operator who dropped a
 * meter into one lease watches another lease jump across the page. Correct, and
 * unusable. So a rebuild after the first is read as an answer about what is NEW,
 * and everything already on screen keeps its place:
 *
 * - A lane stays where it was. A lane is a connected flow, and its id is just
 *   whichever card union-find happened to pick as root, so lanes are matched by
 *   the cards they share (then by id, then by lease — an empty lease's lane is
 *   the same lane once its first card arrives).
 * - A lane that GROWS pushes the lanes to its right, or below it, out of its way
 *   by exactly as much as it needs; they push theirs in turn.
 * - A lane that is GONE (merged into another, or emptied) leaves a hole, and
 *   the lanes beside it on its row slide left into it.
 * - A NEW lane takes the free spot that grows the canvas least.
 * - Inside a lane, cards keep their places, and a new card goes under the last
 *   one in its column. Unless the rebuild moved an existing card to another
 *   COLUMN — wiring a tank into an SWD well the meter already fed pushes that
 *   well one column right — in which case the lane's own cards follow the
 *   rebuild, because the column headings do. The lane itself still stays put.
 *
 * The caller drops the previous layout when the FILTER changes: a different
 * substance or lease is a different map, and that is a fresh pack.
 *
 * A single-lane map reserves a band above the lane for the stage headings
 * ("WELLS", "TANKS") and a multi-lane map has none. When the band APPEARS the
 * one lane moves to the rebuild's corner below it, or "WELLS" prints over the
 * lease name. When it goes, the old lane simply keeps its spot.
 */
export function stabilizeLayout(
  prev: FlowLayout | null,
  next: FlowLayout
): FlowLayout {
  if (!prev) return next;
  if (next.lanes.length === 0) return next;

  // --- 1. Which lane on screen each rebuilt lane IS ------------------------
  const prevLaneById = new Map(prev.lanes.map((l) => [l.id, l]));
  const prevLaneOfNode = new Map(prev.nodes.map((n) => [n.node.id, n.laneId]));
  const match = new Map<string, FlowLane>(); // next lane id -> prev lane
  const taken = new Set<string>();
  const claim = (nextId: string, prevId: string) => {
    if (match.has(nextId) || taken.has(prevId)) return;
    match.set(nextId, prevLaneById.get(prevId)!);
    taken.add(prevId);
  };

  const shared: { next: string; prev: string; count: number }[] = [];
  for (const l of next.lanes) {
    const counts = new Map<string, number>();
    for (const id of l.nodeIds) {
      const was = prevLaneOfNode.get(id);
      if (was != null && prevLaneById.has(was)) counts.set(was, (counts.get(was) ?? 0) + 1);
    }
    for (const [p, count] of counts) shared.push({ next: l.id, prev: p, count });
  }
  // Most cards in common first: a merged lane is the one it took most from.
  shared.sort(
    (a, b) =>
      b.count - a.count || a.next.localeCompare(b.next) || a.prev.localeCompare(b.prev)
  );
  for (const s of shared) claim(s.next, s.prev);
  for (const l of next.lanes) if (prevLaneById.has(l.id)) claim(l.id, l.id);
  for (const l of next.lanes) {
    if (match.has(l.id) || l.leaseId === undefined) continue;
    const same = prev.lanes.find((p) => !taken.has(p.id) && p.leaseId === l.leaseId);
    if (same) claim(l.id, same.id);
  }

  // --- 2. Each lane's cards, as offsets from its corner ----------------------
  const prevNodeById = new Map(prev.nodes.map((n) => [n.node.id, n]));
  const nodesByLane = new Map<string, FlowNode[]>();
  for (const n of next.nodes) {
    (nodesByLane.get(n.laneId) ?? nodesByLane.set(n.laneId, []).get(n.laneId)!).push(n);
  }

  const offsets = new Map<string, { x: number; y: number }>();
  const size = new Map<string, { width: number; height: number }>();
  for (const l of next.lanes) {
    const was = match.get(l.id);
    const cards = nodesByLane.get(l.id) ?? [];
    const fresh = (n: FlowNode) => ({ x: n.x - l.x, y: n.y - l.y });
    if (!was) {
      for (const n of cards) offsets.set(n.node.id, fresh(n));
      size.set(l.id, { width: l.width, height: l.height });
      continue;
    }

    const held = (n: FlowNode) => {
      const p = prevNodeById.get(n.node.id);
      return p && p.laneId === was.id ? p : null;
    };
    // Every card that was already here still stands in the column it stood in.
    const columnsHold = cards.every((n) => {
      const p = held(n);
      return !p || p.x - was.x === n.x - l.x;
    });

    if (!columnsHold) {
      for (const n of cards) offsets.set(n.node.id, fresh(n));
    } else {
      const bottomOfColumn = new Map<number, number>();
      const stand = (id: string, at: { x: number; y: number }) => {
        offsets.set(id, at);
        bottomOfColumn.set(
          at.x,
          Math.max(bottomOfColumn.get(at.x) ?? -Infinity, at.y + FLOW_NODE.height)
        );
      };
      for (const n of cards) {
        const p = held(n);
        if (p) stand(n.node.id, { x: p.x - was.x, y: p.y - was.y });
      }
      // New cards in the order the rebuild stacked them, each under the last
      // card in its column (or at the top of an empty one).
      const arrivals = cards.filter((n) => !held(n)).sort((a, b) => a.y - b.y || a.x - b.x);
      for (const n of arrivals) {
        const x = n.x - l.x;
        const bottom = bottomOfColumn.get(x);
        stand(n.node.id, {
          x,
          y: bottom == null ? LANE_HEADER + LANE_PAD_Y : bottom + ROW_GAP,
        });
      }
    }

    // Grown to hold its cards; never shrunk, so nothing ever closes up on a
    // lane that lost a card.
    let right = Math.max(was.width, l.width);
    let bottom = Math.max(was.height, columnsHold ? 0 : l.height);
    for (const n of cards) {
      const o = offsets.get(n.node.id)!;
      right = Math.max(right, o.x + FLOW_NODE.width + LANE_PAD_X);
      bottom = Math.max(bottom, o.y + FLOW_NODE.height + LANE_PAD_Y);
    }
    size.set(l.id, { width: right, height: bottom });
  }

  // --- 3. Where each lane stands --------------------------------------------
  type Box = { id: string; x: number; y: number; width: number; height: number };
  const boxes = new Map<string, Box>();
  const bandAppeared = next.stages.length > 0 && prev.stages.length === 0;
  for (const l of next.lanes) {
    const was = match.get(l.id);
    if (!was) continue;
    const anchor = bandAppeared ? l : was;
    boxes.set(l.id, { id: l.id, x: anchor.x, y: anchor.y, ...size.get(l.id)! });
  }
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width + LANE_GAP &&
    b.x < a.x + a.width + LANE_GAP &&
    a.y < b.y + b.height + LANE_GAP &&
    b.y < a.y + a.height + LANE_GAP;
  const rowsMeet = (a: { y: number; height: number }, b: { y: number; height: number }) =>
    a.y < b.y + b.height && b.y < a.y + a.height;

  // 3a. Close the holes: lanes on a vanished lane's row slide left into it.
  const gone = prev.lanes
    .filter((p) => !taken.has(p.id))
    .sort((a, b) => b.x - a.x);
  for (const hole of gone) {
    const movers = [...boxes.values()]
      .filter((b) => {
        const was = match.get(b.id)!;
        return was.x >= hole.x + hole.width && rowsMeet(was, hole);
      })
      .sort((a, b) => a.x - b.x);
    for (const m of movers) {
      let shift = hole.width + LANE_GAP;
      for (const o of boxes.values()) {
        if (o === m || !rowsMeet(o, m) || o.x + o.width > m.x) continue;
        shift = Math.min(shift, m.x - (o.x + o.width + LANE_GAP));
      }
      shift = Math.min(shift, m.x - MARGIN);
      if (shift > 0) m.x -= shift;
    }
  }

  // 3b. Make room for lanes that grew: whoever stood right of (or below) the
  //     other gives way, by the smaller of the two pushes that would clear it.
  const held = [...boxes.values()].sort((a, b) => a.y - b.y || a.x - b.x);
  for (let pass = 0, moved = true; moved && pass < held.length * held.length + 1; pass++) {
    moved = false;
    for (let i = 0; i < held.length; i++) {
      for (let j = 0; j < held.length; j++) {
        if (i === j) continue;
        const a = held[i];
        const b = held[j];
        if (!overlaps(a, b)) continue;
        // Where each stood before decides who gives way to whom.
        const wasA = match.get(a.id)!;
        const wasB = match.get(b.id)!;
        const rightOf = wasB.x >= wasA.x + wasA.width;
        const below = wasB.y >= wasA.y + wasA.height;
        if (!rightOf && !below) continue; // b is not the one that gives way
        const dx = rightOf ? a.x + a.width + LANE_GAP - b.x : Infinity;
        const dy = below ? a.y + a.height + LANE_GAP - b.y : Infinity;
        if (dx <= dy) b.x += dx;
        else b.y += dy;
        moved = true;
      }
    }
  }

  // 3c. New lanes, biggest first, each in the free spot that grows the canvas
  //     least; ties go to the higher, then the further left.
  const arrivals = next.lanes
    .filter((l) => !match.has(l.id))
    .sort((a, b) => b.height - a.height || b.width - a.width || a.id.localeCompare(b.id));
  for (const l of arrivals) {
    const { width, height } = size.get(l.id)!;
    const placed = [...boxes.values()];
    const extent = (extra?: Box) => {
      const all = extra ? [...placed, extra] : placed;
      return {
        right: Math.max(0, ...all.map((b) => b.x + b.width)),
        bottom: Math.max(0, ...all.map((b) => b.y + b.height)),
      };
    };
    const spots = [
      { x: MARGIN, y: MARGIN },
      ...placed.flatMap((b) => [
        { x: b.x + b.width + LANE_GAP, y: b.y },
        { x: b.x, y: b.y + b.height + LANE_GAP },
        { x: MARGIN, y: b.y + b.height + LANE_GAP },
      ]),
    ];
    let best: { box: Box; area: number } | null = null;
    for (const s of spots) {
      const box = { id: l.id, x: s.x, y: s.y, width, height };
      if (placed.some((p) => overlaps(p, box))) continue;
      const e = extent(box);
      const area = e.right * e.bottom;
      if (
        !best ||
        area < best.area ||
        (area === best.area && (box.y < best.box.y || (box.y === best.box.y && box.x < best.box.x)))
      ) {
        best = { box, area };
      }
    }
    // Below everything always fits.
    boxes.set(l.id, best?.box ?? { id: l.id, x: MARGIN, y: extent().bottom + LANE_GAP, width, height });
  }

  // --- 4. Assemble -----------------------------------------------------------
  const lanes = next.lanes.map((l) => {
    const b = boxes.get(l.id)!;
    return { ...l, x: b.x, y: b.y, width: b.width, height: b.height };
  });
  const laneAt = new Map(lanes.map((l) => [l.id, l]));
  const nodes = next.nodes.map((n) => {
    const lane = laneAt.get(n.laneId);
    const o = offsets.get(n.node.id);
    if (!lane || !o) return n;
    // The NODE data is the new one (rates, names, flags move on); only where
    // it sits is inherited.
    return { ...n, x: lane.x + o.x, y: lane.y + o.y };
  });

  const right = Math.max(
    ...lanes.map((l) => l.x + l.width),
    ...nodes.map((n) => n.x + FLOW_NODE.width)
  );
  const bottom = Math.max(
    ...lanes.map((l) => l.y + l.height),
    ...nodes.map((n) => n.y + FLOW_NODE.height)
  );
  return {
    ...next,
    nodes,
    lanes,
    width: Math.max(next.stages.length > 0 ? next.width : 0, right + MARGIN),
    height: Math.max(next.stages.length > 0 ? next.height : 0, bottom + MARGIN),
  };
}

/**
 * The same layout with one card renamed: a provisional card the server has now
 * made real keeps the spot it was drawn in, rather than counting as a new card.
 */
export function renameFlowNode(layout: FlowLayout, from: string, to: string): FlowLayout {
  if (!layout.nodes.some((n) => n.node.id === from)) return layout;
  return {
    ...layout,
    nodes: layout.nodes.map((n) =>
      n.node.id === from ? { ...n, node: { ...n.node, id: to } } : n
    ),
    lanes: layout.lanes.map((l) => ({
      ...l,
      nodeIds: l.nodeIds.map((id) => (id === from ? to : id)),
    })),
  };
}
