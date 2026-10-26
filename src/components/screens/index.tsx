"use client";

import type { FeatureSlug } from "@/lib/site";
import { DashboardLive } from "./dashboard-live";
import { OrionLive } from "./orion-live";
import { MobileScreen } from "./mobile-screen";
import { ReconLive } from "./recon-live";
import { DocumentsHeroLive } from "./product/documents/ingest";
import { ReportsLive } from "./reports-live";
import { FilingsLive } from "./filings-live";
import { FlowMapLive } from "./flow-map-live";
import { DemoActiveProvider } from "./demo-active";

const SCREENS: Record<FeatureSlug, () => React.JSX.Element> = {
  dashboard: DashboardLive,
  orion: OrionLive,
  mobile: MobileScreen,
  recon: ReconLive,
  documents: DocumentsHeroLive,
  reports: () => <ReportsLive settings={false} />,
  filings: FilingsLive,
  "flow-map": FlowMapLive,
};

/** The product screen for a feature. The mobile screen draws its own device frame. */
export function FeatureScreen({ slug }: { slug: FeatureSlug }) {
  const Screen = SCREENS[slug];
  if (slug === "mobile") {
    return (
      <DemoActiveProvider className="flex justify-center py-6">
        <Screen />
      </DemoActiveProvider>
    );
  }
  return (
    <DemoActiveProvider className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
      <Screen />
    </DemoActiveProvider>
  );
}
