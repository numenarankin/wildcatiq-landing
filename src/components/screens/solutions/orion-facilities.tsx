"use client";

/**
 * Orion for the office manager, doing what the Facilities page does: on the
 * flow map, she asks Orion to set up a new lease with two wells, two oil tanks,
 * a water tank and a gas meter. Each write waits on its approval card, one
 * after another as the SDK pauses at each (`orion-facilities-fixture.ts`), and
 * the map behind the drawer gains each record as its card is approved.
 */
import { useMemo, useState } from "react";
import { PermissionsProvider } from "@/components/auth/permissions-context";
import { FacilitiesFlowMap } from "@/components/facilities/flow-map";
import { OrionDrawerScreen } from "@/components/screens/product/orion/drawer";
import { flowMapCatalog, flowMapReadouts, flowMapRows } from "@/lib/screens/flow-map-fixture";
import { pruittGraph, pruittLeaseThread } from "@/lib/screens/orion-facilities-fixture";

export function OrionFacilitiesScreen() {
  const [conversation] = useState(pruittLeaseThread);
  const [settled, setSettled] = useState(0);
  const graph = useMemo(() => pruittGraph(settled), [settled]);
  return (
    <OrionDrawerScreen
      path="/facilities"
      crumbs={["Facilities"]}
      conversation={conversation}
      gated
      onSettled={setSettled}
      holdMs={9000}
    >
      <PermissionsProvider permissions={["view_facilities", "manage_facilities", "manage_leases"]}>
        <FacilitiesFlowMap graph={graph} readouts={flowMapReadouts} catalog={flowMapCatalog} rows={flowMapRows} />
      </PermissionsProvider>
    </OrionDrawerScreen>
  );
}
