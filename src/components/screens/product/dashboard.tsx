"use client";

import type { SectionScreens } from "./types";
import {
  BriefScreen,
  CardsScreen,
  ChartScreen,
  DeclineScreen,
  PieScreen,
  TableScreen,
} from "./dashboard/screens";

export const dashboardScreens: SectionScreens = {
  brief: { Component: BriefScreen },
  cards: { Component: CardsScreen },
  chart: { Component: ChartScreen },
  decline: { Component: DeclineScreen },
  table: { Component: TableScreen },
  pie: { Component: PieScreen },
};
