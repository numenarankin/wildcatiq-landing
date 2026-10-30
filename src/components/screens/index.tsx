"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { HomeSectionSlug } from "@/lib/site";
import { DashboardLive } from "./dashboard-live";
import { DemoActiveProvider } from "./demo-active";

/**
 * The screens below the hero, each in its own chunk and rendered only in the
 * browser: the page's first render (and hydration) carries the hero alone.
 * The chunks are fetched once the page has loaded and the browser is idle,
 * and a screen mounts when its section comes within a viewport of the screen.
 */
const LOADERS = {
  orion: () => import("./orion-live").then((m) => m.OrionLive),
  mobile: () => import("./mobile-screen").then((m) => m.MobileScreen),
  recon: () => import("./recon-live").then((m) => m.ReconLive),
  documents: () => import("./product/documents/ingest").then((m) => m.DocumentsHeroLive),
  reports: () =>
    import("./reports-live").then(({ ReportsLive }) => {
      const HomeReports = () => <ReportsLive settings={false} />;
      return HomeReports;
    }),
  filings: () => import("./filings-live").then((m) => m.FilingsLive),
  "flow-map": () => import("./flow-map-live").then((m) => m.FlowMapLive),
  "log-analysis": () => import("./log-analysis-live").then((m) => m.LogAnalysisLive),
} satisfies Record<Exclude<HomeSectionSlug, "dashboard">, () => Promise<() => React.JSX.Element>>;

/** The box a screen occupies before it mounts, so nothing shifts when it does. */
function Placeholder({ phone }: { phone: boolean }) {
  if (phone) {
    return (
      <div className="mx-auto w-full max-w-[290px] overflow-hidden rounded-[44px] border-[8px] border-neutral-900 bg-neutral-900">
        <div className="rounded-[36px] bg-white" style={{ aspectRatio: "390 / 844" }} />
      </div>
    );
  }
  // AppFrame's canvas.
  return <div className="w-full bg-white" style={{ aspectRatio: "1600 / 1000" }} />;
}

const SCREENS: Record<HomeSectionSlug, React.ComponentType> = {
  dashboard: DashboardLive,
  ...(Object.fromEntries(
    Object.entries(LOADERS).map(([slug, load]) => [
      slug,
      dynamic(load, { ssr: false, loading: () => <Placeholder phone={slug === "mobile"} /> }),
    ]),
  ) as Record<keyof typeof LOADERS, React.ComponentType>),
};

let preloaded = false;
/** Fetch every screen's chunk once the page has loaded and the main thread is free. */
function preloadScreens() {
  if (preloaded) return;
  preloaded = true;
  const run = () => Object.values(LOADERS).forEach((load) => void load());
  const idle = () => ("requestIdleCallback" in window ? window.requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 1200));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

/** How far ahead of the viewport a screen mounts: one viewport height. */
const MOUNT_MARGIN = "100% 0px";

/** Children once this box comes within `MOUNT_MARGIN` of the viewport; the placeholder until then. */
function MountNear({ phone, children }: { phone: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    preloadScreens();
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: MOUNT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="w-full">{near ? children : <Placeholder phone={phone} />}</div>;
}

/**
 * The product screen for a feature. The mobile screen draws its own device
 * frame. `eager` renders it with the page (a hero); otherwise it waits until
 * the visitor scrolls near it.
 */
export function FeatureScreen({ slug, eager = false }: { slug: HomeSectionSlug; eager?: boolean }) {
  const Screen = SCREENS[slug];
  const phone = slug === "mobile";
  const screen = eager ? <Screen /> : <MountNear phone={phone}><Screen /></MountNear>;
  if (phone) {
    return (
      <DemoActiveProvider demo={slug} className="flex justify-center py-6">
        {screen}
      </DemoActiveProvider>
    );
  }
  return (
    <DemoActiveProvider demo={slug} className="-mx-3 overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] sm:mx-0">
      {screen}
    </DemoActiveProvider>
  );
}
