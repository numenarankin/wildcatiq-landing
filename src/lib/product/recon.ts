import type { ProductPageContent } from "./types";

/** Recon page. Every Recon feature gets a section (owner, 2026-10-30), so it carries eight. Budgets and the outcome-first rule are in docs/copy-review.md. Alerts are Beta. */
export const reconPage: ProductPageContent = {
  hero: {
    eyebrow: "Recon",
    headline: "Every Texas well, on your map.",
    subhead: "Every well, lease, permit and operator the RRC has on file, on one map you can search.",
  },
  steps: [
    { title: "Pick what to show.", body: "Wells, leases, permits, orphan wells or operators." },
    { title: "Narrow it down.", body: "By county, operator, type, status, depth or production." },
    { title: "Open the record.", body: "Production, completions, filings and principals, one click away." },
    { title: "Watch your counties.", body: "Get an email when something new is filed." },
  ],
  sections: [
    {
      eyebrow: "The map",
      headline: "The whole state, filtered your way.",
      body: "Find the wells, leases and operators that matter to you among a million in Texas.",
      screen: "layers",
      cards: [
        { label: "Five views", body: "Wells, leases, permits, orphan wells and operators." },
        { label: "Narrow in seconds", body: "Stack county, operator, type, status, depth and production filters." },
        { label: "Draw an area", body: "Box or lasso a prospect and see how many wells it holds." },
      ],
    },
    {
      eyebrow: "Permits",
      headline: "See the rig before it arrives.",
      body: "New drilling applications land on the map the night the RRC publishes them.",
      screen: "permits",
      cards: [
        { label: "Follow a permit", body: "From pending to approved to drilled, each in its own color." },
        { label: "Read the filing", body: "Open the approved W-1 and its plats." },
        { label: "Filter by purpose", body: "New drills, recompletions and re-entries, each on its own." },
      ],
    },
    {
      eyebrow: "Completions",
      headline: "Know how every well was finished.",
      body: "Read any well's filed completion before you trust its numbers or copy its design.",
      screen: "completions",
      cards: [
        { label: "The filed packet", body: "Open the W-2 or G-1 as the operator filed it." },
        { label: "Casing and perfs", body: "Where pipe was set and where the well is perforated." },
        { label: "Formations", body: "Every zone the operator reported, with its depth." },
      ],
    },
    {
      eyebrow: "Leases",
      headline: "Price a lease before you bid.",
      body: "See a lease's production history, its wells and where its oil and gas went.",
      screen: "lease",
      cards: [
        { label: "Production to date", body: "Every month the RRC has, oil and gas, charted and tabled." },
        { label: "Wells and status", body: "Every well on the lease, producing, shut in or plugged." },
        { label: "Who buys it", body: "Disposition by RRC code and the purchaser on file." },
      ],
    },
    {
      eyebrow: "Operators",
      headline: "Size up a company in minutes.",
      body: "Every lease an operator holds, its wells, its officers and what it has done lately.",
      screen: "operator",
      cards: [
        { label: "Every lease it holds", body: "The whole portfolio as a tree, each lease opening to its wells." },
        { label: "Who runs it", body: "Officers and principals from the operator's P-5." },
        { label: "Recent activity", body: "New permits and wells, newest first." },
      ],
    },
    {
      eyebrow: "Market",
      headline: "Know what the county produced.",
      body: "See what each county, field and operator around you is producing, month by month.",
      screen: "market",
      cards: [
        { label: "Any area", body: "Texas, districts or counties, one line each on the chart." },
        { label: "Leaderboards", body: "The top counties, fields, operators and leases by monthly rate." },
        { label: "No false drops", body: "The last reported month is named, so a late month never reads as zero." },
      ],
    },
    {
      eyebrow: "Alerts, in Beta",
      headline: "Hear about new activity first.",
      body: "Pick your counties and get an email when a permit is filed or approved or a new well appears.",
      screen: "alerts",
      cards: [
        { label: "Your counties", body: "Pick them on the map, as many as you want." },
        { label: "Daily or weekly", body: "Every morning at your hour, or on Fridays." },
        { label: "Straight to the record", body: "Each permit or well in the email opens on the map." },
      ],
    },
    {
      eyebrow: "Orion on Recon",
      headline: "Ask about any operator.",
      body: "Ask what a company holds near your wells and Orion answers from the state's record.",
      screen: "orion",
      cards: [
        { label: "Every record, by asking", body: "Wells, leases, operators, permits and production, from the chat." },
        { label: "The map follows", body: "Orion moves the map to what it found." },
        { label: "Kept apart", body: "The state's record never mixes with your own wells." },
      ],
    },
  ],
  faq: [
    { q: "Is Recon Texas only?", a: "Yes. It is the Texas Railroad Commission's public record." },
    { q: "How fresh is it?", a: "Permits and new wells update nightly. Production follows the RRC's monthly cycle, about three months behind." },
    { q: "Is this my production data?", a: "No, Recon shows what operators filed with the state. Your own gauges, tickets and meters live on the Dashboard and well pages." },
    { q: "What do alerts cover?", a: "Permits filed, permits approved and new wells in the counties you pick, by email, daily or weekly. Alerts are in Beta." },
  ],
  siblings: [
    { slug: "filings", body: "The state's record checks your Form PR's lease names and opening storage." },
    { slug: "dashboard", body: "Your leases' production beside what the neighbors filed." },
    { slug: "orion", body: "Ask about any Texas operator in the same chat that knows your wells." },
    { slug: "reports", body: "The RRC reconciliation report compares your books with what the state holds." },
  ],
};
