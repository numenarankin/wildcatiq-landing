import type { FeatureSlug } from "@/lib/site";
import type { ProductPageContent } from "./types";
import { dashboardPage } from "./dashboard";
import { orionPage } from "./orion";
import { mobilePage } from "./mobile";
import { reconPage } from "./recon";
import { documentsPage } from "./documents";
import { reportsPage } from "./reports";
import { filingsPage } from "./filings";
import { flowMapPage } from "./flow-map";

export const PRODUCT_PAGES: Record<FeatureSlug, ProductPageContent> = {
  dashboard: dashboardPage,
  orion: orionPage,
  mobile: mobilePage,
  recon: reconPage,
  documents: documentsPage,
  reports: reportsPage,
  filings: filingsPage,
  "flow-map": flowMapPage,
};
