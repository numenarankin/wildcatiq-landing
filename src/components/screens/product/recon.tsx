"use client";

/**
 * The Recon page's section screens, one per Recon feature, every map on
 * satellite and every screen a loop: the map's five views and filters, permits
 * with the W-1, completions, a lease and an operator sized up for an
 * acquisition, the market rollups, county alerts, and Orion on the map.
 */
import type { SectionScreens } from "./types";
import { ReconLayersScreen } from "./recon/layers";
import { ReconPermitsScreen } from "./recon/permits";
import { ReconCompletionsScreen } from "./recon/completions";
import { ReconLeaseScreen } from "./recon/lease";
import { ReconOperatorScreen } from "./recon/operator";
import { ReconMarketScreen } from "./recon/market";
import { ReconAlertsScreen } from "./recon/alerts";
import { ReconOrionScreen } from "./recon/orion";

export const reconScreens: SectionScreens = {
  layers: { Component: ReconLayersScreen },
  permits: { Component: ReconPermitsScreen },
  completions: { Component: ReconCompletionsScreen },
  lease: { Component: ReconLeaseScreen },
  operator: { Component: ReconOperatorScreen },
  market: { Component: ReconMarketScreen },
  alerts: { Component: ReconAlertsScreen },
  orion: { Component: ReconOrionScreen },
};
