import type { ProductPageContent } from "./types";

/**
 * Drafted in docs/product-pages-plan.md (Documents), each card checked against
 * the wildcat source it cites there. The copy follows the shipped routes: the
 * Data Entry page is parked under /dev, so paper is sold through the pages
 * that read it (a tank or meter's Add History, a well page, Revenue,
 * Invoices). Lease terms, Dropbox, mud logs and raster logs are left out.
 */
export const documentsPage: ProductPageContent = {
  hero: {
    eyebrow: "Documents",
    headline: "Your paperwork becomes your records.",
    subhead:
      "Drop a gauge sheet, a ticket or a statement where it belongs, and Orion proposes the rows, flags what is already on file, and waits for your approval.",
  },
  steps: [
    { title: "Upload where it lives.", body: "A gauge sheet on its tank, a ticket on its well, a statement on Revenue, an invoice on Invoices." },
    { title: "Orion reads it to text.", body: "Photos and PDFs are transcribed page by page, tables kept as tables, unreadable characters marked rather than guessed." },
    { title: "A second pass checks it.", body: "A validator audits the rows against the document and sends them back for correction." },
    { title: "On-file rows are caught.", body: "Rows that match records already on file are dropped or flagged before the card opens." },
    { title: "You approve.", body: "Approving a card is the only path to a real record." },
  ],
  sections: [
    {
      eyebrow: "Upload where it lives",
      headline: "Paper goes where it belongs.",
      body: "Each page that owns a record takes its own paper, so a card never lands on the wrong tank or well.",
      screen: "upload",
      cards: [
        { label: "Tanks and meters.", body: "Add History reads gauge sheets, run tickets and gas logs for that one device." },
        { label: "Well pages.", body: "A ticket dropped on a well becomes service, downtime and equipment rows for that well." },
        { label: "Revenue.", body: "Purchaser and gas statements are read and reviewed beside the scan." },
        { label: "Invoices.", body: "Vendor invoices and field tickets open on their own review screen." },
        { label: "Paste counts.", body: "Rows copied out of GreaseBook or Excel paste into Add History as a table, so code parses them instead of a model." },
      ],
    },
    {
      eyebrow: "Field photos",
      headline: "Field photos, straightened and read.",
      body: "A photo from the truck seat is cropped to the page before anything reads it.",
      screen: "photos",
      cards: [
        { label: "Cropped to the page.", body: "The page is found automatically, with a review step when detection is wrong." },
        { label: "Original kept.", body: "The uncropped photo is stored beside the crop." },
        { label: "Doubt survives.", body: "An unreadable digit is marked [?] instead of guessed." },
        { label: "iPhone photos and TIFFs.", body: "HEIC is converted where it is read, and a multi-page TIFF becomes a PDF, up to 150 pages." },
      ],
    },
    {
      eyebrow: "Statements",
      headline: "The check stub, reconciled.",
      body: "A purchaser statement is read into leases, runs and revenue lines, with the arithmetic checked before you see it.",
      screen: "statements",
      cards: [
        { label: "Every destination at once.", body: "A run statement proposes the leases it settles, the purchaser, the runs and the revenue in one pass." },
        { label: "Math that closes.", body: "Net against gross less deducts and taxes, price times volume, and lines against the printed total." },
        { label: "Runs matched to tickets.", body: "A run whose ticket is already on file fills that ticket's price and value instead of duplicating it." },
        { label: "Backfill after the save.", body: "New leases, tanks and run tickets the statement names arrive as approval cards once it is saved." },
        { label: "Gas too.", body: "A plant statement proposes the gatherer, the meter, the lease, the settlement and the revenue lines." },
      ],
    },
    {
      eyebrow: "Well paperwork",
      headline: "One ticket, three records.",
      body: "A pulling-unit ticket dropped on a well's page is read for everything it says about that well.",
      screen: "well",
      cards: [
        { label: "Eight well destinations.", body: "Equipment, service, downtime, well tests, daily production, fluid shots, gas tests and notes." },
        { label: "One job, three records.", body: "A rod job is a service row, a downtime row and an equipment change." },
        { label: "Pick the well once.", body: "The card asks which well, and the next card from the same document starts with your answer." },
        { label: "An invoice is both.", body: "A priced field ticket on a well's page files the job on the well and the bill on Invoices." },
      ],
    },
    {
      eyebrow: "History",
      headline: "Ten years of history, imported.",
      body: "Clean exports do not need a model to read every row.",
      screen: "greasebook",
      cards: [
        { label: "GreaseBook recognized.", body: "Gauge tables, production, gas logs and transport tickets are read by shape, with no model call." },
        { label: "One mapping, every row.", body: "For any other clean spreadsheet, one call writes the column mapping and code applies it to each row." },
        { label: "Audited, then repaired.", body: "The output is checked against the source and the mapping repaired, up to 2 passes." },
        { label: "Odd rows escalated.", body: "Rows the rules cannot place go to the model, so cost tracks irregularity, not row count." },
      ],
    },
    {
      eyebrow: "Approval",
      headline: "Nothing saved until you approve.",
      body: "Nothing is saved until you approve it.",
      screen: "on-file",
      cards: [
        { label: "Proposals, not records.", body: "A scan writes approval cards and nothing else." },
        { label: "Edit before you approve.", body: "Every proposed row is an editable grid, and blanks stay blank." },
        { label: "Already on file is flagged.", body: "A haul on a day that already has a run arrives marked for you to check." },
        { label: "Permission checked again.", body: "Approving re-checks that you may write that record type, then writes through the page's own action." },
        { label: "Dismiss writes nothing.", body: "Dismissing a card leaves every record untouched." },
      ],
    },
    {
      eyebrow: "Files",
      headline: "Every file, searchable by meaning.",
      body: "Files live in one tree, every facility owns a folder, and uploads are indexed for Orion's search.",
      screen: "cabinet",
      cards: [
        { label: "Nine system folders.", body: "Wells, Leases, Tanks, Meters, Batteries, Projects, Data Entry, Scans and Chat Attachments, seeded for every company." },
        { label: "Every facility owns a folder.", body: "A file on a tank's Files tab is the same file as Tanks / Smith T201 on the Files page." },
        { label: "Upload a whole folder.", body: "Pick a directory and the tree is recreated, with OS junk files skipped." },
        { label: "Up to 5 GB a file.", body: "Bytes go straight from the browser to storage, and files over 100 MB are stored without indexing." },
        { label: "OCR for search.", body: "PDFs and images are OCR'd and indexed by meaning, with keyword search alongside." },
      ],
    },
    {
      eyebrow: "Well logs",
      headline: "Well logs open where they live.",
      body: "The viewer renders the formats a well file comes in, and Orion reads the same files.",
      screen: "logs",
      cards: [
        { label: "LAS logs as tracks.", body: "A triple-combo track display with conventional curve colors, in the browser." },
        { label: "Whole log in one read.", body: "Orion reads an entire LAS file, every curve at full resolution, in one call." },
        { label: "Sheets and PDFs inline.", body: "Spreadsheets render as a grid and PDFs page in place." },
        { label: "Orion reads the open file.", body: "The file on screen is published to Orion, so \"summarize this\" works." },
      ],
    },
  ],
  faq: [
    { q: "Does a scan ever write a record?", a: "No. A scan only creates approval cards. Approving one is the single path to a real row, and it re-checks your permission first." },
    { q: "What if the same paper is uploaded twice?", a: "Rows that match a record already on file are dropped before the card, and the card says when everything was on file." },
    { q: "What formats can it read?", a: "PDF, photos including HEIC and TIFF, xlsx, csv, txt, docx and LAS. Search covers PDFs, images and text." },
    { q: "How big a file?", a: "5 GB a file on the Files page and 100 MB per upload on a record page. Files over 100 MB are stored without indexing." },
    { q: "Which model reads documents?", a: "Claude Opus 5 transcribes and extracts. A PDF on a tank's Add History is read to text by Reducto first. Search OCR is Mistral." },
    { q: "How many passes does an extraction get?", a: "On a well page, analyze, then validate and correct, up to 3 rounds. At the cap the best set is shown and you are the final check." },
    { q: "Can I turn scanning off?", a: "Yes, for the whole company in Settings. Files still upload and index for search." },
    { q: "Does it cost credits?", a: "Yes. Out of credits, uploads still file and the card says to top up." },
    { q: "Who can upload?", a: "Members with the files permission. Each card re-checks its own record type's permission at approval." },
    { q: "Can the phone scan?", a: "Yes. The phone combines camera pages into one PDF and sends it through the same upload pipeline as the web." },
  ],
  siblings: [
    { slug: "mobile", body: "Pumpers photograph tickets and gauge sheets on the lease, and the pages land in Files." },
    { slug: "orion", body: "The same approval rule guards Orion's own writes, and Orion searches every indexed file." },
    { slug: "reports", body: "The rows approved here are the rows reports are built from." },
    { slug: "filings", body: "Form PR draws on the gauges, tickets and meter volumes these cards create." },
  ],
};
