import type { ProductPageContent } from "./types";

/** Copy from docs/product-pages-plan.md, Reports. Each card's source is cited there. */
export const reportsPage: ProductPageContent = {
  hero: {
    eyebrow: "Reports",
    headline: "Every report, built before you ask.",
    subhead:
      "Twenty-four reports from your own gauges, tickets and statements, read on screen, downloaded as PDF, Excel or CSV, or emailed on your schedule.",
  },
  steps: [
    {
      title: "Log",
      body: "Pumpers gauge tanks, read meters and drop run tickets, and statements land in Documents.",
    },
    {
      title: "Build",
      body: "Each report is one loader and one column set, shared by the screen and the file, so the PDF and the Excel are two renderings of one table.",
    },
    {
      title: "Read",
      body: "Pick a report on the left and it opens as a document with stat tiles, narrative, charts and tables, with Orion ready to read it aloud.",
    },
    {
      title: "Schedule",
      body: "Flip a switch in the grid for daily, weekly or monthly, then pick an hour and a timezone once.",
    },
    {
      title: "Receive",
      body: "Reports are built at 2am Central, and everything due that morning arrives as one email with a three-sentence summary and the PDFs attached.",
    },
  ],
  sections: [
    {
      eyebrow: "The library",
      headline: "Twenty-four reports, one set of numbers.",
      body: "Every report reads the same loaders as its export and the production pages, so a figure never changes between the screen and the file.",
      screen: "library",
      cards: [
        {
          label: "Six groups",
          body: "Company, Production, Tanks, Wells, RRC and Pumper, in that order on the left.",
        },
        {
          label: "A report per well, automatically",
          body: "Each well's production history appears under Wells the day the well is added.",
        },
        {
          label: "Only what you may see",
          body: "The list is filtered by permission, and the schedule grid is built from that list, so nobody is offered a report they cannot open.",
        },
      ],
    },
    {
      eyebrow: "The Company Digest",
      headline: "The company, read in two minutes.",
      body: "One document a day, a week or a month, with the numbers first and the prose that explains them second.",
      screen: "digest",
      cards: [
        {
          label: "Headline tiles",
          body: "Oil, gas, water, oil sold and revenue, each with its move against the prior period. The monthly adds realized price against the benchmark.",
        },
        {
          label: "A written headline",
          body: "Two to four sentences written from the computed numbers. A plain fallback is written from the figures when the model is unavailable or the account is out of credit.",
        },
        {
          label: "Exceptions at the battery",
          body: "Any battery more than 20% off its own 30-day moving average, for oil or gas, is listed. Ungauged days are left out, not counted as zero.",
        },
        {
          label: "What the pumpers reported",
          body: "Reading remarks and facility comments are summarized in prose. A comment that says a well is down counts as an exception even when the barrels look normal.",
        },
        {
          label: "Three levels that reconcile",
          body: "Company, each lease and each well, with a lease exactly the sum of its wells. Unallocated dollars are shown, not hidden.",
        },
        {
          label: "Estimated, then settled",
          body: "Daily and weekly value each day's barrels at the realized price. The monthly settlement digest uses statement dollars and shows the earlier estimate as a variance.",
        },
        {
          label: "Price moves, not price alarms",
          body: "Realized against benchmark against last period is reported as context. It is never an exception.",
        },
      ],
    },
    {
      eyebrow: "Production reports",
      headline: "Production at every grain.",
      body: "The same per-well series rolled up by day, week, month, quarter and year, with the swings and the misses called out.",
      screen: "production",
      cards: [
        {
          label: "Daily Production",
          body: "Day by day for the company, scoped to a lease or a well.",
        },
        {
          label: "Weekly, Monthly, Quarterly, Annual",
          body: "One table per calendar period with the company total as its first row, picked from a period menu.",
        },
        {
          label: "Production Overview (Daily)",
          body: "The last 30 days, day by day, with the window printed in the title.",
        },
        {
          label: "Production Variance",
          body: "Oil, gas and water 1-day, 7-day and 30-day percent moves for the company, each lease and each well.",
        },
        {
          label: "Exception Report",
          body: "Every facility whose last three days diverge from its 30-day average, with the comment beside it. A stream nobody measured prints blank, not zero.",
        },
      ],
    },
    {
      eyebrow: "Tank reports",
      headline: "The tank battery, on paper.",
      body: "Everything a gauger, a hauler and an auditor ask about the tanks, from one set of readings.",
      screen: "tanks",
      cards: [
        {
          label: "Gauge History",
          body: "Every gauge as a field log per tank with the barrel change since the last reading, filtered to one battery or one tank.",
        },
        {
          label: "Simplified Production",
          body: "Opening, sales, dispositions, transfers, closing and production per tank, month to date.",
        },
        {
          label: "Battery Capacity",
          body: "Inches and barrels used against capacity per tank, grouped by battery with a company total.",
        },
        {
          label: "Tanks Called In",
          body: "The pickup queue, with stock, percent full, gatherer and days waiting.",
        },
        {
          label: "Tank Measurement Audit",
          body: "Who created, edited or deleted every gauge entry and when, deletions included.",
        },
        {
          label: "Transport Tickets and Water Disposed",
          body: "Run-ticket hauls, and SWD volumes from each injection well's meters over 7 or 30 days.",
        },
      ],
    },
    {
      eyebrow: "Wells, RRC and the pumper",
      headline: "What you file, already reconciled.",
      body: "The reports you reach for at month end, built from the same allocation the filing uses.",
      screen: "pumper",
      cards: [
        {
          label: "Well Test Report",
          body: "Tests, GOR, oil and water cut, downtime and allocation per producing well, injectors excluded.",
        },
        {
          label: "Gross vs Net Production",
          body: "Gross, working-interest, net-revenue and royalty volumes for oil, oil sales, gas and water, kept as distinct fractions.",
        },
        {
          label: "RRC Monthly Reconciliation",
          body: "Runs from run tickets allocated tank to well, dispositions, production, opening balance and lease-use gas, from the series every production page shows.",
        },
        {
          label: "RRC Monthly Well Detail",
          body: "Built from the Form PR builder's own records, so opening and closing are the tank gauges the filing reports.",
        },
        {
          label: "Pumper Report",
          body: "Which facilities were visited on which days over the last 30. A day counts once however many tanks were gauged, and a facility nobody reached is never dropped.",
        },
      ],
    },
    {
      eyebrow: "Downloads and Narrate",
      headline: "Read it, download it, hear it.",
      body: "One document, three ways out.",
      screen: "outputs",
      cards: [
        {
          label: "PDF, Excel or CSV",
          body: "Every report downloads in all three. A multi-table report's CSV is a zip of one file per table, and the menu says so.",
        },
        {
          label: "Excel with a sheet per level",
          body: "The digest workbook carries Company, By Lease and By Well sheets from the same object as the PDF.",
        },
        {
          label: "Narrate",
          body: "Orion reads the report aloud: prose as written, charts as conclusions and tables as framed figures. A second click stops him.",
        },
        {
          label: "Never narrates what you are not seeing",
          body: "The script is built from the document on screen.",
        },
      ],
    },
    {
      eyebrow: "Set once, sent by email",
      headline: "Switch it on, it arrives.",
      body: "A grid of reports by frequency, and one delivery setting for all of them.",
      screen: "schedule",
      cards: [
        {
          label: "Daily, weekly, monthly",
          body: "One row per report, a switch in each column.",
        },
        {
          label: "One hour, one timezone",
          body: "Any hour of the day in Central, Eastern, Mountain or Pacific, starting at 8am Central.",
        },
        {
          label: "Always a PDF",
          body: "Every scheduled report is attached as a PDF, one answer so nobody is surprised by the file.",
        },
        {
          label: "Addressed to you",
          body: "Switching a cell on subscribes you. Switching it off keeps the recipient list.",
        },
        {
          label: "Honest about what cannot send yet",
          body: "A report the overnight job cannot build shows its switches disabled and says it cannot be emailed yet.",
        },
      ],
    },
    {
      eyebrow: "Built overnight, sent on time",
      headline: "Written at 2am, read at 8.",
      body: "The heavy work happens while nobody is waiting, and a missed hour is caught up, never doubled.",
      cards: [
        {
          label: "Compiled at 2am Central",
          body: "Totals, narrative, PDF and the email summary are built overnight, so an 8am send leaves at 8am.",
        },
        {
          label: "One email per morning",
          body: "Everything due for the same cadence is one message with every PDF attached, not six emails on a Friday.",
        },
        {
          label: "Three sentences on top",
          body: "The body says what is notable inside the attachments and names what came. A plain fallback means an email is never held up.",
        },
        {
          label: "Friday, the 1st and the 20th",
          body: "The weekly covers seven complete days and sends Friday. The monthly production digest sends on the 1st, and the settled digest waits for statements until the 20th.",
        },
        {
          label: "Missed hours are caught up",
          body: "A send missed during downtime goes out on the next pass, and two passes in one minute send nothing twice.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "How many reports are there?",
      a: "Twenty-four named reports in six groups, plus one production history per well.",
    },
    {
      q: "Which reports can be emailed today?",
      a: "The Company Digest and the eight Production reports. The Tanks, Wells, RRC and Pumper reports show in the grid with their switches disabled until the overnight builder covers them.",
    },
    {
      q: "What format is the email attachment?",
      a: "PDF, always. Excel and CSV are download formats on the page.",
    },
    {
      q: "Who receives a scheduled report?",
      a: "The person who switched it on. There is no recipient picker in the grid.",
    },
    {
      q: "Who can change the schedule?",
      a: "The owner, an admin, or a member who can manage oil production, gas production, disposal or statements.",
    },
    {
      q: "Who can open the hub?",
      a: "Members with the reports permission, which needs both production and revenue viewing because one digest carries both.",
    },
    {
      q: "Does the digest use AI?",
      a: "The headline narrative and the pumper comments summary do, on the computed numbers only, never raw rows. A plain fallback is used when the account has no credit or the call fails.",
    },
    {
      q: "Does Narrate cost anything?",
      a: "It needs the AI permission, a voice key on the account and AI credit, and it is metered like chat.",
    },
    {
      q: "Are the RRC reports the filing?",
      a: "No. They reconcile what you would file. The Form PR itself is built on the Filings page.",
    },
    {
      q: "How fresh is a report?",
      a: "Digests are read from the 2am compile, so the page shows what the morning email carried. Every other report is rebuilt after an hour.",
    },
    {
      q: "Does a scheduled report ever send twice?",
      a: "No. Each send claims its period before mailing, so a second dispatcher stops there rather than in your inbox.",
    },
  ],
  siblings: [
    {
      slug: "dashboard",
      body: "The lease table's day is the digest's day, read on screen instead of in a PDF.",
    },
    {
      slug: "filings",
      body: "The RRC Monthly Reconciliation and Well Detail reports reconcile the Form PR the Filings page generates.",
    },
    {
      slug: "orion",
      body: "The voice that reads a report aloud is the same Orion you talk to in chat.",
    },
    {
      slug: "mobile",
      body: "The gauges, meter reads and comments the reports summarize are logged there.",
    },
  ],
};
