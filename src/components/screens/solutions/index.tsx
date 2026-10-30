"use client";

/**
 * The role pages' demo screens, keyed by `SolutionSection.screen`. Most are
 * the product pages' own screens; the rest are built for the roles here
 * (a well page, tasks, the calendar, the invoice read, and an Orion thread
 * per role). Phone screens draw their own device frame and sit beside the copy.
 */
import Link from "next/link";
import type { SolutionScreenKey, SolutionSection } from "@/lib/site";
import { getFeature } from "@/lib/site";
import { Container, Eyebrow } from "@/components/home/sections";
import { ArrowIcon } from "@/components/icons";
import { DemoActiveProvider } from "@/components/screens/demo-active";
import { productPageVisible } from "@/lib/dev-only";
import type { SectionScreen } from "@/components/screens/product/types";
import { DashboardLive } from "@/components/screens/dashboard-live";
import { ReconLive } from "@/components/screens/recon-live";
import { ReportsLive } from "@/components/screens/reports-live";
import { FlowMapLive } from "@/components/screens/flow-map-live";
import { FilingsLive } from "@/components/screens/filings-live";
import { MobileScreen } from "@/components/screens/mobile-screen";
import { PhoneDashboardScreen } from "@/components/screens/product/mobile/dashboard";
import { RunTicketScreen } from "@/components/screens/product/mobile/run-ticket";
import { CommentsScreen } from "@/components/screens/product/mobile/comments";
import { WellPageScreen } from "./well-page";
import { TasksScreen } from "./tasks";
import { CalendarScreen } from "./calendar";
import { InvoiceIngestScreen } from "./invoice-ingest";
import { OrionOwnerScreen } from "./orion-owner";
import { OrionOfficeScreen } from "./orion-office";
import { OrionFacilitiesScreen } from "./orion-facilities";
import { PumperOrionScreen } from "./pumper-orion";
import { PumperWellInfoScreen } from "./pumper-well-info";
import { PumperWellTestsScreen } from "./pumper-well-tests";

const SCREENS: Record<SolutionScreenKey, SectionScreen> = {
  dashboard: { Component: DashboardLive },
  recon: { Component: ReconLive },
  reports: { Component: () => <ReportsLive settings={false} /> },
  "flow-map": { Component: FlowMapLive },
  filings: { Component: FilingsLive },
  "well-page": { Component: WellPageScreen },
  tasks: { Component: TasksScreen },
  calendar: { Component: CalendarScreen },
  invoice: { Component: InvoiceIngestScreen },
  "orion-owner": { Component: OrionOwnerScreen },
  "orion-office": { Component: OrionOfficeScreen },
  "orion-facilities": { Component: OrionFacilitiesScreen },
  "phone-dashboard": { Component: PhoneDashboardScreen, phone: true },
  "phone-gauge": { Component: MobileScreen, phone: true },
  "phone-tickets": { Component: RunTicketScreen, phone: true },
  "phone-comments": { Component: CommentsScreen, phone: true },
  "phone-well-info": { Component: PumperWellInfoScreen, phone: true },
  "phone-well-tests": { Component: PumperWellTestsScreen, phone: true },
  "phone-orion": { Component: PumperOrionScreen, phone: true },
};

/** One role-page section, drawn the way the home page draws a feature. */
export function SolutionSectionBlock({ section }: { section: SolutionSection }) {
  const { Component: Screen, phone } = SCREENS[section.screen];
  const feature = section.feature ? getFeature(section.feature) : undefined;
  const copy = (
    <div className="max-w-3xl">
      <Eyebrow>{section.eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{section.headline}</h2>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{section.body}</p>
      {feature && productPageVisible(feature.slug) ? (
        <Link href={`/product/${feature.slug}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          More about {feature.label.toLowerCase()} <ArrowIcon className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );

  if (phone) {
    return (
      <section data-screen={section.screen} className="border-t border-border py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
            {copy}
            <DemoActiveProvider demo={`solutions:${section.screen}`} className="flex justify-center py-6">
              <Screen />
            </DemoActiveProvider>
          </div>
        </Container>
      </section>
    );
  }
  return (
    <section data-screen={section.screen} className="border-t border-border py-20 sm:py-28">
      <Container>
        {copy}
        <DemoActiveProvider demo={`solutions:${section.screen}`} className="mt-12 -mx-3 overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] sm:mx-0 sm:mt-14">
          <Screen />
        </DemoActiveProvider>
      </Container>
    </section>
  );
}
