/**
 * Wiring helpers shared by everything on the flow map that CREATES or UNDOES a
 * connection — the connect dialog, the detail modal's Connections tab, and the
 * card-drag on the canvas.
 *
 * They live together because unwiring is not symmetric with wiring: an edge the
 * operator drew is a `flow_connections` row and deletes as one, while an edge
 * derived from the legacy allocation/FK tables is undone by unsetting whatever
 * produced it. A caller that knows only one of those two paths silently leaves
 * half the map un-editable.
 */

import type { FacilityEdge, FacilityKind } from "@/lib/facilities/graph";
import type { FlowNodeType } from "@/lib/flow/types";
import type { FacilityWrites } from "@/components/facilities/facility-writes";

/** Facility kinds `flow_connections` can address. */
export function flowType(kind: FacilityKind): FlowNodeType | null {
  if (kind === "well" || kind === "injection") return "well";
  if (kind === "tank") return "tank";
  if (kind === "meter") return "meter";
  if (kind === "gatherer") return "gatherer";
  // A battery's connection is its member tanks' too (`@/lib/flow/battery-edges`).
  if (kind === "battery") return "battery";
  return null;
}

/** Split a node id back into its kind and the record id behind it. */
export function splitNodeId(id: string): [string, string] {
  const at = id.indexOf(":");
  return [id.slice(0, at), id.slice(at + 1)];
}

/**
 * How to take this edge back out, or null when nothing here can: a derived edge
 * whose source is a member tank's own allocation is unwired on that tank, not
 * on the card the map drew.
 */
export function undoConnection(
  edge: FacilityEdge,
  /**
   * Where the undo lands. Passed rather than imported so the same six paths run
   * against a sandbox org in the harness (`facility-writes.tsx`).
   */
  writes: FacilityWrites
): (() => Promise<void>) | null {
  if (edge.connectionId) {
    const id = edge.connectionId;
    return () => writes.deleteFacilityConnection(id);
  }
  const [fromKind, fromRef] = splitNodeId(edge.from);
  const [toKind, toRef] = splitNodeId(edge.to);
  if (fromKind === "well") {
    // Oil hangs off the tank's BATTERY as well as the tank, and only the battery
    // row feeds production — dropping the tank row alone left the well allocated
    // and the edge back on the next load.
    if (toKind === "tank") {
      return edge.substance === "oil"
        ? () => writes.removeWellFromOilTank(toRef, fromRef)
        : () => writes.removeTankWell(toRef, fromRef);
    }
    if (toKind === "meter") return () => writes.removeMeterWell(toRef, fromRef);
  }
  if (toKind === "injection") {
    if (fromKind === "tank") return () => writes.editTank(fromRef, { injectionWellId: null });
    if (fromKind === "battery") {
      return () => writes.editBattery(fromRef, { injectionWellId: null });
    }
  }
  return null;
}
