"use client";

import type { SectionScreens } from "./types";
import { ReconLayersScreen } from "./recon/layers";
import { ReconDossierScreen } from "./recon/dossier";
import { ReconPermitsScreen } from "./recon/permits";
import { ReconBrowseScreen } from "./recon/browse";
import { ReconMarketScreen } from "./recon/market";
import { ReconAlertsScreen } from "./recon/alerts";

export const reconScreens: SectionScreens = {
  layers: { Component: ReconLayersScreen },
  dossier: { Component: ReconDossierScreen },
  permits: { Component: ReconPermitsScreen },
  browse: { Component: ReconBrowseScreen },
  market: { Component: ReconMarketScreen },
  alerts: { Component: ReconAlertsScreen },
};
