import type { ProductPageContent } from "./types";

/**
 * Copy from docs/product-pages-plan.md "# Filings", resolved to the shipped
 * code: Form PR in Beta, Generate, Review and Download with the validator.
 * No Filed status (nothing in the app marks a row filed), no due date in the
 * docket (it is in the review only), twelve cycles, and the writer matched to
 * a file the RRC accepted rather than accepted by the RRC.
 */
export const filingsPage: ProductPageContent = {
  hero: {
    eyebrow: "Filings",
    headline: "Form PR from your gauges.",
    subhead:
      "Build the month's Form PR from the gauges, run tickets and meter readings already in Wildcat, check it against the RRC's rules, and download the EDI file you upload.",
  },
  steps: [
    { title: "Enter the day.", body: "The pumper gauges tanks, drops run tickets and reads gas meters the way they do every day." },
    { title: "Open the month.", body: "Generate builds the cycle fresh from the ledger as it stands. Nothing is stored up front." },
    { title: "Review every field.", body: "The Identifying Record and all fifty fields of every record are on screen and editable." },
    { title: "Download the EDI.", body: "Download in the review writes the file, logs it and keeps it on the row." },
    { title: "Upload it yourself.", body: "Submit the file through your RRC Online account. Wildcat does not file for you." },
  ],
  sections: [
    {
      eyebrow: "Derivation",
      headline: "Built from the ledger.",
      body: "Get one PR record per RRC lease or gas well, computed from the readings already on your wells.",
      cards: [
        { label: "Ending storage is the gauge.", body: "Ending stock is the sum of closing gauges over the record's tanks. It is re-anchored every month, so rounding never accumulates." },
        { label: "Opening is what the RRC holds.", body: "Opening storage is last month's filed ending. That is your last export, else the RRC mirror, else the gauge." },
        { label: "Gas balances by construction.", body: "Formation production is the derived daily gas. Fuel, flare and vent are their own entries. Sales lands in code 2 or 3 by the meter's takeaway." },
        { label: "A haul is the gauge drop.", body: "Barrels hauled come from the tank's gauge drop, not the ticket's net barrels." },
        { label: "Grouped the RRC's way.", body: "Wells group by oil or gas code, district and RRC lease number. A lease with an oil record and a gas well files two records." },
        { label: "Several P-5s.", body: "Each well files under the operator number it was imported from, with that operator's name. The Commission checks the pair." },
      ],
    },
    {
      eyebrow: "Validation",
      headline: "Caught before the RRC sees it.",
      body: "Run the RRC's own business and format rules on every record before you take the file.",
      cards: [
        { label: "43 RRC rule codes.", body: "The spec's PR rules run on every record, plus the format checks a file must pass before the RRC reads a line." },
        { label: "Block or warn.", body: "Anything the RRC rejects blocks. Any discrepancy visible in your own data blocks. What Wildcat cannot know, like the agent's RRC authorization, warns." },
        { label: "No guesses.", body: "A tank feeding two records, an uncoded ticket or a meter with no takeaway becomes an issue on the record. It never becomes an invented number." },
        { label: "The writer refuses the impossible.", body: "A negative or decimal volume or an over-long name cannot be written. That record is left out and named." },
        { label: "Marked on the field.", body: "Each issue sits on the control that fixes it. Hover the mark to read what is wrong." },
        { label: "Issues never block Download.", body: "Take the file with its issue list in hand. Fix the ledger and download again." },
      ],
      screen: "validation",
    },
    {
      eyebrow: "Review",
      headline: "Every field on screen first.",
      body: "See the whole filing on one screen and edit it before a byte leaves.",
      cards: [
        { label: "The Identifying Record.", body: "RRC Online user ID, agent name, email and phone. Save them once as the org's RRC filer and every month starts with them." },
        { label: "All fifty fields.", body: "Every PR field, grouped the way an operator reads a record. A test holds the grouping to the spec." },
        { label: "Locked where it must be.", body: "A record's identity and the retired gas code 4 column cannot be edited." },
        { label: "Move a record's production.", body: "Report one record's volumes under another. It changes this file only, never the ledger." },
        { label: "Edits rebuild the file.", body: "Download with edits rebuilds the file with your numbers in place. The same RRC checks run again." },
        { label: "Zero means zero.", body: "A volume with nothing in it shows 0, because that is what the file writes." },
      ],
      screen: "review",
    },
    {
      eyebrow: "The file",
      headline: "The format the RRC reads.",
      body: "Download one tab-delimited EDI file, written to match a report the RRC accepted.",
      cards: [
        { label: "Held to a golden file.", body: "A test holds the writer byte for byte to a Form PR the RRC accepted, 26 records from one operator." },
        { label: "Tab delimited, CRLF, 50 fields.", body: "Header token TAB, a trailing delimiter on every line, every numeric column written." },
        { label: "The preview is the bytes.", body: "The File section shows every line as it will upload, tabs marked. The same writer builds the download." },
        { label: "Corrected months ride separately.", body: "A current-month report with corrected records becomes two files. The spec says they may not share one." },
        { label: "Paper too.", body: "Download the same records on the RRC's own blank Form PR, nine lines a page, as a PDF." },
        { label: "Spreadsheet.", body: "Every field labelled as the spec labels it, plus a summary sheet of what each lease produced, what left and what is in the tanks." },
      ],
      screen: "file",
    },
    {
      eyebrow: "Docket",
      headline: "Every month, one table.",
      body: "See a row per ended cycle with its status and its file.",
      cards: [
        { label: "Twelve months.", body: "The docket lists the twelve most recent ended cycles. Each row reads Not generated or Generated." },
        { label: "Due date in the review.", body: "Form PR is due the last day of the month after the cycle. The review's header shows it." },
        { label: "The file stays.", body: "Re-download the stored file byte for byte for as long as the row exists." },
        { label: "Set the filer once.", body: "Until the four RRC filer fields are set, the page says so and no file can be generated." },
        { label: "Permissions.", body: "View with view_reports. Generate with manage_regulatory." },
      ],
      screen: "docket",
    },
    {
      eyebrow: "One write path",
      headline: "Nothing leaves unread.",
      body: "Make a file one way only: Download inside the review.",
      cards: [
        { label: "Download is the generator.", body: "No file reaches a row unless the operator opened the month." },
        { label: "Every download is logged.", body: "Each file handed out is kept with its records. Next month's opening storage chains to it." },
        { label: "Wildcat does not submit.", body: "Upload the file through RRC Online yourself." },
        { label: "Same numbers as the pages.", body: "The builder reads the tank readings, tickets and meter series the well and facility pages show." },
      ],
    },
  ],
  faq: [
    { q: "Does Wildcat file the Form PR for me?", a: "No. It builds, checks and hands you the EDI file. You upload it through your RRC Online account." },
    { q: "Which forms are supported?", a: "Form PR, in Beta. More forms are built the same way and are not on the docket yet." },
    { q: "Is it Texas only?", a: "Yes. Form PR is the Texas Railroad Commission's monthly production report. The file follows the RRC's 2022 EDI requirements." },
    { q: "What format is the file?", a: "Tab-delimited EDI with CRLF line ends: a header line, then one 50-field line per record. It is named PR_<operator number>_<cycle>.EDI." },
    { q: "Where does opening storage come from?", a: "Your last downloaded file. Without one, the RRC mirror's filed ending for the prior month. Without that, the rounded gauge." },
    { q: "What if a tank serves two leases?", a: "The builder files it on one record and names the issue on that record. It never splits a number it cannot justify." },
    { q: "Do issues stop the download?", a: "No. Each issue is listed and marked on the field. The file is still yours to take." },
    { q: "When is a Form PR due?", a: "The last day of the month after the production month. September 2026 is due October 31, 2026." },
    { q: "Who can generate one?", a: "Members with manage_regulatory. Members with view_reports can see the docket and download a stored file." },
    { q: "Can I edit a figure before I file?", a: "Yes. Every field except the record's identity and the retired gas code 4 is editable. Download with edits rebuilds the file with your numbers." },
  ],
  siblings: [
    { slug: "dashboard", body: "The month's oil and gas on the Form PR are the Dashboard's month, from the same rows." },
    { slug: "documents", body: "Run tickets and gauge sheets dropped on Documents become the tickets and readings the PR is built from." },
    { slug: "reports", body: "The RRC reconciliation report compares your ledger with what the state holds." },
    { slug: "recon", body: "The lease names and prior ending storage the PR is checked against come from the RRC mirror Recon draws." },
  ],
};
