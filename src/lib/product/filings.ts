import type { ProductPageContent } from "./types";

/** Filings page: one demo (the hero: generate, download, done) and how it works. The value is what the operator no longer does. Form PR is Beta, and Wildcat never files for you. */
export const filingsPage: ProductPageContent = {
  hero: {
    eyebrow: "Filings",
    headline: "Form PR from your gauges.",
    subhead: "Your pumpers log the month, Wildcat builds the Form PR, and you upload one file to the RRC.",
  },
  steps: [
    { title: "Pumpers log it.", body: "Gauges, run tickets and meter readings, on the phone." },
    { title: "Wildcat builds it.", body: "Processed and formatted to the RRC's rules." },
    { title: "You download it.", body: "One EDI file, ready for the RRC." },
    { title: "You upload it.", body: "Submit it through your RRC Online account." },
  ],
  sections: [
    {
      eyebrow: "What you skip",
      headline: "Nothing to retype at month end.",
      body: "The filing comes from data your pumpers already logged, so nobody keys it into the RRC by hand.",
      cards: [
        { label: "No retyping", body: "Every volume comes from the field data already in Wildcat." },
        { label: "No balancing by hand", body: "Production, sales and storage are worked out for every lease." },
        { label: "Problems caught first", body: "Every record is checked against the RRC's rules before you download." },
      ],
    },
  ],
  faq: [
    { q: "Does Wildcat file the Form PR for me?", a: "No, it builds, checks and hands you the file. You upload it through your RRC Online account." },
    { q: "Which forms are supported?", a: "Texas Form PR, in Beta." },
    { q: "Can I edit a figure before I file?", a: "Yes. Every figure is editable, and the download rebuilds the file with your numbers." },
    { q: "When is a Form PR due?", a: "The last day of the month after the production month. September 2026 is due October 31, 2026." },
  ],
  siblings: [
    { slug: "mobile", body: "The gauges, tickets and meter readings your pumpers log are what the filing is built from." },
    { slug: "dashboard", body: "The month's oil and gas on your Form PR match the Dashboard." },
    { slug: "documents", body: "Tickets and gauge sheets you upload become the readings the filing is built from." },
    { slug: "reports", body: "The RRC reconciliation report compares your books with what the state holds." },
  ],
};
