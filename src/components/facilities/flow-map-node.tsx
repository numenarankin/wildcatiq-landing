"use client";

import {
  CircleDotIcon,
  CylinderIcon,
  DropletIcon,
  GaugeIcon,
  LayersIcon,
  TruckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacilityKind, FacilityNode, Substance } from "@/lib/facilities/graph";
import type { Readout } from "@/lib/facilities/flow-layout";
import {
  KIND_LABEL,
  NEUTRAL_COLOR,
  SUBSTANCE_COLOR,
  flowUnit,
  rateText,
} from "@/components/facilities/substances";

const ICON: Record<FacilityKind, typeof CircleDotIcon> = {
  well: CircleDotIcon,
  injection: DropletIcon,
  tank: CylinderIcon,
  meter: GaugeIcon,
  battery: LayersIcon,
  gatherer: TruckIcon,
};

const percentFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * One step in the flow — a workflow-builder card: kind icon tinted by the
 * commodity, the facility's name, its role, and its rate. Ports (the small dots
 * on the left and right edges) are where the flowlines land, so a card reads as
 * something a stream passes THROUGH rather than a chart point.
 *
 * The number on the right is whatever that kind of facility is measured by — a
 * well's rate for the commodity on screen, a tank's fill, a meter's last
 * reading (see `facilityReadout`).
 */
export function FlowMapNode({
  node,
  substance,
  readout,
  rates,
  selected,
  dimmed,
  external,
  hasInput,
  hasOutput,
  draggable = false,
  dragging = false,
  dropTarget = false,
  onPortDown,
  onSelect,
}: {
  node: FacilityNode;
  /** The stream the card is drawn in; null (a well on the all view) is neutral. */
  substance: Substance | null;
  readout: Readout | null;
  /**
   * A well's rates on the all view, one line per stream, in place of the
   * single readout a one-stream view gives it. Only ever given with no `readout`.
   */
  rates?: { substance: Substance; value: number }[];
  selected: boolean;
  dimmed: boolean;
  external: boolean;
  hasInput: boolean;
  hasOutput: boolean;
  /** Whether the card can be dragged onto another to wire the two together. */
  draggable?: boolean;
  /** This card is the one being dragged from. */
  dragging?: boolean;
  /** A wire is hovering here — dropping now feeds this facility. */
  dropTarget?: boolean;
  /**
   * Start a wire from one of the card's ports: `out` (right) is what this
   * facility feeds, `in` (left) is what feeds it. Given only where the operator
   * may wire, and what makes the ports grabbable rather than decorative.
   */
  onPortDown?: (side: "in" | "out", e: React.PointerEvent<HTMLElement>) => void;
  onSelect: () => void;
}) {
  const Icon = ICON[node.kind];
  const color = substance ? SUBSTANCE_COLOR[substance] : NEUTRAL_COLOR;

  return (
    // `group`: an unused port stays invisible until the card is pointed at, so
    // a map nobody is wiring reads as cards and lines and nothing else.
    <div className="group relative h-full w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={cn(
          "flex h-full w-full cursor-pointer items-center gap-3 rounded-xl border bg-card py-2.5 pl-3 pr-3.5 text-left shadow-sm transition",
          "hover:border-foreground/25 hover:shadow-md",
          draggable && "cursor-grab active:cursor-grabbing",
          selected && "border-foreground/60 ring-2 ring-foreground/15",
          external && "border-dashed",
          dragging && "ring-2 ring-foreground/25",
          dropTarget && "border-foreground/70 ring-2 ring-foreground/40",
          dimmed && "opacity-30"
        )}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
            color,
          }}
        >
          <Icon className="size-4.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {node.name}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {KIND_LABEL[node.kind]}
            {external && " · other lease"}
          </span>
        </span>

        {!readout && rates && rates.length > 0 && (
          <span className="flex shrink-0 flex-col items-end gap-px">
            {rates.map((r) => (
              <span
                key={r.substance}
                className="flex items-center gap-1.5 text-[11px] leading-tight tabular-nums text-foreground"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: SUBSTANCE_COLOR[r.substance] }}
                />
                {rateText(r.value)}
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  {flowUnit(r.substance)}
                </span>
              </span>
            ))}
          </span>
        )}
        {readout && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {readout.unit === "% full"
                ? `${percentFmt.format(readout.value)}%`
                : rateText(readout.value)}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {readout.unit === "% full" ? "full" : readout.unit}
            </span>
          </span>
        )}
      </button>

      {/* Flow ports — where the lines attach, and where a new one is pulled
          from. A port with nothing on it is still there to be grabbed. */}
      {(hasInput || onPortDown) && (
        <Port
          side="left"
          color={color}
          dimmed={dimmed}
          connected={hasInput}
          onPointerDown={onPortDown ? (e) => onPortDown("in", e) : undefined}
        />
      )}
      {(hasOutput || onPortDown) && (
        <Port
          side="right"
          color={color}
          dimmed={dimmed}
          connected={hasOutput}
          onPointerDown={onPortDown ? (e) => onPortDown("out", e) : undefined}
        />
      )}
    </div>
  );
}

/**
 * One port. A connected one is a filled dot — where the line already lands; an
 * empty one is a ring that shows on hover, which is the invitation to pull a new
 * line out of this facility.
 *
 * The dot is 10px and nobody can hit that reliably, so `before:-inset-2` gives
 * it a 26px grab area without changing what is drawn.
 */
function Port({
  side,
  color,
  dimmed,
  connected,
  onPointerDown,
}: {
  side: "left" | "right";
  color: string;
  dimmed: boolean;
  connected: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  const grabbable = onPointerDown != null;
  return (
    <span
      aria-hidden
      onPointerDown={onPointerDown}
      className={cn(
        "absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 transition",
        side === "left" ? "-left-1.25" : "-right-1.25",
        grabbable
          ? "pointer-events-auto cursor-crosshair before:absolute before:-inset-2 before:content-['']"
          : "pointer-events-none",
        connected
          ? "border-card"
          : "border-current bg-card opacity-0 group-hover:opacity-100",
        dimmed && "opacity-30"
      )}
      style={connected ? { backgroundColor: color } : { color }}
    />
  );
}
