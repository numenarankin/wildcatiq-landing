import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingCard } from "@/components/pricing-card";
import { Container, Eyebrow, Faq, ClosingCta } from "@/components/home/sections";
import { CheckCircleIcon } from "@/components/icons";
import { PRICING_TIERS, INCLUDED_FEATURES } from "@/lib/pricing";
import { CREDITS_FAQ } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing | WildcatIQ",
  description:
    "Priced to scale with your operation. Every plan includes the whole platform and a monthly allotment of Orion credits.",
};

export default function PricingPage() {
  return (
    <main>
      <SiteHeader />

      <section className="pb-20 pt-32 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">Priced to scale with your operation.</h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Four bands by well count. Every plan includes the whole platform, production, field, regulatory and intelligence, plus a
              monthly allotment of Orion credits.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier) => (
              <PricingCard key={tier.label} tier={tier} />
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-border bg-muted p-8">
            <h2 className="text-lg font-medium tracking-tight">Included in every plan</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {INCLUDED_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              One Orion credit is one cent of usage. Top-ups are available any time inside the app.
            </p>
          </div>
        </Container>
      </section>

      <Faq items={CREDITS_FAQ} />
      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
