import type { ProductPageContent } from "./types";

/** Copy from docs/product-pages-plan.md, Dashboard. Each card's source is cited there. */
export const dashboardPage: ProductPageContent = {
  hero: {
    eyebrow: "Dashboard",
    headline: "Know where every lease stands.",
    subhead:
      "Yesterday's barrels, what they were worth and what Orion flagged overnight, on one page the owner opens with coffee.",
  },
  steps: [
    {
      title: "Gauge",
      body: "Pumpers log tanks, meters and SWD on the phone, and the allocation engine turns each battery's day into per-well barrels.",
    },
    {
      title: "Add up",
      body: "The page reads each well's last complete measured day, rolls wells into leases and leases into the four cards, so every card is a column total.",
    },
    {
      title: "Price",
      body: "Each lease's barrels are valued at that lease's own realized price off live WTI and Henry Hub, then netted by its recorded interest.",
    },
    {
      title: "Project",
      body: "Every well's oil and gas get their own decline fit and are summed forward twelve months, off the page's critical path.",
    },
    {
      title: "Brief",
      body: "Orion reads the exceptions, the next seven days and the pumpers' comments, and writes three sentences at the top.",
    },
  ],
  sections: [
    {
      eyebrow: "Morning brief",
      headline: "What moved, before you look.",
      body: "Orion writes at most three sentences on what the data flagged overnight, and nothing else.",
      screen: "brief",
      cards: [
        {
          label: "Wells out of band",
          body: "A well whose last three gauged days average more than 25% above or below its own 30-day average is named with both figures.",
        },
        {
          label: "The next seven days",
          body: "Calendar events and task deadlines inside the week are listed with their day.",
        },
        {
          label: "What the pumpers wrote",
          body: "Comments on wells, tanks and meters from the last two weeks come through with the facility named.",
        },
        {
          label: "Silence when nothing is flagged",
          body: "With no exception, no event and no comment the brief is the greeting alone, and the model is never called.",
        },
        {
          label: "Facts, never causes",
          body: "The brief states what the numbers show. It never guesses why, never warns and never grades the operation.",
        },
        {
          label: "Sixty words",
          body: "The brief stops at three sentences and sixty words, and the page trims a runaway to its last full sentence.",
        },
      ],
    },
    {
      eyebrow: "The four cards",
      headline: "Four numbers, measured yesterday.",
      body: "The cards read the last complete gauged day, not a smoothed average, so a fresh gauge moves them.",
      screen: "cards",
      cards: [
        {
          label: "24hr oil prod",
          body: "Barrels per day from each well's newest measured day, summed.",
        },
        {
          label: "24hr gas prod",
          body: "MCF per day on the same basis, read per stream so a day the meter was read and no tank gauged never counts as zero oil.",
        },
        {
          label: "Est. net monthly rev",
          body: "The table's Net rev/day column carried over 30.4 days, counting only leases with an interest on file.",
        },
        {
          label: "Proj. 12-mo decline",
          body: "The fleet's forward twelve-month decline, as a percent per year.",
        },
        {
          label: "Two moves on every figure",
          body: "Day over day sits beside the 30-day move, each explained on hover.",
        },
      ],
    },
    {
      eyebrow: "One basis",
      headline: "Every number adds up.",
      body: "The cards, the chart, the pie and the table read one map of rates, so no two of them can disagree.",
      cards: [
        {
          label: "Cards are the table, added up",
          body: "The oil and gas cards are the Oil bbl/d and Gas mcf/d columns summed. The revenue card is the Net rev/day column times 30.4.",
        },
        {
          label: "The pie is the table, split",
          body: "Each slice is a share of the card above it, volumes and revenue alike.",
        },
        {
          label: "The chart nets like the cards",
          body: "The Revenue view nets one lease by its own interest, or by the company blend when it shows all of them.",
        },
        {
          label: "Each lease at its own price",
          body: "A lease's barrels are valued at its fitted realization against today's benchmark, and fall back to the company's when it has none.",
        },
      ],
    },
    {
      eyebrow: "The company chart",
      headline: "Six views of one field.",
      body: "One chart, a view menu and six window presets, drawn per day so a half-finished month never looks like a cliff.",
      screen: "chart",
      cards: [
        {
          label: "Oil, gas, revenue, saltwater",
          body: "Four production views share one menu with Oil decline and Gas decline.",
        },
        {
          label: "1M to All",
          body: "Presets run 1M, 3M, 6M, 12M, 5Y and All, with a day per point at 1M and a week per point at 3M and 6M.",
        },
        {
          label: "Rates, not bucket totals",
          body: "Every bucket is divided by the days it covers, so six days into a month reads as a rate, not a collapse.",
        },
        {
          label: "Ungauged days carry forward",
          body: "A week where eight of ten wells were gauged carries all ten wells' rates, not eight wells' barrels.",
        },
        {
          label: "Settled months marked",
          body: "Months past the last settled accounting month are shaded, so you see where the ledger ends and the estimate begins.",
        },
        {
          label: "Isolate a lease",
          body: "The lease picker is the table's rows, so the chart shows exactly the wells in that row.",
        },
        {
          label: "Your default window",
          body: "Settings > Charts picks the preset the chart opens on. The chart's settings add an average line.",
        },
      ],
    },
    {
      eyebrow: "Decline",
      headline: "A decline you can defend.",
      body: "The fleet decline is every well's own curve summed forward, not one line through the company total.",
      screen: "decline",
      cards: [
        {
          label: "One fit per well per stream",
          body: "A well's oil and its gas are two curves, fitted over your own measured production.",
        },
        {
          label: "Summed in net dollars",
          body: "Curves are projected month by month, priced, netted by each lease's interest and added. A lease you keep 80% of counts four times one you keep 20% of.",
        },
        {
          label: "The state's filings stay out",
          body: "The RRC record is drawn behind charts for context. It never enters a curve or an allocation.",
        },
        {
          label: "Young wells are not faked flat",
          body: "A stream with fewer than six post-peak months is left out and reported as coverage, not held at 0% a year.",
        },
        {
          label: "Card, curve, rows and Orion agree",
          body: "The card, the decline chart, the table's Decline column and Orion's decline answer are one derivation at three grains.",
        },
      ],
    },
    {
      eyebrow: "The lease table",
      headline: "Every lease, down to the well.",
      body: "One row per lease with its last complete day, opened into the wells that made it.",
      screen: "table",
      cards: [
        {
          label: "Six columns",
          body: "Lease, Oil bbl/d, Gas mcf/d, Runs 30d, Net rev/day and Decline.",
        },
        {
          label: "Who reported today",
          body: "A blue dot beside the lease name means something on it was read today, with the stamp on hover.",
        },
        {
          label: "Open a lease into its wells",
          body: "The caret expands a lease into well rows that add up to it, each with its own decline.",
        },
        {
          label: "Runs in the last 30 days",
          body: "Loads hauled off the lease's tanks. The cell is blank on a well because no well owns a tank.",
        },
        {
          label: "Sort any column",
          body: "Revenue sorts first by default. One click sorts descending, a second ascending, and wells sort under their lease.",
        },
        {
          label: "Click through",
          body: "A lease name opens its lease page. A well name opens its production page.",
        },
      ],
    },
    {
      eyebrow: "Who carries the company",
      headline: "Which lease pays the bills.",
      body: "The pie beside the chart shows which wells carry the company, in dollars or barrels.",
      screen: "pie",
      cards: [
        {
          label: "Revenue, oil or gas",
          body: "The card's title is the metric menu.",
        },
        {
          label: "By lease, by well, by commodity",
          body: "It opens by lease because the lease is what you price and settle by. Commodity is offered on revenue only.",
        },
        {
          label: "Same day as the cards",
          body: "Slices are shares of the table's last measured day, not twelve months of cumulative volume.",
        },
      ],
    },
    {
      eyebrow: "Prices and permissions",
      headline: "Live prices, your permissions.",
      body: "The benchmark lives in the topbar and the page is gated like everything else.",
      cards: [
        {
          label: "WTI and Henry Hub every minute",
          body: "The topbar ticker polls the cached Yahoo Finance feed once a minute. It hides for anyone without the pricing permission.",
        },
        {
          label: "A permission for the page",
          body: "The dashboard opens only for members with the analytics permission, and the data is read as that member through row security.",
        },
        {
          label: "A permission for the brief",
          body: "The brief needs the AI permission and AI credit. Without either it falls back to the plain greeting.",
        },
        {
          label: "Ask Orion the same question",
          body: "Orion's decline and production answers return the figures the card and chart draw, so the chat never contradicts the screen.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Is the production on the cards an average?",
      a: "No. It is each well's last complete measured day, summed. The 30-day move beside it is the smoothed comparison.",
    },
    {
      q: "Does the dashboard write anything?",
      a: "No. It is read only. Orion's brief is text on the page, not a record.",
    },
    {
      q: "What does the brief cover?",
      a: "Wells more than 25% off their own 30-day average, calendar and task deadlines in the next seven days, and pumper comments from the last two weeks. It never restates production, revenue, decline or prices, because the cards and the ticker already show them.",
    },
    {
      q: "What if Orion is off or we are out of credit?",
      a: "The page still loads in full, and the brief is replaced by the plain greeting.",
    },
    {
      q: "Where do prices come from?",
      a: "WTI and Henry Hub come from Yahoo Finance, cached server side. Each lease's realized price is fitted from its own statements.",
    },
    {
      q: "Does the decline use the RRC's data?",
      a: "No. Curves are fitted to your own tank and meter measurements only. The public record is drawn for context.",
    },
    {
      q: "Why does the decline card show a dash?",
      a: "No stream has six post-peak months to fit yet. While the full history is still loading, the card shows a placeholder first.",
    },
    {
      q: "Who can see it?",
      a: "Members with the analytics permission. The price ticker shows only for members with the pricing permission.",
    },
    {
      q: "Can I change the chart's default window?",
      a: "Yes. Settings > Charts sets the preset the chart opens on.",
    },
  ],
  siblings: [
    {
      slug: "reports",
      body: "The Daily Company Digest carries the same leases and exceptions as a PDF in your inbox at 8am.",
    },
    {
      slug: "orion",
      body: "Ask for any lease's decline or production and get the number the card shows.",
    },
    {
      slug: "mobile",
      body: "The gauges the pumpers log on the phone are the rows these cards add up.",
    },
    {
      slug: "flow-map",
      body: "The allocation that turns a battery's day into per-well barrels is drawn there, per lease.",
    },
  ],
};
