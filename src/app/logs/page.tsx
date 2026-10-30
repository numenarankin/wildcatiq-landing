import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow, ClosingCta } from "@/components/home/sections";
import { FeatureScreen } from "@/components/screens";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/icons";
import { BOOK_DEMO_URL, SIGN_UP_URL } from "@/lib/links";
import { LOG_ANALYSIS } from "@/lib/site";

export const metadata: Metadata = {
  title: `${LOG_ANALYSIS.label} | WildcatIQ`,
  description: LOG_ANALYSIS.body,
};

/** Log analysis gets its own page: the hero and the log review demo, nothing else. */
export default function LogAnalysisPage() {
  return (
    <main>
      <SiteHeader />

      <section className="pb-20 pt-32 sm:pb-28 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>{LOG_ANALYSIS.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">{LOG_ANALYSIS.headline}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">{LOG_ANALYSIS.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={SIGN_UP_URL} external size="lg">
                Get started <ArrowIcon className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href={BOOK_DEMO_URL} external variant="outline" size="lg">
                Book a demo
              </ButtonLink>
            </div>
          </div>
          <div className="mt-14 sm:mt-20">
            <FeatureScreen slug="log-analysis" eager />
          </div>
        </Container>
      </section>

      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
