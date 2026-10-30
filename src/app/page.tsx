import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Hero,
  FeatureSection,
  GettingStarted,
  Comparison,
  PricingSummary,
  Security,
  Faq,
  ClosingCta,
} from "@/components/home/sections";
import { FEATURES, LOG_ANALYSIS } from "@/lib/site";
import { productPageVisible } from "@/lib/dev-only";

// Home-page order from docs/landing-redesign-plan.md. The hero carries the
// dashboard screen, so the dashboard section is not repeated below it. Log
// analysis took the Documents slot; Documents keeps its product page.
const ORDER = ["orion", "mobile", "recon", "log-analysis", "reports", "filings", "flow-map"] as const;

export default function Home() {
  return (
    <main className="relative">
      <SiteHeader />
      <Hero />
      {/* A section whose product page is local-only (the flow map) is local-only too. */}
      {ORDER.filter((slug) => slug === "log-analysis" || productPageVisible(slug)).map((slug, i) => {
        const feature = slug === "log-analysis" ? LOG_ANALYSIS : FEATURES.find((f) => f.slug === slug)!;
        return <FeatureSection key={slug} id={slug} feature={feature} flip={i % 2 === 1} />;
      })}
      <GettingStarted />
      <Comparison />
      <PricingSummary />
      <Security />
      <Faq />
      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
