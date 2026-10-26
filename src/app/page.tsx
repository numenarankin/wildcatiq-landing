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
import { FEATURES } from "@/lib/site";

// Home-page order from docs/landing-redesign-plan.md. The hero carries the
// dashboard screen, so the dashboard section is not repeated below it.
const ORDER = ["orion", "mobile", "recon", "documents", "reports", "filings", "flow-map"] as const;

export default function Home() {
  return (
    <main className="relative">
      <SiteHeader />
      <Hero />
      {ORDER.map((slug, i) => {
        const feature = FEATURES.find((f) => f.slug === slug)!;
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
