"use client";

/**
 * Facility detail on the flow map: what opens when a card is clicked.
 *
 * landing: a partial port of the app's facility-detail-modal.tsx. Ported as
 * the app has them: the SwipeUpModal shell (title, kind, delete and
 * open-in-new-tab header actions, `max-w-3xl h-[80vh]`), the tab strip, and
 * the Connections tab (`ConnectionList`, inflow and outflow off the map's own
 * edges, drawn ones removable through `undoConnection`). Not ported: the
 * Settings tab (the tank / meter / battery / well form dialogs) and the
 * Allocation tab (the allocation panels, loaded from server actions), so
 * those two tab buttons are drawn but stay on Connections. The delete confirm
 * (`ConfirmDialog`) is not carried, so the trash button opens nothing.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLinkIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { cn } from "@/lib/utils";
import type { FacilityEdge, FacilityNode, FlowView } from "@/lib/facilities/graph";
import { undoConnection } from "@/lib/facilities/wiring";
import { useFacilityWrites } from "@/components/facilities/facility-writes";
import { Button } from "@/components/ui/button";
import { KIND_LABEL, SUBSTANCE_COLOR, flowUnit } from "@/components/facilities/substances";
import type { FacilityCatalog } from "@/components/facilities/facility-create-menu";

/** The org's facility rows, so a tab can seed its form without another read. */
export interface FacilityRows {
  tanks: unknown[];
  meters: unknown[];
  batteries: unknown[];
  wells: unknown[];
}

type Tab = "connections" | "settings" | "allocation";

const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * The facility's own page. Water facilities live under /disposal and oil ones
 * under /production, the same split the sidebar makes. A battery has one page
 * for both halves; a haul-off has none.
 */
function facilityHref(node: FacilityNode): string | null {
  const water = node.substances[0] === "water";
  switch (node.kind) {
    case "well":
      return `/production/wells/${node.refId}`;
    case "injection":
      return `/disposal/wells/${node.refId}`;
    case "tank":
      return water ? `/disposal/tanks/${node.refId}` : `/production/tanks/${node.refId}`;
    case "meter":
      return water ? `/disposal/meters/${node.refId}` : `/production/meters/${node.refId}`;
    case "battery":
      return `/production/batteries/${node.refId}`;
    default:
      return null;
  }
}

export function FacilityDetailModal({
  node,
  onClose,
  edges,
  nodesById,
  canManage,
  onRemoveEdge,
}: {
  /** The facility whose card was clicked; null closes the modal. */
  node: FacilityNode | null;
  onClose: () => void;
  /** Every edge on the map, all commodities: connections are not filtered. */
  edges: FacilityEdge[];
  nodesById: Map<string, FacilityNode>;
  rows: FacilityRows;
  catalog: FacilityCatalog;
  substance: FlowView;
  canManage: boolean;
  onDelete?: (nodeId: string, run: () => Promise<void>) => void;
  onRemoveEdge?: (edgeId: string, run: () => Promise<unknown>) => void;
}) {
  const writes = useFacilityWrites();
  const [, startWrite] = useTransition();
  const [tab, setTab] = useState<Tab>("connections");

  // Re-seed on each open (render-time pattern, matching the form dialogs).
  const nodeId = node?.id ?? null;
  const [shownId, setShownId] = useState<string | null>(nodeId);
  if (nodeId !== shownId) {
    setShownId(nodeId);
    setTab("connections");
  }

  const hasAllocation =
    node != null && (node.kind === "tank" || node.kind === "meter" || node.kind === "battery");

  const inflow = useMemo(() => (node ? edges.filter((e) => e.to === node.id) : []), [edges, node]);
  const outflow = useMemo(() => (node ? edges.filter((e) => e.from === node.id) : []), [edges, node]);

  function removeConnection(edge: FacilityEdge) {
    const undo = undoConnection(edge, writes);
    if (!undo) return;
    if (onRemoveEdge) {
      onRemoveEdge(edge.id, undo);
      return;
    }
    startWrite(async () => {
      try {
        await undo();
      } catch (error) {
        console.error("Failed to remove connection", error);
      }
    });
  }

  // A gatherer is not ours to delete from here: it is a company.
  const canDelete = node != null && node.kind !== "gatherer";

  const tabs: { id: Tab; label: string }[] = [
    { id: "connections", label: "Connections" },
    { id: "settings", label: "Settings" },
    ...(hasAllocation ? [{ id: "allocation" as const, label: "Allocation" }] : []),
  ];

  return (
    <SwipeUpModal
      open={node != null}
      onClose={onClose}
      title={node?.name ?? "Facility"}
      description={node ? KIND_LABEL[node.kind] : undefined}
      headerAction={
        <>
          {canManage && canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${node?.name ?? "facility"}`}
              title="Delete facility"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          )}
          {node && facilityHref(node) ? (
            <Link
              href={facilityHref(node)!}
              target="_blank"
              rel="noopener"
              aria-label={`Open ${node.name} in a new tab`}
              title="Open in a new tab"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <ExternalLinkIcon className="size-4" />
            </Link>
          ) : null}
        </>
      }
      className="max-w-3xl h-[80vh]"
    >
      {node && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-stretch gap-1 border-b px-5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                // landing: only Connections is ported (see the header).
                onClick={() => t.id === "connections" && setTab(t.id)}
                className={cn(
                  "flex h-12 cursor-pointer items-center border-b-2 px-3 text-base transition-colors",
                  tab === t.id
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "connections" && (
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
              <ConnectionList
                title="Inflow"
                empty="Nothing feeds this facility."
                edges={inflow}
                otherId={(e) => e.from}
                nodesById={nodesById}
                canManage={canManage}
                onRemove={removeConnection}
                canRemove={(e) => undoConnection(e, writes) != null}
                onAdd={() => {}}
              />
              <ConnectionList
                title="Outflow"
                empty="This facility feeds nothing."
                edges={outflow}
                otherId={(e) => e.to}
                nodesById={nodesById}
                canManage={canManage}
                onRemove={removeConnection}
                canRemove={(e) => undoConnection(e, writes) != null}
                onAdd={() => {}}
              />
            </div>
          )}
        </div>
      )}
    </SwipeUpModal>
  );
}

function ConnectionList({
  title,
  empty,
  edges,
  otherId,
  nodesById,
  canManage,
  onRemove,
  canRemove,
  onAdd,
}: {
  title: string;
  empty: string;
  edges: FacilityEdge[];
  otherId: (edge: FacilityEdge) => string;
  nodesById: Map<string, FacilityNode>;
  canManage: boolean;
  onRemove: (edge: FacilityEdge) => void;
  canRemove: (edge: FacilityEdge) => boolean;
  onAdd?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
        {canManage && onAdd && (
          <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
            <PlusIcon className="size-4" />
            Add
          </Button>
        )}
      </div>
      {edges.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {edges.map((e) => {
            const other = nodesById.get(otherId(e));
            return (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: SUBSTANCE_COLOR[e.substance] }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{other?.name ?? otherId(e)}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {other ? KIND_LABEL[other.kind] : "Facility"}
                    {e.custom ? " · drawn" : ""}
                  </span>
                </span>
                {e.flow != null && e.flow > 0 && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {numberFmt.format(e.flow)} {flowUnit(e.substance)}
                  </span>
                )}
                {canManage && canRemove(e) && (
                  <button
                    type="button"
                    aria-label="Remove connection"
                    className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
                    onClick={() => onRemove(e)}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
