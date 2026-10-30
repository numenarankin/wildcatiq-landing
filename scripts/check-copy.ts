/**
 * Copy budget check for the marketing pages (docs/copy-review.md, "Budgets").
 * Run: npx tsx --tsconfig tsconfig.json scripts/check-copy.ts
 * Prints every line over budget and exits 1 if there is one.
 */
import { PRODUCT_PAGES } from "@/lib/product";
import { FEATURES, LOG_ANALYSIS, SOLUTIONS } from "@/lib/site";
import { productPageVisible } from "@/lib/dev-only";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const sentences = (s: string) => s.split(/(?<=[.?])\s+(?=[A-Z"])/).filter(Boolean).length;
const BANNED = /—|&mdash;|;|!|\bitself\b|\bpowerful\b|\bseamless\b|\brobust\b|\bleverage\b/i;

/**
 * Per-page section ranges. Recon shows every feature, so it carries eight.
 * Filings is one demo and how it works, so it carries a single section.
 */
const PAGE_LIMITS: Record<string, { words: number; minSections: number; sections: number }> = {
  recon: { words: 800, minSections: 4, sections: 8 },
  filings: { words: 450, minSections: 1, sections: 1 },
};

const problems: string[] = [];
const check = (where: string, text: string, maxWords: number, maxSentences: number) => {
  if (words(text) > maxWords) problems.push(`${where}: ${words(text)} words (max ${maxWords}): ${text}`);
  if (sentences(text) > maxSentences) problems.push(`${where}: ${sentences(text)} sentences (max ${maxSentences}): ${text}`);
  if (BANNED.test(text)) problems.push(`${where}: banned punctuation or word: ${text}`);
};

for (const [slug, p] of Object.entries(PRODUCT_PAGES)) {
  // A local-only page (the flow map) is not sold, so it is not held to the budget.
  if (!productPageVisible(slug) || slug === "flow-map") continue;
  const body = [
    p.hero.headline,
    p.hero.subhead,
    ...p.steps.flatMap((s) => [s.title, s.body]),
    ...p.sections.flatMap((s) => [s.headline, s.body, ...s.cards.flatMap((c) => [c.label, c.body])]),
  ];
  const total = body.reduce((n, t) => n + words(t), 0);
  const limit = PAGE_LIMITS[slug] ?? { words: 450, minSections: 4, sections: 6 };
  if (total > limit.words) problems.push(`${slug}: ${total} words above the FAQ (max ${limit.words})`);
  if (p.sections.length < limit.minSections || p.sections.length > limit.sections)
    problems.push(`${slug}: ${p.sections.length} sections (${limit.minSections} to ${limit.sections})`);
  if (p.steps.length > 4) problems.push(`${slug}: ${p.steps.length} steps (max 4)`);
  if (p.faq.length > 6) problems.push(`${slug}: ${p.faq.length} FAQ questions (max 6)`);
  check(`${slug} hero headline`, p.hero.headline, 6, 1);
  check(`${slug} hero subhead`, p.hero.subhead, 20, 1);
  p.steps.forEach((s) => check(`${slug} step "${s.title}"`, s.body, 10, 1));
  for (const s of p.sections) {
    if (s.cards.length !== 3) problems.push(`${slug} "${s.eyebrow}": ${s.cards.length} cards (3)`);
    check(`${slug} "${s.eyebrow}" headline`, s.headline, 6, 1);
    check(`${slug} "${s.eyebrow}" body`, s.body, 20, 1);
    for (const c of s.cards) {
      check(`${slug} card label`, c.label, 5, 1);
      check(`${slug} card "${c.label}"`, c.body, 15, 1);
    }
  }
  p.faq.forEach((f) => check(`${slug} FAQ "${f.q}"`, f.a, 40, 2));
  p.siblings.forEach((s) => check(`${slug} sibling ${s.slug}`, s.body, 20, 1));
}

for (const f of [...FEATURES, LOG_ANALYSIS]) {
  if (f.slug === "flow-map") continue;
  check(`home ${f.slug}`, f.body, 35, 2);
}

for (const s of SOLUTIONS) {
  for (const x of s.sections ?? []) {
    if (x.feature === "flow-map") continue;
    check(`${s.slug} "${x.eyebrow}"`, x.body, 25, 2);
  }
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} over budget`);
  process.exit(1);
}
console.log("All copy within budget.");
