import type { ProductPageContent } from "./types";

/**
 * Drafted in docs/product-pages-plan.md (Orion), each card checked against the
 * wildcat source it cites there. Where the plan and the code disagreed, the
 * copy follows the code: 15 switchable permission areas, deletes are gated
 * tools, realtime voice and skill toggles are not sold.
 */
export const orionPage: ProductPageContent = {
  hero: {
    eyebrow: "Orion",
    headline: "An analyst, not a chatbot.",
    subhead:
      "Orion reads your wells, your paperwork and the state's record together, works the math, and waits for your OK before it changes a thing.",
  },
  steps: [
    { title: "Ask in your own words.", body: "Type or talk. \"Smith T201 gauged 3 foot 4 and a half, record it\" is a complete request." },
    { title: "Orion pulls the records.", body: "It reads your data and the RRC record through tools, never from memory, and names the source it used." },
    { title: "It works the math.", body: "Decline fits, rankings and flow traces run in code, and a chart is drawn when the shape matters." },
    { title: "Every change is a card.", body: "A write stops the run and puts a plain-English card in front of you to approve or deny." },
    { title: "It remembers what it learned.", body: "After the reply, a background pass updates your memory and playbooks, every version kept." },
  ],
  sections: [
    {
      eyebrow: "Reads your operation",
      headline: "Every record, one question away.",
      body: "Orion reads the same rows your pages read, so its answer and your screen agree.",
      screen: "reads",
      cards: [
        { label: "Wells and production.", body: "Headers, daily volumes, well tests, equipment, service history, downtime and comments, per well or per lease." },
        { label: "Tanks, tickets and allocation.", body: "Gauges, run tickets and the same battery and tank allocation the Tanks page shows." },
        { label: "Gas, water and disposal.", body: "Gas meter readings, water meters, injection volumes and SWD readings." },
        { label: "Statements, invoices and prices.", body: "Purchaser statements, vendor invoices, the ledger and live WTI and Henry Hub." },
        { label: "Files and logs.", body: "Browse folders, search OCR'd documents, read a PDF, or read a whole LAS log in one call." },
      ],
    },
    {
      eyebrow: "Reads the state's record",
      headline: "The RRC, in the same chat.",
      body: "Orion queries the Texas public record for every operator, lease and wellbore beside your own data.",
      screen: "rrc",
      cards: [
        { label: "Search the whole state.", body: "Find wells, leases, operators, fields, counties and surveys by name or number." },
        { label: "Offsets by distance.", body: "List the wells near one of yours, with their production history." },
        { label: "Permits, completions and disposal.", body: "Pull new permits, completion reports and SWD volumes by county or operator." },
        { label: "Moves the Recon map.", body: "Ask for a county, an operator or a filter and the map goes there." },
      ],
    },
    {
      eyebrow: "Works the problem",
      headline: "Shows the math, not adjectives.",
      body: "Analytical turns run in code and draw the chart, so every number in the answer can be checked.",
      screen: "math",
      cards: [
        { label: "The same decline the app draws.", body: "Oil, gas and BOE with a forward 12-month decline for the company, a lease or a well." },
        { label: "Rankings and trends in code.", body: "Percentiles, fitted trends and concentration run through one dispatcher, not prose." },
        { label: "Charts from real rows.", body: "A chart is drawn from data Orion already pulled, never from numbers it typed." },
        { label: "Facility flow.", body: "Trace oil, gas or water from a well through tanks and meters to sale or disposal." },
        { label: "A researcher goes first.", body: "On hard questions a faster model gathers the context, then the analyst reasons once over all of it." },
      ],
    },
    {
      eyebrow: "Reads your logs",
      headline: "Tops and pay from the LAS itself.",
      body: "Orion reads the whole log in one call and picks on the logged numbers, so every depth it quotes is in the file.",
      screen: "logs",
      cards: [
        { label: "The whole log, one read.", body: "Header, every curve and every row at full resolution, with the empty padding stripped." },
        { label: "Computed, not eyeballed.", body: "Orion is told to compute on the values the read returns and never to estimate a curve." },
        { label: "From your files.", body: "Attach a log from Files or ask about the one you have open." },
        { label: "Big logs by window.", body: "A log too large for one read is pulled by depth window, every curve on the same depths." },
        { label: "Scanned logs too.", body: "A TIFF log is read as images by depth, and any value read off a picture is called an estimate." },
      ],
    },
    {
      eyebrow: "Knows the page",
      headline: "\"This tank\" means this tank.",
      body: "Pages publish what is on screen, so you point at a map, a table or a file instead of naming ids.",
      screen: "context",
      cards: [
        { label: "Docked to every page.", body: "The drawer opens on any page and narrows the page beside it, 320 to 720 px wide." },
        { label: "The map viewport.", body: "Recon publishes the wells in view, the filters and the operator or lease you have open." },
        { label: "The page you are on.", body: "The open well, the Tanks list, the flow map, the charts and the selected file ride into the turn." },
        { label: "Count before list.", body: "A 400-well viewport reports its count first and never passes a cut list off as the whole." },
      ],
    },
    {
      eyebrow: "Asks before it writes",
      headline: "Nothing saved until you approve.",
      body: "Nothing is saved until you approve it.",
      screen: "approval",
      cards: [
        { label: "Every write stops for a card.", body: "Each tool that changes a record is approval gated, and the run pauses until you answer." },
        { label: "Enforced in code.", body: "A write tool missing its gate is replaced by a refusal before it can run." },
        { label: "Plain English, never JSON.", body: "The card shows one line and the fields as labelled rows, in names, not ids." },
        { label: "One card for 250 rows.", body: "A batch is one card and one decision, with every row listed." },
        { label: "Deletes included.", body: "Removing a well, a ticket or a file is a tool too, and every one waits for approval." },
      ],
    },
    {
      eyebrow: "Acts across the app",
      headline: "Anything the app can do.",
      body: "Every write a page makes, Orion can propose through the same server action with the same fields.",
      cards: [
        { label: "Field records.", body: "Tank gauges, run tickets, meter readings, SWD readings, well tests, downtime and production." },
        { label: "Wells, leases and interests.", body: "Create wells and leases, assign facilities to a lease and grant owner interests." },
        { label: "People, tasks and notes.", body: "Contractors, royalty owners, inventory, tasks, calendar events and field notes." },
        { label: "Documents and reports.", body: "Draft a document, file or rename files, and schedule a report's delivery." },
      ],
    },
    {
      eyebrow: "Remembers",
      headline: "Sharper every week you use it.",
      body: "Your memory, persona and playbooks carry what Orion learned, and every version is kept.",
      screen: "memory",
      cards: [
        { label: "Memory.", body: "Durable facts about your operation, carried into every chat and editable in Settings." },
        { label: "Persona.", body: "How you want Orion to work with you, in your own words." },
        { label: "Playbooks.", body: "Recurring jobs you walked Orion through, written down as steps, up to 12 per user." },
        { label: "Every version kept.", body: "Orion's edits are logged beside yours and roll back in one click." },
        { label: "Finds old conversations.", body: "Search past threads by what they were about, not the exact words." },
      ],
    },
    {
      eyebrow: "Talks and listens",
      headline: "Hands free in the truck.",
      body: "Voice mode is a spoken conversation you can interrupt, not a dictation box.",
      screen: "voice",
      cards: [
        { label: "Waits for you to finish.", body: "Orion starts thinking at 350 ms of silence and speaks only at 700 ms, so a pause never cuts you off." },
        { label: "Interrupt it.", body: "Talk over Orion and it stops, and it knows its own voice from yours." },
        { label: "Spoken approvals.", body: "A write is read out and approved aloud." },
        { label: "Reads reports aloud.", body: "Any report plays as a briefing." },
      ],
    },
    {
      eyebrow: "Attach and print",
      headline: "Photos in, PDF out.",
      body: "The composer takes what an operator has in hand, and a thread prints as a document.",
      screen: "attach",
      cards: [
        { label: "Photos and PDFs.", body: "Drop or paste an image or PDF and Orion reads it directly, iPhone HEIC included." },
        { label: "Spreadsheets and text.", body: "CSV, text and other files go in as text." },
        { label: "Paste a cell range.", body: "Rows copied from a spreadsheet paste as their text." },
        { label: "Print the thread.", body: "A conversation prints as a letterheaded PDF with its charts redrawn." },
      ],
    },
    {
      eyebrow: "Under your control",
      headline: "You decide what Orion touches.",
      body: "Permissions are a table of areas and actions, checked on the way into every tool.",
      screen: "permissions",
      cards: [
        { label: "15 areas, four actions.", body: "Read, add, edit and delete per area, in Settings." },
        { label: "Off means off.", body: "A switched-off cell stops the tool from running, whatever the prompt says." },
        { label: "Team messages start closed.", body: "Sending a team message is off until an admin turns it on." },
        { label: "Documents are data, not orders.", body: "Text from files, the web and memory is read as reference, never as instructions." },
      ],
    },
  ],
  faq: [
    { q: "Can Orion change a record on its own?", a: "No. Every tool that writes is approval gated, and the run pauses on a card until you answer." },
    { q: "Can it delete things?", a: "Yes, through the same card. Deletes are tools with the same gate as every other write." },
    { q: "What data does it read?", a: "Your organization's records under its own permissions, the Texas RRC record, your files and logs, and the web when asked." },
    { q: "Which model is it?", a: "Chat and voice answer on Claude Opus 5, with Claude Haiku 4.5 setting the effort for each turn. Well-log questions go to Claude Fable 5." },
    { q: "Does it make up numbers?", a: "It is told to call a tool rather than answer from memory, to say when a tool returns nothing, and to cite the record it used." },
    { q: "Who on my team can use it?", a: "Only members with the AI permission see Orion, and admins switch areas off for the whole organization." },
    { q: "Does it read the team's messages?", a: "Reading is on by default and covers only threads the asking user is in. Sending starts off." },
    { q: "How long can a turn run?", a: "Up to 10 tool steps and 300 seconds in chat, 8 steps in voice." },
    { q: "What does voice need?", a: "A browser with a microphone. Speech is ElevenLabs, up to 5,000 characters per clip." },
    { q: "Is it on the phone?", a: "Yes. The mobile app has an Orion screen with your chat history." },
    { q: "How is it billed?", a: "In credits, where one credit is one cent. Each plan carries 10,000 to 50,000 credits a month." },
  ],
  siblings: [
    { slug: "dashboard", body: "The morning brief is Orion reading the wells that moved, the week's deadlines and the pumpers' notes." },
    { slug: "recon", body: "The RRC tools on this page are Recon's data, and Orion moves the Recon map." },
    { slug: "documents", body: "Uploads become approval cards behind the same rule as Orion's own writes." },
    { slug: "reports", body: "Orion reads any report aloud and schedules its delivery." },
  ],
};
