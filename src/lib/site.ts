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

/** A home-page section: a feature, or a section that has no product page of its own. */
export type HomeSectionSlug = FeatureSlug | "log-analysis";

export interface HomeSection extends Omit<Feature, "slug"> {
  slug: HomeSectionSlug;
  /** Where the section's "More about" link goes; defaults to the product page of the same slug. */
  href?: string;
}

/** Log analysis has its own page (`app/logs`): the hero and the log review demo. */
export const LOG_ANALYSIS: HomeSection = {
  slug: "log-analysis",
  label: "Log analysis",
  tagline: "Tops and pay from the LAS itself",
  eyebrow: "Log analysis",
  headline: "Tops and pay from the LAS.",
  body: "Open a LAS log and it draws in the browser. Orion picks the tops and pay from the file and names the zone worth shooting.",
  href: "/logs",
};

export const FEATURES: readonly Feature[] = [
  {
    slug: "dashboard",
    label: "Dashboard",
    tagline: "The state of the company, every morning",
    eyebrow: "Dashboard",
    headline: "Your whole operation, every morning.",
    body: "Every morning, Orion tells you which wells moved and what is due this week. Oil, gas, revenue and decline for every lease, on one page.",
  },
  {
    slug: "orion",
    label: "Orion",
    tagline: "An analyst that knows your wells and the state's record",
    eyebrow: "Orion",
    headline: "An analyst, not a chatbot.",
    body: "Ask what a neighbor's permit means for your well and Orion pulls the record, runs the numbers and tells you. Nothing changes without your OK.",
  },
  {
    slug: "mobile",
    label: "Mobile app",
    tagline: "Pumpers log it once, nobody keys it twice",
    eyebrow: "Mobile app",
    headline: "Pumpers log it once. Nobody keys it twice.",
    body: "Pumpers log gauges, meters and run tickets from the lease, even with no signal. The office never retypes a reading.",
  },
  {
    slug: "recon",
    label: "Recon",
    tagline: "The whole state on your map",
    eyebrow: "Recon",
    headline: "The whole state on one map.",
    body: "Every well, permit and operator in Texas on one map, with the filed record a click away. Permit alerts by email are in Beta.",
  },
  {
    slug: "documents",
    label: "Documents",
    tagline: "Your paperwork becomes your records",
    eyebrow: "Documents",
    headline: "Your paperwork becomes your records.",
    body: "Drop in a ticket, statement, invoice or gauge sheet and Orion turns it into records. You approve them instead of typing them.",
  },
  {
    slug: "reports",
    label: "Reports",
    tagline: "Generated and emailed on your schedule",
    eyebrow: "Reports",
    headline: "Reports that send themselves.",
    body: "Twenty-four reports from your own data, ready every morning. Read them, download them, or have them emailed on your schedule.",
  },
  {
    slug: "filings",
    label: "Filings",
    tagline: "Form PR from the data you already have",
    eyebrow: "Filings",
    headline: "Form PR from the data you already have.",
    body: "Your monthly Form PR, built from the gauges and tickets you already log and checked against the RRC's rules. In Beta.",
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

/**
 * The topbar's Product menu (and the footer's Product column), in home-page
 * order. Flow map has no slot: log analysis took it, and the flow-map page is
 * local-only (`productPageVisible`). Documents left the home page but keeps
 * its page, so it closes the list.
 */
const PRODUCT_MENU_ORDER: readonly HomeSectionSlug[] = [
  "dashboard",
  "orion",
  "mobile",
  "recon",
  "log-analysis",
  "reports",
  "filings",
  "documents",
];

export const PRODUCT_MENU: readonly HomeSection[] = PRODUCT_MENU_ORDER.map((slug) =>
  slug === "log-analysis" ? LOG_ANALYSIS : FEATURES.find((f) => f.slug === slug)!,
);

/** Where a menu item or home section links. */
export function sectionHref(section: HomeSection): string {
  return section.href ?? `/product/${section.slug}`;
}

/** Whether the topbar lists this product page. */
export function productPageListed(slug: string): boolean {
  return PRODUCT_MENU.some((m) => !m.href && m.slug === slug);
}

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
  /** Who the page is for, as its eyebrow reads it: "For pumpers". */
  audience: string;
  label: string;
  headline: string;
  body: string;
  /** Features to show on the solution page, in order, as the home page draws them. */
  features: FeatureSlug[];
  /** The role pages' own sections. When present they replace `features`. */
  sections?: SolutionSection[];
}

/** A demo screen a solution page can show (`src/components/screens/solutions/index.tsx`). */
export type SolutionScreenKey =
  | "dashboard"
  | "recon"
  | "reports"
  | "flow-map"
  | "filings"
  | "well-page"
  | "tasks"
  | "calendar"
  | "invoice"
  | "orion-owner"
  | "orion-office"
  | "orion-facilities"
  | "phone-dashboard"
  | "phone-gauge"
  | "phone-tickets"
  | "phone-comments"
  | "phone-well-info"
  | "phone-well-tests"
  | "phone-orion";

/** One section of a role page: its own copy and demo, linking to the product page it comes from. */
export interface SolutionSection {
  screen: SolutionScreenKey;
  eyebrow: string;
  headline: string;
  body: string;
  /** The product page behind the section, for its "More about" link. */
  feature?: FeatureSlug;
}

/** A section that reuses a feature's home-page copy as is. */
function featureSection(slug: FeatureSlug, screen: SolutionScreenKey): SolutionSection {
  const f = FEATURES.find((x) => x.slug === slug)!;
  return { screen, eyebrow: f.eyebrow, headline: f.headline, body: f.body, feature: slug };
}

export const SOLUTIONS: readonly Solution[] = [
  {
    slug: "owner-operator",
    audience: "owner-operators",
    group: "By role",
    label: "Owner-operator",
    headline: "Run the company from your phone.",
    body: "The morning brief, every lease trending, the same numbers on the phone, and Recon for what the neighbors are doing. Ask Orion anything about your own wells.",
    features: ["dashboard", "orion", "recon", "mobile"],
    sections: [
      featureSection("dashboard", "dashboard"),
      {
        screen: "phone-dashboard",
        eyebrow: "Mobile app",
        headline: "The owner's numbers, in the truck.",
        body: "Company oil and gas a day, every lease with its net revenue, and the full chart on every facility, computed on the phone.",
        feature: "mobile",
      },
      {
        screen: "orion-owner",
        eyebrow: "Orion",
        headline: "Ask where the money went.",
        body: "Ask which lease made the least per barrel and Orion shows the gap and why, from your own statements.",
        feature: "orion",
      },
      {
        screen: "well-page",
        eyebrow: "Wells",
        headline: "Every well on one page.",
        body: "Every well's production, decline and estimated revenue on one page, with its service, tests, invoices and files a tab away.",
      },
      featureSection("reports", "reports"),
      featureSection("flow-map", "flow-map"),
      {
        screen: "tasks",
        eyebrow: "Tasks",
        headline: "Hand out the work.",
        body: "Field and office work on one board, assigned to your people, with due dates on the calendar.",
      },
      featureSection("recon", "recon"),
    ],
  },
  {
    slug: "office-manager",
    audience: "office managers",
    group: "By role",
    label: "Office manager",
    headline: "Approve the paperwork. Skip the typing.",
    body: "Drop in a vendor invoice and it is read, filed to Invoices, and the vendor and the well's service history follow for your approval. Form PR comes from the field data. Reports go out on schedule. Deadlines and tasks share one calendar.",
    features: ["documents", "filings", "reports", "orion"],
    sections: [
      {
        screen: "invoice",
        eyebrow: "Documents",
        headline: "One invoice, filed everywhere it belongs.",
        body: "Upload a vendor invoice and it is filed, with the new vendor and the well's service history ready to approve.",
        feature: "documents",
      },
      {
        screen: "orion-office",
        eyebrow: "Orion",
        headline: "Any answer, one question away.",
        body: "Ask about statements, payments, wells or deadlines and Orion answers from your company's own records.",
        feature: "orion",
      },
      {
        screen: "orion-facilities",
        eyebrow: "Orion",
        headline: "Ask Orion to do it for you.",
        body: "Tell Orion to set up a lease with its wells, tanks and meter, approve each step, and watch it appear.",
        feature: "orion",
      },
      featureSection("filings", "filings"),
      featureSection("reports", "reports"),
      {
        screen: "calendar",
        eyebrow: "Calendar",
        headline: "Every deadline on one calendar.",
        body: "Field meetings, purchaser pickups, workovers, inspections and task due dates in one month, with the week and the task board a tab away.",
      },
      {
        screen: "tasks",
        eyebrow: "Tasks",
        headline: "Know who is on what.",
        body: "Every task on one board, assigned to someone on the team, with a priority and a due date that shows on the calendar.",
      },
    ],
  },
  {
    slug: "pumper",
    audience: "pumpers",
    group: "By role",
    label: "Pumper",
    headline: "Log it and get back in the truck.",
    body: "Gauge and meter readings in seconds, prefilled from yesterday so you only change what moved, scan the ticket, dictate the note. Works without signal.",
    features: ["mobile", "orion"],
    sections: [
      featureSection("mobile", "phone-gauge"),
      {
        screen: "phone-well-info",
        eyebrow: "Wells",
        headline: "The well's sheet, in your pocket.",
        body: "The well's rates, chart and spec sheet in your pocket, and you can fix a value right from the lease.",
        feature: "mobile",
      },
      {
        screen: "phone-well-tests",
        eyebrow: "Well tests",
        headline: "Log the test at the well.",
        body: "Pick the test tank and the times, and the app works out the barrels from gauges you already took.",
        feature: "mobile",
      },
      {
        screen: "phone-tickets",
        eyebrow: "Run tickets",
        headline: "Scan the ticket, check the form.",
        body: "Photograph a paper run ticket in the phone's own scanner and it comes back as the draft you would have typed.",
        feature: "mobile",
      },
      {
        screen: "phone-comments",
        eyebrow: "Comments",
        headline: "Comment on the well itself.",
        body: "Every well, tank, battery and meter has a thread, and it opens from the facility on the phone, signal or not.",
        feature: "mobile",
      },
      {
        screen: "phone-orion",
        eyebrow: "Orion on the phone",
        headline: "Ask what is in the hole.",
        body: "Ask what pump is in a well and when it was last pulled, and get the answer in the truck.",
        feature: "orion",
      },
    ],
  },
  {
    slug: "1-24-wells",
    audience: "operators with 1 to 24 wells",
    group: "By size",
    label: "1 to 24 wells",
    headline: "Everything in one place from the first well.",
    body: "Import your leases and wells from the RRC, log readings on the phone and let Orion keep the books straight.",
    features: ["dashboard", "mobile", "documents", "orion"],
  },
  {
    slug: "25-99-wells",
    audience: "operators with 25 to 99 wells",
    group: "By size",
    label: "25 to 99 wells",
    headline: "Growing without growing the office.",
    body: "Several pumpers, several purchasers, one ledger. Reports and filings run on schedule.",
    features: ["documents", "reports", "filings", "flow-map"],
  },
  {
    slug: "100-plus-wells",
    audience: "operators with 100+ wells",
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
    a: "Purchased credits roll over. The free credits in your plan do not.",
  },
];
