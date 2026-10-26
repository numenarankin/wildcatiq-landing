"use client";

/**
 * A section screen on a product page: one real app component at a fixed design
 * size, scaled to the column, without the sidebar. The hero carries the full
 * app frame; sections crop to the part of the app they describe.
 */
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChartPrefsProvider } from "@/components/charts/chart-prefs-context";
import { ScaledScreen } from "./shell";
import { ScreenRoute } from "./screen-route";

export function ScreenPanel({
  w = 1200,
  h = 720,
  path = "/",
  pad = true,
  children,
}: {
  w?: number;
  h?: number;
  /** The app route the component lives on, for components that read the pathname. */
  path?: string;
  /** The app's main-column padding around the component. */
  pad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ScaledScreen w={w} h={h}>
      <ScreenRoute path={path}>
        <TooltipProvider>
          <ChartPrefsProvider defaultRange={null} averageLine={false}>
            <div className={pad ? "flex h-full w-full flex-col overflow-hidden bg-background p-8" : "h-full w-full overflow-hidden bg-background"}>
              {children}
            </div>
          </ChartPrefsProvider>
        </TooltipProvider>
      </ScreenRoute>
    </ScaledScreen>
  );
}
