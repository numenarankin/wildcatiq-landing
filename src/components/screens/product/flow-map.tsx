"use client";

/**
 * The Flow map page's section screens: the app's own `FacilitiesFlowMap`
 * (flow-map-live.tsx `FlowMapCanvas`) over flow-map-fixture.ts, each opened
 * in the state its section describes.
 */
import { nodeId } from "@/lib/facilities/graph";
import { LEASES } from "@/lib/screens/flow-map-fixture";
import { FlowMapCanvas } from "../flow-map-live";
import type { SectionScreens } from "./types";

const SMITH = LEASES.smith.id;

export const flowMapScreens: SectionScreens = {
  // The gas stream alone, every lease: wells to their lease meters.
  picture: { Component: () => <FlowMapCanvas view="gas" /> },
  // Oil on Smith, with the company totals bar in frame and the LACT pills.
  numbers: { Component: () => <FlowMapCanvas view="oil" lease={SMITH} /> },
  // Smith 4 picked on the All view: its one-hop neighbours stay, the rest fade.
  wiring: { Component: () => <FlowMapCanvas lease={SMITH} selected={nodeId("well", "w-s4")} /> },
  // The detail modal on Smith T201, Connections tab.
  detail: { Component: () => <FlowMapCanvas view="oil" lease={SMITH} selected={nodeId("tank", "t-sm-201")} detail={nodeId("tank", "t-sm-201")} /> },
  // A wire pulled from Roy Corbett 4's out port onto Smith SWD 1, on the saltwater view.
  build: { Component: () => <FlowMapCanvas view="water" pull={{ fromId: nodeId("well", "w-rc4"), side: "out", toId: nodeId("injection", "w-smswd1") }} /> },
  // The New facility menu open: tanks and a gas meter, no water meter card.
  rules: { Component: () => <FlowMapCanvas lease={SMITH} menuOpen /> },
  // Saltwater, every lease: Smith SWD 1 takes Smith Water and Johnson A Water.
  disposal: { Component: () => <FlowMapCanvas view="water" selected={nodeId("injection", "w-smswd1")} /> },
  // A member without manage_facilities: no New connection, New facility or ports.
  permissions: { Component: () => <FlowMapCanvas lease={SMITH} permissions={["view_facilities"]} /> },
};
