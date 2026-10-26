"use client";

import type { SectionScreens } from "./types";
import {
  OrionApprovalScreen,
  OrionAttachScreen,
  OrionContextScreen,
  OrionLogsScreen,
  OrionMathScreen,
  OrionMemoryScreen,
  OrionPermissionsScreen,
  OrionReadsScreen,
  OrionRrcScreen,
  OrionVoiceScreen,
} from "./orion/screens";

export const orionScreens: SectionScreens = {
  reads: { Component: OrionReadsScreen },
  rrc: { Component: OrionRrcScreen },
  math: { Component: OrionMathScreen },
  logs: { Component: OrionLogsScreen },
  context: { Component: OrionContextScreen },
  approval: { Component: OrionApprovalScreen },
  memory: { Component: OrionMemoryScreen },
  voice: { Component: OrionVoiceScreen },
  attach: { Component: OrionAttachScreen },
  permissions: { Component: OrionPermissionsScreen },
};
