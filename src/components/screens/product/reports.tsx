"use client";

import type { SectionScreens } from "./types";
import {
  DigestScreen,
  LibraryScreen,
  ScheduleScreen,
  VarianceScreen,
} from "./reports/screens";

export const reportsScreens: SectionScreens = {
  library: { Component: LibraryScreen },
  digest: { Component: DigestScreen },
  production: { Component: VarianceScreen },
  schedule: { Component: ScheduleScreen },
};
