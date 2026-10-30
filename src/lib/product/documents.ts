import type { ProductPageContent } from "./types";

/** Documents page. Budgets and the outcome-first rule are in docs/copy-review.md. */
export const documentsPage: ProductPageContent = {
  hero: {
    eyebrow: "Documents",
    headline: "Your paperwork becomes your records.",
    subhead: "Drop in a ticket, statement or gauge sheet and approve the records instead of typing them.",
  },
  steps: [
    { title: "Drop it where it belongs.", body: "Gauge sheets on the tank, tickets on the well." },
    { title: "Orion reads it.", body: "Every page, photo or spreadsheet, tables and all." },
    { title: "Duplicates are caught.", body: "Anything already on file is flagged before you see it." },
    { title: "You approve.", body: "Nothing is saved until you say so." },
  ],
  sections: [
    {
      eyebrow: "Upload where it lives",
      headline: "Stop retyping paperwork.",
      body: "Drop the paper on the tank, well or page it belongs to and approve what Orion read.",
      screen: "upload",
      cards: [
        { label: "Fix it first", body: "Every proposed record is editable before you approve, and blanks stay blank." },
        { label: "Duplicates flagged", body: "A haul already on file arrives marked for you to check." },
        { label: "Paste a spreadsheet", body: "Rows copied from GreaseBook or Excel come in as a table." },
      ],
    },
    {
      eyebrow: "From the phone",
      headline: "Scan it on the lease.",
      body: "Scan a ticket or invoice with the phone and it is filed as one PDF before you leave the lease.",
      screen: "phone-scan",
      cards: [
        { label: "Squared up for you", body: "The app finds the page's corners and flattens each shot." },
        { label: "Every page, one PDF", body: "Multi-page paperwork is saved as a single file." },
        { label: "Filed where it belongs", body: "Scans land in their own folder, ready on the web." },
      ],
    },
    {
      eyebrow: "Statements",
      headline: "Check stubs, entered for you.",
      body: "Purchaser statements and vendor invoices are read into your revenue and expenses, with no typing.",
      screen: "statements",
      cards: [
        { label: "Math that closes", body: "Gross, deducts, taxes and net are checked against the printed total." },
        { label: "Runs matched to tickets", body: "A run already on file gets its price instead of a duplicate." },
        { label: "Gas statements too", body: "Plant statements fill in the meter, lease, settlement and revenue." },
      ],
    },
    {
      eyebrow: "Well paperwork",
      headline: "One ticket, three records.",
      body: "A pulling-unit ticket updates the well's service history, downtime and equipment from one upload.",
      screen: "well",
      cards: [
        { label: "Everything a ticket holds", body: "Equipment, service, downtime, tests, production and notes." },
        { label: "The bill too", body: "A priced field ticket files the job on the well and the bill on Invoices." },
        { label: "Years of history", body: "Bring in a GreaseBook or spreadsheet export in one go." },
      ],
    },
    {
      eyebrow: "Files",
      headline: "Every file, in its place.",
      body: "Every facility has its own folder, and Orion can find any upload by what it says.",
      screen: "cabinet",
      cards: [
        { label: "Ask Orion to find it", body: "Orion finds a scanned ticket by what is written on it." },
        { label: "Logs in the browser", body: "LAS logs draw as tracks, and Orion reads the open file." },
        { label: "Big files welcome", body: "Up to 5 GB a file, or a whole folder at once." },
      ],
    },
  ],
  faq: [
    { q: "Does a scan save anything on its own?", a: "No. Orion proposes the records, and nothing is saved until you approve them." },
    { q: "What if the same paper is uploaded twice?", a: "Records already on file are dropped before you see the card, and the card says so." },
    { q: "What can it read?", a: "PDFs, phone photos, spreadsheets, text, Word documents and LAS logs." },
    { q: "Can the phone scan?", a: "Yes. Scanned pages are saved as one PDF and filed, ready on the web." },
    { q: "Does it cost credits?", a: "Yes, reading a document uses AI credits. Out of credits, uploads still file and the card says to top up." },
  ],
  siblings: [
    { slug: "mobile", body: "Pumpers photograph tickets and gauge sheets on the lease, and the pages land here." },
    { slug: "orion", body: "The same approval rule guards Orion's own changes, and Orion searches every file." },
    { slug: "reports", body: "The records you approve here are what your reports are built from." },
    { slug: "filings", body: "Form PR draws on the gauges, tickets and meter volumes you approve here." },
  ],
};
