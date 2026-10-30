import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow, FeatureSection, ClosingCta } from "@/components/home/sections";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/icons";
import { BOOK_DEMO_URL, SIGN_UP_URL } from "@/lib/links";
import { SOLUTIONS, getFeature, getSolution } from "@/lib/site";
import { DEV_ONLY_VISIBLE, productPageVisible } from "@/lib/dev-only";
import { SolutionSectionBlock } from "@/components/screens/solutions";

/** The topbar lists the by-role solutions; the by-size pages are local-only. */
const visible = (s: (typeof SOLUTIONS)[number]) => DEV_ONLY_VISIBLE || s.group === "By role";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return SOLUTIONS.filter(visible).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution) return {};
  return {
    title: `WildcatIQ for the ${solution.label.toLowerCase()}`,
    description: solution.body,
  };
}

export default async function SolutionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution || !visible(solution)) notFound();

  return (
    <main>
      <SiteHeader />

      <section className="pb-8 pt-32 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>For {solution.audience}</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">{solution.headline}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">{solution.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={SIGN_UP_URL} external size="lg">
                Get started <ArrowIcon className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href={BOOK_DEMO_URL} external variant="outline" size="lg">
                Book a demo
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* A section from a local-only product page (the flow map) is local-only too. */}
      {solution.sections
        ?.filter((section) => !section.feature || productPageVisible(section.feature))
        .map((section) => <SolutionSectionBlock key={section.screen} section={section} />)}

      {!solution.sections && solution.features.map((slug, i) => {
        const feature = getFeature(slug);
        if (!feature) return null;
        return <FeatureSection key={slug} feature={feature} flip={i % 2 === 1} />;
      })}

      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
