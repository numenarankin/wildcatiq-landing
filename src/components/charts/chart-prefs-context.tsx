"use client";

/**
 * The signed-in user's chart preferences (Settings > Charts), for every chart
 * in the app to read on mount.
 *
 * The root layout already loads the profile and hands it to the app shell;
 * this provider sits there beside the permissions provider, so the Recon modals
 * and the facility, accounting, revenue and pricing pages all read the same
 * two values without any page threading props.
 *
 *   defaultRange  the preset a chart opens on, mapped onto the presets the
 *                 chart offers by `resolveDefaultRange`. Null: the chart's own.
 *   averageLine   whether the mean-of-what-is-plotted line starts on. Each
 *                 chart's gear overrides it for that mounted chart only.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ChartRangeOption } from "@/lib/charts/ranges";

export interface ChartPrefs {
  defaultRange: ChartRangeOption | null;
  averageLine: boolean;
}

const ChartPrefsContext = createContext<ChartPrefs>({
  defaultRange: null,
  averageLine: false,
});

export function ChartPrefsProvider({
  defaultRange,
  averageLine,
  children,
}: {
  defaultRange: ChartRangeOption | null;
  averageLine: boolean | null;
  children: ReactNode;
}) {
  const value = useMemo<ChartPrefs>(
    () => ({ defaultRange, averageLine: averageLine ?? false }),
    [defaultRange, averageLine]
  );
  return (
    <ChartPrefsContext.Provider value={value}>{children}</ChartPrefsContext.Provider>
  );
}

export function useChartPrefs(): ChartPrefs {
  return useContext(ChartPrefsContext);
}
