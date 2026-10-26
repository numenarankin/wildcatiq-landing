"use client";

import type { SectionScreens } from "./types";
import {
  DigestScreen,
  LibraryScreen,
  OutputsScreen,
  PumperScreen,
  ScheduleScreen,
  TanksScreen,
  VarianceScreen,
} from "./reports/screens";

export const reportsScreens: SectionScreens = {
  library: { Component: LibraryScreen },
  digest: { Component: DigestScreen },
  production: { Component: VarianceScreen },
  tanks: { Component: TanksScreen },
  pumper: { Component: PumperScreen },
  outputs: { Component: OutputsScreen },
  schedule: { Component: ScheduleScreen },
};
