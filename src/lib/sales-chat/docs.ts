/**
 * The web app's help docs, searchable by the sales chat.
 *
 * A port of wildcat/src/lib/docs/search.ts that reads the JSON written by
 * scripts/sync-wildcat-docs.mjs instead of the site-docs folder. Scoring and
 * the synonym table are the app's own, so "stick a tank" finds "Record a tank
 * gauge" here exactly as it does for Orion inside the product.
 */

import corpus from "./wildcat-docs.json";
import { SYNONYM_GROUPS } from "./synonyms";

interface DocSection {
  slug: string;
  title: string;
  pages: { slug: string; title: string; body: string }[];
}

const SECTIONS = (corpus as { sections: DocSection[] }).sections;

/** Words that carry no signal in a question about how to do something. */
const STOPWORDS: ReadonlySet<string> = new Set([
  "a", "an", "the", "how", "do", "does", "did", "i", "you", "my", "me", "we",
  "to", "of", "in", "on", "at", "for", "with", "and", "or", "is", "are", "was",
  "can", "could", "should", "would", "what", "when", "where", "which", "who",
  "why", "it", "its", "this", "that", "there", "here", "from", "by", "as",
  "have", "has", "get", "got", "want", "need", "please", "help", "way",
]);

const FIELD_WEIGHT = { title: 8, heading: 4, section: 2, body: 1 } as const;
const MAX_BODY_HITS = 4;
const SYNONYM_WEIGHT = 0.5;

export interface DocHit {
  section: string;
  sectionTitle: string;
  slug: string;
  title: string;
  score: number;
  matched: string[];
  snippet: string;
}

interface IndexedDoc {
  section: DocSection;
  slug: string;
  title: string;
  titleText: string;
  headingText: string;
  bodyText: string;
  lines: string[];
  raw: string;
}

function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#|]/g, " ");
}

function singular(word: string): string {
  if (word.length > 3 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function fold(text: string): string {
  return text.replace(/[a-z0-9]+/g, (w) => singular(w));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

const INDEX: IndexedDoc[] = SECTIONS.flatMap((section) =>
  section.pages.map((page) => {
    const text = plain(page.body);
    const headings = page.body
      .split("\n")
      .filter((l) => l.trimStart().startsWith("#"))
      .join("\n");
    return {
      section,
      slug: page.slug,
      title: page.title,
      titleText: fold(page.title.toLowerCase()),
      headingText: fold(plain(headings).toLowerCase()),
      bodyText: fold(text.toLowerCase()),
      lines: text.split("\n").map((l) => l.trim()).filter(Boolean),
      raw: page.body,
    };
  }),
);

/** The sections, one line, for the tool description. */
export const DOC_SECTION_LIST = SECTIONS.map((s) => `${s.slug} (${s.title}, ${s.pages.length} docs)`).join("; ");

/** Every doc title by section, for the instructions. Short enough to state. */
export function docsCatalogText(): string {
  return SECTIONS.map((s) => `${s.title} [${s.slug}]: ${s.pages.map((p) => `${p.title} [${p.slug}]`).join("; ")}`).join("\n");
}

export function readDoc(section: string, slug: string): { title: string; sectionTitle: string; body: string } | undefined {
  const doc = INDEX.find((d) => d.section.slug === section && d.slug === slug);
  return doc ? { title: doc.title, sectionTitle: doc.section.title, body: doc.raw } : undefined;
}

export function hasSection(slug: string): boolean {
  return SECTIONS.some((s) => s.slug === slug);
}

interface SearchTerm {
  term: string;
  weight: number;
}

function termsFor(query: string): SearchTerm[] {
  const q = normalize(query);
  if (!q) return [];
  const typed = q.split(" ").filter((w) => w.length > 1 && !STOPWORDS.has(w)).map(singular);
  const terms = new Map<string, number>();
  for (const t of typed) terms.set(t, 1);
  const padded = ` ${q} `;
  for (const group of SYNONYM_GROUPS) {
    const hit = group.some((member) => (member.includes(" ") ? padded.includes(` ${member} `) : typed.includes(singular(member))));
    if (!hit) continue;
    for (const member of group) {
      const term = member.includes(" ") ? member : singular(member);
      if (!terms.has(term)) terms.set(term, SYNONYM_WEIGHT);
    }
  }
  return [...terms].map(([term, weight]) => ({ term, weight }));
}

function count(text: string, term: string): number {
  let n = 0;
  let from = 0;
  for (;;) {
    const at = text.indexOf(term, from);
    if (at === -1) return n;
    const before = at === 0 ? " " : text[at - 1];
    const after = text[at + term.length] ?? " ";
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) n += 1;
    from = at + term.length;
  }
}

function snippetFor(doc: IndexedDoc, terms: SearchTerm[]): string {
  const line = doc.lines.find((l) => {
    const lower = fold(l.toLowerCase());
    return terms.some((t) => count(lower, t.term) > 0);
  });
  const chosen = line ?? doc.lines[0] ?? "";
  return chosen.length > 240 ? `${chosen.slice(0, 237)}...` : chosen;
}

export function searchDocs(query: string, opts: { section?: string; limit?: number } = {}): DocHit[] {
  const terms = termsFor(query);
  if (terms.length === 0) return [];
  const limit = Math.min(Math.max(opts.limit ?? 5, 1), 20);
  const scored: DocHit[] = [];
  for (const doc of INDEX) {
    if (opts.section && doc.section.slug !== opts.section) continue;
    let score = 0;
    const matched: string[] = [];
    for (const { term, weight } of terms) {
      let termScore = 0;
      if (count(doc.titleText, term) > 0) termScore += FIELD_WEIGHT.title;
      if (count(fold(doc.section.title.toLowerCase()), term) > 0) termScore += FIELD_WEIGHT.section;
      if (count(doc.headingText, term) > 0) termScore += FIELD_WEIGHT.heading;
      termScore += Math.min(count(doc.bodyText, term), MAX_BODY_HITS) * FIELD_WEIGHT.body;
      if (termScore > 0) {
        score += termScore * weight;
        matched.push(term);
      }
    }
    if (score <= 0) continue;
    scored.push({
      section: doc.section.slug,
      sectionTitle: doc.section.title,
      slug: doc.slug,
      title: doc.title,
      score: Math.round(score * 10) / 10,
      matched,
      snippet: snippetFor(doc, terms),
    });
  }
  scored.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  return scored.slice(0, limit);
}
