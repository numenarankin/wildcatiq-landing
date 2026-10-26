"use client";

/**
 * The flow map as the app renders it: the app's own `FacilitiesFlowMap`
 * (dotted canvas, lease lanes, animated flowlines, the commodity and lease
 * selects, search, zoom and refresh chrome) over the fixture operation. The
 * hero opens on the All view across every lease, so the three streams show at
 * once. `FlowMapCanvas` is the same map without the sidebar, opened in one
 * clicked-into state for a product-page section. The connect dialog is
 * shimmed and the detail modal and create menu are partial ports at their app
 * paths; everything else on screen is the app's code.
 */
import { PermissionsProvider } from "@/components/auth/permissions-context";
import type { PermissionKey } from "@/lib/settings/org";
import { FacilitiesFlowMap } from "@/components/facilities/flow-map";
import type { FlowView } from "@/lib/facilities/graph";
import { ModalScope } from "@/components/wells/swipe-up-modal";
import { flowMapCatalog, flowMapGraph, flowMapReadouts, flowMapRows } from "@/lib/screens/flow-map-fixture";
import { AppFrame } from "./app-frame";
import { ScreenPanel } from "./panel";

const graph = flowMapGraph();

const MANAGER: PermissionKey[] = ["view_facilities", "manage_facilities", "manage_leases"];

export function FlowMapLive() {
  return (
    <AppFrame path="/facilities" crumbs={["Facilities"]} fullBleed>
      <PermissionsProvider permissions={MANAGER}>
        <FacilitiesFlowMap graph={graph} readouts={flowMapReadouts} catalog={flowMapCatalog} rows={flowMapRows} />
      </PermissionsProvider>
    </AppFrame>
  );
}

export interface FlowMapState {
  view?: FlowView;
  lease?: string;
  selected?: string | null;
  detail?: string | null;
  pull?: { fromId: string; side: "in" | "out"; toId: string } | null;
  menuOpen?: boolean;
  permissions?: PermissionKey[];
  /** Design size. 1500 wide holds the company totals bar (`@min-[88rem]`). */
  w?: number;
  h?: number;
}

export function FlowMapCanvas({ view = "all", lease = "all", selected = null, detail = null, pull = null, menuOpen = false, permissions = MANAGER, w = 1500, h = 820 }: FlowMapState) {
  return (
    <ScreenPanel w={w} h={h} path="/facilities" pad={false}>
      <ModalScope>
        <PermissionsProvider permissions={permissions}>
          <FacilitiesFlowMap
            graph={graph}
            readouts={flowMapReadouts}
            catalog={flowMapCatalog}
            rows={flowMapRows}
            initialView={view}
            initialLease={lease}
            initialSelected={selected}
            initialDetail={detail}
            initialPull={pull}
            initialMenuOpen={menuOpen}
          />
        </PermissionsProvider>
      </ModalScope>
    </ScreenPanel>
  );
}
