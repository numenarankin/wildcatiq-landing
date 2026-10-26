import type { ProductPageContent } from "./types";

/** Copy from docs/product-pages-plan.md, "Recon". Each card's source is cited there. */
export const reconPage: ProductPageContent = {
  hero: {
    eyebrow: "Recon",
    headline: "Every Texas well, on your map.",
    subhead:
      "One million RRC wellbores, their leases, permits and operators, clustered on one map with the filed record a click away.",
  },
  steps: [
    { title: "Pick what to show", body: "Show is a dropdown: Wells, Leases, Permits, Orphans or Operators." },
    {
      title: "Narrow it",
      body: "County, district, operator, officer, well type, status, depth, completion years, production rate and a drawn area all stack.",
    },
    {
      title: "Open the record",
      body: "A dot opens its well, lease or operator dossier with the RRC's own production, tests, filings and principals.",
    },
    {
      title: "Watch your counties",
      body: "Save an alert and get an email when a permit is filed or approved or a new well appears.",
    },
    { title: "Ask Orion", body: "Orion reads the same mirror through 28 RRC tools and can move the map for you." },
  ],
  sections: [
    {
      eyebrow: "Layers",
      headline: "Five ways to see Texas.",
      body: "Each mode draws a different RRC record set, clustered until you zoom in.",
      screen: "layers",
      cards: [
        {
          label: "Wells",
          body: "Draw 1,004,291 located wellbores with the RRC GIS viewer's own marks for oil, gas, dry, plugged, injection and shut-in.",
        },
        { label: "Leases", body: "See one dot per lease at the centroid of its scheduled wells, with its last-12 rate on hover." },
        {
          label: "Permits",
          body: "Color pending, approved and drilled permits three ways, filtered by filing purpose, status and date.",
        },
        {
          label: "Orphans",
          body: "Map about 12,000 orphan wells by whether the state has since plugged them.",
        },
        {
          label: "Operators",
          body: "Place every P-5 operator by mailing ZIP, filtered by well count, reported production and estimated revenue.",
        },
        {
          label: "Status inside the bubbles",
          body: "Every cluster carries its active, inactive and plugged counts, so the Status filter changes the bubbles too.",
        },
      ],
    },
    {
      eyebrow: "Filters",
      headline: "Narrow a million wells fast.",
      body: "Every control is a dropdown or a typed range, and every one narrows the same answer.",
      cards: [
        {
          label: "County and district",
          body: "Pick several at a time with type-ahead, across all 254 counties and 14 districts.",
        },
        {
          label: "Operator and officer",
          body: "Search a company, or a person to see every P-5 operator they are listed on.",
        },
        {
          label: "Type and status",
          body: "Filter on 22 RRC well types verbatim and one definition of active, inactive and plugged.",
        },
        {
          label: "Depth and completion year",
          body: "Type a range with the statewide population drawn behind the thumbs, one bar per well.",
        },
        {
          label: "Production rate",
          body: "Set oil bbl and gas MCF per month over the last twelve filed months, for a well or a lease.",
        },
        {
          label: "Draw an area",
          body: "Box, lasso or ring a well, and the panel lists how many wells the shape holds.",
        },
      ],
    },
    {
      eyebrow: "Dossiers",
      headline: "Open the record behind every dot.",
      body: "A click opens the RRC's filed record for the well, lease, operator, field or county.",
      screen: "dossier",
      cards: [
        {
          label: "Well dossier",
          body: "Read Summary, Production, Tests, Injection, Status, Compliance, Filings, Completions, Principals and Location.",
        },
        {
          label: "Lease dossier",
          body: "Read production, allowables, disposition by RRC code, counties, wells, purchaser and a map.",
        },
        {
          label: "Operator dossier",
          body: "See the P-5 profile, principals, every lease held, wells by status, permits and recent activity.",
        },
        {
          label: "Field and county",
          body: "Get the same production chart and leaderboards for a field or a county.",
        },
        {
          label: "Chart and table agree",
          body: "The monthly table under every chart is the chart's series, row for row, newest first.",
        },
        {
          label: "Completion packet",
          body: "Open the filed W-2 or G-1, its formations and the wellbore's path from surface to bottom.",
        },
      ],
    },
    {
      eyebrow: "Permits",
      headline: "See the rig before it arrives.",
      body: "Pending applications land on the map the night the RRC publishes them.",
      screen: "permits",
      cards: [
        {
          label: "Three states",
          body: "A pending permit leads with who and how long it has waited. An approved one counts from issue.",
        },
        {
          label: "Filing purpose",
          body: "Filter on new drill, recompletion, re-enter and the rest the loaded permits hold.",
        },
        {
          label: "The W-1 and plats",
          body: "Open the approved Form W-1 and its plats, newest first, for permits approved since 2020-08-28.",
        },
      ],
    },
    {
      eyebrow: "Browse",
      headline: "Read a company as a list.",
      body: "Type an operator and get every lease it holds as a tree, each opening to its wells.",
      screen: "browse",
      cards: [
        {
          label: "Every lease, uncapped",
          body: "The tree lists every lease of record for the operator, 6,851 for the largest.",
        },
        {
          label: "Same dossier, in the pane",
          body: "Pick a lease and the map's own dossier opens beside the tree, so every figure matches.",
        },
        {
          label: "Held, not filed",
          body: "Leases follow the lease master's operator of record, so a lease sold last month is already on the buyer.",
        },
      ],
    },
    {
      eyebrow: "Market",
      headline: "Know what the county produced.",
      body: "The RRC's own district and county rollups, scoped and charted.",
      screen: "market",
      cards: [
        {
          label: "Texas, districts or counties",
          body: "Pick the state, several districts or several counties, and the chart draws one line per area.",
        },
        {
          label: "Four streams",
          body: "Chart oil, gas, condensate and casinghead from the RRC's own cycle totals.",
        },
        {
          label: "Last cycle and 12-month average",
          body: "Read the last reported cycle and the trailing average, divided by the cycles in hand.",
        },
        {
          label: "Leaderboards",
          body: "Rank the top counties, fields, operators and leases on the monthly rate shown.",
        },
        {
          label: "Reported versus loaded",
          body: "The page names the cycle the RRC has reported through, so a lagging month never reads as zero.",
        },
      ],
    },
    {
      eyebrow: "Alerts",
      headline: "Hear about new activity first.",
      body: "Save the counties you care about and the mirror's nightly arrivals come to you by email. Alerts are in Beta.",
      screen: "alerts",
      cards: [
        {
          label: "Three things to watch",
          body: "Watch permits filed, permits approved and new wells. Nothing else, by design.",
        },
        {
          label: "Your counties",
          body: "Pick counties with the map's own picker, and a new alert starts on the counties the map shows.",
        },
        {
          label: "Daily or weekly",
          body: "Send it every day at the hour you pick, or weekly on Fridays.",
        },
        {
          label: "Every row opens in Recon",
          body: "Each line in the email links to that permit or well on the map.",
        },
        {
          label: "Nothing dropped",
          body: "Alerts read from a cursor, so a late mirror night is reported late and never skipped.",
        },
      ],
    },
    {
      eyebrow: "Land and midstream",
      headline: "See the land under the wells.",
      body: "Property lines and pipe draw on the same map once you are close enough to read them.",
      cards: [
        {
          label: "Survey tracts",
          body: "Draw 311,158 abstract polygons from zoom 12, so the grid reads as parcels.",
        },
        {
          label: "Pipelines",
          body: "Draw 470,554 segments over 350,305 miles, trunk lines statewide and gathering lines up close.",
        },
        {
          label: "Mineral owners",
          body: "Read the county appraisal roll on a lease's Minerals tab. Archer County's 2025 roll is loaded today.",
        },
      ],
    },
    {
      eyebrow: "Orion",
      headline: "Ask Orion about any operator.",
      body: "Orion reads the same mirror and keeps it apart from your own wells.",
      cards: [
        {
          label: "28 read tools",
          body: "Search wells, leases, operators, permits, market, disposal and minerals from the chat.",
        },
        {
          label: "Orion drives the map",
          body: "Orion sets the filters and the camera, so the map goes where the chat says it did.",
        },
        {
          label: "Summary on demand",
          body: "A dossier's written summary is a button, never a model call on every click.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Is Recon Texas only?",
      a: "Yes. The mirror is the Texas Railroad Commission's public record, and the map stays inside the state.",
    },
    {
      q: "Where does the data come from?",
      a: "A mirror of the RRC's own files on a separate read-only database. It covers wellbores, leases, permits, completions and production cycles.",
    },
    {
      q: "How fresh is it?",
      a: "Permits and arrivals reload nightly. Production comes in the RRC's monthly cycles, about three months behind, and every production screen names the last reported cycle.",
    },
    {
      q: "Is this my production data?",
      a: "No. Recon shows what operators filed with the state. Your own gauges, tickets and meters live on the Dashboard and well pages.",
    },
    {
      q: "What is \"Est. $/mo\"?",
      a: "An operator's trailing twelve months of reported production at today's WTI and gas quotes, divided by twelve. It is a prospecting sort, not revenue: gross, pre-royalty, no differentials.",
    },
    {
      q: "What do alerts cover?",
      a: "Permits filed, permits approved and new wells in the counties you pick, by email, daily or weekly. Not new operators and not production changes. Alerts are in Beta.",
    },
    {
      q: "Who in my company can use it?",
      a: "Every signed-in member. Recon carries no permission key because it is the public record, not company data.",
    },
    {
      q: "Does the map ever hide wells?",
      a: "When more wells match than the map draws, it shows the first 30,000 by API number and says so. Add a county, district or operator to see the full answer.",
    },
    { q: "Can I get the tables out?", a: "Yes. Any dossier table exports as CSV, Excel or PDF." },
    {
      q: "Does Recon file anything with the RRC?",
      a: "No. Recon reads. Form PR generation lives on Filings.",
    },
  ],
  siblings: [
    {
      slug: "filings",
      body: "The same RRC mirror supplies the lease names and prior ending storage your Form PR is checked against.",
    },
    { slug: "dashboard", body: "Your leases' production beside what the neighbors filed." },
    { slug: "orion", body: "Ask about any Texas operator in the same chat that knows your wells." },
    { slug: "reports", body: "The RRC reconciliation report compares your ledger with what the state holds." },
  ],
};
