import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PricingCard } from "@/components/pricing-card";
import { Particles } from "@/components/ui/particles";
import { CheckCircleIcon } from "@/components/icons";
import { PRICING_TIERS, INCLUDED_FEATURES } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing | WildcatIQ",
  description:
    "Simple, well-based pricing for WildcatIQ. Every plan includes the full platform and a monthly allotment of AI credits.",
};

export default function PricingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Particles
        className="absolute inset-0 z-0"
        color="#888888"
        quantity={140}
        ease={20}
      />

      <div className="relative z-10">
        <SiteHeader />

        <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 lg:px-10">
          <div className="max-w-3xl">
            <h1 className="font-sans text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
              Pricing that scales with your wells
            </h1>
            <p className="mt-5 text-lg text-muted">
              Every plan includes the entire platform across Exploration,
              Production, Operations, and Finance, plus a monthly allotment of
              AI credits. Pick the band that matches your well count.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier) => (
              <PricingCard key={tier.label} tier={tier} />
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="font-sans text-lg font-medium tracking-tight">
              Included in every plan
            </h2>
            <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDED_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <CheckCircleIcon
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted"
                    aria-hidden
                  />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              1 AI credit is $0.01 of usage. Unused credits don&apos;t roll
              over. Top-ups are available any time inside the app.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
