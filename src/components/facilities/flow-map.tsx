"use client";

/**
 * Facilities flow map (`/facilities`) — the operation drawn the way a workflow
 * or email-sequence builder draws one: a dotted-grid canvas, one commodity's
 * path running left to right through stage columns, per-lease lanes, and
 * animated flowlines between the cards.
 *
 * Two controls, upper left: which commodity is on screen, and which lease. Oil
 * runs producing wells → tanks; gas runs wells → meters; water runs wells →
 * meters → tanks → SWD wells; "All", the first and default view, draws the
 * three together, each line in its own colour. All of it comes from the same wiring the rest of
 * the app allocates on (`buildFacilityGraph`), so nothing here is a second
 * source of truth — the arrangement is this page's, the numbers are not.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
// landing: sonner is not installed; the one toast here follows a failed write, which never happens on fixture data.
const toast = { error: (msg: string) => console.error(msg) };
import { cn } from "@/lib/utils";
import {
  MinusIcon,
  PlusIcon,
  MaximizeIcon,
  RefreshCwIcon,
  Share2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spokes } from "@/components/ui/spokes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageContextSlice } from "@/lib/ai/use-ai-context";
import { buildRowListSlice } from "@/lib/ai/context-slices";
import type {
  FacilityEdge,
  FacilityGraph,
  FacilityNode,
  FlowView,
  Substance,
} from "@/lib/facilities/graph";
import {
  buildFlowLayout,
  facilityReadout,
  nodeRate,
  routeFlowEdges,
  FLOW_NODE,
  edgeAtPoint,
  renameFlowNode,
  stabilizeLayout,
  type FlowLayout,
  LANE_HEADER,
  type ReadoutSource,
} from "@/lib/facilities/flow-layout";
import { useCan } from "@/components/auth/permissions-context";
import {
  FacilityCreateMenu,
  type Draft,
  type FacilityCatalog,
} from "@/components/facilities/facility-create-menu";
import { FacilityConnectDialog } from "@/components/facilities/facility-connect-dialog";
import { FacilitySearch } from "@/components/facilities/facility-search";
// The palette strip is NOT on this page. The canvas still understands its drag
// payload, so a drop source elsewhere would still splice.
import { PALETTE_MIME } from "@/components/facilities/facility-palette";
import type { FlowNodeType } from "@/lib/flow/types";
import {
  FacilityDetailModal,
  type FacilityRows,
} from "@/components/facilities/facility-detail-modal";
import { flowType, undoConnection } from "@/lib/facilities/wiring";
import { useFacilityWrites } from "@/components/facilities/facility-writes";
import {
  FLOW_VIEWS,
  NEUTRAL_COLOR,
  SUBSTANCE_COLOR,
  SUBSTANCE_LABEL,
  VIEW_LABEL,
  cardStream,
  flowUnit,
  rateText,
  roundRate,
  totalText,
} from "@/components/facilities/substances";
import { FlowMapNode } from "@/components/facilities/flow-map-node";

const SUBSTANCES: Substance[] = ["oil", "gas", "water"];
const MIN_K = 0.25;
const MAX_K = 1.8;
const FIT_PAD = 88;
const GRID = 20; // dot pitch — fixed to the screen, not the canvas
/** How far a pointer must travel on a card before it is a wire, not a click. */
const WIRE_THRESHOLD = 5;
/** Hit radius of an "insert here" chip sitting on a flowline, canvas px. */
const CHIP_HIT = 22;

/**
 * The zoom steps the +/- buttons walk. Fixed stops, not a multiplier applied to
 * wherever the wheel left off, so the buttons always land on round percentages.
 */
const ZOOM_STEPS = [0.25, 0.4, 0.5, 0.75, 1, 1.25, 1.5, 1.8];

/** The next stop above (dir 1) or below (dir -1) the current scale. */
function stepZoom(k: number, dir: 1 | -1): number {
  const EPS = 0.001;
  if (dir === 1) return ZOOM_STEPS.find((s) => s > k + EPS) ?? ZOOM_STEPS.at(-1)!;
  return [...ZOOM_STEPS].reverse().find((s) => s < k - EPS) ?? ZOOM_STEPS[0];
}

const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface Transform {
  x: number;
  y: number;
  k: number;
}

/**
 * Flowline from A's right port to B's left port: a horizontal-tangent bezier,
 * the workflow-canvas shape. Bezier rather than an elbow because a lane grid
 * puts some targets left of their source (a lease feeding a shared SWD well in
 * an earlier lane), where an elbow doubles back through its own card.
 */
function curve(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const bow = dx >= 0 ? Math.max(40, dx * 0.5) : Math.max(90, -dx * 0.45);
  return `M ${from.x} ${from.y} C ${from.x + bow} ${from.y}, ${to.x - bow} ${to.y}, ${to.x} ${to.y}`;
}

/** Card-to-card flowline: right port of A into left port of B. */
function connector(
  a: { x: number; y: number },
  b: { x: number; y: number }
): string {
  return curve(
    { x: a.x + FLOW_NODE.width, y: a.y + FLOW_NODE.height / 2 },
    { x: b.x, y: b.y + FLOW_NODE.height / 2 }
  );
}

/** A card in flight: which one, how far it has been carried, what it is over. */
/** A wire pulled from a port: which card, which end, and where the pointer is. */
interface Pull {
  fromId: string;
  side: "in" | "out";
  /** Pointer in canvas coordinates. */
  x: number;
  y: number;
  overNodeId: string | null;
}

interface Wire {
  fromId: string;
  /** Offset from the card's laid-out position, canvas px. */
  dx: number;
  dy: number;
  overNodeId: string | null;
  overEdgeId: string | null;
  /** A lease lane the card is being carried into, when it is not over either. */
  overLaneId: string | null;
}

/**
 * The point a flowline passes through halfway along. Both control points of the
 * connector are horizontal, so the curve's t=0.5 is just the average of the two
 * ports — the chip therefore sits ON the line, not near it.
 */
function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (a.x + FLOW_NODE.width + b.x) / 2,
    y: (a.y + b.y) / 2 + FLOW_NODE.height / 2,
  };
}

/** A palette kind → the create form that makes one, given the view on screen. */
function draftForKind(kind: string, view: FlowView): Draft | null {
  if (kind === "well") return "producing-well";
  if (kind === "injection") return "disposal-well";
  /* The saltwater stream holds both tank services, so a tank dropped on it
     defaults to the production side — the lease-battery tank an operator draws
     far more often. Its service is a field in the form that opens, so the
     other case is one click away. On the all view, and on oil, it is an oil
     tank for the same reason: the form's service field is where to say
     otherwise. */
  if (kind === "tank")
    return view === "water" ? "water-tank-production" : "oil-tank";
  // No water meters on this map: they are wiring behind the SWD well's card.
  if (kind === "meter") return view === "water" ? null : "gas-meter";
  return null;
}

/**
 * The stream a connection drawn on the all view carries: whichever end is
 * typed by what it holds decides (a tank by its product, a meter by what it
 * measures, an SWD well is water), the fed end first. Two untyped ends (a well
 * into a haul-off) default to oil.
 */
function streamBetween(from: FacilityNode, to: FacilityNode): Substance {
  const typed = (n: FacilityNode): Substance | null =>
    n.kind === "tank" || n.kind === "meter" || n.kind === "injection"
      ? n.substances[0] ?? null
      : null;
  return typed(to) ?? typed(from) ?? "oil";
}

/** A well's three rates for the all view, in stream order, blanks left out. */
function wellRates(node: FacilityNode): { substance: Substance; value: number }[] {
  const out: { substance: Substance; value: number }[] = [];
  for (const substance of SUBSTANCES) {
    const value = nodeRate(node, substance);
    if (value != null) out.push({ substance, value });
  }
  return out;
}

/** The dot beside a view's name: a stream's colour, or all three for "All". */
function ViewDot({ view }: { view: FlowView }) {
  const oil = SUBSTANCE_COLOR.oil;
  const gas = SUBSTANCE_COLOR.gas;
  const water = SUBSTANCE_COLOR.water;
  return (
    <span
      className="size-2 rounded-full"
      style={
        view === "all"
          ? { background: `conic-gradient(${oil} 0 120deg, ${gas} 120deg 240deg, ${water} 240deg 360deg)` }
          : { backgroundColor: SUBSTANCE_COLOR[view] }
      }
    />
  );
}

/** An edge's id, the way the graph names it (`buildFacilityGraph`). */
function edgeKey(from: string, to: string, substance: Substance): string {
  return `${from}->${to}:${substance}`;
}

/** The optimistic overlay: cards and edges the server has not confirmed yet. */
type Ghost = {
  nodes: FacilityNode[];
  edges: FacilityEdge[];
  /** Edges the map should stop drawing (a splice replaces one). */
  removed: string[];
  /** Splice edges, written in a second trip after their card is confirmed. */
  splicing: string[];
  /** Cards the server has confirmed while edges drawn for them still stand. */
  settled: string[];
};

/** The overlay with a provisional card renamed to the id the server gave it. */
function renameGhost(g: Ghost, from: string, real: FacilityNode): Ghost {
  const swap = (id: string) => (id === from ? real.id : id);
  return {
    nodes: g.nodes.map((n) =>
      n.id === from ? { ...n, id: real.id, refId: real.refId } : n
    ),
    edges: g.edges.map((e) =>
      e.from === from || e.to === from
        ? { ...e, id: edgeKey(swap(e.from), swap(e.to), e.substance), from: swap(e.from), to: swap(e.to) }
        : e
    ),
    removed: g.removed,
    splicing: g.splicing.map((id) => {
      const e = g.edges.find((x) => x.id === id);
      return e && (e.from === from || e.to === from)
        ? edgeKey(swap(e.from), swap(e.to), e.substance)
        : id;
    }),
    settled: g.settled,
  };
}

/** The overlay without a card that failed, and whatever was drawn for it. */
function withoutGhost(g: Ghost, id: string, line?: FacilityEdge): Ghost {
  return {
    nodes: g.nodes.filter((n) => n.id !== id),
    edges: g.edges.filter((e) => e.from !== id && e.to !== id),
    removed: line ? g.removed.filter((r) => r !== line.id) : g.removed,
    splicing: g.splicing.filter((e) => !e.includes(id)),
    settled: g.settled,
  };
}

/** A node kind as `flow_connections` names it. */
function flowTypeOf(kind: FacilityNode["kind"]): FlowNodeType | null {
  if (kind === "well" || kind === "injection") return "well";
  if (kind === "tank") return "tank";
  if (kind === "meter") return "meter";
  if (kind === "battery") return "battery";
  if (kind === "gatherer") return "gatherer";
  return null;
}

export function FacilitiesFlowMap({
  graph: serverGraph,
  readouts,
  catalog,
  rows,
  initialSelected = null,
  initialLease = "all",
  initialView = "all",
  initialDetail = null,
  initialPull = null,
  initialMenuOpen = false,
}: {
  graph: FacilityGraph;
  readouts: ReadoutSource;
  catalog: FacilityCatalog;
  /** The facility rows behind the cards, for the detail modal's Settings tab. */
  rows: FacilityRows;
  // landing: the screenshot opens with a card highlighted and a lease chosen, states the app reaches by clicking.
  initialSelected?: string | null;
  initialLease?: string;
  // landing: more clicked-into states for the product page's section screens:
  // the stream select, a card's detail modal, a wire held part-way out of a
  // port toward a target card, and the New facility menu open.
  initialView?: FlowView;
  initialDetail?: string | null;
  initialPull?: { fromId: string; side: "in" | "out"; toId: string } | null;
  initialMenuOpen?: boolean;
}) {
  const canManage = useCan("manage_facilities");
  // Every write this map makes goes through here: the server actions on
  // `/facilities`, an in-memory org in the `/dev/facilities` harness.
  const writes = useFacilityWrites();
  /**
   * Facilities deleted in this session, taken off the map the moment the delete
   * is confirmed. The write and the page refresh follow behind it; an id that
   * fails to delete comes straight back out of here, and one that succeeds is
   * simply not in the next payload.
   */
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const graph = useMemo(() => {
    if (deleted.size === 0) return serverGraph;
    return {
      nodes: serverGraph.nodes.filter((n) => !deleted.has(n.id)),
      // An edge with a deleted end is not a connection any more.
      edges: serverGraph.edges.filter(
        (e) => !deleted.has(e.from) && !deleted.has(e.to)
      ),
      territories: serverGraph.territories.map((t) => ({
        ...t,
        nodeIds: t.nodeIds.filter((id) => !deleted.has(id)),
      })),
    };
  }, [serverGraph, deleted]);
  /*
   * OPTIMISTIC OVERLAY.
   *
   * A write here is a server action, and the map cannot redraw until its
   * response lands — which reads as the click not having worked. (Every action
   * revalidates `/facilities`, so its response already carries the re-rendered
   * page; the `router.refresh()` that used to follow rendered the page a second
   * time, concurrently, and doubled the wait.) So the node and its edges go on screen at once and the server
   * confirms behind them. Entries drop out as the refreshed graph starts
   * carrying them, so nothing is drawn twice and a failed write vanishes on the
   * next refresh rather than leaving a phantom facility for good.
   */
  const [ghost, setGhost] = useState<Ghost>({
    nodes: [],
    edges: [],
    removed: [],
    splicing: [],
    settled: [],
  });
  /*
   * A removed edge stays hidden only until the server agrees. Once the
   * refreshed graph no longer carries it, the entry is dropped: derived edges
   * have deterministic ids (well -> tank), so one left in here would hide the
   * same connection if the operator drew it again. Render-time derivation, not
   * an effect (the repo's lint rule).
   */
  const confirmedRemoved = ghost.removed.filter(
    (id) => !serverGraph.edges.some((e) => e.id === id)
  );
  if (confirmedRemoved.length > 0) {
    setGhost((g) => ({
      ...g,
      removed: g.removed.filter((id) => !confirmedRemoved.includes(id)),
    }));
  }
  const [connecting, setConnecting] = useState(false);
  const [view, setView] = useState<FlowView>(initialView); // landing: seeded
  const [leaseValue, setLeaseValue] = useState(initialLease); // landing: seeded
  const [selected, setSelected] = useState<string | null>(initialSelected); // landing: seeded
  const [detailId, setDetailId] = useState<string | null>(initialDetail); // landing: seeded
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 });
  /** A facility the search asked to centre on, held until its card exists. */
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const [, startWrite] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pan = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  /**
   * A card being carried. It follows the pointer and means one of two things
   * where it lands: dropped ON another card, this facility feeds it; dropped on
   * a flowline, it goes INTO that connection, between the two it already joins.
   * Dropped anywhere else it springs back — where a card sits is the layout's
   * business, so the carry is a gesture, not a position.
   */
  const [wire, setWire] = useState<Wire | null>(null);
  const dragRef = useRef<
    {
      id: string;
      px: number;
      py: number;
      active: boolean;
      el: HTMLElement;
    } | null
  >(null);
  /** A drag just ended on this card: swallow the click it is about to fire. */
  const draggedRef = useRef(false);
  /**
   * A wire being PULLED out of a card's port. The card stays where it is and a
   * line follows the pointer, which is the other half of the carry above: a
   * carry can only ever say "this one feeds that one", while a pull from the
   * LEFT port says the opposite — that the card it lands on feeds this one.
   */
  const [pullState, setPull] = useState<Pull | null>(null); // landing: renamed, `pull` below adds the seed
  const pullRef = useRef<{ fromId: string; side: "in" | "out" } | null>(null);

  /*
   * Reconcile at RENDER when the server sends a new graph — the codebase's
   * re-seed-from-props pattern, not an effect: setting state in an effect would
   * paint the stale overlay for a frame first, which is exactly the double-drawn
   * facility this is meant to prevent.
   */
  const [syncedGraph, setSyncedGraph] = useState(graph);
  if (syncedGraph !== graph) {
    setSyncedGraph(graph);
    setGhost((g) => {
      const confirmed = new Set([
        ...g.settled,
        ...g.nodes.filter((n) => graph.nodes.some((x) => x.id === n.id)).map((n) => n.id),
      ]);
      const nodes = g.nodes.filter((n) => !confirmed.has(n.id));
      /*
       * An edge goes when the server draws it, and also when the server has
       * confirmed the card it hangs off: a card's wiring is written in the same
       * trip as the card, so from then on the server's edges ARE its edges, and
       * a guess the server did not bear out would otherwise stay drawn for good.
       * A splice is the exception — it is written after the card, in a trip of
       * its own.
       */
      const edges = g.edges.filter(
        (e) =>
          !graph.edges.some((x) => x.id === e.id) &&
          (g.splicing.includes(e.id) || (!confirmed.has(e.from) && !confirmed.has(e.to)))
      );
      const removed = g.removed.filter((id) => graph.edges.some((x) => x.id === id));
      const splicing = g.splicing.filter((id) => edges.some((e) => e.id === id));
      const settled = [...confirmed].filter((id) =>
        edges.some((e) => e.from === id || e.to === id)
      );
      return nodes.length === g.nodes.length &&
        edges.length === g.edges.length &&
        removed.length === g.removed.length &&
        splicing.length === g.splicing.length &&
        settled.length === g.settled.length
        ? g
        : { nodes, edges, removed, splicing, settled };
    });
  }

  /** The graph as the operator has it right now: the server's, plus what they
   *  just did and the server has not caught up with. */
  const liveGraph = useMemo<FacilityGraph>(
    () => ({
      ...graph,
      /*
       * A ghost the graph has CAUGHT UP WITH is dropped here, not just at the
       * reconcile above: the two land in the same commit whenever the graph is
       * client-side (the dev harness) or the refresh is instant, and the
       * reconcile only runs on the NEXT graph. A node listed twice collapses its
       * own lane — the card ends up drawn above the box it belongs in.
       */
      nodes: [
        ...graph.nodes,
        ...ghost.nodes.filter((n) => !graph.nodes.some((x) => x.id === n.id)),
      ],
      edges: [
        ...graph.edges.filter((e) => !ghost.removed.includes(e.id)),
        ...ghost.edges.filter((e) => !graph.edges.some((x) => x.id === e.id)),
      ],
    }),
    [graph, ghost]
  );

  const leaseId = leaseValue === "all" ? null : leaseValue;
  /*
   * The viewport's SHAPE, frozen per filter.
   *
   * A ratio, not a width: the packer's widths are canvas units and the canvas is
   * then fit-zoomed, so a pixel count handed over here would be compared against
   * the wrong scale. Frozen because letting it track the live size would repack
   * the map while the window is being dragged — re-fitting to a resize is the
   * zoom's job, not the layout's.
   */
  const filterKey = `${view}|${leaseId ?? "all"}`;
  const [packAspect, setPackAspect] = useState<{
    key: string;
    aspect: number;
  } | null>(null);
  if (size.w > 0 && size.h > 0 && packAspect?.key !== filterKey) {
    setPackAspect({ key: filterKey, aspect: size.w / size.h });
  }

  /*
   * Hold the map still. `buildFlowLayout` is a pure function of the graph, so
   * adding one facility re-ranks and re-packs every lane — the whole page
   * rearranging around the thing you just dropped. The map is packed ONCE, and
   * `stabilizeLayout` only scooches after that. The held layout is dropped when
   * the FILTER changes, because that is a different map, and once more when the
   * viewport is first measured: the pack before that was for a guessed shape,
   * and holding it would keep the guess for good.
   */
  const built = useMemo(
    () =>
      buildFlowLayout(liveGraph, {
        substance: view,
        leaseId,
        viewportAspect: packAspect?.aspect,
      }),
    [liveGraph, view, leaseId, packAspect]
  );
  /*
   * Held in STATE and adjusted at render (React's documented "derive from props"
   * pattern), not in a ref: a ref read during render is stale by definition and
   * the lint rule says so. It settles in one extra render — once `held.built` is
   * the current build, nothing more changes.
   */
  const [held, setHeld] = useState<{
    built: FlowLayout;
    key: string;
    layout: FlowLayout;
  } | null>(null);
  const heldKey = `${filterKey}|${packAspect?.key === filterKey ? packAspect.aspect : "-"}`;
  if (held?.built !== built || held.key !== heldKey) {
    const prev = held?.key === heldKey ? held.layout : null;
    setHeld({ built, key: heldKey, layout: stabilizeLayout(prev, built) });
  }
  const layout = held?.built === built ? held.layout : built;
  const leaseOptions = graph.territories.filter((x) => x.leaseId != null);

  /*
   * The headline IS the sum of the cards — of the ROUNDED card values, the ones
   * on screen, so an operator who adds up the column lands on this number to the
   * decimal. Summing the underlying rates instead was correct arithmetic and a
   * lying page: ten cards printing 16 over a headline of 158.
   *
   * Producing wells only, and every one of them regardless of the commodity or
   * lease on screen: this is what the company makes, not what the current view
   * happens to draw. An SWD well's number is what it TOOK, which is not
   * production and is not in here.
   */
  const production = useMemo(() => {
    const total = { oil: 0, gas: 0, water: 0 };
    for (const node of graph.nodes) {
      if (node.kind !== "well") continue;
      for (const s of SUBSTANCES) {
        total[s] += roundRate(nodeRate(node, s) ?? 0);
      }
    }
    return total;
  }, [graph.nodes]);

  const posById = useMemo(
    () => new Map(layout.nodes.map((n) => [n.node.id, { x: n.x, y: n.y }])),
    [layout.nodes]
  );
  // landing: the seeded wire, its tip just inside the target card's input
  // port, with the target lit as a drop target. A real pull replaces it.
  const seededPull = useMemo<Pull | null>(() => {
    if (!initialPull) return null;
    const b = posById.get(initialPull.toId);
    if (!b || !posById.has(initialPull.fromId)) return null;
    return {
      fromId: initialPull.fromId,
      side: initialPull.side,
      x: initialPull.side === "out" ? b.x + 18 : b.x + FLOW_NODE.width - 18,
      y: b.y + FLOW_NODE.height / 2,
      overNodeId: initialPull.toId,
    };
  }, [initialPull, posById]);
  const pull = pullState ?? seededPull;
  const nodesById = useMemo(
    () => new Map(liveGraph.nodes.map((n) => [n.id, n])),
    [liveGraph.nodes]
  );
  // Converging feeders become one trunk; whatever is left stays a curve.
  const routing = useMemo(() => routeFlowEdges(layout), [layout]);
  const wired = useMemo(() => {
    const inputs = new Set<string>();
    const outputs = new Set<string>();
    for (const e of layout.edges) {
      outputs.add(e.from);
      inputs.add(e.to);
    }
    return { inputs, outputs };
  }, [layout.edges]);

  // A selection the current filter no longer shows is simply not active — derived
  // rather than cleared, so switching commodity back restores the highlight.
  const activeId = selected && posById.has(selected) ? selected : null;

  /** The selected card plus everything one hop from it (the rest fades). */
  const focus = useMemo(() => {
    if (!activeId) return null;
    const nodes = new Set<string>([activeId]);
    const edges = new Set<string>();
    for (const e of layout.edges) {
      if (e.from === activeId || e.to === activeId) {
        edges.add(e.id);
        nodes.add(e.from);
        nodes.add(e.to);
      }
    }
    return { nodes, edges };
  }, [activeId, layout.edges]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ w: el.clientWidth, h: el.clientHeight })
    );
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (size.w === 0 || size.h === 0 || layout.width === 0 || layout.height === 0) return;
    // Never past 1:1 — fitting a two-card lease should not balloon the cards.
    const k = clamp(
      Math.min((size.w - FIT_PAD) / layout.width, (size.h - FIT_PAD) / layout.height),
      MIN_K,
      1
    );
    setAnimate(true);
    setT({
      k,
      x: (size.w - k * layout.width) / 2,
      y: (size.h - k * layout.height) / 2,
    });
  }, [size.w, size.h, layout.width, layout.height]);

  // Fit whenever the filter (and so the map) changes. rAF, never a sync setState
  // in the effect body.
  useEffect(() => {
    const raf = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(raf);
  }, [fit]);

  /**
   * Centre the viewport on one card at a readable zoom. Returns false when the
   * card is not in the current layout (a filter still hides it) or the viewport
   * has not been measured yet, so the caller can wait and try again.
   */
  const focusOn = useCallback(
    (id: string): boolean => {
      const p = posById.get(id);
      if (!p || size.w === 0 || size.h === 0) return false;
      // 1:1, never the fit zoom: the point of picking a facility is to read it.
      const k = clamp(1, MIN_K, MAX_K);
      setAnimate(true);
      setT({
        k,
        x: size.w / 2 - k * (p.x + FLOW_NODE.width / 2),
        y: size.h / 2 - k * (p.y + FLOW_NODE.height / 2),
      });
      return true;
    },
    [posById, size.w, size.h]
  );

  /*
   * Land the pending focus on the frame AFTER the auto-fit above.
   *
   * Both effects fire in the same commit when a search changes the substance or
   * lease filter, and the fit would otherwise re-centre the whole map on top of
   * the zoom. A nested frame is the ordering, rather than teaching the fit to
   * skip: making it conditional on `pendingFocusId` means CLEARING that state
   * re-runs it, which undoes the zoom a moment after it lands.
   */
  useEffect(() => {
    if (!pendingFocusId) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (focusOn(pendingFocusId)) {
          setSelected(pendingFocusId);
          setPendingFocusId(null);
        } else if (leaseValue === "all") {
          // Nothing left to widen: this facility carries no flow of the commodity
          // on screen, so there is no card to centre on. Drop the request rather
          // than leave it pending against a layout that will never contain it.
          setPendingFocusId(null);
        }
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pendingFocusId, focusOn, leaseValue]);

  /**
   * A facility picked out of the search box.
   *
   * THE COMMODITY IS NOT TOUCHED. Which stream you are looking at is the whole
   * frame of the page — you chose saltwater to think about saltwater — and
   * yanking it to oil because the well you searched for also makes oil throws
   * away the thing you were doing to answer a question you did not ask. The
   * lease filter is different: it is a scope narrowed to look at one thing, so
   * widening it back to "all" to reach the facility you just named is finishing
   * the request rather than overriding it.
   *
   * A facility with no flow of the current commodity therefore stays put, and
   * the effect above drops the request instead of holding it.
   */
  const focusNode = (node: FacilityNode) => {
    if (leaseId && node.leaseId !== leaseId) setLeaseValue("all");
    setPendingFocusId(node.id);
  };

  /* --- Drag a facility onto a connection to stand it in the middle --------- */

  /** The connection a palette drag is hovering, and the kind being dragged. */
  const [dropEdge, setDropEdge] = useState<FacilityEdge | null>(null);
  const [dropRefused, setDropRefused] = useState(false);
  /** A splice waiting on the create dialog: which edge, and what to stand in it. */
  const spliceRef = useRef<FacilityEdge | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  /*
   * Only an operator-drawn connection can be spliced.
   *
   * Every other edge is derived from the allocation tables, which this cannot
   * rewrite — inserting into one would draw the new path BESIDE the old rather
   * than in place of it, and the map would claim the stream goes two ways at
   * once. Refusing the drop and saying why beats making that mess.
   */
  const spliceable = (e: FacilityEdge | null) =>
    e != null && e.custom === true && e.connectionId != null;

  /*
   * A drop is ALWAYS accepted; landing on a line is what makes it a splice.
   *
   * The first cut refused anything that was not over a spliceable connection,
   * which on a real map is almost everything: nearly every edge is derived from
   * the allocation tables, and a fleet that has never drawn a connection by hand
   * has no spliceable line anywhere. The palette was therefore inert. Dropping
   * on open canvas now just adds the facility, and dropping on a connection that
   * can take it puts it in the middle.
   */
  const onCanvasDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    if (!canManage || !ev.dataTransfer.types.includes(PALETTE_MIME)) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
    const hit = edgeAtPoint(
      layout,
      layout.edges,
      canvasPoint(ev.clientX, ev.clientY)
    );
    // Highlight only a line that can actually take it; a derived one is not an
    // error to hover, it simply is not a splice target.
    setDropEdge(spliceable(hit) ? hit : null);
    setDropRefused(false);
  };

  const onCanvasDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    if (!canManage) return;
    ev.preventDefault();
    const kind = ev.dataTransfer.getData(PALETTE_MIME);
    const hit = dropEdge;
    setDropEdge(null);
    setDropRefused(false);
    const next = kind ? draftForKind(kind, view) : null;
    if (!next) return;
    // Remembered only when the drop landed on a spliceable line; otherwise the
    // create form just adds a facility.
    spliceRef.current = spliceable(hit) ? hit : null;
    setDraft(next);
  };

  /** Splices waiting on the facility dropped into them, by provisional id. */
  const pendingSplices = useRef(new Map<string, FacilityEdge>());

  /**
   * A facility made in a quick-add, already real: draw it. It stands where its
   * lease puts it until the page confirms it.
   */
  const onCreated = (node: FacilityNode) =>
    setGhost((g) => ({ ...g, nodes: [...g.nodes, { ...node, provisional: true }] }));

  /**
   * The create form was just submitted: the card and the edges its pickers
   * chose go on the map now, under a provisional id, before the server has made
   * anything. Dropped on a spliceable line, it is drawn standing in that line.
   */
  const onPending = (node: FacilityNode, edges: FacilityEdge[]) => {
    const line = spliceRef.current;
    spliceRef.current = null;
    const from = line ? nodesById.get(line.from) : undefined;
    const to = line ? nodesById.get(line.to) : undefined;
    if (!line?.connectionId || !from || !to) {
      setGhost((g) => ({
        ...g,
        nodes: [...g.nodes, { ...node, provisional: true }],
        edges: [...g.edges, ...edges],
      }));
      return;
    }
    pendingSplices.current.set(node.id, line);
    const into = edgeKey(from.id, node.id, line.substance);
    const outOf = edgeKey(node.id, to.id, line.substance);
    setGhost((g) => ({
      nodes: [...g.nodes, { ...node, provisional: true }],
      edges: [
        ...g.edges,
        ...edges,
        { id: into, from: from.id, to: node.id, substance: line.substance, flow: line.flow, custom: true },
        { id: outOf, from: node.id, to: to.id, substance: line.substance, flow: line.flow, custom: true },
      ],
      removed: [...g.removed, line.id],
      splicing: [...g.splicing, into, outOf],
      settled: g.settled,
    }));
  };

  /**
   * The server answered for a provisional card: it is `real` now, or it failed
   * (null) and comes back off the map along with anything drawn for it.
   */
  const onSettled = (tempId: string, real: FacilityNode | null) => {
    const line = pendingSplices.current.get(tempId);
    pendingSplices.current.delete(tempId);
    if (!real) {
      setGhost((g) => withoutGhost(g, tempId, line));
      return;
    }
    // The card keeps the spot it was drawn in: renamed on screen as well as in
    // the overlay, so the next layout reads it as the same card.
    setGhost((g) => renameGhost(g, tempId, real));
    setHeld((h) => h && { ...h, layout: renameFlowNode(h.layout, tempId, real.id) });
    if (!line?.connectionId) return;

    const from = nodesById.get(line.from);
    const to = nodesById.get(line.to);
    const fromType = from ? flowTypeOf(from.kind) : null;
    const toType = to ? flowTypeOf(to.kind) : null;
    const viaType = flowTypeOf(real.kind);
    if (!from || !to || !fromType || !toType || !viaType) return;
    void writes
      .spliceFacilityIntoConnection({
        connectionId: line.connectionId,
        fromType,
        fromId: from.refId,
        toType,
        toId: to.refId,
        viaType,
        viaId: real.refId,
        substance: line.substance,
      })
      .then(() =>
        // Written: the server's copies replace these on its next graph, and
        // until then they stand in for them like any other edge.
        setGhost((g) => ({
          ...g,
          splicing: g.splicing.filter(
            (id) => !g.edges.some((e) => e.id === id && (e.from === real.id || e.to === real.id))
          ),
        }))
      )
      .catch((err) => {
        console.error("Failed to splice facility", err);
        // The facility exists; only its place in the line failed. Put the line
        // back and leave the card standing on its own.
        setGhost((g) => ({
          ...g,
          edges: g.edges.filter((e) => e.from !== real.id && e.to !== real.id),
          removed: g.removed.filter((id) => id !== line.id),
          splicing: g.splicing.filter(
            (id) => !g.edges.some((e) => e.id === id && (e.from === real.id || e.to === real.id))
          ),
        }));
        toast.error(`Couldn't put ${real.name} into that line.`);
      });
  };

  const zoomTo = (target: number) => {
    setAnimate(true);
    setT((prev) => {
      const k = clamp(target, MIN_K, MAX_K);
      const cx = size.w / 2;
      const cy = size.h / 2;
      const ratio = k / prev.k;
      return { k, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio };
    });
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setAnimate(false);
    setT((prev) => {
      const k = clamp(prev.k * Math.exp(-e.deltaY * 0.0015), MIN_K, MAX_K);
      const ratio = k / prev.k;
      return { k, x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio };
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("[data-flow-node]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pan.current = { px: e.clientX, py: e.clientY, ox: t.x, oy: t.y };
    setAnimate(false);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pan.current;
    if (!p) return;
    setT((prev) => ({
      ...prev,
      x: p.ox + (e.clientX - p.px),
      y: p.oy + (e.clientY - p.py),
    }));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pan.current;
    if (!p) return;
    if (Math.abs(e.clientX - p.px) < 3 && Math.abs(e.clientY - p.py) < 3) {
      setSelected(null);
    }
    pan.current = null;
  };

  /* Canvas coordinates for a screen point — the inverse of the pan/zoom. */
  const canvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left - t.x) / t.k, y: (clientY - rect.top - t.y) / t.k };
    },
    [t.x, t.y, t.k]
  );

  /*
   * Where a card can be dropped INTO a connection. Only single-stream lines get
   * a chip: a trunk is many edges gathered at one junction, and "insert into
   * that" would rewire every feeder behind it from a gesture aimed at one line.
   */
  const dropChips = useMemo(
    () =>
      routing.direct.flatMap((e) => {
        const a = posById.get(e.from);
        const b = posById.get(e.to);
        if (!a || !b) return [];
        return [{ edge: e, ...midpoint(a, b) }];
      }),
    [routing.direct, posById]
  );

  /** The card under a point, if it is not the one the gesture started on. */
  const nodeAtPoint = useCallback(
    (p: { x: number; y: number }, sourceId: string) => {
      for (const placed of layout.nodes) {
        if (placed.node.id === sourceId) continue;
        if (
          p.x >= placed.x &&
          p.x <= placed.x + FLOW_NODE.width &&
          p.y >= placed.y &&
          p.y <= placed.y + FLOW_NODE.height
        ) {
          return placed.node.id;
        }
      }
      return null;
    },
    [layout.nodes]
  );

  /**
   * The lease lane a carried card would be MOVED ONTO, if dropped here.
   *
   * Only a lane that is one lease: a lane is a connected flow, and one that runs
   * across two leases has no single lease to move a facility onto
   * (`FlowLane.leaseId`). The card's own lane is not a move either.
   */
  const laneAtPoint = useCallback(
    (p: { x: number; y: number }, sourceId: string) => {
      const source = layout.nodes.find((n) => n.node.id === sourceId);
      for (const lane of layout.lanes) {
        if (
          p.x < lane.x ||
          p.x > lane.x + lane.width ||
          p.y < lane.y ||
          p.y > lane.y + lane.height
        ) {
          continue;
        }
        if (lane.leaseId === undefined) return null;
        if (source && lane.leaseId === source.node.leaseId) return null;
        return lane.id;
      }
      return null;
    },
    [layout.lanes, layout.nodes]
  );

  /** What is under the cursor mid-drag: a card to feed, or a line to sit in. */
  const hitTest = useCallback(
    (p: { x: number; y: number }, sourceId: string) => {
      for (const chip of dropChips) {
        if (chip.edge.from === sourceId || chip.edge.to === sourceId) continue;
        if (Math.hypot(p.x - chip.x, p.y - chip.y) <= CHIP_HIT) {
          return { overNodeId: null, overEdgeId: chip.edge.id, overLaneId: null };
        }
      }
      const overNodeId = nodeAtPoint(p, sourceId);
      return {
        overNodeId,
        overEdgeId: null,
        overLaneId: overNodeId ? null : laneAtPoint(p, sourceId),
      };
    },
    [dropChips, laneAtPoint, nodeAtPoint]
  );

  /** Draw one connection between two cards, in the commodity on screen (or,
   *  on the all view, the one the cards themselves carry). */
  const connect = useCallback(
    async (fromId: string, toId: string) => {
      const from = nodesById.get(fromId);
      const to = nodesById.get(toId);
      if (!from || !to) return;
      const fromType = flowType(from.kind);
      const toType = flowType(to.kind);
      if (!fromType || !toType) return;
      await writes.createFacilityConnection({
        fromType,
        fromId: from.refId,
        toType,
        toId: to.refId,
        substance: view === "all" ? streamBetween(from, to) : view,
        // One feeder drawn by hand takes the whole stream; the allocation tables
        // are where a split gets divided up.
        sharePct: 100,
      });
    },
    [nodesById, view, writes]
  );

  /** Finish a carry: feed a card, sit in a flowline, or move onto a lease. */
  const dropWire = useCallback(
    (
      sourceId: string,
      hit: {
        overNodeId: string | null;
        overEdgeId: string | null;
        overLaneId: string | null;
      }
    ) => {
      if (hit.overLaneId) {
        const lane = layout.lanes.find((l) => l.id === hit.overLaneId);
        const node = nodesById.get(sourceId);
        // A gatherer is a company, not a facility on a lease.
        if (!lane || lane.leaseId === undefined || !node) return;
        const kind = node.kind;
        if (kind === "gatherer") return;
        startWrite(async () => {
          try {
            await writes.setFacilityLease({
              kind,
              id: node.refId,
              leaseId: lane.leaseId ?? null,
            });
          } catch (error) {
            console.error("Failed to move facility to another lease", error);
          }
        });
        return;
      }
      if (hit.overNodeId) {
        startWrite(async () => {
          try {
            await connect(sourceId, hit.overNodeId!);
          } catch (error) {
            console.error("Failed to connect facilities", error);
          }
        });
        return;
      }
      if (!hit.overEdgeId) return;
      const edge = layout.edges.find((e) => e.id === hit.overEdgeId);
      if (!edge) return;
      startWrite(async () => {
        try {
          // Bypass first, then take the old line out: a failure part-way leaves
          // the flow over-described rather than severed.
          await connect(edge.from, sourceId);
          await connect(sourceId, edge.to);
          // A derived edge nothing here can unset (a member tank's own
          // allocation) stays — the new path is drawn, the old one is the
          // owner's to remove where it lives.
          await undoConnection(edge, writes)?.();
        } catch (error) {
          console.error("Failed to insert facility into a connection", error);
        }
      });
    },
    [connect, layout.edges, layout.lanes, nodesById, writes]
  );

  /*
   * Pull a wire out of a port.
   *
   * The pointer is captured on the PORT, so the rest of the gesture keeps
   * arriving there however far it travels; the card's own carry handlers below
   * see the same events and ignore them, since a pull never sets `dragRef`.
   */
  const onPortDown = (
    id: string,
    side: "in" | "out",
    e: React.PointerEvent<HTMLElement>
  ) => {
    if (!canManage || e.button !== 0) return;
    // Not a card carry, not a canvas pan, and not a click into the card's modal.
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pullRef.current = { fromId: id, side };
    const p = canvasPoint(e.clientX, e.clientY);
    setPull({ fromId: id, side, x: p.x, y: p.y, overNodeId: null });
  };

  const onPortMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = pullRef.current;
    if (!d) return;
    const p = canvasPoint(e.clientX, e.clientY);
    setPull({ ...d, x: p.x, y: p.y, overNodeId: nodeAtPoint(p, d.fromId) });
  };

  /** The gesture was taken away (a browser cancel): drop the wire, wire nothing. */
  const cancelPull = () => {
    pullRef.current = null;
    setPull(null);
  };

  const onPortUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = pullRef.current;
    pullRef.current = null;
    setPull(null);
    if (!d) return;
    // A wire dropped on open canvas is a gesture abandoned, not an error.
    const over = nodeAtPoint(canvasPoint(e.clientX, e.clientY), d.fromId);
    if (!over) return;
    // Which way the stream runs is which port it came out of: the right-hand
    // port feeds what it lands on, the left-hand one is fed BY it.
    const [fromId, toId] = d.side === "out" ? [d.fromId, over] : [over, d.fromId];
    startWrite(async () => {
      try {
        await connect(fromId, toId);
      } catch (error) {
        console.error("Failed to connect facilities", error);
      }
    });
  };

  const onNodePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (!canManage || e.button !== 0) return;
    draggedRef.current = false;
    // NOT captured here: capturing on pointerdown retargets the click that
    // follows to this wrapper, and the card would stop opening its modal.
    // Capture is taken below, once the pointer has actually travelled.
    dragRef.current = {
      id,
      px: e.clientX,
      py: e.clientY,
      active: false,
      el: e.currentTarget,
    };
  };

  const onNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.active && Math.hypot(e.clientX - d.px, e.clientY - d.py) < WIRE_THRESHOLD) {
      return;
    }
    if (!d.active) {
      d.active = true;
      // Now it is a drag: follow the pointer even off the card.
      d.el.setPointerCapture(e.pointerId);
    }
    const p = canvasPoint(e.clientX, e.clientY);
    setWire({
      fromId: d.id,
      dx: (e.clientX - d.px) / t.k,
      dy: (e.clientY - d.py) / t.k,
      ...hitTest(p, d.id),
    });
  };

  const onNodePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    setWire(null);
    if (!d?.active) return;
    // The click that follows this pointerup would open the detail modal.
    draggedRef.current = true;
    const p = canvasPoint(e.clientX, e.clientY);
    dropWire(d.id, hitTest(p, d.id));
  };

  // What the map is showing, for Orion: the commodity, the lease scope, and the
  // chain as text — "which tank does that well go to" is answerable from this.
  usePageContextSlice(
    "facilities.flow",
    useMemo(() => {
      const nameOf = (id: string) =>
        layout.nodes.find((n) => n.node.id === id)?.node.name ?? id;
      return buildRowListSlice({
        label: `Facilities flow map — ${VIEW_LABEL[view]}`,
        total: layout.nodes.length,
        query: [
          leaseId ? `lease id: ${leaseId}` : "every lease",
          ...layout.edges.map(
            (e) =>
              `flow: ${nameOf(e.from)} → ${nameOf(e.to)}` +
              (e.flow != null ? ` (${numberFmt.format(e.flow)} ${flowUnit(e.substance)})` : "")
          ),
        ],
        rows: layout.nodes.map(
          (n) => `${n.node.name} — ${n.node.kind}${n.external ? " (other lease)" : ""}`
        ),
      });
    }, [layout, view, leaseId])
  );

  return (
    // `@container`: this map is not always the full window — the dev harness
    // runs it beside a panel — so its chrome has to measure ITSELF, not the
    // viewport, or the toolbar overflows a narrower canvas and clips the
    // create button off the right edge.
    <div className="@container relative h-full w-full overflow-hidden">
      {/* Dotted grid — a fixed backdrop at a constant pitch: it is the page's
          surface, not part of the map, so zooming must not resize it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,_color-mix(in_oklch,_var(--foreground)_20%,_transparent)_1px,_transparent_1.5px)]"
        style={{ backgroundSize: `${GRID}px ${GRID}px` }}
      />

      <div
        ref={viewportRef}
        className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragOver={onCanvasDragOver}
        onDragLeave={() => {
          setDropEdge(null);
          setDropRefused(false);
        }}
        onDrop={onCanvasDrop}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`,
            transition: animate ? "transform 0.4s ease" : "none",
          }}
        >
          {/* Lease lanes. */}
          {layout.lanes.map((lane) => (
            <div
              key={lane.id}
              className={cn(
                "absolute rounded-2xl border border-border/70 bg-card/40 backdrop-blur-[1px] transition",
                // Carrying a card over another lease's lane: dropping it here
                // moves the facility onto that lease.
                wire?.overLaneId === lane.id &&
                  "border-foreground/60 bg-accent/50 ring-2 ring-foreground/20"
              )}
              style={{ left: lane.x, top: lane.y, width: lane.width, height: lane.height }}
            >
              <div
                className="flex items-center truncate px-4 text-[16px] font-semibold text-foreground/80"
                style={{ height: LANE_HEADER }}
              >
                {lane.name}
              </div>
            </div>
          ))}

          {/* Stage headings. */}
          {layout.stages.map((stage) => (
            <div
              key={stage.rank}
              className="absolute text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              style={{ left: stage.x, top: stage.y, width: stage.width }}
            >
              {stage.label}
            </div>
          ))}

          {/* Flowlines. */}
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={layout.width}
            height={layout.height}
          >
            {/* Merges: many feeders gather into one junction, which carries on
                into what they feed as a single stream. Curves throughout — the
                lines keep the same organic shape a lone connection has. */}
            {routing.bundles.map((bundle) => {
              const color = SUBSTANCE_COLOR[bundle.substance];
              const faded =
                focus != null && !bundle.edgeIds.some((id) => focus.edges.has(id));
              return (
                <g key={bundle.id} opacity={faded ? 0.18 : 1}>
                  {bundle.stubs.map((stub) => (
                    <path
                      key={`${bundle.id}:${stub.nodeId}`}
                      d={curve(stub, bundle.junction)}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.75}
                      strokeDasharray="6 7"
                      className="facility-flow"
                      opacity={0.85}
                    />
                  ))}
                  {bundle.exits.map((exit) => (
                    <path
                      key={`${bundle.id}:out:${exit.nodeId}`}
                      d={curve(bundle.junction, exit)}
                      fill="none"
                      stroke={color}
                      strokeWidth={3}
                      strokeDasharray="6 7"
                      className="facility-flow"
                    />
                  ))}
                  <circle
                    cx={bundle.junction.x}
                    cy={bundle.junction.y}
                    r={4.5}
                    fill={color}
                    className="stroke-card"
                    strokeWidth={2}
                  />
                </g>
              );
            })}

            {routing.direct.map((e) => {
              const a = posById.get(e.from);
              const b = posById.get(e.to);
              if (!a || !b) return null;
              const faded = focus != null && !focus.edges.has(e.id);
              // The line a palette drag is over: thickened and solid, or struck
              // through in the destructive colour when it cannot be spliced.
              const targeted = dropEdge?.id === e.id;
              return (
                <path
                  key={e.id}
                  d={connector(a, b)}
                  fill="none"
                  stroke={
                    targeted && dropRefused
                      ? "var(--destructive)"
                      : SUBSTANCE_COLOR[e.substance]
                  }
                  strokeWidth={targeted ? 4 : 2}
                  strokeLinejoin="round"
                  strokeDasharray={targeted && !dropRefused ? undefined : "6 7"}
                  className="facility-flow"
                  opacity={faded ? 0.18 : 1}
                />
              );
            })}

            {/* The wire being pulled out of a port, following the pointer. */}
            {pull &&
              (() => {
                const a = posById.get(pull.fromId);
                if (!a) return null;
                const port = {
                  x: pull.side === "out" ? a.x + FLOW_NODE.width : a.x,
                  y: a.y + FLOW_NODE.height / 2,
                };
                const tip = { x: pull.x, y: pull.y };
                // Drawn in the direction the stream would run, so a wire pulled
                // from the left port curves INTO the card, not out of it.
                const [from, to] =
                  pull.side === "out" ? [port, tip] : [tip, port];
                // In the stream on screen; on the all view, the card's own
                // (a well's wire is neutral until it lands on something typed).
                const source = nodesById.get(pull.fromId);
                const stream = source ? cardStream(source, view) : null;
                const color = stream ? SUBSTANCE_COLOR[stream] : NEUTRAL_COLOR;
                return (
                  <g>
                    <path
                      d={curve(from, to)}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="6 7"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={tip.x}
                      cy={tip.y}
                      r={pull.overNodeId ? 6 : 4}
                      fill={color}
                      className="stroke-card"
                      strokeWidth={2}
                    />
                  </g>
                );
              })()}

            {/* Where a carried card can be dropped INTO a line. */}
            {wire && (
              <g>
                {dropChips
                  .filter(
                    (chip) =>
                      chip.edge.from !== wire.fromId && chip.edge.to !== wire.fromId
                  )
                  .map((chip) => {
                    const over = wire.overEdgeId === chip.edge.id;
                    const color = SUBSTANCE_COLOR[chip.edge.substance];
                    return (
                      <g key={`chip:${chip.edge.id}`}>
                        <circle
                          cx={chip.x}
                          cy={chip.y}
                          r={over ? 13 : 9}
                          fill="var(--card)"
                          stroke={color}
                          strokeWidth={over ? 2.5 : 1.5}
                        />
                        <path
                          d={`M ${chip.x - 4} ${chip.y} H ${chip.x + 4} M ${chip.x} ${chip.y - 4} V ${chip.y + 4}`}
                          stroke={color}
                          strokeWidth={1.75}
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })}
              </g>
            )}
          </svg>

          {/* Flow labels — per line, and only where a line is one stream. What a
              trunk delivers is on the card it feeds ("alloc"), not on 16 stubs.
              Never on the FIRST leg out of a well: that number is the well's own
              production, which its card already states two inches to the left,
              so the pill only repeats it and crowds the lane. Downstream legs
              still carry theirs, where the volume is a split nothing else
              shows. */}
          {routing.direct.map((e) => {
            const a = posById.get(e.from);
            const b = posById.get(e.to);
            if (!a || !b || e.flow == null || e.flow <= 0) return null;
            const fromKind = nodesById.get(e.from)?.kind;
            if (fromKind === "well" || fromKind === "injection") return null;
            const faded = focus != null && !focus.edges.has(e.id);
            const mx = (a.x + FLOW_NODE.width + b.x) / 2;
            const my = (a.y + b.y) / 2 + FLOW_NODE.height / 2;
            return (
              <div
                key={`${e.id}-label`}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-card px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground shadow-sm"
                style={{ left: mx, top: my - 12, opacity: faded ? 0.2 : 1 }}
              >
                {rateText(e.flow)} {flowUnit(e.substance)}
              </div>
            );
          })}

          {/* Facility cards. */}
          {layout.nodes.map((placed) => (
            <div
              key={placed.node.id}
              data-flow-node
              className="absolute"
              style={{
                left: placed.x,
                top: placed.y,
                width: FLOW_NODE.width,
                height: FLOW_NODE.height,
                // Carried cards ride above the rest and above the flowlines.
                zIndex: wire?.fromId === placed.node.id ? 20 : undefined,
                transform:
                  wire?.fromId === placed.node.id
                    ? `translate(${wire.dx}px, ${wire.dy}px)`
                    : undefined,
              }}
              onPointerDown={(e) => onNodePointerDown(e, placed.node.id)}
              // Both gestures arrive here: a carry (from the card) and a pull
              // (from a port, captured on it and bubbling through).
              onPointerMove={(e) => {
                onNodePointerMove(e);
                onPortMove(e);
              }}
              onPointerUp={(e) => {
                onNodePointerUp(e);
                onPortUp(e);
              }}
              onPointerCancel={(e) => {
                onNodePointerUp(e);
                cancelPull();
              }}
            >
              <FlowMapNode
                node={placed.node}
                substance={cardStream(placed.node, view)}
                readout={facilityReadout(placed.node, view, readouts)}
                rates={
                  view === "all" && placed.node.kind === "well"
                    ? wellRates(placed.node)
                    : undefined
                }
                selected={activeId === placed.node.id}
                dimmed={focus != null && !focus.nodes.has(placed.node.id)}
                external={placed.external}
                hasInput={wired.inputs.has(placed.node.id)}
                hasOutput={wired.outputs.has(placed.node.id)}
                draggable={canManage}
                dragging={wire?.fromId === placed.node.id}
                dropTarget={
                  wire?.overNodeId === placed.node.id ||
                  pull?.overNodeId === placed.node.id
                }
                onPortDown={
                  canManage
                    ? (side, e) => onPortDown(placed.node.id, side, e)
                    : undefined
                }
                onSelect={() => {
                  // A wire just landed here; that gesture was not a click.
                  if (draggedRef.current) {
                    draggedRef.current = false;
                    return;
                  }
                  setSelected(placed.node.id);
                  setDetailId(placed.node.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filters upper left, create actions upper right. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-4">
        <div className="pointer-events-auto">
          <Select
            value={view}
            onValueChange={(v) => setView((v as FlowView) ?? "all")}
          >
            <SelectTrigger className="h-10 w-40 border bg-card/90 backdrop-blur">
              {/* Render the LABEL, not the raw value — the value is the lowercase
                  view key. */}
              <SelectValue>
                {(v) => (
                  <span className="flex items-center gap-2">
                    <ViewDot view={v as FlowView} />
                    {VIEW_LABEL[v as FlowView]}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {FLOW_VIEWS.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <ViewDot view={s} />
                    {VIEW_LABEL[s]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pointer-events-auto">
          <Select value={leaseValue} onValueChange={(v) => setLeaseValue(v ?? "all")}>
            <SelectTrigger className="h-10 w-56 border bg-card/90 backdrop-blur">
              {/* Same reason: the value is the lease's uuid, never the label. */}
              <SelectValue placeholder="All leases">
                {(v) =>
                  v === "all"
                    ? "All leases"
                    : leaseOptions.find((x) => x.leaseId === v)?.name ?? "All leases"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All leases</SelectItem>
              {leaseOptions.map((terr) => (
                <SelectItem key={terr.leaseId} value={terr.leaseId as string}>
                  {terr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company production, in the middle of the bar. It takes the space the
            filters and the actions leave, so it centres itself between them and
            can never land on top of either — and it drops out entirely on a
            screen too narrow to hold all three. Company-wide, so it ignores the
            lease filter beside it. */}
        {/* Only when the CANVAS can hold all three groups on one line: the
            filters, this and the actions come to ~88rem together, and the
            totals are the one of the three that is a readout rather than a
            control. */}
        <div className="hidden flex-1 justify-center @min-[88rem]:flex">
          {/* The click target is the card, not the wide flex cell around it —
              that cell spans the middle of the canvas, and making it solid would
              eat the drag that pans the map. */}
          <div className="pointer-events-auto flex h-10 items-center gap-4 rounded-md border bg-card/90 px-4 backdrop-blur">
            <CompanyTotal substance="oil" label="Oil" value={production.oil} />
            <span className="h-4 w-px bg-border" />
            <CompanyTotal substance="gas" label="Gas" value={production.gas} />
            <span className="h-4 w-px bg-border" />
            <CompanyTotal
              substance="water"
              label="Saltwater"
              value={production.water}
            />
          </div>
        </div>

        {/* `ml-auto` keeps the search at the right end on a narrow screen, where
            the totals card between the groups is hidden and nothing else pushes
            it there. */}
        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          <FacilitySearch
            nodes={liveGraph.nodes}
            onPick={focusNode}
            className="w-64"
          />
        </div>

        {canManage && (
          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConnecting(true)}
              className="h-10"
            >
              <Share2Icon className="size-4" />
              New connection
            </Button>
            <FacilityCreateMenu
              catalog={catalog}
              defaultOpen={initialMenuOpen} // landing: seeded
              draft={draft}
              onDraftChange={(next) => {
                // Opened from the menu, not dropped on a line: a line left over
                // from a drop that was cancelled must not take this facility.
                if (next) spliceRef.current = null;
                setDraft(next);
              }}
              onCreated={onCreated}
              onPending={onPending}
              onSettled={onSettled}
            />
          </div>
        )}
      </div>

      <FacilityDetailModal
        node={detailId ? nodesById.get(detailId) ?? null : null}
        onRemoveEdge={(edgeId, run) => {
          setGhost((g) => ({ ...g, removed: [...g.removed, edgeId] }));
          startWrite(async () => {
            try {
              await run();
            } catch (error) {
              console.error("Failed to remove connection", error);
              setGhost((g) => ({
                ...g,
                removed: g.removed.filter((id) => id !== edgeId),
              }));
            }
          });
        }}
        onDelete={(nodeId, run) => {
          setDeleted((prev) => new Set(prev).add(nodeId));
          startWrite(async () => {
            try {
              await run();
            } catch (error) {
              console.error("Failed to delete facility", error);
              setDeleted((prev) => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
              });
            }
          });
        }}
        onClose={() => setDetailId(null)}
        edges={liveGraph.edges}
        nodesById={nodesById}
        rows={rows}
        catalog={catalog}
        substance={view}
        canManage={canManage}
      />

      <FacilityConnectDialog
        open={connecting}
        onOpenChange={setConnecting}
        onOptimistic={(pairs, sub) =>
          setGhost((g) => ({
            ...g,
            edges: [
              ...g.edges,
              // The id the graph will give the real edge, so the server's
              // copy replaces this one instead of drawing beside it.
              ...pairs.map(({ from, to }) => ({
                id: edgeKey(from.id, to.id, sub),
                from: from.id,
                to: to.id,
                substance: sub,
                flow: null,
                custom: true,
              })),
            ],
          }))
        }
        nodes={graph.nodes}
        batteries={catalog.batteries}
        substance={view}
        catalog={catalog}
      />

      {/* Re-read the page's data without leaving it: the commodity, the lease
          scope and the zoom are client state, so they survive. */}
      <div className="absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-xl border bg-card/90 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() =>
            startRefresh(async () => {
              // Optimistic deletions are the client's memory of a write; the
              // server payload is about to be the authority again.
              setDeleted(new Set());
              await writes.refresh();
            })
          }
          className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Refresh facilities"
          title="Refresh"
        >
          {/* Spokes while it works: the refresh glyph is not symmetric about
              the icon box, so spinning it wobbles.

              On Tailwind's `spin` keyframes rather than the component's own.
              Spokes carries its @keyframes in a <style> beside itself, so every
              spinner on the page inserts and removes an identical copy of that
              rule — and one mounting or unmounting elsewhere restarts the
              animation here, which is the jump. Tailwind's live in the
              stylesheet and never churn. The inline `animationName` overrides
              the component's, which is itself inline. */}
          {refreshing ? (
            <Spokes className="size-4" style={{ animationName: "spin" }} />
          ) : (
            <RefreshCwIcon className="size-4" />
          )}
        </button>
      </div>

      {/* Zoom + fit. */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border bg-card/90 px-2.5 py-1.5 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => zoomTo(stepZoom(t.k, -1))}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Zoom out"
        >
          <MinusIcon className="size-4" />
        </button>
        <span className="w-9 text-center text-[11px] tabular-nums text-muted-foreground">
          {Math.round(t.k * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomTo(stepZoom(t.k, 1))}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Zoom in"
        >
          <PlusIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={fit}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Fit to view"
        >
          <MaximizeIcon className="size-4" />
        </button>
      </div>

      {/* Only when there is NOTHING to look at. A lease with no facilities on it
          draws its own empty lane, and a card floating over that lane saying
          there is nothing here contradicts the lane it is sitting on. */}
      {layout.nodes.length === 0 && layout.lanes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border bg-card/90 px-6 py-4 text-center shadow-lg backdrop-blur">
            <div className="text-sm font-medium text-foreground">
              No {view === "all" ? "" : `${SUBSTANCE_LABEL[view].toLowerCase()} `}
              facilities
              {leaseId ? " on this lease" : ""}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              New facility adds the wells, tanks and meters; New connection wires
              them together.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One commodity's company-wide rate on the summary card: the substance's dot,
 * its name, and the number in the unit that substance is measured in.
 */
function CompanyTotal({
  substance,
  label,
  value,
}: {
  substance: Substance;
  label: string;
  value: number;
}) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap text-sm">
      <span
        className="size-2 self-center rounded-full"
        style={{ backgroundColor: SUBSTANCE_COLOR[substance] }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">
        {totalText(value)}
      </span>
      <span className="text-xs text-muted-foreground">{flowUnit(substance)}</span>
    </span>
  );
}
