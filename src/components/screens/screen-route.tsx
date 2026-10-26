"use client";

/**
 * The route a product screen pretends to be on. The app's nav and main
 * wrapper read `usePathname()`; on the landing every screen renders on the
 * same marketing page, so they read this instead.
 */
import { createContext, useContext } from "react";

const ScreenRouteContext = createContext<string>("/dashboard");

export function ScreenRoute({ path, children }: { path: string; children: React.ReactNode }) {
  return <ScreenRouteContext.Provider value={path}>{children}</ScreenRouteContext.Provider>;
}

export function useScreenPath(): string {
  return useContext(ScreenRouteContext);
}
