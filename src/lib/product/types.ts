/**
 * The long-form content of one product page. Copy is drafted in
 * docs/product-pages-plan.md (with a source citation per card); edit there
 * first, then here.
 */
import type { FeatureSlug } from "@/lib/site";

export interface ProductCard {
  label: string;
  body: string;
}

export interface ProductStep {
  title: string;
  body: string;
}

export interface ProductSection {
  eyebrow: string;
  headline: string;
  body: string;
  cards: ProductCard[];
  /** Key into the page's screen registry (`src/components/screens/product/<slug>`). */
  screen?: string;
}

export interface ProductPageContent {
  hero: { eyebrow: string; headline: string; subhead: string };
  steps: ProductStep[];
  sections: ProductSection[];
  faq: { q: string; a: string }[];
  siblings: { slug: FeatureSlug; body: string }[];
}
