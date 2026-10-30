"use client";

import type { SectionScreens } from "./types";
import { LogAnalysisLive } from "../log-analysis-live";
import {
  OrionApprovalScreen,
  OrionReadsScreen,
  OrionRrcScreen,
} from "./orion/screens";

export const orionScreens: SectionScreens = {
  reads: { Component: OrionReadsScreen },
  rrc: { Component: OrionRrcScreen },
  logs: { Component: LogAnalysisLive },
  approval: { Component: OrionApprovalScreen },
};
