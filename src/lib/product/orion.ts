import type { ProductPageContent } from "./types";

/** Orion page. Budgets and the outcome-first rule are in docs/copy-review.md. */
export const orionPage: ProductPageContent = {
  hero: {
    eyebrow: "Orion",
    headline: "An analyst, not a chatbot.",
    subhead: "Ask about your wells, your paperwork or the state's record and get an answer you can check.",
  },
  steps: [
    { title: "Ask in plain words.", body: "Type or say it, the way you'd ask a person." },
    { title: "Orion pulls the records.", body: "Your data and the RRC's, with the source named." },
    { title: "It does the math.", body: "Declines, rankings and charts, worked out, never guessed." },
    { title: "You approve any change.", body: "Nothing is saved until you say so." },
  ],
  sections: [
    {
      eyebrow: "On every page",
      headline: "Every record, one question away.",
      body: "Open Orion beside any page in the app and ask about the wells, tickets and statements behind it.",
      screen: "reads",
      cards: [
        { label: "Wells and production", body: "Volumes, tests, equipment, downtime and service history for any well." },
        { label: "Money", body: "Statements, invoices, the ledger and live oil and gas prices." },
        { label: "\"This tank\" means this tank", body: "Point at what's on screen instead of naming it." },
      ],
    },
    {
      eyebrow: "The state's record",
      headline: "The RRC, in the same chat.",
      body: "Compare your wells with every operator, lease and permit in Texas without leaving the chat.",
      screen: "rrc",
      cards: [
        { label: "Offsets in seconds", body: "The wells near yours, with their production history." },
        { label: "New activity nearby", body: "Permits, completions and SWD volumes by county or operator." },
        { label: "Moves the map for you", body: "Ask for a county or an operator and Recon goes there." },
      ],
    },
    {
      eyebrow: "Works the problem",
      headline: "Shows the math, not adjectives.",
      body: "Declines, rankings and log picks are calculated and charted, so you can act on them.",
      screen: "logs",
      cards: [
        { label: "Decline on demand", body: "A 12-month forward decline for the company, a lease or a well." },
        { label: "Tops and pay", body: "Orion reads the whole LAS and quotes depths that are in the file." },
        { label: "Charts from your numbers", body: "Every chart is drawn from records Orion pulled, never from typed figures." },
      ],
    },
    {
      eyebrow: "Asks first",
      headline: "Nothing saved until you approve.",
      body: "Orion drafts the change and you approve it, so nothing lands in your books by surprise.",
      screen: "approval",
      cards: [
        { label: "One card per change", body: "Plain English, with every field shown before you decide." },
        { label: "Big jobs, one decision", body: "A 250-row batch is one card, with every row listed." },
        { label: "You set the limits", body: "Switch off any area or action and Orion can't touch it." },
      ],
    },
    {
      eyebrow: "Does the work",
      headline: "Anything you can do, it can.",
      body: "Log a gauge, add a well, assign a task or schedule a report just by asking.",
      cards: [
        { label: "Field records", body: "Gauges, run tickets, meter readings, well tests and downtime." },
        { label: "Wells and people", body: "Wells, leases, owner interests, contractors and royalty owners." },
        { label: "Office work", body: "Tasks, calendar events, notes, documents and report schedules." },
      ],
    },
  ],
  faq: [
    { q: "Can Orion change a record on its own?", a: "No. Every change is a card you approve or deny, and nothing is saved until you approve it." },
    { q: "Does it make up numbers?", a: "It answers from your records, says when it finds nothing, and cites the record it used." },
    { q: "What can it read?", a: "Your company's records, the Texas RRC record, your files and logs, and the web when you ask." },
    { q: "Does it learn how we work?", a: "Yes. It keeps notes on your operation and the jobs you walk it through, and you can edit or roll back any of it." },
    { q: "Can I talk to it?", a: "Yes, hands free. Talk over it and it stops, and it reads each change out for you to approve aloud." },
    { q: "How is it billed?", a: "In credits, where one credit is one cent. Each plan includes 10,000 to 50,000 a month, and you can buy more any time." },
  ],
  siblings: [
    { slug: "dashboard", body: "Orion writes the morning brief: the wells that moved, the week's deadlines and the pumpers' notes." },
    { slug: "recon", body: "Orion reads the same RRC record Recon maps, and moves the map for you." },
    { slug: "documents", body: "Uploads become approval cards under the same rule as Orion's own changes." },
    { slug: "reports", body: "Orion reads any report aloud and schedules its delivery." },
  ],
};
