import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { ScrollDemo } from "@/components/scroll-demo";
import { Explainer } from "@/components/explainer";
import { PricingSection } from "@/components/pricing-section";
import { BookDemoCta } from "@/components/book-demo-cta";
import { Particles } from "@/components/ui/particles";

export default function Home() {
  return (
    <main className="relative min-h-dvh">
      <SiteHeader />

      {/* Hero region - overflow-hidden is scoped here so it doesn't break the
          position: sticky used by ScrollDemo further down the page. */}
      <div className="relative overflow-hidden">
        <Particles
          className="absolute inset-0 z-0"
          color="#888888"
          quantity={140}
          ease={20}
        />
        <div className="relative z-10">
          <Hero />
        </div>
      </div>

      <ScrollDemo />
      <Explainer />
      <PricingSection />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="border-t border-white/10" />
      </div>
      <BookDemoCta />
    </main>
  );
}
