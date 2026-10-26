"use client";

/**
 * landing: shim of the app's facility-connect-dialog.tsx (react-dnd + the
 * SwipeUpModal, neither installed here). It opens only from the "New
 * connection" button, so on a screenshot it renders nothing.
 */
import type { FacilityNode, FlowView, Substance } from "@/lib/facilities/graph";
import type { FacilityCatalog } from "@/components/facilities/facility-create-menu";

export function FacilityConnectDialog(_props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimistic?: (
    pairs: { from: FacilityNode; to: FacilityNode; feeders: number }[],
    substance: Substance
  ) => void;
  nodes: FacilityNode[];
  batteries?: { id: string; name: string; leaseId?: string | null }[];
  substance: FlowView;
  catalog: FacilityCatalog;
  preset?: unknown;
  elevated?: boolean;
}) {
  void _props;
  return null;
}
