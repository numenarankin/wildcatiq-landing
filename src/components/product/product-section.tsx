"use client";

/**
 * One section of a product page: eyebrow, headline, one sentence, the cards,
 * and the real app screen for that part of the product. Desktop screens sit
 * full width under the copy at one size, like the home page; a phone screen
 * sits beside its copy.
 */
import type { FeatureSlug } from "@/lib/site";
import type { ProductSection } from "@/lib/product/types";
import { useSectionScreen } from "@/components/screens/product";
import { Container, Eyebrow } from "@/components/home/sections";
import { DemoActiveProvider } from "@/components/screens/demo-active";

function Cards({ cards, columns }: { cards: ProductSection["cards"]; columns: string }) {
  return (
    <dl className={`grid gap-x-8 gap-y-6 ${columns}`}>
      {cards.map((c) => (
        <div key={c.label} className="border-t border-border pt-4">
          <dt className="text-base font-semibold tracking-tight">{c.label}</dt>
          <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{c.body}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductSectionBlock({ slug, section, index }: { slug: FeatureSlug; section: ProductSection; index: number }) {
  const entry = useSectionScreen(slug, section.screen);
  const heading = (
    <div className="max-w-3xl">
      <Eyebrow>
        <span className="font-mono text-muted-foreground/70">{String(index + 1).padStart(2, "0")}</span>
        <span className="ml-3">{section.eyebrow}</span>
      </Eyebrow>
      <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{section.headline}</h2>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{section.body}</p>
    </div>
  );

  if (entry?.phone) {
    const Phone = entry.Component;
    return (
      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
            <div>
              {heading}
              <div className="mt-10">
                <Cards cards={section.cards} columns="sm:grid-cols-2" />
              </div>
            </div>
            {/* The demo runs while it is on screen, so its loop starts when it is reached. */}
            <div data-screen={section.screen}>
              <DemoActiveProvider demo={`${slug}:${section.screen}`} className="flex justify-center">
                <Phone />
              </DemoActiveProvider>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const Screen = entry?.Component;
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <Container>
        {heading}
        <div className="mt-10">
          <Cards cards={section.cards} columns="sm:grid-cols-2 lg:grid-cols-3" />
        </div>
        {Screen ? (
          // The demo runs while it is on screen, so its loop starts when it is reached.
          <div data-screen={section.screen}>
            <DemoActiveProvider
              demo={`${slug}:${section.screen}`}
              className="mt-12 -mx-3 overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] sm:mx-0"
            >
              <Screen />
            </DemoActiveProvider>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
