/**
 * Site content catalog. Drives the Product and Solutions menus, the home-page
 * feature sections and the product and solutions pages. Copy comes from
 * docs/landing-copy.md; edit there first, then here.
 */

export type FeatureSlug =
  | "dashboard"
  | "orion"
  | "mobile"
  | "recon"
  | "documents"
  | "reports"
  | "filings"
  | "flow-map";

export interface Feature {
  slug: FeatureSlug;
  /** Menu label. */
  label: string;
  /** One line under the menu label. */
  tagline: string;
  /** Section eyebrow on the home page. */
  eyebrow: string;
  /** Home-page section headline. */
  headline: string;
  /** Home-page section body. */
  body: string;
}

export const FEATURES: readonly Feature[] = [
  {
    slug: "dashboard",
    label: "Dashboard",
    tagline: "The state of the company, every morning",
    eyebrow: "Dashboard",
    headline: "Your whole operation, every morning.",
    body: "Orion writes a short brief of the wells that moved, the week's deadlines and what the pumpers wrote. Oil, gas and net revenue per day with the one-day and thirty-day change. Fleet decline. Every lease trending, with its wells underneath.",
  },
  {
    slug: "orion",
    label: "Orion",
    tagline: "An analyst that knows your wells and the state's record",
    eyebrow: "Orion",
    headline: "An analyst, not a chatbot.",
    body: "Ask it what a neighbor's new permit means for your well and it pulls the permit, the operator, their offset wells and your own production, fits the declines, draws the comparison and tells you what to do about it. It reasons over the public record and your data together: allocation, decline, economics at strip, RRC rules, SWD and UIC. It reads the page you are on, remembers your wells and the way you like things done, and anything it changes waits for your OK.",
  },
  {
    slug: "mobile",
    label: "Mobile app",
    tagline: "Pumpers log it once, nobody keys it twice",
    eyebrow: "Mobile app",
    headline: "Pumpers log it once. Nobody keys it twice.",
    body: "Gauge, meter and SWD readings go in from the lease in seconds, opened already filled from yesterday so you only change what moved. Scan a run ticket and Orion fills the form. Dictate notes. Work offline and sync when the signal returns. Charts, logs, comments and team messages are on the phone too.",
  },
  {
    slug: "recon",
    label: "Recon",
    tagline: "The whole state on your map",
    eyebrow: "Recon",
    headline: "The whole state on one map.",
    body: "One million Texas wellbores, with their leases, permits, orphan wells and operators from the RRC, searchable and clustered. Market rollups by district and county. Pick your counties and get an email when a permit is filed or approved or a new well appears, in Beta.",
  },
  {
    slug: "documents",
    label: "Documents",
    tagline: "Your paperwork becomes your records",
    eyebrow: "Documents",
    headline: "Your paperwork becomes your records.",
    body: "Drop in a run ticket, purchaser statement, vendor invoice, gauge sheet or last year's production report. Orion reads it, builds the rows, flags duplicates and hands you an approval card. Nothing is saved until you approve it. PDFs and photos are read and Orion can search them.",
  },
  {
    slug: "reports",
    label: "Reports",
    tagline: "Generated and emailed on your schedule",
    eyebrow: "Reports",
    headline: "Reports that write themselves and send themselves.",
    body: "Twenty-four reports, from the daily digest to production variance, tanks called in and RRC reconciliation. PDF, Excel or CSV. Schedule the digests and production reports once and they arrive by email as PDFs. Orion will read any of them aloud.",
  },
  {
    slug: "filings",
    label: "Filings",
    tagline: "Form PR from the data you already have",
    eyebrow: "Filings",
    headline: "Form PR from the data you already have.",
    body: "The filing is generated from your gauges, run tickets and meter readings, checked against the RRC's rules, reviewed on screen and downloaded in the RRC's EDI format. Form PR is in Beta.",
  },
  {
    slug: "flow-map",
    label: "Flow map",
    tagline: "See how the oil actually moves",
    eyebrow: "Facilities",
    headline: "See how the oil actually moves.",
    body: "Wells to tanks to meters to SWD, drawn per lease and animated by commodity. Filter to oil, gas or water. Every card carries its volume. Click a facility for its connections. Add a facility or pull a wire without leaving the map.",
  },
];

export function getFeature(slug: string): Feature | undefined {
  return FEATURES.find((f) => f.slug === slug);
}

export type SolutionSlug =
  | "owner-operator"
  | "office-manager"
  | "pumper"
  | "1-24-wells"
  | "25-99-wells"
  | "100-plus-wells";

export interface Solution {
  slug: SolutionSlug;
  group: "By role" | "By size";
  label: string;
  headline: string;
  body: string;
  /** Features to show on the solution page, in order. */
  features: FeatureSlug[];
}

export const SOLUTIONS: readonly Solution[] = [
  {
    slug: "owner-operator",
    group: "By role",
    label: "Owner-operator",
    headline: "Run the company from your phone.",
    body: "The morning brief, every lease trending, Recon for what the neighbors are doing, and Form PR handled. Ask Orion anything about your own wells.",
    features: ["dashboard", "orion", "recon", "filings"],
  },
  {
    slug: "office-manager",
    group: "By role",
    label: "Office manager",
    headline: "Stop retyping the field.",
    body: "Pumper readings arrive already entered. Statements, invoices and tickets become ledger rows you approve. Reports go out on schedule. The monthly PR comes from the field data.",
    features: ["documents", "mobile", "reports", "filings"],
  },
  {
    slug: "pumper",
    group: "By role",
    label: "Pumper",
    headline: "Log it and get back in the truck.",
    body: "Gauge and meter readings in seconds, prefilled from yesterday so you only change what moved, scan the ticket, dictate the note. Works without signal.",
    features: ["mobile", "orion", "flow-map"],
  },
  {
    slug: "1-24-wells",
    group: "By size",
    label: "1 to 24 wells",
    headline: "Everything in one place from the first well.",
    body: "Import your leases and wells from the RRC, log readings on the phone and let Orion keep the books straight.",
    features: ["dashboard", "mobile", "documents", "orion"],
  },
  {
    slug: "25-99-wells",
    group: "By size",
    label: "25 to 99 wells",
    headline: "Growing without growing the office.",
    body: "Several pumpers, several purchasers, one ledger. Reports and filings run on schedule.",
    features: ["documents", "reports", "filings", "flow-map"],
  },
  {
    slug: "100-plus-wells",
    group: "By size",
    label: "100+ wells",
    headline: "Field operations at scale.",
    body: "Per-well pricing, permissions down to the tab, and an assistant that knows every lease.",
    features: ["dashboard", "orion", "recon", "reports"],
  },
];

export function getSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}

export const COMPARISON_ROWS: readonly { label: string; us: string; them: string }[] = [
  { label: "Field readings", us: "Entered once on the phone", them: "Texted, then retyped" },
  { label: "Paperwork", us: "Read by Orion, approved by you", them: "Keyed by hand" },
  { label: "Reports", us: "Generated and emailed on schedule", them: "Built in Excel every month" },
  { label: "Form PR", us: "Generated from your field data", them: "Typed into the RRC site" },
  { label: "The state's data", us: "On your map, with alerts", them: "Another browser tab" },
  { label: "The bill", us: "One", them: "Several" },
];

export const SECURITY_POINTS: readonly string[] = [
  "Never used to train a model.",
  "Every organization's rows are isolated at the database level.",
  "Permissions are set per person, down to the tab.",
  "Orion cannot write anything without your approval.",
];

/** The six points on the Security page. Also what the sales chat says about data handling. */
export const SECURITY_DETAILS: readonly { title: string; body: string }[] = [
  {
    title: "Never used to train a model.",
    body: "Your readings, statements and documents are sent to the model only to answer your request or read your file. They are not retained for training by us or by the model provider.",
  },
  {
    title: "Isolated at the database level.",
    body: "Every row belongs to one organization and the database enforces that on every query, not just the application. One operator cannot read another's data through any path.",
  },
  {
    title: "Permissions down to the tab.",
    body: "Each person on your team has a permission set that decides which pages, tabs and actions they can reach. A pumper sees the wells they run. The bookkeeper sees revenue and nothing else.",
  },
  {
    title: "Orion cannot write on its own.",
    body: "Every change Orion proposes, from a gauge reading to a revenue line, arrives as an approval card. Nothing is saved until a person accepts it, and the row records who approved it.",
  },
  {
    title: "Encrypted in transit and at rest.",
    body: "All traffic is TLS. Files and database storage are encrypted at rest. Sign-in supports email verification and password recovery through a verified address.",
  },
  {
    title: "Your data leaves when you do.",
    body: "Reports export to PDF, Excel and CSV at any time. Files download as you uploaded them, and a Dropbox folder can feed your files automatically.",
  },
];

export const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Do I have to change how my pumpers work?",
    a: "No. They log the same readings they log today, on a phone instead of a sheet.",
  },
  {
    q: "What if Orion gets something wrong?",
    a: "It cannot save anything on its own. Every change is a card you accept, edit or reject.",
  },
  {
    q: "How long does the import take?",
    a: "Most operators see their leases and history the same day they enter their P-5 number.",
  },
  {
    q: "Who can see my data?",
    a: "Your team, with the permissions you set. Nobody else.",
  },
  {
    q: "Does it work without signal?",
    a: "Readings and notes are kept on the phone and sync when it comes back.",
  },
  {
    q: "What does it cost?",
    a: "Four bands by well count. See pricing.",
  },
];

export const CREDITS_FAQ: readonly { q: string; a: string }[] = [
  {
    q: "What uses Orion credits?",
    a: "Chat, voice, document scans and the morning brief. One credit is one cent of usage.",
  },
  {
    q: "What happens when they run out?",
    a: "Orion pauses. Everything else keeps working. Top up inside the app and it picks back up.",
  },
  {
    q: "Do unused credits roll over?",
    a: "No. Each billing period starts with the plan's allotment.",
  },
];
