/**
 * The sales assistant's instructions, generated from the same catalogs that
 * render the site. The chat can only say what the pages say: a price, a
 * feature or a security claim changes in site.ts or pricing.ts and both the
 * page and the assistant pick it up. Nothing here is written by hand except
 * the operating rules.
 */

import {
  COMPARISON_ROWS,
  CREDITS_FAQ,
  FAQ,
  FEATURES,
  SECURITY_DETAILS,
  SOLUTIONS,
} from "@/lib/site";
import { PRODUCT_PAGES } from "@/lib/product";
import { productPageVisible } from "@/lib/dev-only";
import { INCLUDED_FEATURES, PRICING_TIERS, formatCredits, formatUsd } from "@/lib/pricing";
import { docsCatalogText } from "@/lib/sales-chat/docs";

const RULES = `You are Orion, the assistant inside WildcatIQ, answering questions for visitors on the WildcatIQ website. WildcatIQ is made by Wildcat Labs for independent oil and gas operators, mostly in Texas.

How to behave
- You are an AI. Say so plainly if asked, and never claim to be a person.
- Answer from the facts below and from the help docs. When the visitor asks how something is done in the app, what a feature does in detail, or how their data is handled, call search_docs and then read_doc before answering, and answer from the doc's words. If neither the facts nor the docs cover it, say you do not know and offer a demo with the book_demo tool. Never invent prices, customers, numbers, integrations or timelines.
- The docs describe the app for people already using it. For a visitor, summarize what the doc shows is possible in a few sentences; do not paste long step lists unless they ask for the steps.
- Keep answers short: two to four sentences, plain words, no jargon the visitor did not use. Many visitors are experienced operators who are new to software. Explain steps concretely.
- Stay on WildcatIQ. For anything unrelated, say in one sentence that you can only help with WildcatIQ and offer to answer a question about it.
- Do not disparage other products by name. The comparison below is the only contrast you draw.
- book_demo, start_signup and request_followup each render a card the visitor can act on. Use them when they fit: book_demo when the visitor wants to see the product, talk to a person, or asks something you cannot answer; start_signup when they are ready to try it; request_followup when they want someone to contact them, after you have their name and email. Use at most one tool per reply and do not repeat a tool the visitor already declined.
- Do not paste URLs into your text. The tools render the links.
- Write in plain sentences. No headings. Bullet lists only for three or more parallel items. No em dashes.`;

function featureFacts(): string {
  // Only what the site sells: a local-only product page (the flow map) is not offered.
  return FEATURES.filter((f) => productPageVisible(f.slug)).map((f) => {
    const page = PRODUCT_PAGES[f.slug];
    const cards = page.sections.flatMap((s) => s.cards.map((c) => `  - ${c.label} ${c.body}`));
    const faq = page.faq.map((q) => `  Q: ${q.q} A: ${q.a}`);
    return [`${f.label}: ${page.hero.headline} ${page.hero.subhead} ${f.body}`, ...cards, ...faq].join("\n");
  }).join("\n\n");
}

function solutionFacts(): string {
  return SOLUTIONS.map((s) => `${s.label} (${s.group.toLowerCase()}): ${s.headline} ${s.body}`).join("\n");
}

function pricingFacts(): string {
  const tiers = PRICING_TIERS.map((t) => {
    const price = t.monthlyUsd !== null ? `${formatUsd(t.monthlyUsd)} per month` : `${t.priceLabel} per month`;
    return `- ${t.wells}: ${price}, ${formatCredits(t.monthlyCredits)} Orion credits each month.`;
  });
  return [
    "Pricing is by well count. Every plan includes the whole platform.",
    ...tiers,
    "Included in every plan:",
    ...INCLUDED_FEATURES.map((x) => `- ${x}`),
    "Orion credits:",
    ...CREDITS_FAQ.map((f) => `- ${f.q} ${f.a}`),
  ].join("\n");
}

function comparisonFacts(): string {
  return COMPARISON_ROWS.map((r) => `- ${r.label}: WildcatIQ: ${r.us}. Without it: ${r.them}.`).join("\n");
}

function securityFacts(): string {
  return SECURITY_DETAILS.map((s) => `- ${s.title} ${s.body}`).join("\n");
}

function faqFacts(): string {
  return FAQ.map((f) => `- ${f.q} ${f.a}`).join("\n");
}

const GETTING_STARTED = `Getting started
- Enter the operator's P-5 number and WildcatIQ finds its leases and wells in the Texas RRC record and imports them with production history. Most operators see their leases and history the same day.
- Review the import: leases, wells and facilities, ready to accept or edit.
- Drop in old statements and gauge sheets and Orion backfills the rest.
- There is a free demo on the calendar and sign-up is self-serve on the web app.`;

/** The full instruction string. Static per deploy, so it caches across turns. */
export function buildSalesInstructions(): string {
  return [
    RULES,
    "",
    "Facts about WildcatIQ",
    "",
    "Features",
    featureFacts(),
    "",
    "Who it is for",
    solutionFacts(),
    "",
    GETTING_STARTED,
    "",
    "Pricing",
    pricingFacts(),
    "",
    "Compared with spreadsheets, texts and the RRC portal",
    comparisonFacts(),
    "",
    "Security and data handling",
    securityFacts(),
    "",
    "Questions visitors ask",
    faqFacts(),
    "",
    "Help docs available through search_docs and read_doc (section [slug]: title [slug])",
    docsCatalogText(),
  ].join("\n");
}

/** One line telling the model which page the visitor is reading. */
export function describePage(pathname: string): string {
  if (pathname === "/" || pathname === "") return "the home page";
  if (pathname === "/pricing") return "the pricing page";
  if (pathname === "/security") return "the security page";
  const product = pathname.match(/^\/product\/([a-z0-9-]+)/)?.[1];
  if (product) {
    const f = FEATURES.find((x) => x.slug === product);
    return f ? `the ${f.label} product page` : "a product page";
  }
  const solution = pathname.match(/^\/solutions\/([a-z0-9-]+)/)?.[1];
  if (solution) {
    const s = SOLUTIONS.find((x) => x.slug === solution);
    return s ? `the "${s.label}" solutions page` : "a solutions page";
  }
  return "the site";
}
