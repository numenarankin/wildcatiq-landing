import type { ProductPageContent } from "./types";

/** Reports page. Budgets and the outcome-first rule are in docs/copy-review.md. Only the Company Digest and the Production reports can be emailed. */
export const reportsPage: ProductPageContent = {
  hero: {
    eyebrow: "Reports",
    headline: "Every report, built before you ask.",
    subhead: "Twenty-four reports from your own gauges, tickets and statements, ready on screen or in your inbox.",
  },
  steps: [
    { title: "Pumpers log it.", body: "Gauges, meter readings and run tickets from the field." },
    { title: "Reports build overnight.", body: "Everything is ready by morning, with nothing to run." },
    { title: "Read or download.", body: "On screen, or as PDF, Excel or CSV." },
    { title: "Or get it emailed.", body: "Switch it on once and it arrives on schedule." },
  ],
  sections: [
    {
      eyebrow: "The library",
      headline: "Twenty-four reports, one set of numbers.",
      body: "Company, production, tank, well, RRC and pumper reports that always match your screens.",
      screen: "library",
      cards: [
        { label: "A report per well", body: "Each new well gets its own production history automatically." },
        { label: "Download any of them", body: "PDF, Excel or CSV, whichever your accountant wants." },
        { label: "Hear it instead", body: "Orion reads any report aloud." },
      ],
    },
    {
      eyebrow: "The Company Digest",
      headline: "The company, read in two minutes.",
      body: "Every day, week or month: the numbers first, then a few sentences on what they mean.",
      screen: "digest",
      cards: [
        { label: "What changed", body: "Oil, gas, water, sales and revenue, each against the prior period." },
        { label: "What needs you", body: "Batteries off their norm and wells the pumpers say are down." },
        { label: "Estimated, then settled", body: "Each day valued at today's price, trued up to the statement monthly." },
      ],
    },
    {
      eyebrow: "Production, tanks and wells",
      headline: "Every number the office asks for.",
      body: "Production by any period, tank and haul records, well tests and the RRC reconciliation, ready to hand over.",
      screen: "production",
      cards: [
        { label: "Production at any grain", body: "Daily to annual, with the swings and misses called out." },
        { label: "Tanks and hauls", body: "Gauge history, capacity, pickups waiting and an edit audit trail." },
        { label: "Month end, reconciled", body: "Gross versus net and the RRC reconciliation, built from what you file." },
      ],
    },
    {
      eyebrow: "Scheduled",
      headline: "Written at 2am, read at 8.",
      body: "Switch a report on once and it lands in your inbox on time.",
      screen: "schedule",
      cards: [
        { label: "One email, every PDF", body: "Everything due that morning in one message, with a short summary." },
        { label: "Your hour, your day", body: "Daily, weekly on Friday or monthly, at the hour you pick." },
        { label: "Never sent twice", body: "A missed send goes out on the next pass, once." },
      ],
    },
  ],
  faq: [
    { q: "Which reports can be emailed?", a: "The Company Digest and the eight Production reports, as PDFs." },
    { q: "Who receives a scheduled report?", a: "The person who switched it on." },
    { q: "Are the RRC reports the filing?", a: "No, they reconcile what you would file. The Form PR is built on the Filings page." },
  ],
  siblings: [
    { slug: "dashboard", body: "The digest covers the same day and leases as the dashboard, in your inbox." },
    { slug: "filings", body: "The RRC reconciliation reports check the Form PR before you file it." },
    { slug: "orion", body: "The voice that reads a report aloud is the same Orion you ask in chat." },
    { slug: "mobile", body: "The gauges, readings and comments these reports summarize are logged on the phone." },
  ],
};
