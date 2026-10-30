"use client";

import type { SectionScreens } from "./types";
import {
  BriefScreen,
  CardsScreen,
  DeclineScreen,
  TableScreen,
} from "./dashboard/screens";

export const dashboardScreens: SectionScreens = {
  brief: { Component: BriefScreen },
  cards: { Component: CardsScreen },
  decline: { Component: DeclineScreen },
  table: { Component: TableScreen },
};
