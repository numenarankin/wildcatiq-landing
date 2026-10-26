/**
 * Copy the web app's help docs into this repo for the sales chat.
 *
 * The landing deploys on its own, so it cannot read `../wildcat/site-docs` at
 * runtime. This script walks that folder and writes one JSON file the chat
 * route imports, plus a copy of the synonym table the search uses. Run it
 * whenever the docs change, then commit the output:
 *
 *   npm run docs:sync
 *
 * The website's own privacy policy (`wildcat-privacy-policy.md`, the file the
 * /privacy page renders) is added as a final "Website" section so the chat can
 * answer data-handling questions from the policy itself.
 */

import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WILDCAT = path.resolve(ROOT, "..", "wildcat");
const DOCS_DIR = path.join(WILDCAT, "site-docs");
const OUT = path.join(ROOT, "src/lib/sales-chat/wildcat-docs.json");

/** Section names and reading order, as the app's docs sidebar has them. */
const SECTION_TITLES = new Map([
  ["getting-started", "Getting started"],
  ["wells-and-leases", "Wells and leases"],
  ["daily-production-entry", "Daily production entry"],
  ["tanks-meters-batteries", "Tanks, meters and batteries"],
  ["well-tests-and-allocation", "Well tests and allocation"],
  ["saltwater-disposal", "Saltwater disposal"],
  ["finance", "Finance"],
  ["reports", "Reports"],
  ["orion-ai", "Orion"],
  ["documents-and-notes", "Documents and notes"],
  ["projects", "Projects"],
  ["agenda", "Agenda"],
  ["working-with-your-team", "Working with your team"],
  ["people-and-access", "People and access"],
  ["prospecting-with-recon", "Prospecting with Recon"],
  ["your-account", "Your account"],
  ["getting-help", "Getting help"],
]);

function titleOf(markdown, file) {
  const first = markdown.split("\n", 1)[0].trim();
  if (!first.startsWith("# ")) throw new Error(`${file} does not open with an H1`);
  return first.slice(2).trim();
}

const humanize = (slug) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

const dirs = (await readdir(DOCS_DIR, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
const ordered = [...SECTION_TITLES.keys()].filter((s) => dirs.includes(s)).concat(dirs.filter((d) => !SECTION_TITLES.has(d)).sort());

const sections = [];
for (const slug of ordered) {
  const title = SECTION_TITLES.get(slug) ?? humanize(slug);
  if (!SECTION_TITLES.has(slug)) console.warn(`section "${slug}" is not in SECTION_TITLES; using "${title}"`);
  const files = (await readdir(path.join(DOCS_DIR, slug))).filter((f) => f.endsWith(".md")).sort();
  const pages = [];
  for (const file of files) {
    const body = await readFile(path.join(DOCS_DIR, slug, file), "utf8");
    pages.push({ slug: file.replace(/\.md$/, ""), title: titleOf(body, `${slug}/${file}`), body });
  }
  sections.push({ slug, title, pages });
}

const policy = await readFile(path.join(ROOT, "wildcat-privacy-policy.md"), "utf8");
sections.push({
  slug: "website",
  title: "Website",
  pages: [{ slug: "privacy-policy", title: titleOf(policy, "wildcat-privacy-policy.md"), body: policy }],
});

await writeFile(OUT, JSON.stringify({ sections }, null, 1), "utf8");

const SYN = path.join(ROOT, "src/lib/sales-chat/synonyms.ts");
const syn = await readFile(path.join(WILDCAT, "src/lib/docs/synonyms.ts"), "utf8");
await writeFile(SYN, `// Copied verbatim from wildcat/src/lib/docs/synonyms.ts by scripts/sync-wildcat-docs.mjs. Edit it there.\n${syn}`, "utf8");
void copyFile;

const n = sections.reduce((a, s) => a + s.pages.length, 0);
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${sections.length} sections, ${n} docs.`);
