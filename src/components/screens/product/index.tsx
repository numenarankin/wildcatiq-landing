"use client";

import type { FeatureSlug } from "@/lib/site";
import type { SectionScreens } from "./types";
import { dashboardScreens } from "./dashboard";
import { orionScreens } from "./orion";
import { mobileScreens } from "./mobile";
import { reconScreens } from "./recon";
import { documentsScreens } from "./documents";
import { reportsScreens } from "./reports";
import { filingsScreens } from "./filings";
import { flowMapScreens } from "./flow-map";

const REGISTRY: Record<FeatureSlug, SectionScreens> = {
  dashboard: dashboardScreens,
  orion: orionScreens,
  mobile: mobileScreens,
  recon: reconScreens,
  documents: documentsScreens,
  reports: reportsScreens,
  filings: filingsScreens,
  "flow-map": flowMapScreens,
};

/** A section's screen entry, or undefined when the section has none. */
export function useSectionScreen(slug: FeatureSlug, screen: string | undefined) {
  return screen ? REGISTRY[slug][screen] : undefined;
}
