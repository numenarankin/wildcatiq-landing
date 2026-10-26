import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow, ClosingCta, Faq } from "@/components/home/sections";
import { ProductSectionBlock } from "@/components/product/product-section";
import { FeatureScreen } from "@/components/screens";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/icons";
import { BOOK_DEMO_URL, SIGN_UP_URL } from "@/lib/links";
import { FEATURES, getFeature } from "@/lib/site";
import { PRODUCT_PAGES } from "@/lib/product";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) return {};
  return {
    title: `${feature.label} | WildcatIQ`,
    description: PRODUCT_PAGES[feature.slug].hero.subhead,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) notFound();

  const content = PRODUCT_PAGES[feature.slug];
  const { hero } = content;
  const siblings = content.siblings.map((s) => ({ ...s, feature: getFeature(s.slug)! }));

  return (
    <main>
      <SiteHeader />

      <section className="pt-32 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">{hero.headline}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">{hero.subhead}</p>
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
            <FeatureScreen slug={feature.slug} />
          </div>
        </Container>
      </section>

      {content.steps.length > 0 ? (
        <section className="py-20 sm:py-24">
          <Container>
            <Eyebrow>How it works</Eyebrow>
            <ol className={`mt-8 grid gap-5 sm:grid-cols-2 ${content.steps.length >= 5 ? "lg:grid-cols-5" : content.steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {content.steps.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-border p-6">
                  <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="mt-4 text-lg font-medium tracking-tight">{s.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {content.sections.map((section, i) => (
        <ProductSectionBlock key={section.eyebrow} slug={feature.slug} section={section} index={i} />
      ))}

      {content.faq.length > 0 ? <Faq items={content.faq} /> : null}

      {siblings.length > 0 ? (
        <section className="border-t border-border bg-muted py-16">
          <Container>
            <Eyebrow>Works with</Eyebrow>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map((r) => (
                <Link key={r.slug} href={`/product/${r.slug}`} className="rounded-xl border border-border bg-background p-5 transition-colors hover:bg-black/[0.02]">
                  <div className="font-semibold">{r.feature.label}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
