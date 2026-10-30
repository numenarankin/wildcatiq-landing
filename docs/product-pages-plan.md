# Product pages plan

> **Superseded on card counts and length (2026-10-30).** The 39 to 60 cards per page below were cut to 4 to 6 sections of three one-sentence cards. The copy now lives in `src/lib/product/*.ts` under the budgets in `docs/copy-review.md`. Run `npx tsx --tsconfig tsconfig.json scripts/check-copy.ts` before changing copy.

Written 2026-10-26. Companion to `landing-redesign-plan.md` and `landing-copy.md`. This doc holds the copy and the pseudoscreenshot spec for each of the eight product pages, drafted from a review of the wildcat and wildcat-phone code. Every capability card and FAQ answer cites the source file so the copy can be checked against the app before it ships. Source paths are relative to `/home/linuxuser/dev/wildcat` (or `wildcat-phone` where stated) unless prefixed `landing/`.

The current pages have three or four one-line blocks each. These drafts run 39 to 60 cards per page. That is deliberate: the reference product pages (see `reference/<site>/*.md`) sell depth through repetition of one small unit, and the app has the surface to fill them. Cut from the drafts, do not pad.

## Page shape

Every product page follows the same order. It is the shape shared by the reference pages that explain a single feature well (Ramp accounts-payable, Harvey vault, Linear build, V7 tables, Rho treasury).

1. **Hero.** Eyebrow is the feature name. Headline is an outcome in six words or fewer. One-sentence subhead. Get started | Book a demo. One pseudoscreenshot of the feature's main surface.
2. **How it works.** Three to five numbered steps, verb headline plus one sentence. Omitted only where the feature has no flow.
3. **Sections.** Six to ten, grouped by the job the operator is doing, not by where it sits in the UI. Each has an eyebrow, an outcome headline, a one-sentence body, three to six cards (`**Label.** One sentence.`) and a pseudoscreenshot of that part of the app.
4. **FAQ.** Six to eleven questions. Hard facts only: what it does not do, what needs approval, what still happens on the RRC portal, formats, limits, offline behavior, permissions, which model.
5. **Siblings.** Four related product pages, one sentence each on how they connect.
6. **Closing CTA.** One brand line reused on every page, same two buttons as the hero. To be chosen once in `landing-copy.md`.

No testimonials, no stats strip, no logo wall, on any page, until there is real proof. The reference sites put one quote per page and feature-specific stats; we leave those slots empty rather than fake them.

## Pseudoscreenshots

Every mock is the real app component ported into `landing/src/components/screens/` and fed a fixture, the way `dashboard-live.tsx` already wraps `DashboardOverview`, `MorningBriefStatic` and the analytics lib. That is the fidelity standard. Hand-drawn approximations are retired, not extended.

- One screen per section, not one per page. Each section's screen shows a different part of the app in a specific state (a tab open, a row expanded, an approval card pending). The spec under each section names the component, the file, the state and the fixture rows.
- Port the component and its pure libs. Stub Supabase, server actions and `"use server"` imports at the edge. The landing repo stays free of `@supabase` and server actions.
- Phone screens are DOM transcriptions of the React Native layout with the same data (`mobile-screen.tsx` is the pattern: it mirrors `tank-gauge-modal.tsx` on `fullscreen-data-entry.tsx`). They are not direct imports.
- Mapbox surfaces (Recon, structure maps) need a decision per mock: static tiles or the GL component with a public token. The Recon section says which.
- Realistic field data only, from the shared fixture operator below. No lorem ipsum, no round numbers.

## Prose rules

`landing-copy.md` lines 1 to 25 apply to every line here and were checked by grep on the drafts: outcome headlines of six words or fewer, feature name in the eyebrow, one claim per sentence, lead with the verb, the operator's vocabulary untranslated, numbers over adjectives, no em dashes, no semicolons, no exclamation points, none of "powerful", "seamless", "robust", "leverage". The AI's limits are stated as features. "Nothing is saved until you approve it" appears on Orion and Documents, backed by `lib/ai/tools.ts:266-273,333-349` and `lib/ai/ingest/actions.ts:2182-2272`.

## Decisions needed before building

The review found places where the code, the current copy and the architecture docs disagree. Each needs a call from the owner. The per-page Open questions sections carry the detail and citations.

1. **Orion deletes.** `lib/ai/tools-surface.ts` registers about 290 tools, roughly 195 approval gated, including 106 delete or remove tools. `system-prompt.ts:226` and `wildcat.md:30` still say "no delete tools". The Orion draft sells "deletes included, every one gated". Pick one and fix the other.
2. **Lease terms on Documents.** The current "Lease terms too" block describes the hand-entered lease Land record (`lib/leases/land.ts`, `obligations.ts`). No ingest type reads lease terms. Move it to a Leases mention elsewhere or drop it.
3. **Filings docket.** "Filed" status has no UI path (`MarkFiledModal` exists, nothing mounts it), the docket shows Month / Status / File and no due date, and it lists twelve cycles regardless of sign-up. The current copy's "Due dates and status in one docket" and the fixture's four filed rows with confirmation numbers overstate. The draft sells Generate, Review, Download and the validator, and says Beta.
4. **Flow map volumes.** "Volumes on every line" is false. Pills appear only on downstream legs (`flow-map.tsx:1454-1462`). The draft says what is actually drawn.
5. **Morning brief.** The brief never reports oil, gas, revenue, prices or causes. It covers wells more than 25% off their own 30-day average, deadlines inside seven days, and pumper comments, and is the greeting alone when all three are empty (`src/app/api/dashboard/brief/route.ts:39-51,121-129`). The current fixture's brief violates all of this and the home page's "Orion writes what moved overnight and why it matters" is wrong on "why". Rewrite both.
6. **Report count.** The hub has 24 named reports in six groups plus one production history per well (`src/lib/reports/hub/sources.ts`), not 21. Only the Company Digest and the 8 Production reports can be scheduled, scheduled sends are PDF only, and subscriptions go to the signed-in user with no recipient picker (`schedule/catalog.ts:18-56`).
7. **Recon access.** `wildcat.md:127` says early access. The sidebar entry and routes gate only on a signed-in user (`app-shared.tsx:177-187`, `recon/page.tsx:41`). The draft says every member has it.
8. **Recon alerts.** Built, but migration `2026100200100` and Tiger `sql/022` are recorded as not applied remotely. Sell as Beta or confirm they are live first.
9. **Phone features not shippable yet.** No multi-org switcher exists in wildcat-phone. Voice Orion is built but unmounted (`app-header.tsx:7-9`), so only dictation and read-aloud are live. Push has never registered a device. Data Entry file picking, statement upload and Export are stubs. The draft leaves all of these out.
10. **Models.** Code runs Opus 5 with a Haiku 4.5 router and Fable 5 for geology. `wildcat.md` still says 4.8. The FAQ answers follow the code.

## Fixture reconciliation

Any quantity shown on more than one page must agree, and there must be one source. Today there are seven fixtures in `landing/src/lib/screens/` written independently, and they disagree:

| Quantity | Conflict |
|---|---|
| Well list | dashboard-fixture has 14 wells, reports-fixture has 10 differently named wells, over the same five leases |
| Smith 1 to 4 oil rates | 12 / 16 / 9 / 11 bbl/d (dashboard) vs 18.4 / 12.1 / 9.6 / 24.8 (flow map) |
| Prices | WTI 60.12 and HH 2.41 (dashboard) vs 61.4 and 2.9 (recon, flow map) |
| Smith tank | "Smith battery Tank 1" with a uuid id (orion) vs "Smith T201", id `t-sm-201` (documents) |
| Tank strapping | 2.7778 bbl/in (mobile hero) vs 1.67 (flow map) |
| Filings docket | five cycles with four "filed" rows (fixture) vs twelve cycles and no filed state (app) |

Proposal: one `landing/src/lib/screens/operator.ts` that defines the operator once, and every page fixture derives from it.

- **Operator.** Wilder Oil Co, Martin County (317), District 08, owner Hank. `FIXTURE_TODAY` 2026-10-27.
- **Leases and wells.** Five leases, fourteen wells, one list with RRC lease numbers, NRI per lease, and per-well oil, gas and water rates on the last gauged day plus 30-day averages.
- **Month.** September 2026 volumes and run counts per lease, used by the Dashboard month, the Recon lease dossier's September row, the Form PR 202609 records, and the Reports digest.
- **Prices.** One WTI and one Henry Hub, with each lease's realization factor.
- **Facilities.** Batteries, tanks (ids, names, strapping), meters and SWD per lease, used by Flow map, Mobile and Documents.
- **Events.** Roy Corbett 4 downtime Oct 21 to 23, the Oct 26 Smith gauge at 15.44 in, Johnson A September 1,061.4 bbl at $60.88, the Form PR due date, and the pumper comments the brief cites.

Each page's Fixture notes section lists the exact fields it reads.

## Build order

Dashboard first. Its hero is already the real page, its sections reuse components already ported, and it exercises the shared operator fixture end to end. Then Orion and Documents (approval card is shared), Mobile, Reports, Filings, Flow map, Recon (Mapbox decision last).

---

# Dashboard

Source paths below are relative to `/home/linuxuser/dev/wildcat` unless prefixed `landing/` (= `/home/linuxuser/dev/wildcatiq-landing`).

## Intent
Make the owner-operator believe that one page, opened once a day, tells them what every lease made yesterday, what it was worth, how fast it is falling and what Orion flagged, and that every number on it adds up to every other. Read by the owner-operator first and the office manager second. A pumper does not use this page.

## Hero
- Eyebrow: Dashboard
- Headline: Know where every lease stands.
- Subhead: Yesterday's barrels, what they were worth and what Orion flagged overnight, on one page the owner opens with coffee.
- CTAs: Get started | Book a demo
- Screen: `landing/src/components/screens/dashboard-live.tsx` already renders the real page in order: `MorningBriefStatic` (`src/components/analytics/morning-brief.tsx`), `DashboardOverview` (`src/components/analytics/dashboard-overview.tsx`, which is `SummaryStats` + `CompanyCharts` + `LeaseSummaryTable`) and `ProductionByWellPie`. State: brief finished, four cards populated, chart on Oil production at 1M, pie on Revenue by lease, lease table sorted by Net rev/day with no lease expanded. Fixture: `landing/src/lib/screens/dashboard-fixture.ts` covers everything except the decline card and decline column, which the live app fills from `/api/analytics/company`. Add a `FleetDecline` to the fixture (`fleetDecline(fx.streams, ...)` from the ported `fleet-decline.ts`) and pass it so the card reads a number, not a skeleton. Rewrite `morningBrief()` to the prompt's three sections (see Open questions).

## How it works
1. **Gauge.** Pumpers log tanks, meters and SWD on the phone, and the allocation engine turns each battery's day into per-well barrels (`src/app/dashboard/page.tsx:99-116`).
2. **Add up.** The page reads each well's last complete measured day, rolls wells into leases and leases into the four cards, so every card is a column total (`src/app/dashboard/page.tsx:126-144`).
3. **Price.** Each lease's barrels are valued at that lease's own realized price off live WTI and Henry Hub, then netted by its recorded interest (`src/lib/analytics/lease-summaries.ts:39-47`, `src/app/dashboard/page.tsx:167-178`).
4. **Project.** Every well's oil and gas get their own decline fit and are summed forward twelve months, off the page's critical path (`src/lib/analytics/company-decline.ts:27-38`, `src/app/api/analytics/company/route.ts:39-47`).
5. **Brief.** Orion reads the exceptions, the next seven days and the pumpers' comments, and writes three sentences at the top (`src/app/api/dashboard/brief/route.ts:39-45`).

## Sections

### 1. Morning brief
- Headline: What moved, before you look.
- Body: Orion writes at most three sentences on what the data flagged overnight, and nothing else.
- Cards:
  - **Wells out of band.** A well whose last three gauged days average more than 25% above or below its own 30-day average is named with both figures. (source: `src/app/api/dashboard/brief/route.ts:41,47`, `src/lib/analytics/morning-brief.ts:33`)
  - **The next seven days.** Calendar events and task deadlines inside the week, with their day. (source: `src/app/api/dashboard/brief/route.ts:42`, `src/lib/analytics/morning-brief.ts:306-317`)
  - **What the pumpers wrote.** Comments on wells, tanks and meters from the last two weeks, with the facility named. (source: `src/app/api/dashboard/brief/route.ts:43`, `src/lib/analytics/morning-brief.ts:34,143-147`)
  - **Silence when nothing is flagged.** With no exception, no event and no comment the brief is the greeting alone, and the model is never called. (source: `src/app/api/dashboard/brief/route.ts:121-129`)
  - **Facts, never causes.** The brief states what the numbers show and never guesses why, never warns and never grades the operation. (source: `src/app/api/dashboard/brief/route.ts:61-70`)
  - **Sixty words.** The prompt caps the brief at three sentences and sixty words, and the page trims a runaway to its last full sentence. (source: `src/app/api/dashboard/brief/route.ts:39`, `src/components/analytics/morning-brief.tsx:63-71`)
- Screen: `MorningBriefStatic` with a brief written to the three sections, e.g. "**Roy Corbett 4** averaged **0.0 bbl/d** over its last three gauged days against **17.8 bbl/d** over the last 30. The **Form PR** for September is due **Friday**. On **Roy Corbett 4**, the pumper noted the downhole pump was pulled Tuesday." Fixture rows: `w-rc4` with `downDays` already in `dashboard-fixture.ts`.

### 2. The four cards
- Headline: Four numbers, measured yesterday.
- Body: The cards read the last complete gauged day, not a smoothed average, so a fresh gauge moves them.
- Cards:
  - **24hr oil prod.** Barrels per day from each well's newest measured day, summed. (source: `src/components/analytics/summary-stats.tsx:134`, `src/app/dashboard/page.tsx:117,143`)
  - **24hr gas prod.** MCF per day on the same basis, read per stream so a day the meter was read and no tank gauged does not count as zero oil. (source: `src/components/analytics/summary-stats.tsx:140`, `src/app/dashboard/page.tsx:103-105`)
  - **Est. net monthly rev.** The table's Net rev/day column carried over 30.4 days, counting only leases with an interest on file. (source: `src/components/analytics/summary-stats.tsx:149`, `src/app/dashboard/page.tsx:155-178`)
  - **Proj. 12-mo decline.** The fleet's forward twelve-month decline as a percent per year. (source: `src/components/analytics/summary-stats.tsx:155`, `src/components/analytics/summary-stats.tsx:32-35`)
  - **Two moves on every figure.** Day over day beside the 30-day move, a week's average against a week's a month ago, each explained on hover. (source: `src/components/analytics/move-pair.tsx:11-19`, `src/app/dashboard/page.tsx:118-120`)
- Screen: `SummaryStats` with the fixture's `cards` plus a decline value. Fixture: `fx.cards` in `dashboard-fixture.ts`.

### 3. One basis
- Headline: Every number adds up.
- Body: The cards, the chart, the pie and the table read one map of rates, so no two of them can disagree.
- Cards:
  - **Cards are the table, added up.** Oil and gas cards are the Oil bbl/d and Gas mcf/d columns summed, and the revenue card is the Net rev/day column times 30.4. (source: `src/app/dashboard/page.tsx:126-144,155-157`)
  - **The pie is the table, split.** Each slice is a well's share of the card above it, volumes and revenue alike. (source: `src/app/dashboard/page.tsx:225-241`)
  - **The chart nets like the cards.** The Revenue view nets one lease by its own interest, or the company blend when it shows all of them. (source: `src/app/dashboard/page.tsx:206-211`)
  - **Each lease priced at its own price.** A lease's barrels are valued at its fitted realization against today's benchmark, falling back to the company's when it has none. (source: `src/lib/analytics/lease-summaries.ts:39-47`)
- Screen: none

### 4. The company chart
- Headline: Six views of one field.
- Body: One chart, a view menu and six window presets, drawn per day so a half-finished month never looks like a cliff.
- Cards:
  - **Oil, gas, revenue, saltwater.** Four production views plus Oil decline and Gas decline in the same menu. (source: `src/components/analytics/company-charts.tsx:110-117`)
  - **1M to All.** Presets at 1M, 3M, 6M, 12M, 5Y and All, with a day per point at 1M and a week per point at 3M and 6M. (source: `src/components/analytics/company-charts.tsx:120-137`)
  - **Rates, not bucket totals.** Every bucket is divided by the days it covers, so six days into a month reads as a rate, not a collapse. (source: `src/components/analytics/company-charts.tsx:436-446`)
  - **Ungauged days carry forward.** A week where eight of ten wells were gauged carries all ten wells' rates, not eight wells' barrels. (source: `src/components/analytics/company-charts.tsx:470-482`)
  - **Settled months marked.** Months past the last official accounting month are shaded so you can see where the ledger ends and the estimate begins. (source: `src/components/analytics/company-charts.tsx:686-694`)
  - **Isolate a lease.** The lease picker is the table's rows, so the chart shows exactly the wells in that row. (source: `src/components/analytics/company-charts.tsx:662`, `src/app/dashboard/page.tsx:214-224`)
  - **Your default window.** Settings > Charts picks the preset the chart opens on, and the settings popover adds an average line. (source: `src/components/analytics/company-charts.tsx:309-316,802-804`, `src/lib/settings/actions.ts:44-57`)
- Screen: `CompanyCharts` on Revenue at 3M with the average line on and the last month shaded as unofficial. Fixture: `fx.monthly`, `fx.dailyByWell`, `fx.chartLeases`, `fx.nriByLease`, and `official: false` on the final month is already set.

### 5. Decline
- Headline: A decline you can defend.
- Body: The fleet decline is every well's own curve summed forward, not one line through the company total.
- Cards:
  - **One fit per well per stream.** A well's oil and its gas are two curves, fitted over the operator's own measured production. (source: `src/lib/analytics/fleet-decline.ts:24-31`, `src/lib/analytics/company-decline.ts:27-38`)
  - **Summed in net dollars.** Curves are projected month by month, priced, netted by each lease's interest and added, so a lease you keep 80% of counts four times one you keep 20% of. (source: `src/lib/analytics/fleet-decline.ts:33-38`, `src/lib/analytics/company-decline.ts:60-69`)
  - **The state's filings stay out of the fit.** The RRC record is drawn behind charts for context and never enters a curve or an allocation. (source: `src/lib/analytics/company-decline.ts:54-58`)
  - **Young wells are not faked flat.** A stream with fewer than six post-peak months is excluded and reported as coverage, not held at 0%/yr. (source: `src/lib/analytics/fleet-decline.ts:46-53`)
  - **Card, curve, rows and Orion agree.** The card, the decline chart, the lease table's Decline column and Orion's `get_decline` tool are one derivation at three grains. (source: `src/components/analytics/dashboard-overview.tsx:21-37`, `src/lib/ai/tools.ts:824-826`)
- Screen: `CompanyCharts` on Oil decline, with the fitted regimes and the twelve-month projection, beside the Proj. 12-mo decline card. Fixture: `fx.streams` run through `fleetDecline`.

### 6. The lease table
- Headline: Every lease, down to the well.
- Body: One row per lease with its last complete day, opened into the wells that made it.
- Cards:
  - **Six columns.** Lease, Oil bbl/d, Gas mcf/d, Runs 30d, Net rev/day and Decline. (source: `src/components/analytics/lease-summary-table.tsx:107-116`)
  - **Who reported today.** A blue dot beside the lease name means something on it was read today, with the stamp on hover. (source: `src/components/analytics/lease-summary-table.tsx:135-139`)
  - **Open a lease into its wells.** The caret expands a lease into well rows that add up to it, with each well's own decline. (source: `src/components/analytics/lease-summary-table.tsx:145-150`)
  - **Runs in the last 30 days.** Loads hauled off the lease's tanks, blank on a well because no well owns a tank. (source: `src/components/analytics/lease-summary-table.tsx:110-113`, `src/lib/leases/lease-activity.ts:61`)
  - **Sort any column.** Revenue first by default, one click descending, a second ascending, wells sorting under their lease. (source: `src/components/analytics/lease-summary-table.tsx:152-154`)
  - **Click through.** A lease name opens its lease page and a well name opens its production page. (source: `src/components/analytics/lease-summary-table.tsx:315-320,355-360`)
- Screen: `LeaseSummaryTable` with Johnson A expanded to its four wells and a blue dot on every lease. Fixture: `fx.leaseRows`, `fx.wellRows`, `lastReportedAt: FIXTURE_TODAY`, plus `declineByRow` from the fleet decline.

### 7. Who carries the company
- Headline: Which lease pays the bills.
- Body: The pie beside the chart answers which wells carry the company, in dollars or barrels.
- Cards:
  - **Revenue, oil or gas.** The card's title is the metric menu. (source: `src/components/analytics/production-by-well-pie.tsx:23-30`)
  - **By lease, by well, by commodity.** It opens by lease because the lease is what you price and settle by, and commodity is offered on revenue only. (source: `src/components/analytics/production-by-well-pie.tsx:37-44,114-115`)
  - **Same day as the cards.** Slices are shares of the lease table's last measured day, not twelve months of cumulative volume. (source: `src/app/dashboard/page.tsx:225-231`)
- Screen: `ProductionByWellPie` on Revenue by lease. Fixture: `fx.pieWells`, `fx.leaseByWell`.

### 8. Prices and permissions
- Headline: Live prices, your permissions.
- Body: The benchmark lives in the topbar and the page is gated like everything else.
- Cards:
  - **WTI and Henry Hub every minute.** The topbar ticker polls the cached Yahoo Finance feed once a minute and hides for anyone without `view_pricing`. (source: `src/components/price-ticker.tsx:16-26`)
  - **A permission for the page.** The dashboard opens only for members with `view_analytics`, and the data is read as that user through row security. (source: `src/app/dashboard/page.tsx:66-69`)
  - **A permission for the brief.** The brief needs `use_ai` and AI credit, and falls back to the plain greeting without either. (source: `src/app/api/dashboard/brief/route.ts:94-108`, `src/components/analytics/morning-brief.tsx:9-15`)
  - **Ask Orion the same question.** Orion's `get_decline` and `get_production` tools return the figures the card and chart draw, so the chat never contradicts the screen. (source: `src/lib/ai/tools.ts:519-521,824-826`)
- Screen: none

## FAQ
- **Is the production on the cards an average?** No. It is each well's last complete measured day summed, and the 30-day move beside it is the smoothed comparison. (source: `src/app/dashboard/page.tsx:99-116`, `src/components/analytics/move-pair.tsx:15-19`)
- **Does the dashboard write anything?** No. It is read only, and Orion's brief is text on the page, not a record. (source: `src/app/dashboard/page.tsx:61-123`)
- **What does the brief cover?** Wells more than 25% off their own 30-day average, calendar and task deadlines in the next seven days, and pumper comments from the last two weeks. It never restates production, revenue, decline or prices, because the cards and ticker already show them. (source: `src/app/api/dashboard/brief/route.ts:39-51`)
- **What if Orion is off or we are out of credit?** The page still loads in full and the brief is replaced by the plain greeting. (source: `src/components/analytics/morning-brief.tsx:9-15`, `src/app/api/dashboard/brief/route.ts:100-108`)
- **Where do prices come from?** WTI and Henry Hub from Yahoo Finance, cached server side, and each lease's realized price is fitted from its own statements. (source: `src/components/price-ticker.tsx:16-20`, `src/lib/analytics/lease-summaries.ts:39-47`)
- **Does the decline use the RRC's data?** No. Curves are fitted to your own tank and meter measurements only, and the public record is drawn for context. (source: `src/lib/analytics/company-decline.ts:54-58`)
- **Why does the decline card show a dash?** Either no stream has six post-peak months to fit, or the full history has not loaded yet, in which case it shows a skeleton first. (source: `src/lib/analytics/fleet-decline.ts:46-53`, `src/components/analytics/dashboard-overview.tsx:91-97`)
- **Who can see it?** Members with `view_analytics`, and the ticker only for members with `view_pricing`. (source: `src/app/dashboard/page.tsx:69`, `src/components/price-ticker.tsx:23-26`)
- **Can I change the chart's default window?** Yes, Settings > Charts sets the preset the chart opens on. (source: `src/components/analytics/company-charts.tsx:309-314`, `src/lib/settings/actions.ts:44-57`)

## Siblings
- **Reports**: the Daily Company Digest carries the same leases and exceptions as a PDF in your inbox at 8am.
- **Orion**: ask for any lease's decline or production and get the number the card shows.
- **Mobile**: the gauges the pumpers log on the phone are the rows these cards add up.
- **Flow map**: the allocation that turns a battery's day into per-well barrels is drawn there, per lease.

## Fixture notes
The dashboard and reports fixtures are two different operators today. The dashboard has 14 wells (Johnson A 1 to 4, Smith 1 to 4, Roy Corbett 4 and 5, Fannie Young 2A and 3, Roach Parrott 7 and 8) and the reports digest has 10 wells with other names (Johnson A 1 to 3, Smith 1 and 2, Roy Corbett 1 and 2, Fannie Young 1 and 2, Roach Parrott 1). They share the five leases, the NRIs (0.8125, 0.78, 0.75, 0.8, 0.875) and the prices ($60.12/bbl, $2.41/mcf). One shared operator needs:
- `FIXTURE_TODAY` (dashboard uses 2026-10-27, digest closes on 2026-09-30, keep both but derive from one constant).
- One well list with `id`, `name`, `lease`, September oil rate (bbl/d), GOR, water ratio, and `on`/`downDays` so Roy Corbett 4's six down days appear in both.
- Per-lease `oilSales` for September (digest) consistent with the dashboard's `runs30d`.
- The operator and owner names (`Wilder Oil Co`, `Hank`) in both briefs.
- `PRICES` and `PRIOR_*_PRICE` in one place.
- A `FleetDecline` for the card and the Decline column, so the Proj. 12-mo decline number is the same wherever it prints.

## Open questions
- **The fixture brief contradicts the real prompt.** `landing/src/lib/screens/dashboard-fixture.ts` `morningBrief()` opens with the company oil rate and its monthly move, says a statement "matched all 148 run tickets" and gives a cause ("downhole pump change"). The prompt forbids company rates, prices and causes and limits the brief to exceptions, the next seven days and comments (`src/app/api/dashboard/brief/route.ts:41-51,61`). Rewrite to the three sections.
- **Current copy says "Ask Orion about whatever chart you have open."** The dashboard publishes no page-context slice (no `AiSlice` use under `src/components/analytics`), so Orion does not see the open chart. It answers from `get_decline`/`get_production`, which return the same numbers. Sell "same number" rather than "sees your chart".
- **Current copy says the brief reports "Oil, gas and net revenue per day."** The cards do, the brief is forbidden to (`src/app/api/dashboard/brief/route.ts:50`).
- **Decline card can be blank by permission.** A user without `view_analytics` on the history route gets a silent blank card (`src/app/api/analytics/company/route.ts:27-37`). Not a selling point, just do not show a dash in the hero.
- **Saltwater view is volumes only.** The chart's Salt water view exists (`company-charts.tsx:114`) but there is no saltwater card, and the lease table has no water column. Do not imply one.
- **The analytics `CalendarWidget` (`src/components/analytics/calendar-widget.tsx`) is no longer on the page**, the agenda moved to `/agenda` (`dashboard-overview.tsx:143-145`). Do not show a calendar on the dashboard screen.
- **wildcat.md is behind the code here.** It describes Analytics as "merging official accounting revenue with unofficial production_readings" (`/home/linuxuser/dev/wildcat.md`, Analytics line). The shipped page is the last-measured-day basis described above. Trust `page.tsx`.

---

# Orion

All paths below are under `/home/linuxuser/dev/wildcat/src/` unless they start with `/`. Tool counts were taken 2026-10-26 with `grep -cE '^\s{4}[a-z_0-9]+: (tool|batchTool)\('` per file.

## Intent
This page is FOR convincing an owner-operator that Orion is an analyst wired into their own records and the Texas public record, not a chat window, and that it cannot change a record without them tapping Approve. The reader is the owner-operator first, the office manager second. After reading they must believe three things: it reads everything (their wells, tickets, statements, files, logs, the RRC), it works the math and shows it, and nothing is saved until they approve it.

## Hero
- Eyebrow: Orion
- Headline: An analyst, not a chatbot.
- Subhead: Orion reads your wells, your paperwork and the state's record together, works the math, and waits for your OK before it changes a thing.
- CTAs: Get started | Book a demo
- Screen: the existing `/home/linuxuser/dev/wildcatiq-landing/src/components/screens/orion-live.tsx` already covers it. It plays the app's own `OrionConversationList` + `OrionChat` (`components/ai/orion-conversation-list.tsx`, `components/ai/orion-chat.tsx`) through one scripted exchange: Hank types the Smith 4 gauge, Orion works the tank math, a `record_tank_reading` approval card appears (the real `ApprovalCard`, `components/ai/tool-approval.tsx:176`), Hank approves, the saved outcome lands. Fixture is `/home/linuxuser/dev/wildcatiq-landing/src/lib/screens/orion-fixture.ts` (Wilder Oil Co, Smith battery Tank 1, Oct 27). Add nothing for the hero. Keep the pending-approval frame on screen longest, it is the page's thesis.

## How it works
1. **Ask in your own words.** Type or talk. "Smith 4 gauged 18 inches, record it" is a complete request (`lib/ai/system-prompt.ts:60-62`).
2. **Orion pulls the records.** It calls the company's data and the RRC mirror through tools, never from memory, and names the source it used (`lib/ai/system-prompt.ts:222`, `lib/ai/manifest.ts:13-17`).
3. **It works the math and shows it.** Decline fits, allocation splits, offsets and rankings run in code, and a chart is drawn when the shape matters (`lib/ai/tools.ts:824`, `lib/ai/company/dispatch.ts:30`, `lib/ai/tools.ts:760`).
4. **Every change is an approval card.** A write stops the run and puts a plain-English card in front of you. Approve, deny, or edit the rows (`lib/ai/tools.ts:269`, `components/ai/tool-approval.tsx:176-190`).
5. **It remembers what it learned.** After the turn, a background pass updates your memory, your preferences and your playbooks, every version kept (`lib/ai/reflection.ts:1-21`).

## Sections

### 1. Reads your operation
- Headline: Every record, one question away.
- Body: Orion reads the same rows your pages read, so its answer and your screen cannot disagree.
- Cards:
  - **Wells and production.** Headers, daily volumes, well tests, equipment, service history, downtime and comments, per well or per lease. (source: lib/ai/tools.ts:488-519, lib/ai/tools.ts:894-933)
  - **Tanks, tickets and allocation.** Gauges, run tickets, battery and tank allocation, the same allocation the Tanks page shows. (source: lib/ai/tools.ts:550-605)
  - **Gas meters and disposal.** Meter readings, injection and SWD meters, water meters. (source: lib/ai/tools.ts:619-628, lib/ai/tools.ts:708-749)
  - **Statements and invoices.** Purchaser statements and vendor invoices on file, read by number or by lease. (source: lib/ai/tools.ts:642-696)
  - **Money and prices.** The ledger, posted prices derived from your statements, WTI and Henry Hub live. (source: lib/ai/tools.ts:993-1037)
  - **Files, logs and notes.** Browse folders, search OCR'd documents, read a PDF, read a full LAS log in one call. (source: lib/ai/tools.ts:1086-1135)
- Screen: port `components/ai/orion-chat.tsx` in the drawer layout with a question answered as a table ("Which Smith well made the most oil in September?"). Fixture: add a `smith-september` thread to `orion-fixture.ts` with a three-row markdown table (Smith 2, 3, 4) that uses the same September volumes as the dashboard fixture.

### 2. Reads the state's record
- Headline: The RRC, in the same chat.
- Body: Orion queries the Texas public record for every operator, lease and wellbore in the state alongside your own data.
- Cards:
  - **Search the whole state.** Wells, leases, operators, fields, counties and surveys by name or number. (source: lib/ai/rrc-tools.ts:527-1064)
  - **Your well's public record.** The RRC completion, permit and production record for a well or lease you operate. (source: lib/ai/rrc-tools.ts:604-659)
  - **Offsets by distance.** The wells near one of yours, with their production history. (source: lib/ai/rrc-tools.ts:1021)
  - **Permits, completions and disposal.** New permits, completion reports and SWD disposal volumes by county or operator. (source: lib/ai/rrc-tools.ts:1300-1367)
  - **Mineral owners.** Appraisal-roll mineral owners on a lease, and owners near a point, where a county roll is loaded. (source: lib/ai/rrc-tools.ts:1134-1265)
  - **Analysis on the record.** Decline, allocation, percentile and reconciliation math run in code over RRC data, not estimated in prose. (source: lib/ai/rrc/dispatch.ts:35)
  - **Moves the Recon map.** Ask for a county, an operator or a filter and the map goes there. (source: lib/ai/rrc-tools.ts:1496)
- Screen: port `components/scout/scout-map.tsx` beside the drawer, with the Orion drawer open and a reply listing the three offsets of Smith 4. Fixture: reuse `recon-fixture.ts` wells. Add an RRC thread to `orion-fixture.ts` whose offsets are those recon fixture wells.

### 3. Works the problem
- Headline: Shows the math, not adjectives.
- Body: Analytical turns run deterministic calculations and draw the chart, so a number in the answer is one you can check.
- Cards:
  - **Decline, the same fit the app draws.** Oil, gas and BOE with the forward 12-month decline for the company, a well or a lease. (source: lib/ai/tools.ts:824)
  - **Rankings and trends in code.** Percentiles, fitted trends and concentration over your production, through one dispatcher. (source: lib/ai/company/dispatch.ts:30)
  - **Charts in the chat.** A chart is drawn from data Orion already pulled, never from numbers it typed. (source: lib/ai/tools.ts:760)
  - **Diagrams on request.** Draws a picture or diagram when one explains it better than text. (source: lib/ai/tools.ts:801)
  - **Facility flow.** Traces oil, gas or water from a well through tanks and meters to sale or disposal. (source: lib/ai/tools.ts:858-888)
  - **A researcher goes first.** On hard questions a faster model gathers the context before the analyst reasons once over the whole brief. (source: lib/ai/pipeline/gather.ts:3-18, lib/ai/router.ts:8-37)
- Screen: port `components/ai/orion-chart.tsx` inside `orion-chat.tsx` showing a decline chart for Roy Corbett 2. Fixture: add a `render_chart` tool part to a `conv-corbett-decline` thread using the Roy Corbett 2 volumes from the dashboard fixture.

### 4. Knows what you are looking at
- Headline: "This well" means this well.
- Body: Pages publish what is on screen, so you can point at a map, a table or an open modal instead of naming ids.
- Cards:
  - **Docked to every page.** The drawer opens on any page and narrows the page beside it, 320 to 720 px wide. (source: components/ai/ai-drawer.tsx:4-10, lib/ai/use-ai-drawer.ts:5-7)
  - **The map viewport.** Recon publishes the wells in view, the filters and the open operator or lease. (source: components/scout/scout-map.tsx:1951-2004)
  - **The well page.** The well you have open, with its id, rides into the turn. (source: components/wells/well-workspace.tsx:661)
  - **Tanks, flow map, charts, files.** The Tanks list, the Facilities flow map, the analytics charts and the selected file publish the same way. (source: components/tanks/tanks-list.tsx:705, components/facilities/flow-map.tsx:1208, components/analytics/company-charts.tsx:653, components/files/file-browser.tsx:264)
  - **Count before list.** A 400-well viewport reports the count first and never passes a truncated list off as the whole. (source: lib/ai/page-context.ts:14-27)
  - **Inside a project.** In a project folder the chat scopes document search and memory to that project. (source: components/ai/ai-drawer.tsx:14-16, lib/ai/project-memory.ts:1-19)
- Screen: port `components/facilities/flow-map.tsx` with the Orion drawer open and the question "What is feeding Tank 1?" answered from the flow map. Fixture: reuse `flow-map-fixture.ts` nodes. Add the thread to `orion-fixture.ts`.

### 5. Asks before it writes
- Headline: Nothing saved until you approve.
- Body: Consent is enforced in code, not in the prompt, so a write without an approval card cannot run.
- Cards:
  - **Every write stops for a card.** Each tool that changes a record is approval gated, and the run pauses until you answer. (source: lib/ai/tools.ts:266-273)
  - **Structural, not optional.** A write tool missing the gate is replaced by a refusal before it can execute. (source: lib/ai/tools.ts:333-349)
  - **Plain English, never JSON.** The card shows a one-line summary and the fields as labelled rows, in names, not ids. (source: lib/ai/approval-view.ts:1-24, lib/ai/approval-names.ts:1-12)
  - **One card for 250 rows.** A batch is one card and one decision. If any row fails, nothing is written. (source: lib/ai/batch-tool.ts:1-30)
  - **Approve by voice.** In voice mode the card is read out and answered aloud. (source: components/ai/tool-approval.tsx:186, lib/ai/use-voice-conversation.ts:165-170)
  - **Deletes included.** Removing a well, a ticket or a file is a tool too, and gated like every other write. (source: lib/ai/tools-surface.ts:1-16, lib/ai/tools-surface.ts:141)
- Screen: the `ApprovalCard` (`components/ai/tool-approval.tsx`) at large size, pending state, from the hero fixture (`smithApprovalPart("pending")`). Already in `orion-live.tsx`, render it standalone here.

### 6. Acts across the whole app
- Headline: Anything the app can do.
- Body: Every write a page can make, Orion can propose, through the same server action with the same fields.
- Cards:
  - **Field records.** Tank gauges, run tickets, meter readings, disposal and SWD readings, well tests, downtime, production. (source: lib/ai/tools.ts:2468, lib/ai/tools.ts:3069, lib/ai/tools.ts:1871, lib/ai/tools.ts:2114-2245, lib/ai/tools.ts:3155-3196, lib/ai/tools.ts:3003)
  - **Wells, leases and interests.** Create wells and leases, assign facilities to a lease, grant owner interests. (source: lib/ai/tools.ts:1489-1708)
  - **People, inventory, ledger.** Contractors, service providers, royalty owners, inventory items, revenue and expense lines. (source: lib/ai/tools.ts:3535-3758, lib/ai/tools.ts:3884-3964)
  - **Tasks, calendar, notes.** Tasks, calendar events, field notes on a well. (source: lib/ai/tools.ts:1423-1441, lib/ai/tools.ts:3262, lib/ai/tools.ts:4017)
  - **Filings and alerts.** Mark a Form PR filed, save filing details, set a Recon county alert, schedule a report. (source: lib/ai/tools-surface.ts:724-761, lib/ai/tools-surface.ts:1717-1774)
  - **Documents.** Create and edit a document, create a folder, move or rename files. (source: lib/ai/tools.ts:1405, lib/ai/tools.ts:4047, lib/ai/tools.ts:3863, lib/ai/tools-surface.ts:1424-1437)
- Screen: none.

### 7. Remembers and improves
- Headline: Sharper every week you use it.
- Body: Three documents per user carry what Orion learned, and every version is kept.
- Cards:
  - **Memory.** Durable facts about your operation, recalled when they are close enough to the question. (source: lib/ai/user-context.ts:1-12, lib/ai/memory.ts:22-30)
  - **Persona.** How you want Orion to behave, in your words, editable in Settings. (source: components/settings/orion-context-editor.tsx:15-18)
  - **Playbooks.** Recurring tasks you walked Orion through, written down as steps, up to 12 per user. (source: lib/ai/learned-skills.ts:1-22, lib/ai/learned-skills.ts:30-34)
  - **Learns after the reply.** The reflection pass runs in the background and never slows the answer. (source: lib/ai/reflection.ts:1-21)
  - **Every version kept.** Each change is logged and rolls back in one click. (source: lib/ai/user-context.ts:10-12, lib/ai/learned-skills.ts:20-22)
  - **Finds old conversations.** Searches your past Orion threads by meaning, not exact words. (source: lib/ai/chat-history.ts:1-20, lib/ai/ontology-tools.ts:307-317)
- Screen: port `components/settings/orion-context-editor.tsx` showing the Memory doc with four bullets about Wilder Oil Co and a revision list of three versions. Fixture: add `orionMemoryDoc` and `orionRevisions` to `orion-fixture.ts`.

### 8. Talks and listens
- Headline: Hands free in the truck.
- Body: Voice mode is a spoken conversation with interruption, not a dictation box.
- Cards:
  - **One tap in the topbar.** Turn voice on and talk. (source: components/ai/voice-mode-toggle.tsx:5-8)
  - **Starts thinking at 350 ms of silence.** Speaks only at 700 ms, so a pause mid-thought never cuts you off. (source: lib/ai/use-voice-conversation.ts:57-81)
  - **Interrupt it.** Barge-in that knows its own echo, so Orion's voice does not interrupt itself. (source: lib/ai/use-voice-conversation.ts:1-30, lib/ai/voice-echo.ts)
  - **Spoken approvals.** Writes are read out and approved aloud. (source: lib/ai/use-voice-conversation.ts:165-170)
  - **Reads reports aloud.** Any report plays as a briefing, first sentence within a second. (source: components/reports/viewer/narrate-button.tsx:4-7, components/ai/use-narration.ts:7-22)
  - **Same brain as the chat.** Voice turns use the same tools, memory and playbooks, with a spoken-prose style. (source: app/api/voice-chat/route.ts:111-124)
- Screen: port `components/ai/voice-overlay.tsx` with `components/ai/weighted-orb.tsx` in the listening state and a two-turn transcript. Fixture: add `voiceTurns` to `orion-fixture.ts` reusing the Smith 4 gauge exchange.

### 9. Attach, draw, print
- Headline: Photos in, PDF out.
- Body: The composer takes what an operator has in hand and the thread prints as a document.
- Cards:
  - **Photos and PDFs.** Drop or paste an image or PDF and Orion reads it directly. iPhone HEIC included. (source: components/ai/composer.tsx:156-162, lib/ai/heic-parts.ts)
  - **Spreadsheets and text.** CSV, text and other files go in as text. (source: components/ai/composer.tsx:176-197)
  - **Paste from a spreadsheet.** A copied cell range pastes as its text. (source: components/ai/composer.tsx:238-248)
  - **Print the thread.** A conversation prints as a letterheaded PDF with charts redrawn, built server side. (source: components/ai/use-print-conversation.ts:7-20)
  - **Search history.** Find a past conversation by what it was about. (source: components/ai/orion-conversation-list.tsx:18)
- Screen: none.

### 10. Under your control
- Headline: You decide what Orion can touch.
- Body: Permissions are a table of areas and actions, enforced on the way into every tool.
- Cards:
  - **22 areas, four actions.** Read, add, edit and delete per area, in Settings. (source: lib/ai/tool-permissions.ts:47-72, components/settings/ai-permissions-table.tsx:17-22)
  - **Off means off.** A switched-off cell stops the tool body from running, whatever the prompt says. (source: lib/ai/tool-permissions.ts:1-16)
  - **Team messages start closed.** Orion can be allowed to read the team's messages, and sending starts off. (source: lib/ai/team-messages.ts:1-22, lib/ai/tool-permissions.ts:446-457)
  - **Per person.** Only members with the AI permission see Orion at all. (source: components/app-shell.tsx:234-242, app/orion/page.tsx:19)
  - **Documents are data, not orders.** Text from files, the web and memory is treated as reference material, never as instructions. (source: lib/ai/system-prompt.ts:265, lib/ai/system-prompt.ts:862-866)
  - **Metered in credits.** One credit is one cent. Each plan carries 10,000 to 50,000 credits a month. (source: lib/billing/tiers.ts:21-24, lib/billing/tiers.ts:48-53)
- Screen: port `components/settings/ai-permissions-table.tsx` with the Team messages row showing Read on and Add off. Fixture: a static cells object, no data needed.

## FAQ
- **Can Orion change a record on its own?** No. Every tool that writes is approval gated and the run pauses on a card until you answer. (source: lib/ai/tools.ts:266-273, components/ai/tool-approval.tsx:176-190)
- **Can it delete things?** Only through the same card. Deletes are tools with the same gate, and a batch that fails on any row writes nothing. (source: lib/ai/tools-surface.ts:1-16, lib/ai/batch-tool.ts:9-16)
- **What data does it read?** Your organization's rows under row-level security, the Texas RRC mirror, your files and logs, and the web when asked. (source: lib/ai/tools.ts:1264-1322, lib/ai/ontology-tools.ts:17-30)
- **Which model is it?** Chat and voice answer on Claude Opus 5, routed by a small classifier that sets effort per turn. Well-log interpretation goes to Claude Fable 5. (source: lib/ai/router.ts:8-37)
- **Does it make up numbers?** It is told to call a tool rather than answer from memory, to say when a tool returns nothing, and to cite the record it used. (source: lib/ai/system-prompt.ts:220-222)
- **Can my bookkeeper's Orion see wells?** Orion reads under that person's own permissions, and admins can switch off areas for the whole organization. (source: lib/ai/approval-names.ts:1-12, lib/ai/tool-permissions.ts:1-16)
- **Does it read the team's messages?** Only if an admin turns that on, and only threads the asking user is already in. Sending is off by default. (source: lib/ai/team-messages.ts:1-22, lib/ai/tool-permissions.ts:455-457)
- **How long can a turn run?** Up to 10 tool steps and 300 seconds in chat, 8 steps in voice. (source: app/api/chat/route.ts:75-82, app/api/voice-chat/route.ts:346)
- **What does voice need?** A browser with microphone capture. Speech is ElevenLabs, with answers capped at 5,000 characters per clip. (source: lib/ai/use-voice-conversation.ts:24-35, lib/ai/tts.ts:5-17)
- **Is it on the phone?** Yes. The mobile app has an Orion screen with chat history and a one-tap overlay from the header. (source: /home/linuxuser/dev/mobile-background/app/(app)/orion.tsx:1-17, /home/linuxuser/dev/mobile-background/src/components/shell/ai-overlay.tsx:1-5)

## Siblings
- **Dashboard.** The morning brief is Orion's one-shot write-up of what moved overnight, on the same rows. (source: app/api/dashboard/brief/route.ts)
- **Recon.** The RRC tools on this page are Recon's data layer, and Orion can move the Recon map. (source: lib/ai/rrc-tools.ts:1496)
- **Documents.** Uploads become approval cards through the same gate as Orion's own writes. (source: lib/ai/ingest/actions.ts:2182)
- **Reports.** Orion reads any report aloud and can schedule its delivery. (source: components/reports/viewer/narrate-button.tsx, lib/ai/tools-surface.ts:1763)

## Fixture notes
- Operator Wilder Oil Co, operating day `ORION_TODAY = 2026-10-27`, pumper Hank. Keep these across pages.
- Wells named on this page: Smith 2, Smith 3, Smith 4, Roy Corbett 2, Johnson A. Dashboard and flow-map fixtures must carry the same names and ids (`WELL_SMITH_4 = 3c9d8e7f-…`).
- Smith battery Tank 1: 500 bbl, 15 ft, 2.78 bbl per inch. Oct 26 gauge 15.44 in (42.9 bbl), Oct 27 gauge 18 in (50.0 bbl), 7.1 bbl made, split 31/37/32 across Smith 2/3/4 per the Oct 19 well test. Last haul Plains Marketing Oct 23. The documents fixture names the Smith tank `Smith T201` and the orion fixture names it `Smith battery Tank 1`. Pick one name and one id.
- Roy Corbett 2 downtime: 41 hours, Oct 21 14:00 to Oct 23 07:00, rod part, 9.4 bbl deferred. Any downtime chart on the dashboard must show this event.
- Johnson A September: 6 loads, 1,061.4 net bbl, 36.2 API, $60.88 per bbl. The documents fixture statement (Plains Marketing, Sept) must total the same.
- New fields this page needs: `smithSeptemberTable` (Smith 2/3/4 September oil in bbl, agreeing with the dashboard fixture), `corbettDeclineSpec` (a `render_chart` spec from Roy Corbett 2 monthly oil), `orionMemoryDoc`, `orionRevisions`, `voiceTurns`, and the three Smith 4 offsets reused from `recon-fixture.ts`.

## Open questions
- **Current copy says "There are no delete tools."** The system prompt still says so (`lib/ai/system-prompt.ts:226-230`) and `wildcat.md:30` repeats it, but `lib/ai/tools-surface.ts` registers 106 approval-gated delete and remove tools (`delete_well` at :141, `delete_file` at :1450). The copy above sells "deletes included, gated." Confirm this is the intended story.
- **Tool counts.** 134 tools in `tools.ts` (87 gated), 106 in `tools-surface.ts` (all gated), 22 RRC, 11 ontology, 4 geology, 4 team messages, 2 help docs, 2 analysis dispatchers, web search, 2 project-only. About 290 in total, about 195 gated. `wildcat.md:29` still says 49. Decide whether a number goes on the page.
- **Skills toggles do not gate tools.** `lib/orion/skills.ts:7-10` says enablement is local UI state and does not change the tools handed to the model. The Settings skills subtab now shows only custom skills (`components/settings/skills-section.tsx:8-15`). Do not sell "turn skills on and off."
- **Realtime speech-to-speech voice** runs on OpenAI and is off unless `OPEN_AI_KEY` and `NEXT_PUBLIC_REALTIME_VOICE=true` are set (`lib/env.ts:49-58`, `lib/ai/use-realtime-voice.ts:28-33`). Not sold here.
- **The petrophysics library** (90 documents, `lib/ai/geology-kb-tools.ts:1-22`) is read by Orion but the prompt forbids listing its contents (`lib/ai/system-prompt.ts:29-54`). Mention "a reference library" at most. The current copy's "allocation methods, decline curves, RRC forms and rules, SWD and UIC" knowledge-base claim is not backed by a file I found beyond this library and the RRC tools.
- **Chat pins.** Pinning a conversation exists on the phone (`conversations.pinned_at`, migration `2026082200100`) and the web history list ignores it (memory note `wildcat-phone-chat-pin`). Not sold.
- **Web search** is Anthropic-executed, 5 uses per turn (`lib/ai/tools.ts:1322`). Fine to mention as "the web when asked."
- **Models.** Chat is Opus 5 with a Haiku 4.5 router and Fable 5 for geology (`lib/ai/router.ts`). The CLAUDE.md note says Wildcat is on `claude-opus-5` everywhere, and `wildcat.md:10` still says 4.8. The FAQ above follows the code.
- **Credits per plan.** `lib/billing/tiers.ts:48-53` gives four bands with 10k/25k/50k/50k credits. The landing's `CREDITS_FAQ` says four bands, consistent. `wildcat.md:52` says five tiers, stale.

---

# Mobile app

## Intent
Sell the phone as the pumper's whole day: every reading, ticket and note goes in from the lease once, with or without signal, and the owner reads the same numbers the office sees. The buyer must believe two things after reading: a pumper with a glove on can log a gauge in under ten seconds, and nothing entered in a dead zone is ever lost. Readers: the pumper (does it fit my round), the owner-operator (does it replace the pumper sheet), the office manager (does it stop me re-keying).

## Hero
- Eyebrow: Mobile app
- Headline: The whole operation, from anywhere. (Owner, 2026-10-30: lead with breadth and working from anywhere, not "log it once".)
- Subhead: Gauges, run tickets, the dashboard, Orion and every well's comments, on the phone. Readings save without signal and reach the office when it returns.
- CTAs: Get started | Book a demo
- Screen: keep `src/components/screens/mobile-screen.tsx`. It is a DOM transcription of the phone's gauge form, `wildcat-phone/src/components/tanks/tank-gauge-modal.tsx` (the gauge config, lines 1-16) on the `FullscreenDataEntry` hero layout (`wildcat-phone/src/components/ui/fullscreen-data-entry.tsx:6-9`), with the `MeasurementWheel` ft / in / quarters sheet (`wildcat-phone/src/components/ui/measurement-wheel.tsx:1-9`) and the app-wide `SuccessSheet` (`wildcat-phone/src/components/ui/success-sheet.tsx:1-20`). Pixel values and tokens come from the phone's `src/config/theme.ts` (mobile-screen.tsx:3-10). It already shows the right state: the wheel parked on yesterday's stick (0' 9 1/4"), the pumper spinning to 1' 6 1/2", Done, Add Reading, "Gauge saved · Tank 2". Porting concern for every mobile mock: the phone is React Native (StyleSheet, Pressable, Reanimated). The landing is React DOM, so each mock re-renders the same layout and data in HTML at the phone's pixel values inside `ScaledScreen w=390 h=844`. Nothing is imported from wildcat-phone. No `src/lib/screens/mobile-fixture.ts` exists yet. Add one carrying the shared operator's tank (Smith T2, 500 bbl, 15 ft, 2.7778 bbl/in), yesterday's and today's stick, and the derived barrels so the "= 51.39 bbl (+25.69 bbl)" line is computed, not typed (mobile-screen.tsx:58-61 hardcodes it today).

## How it works
1. **Open the lease.** The app opens on Leases, the folder every well, tank, battery and meter is reached through (`wildcat-phone/app/(app)/index.tsx:3-6`, `src/components/leases/lease-facilities.tsx:1-12`).
2. **Tap the row, tap Add.** A facility row's menu opens that facility's entry forms right there, so a gauge is two presses, not four (`src/components/leases/lease-facilities.tsx:11-13`, `src/components/leases/facility-add-flow.tsx:1-16`).
3. **Change only what moved.** The gauge wheel opens parked on the tank's last level and a meter form opens on yesterday's figures (`src/components/tanks/tank-gauge-modal.tsx:7-12`, `src/components/meters/meter-reading-modal.tsx:7-10`).
4. **Save and move on.** The confirmation sheet shows the tick and the value, then closes itself (`src/components/ui/success-sheet.tsx:15-20`).
5. **Sync when the signal returns.** Readings land on the device first and queue for the server (`src/lib/offline/readings.ts:1-9`, `src/components/shell/offline-banner.tsx:1-9`).

## Sections

**Cut by the owner on 2026-10-29.** The shipped page (`src/lib/product/mobile.ts`) keeps the gauge hero and five sections in this order: Orion on the phone (a looping demo like the web's /orion, asking a question), Run tickets (the full scan: camera, crop, Save while Orion reads, then the filled form), Charts and the dashboard (the loading cover, then the page), Offline (headline "No signal, no problem.") and Comments (a looping demo starting on the open thread). The gauge demo sits beside the hero copy. Readings, Notes and dictation, Logs and files and Device and security are dropped. The drafts below are kept for reference. Screens now transcribe `~/dev/mobile-background`, the closest checkout to the live app.

### 1. Readings
- Headline: Gauge a tank in seconds.
- Body: Every field reading has its own touch-first form on one shared shell, and each opens already filled from the last visit.
- Cards:
  - **Gauge wheel.** Spin feet, inches and quarters, and barrels derive from the tank's strapping (`wildcat-phone/src/components/tanks/tank-gauge-modal.tsx:3-6`, `src/components/ui/measurement-wheel.tsx:1-9`).
  - **Parked on yesterday.** The wheel opens on the tank's last level, or the closing gauge after a run, so the pumper moves inches, not feet (`src/components/tanks/tank-gauge-modal.tsx:7-16`).
  - **Gas meter from yesterday's figures.** Yesterday's volume, flow rate and the counter arrive prefilled, and only the columns that moved need touching (`src/components/meters/meter-reading-modal.tsx:7-27`, `:244-246`).
  - **SWD reading, one form.** The water meter index and the wellhead pressures go in together, and the app decides whether the row lands on the meter or the well (`src/components/disposal/water-reading-entry.tsx:1-14`, `src/components/disposal/disposal-well-workspace.tsx:11-19`).
  - **Blank means blank.** A pressure the pumper did not take stores as null, never as 0 psi (`src/components/disposal/water-reading-entry.tsx:22-26`).
- Screen: the existing `mobile-screen.tsx` gauge loop. Add a second frame of the meter reading form (`meter-reading-modal.tsx`) on Smith M1 with yesterday's 235 mcf greyed behind the counter. Fixture: Smith T2 gauge, Smith M1 reading.

### 2. Run tickets
- Headline: Scan the ticket, check the form.
- Body: A paper run ticket is photographed in the OS scanner and read into the same draft the pumper would have typed.
- Cards:
  - **Native scanner.** VisionKit on iOS and ML Kit on Android give edge detection, auto-shutter and perspective correction (`src/components/scan/document-scanner.tsx:4-9`).
  - **Orion fills the ticket.** The scan goes to Storage and comes back as tickets, several per sheet when a monthly run sheet lists every pickup (`src/lib/tickets/extract.ts:1-11`, `src/components/tanks/tank-run-ticket-entry.tsx:8-17`).
  - **Unprinted stays blank.** A gravity the ticket did not print arrives empty, never as 0 API (`src/components/tanks/tank-run-ticket-entry.tsx:14-17`).
  - **No duplicate filings.** A ticket already on the tank by number and date is not filed twice, checked against the device mirror (`src/hooks/run-ticket-duplicates.test.ts:1-20`).
  - **Scan needs signal, typing does not.** With no signal the scan button is off and the typed ticket queues (`src/lib/tickets/extract.ts:12-17`).
- Screen: port `tank-run-ticket-entry.tsx` in its pager state, one extracted ticket on Smith T1 with gravity blank and the Scan icon in the header. Fixture: one Plains ticket, 180.4 bbl, ticket number, date.

### 3. Offline
- Headline: No signal, nothing lost.
- Body: Screens read a mirror on the phone and writes queue in an outbox, so the lease road never stops the round.
- Cards:
  - **Local mirror.** Leases, wells, tanks, meters, readings, tickets, notes and comments live in SQLite on the device (`src/lib/offline/store.ts:1-9`, `src/lib/offline/collections.ts:1084-1130`).
  - **Readings land locally first.** A gauge or meter reading shows immediately, survives an app kill and syncs when connected (`src/lib/offline/readings.ts:1-9`).
  - **Thirty-eight write types queue.** Readings, tickets, call-ins, well tests, downtime, service, shots, pumping, equipment, filter changes, allocations, interests, gas tests, notes, comments, tasks, events, inventory, people and the facilities themselves all go through the outbox (`src/lib/offline/write-specs.ts:118-538`).
  - **Last write wins, said out loud.** A conflict with a later edit on the web keeps the later edit and the phone says so (`src/lib/offline/readings.ts:22-37`).
  - **Banner only when it matters.** Offline, pending or failed changes show under the header with Sync now or Retry (`src/components/shell/offline-banner.tsx:1-9`).
- Screen: port the gauge form with `OfflineBanner` showing "Offline · 3 changes waiting" under the header (`offline-banner.tsx`, `src/lib/offline/sync-status.ts`). Fixture: pending count 3.

### 4. Notes and dictation
- Headline: Dictate the note, glove on.
- Body: Notes open blank and instant, save as you go, and take dictation with a tap.
- Cards:
  - **Tap to talk, tap to stop.** No silence detection, because a pumpjack never goes quiet (`src/hooks/use-dictation.ts:1-12`).
  - **Append, never replace.** A second dictation adds to the field (`src/hooks/use-dictation.ts:13-16`).
  - **Mic on every text field.** Forms, comments and note bodies carry the dictate button (`src/components/ui/dictate-button.tsx:1-14`, mounted in `src/components/ui/input.tsx`, `fullscreen-form.tsx`, `comments/comments-thread.tsx`).
  - **Notes on the facility.** Every well, tank, battery and meter page carries a Notes tab (`src/components/ui/facility-workspace.tsx:16-20`).
- Screen: port `note-editor-modal.tsx` with a tag on Smith 4 and the dictate button recording (ring at mid level). Fixture: one note "Smith 4 pumping off, cut time 2 hrs".

### 5. Charts and the dashboard
- Headline: The owner's numbers, in the truck.
- Body: The same rates and charts the web shows, computed on the device from the mirror.
- Cards:
  - **Dashboard waits once.** Rates, chart and lease table load together and the network never gates the page (`app/(app)/dashboard.tsx:1-20`).
  - **Oil, gas, net rev/mo.** The headline row is the operator's own share, not gross (`src/components/analytics/summary-stats.tsx:1-16`).
  - **By lease, then by well.** One row per lease with its 24-hour change, and picking a lease lists its wells (`src/components/analytics/lease-summary-table.tsx:1-22`).
  - **Flagship chart on every facility.** Production, net revenue, stock and decline views with EMAs, trendline and log scale (`src/components/charts/production-chart.tsx:1-7`).
- Screen: port `app/(app)/dashboard.tsx` on a phone frame: Wilder Oil Co title, summary stats, company chart on 1M, lease table of five leases. Fixture: reuse `src/lib/screens/dashboard-fixture.ts` leases and rates.

### 6. Logs and files
- Headline: Open the LAS on site.
- Body: Files, documents and well logs open on the phone from the same knowledge base Orion reads.
- Cards:
  - **LAS as a well log.** Depth down the page, curves in their tracks, read at 1:240, 1:600 or Fit (`src/components/files/las-preview.tsx:1-27`).
  - **One track at a time.** The track picker swaps tracks and the depth column never leaves (`src/components/files/las-preview.tsx:20-26`).
  - **Drive-style browser.** Folders, pins and a viewer that picks the renderer from the extension (`src/components/files/file-browser.tsx:1-8`, `src/components/files/file-preview.tsx:1-13`).
  - **Scan to Files.** A scanned document queues for upload, indexing and OCR even without signal (`src/lib/scan/ingest.ts:1-20`).
- Screen: port `las-preview.tsx` on Smith 4 at 1:600 with the GR track selected. Fixture: a short synthetic LAS (GR, RES, DEN) for Smith 4.

### 7. Comments and messages
- Headline: Comment on the well itself.
- Body: Every facility has a thread and the team has chat, and both are on the phone.
- Cards:
  - **Comments on every facility.** Likes, replies, newest root first, opened from the Comments tab (`src/components/comments/comments-sheet.tsx:1-16`, `src/components/ui/facility-workspace.tsx:16-20`).
  - **Comments work offline.** Facility comments are mirrored and written locally first (`src/lib/offline/collections.ts:1128-1129`, `src/hooks/use-comments.ts`).
  - **Team messages.** DMs and groups with unread dots, rename, add and remove members (`src/components/messages/messages-workspace.tsx:1-10`).
  - **Attach a file or photo to a message.** Picked files stage as chips until sent (`src/components/messages/use-message-attachments.tsx:1-14`).
- Screen: port `comments-sheet.tsx` at three fifths height over the Smith 4 well page, two comments and one reply. Fixture: two team members, one comment about the pumping-off note.

### 8. Orion on the phone
- Headline: Ask the field, from the field.
- Body: Orion answers from the same tools and data as the web, and nothing is saved until you approve it.
- Cards:
  - **Approve before anything writes.** A write pauses the run and shows a card, and the composer locks until you answer (`src/hooks/use-orion-chat.ts:1-16`, `src/components/ai/approval-card.tsx:1-6`).
  - **Edit before approving.** The card lists the fields Orion left blank and takes a corrected record (`src/components/ai/approval-card.tsx:37-41`).
  - **Attach from Files, camera or scanner.** Five ways in, staged as chips until the message goes (`src/components/ai/use-attach-entry.tsx:1-18`).
  - **Read a reply aloud.** One reply at a time, through the voice route (`src/components/ai/use-read-aloud.ts:1-13`).
- Screen: port `orion-chat.tsx` thread state with an approval card for a tank reading on Smith T2 ("Add tank reading · Tank 2 · 1' 6 1/2" · Approve / Edit / Decline"). Fixture: one user turn, one assistant turn with the approval.

### 9. Device and security
- Headline: Face ID in, five-minute relock.
- Body: The phone is a shared tool on a shared truck, so the session is gated and every delete is asked twice.
- Cards:
  - **Biometric unlock.** Face ID, Touch ID or Android BiometricPrompt gates a session you already hold, with a password way out (`src/lib/biometrics.ts:1-9`, `src/components/auth/lock-screen.tsx:20-24`).
  - **Relocks after five minutes in the background.** Short enough for a set-down handset, long enough for the camera and the dialer (`src/state/app-lock.ts:18-26`).
  - **Every delete confirms.** Row menus, swipe actions and editor deletes all go through one slide-up question (`src/components/ui/use-confirm-delete.tsx:1-14`).
  - **Push notifications land on the right screen.** A tap opens the well or thread the notice is about (`src/lib/push.ts:1-10`, `src/hooks/use-push-notifications.ts:1-9`).
- Screen: port `security-section.tsx` inside the Settings sheet with the biometric switch on. Fixture: none beyond the member name.

## FAQ
- **Which platforms?** iOS and Android, built with Expo 57 and React Native 0.86, with tablet layouts at 768 and 1100 points (`wildcat-phone/app.json` ios/android blocks, `package.json:37,65`, `src/lib/responsive.ts:3-14`).
- **What works without signal?** Reading every mirrored screen and the 38 queued write types: readings, run tickets, well tests, downtime, service, shots, pumping, equipment, filter changes, allocations, notes, comments, tasks, events, inventory, people and facilities. Scanning a run ticket for extraction, team messages, support, Orion chat and file viewing need a connection (`src/lib/offline/write-specs.ts:118-538`, `src/lib/tickets/extract.ts:12-17`, `src/components/messages/messages-workspace.tsx:9-12`, `src/components/files/file-preview.tsx:8-9`).
- **Can the phone delete a well?** No. The sync endpoint refuses a well delete from a device because rejoining the flow connections through it is web-only work (`src/lib/offline/write-specs.ts:473-480`).
- **What happens on a conflict?** Last write wins by when the change was made, deletes always apply, and the phone toasts any outcome you did not expect (`src/lib/offline/readings.ts:22-37`).
- **Does Orion write anything on its own?** No. Every write tool pauses for an approval card, and the composer is locked until it is answered (`src/hooks/use-orion-chat.ts:7-16`).
- **Does the scanner's extraction run on the phone?** No. The scan uploads to Storage and a server route reads it, with a 120 second cap (`src/lib/tickets/extract.ts:4-18`).
- **Can a metered SWD well take a hand reading?** No. When a water meter edge is active the Reading item disappears and the server refuses it too (`src/components/disposal/disposal-well-workspace.tsx:6-10`).
- **Who sees what?** The nav grid shows a page only to members holding one of its permission keys, and the mirror is filled through the same RLS policies (`src/lib/nav.ts:1-4`, `:95-105`).
- **Is biometric unlock an account setting?** No. It is a device preference that never syncs, and turning it on prompts first and persists only on success (`src/state/app-lock.ts:1-10`, `src/components/settings/security-section.tsx:9-18`).

## Siblings
- **Orion**: the same approval cards and tools, on the phone with camera and scanner attachments.
- **Dashboard**: the lease table and company chart on the phone are computed from the same per-well rates.
- **Documents**: a scan from the phone enters the same upload, OCR and proposal pipeline.
- **Flow map**: the readings the phone collects are the volumes the map draws on every line.

## Fixture notes
A `src/lib/screens/mobile-fixture.ts` is needed, sharing the operator from `dashboard-fixture.ts` (Wilder Oil Co, Martin County, leases Johnson A, Smith, Roy Corbett, Fannie Young, Roach Parrott). Fields:
- Tank: Smith T2, oil, battery Smith Battery, capacity 500 bbl, height 15 ft, bblPerInch 2.7778. Today `mobile-screen.tsx:58-61` hardcodes these and `flow-map-fixture.ts:214` gives every tank 1.67 bbl/in. Pick one strapping and use it on both pages.
- Gauge readings: yesterday 9.25 in at 07:40, today 18.5 in at 07:40, derived 25.69 bbl and 51.39 bbl.
- Meter: Smith M1, gas, yesterday 235 mcf (matches `flow-map-fixture.ts:198`).
- Run ticket: Smith T1, purchaser Plains, ticket number, date 2026-10-27, open and close gauges, bbl, gravity blank.
- Well rates for the dashboard frame: `dashboard-fixture.ts:58-74` has Smith 1 to 4 at 12, 16, 9, 11 bbl/d while `flow-map-fixture.ts:57-60` has 18.4, 12.1, 9.6, 24.8. These must agree. Smith 4 is the hero well on both pages.
- Offline pending count: 3.
- Member names for comments and messages, and the owner name for the dashboard title.
- FIXTURE_TODAY 2026-10-27 everywhere (`dashboard-fixture.ts:22`).

## Open questions
- **Multi-org on the phone.** No org switcher exists in `wildcat-phone/src` (grep for switchOrg, memberships, OrgPicker returns nothing). The current landing copy does not claim it, but the brief lists it. Do not sell it until a surface exists.
- **Voice Orion is built but unmounted.** `use-voice-session.ts` and `voice-overlay.tsx` are complete, but `app-header.tsx:7-9` says VoiceOverlay is no longer mounted anywhere. Only dictation and read-aloud are reachable. Copy should say "dictate" and "read aloud", not "talk to Orion".
- **Push has never delivered.** `PUSH_SETUP.md:3-12`: no device has ever registered because the Android build lacked FCM wiring, and the FCM service account still has to be uploaded to EAS. Code is in place. Say "push notifications" only once a build registers.
- **Data Entry page is partly mock.** File picking queues two sample documents and the ingest approval writes to a mock DB (`app/(app)/data-entry.tsx:17-22`, `src/components/data-entry/ingest-approval-modal.tsx:1-5`). The scan path through `submitScan` is real. Do not sell phone Data Entry uploads.
- **Statement upload is mock.** `upload-statement-modal.tsx:1-10` simulates the pick and extraction. Phone revenue is read-only in practice.
- **Export menu is a stub.** CSV, Excel and PDF toast "coming soon" (`src/components/export/export-menu.tsx:7-16`).
- **Well page uploads.** "Upload document" and "Scan document" on the well page toast "coming soon" (`src/components/wells/well-workspace.tsx:771-772`), and Storage upload is not ported (`src/hooks/use-files.ts:223`). Scan to Files works through the queue, so say "scan" not "upload".
- **SWD meter Wells and Well Tests tabs not ported** (`src/components/disposal/swd-meter-workspace.tsx:7-9`).
- **Comment attachments are not wired** (`src/components/comments/comments-sheet.tsx:19-22`).
- **Messages poll rather than subscribe** (`messages-workspace.tsx:9-12`). "Live" is the wrong word.
- **Local-first doc vs code on wells.** `docs/plans/local-first-mobile.md` ("What is still not local-first") says creating a well stays online for its slug id, but `write-specs.ts:473` now carries a `well` write spec. Confirm whether Add well works offline before the FAQ says either.
- **Morning brief is a mock and not mounted.** `morning-brief.tsx` picks canned text, and `dashboard.tsx` does not render it. Do not show it in a mock.
- **Current landing copy** says "Dictate notes" (true), "Work offline and sync" (true), "Charts, logs, comments and team messages" (true) and lists "SWD readings" (true). It misses the scanner review step, the duplicate guard, biometric lock, confirm-every-delete, the lease-as-folder entry model, and the per-field blank-not-zero rule.

---

# Recon

Source paths are relative to `/home/linuxuser/dev/wildcat` unless prefixed `landing:` (`/home/linuxuser/dev/wildcatiq-landing`).

## Intent
Recon puts the Texas RRC's public record for the whole state inside the operator's app: every wellbore, lease, permit, orphan and operator on one map, with the filed record a click away and an email when something new happens in their counties. The buyer must leave believing they can stop driving the RRC's GIS viewer and PDQ site and that Recon answers "who is drilling next to me, what did that lease make, who holds it" from one screen. Read by the owner-operator and the office manager or landman who works offsets and acquisitions.

## Hero
- Eyebrow: Recon
- Headline: Every Texas well, on your map.
- Subhead: One million RRC wellbores, their leases, permits and operators, clustered on one map with the filed record a click away.
- CTAs: Get started | Book a demo
- Screen: `landing:src/components/screens/recon-live.tsx` already covers it: the app's own `MapFilters` bar (`src/components/scout/map-filters.tsx:1024`), `MapControls`, `PermitLegend` and `PermitPanel` over a Mapbox GL map in Permits mode on Martin County, with the approved Johnson A 7 permit open (`landing:src/lib/screens/recon-fixture.ts:18-50`). Mapbox: `landing:src/components/screens/recon-map.tsx` uses real `mapbox-gl` with `NEXT_PUBLIC_MAPBOX_TOKEN` and the county's real wellbores from `landing:public/recon/wells.json`, drawn with the app's RRC glyphs (`src/lib/scout/well-glyphs.ts`). Keep that for the hero. Without a token the map div renders empty (`recon-map.tsx:44`), so the build needs a static PNG fallback behind the chrome. Section screens below should be static captures of the same component at fixed cameras, not more live maps.

## How it works
1. **Pick what to show.** Show is a dropdown: Wells, Leases, Permits, Orphans or Operators (`src/components/scout/map-filters.tsx:1324-1335`).
2. **Narrow it.** County, district, operator, officer, well type, status, depth, completion years, production rate and a drawn area all AND together (`map-filters.tsx:69-204`).
3. **Open the record.** A dot opens its well, lease or operator dossier with the RRC's own production, tests, filings and principals (`src/components/scout/well-modal.tsx:97-106`).
4. **Watch your counties.** Save an alert and get an email when a permit is filed or approved or a new well appears (`src/lib/recon-alerts/types.ts:9-17`).
5. **Ask Orion.** Orion reads the same mirror through 28 RRC tools and can move the map for you (`src/lib/ai/rrc-tools.ts:1-9`, `src/lib/ai/scout-view-spec.ts:1-9`).

## Sections

### 1. Layers
- Headline: Five ways to see Texas.
- Body: Each mode draws a different RRC record set, clustered until you zoom in.
- Cards:
  - **Wells.** 1,004,291 located wellbores, drawn with the RRC GIS viewer's own symbols for oil, gas, dry, plugged, injection and shut-in. (source: scripts/scout-sync-data.mjs:28, src/lib/scout/well-glyphs.ts:4-16)
  - **Leases.** One dot per lease at the centroid of its scheduled wells, with the lease's own last-12 rate on hover. (source: scripts/scout-sync-data.mjs:12-14, src/lib/scout/lease-rate-filter.ts)
  - **Permits.** Pending, approved and drilled permits as three colours, filtered by filing purpose, status and date. (source: src/components/scout/permit-panel.tsx:26-40, src/components/scout/map-filters.tsx:117-142)
  - **Orphans.** About 12,000 orphan wells coloured by whether the state has since plugged them, filtered by the lease's last producing month. (source: src/lib/scout/orphan-filter.ts:2-17)
  - **Operators.** Every P-5 operator placed by mailing ZIP, filtered by well count, reported production and estimated revenue per month. (source: src/lib/scout/operator-points.ts:1-7, src/components/scout/map-filters.tsx:173-187)
  - **Status inside the bubbles.** Every cluster carries its active, inactive and plugged counts, so the Status filter changes the bubbles too, not just the dots. (source: src/lib/scout/live-tiler.ts:16-22)
- Screen: `ScoutMap` (`src/components/scout/scout-map.tsx:401`) in Wells mode at zoom 7 over District 08, Show dropdown open. Static capture. Fixture: none needed beyond the basemap and `public/recon/wells.json`.

### 2. Filters
- Headline: Narrow a million wells fast.
- Body: Every control is a dropdown or a typed range, and all of them AND together.
- Cards:
  - **County and district.** Type-ahead pickers that take several at a time, across all 254 counties and 14 districts. (source: src/components/scout/map-filters.tsx:975-1000, :254)
  - **Operator and officer.** Search a company, or a person, which narrows the map to every P-5 operator they are listed on. (source: src/components/scout/map-filters.tsx:160-166, src/lib/scout/rrc-people.ts)
  - **Type and status.** Oil or gas, 22 RRC well types verbatim, and one definition of active, inactive and plugged used by every Recon surface. (source: src/components/scout/map-filters.tsx:260-281, src/lib/scout/well-activity.ts:1-24)
  - **Depth and completion year.** Typed ranges with the statewide population drawn behind the thumbs, one bar per well, not per wellbore row. (source: src/lib/scout/histogram.ts:1-24, src/components/scout/range-histogram.tsx)
  - **Production rate.** Oil bbl and gas MCF per month over the last twelve filed months, for a well or a lease. (source: src/components/scout/map-filters.tsx:93-109)
  - **Draw an area.** Box, lasso or a ring around a well, unioned, with the well count the area selected listed beside it. (source: src/lib/scout/shape-layer.ts:77, src/components/scout/shape-panel.tsx:1-16)
- Screen: `MapFilters` with the county picker holding Martin and Howard, the Depth popover open with `RangeHistogram`, and `ShapePanel` showing one ring. Fixture: add a `histograms` sample for `depth` (bucket array) to `recon-fixture.ts`.

### 3. Dossiers
- Headline: Open the record behind every dot.
- Body: A click opens the RRC's filed record for the well, lease, operator, field or county.
- Cards:
  - **Well dossier.** Summary, Production, Tests, Injection, Status, Compliance, Filings, Completions, Principals and Location tabs. (source: src/components/scout/well-modal.tsx:97-106)
  - **Lease dossier.** Production, Allowables, Disposition by RRC code, Counties, Wells, Purchaser, Minerals where a roll is loaded, and a map. (source: src/components/scout/lease-modal.tsx:153-175)
  - **Operator dossier.** The P-5 profile, principals, every lease held, active, inactive, injection and plugged wells, permits and recent activity. (source: src/components/scout/operator-modal.tsx:780-791, :381)
  - **Field and county.** The same production chart and leaderboards for a field or a county, with its leases and operators. (source: src/components/scout/field-modal.tsx:84-90, src/components/scout/county-modal.tsx:83-86)
  - **Chart and table agree.** The monthly table under every production chart is the chart's series, row for row, newest first, totals on top. (source: src/components/scout/production-table.tsx:1-14)
  - **Completion packet.** The filed W-2 or G-1, formations and isolated zones, and the wellbore's surface to bottomhole path on a map. (source: src/components/scout/completion-report.tsx:1-15, src/components/scout/well-location-map.tsx:1-9)
  - **Export any table.** The open tab as CSV, Excel or PDF, re-derived on the server. (source: src/components/scout/export-table-menu.tsx:1-10, src/app/api/scout/export/route.ts:1-8)
- Screen: `LeaseModal` rendered `inline` (as Browse does, `src/components/scout/operator-tree-view.tsx`) on the Production tab for Wilder's Johnson A lease, chart over table. Fixture: a `LeaseMonth[]` for Johnson A built from the dashboard fixture's monthly volumes (see Fixture notes).

### 4. Permits
- Headline: See the rig before it arrives.
- Body: Pending applications land on the map the night the RRC publishes them, with the approved paperwork a day after approval.
- Cards:
  - **Three states.** A pending application leads with who and how many days it has waited, an approved permit counts from issue, a drilled one links to the hole. (source: src/components/scout/permit-panel.tsx:26-40)
  - **Filing purpose.** New drill, recompletion, re-enter and the rest, offered only when the loaded payload holds them. (source: src/components/scout/map-filters.tsx:600-616, src/lib/scout/permit-filter.ts:1-17)
  - **Date band.** Filed or issued dates, inclusive, applied on the server as well as on the drawn dots. (source: src/components/scout/map-filters.tsx:132-142)
  - **The W-1 and plats.** The approved Form W-1 and its plats, newest approval first, for permits approved since 2020-08-28. (source: src/lib/scout/permit-documents.ts:1-22, src/components/scout/permit-panel.tsx:209-253)
- Screen: the hero screen again at a second camera: `PermitPanel` on a pending New Drill (`kind: "pending"`, `days: 19`) with the `PermitLegend`. Fixture: add a second permit record `reconPendingPermit` to `recon-fixture.ts`.

### 5. Browse
- Headline: Read a company as a list.
- Body: Type an operator and get every lease it holds as a tree, each opening to its wells, with the record beside it.
- Cards:
  - **Every lease, uncapped.** The tree lists every lease of record for the operator, 6,851 for the largest. (source: src/lib/scout/rrc-queries.ts:955, src/components/scout/operator-tree-view.tsx:20-31)
  - **Same dossier, in the pane.** Picking a lease or well renders the same `LeaseModal` or `WellModal` inline, so a figure here is the figure on the map. (source: src/components/scout/operator-tree-view.tsx:30-31)
  - **Held, not filed.** Leases come from the lease master's operator of record, so a lease sold last month is already on the buyer. (source: wildcat.md:139, `getOperatorFootprint` in src/lib/scout/rrc-queries.ts, and src/lib/scout/rrc-queries.ts:955 `getOperatorTree` reading `rrc.lease.operator_no`)
- Screen: `OperatorTreeView` with Wilder Oil Co expanded to five leases and Johnson A open to four wells, `WellModal` inline on Johnson A 3. Fixture: an operator tree payload for Wilder (see Fixture notes).

### 6. Market
- Headline: Know what the county produced.
- Body: The RRC's own district and county rollups, scoped and charted, with the months it has not reported yet shown as missing rather than zero.
- Cards:
  - **Texas, districts or counties.** Pick the state, several districts or several counties, and the chart draws one line per area with the totals summed. (source: src/components/scout/market-view.tsx:63-69)
  - **Four streams.** Oil, gas, condensate and casinghead, from the RRC's pre-aggregated cycle tables, never from the 78 million row lease table. (source: src/components/scout/market-view.tsx:74-79, :46-49)
  - **Last cycle and 12-month average.** Stat tiles for the last reported cycle and the trailing average, divided by the cycles actually in hand. (source: src/components/scout/market-view.tsx:482-496, :102-106)
  - **Leaderboards.** Top counties, fields, operators and leases, re-ranked on the per-month rate shown. (source: src/components/scout/market-view.tsx:614-624, :198-207)
  - **Reported versus loaded.** The RRC lags about three months, and the page states which cycle it has reported through so a stalled series never reads as a dead county. (source: src/components/scout/market-view.tsx:496, src/lib/scout/rrc-queries.ts:130-150)
- Screen: `MarketView` (`src/components/scout/market-view.tsx`) scoped to Martin County. Fixture: a `MarketData` object (statewide, District 08 and Martin County series, top boards, `lastReportedCycle: "2026-07"`, `lastLoadedCycle: "2026-09"`). Martin County's oil must exceed Wilder's monthly total by two orders of magnitude.

### 7. Alerts
- Headline: Hear about new activity first.
- Body: Save the counties you care about and the mirror's nightly arrivals come to you by email.
- Cards:
  - **Three things to watch.** Permits filed, permits approved, new wells. Nothing else, by design. (source: src/lib/recon-alerts/types.ts:9-17)
  - **Your counties.** Each alert names its counties with the same picker the map uses, and a new alert starts on the counties the map is showing. (source: src/components/scout/recon-alerts-modal.tsx:6-9, :298-299)
  - **Daily or weekly.** Pick the frequency, the hour and the timezone. (source: src/lib/recon-alerts/types.ts:19, src/components/scout/recon-alerts-modal.tsx:318-356)
  - **Every row opens in Recon.** Each line in the email is a link to that permit or well on the map. (source: src/lib/recon-alerts/types.ts:60-70, src/lib/recon-alerts/email.ts:1-9)
  - **Nothing dropped.** The alert reads from a cursor, so a late mirror night is reported late, never skipped, and the footer says how fresh the mirror is. (source: src/lib/recon-alerts/dispatch.ts:11-16, src/lib/recon-alerts/email.ts:6-7)
- Screen: `ReconAlertsModal` (`src/components/scout/recon-alerts-modal.tsx:84`) with one saved alert "Martin and Howard", all three kinds, weekly, Monday 6 am Central. Beside it a render of the alert email from `src/lib/recon-alerts/email.ts` (pure, no I/O) with three permit rows. Fixture: add `reconAlerts: ReconAlert[]` and `reconArrivals: ArrivalItem[]` to `recon-fixture.ts`.

### 8. Land and midstream
- Headline: See the land under the wells.
- Body: Property lines and pipe draw on the same map once you are close enough for them to mean something.
- Cards:
  - **Survey tracts.** 311,158 abstract polygons, drawn from zoom 12 so the grid reads as parcels, not noise. (source: src/components/scout/map-filters.tsx:193-200, src/lib/scout/survey-layer.ts:22-28)
  - **Pipelines.** 470,554 segments, 350,305 miles, with a diameter floor that shows trunk lines statewide and gathering stubs up close. (source: src/lib/scout/pipeline-layer.ts:1-22)
  - **Mineral owners.** The county appraisal roll on a lease's Minerals tab and an Owner dossier, for Archer County's 2025 roll today. (source: src/lib/scout/cad.ts:1-20, src/components/scout/owner-modal.tsx:102-105)
- Screen: `ScoutMap` at zoom 13 over the Johnson A lease with surveys on, pipelines on, satellite basemap. Static capture. Fixture: none.

### 9. Orion
- Headline: Ask Orion about any operator.
- Body: Orion reads the same mirror and keeps it apart from your own wells.
- Cards:
  - **28 read tools.** Search, well, lease, operator, permits, market, leaderboards, wells near a point, disposal, minerals and more, each summarised for voice. (source: src/lib/ai/rrc-tools.ts:1-20)
  - **Orion drives the map.** A filter and camera directive, bounded server-side, so the map goes where the chat says it did. (source: src/lib/ai/scout-view-spec.ts:1-24)
  - **Summary on demand.** A dossier's written summary is a button, never an automatic model call on every click. (source: src/components/scout/dossier-summary.tsx:1-13)
- Screen: none.

## FAQ
- **Is Recon Texas only?** Yes. The mirror is the Texas Railroad Commission's public record and the map cannot fly outside the state. (source: src/lib/ai/scout-view-spec.ts:20, src/lib/ai/rrc-tools.ts:4-6)
- **Where does the data come from?** A mirror of the RRC's own files (wellbores, leases, permits, completions, production cycles) on a separate read-only database, with the well, lease and operator point files synced from it after each refresh. (source: scripts/scout-sync-data.mjs:1-24, src/lib/scout/rrc-db.ts)
- **How fresh is it?** Permits and arrivals reload nightly. Production comes in the RRC's monthly cycles, which the RRC publishes about three months behind, and every production screen states the last reported cycle. (source: src/lib/recon-alerts/dispatch.ts:11-14, src/components/scout/market-view.tsx:496, src/components/scout/rrc-browser.tsx:159-163)
- **Is this my production data?** No. Recon shows what operators filed with the state. Your own gauges, tickets and meters live on the Dashboard and well pages. (source: src/lib/ai/rrc-tools.ts:4-8)
- **What is "Est. $/mo"?** The operator's trailing twelve months of reported production valued at today's WTI and gas quotes, divided by twelve. A prospecting sort, not revenue: gross, pre-royalty, no differentials. (source: src/lib/scout/revenue.ts:1-15)
- **What do alerts cover?** Permits filed, permits approved and new wells in the counties you pick, daily or weekly by email. Not new operators, not production changes. (source: src/lib/recon-alerts/types.ts:9-19)
- **Who in my company can use it?** Every signed-in member. Recon carries no permission key because it is the public record, not company data. (source: src/components/app-shared.tsx:177-187)
- **Does the map ever hide wells?** When more wells match than the map draws, it shows the first 30,000 by API number and says so. Add a county, district or operator to see the full answer. (source: src/components/scout/map-filters.tsx:1629-1633)
- **Can I get the tables out?** Any dossier table exports as CSV, Excel or PDF. (source: src/components/scout/export-table-menu.tsx:1-10)
- **Does Recon file anything with the RRC?** No. Recon reads. Form PR generation lives on Filings. (source: src/app/recon/page.tsx:16-18)

## Siblings
- **Filings.** The same RRC mirror supplies the lease names and prior ending storage your Form PR is checked against.
- **Dashboard.** Your leases' production beside what the neighbours filed.
- **Orion.** Ask about any Texas operator in the same chat that knows your wells.
- **Reports.** The RRC reconciliation report compares your ledger with what the state holds.

## Fixture notes
The shared operator is Wilder Oil Co (`landing:src/lib/screens/dashboard-fixture.ts:50-74`), five leases and fourteen wells, with `FIXTURE_TODAY = "2026-10-27"`. Recon's fixture already places Wilder in Martin County, District 08 (`recon-fixture.ts:12-16`, permit `county: "MARTIN", district: "08"`). To keep every number on this page in step, add to `recon-fixture.ts`:
- `WILDER_OPERATOR_NO` (six digits, fictional) and the P-5 name `WILDER OIL CO`, used by the operator tree, the lease dossier and the alert email.
- Per lease: an RRC oil lease number and `district: "08"`, keyed by the dashboard `LEASES[].id`, so the lease dossier and Form PR cite the same lease numbers.
- Per well: an eight-digit API (`317` county prefix) keyed by `WELLS[].id`, so the tree, the Well dossier and the Filings page name the same wells.
- `LeaseMonth[]` for Johnson A: `cycle` and whole-barrel `oil`, `gas` summed from `dashboardFixture.byWellMonthly` for that lease's wells, so the Recon production table equals the Dashboard lease row for each month.
- `MarketData` for Martin County with `lastReportedCycle: "2026-07"`, `lastLoadedCycle: "2026-09"`, county oil far above Wilder's total.
- `reconAlerts` (Martin 317 and Howard) and `reconArrivals` naming Permian Basin Operating's Johnson A 7, the permit the hero already shows.
- Prices: the hero bar uses `reconPrices` 61.4 / 2.9 while the dashboard uses 60.12 / 2.41 (`dashboard-fixture.ts:26`). Pick one and share it.

## Open questions
- **Gate.** `wildcat.md:127` says Recon is behind `org_members.early_access`. The code has moved on: the sidebar entry has no permission or early-access flag, the pages use `requireUser()` and `/api/scout/*` uses `forbidUnlessSignedIn()` (`src/components/app-shared.tsx:177-187`, `src/app/recon/page.tsx:41`). The copy above sells it as open to every member. Confirm that is the intent.
- **Alerts migration.** Memory (`wildcat-recon-alerts.md`) says `2026100200100_recon_alerts.sql` and Tiger `sql/022_arrivals.sql` were not applied remotely as of 2026-10-02. Confirm alerts are live before selling them without a Beta mark.
- **Structure maps (`/map`).** Built (`src/lib/structure-maps/*`) but `devOnly: true` and 404 in production (`src/components/app-shared.tsx:189-199`). Left off this page.
- **Affiliation network.** `wildcat.md:124` lists a "network" mode. `MapMode` has none (`map-filters.tsx:51`). `graph-build.ts` survives and `PrincipalDetailPanel` lists a person's operators. Copy says "officer" filter, not "network".
- **Minerals coverage.** Archer County 2025 roll only (`src/lib/scout/cad.ts:20`). Sold with that limit stated.
- **Disposition codes are unlabelled.** Numbers by RRC code with no code-to-meaning lookup yet (`disposition-panel.tsx:11-16`).
- **Lease count.** "221k leases" comes from memory (2026-10-17), not from a file in the repo. The subhead avoids the number.
- **Current copy** says "nearly a million wellbores". The sync comment says 1,004,291 located wells, so "one million" is accurate.
- **`/recon/preview`** is a fixture workbench, not a feature (`src/app/recon/preview/page.tsx:9-17`). Not sold.
- **Run-ticket disposition code (`rrc_disp_code`)** is read by Form PR but no UI writer was found. Relevant to Filings, noted here because the Recon lease dossier's Disposition tab is the RRC side of the same number.

---

# Documents

All paths below are under `/home/linuxuser/dev/wildcat/src/` unless they start with `/`.

## Intent
This page is FOR convincing an office manager that the paper an operator already handles (run tickets, purchaser statements, gas settlements, vendor invoices, gauge sheets, pumper logs, old production exports) becomes records with one upload and one approval, and that the files themselves live in a searchable cabinet Orion can read. The owner-operator reads it to believe nothing is written without a person approving it. After reading they must believe: drop anything, Orion reads it and proposes rows, you edit and approve, and the original stays on file.

## Hero
- Eyebrow: Documents
- Headline: Your paperwork becomes your records.
- Subhead: Drop a statement, a ticket or a gauge sheet and Orion proposes the rows, flags what is already on file, and waits for your approval.
- CTAs: Get started | Book a demo
- Screen: new. Port the Data Entry dropzone with the approval card open: `components/data-entry/data-entry-workspace.tsx` (upload phase, one queued file `smith-gauge-sheet-2026-10.jpg`, status done) under `components/ai/ingest/ingest-approval-modal.tsx` showing a `tankReadings` proposal of 7 rows for Smith battery Tank 1, Oct 20 to 26, with the Oct 23 row carrying a `_notice` ("a run on this tank that day is already on file") and the "1 more from this upload" line. Fixture: new `documents-fixture.ts` export `gaugeSheetProposal` in the app's `IngestProposal` shape. The existing `documents-live.tsx` does NOT cover this. It renders the Revenue page's statement review and is reused in section 4 below. `documents-screen.tsx` does not exist in the landing repo.

## How it works
1. **Drop it anywhere.** Files, a folder, a camera scan or a phone photo. Up to 5 GB a file on the Files page (`lib/files/direct-upload.ts:31`, `components/files/scan-modal.tsx:3-13`).
2. **Orion reads it to text.** PDFs and photos are transcribed page by page, tables kept as tables, unreadable characters marked rather than guessed (`lib/ai/read-document.ts:9-24`).
3. **It routes the document.** A clean spreadsheet goes to the structured mapper, a GreaseBook export or a tops file is read in code, everything else is categorized and sent to its own extractor (`lib/ai/ingest/scan.ts:73-85`, `scan.ts:1297-1311`, `lib/ai/ingest/categorize.ts:8-16`).
4. **Analyze, then validate.** A second pass audits the rows against the document and sends them back for correction, up to 3 rounds (`lib/ai/ingest/dedicated-flow.ts:13-35`).
5. **You approve.** Rows already on file are dropped, the rest arrive as an editable card, and approving is the only path to a real record (`lib/ai/ingest/scan.ts:232-281`, `lib/ai/ingest/actions.ts:2182-2272`).

## Sections

### 1. Drop anything
- Headline: Any document an operator touches.
- Body: The scan recognizes the paper of the oil patch, by what the document is, not by a filename.
- Cards:
  - **Purchaser run statements.** Settlement by haul, with ticket numbers, gauges, gravity and net barrels per load. (source: lib/ai/ingest/skills/categorize-document.md:7-11, lib/ai/ingest/skills/oil-run-statement.md)
  - **Revenue statements.** Owner settlements totalled per property, with the interest decimal and check number. (source: lib/ai/ingest/skills/categorize-document.md:12-16, lib/ai/ingest/skills/revenue-statement.md)
  - **Gas settlement statements.** Plant and gatherer statements with residue, plant products, fees and producer payment. (source: lib/ai/ingest/skills/categorize-document.md:17-21, lib/ai/ingest/skills/gas-settlement-statement.md)
  - **Vendor invoices and field tickets.** Charges owed, including handwritten tickets with no invoice number. (source: lib/ai/ingest/skills/categorize-document.md:22-26, lib/ai/ingest/skills/vendor-invoice.md)
  - **Gauge sheets, run tickets, meter logs.** Tank gauges, hauls off a tank and daily meter volumes. (source: lib/ai/ingest/classify-pages.ts:27-50)
  - **Well paperwork.** Pulling-unit tickets, workover reports, downtime logs, well tests, fluid-level shots, gas shut-in tests, pumper notes. (source: lib/ai/ingest/skills/well-document.md:1-12)
  - **Spreadsheets and exports.** Production, gauges, tickets, meter volumes, well tests, disposal, transactions and inventory from xlsx or csv. (source: lib/ai/ingest/scan.ts:73-85)
- Screen: port `components/data-entry/data-entry-workspace.tsx` upload phase with five queued files named for the five document kinds above. Fixture: `queuedFiles` list in `documents-fixture.ts`.

### 2. Reads the page you took
- Headline: Field photos, straightened and read.
- Body: A photo from the truck seat arrives sideways with a neighbouring page in frame. The scan fixes both before reading.
- Cards:
  - **Turned upright.** Orion names which edge is the page's top before the photo becomes a PDF. (source: lib/files/image-orientation.ts:3-13)
  - **Cropped to the page.** Automatic page detection with a review step when detection is wrong, and the original kept beside the crop. (source: components/scan/crop-review-modal.tsx:3-16, lib/files/hygiene.ts:1-15)
  - **Ruled tables, row by row.** On a gridded sheet, columns are found in code and each ruled row is read as its own close-up, so an empty day stays empty. (source: lib/ai/ingest/photo-table.ts:11-20, lib/ai/ingest/skills/photo-table-read.md:1-12)
  - **One page per photo.** Text from an adjacent page cut off at the frame is left out, not transcribed. (source: lib/ai/read-document.ts:46-55)
  - **Doubt survives.** An unreadable digit is marked `[?]` instead of guessed, and the card flags that line. (source: lib/ai/read-document.ts:41-45, lib/statements/checks.ts:33)
  - **iPhone photos and TIFFs.** HEIC is converted where it is used, and a multi-page TIFF becomes a PDF, up to 150 pages. (source: lib/files/heic.ts:1-8, lib/files/tiff.ts:10-28)
- Screen: port `components/scan/crop-review-modal.tsx` over a skewed gauge-sheet photo with the detected quad drawn. Fixture: one placeholder image `smith-gauge-sheet-2026-10.jpg` at 1200 by 1600 with a drawn quad.

### 3. Sorts a stack of loose pages
- Headline: Five sheets, one upload.
- Body: A pumper feeds loose sheets through the scanner and gets one PDF. The scan classifies every page and routes each form to its own reader.
- Cards:
  - **Page by page.** One cheap call labels each page as a ticket, a gauge sheet, a well test, a statement page or a continuation. (source: lib/ai/ingest/classify-pages.ts:12-25, lib/ai/ingest/skills/classify-pages.md:1-10)
  - **Continuations stay together.** A table running on to page two is one form, not two extractions. (source: lib/ai/ingest/segments.ts:10-17)
  - **Merge when unsure.** A wrong split loses rows and a wrong merge costs nothing, so low confidence never starts a new segment. (source: lib/ai/ingest/segments.ts:19-20)
  - **At most 12 segments.** A 40-page file cannot fan out into 40 routing decisions. (source: lib/ai/ingest/scan.ts:623-629)
  - **Each form to its reader.** Statements and invoices run their dedicated analyze and validate pair. Well forms run the well-page extractor. (source: lib/ai/ingest/types.ts:529-549, lib/ai/ingest/scan.ts:183-203)
- Screen: none.

### 4. Statements become revenue
- Headline: The check stub, reconciled.
- Body: A purchaser statement is read into leases, runs, purchaser and revenue lines, with arithmetic checked before you see it.
- Cards:
  - **Every destination at once.** A run statement proposes the leases it settles, the purchaser, the runs and the revenue transactions in one pass. (source: lib/ai/ingest/types.ts:557-561)
  - **Math that closes.** Net versus gross less deducts and taxes, price times volume versus gross, line totals versus the printed total, each a warning on the field. (source: lib/statements/checks.ts:1-33)
  - **Runs matched to tickets.** A run whose ticket is already on file fills that ticket's price and value instead of duplicating it. (source: lib/tanks/run-ticket-match.ts:3-12)
  - **Tanks reconciled.** A tank the statement names that is not on file is matched against existing tank history before any card is made. (source: components/statements/tank-reconcile-modal.tsx:4-14)
  - **Backfill cards after the save.** New leases, tanks and run tickets the statement carries arrive as ordinary approval cards once the statement is saved. (source: lib/ai/ingest/backfill.ts:8-27)
  - **Gas too.** A plant statement proposes the gatherer, the meter, the lease, the settlement and the revenue lines. (source: lib/ai/ingest/types.ts:562-568)
- Screen: the existing `/home/linuxuser/dev/wildcatiq-landing/src/components/screens/documents-live.tsx` covers this. It renders the Revenue page's Statements tab with `UploadStatementModal`'s review step (`components/statements/statement-review.tsx`, `components/statements/statements-table.tsx`) on the Plains Marketing September statement. Fixture `documents-fixture.ts` already exists. Keep the `net-mismatch` warning badge visible.

### 5. Invoices and well paperwork
- Headline: Invoices and well paperwork, filed.
- Body: Money going out and jobs done on a well are read with the same discipline as money coming in.
- Cards:
  - **One invoice, one record.** A vendor invoice is read as a header and its charge lines, never as a ledger entry, so the payment is not double counted. (source: lib/ai/ingest/types.ts:569-589)
  - **Reviewed on its own screen.** Invoices open in a review modal with the document beside the fields. (source: components/invoices/invoice-review-modal.tsx, lib/invoices/extract.ts:11-20)
  - **Eight well destinations.** Equipment, service, downtime, well tests, daily production, fluid shots, gas tests and notes from a document dropped on a well's page. (source: lib/ai/ingest/scan.ts:183-203, lib/ai/ingest/skills/well-document.md:1-12)
  - **One job, three records.** A workover that pulled the well on the 4th and returned it on the 7th is a service row, a downtime row and a new pump spec. (source: lib/ai/ingest/skills/well-document.md:34)
  - **Tank and meter history.** Add History on a tank or meter reads a gauge sheet or software export for that device only. (source: components/ai/ingest/add-history-modal.tsx:21-25, lib/ai/ingest/skills/tank-history-extract.md:1-22)
  - **Formation tops.** A Petra or text tops export is split and read in code, filtered to your wells, with one small model call to label the columns. (source: /home/linuxuser/dev/wildcat.md:135, lib/ai/ingest/scan.ts:358-375)
- Screen: port `components/ai/ingest/ingest-approval-modal.tsx` on a `service` proposal for Roy Corbett 2 (Oct 22 rod job) with the well picker pre-seeded. Fixture: `corbettServiceProposal` in `documents-fixture.ts`, dated to match the Roy Corbett 2 downtime in `orion-fixture.ts`.

### 6. Old history, imported in minutes
- Headline: Ten years of history, imported.
- Body: Clean exports do not need a model to read every row. The scan maps the layout once and code does the rest.
- Cards:
  - **GreaseBook exports recognized.** Gauge tables, production, gas logs and transport tickets are read by shape with no model call, and self-checked against the printed derived columns. (source: lib/ai/ingest/greasebook/read.ts:1-18, lib/ai/ingest/scan.ts:339-357)
  - **One interpretation, thousands of rows.** For any other clean spreadsheet, one call writes the column mapping and code applies it to every row. (source: lib/ai/ingest/structured/infer.ts:12-21, lib/ai/ingest/skills/structured-map.md:1-5)
  - **Reading versus run.** One level is a gauge reading. Two levels and a ticket number is a run. The rule is in the prompt. (source: lib/ai/ingest/skills/structured-map.md:8-20)
  - **Audited, then repaired.** The output is verified against the source and the mapping repaired, up to 2 passes. (source: lib/ai/ingest/scan.ts:534-560)
  - **Odd rows escalated.** Rows the rules cannot place go to the model, so cost tracks irregularity, not row count. (source: lib/ai/ingest/scan.ts:591-598)
- Screen: port `components/ai/ingest/ingest-approval-modal.tsx` on a `tankReadings` proposal of 31 rows from `greasebook-smith-2025-09.xlsx`, grouped. Fixture: `greasebookProposal` with 31 September gauges for Smith battery Tank 1 that sum to the September oil on the dashboard.

### 7. Nothing is saved until you approve it
- Headline: Nothing saved until you approve.
- Body: A scan only writes proposals. Approving a card is the sole path to a real row, and it runs the same server action the form runs.
- Cards:
  - **Proposals, not records.** A scan inserts `ingest_proposals` and nothing else. (source: lib/ai/ingest/scan.ts:282-296, lib/files/parse-stored.ts:1-10)
  - **Edit before you approve.** Every proposed row is an editable grid. Blanks stay blank, numbers stay numbers. (source: components/ai/ingest/ingest-approval-modal.tsx:74-77, components/ai/ingest/ingest-grid.ts:1-8)
  - **Pick the well once.** A well-scoped card asks which well, and the next card from the same document is seeded with your answer. (source: components/ai/ingest/ingest-approval-modal.tsx:52-59)
  - **Permission re-checked at approval.** Approving re-checks that you may write that record type, then writes through the domain action. (source: lib/ai/ingest/actions.ts:2182-2230, lib/ai/ingest/types.ts:100-110)
  - **Already on file is dropped.** Shared dedup keys suppress rows that match existing records, and the card says so when everything was. (source: lib/ai/ingest/dedup-keys.ts:1-12, lib/ai/ingest/scan.ts:232-281)
  - **Cards only where you are working.** A card opens on Data Entry, a well's page, Invoices or Revenue, and a well's page shows only that well's cards. (source: components/ai/ingest/ingest-provider.tsx:111-168)
  - **Dismiss writes nothing.** Dismissing marks the proposal and leaves every record untouched. (source: lib/ai/ingest/actions.ts:2272-2290)
- Screen: the hero approval card, approved state, with the "7 readings added" result. Fixture: `gaugeSheetProposal` with `status: "approved"`.

### 8. A cabinet Orion can read
- Headline: Every file, searchable by meaning.
- Body: Files live in one tree, every facility owns a folder, and uploads are indexed for Orion's search.
- Cards:
  - **One tree, nine system folders.** Wells, Leases, Tanks, Meters, Batteries, Projects, Data Entry, Scans and Chat Attachments, seeded for every organization. (source: lib/files/system-folders-seed.ts:19-29)
  - **Every facility owns a folder.** A file on a tank's Files tab is the same row as `Tanks / Tank 5` on the Files page. (source: lib/files/facility-folder.ts:1-27, components/files/facility-files-tab.tsx:4-16)
  - **Upload a whole folder.** Pick a directory and the tree is recreated, OS junk files skipped, with "Uploading 12 of 480" progress. (source: lib/files/upload-plan.ts:1-13, components/files/file-browser.tsx:253-256)
  - **Straight to storage.** Bytes go from the browser to storage through a signed URL, up to 5 GB a file. Files over 100 MB are stored and left unindexed. (source: lib/files/direct-upload.ts:1-20, lib/files/direct-upload.ts:31-47)
  - **OCR for search.** PDFs and images are OCR'd and chunked into a 1,024-dimension index with keyword search alongside. (source: lib/ai/retrieval.ts:66-79, lib/ai/ocr.ts:1-6, /home/linuxuser/dev/wildcat.md:39)
  - **Pin, move, rename, download.** Pinned files float to the top of their folder. Downloads are signed links. (source: components/files/file-browser.tsx:202, lib/files/actions.ts:742-867, lib/files/actions.ts:1023)
  - **Write a document in place.** New documents are a rich-text editor with autosave, and Orion can draft or edit one with your approval. (source: lib/files/actions.ts:611-692, lib/ai/tools.ts:1405, lib/ai/tools.ts:4047)
- Screen: port `components/files/file-browser.tsx` at the `Tanks / Smith battery Tank 1` folder with four files (the gauge sheet photo, the September GreaseBook export, two Plains run tickets) and the Oct gauge sheet pinned. Fixture: `smithTankFolder` in `documents-fixture.ts`.

### 9. Logs and scans, viewed in place
- Headline: Well logs open where they live.
- Body: The viewer renders the formats a well file comes in, and Orion reads the same files.
- Cards:
  - **LAS logs as tracks.** A triple-combo track display with conventional curve colors, in the browser. (source: components/files/las-preview.tsx:14-19)
  - **Raster logs digitized.** A scanned TIFF log is calibrated by depth, read by depth, and digitized to a LAS you can view beside it. (source: components/files/raster-log.tsx:9-17, lib/raster-log/raster-log.ts:13-17, lib/ai/tools.ts:1147-1185)
  - **Whole log in one read.** Orion reads an entire LAS file, every curve at full resolution, in one call. (source: lib/ai/tools.ts:1135)
  - **Spreadsheets and PDFs inline.** Sheets render as a grid, PDFs page in place, markdown reads clean. (source: components/files/spreadsheet-preview.tsx:3-8, components/files/document-viewer.tsx:165-186)
  - **Orion reads the page you open.** The open file is published to Orion, so "summarize this" works. (source: components/files/file-browser.tsx:264, lib/ai/tools.ts:1106-1115)
- Screen: port `components/files/las-preview.tsx` on a short three-curve LAS (GR, RHOB, NPHI) for Smith 4. Fixture: a 200-row LAS string `smith4Las` in `documents-fixture.ts`.

### 10. Dropbox, mirrored
- Headline: Your Dropbox, read by Orion.
- Body: Connect an account and its folders appear in Files, read-only, indexed for search.
- Cards:
  - **Whole account by default.** Connecting syncs the account root, with folder picking still available. (source: lib/cloud/whole-account.ts:3-20)
  - **Read-only mirror.** Dropbox stays the source of truth. Wildcat never writes back and refuses edits to a mirrored file. (source: lib/files/cloud-guards.ts:3-17)
  - **Indexed ahead of time.** Changed files are queued and read so Orion never waits on Dropbox. Files over 50 MB are listed but not read. (source: lib/cloud/dropbox/index.ts:21-40)
  - **Updates by webhook.** Dropbox notifies on change, the signature is verified, and a sync plus a minute of indexing runs. (source: app/api/integrations/dropbox/webhook/route.ts:11-18)
  - **Share or keep private.** Each synced root can be visible to the company or only to its owner. (source: lib/cloud/sync-actions.ts:252, lib/cloud/actions.ts:20-30)
- Screen: port `components/settings/files-section.tsx` with one connected Dropbox account, one root `/`, 1,240 files, 3 unreadable. Fixture: `cloudSettings` in `documents-fixture.ts`.

## FAQ
- **Does a scan ever write a record?** No. A scan inserts proposals only. Approving a card is the single path to a real row, and it re-checks your permission first. (source: lib/ai/ingest/scan.ts:282-296, lib/ai/ingest/actions.ts:2182-2230)
- **What if the same statement is uploaded twice?** Rows that match a record already on file are dropped before the card, and the card says everything was on file. (source: lib/ai/ingest/dedup-keys.ts:1-12, lib/ai/ingest/scan-status-copy.ts:15-17)
- **What formats can it read?** PDF, images including HEIC and TIFF, xlsx, csv, txt, docx, LAS. Search indexing covers PDFs, images and text. docx and xlsx are stored but not search indexed. (source: lib/files/file-type.ts:9-50, lib/ai/retrieval.ts:66-79)
- **How big a file?** 5 GB a file through the Files page, 100 MB combined through a form upload, and files over 100 MB are stored without indexing. (source: lib/files/direct-upload.ts:31-47, lib/files/limits.ts:13)
- **Which model reads documents?** Claude Opus 5 by default for transcription and extraction, set in one place for the whole scan pipeline. Search OCR is Mistral. (source: lib/ai/scan-model.ts:20-24, lib/ai/ocr.ts:1-6)
- **How many passes does an extraction get?** Analyze, then validate and re-analyze up to 3 rounds. On the cap the best set is shown and you are the final gate. (source: lib/ai/ingest/dedicated-flow.ts:13-35)
- **Can I turn scanning off?** Yes, per organization in Settings. Files still upload and index for search. (source: components/settings/ai-section.tsx:94-214, lib/ai/ingest/scan-status-copy.ts:22-23)
- **Does it cost credits?** Yes. Out of credits, uploads still file and the card says to top up. (source: lib/ai/ingest/scan-status-copy.ts:18, lib/ai/ingest/types.ts:646-656)
- **Who can upload?** Members with the files permission. Each record type's card re-checks its own permission at approval. (source: app/files/page.tsx:23, lib/ai/ingest/types.ts:100-105)
- **Can the phone scan?** Yes. Camera pages become one PDF and go through the same upload pipeline as the web. (source: app/api/scan/ingest/route.ts:2-17)

## Siblings
- **Mobile app.** Pumpers photograph tickets and gauge sheets on the lease and they land in the same approval cards. (source: app/api/scan/ingest/route.ts)
- **Orion.** The same approval gate guards Orion's own writes, and Orion searches every indexed file. (source: lib/ai/tools.ts:1093)
- **Reports.** The rows approved here are the rows reports are built from. Gross versus net starts with the statement you approved. (source: lib/ai/ingest/types.ts:557-561)
- **Filings.** Form PR draws on the gauges, tickets and meter volumes these cards create. (source: /home/linuxuser/dev/wildcatiq-landing/src/lib/site.ts filings entry, lib/ai/tools-surface.ts:724)

## Fixture notes
- Operator Wilder Oil Co, Oct 27 2026 operating day, pumper Hank, purchaser Plains Marketing. Same as the Orion fixture.
- Smith battery Tank 1 (500 bbl, 15 ft, 2.78 bbl per inch) must be one tank with one id and one name across pages. The current `documents-fixture.ts` calls the Smith tank `Smith T201` (id `t-sm-201`) and the orion fixture calls it `Smith battery Tank 1` (id `b7e1c2d4-…`). Reconcile.
- Gauge sheet proposal rows (Oct 20 to 26) must end at 15.44 in on Oct 26 so the hero card and Orion's "Yesterday, Oct 26, 15.44 in" agree, and the Oct 23 haul must match the Plains run Orion cites.
- The Plains September statement: Johnson A 6 loads, 1,061.4 net bbl, 36.2 API, $60.88 per bbl, must equal Orion's "Johnson A September run tickets" thread.
- Roy Corbett 2 service row: Oct 22 rod job, inside the Oct 21 14:00 to Oct 23 07:00 downtime from the orion fixture.
- GreaseBook September gauges for Smith battery Tank 1 must sum to the Smith September oil the dashboard fixture shows.
- New exports: `gaugeSheetProposal`, `corbettServiceProposal`, `greasebookProposal` (all `IngestProposal` shape from `lib/ai/ingest/actions.ts`), `queuedFiles`, `smithTankFolder` (`RepoFolder` shape), `smith4Las`, `cloudSettings`.

## Open questions
- **Lease terms are not a documents feature.** The current copy's third block ("Lease terms too: primary term, expiration, rentals and shut-in royalty") describes the lease Land record and its dated obligations (`lib/leases/land.ts:1-10`, `lib/leases/obligations.ts:9-14`), which are entered by hand in a dialog. No ingest type reads lease terms. The `leases` ingest type reads number, name and county only (`lib/ai/ingest/types.ts:191-200`). Move the claim to a lease or dashboard page or drop it.
- **Mud logs.** Memory notes say MainLog `.mlw` mud logs decode natively with a viewer. No file in this checkout matches `mlw` or `mudlog`. Not sold until found.
- **Dropbox is unverified against a real account** (memory note `wildcat-dropbox-integration`: migration needs push, unverified). The code is complete. Decide whether section 10 ships or waits.
- **Orion search index versus ingest read differ.** Search OCR is Mistral (`lib/ai/ocr.ts`) while ingest transcription is Claude (`lib/ai/read-document.ts`). Two readers, one file. Fine for copy, worth knowing if a reader asks "which OCR."
- **Reducto on tank Add History.** PDFs through a tank's Add History are read by Reducto, not Claude (`lib/ai/reducto.ts:5-11`). A third reader. Not named in copy.
- **`ai_scan_uploads` has a UI now** (`components/settings/ai-section.tsx:94,214`). `wildcat.md:143` says it is SQL-only. The FAQ follows the code.
- **Per-agent effort is declared but not applied.** `lib/ai/ingest/agent-call.ts:37-43` says every scan agent runs at one pipeline-wide effort. No copy impact.
- **Facility folders migration.** `2026080902000_facility_folders.sql` is referenced in code (`lib/files/facility-folder.ts:8`). Whether it is applied on the live database was not checked here.
- **Scan provider switch.** `SCAN_PROVIDER` can route scans to OpenAI (`lib/ai/scan-model.ts:20-24`). Default is Anthropic. The FAQ states the default only.
- **The Invoices and Revenue pages run their own extractors** (`lib/invoices/extract.ts`, `lib/statements/extract.ts`) with their own review screens, and hand only the secondary records to the shared card system (`lib/ai/ingest/backfill.ts`). The page above presents them as one flow. That is accurate at the user's level but the "Orion extracts, you approve" framing hides two review screens.

---

# Reports

Source paths below are relative to `/home/linuxuser/dev/wildcat` unless prefixed `landing/` (= `/home/linuxuser/dev/wildcatiq-landing`).

## Intent
Make the office manager believe the month-end reporting they build in Excel already exists, built from the same gauges, tickets and statements the field entered, and that it arrives by email without anyone running it. The owner-operator reads it for the digest and the read-aloud. A pumper sees only the Pumper Report about their own coverage.

## Hero
- Eyebrow: Reports
- Headline: Every report, built before you ask.
- Subhead: Twenty-four reports from your own gauges, tickets and statements, read on screen, downloaded as PDF, Excel or CSV, or emailed on your schedule.
- CTAs: Get started | Book a demo
- Screen: `landing/src/components/screens/reports-live.tsx` already renders the real hub: `ReportNav` on the left (`src/components/reports/viewer/report-nav.tsx`), `ReportMarkdown` with KPI tiles, narrative, charts and tables (`src/components/reports/viewer/report-markdown.tsx`), the Narrate button, View in new tab and the Download menu, and the Report settings modal (`ReportScheduleTable`). Hero state: Monthly Company Digest for September open, settings modal closed (`<ReportsLive settings={false} />` as `landing/src/components/screens/index.tsx:19` already does). Fixture: `landing/src/lib/screens/reports-fixture.ts` covers the digest, the 24-report nav plus per-well history, the schedule grid and download hrefs. Add `exceptions` and `comments` rows so the Exceptions and "What the pumpers reported" sections render (the monthly digest omits Exceptions by design, so switch the hero to the Daily digest or add the rows to a second fixture).

## How it works
1. **Log.** Pumpers gauge tanks, read meters and drop run tickets, and statements land in Documents (`src/lib/reports/hub/sources.ts:10-15`).
2. **Build.** Each report is one loader and one column set, shared by the screen and the file, so the PDF and the XLSX are two renderings of one table (`src/lib/reports/hub/sources.ts:10-15`).
3. **Read.** Pick a report on the left and it opens as a document with stat tiles, narrative, charts and tables, with Orion ready to read it aloud (`src/app/reports/page.tsx:30-38`).
4. **Schedule.** Flip a switch in the grid for daily, weekly or monthly, pick an hour and a timezone once (`src/lib/reports/schedule/actions.ts:3-12`).
5. **Receive.** The reports are built at 2am Central and every report due that morning arrives as one email with a three-sentence summary and PDFs attached (`src/lib/reports/schedule/precompute.ts:3-11`, `src/lib/reports/schedule/deliver.ts:3-9`).

## Sections

### 1. The library
- Headline: Twenty-four reports, one set of numbers.
- Body: Every report reads the same loaders as its export and the production pages, so a figure never changes between the screen and the file.
- Cards:
  - **Six groups.** Company, Production, Tanks, Wells, RRC and Pumper, in that order on the left. (source: `src/lib/reports/hub/sources.ts:103-110`)
  - **A report per well, automatically.** Each well's production history appears under Wells the day the well is added. (source: `src/lib/reports/hub/sources.ts:617-647`)
  - **Only what you may see.** The list is filtered by capability, and the schedule grid is built from that list, so nobody is offered a report they cannot open. (source: `src/app/reports/page.tsx:78-91`, `src/lib/reports/hub/sources.ts:684-687`)
- Screen: `ReportNav` with all six groups open, beside the Daily Production report header. Fixture: `reportsNavGroups()` in `reports-fixture.ts`.

### 2. The Company Digest
- Headline: The company, read in two minutes.
- Body: One document a day, a week or a month, with the numbers first and the prose that explains them second.
- Cards:
  - **Headline tiles.** Oil, gas, water, oil sold and revenue, each with its move against the prior period, and on the monthly the realized price against the benchmark. (source: `src/lib/reports/digest/kpi-tiles.ts:5-10`, `src/lib/reports/digest/markdown.ts:150-154`)
  - **A written headline.** A two to four sentence narrative from the computed numbers, with a plain-language fallback written from the figures when the model is unavailable or the org is out of credit. (source: `src/lib/reports/digest/summary.ts:3-14`, `src/lib/reports/digest/assemble.ts:13-18`)
  - **Exceptions at the battery.** Any battery more than 20% off its own 30-day moving average, for oil or gas, with ungauged days left out rather than counted as zero. (source: `src/lib/reports/digest/exceptions.ts:6-22,46`)
  - **What the pumpers reported.** Daily-reading remarks and facility comments summarized in prose, and a comment that says a well is down counts as an exception even when the barrels look normal. (source: `src/lib/reports/digest/comments.ts:3-22`, `src/lib/reports/digest/exceptions.ts:24-27`)
  - **Three levels that reconcile.** Company, each lease and each well, with a lease exactly the sum of its wells and unallocated dollars shown rather than hidden. (source: `src/lib/reports/digest/build.ts:18-27`)
  - **Estimated, then settled.** Daily and weekly value each day's barrels at the realized price, and the monthly settlement digest uses statement dollars with the earlier estimate shown as a variance. (source: `src/lib/reports/digest/build.ts:11-16`, `src/lib/reports/digest/schedule.ts:52-65`)
  - **Price moves, not price alarms.** Realized against benchmark against last period is reported as context and is never an exception. (source: `src/lib/reports/digest/price-moves.ts:4-13`, `src/lib/reports/digest/exceptions.ts:29-31`)
- Screen: `ReportMarkdown` on the Daily Company Digest with one exception, one pumper comment and the 14-day trend. Fixture: add `exceptions: [{ message }]` and `comments`/`commentsSummary` to `reportsDigest()`.

### 3. Production reports
- Headline: Production at every grain.
- Body: The same per-well series rolled up by day, week, month, quarter and year, with the swings and the misses called out.
- Cards:
  - **Daily Production.** Each well's last day, scoped to a lease or a well. (source: `src/lib/reports/report-specs.ts:146-149`)
  - **Weekly, Monthly, Quarterly, Annual.** One table per calendar period with the company total as its first row, picked from a period menu. (source: `src/lib/reports/report-specs.ts:174-193,229-248`, `src/lib/reports/hub/sources.ts:218-228`)
  - **Production Overview (Daily).** The last 30 days, day by day, with the window printed in the title. (source: `src/lib/reports/report-specs.ts:256-259,36-45`)
  - **Production Variance.** Oil, gas and water 1-day, 7-day and 30-day percent moves for the company, each lease and each well, landscape. (source: `src/lib/reports/report-specs.ts:282-305`)
  - **Exception Report.** Every facility whose last three days diverge from its 30-day average, with the comment beside it, and a blank where the stream was not measured rather than a zero. (source: `src/lib/reports/report-specs.ts:305-335`)
- Screen: `ReportMarkdown` on Production Variance with the period and lease pickers in the header (`ReportPickers`, `src/components/reports/viewer/report-pickers.tsx`). Fixture: build variance rows from the shared well list (see Fixture notes).

### 4. Tank reports
- Headline: The tank battery, on paper.
- Body: Everything a gauger, a hauler and an auditor ask about the tanks, from one set of readings.
- Cards:
  - **Gauge History.** Every gauge in the org as a field log per tank with the barrel change since the last reading, filtered to one battery or one tank. (source: `src/lib/reports/tanks/tank-measurements.ts:1-11`, `src/lib/reports/hub/sources.ts:379-421`)
  - **Simplified Production.** Opening, sales, dispositions, transfers, closing and production per tank, month to date. (source: `src/lib/reconciliation/export.ts:18-28`, `src/lib/reports/hub/sources.ts:437-442`)
  - **Battery Capacity.** Inches and barrels used against capacity per tank, grouped by battery with a company total. (source: `src/lib/reports/tanks/battery-capacity.ts:1-7`)
  - **Tanks Called In.** The pickup queue, with stock, percent full, gatherer and days waiting. (source: `src/lib/reports/tanks/tanks-called-in.ts:1-7`)
  - **Tank Measurement Audit.** Who created, edited or deleted every gauge entry and when, deletions included. (source: `src/lib/reports/tanks/tank-audit.ts:1-8`)
  - **Transport Tickets and Water Disposed.** Run-ticket hauls, and SWD volumes from each injection well's meters over 7 or 30 days. (source: `src/lib/reports/hub/sources.ts:512-516,357-363`, `src/lib/disposal/actions.ts:455-462`)
- Screen: `ReportMarkdown` on Tanks Called In with four tanks queued. Fixture: add `tanksCalledIn` rows (tank, battery, stock bbl, percent full, gatherer, days waiting).

### 5. Wells, RRC and the pumper
- Headline: What you file, already reconciled.
- Body: The reports you reach for at month end, built from the same allocation the filing uses.
- Cards:
  - **Well Test Report.** Tests, GOR, oil and water cut, downtime and allocation per producing well, injectors excluded. (source: `src/components/reports/report-registry.ts:29`, `src/lib/wells/well-performance-service.ts:26-29`)
  - **Gross vs Net Production.** Gross, working-interest, net-revenue and royalty volumes for oil, oil sales, gas and water, kept as distinct fractions. (source: `src/lib/interest/gross-net.ts:1-20`)
  - **RRC Monthly Reconciliation.** Runs from run tickets allocated tank to well, dispositions, production, opening balance and lease-use gas, from the same derived series every production page shows. (source: `src/lib/rrc/report-data.ts:7-14,29-36`)
  - **RRC Monthly Well Detail.** Built from the Form PR builder's own records, so opening and closing are the tank gauges the filing reports. (source: `src/lib/rrc/report-data.ts:23-24`)
  - **Pumper Report.** Which facilities were visited on which days over the last 30, counting a day once however many tanks were gauged and never dropping a facility nobody reached. (source: `src/lib/reports/pumper/coverage.ts:3-13`, `src/lib/reports/hub/sources.ts:598-613`)
- Screen: `ReportMarkdown` on the Pumper Report with the coverage chart (`CoverageChartDom`, `src/lib/reports/pumper/chart-dom.tsx`). Fixture: 30 days of visits over the shared facility list with two missed stops.

### 6. Read it, file it, hear it
- Headline: On screen, as a file, out loud.
- Body: One document, three ways out.
- Cards:
  - **PDF, Excel or CSV.** Every report downloads in all three, and a multi-table report's CSV is a zip of one file per table, labeled as such. (source: `src/lib/export/mime.ts:3`, `src/app/reports/page.tsx:111-117`)
  - **Excel with a sheet per level.** The digest workbook carries Company, By Lease and By Well sheets from the same object as the PDF. (source: `src/app/api/reports/company-digest/export/route.ts:4-8`)
  - **Narrate.** Orion reads the report in his own voice, speaking prose as written, charts as conclusions and tables as framed figures, and a second click stops him. (source: `src/components/reports/viewer/narrate-button.tsx:7-13`, `src/lib/reports/narration.ts:3-19`)
  - **Never narrates what you are not seeing.** The script is built from the markdown on screen. (source: `src/app/reports/page.tsx:231-236`)
- Screen: `ReportHeader` with the Narrate button in its playing state beside View in new tab and the Download menu open showing PDF, Excel, CSV (.zip). Fixture: `reportsDownloadHrefs()`.

### 7. Set once, sent by email
- Headline: Switch it on, it arrives.
- Body: A grid of reports by frequency, and one delivery setting for all of them.
- Cards:
  - **Daily, weekly, monthly.** One row per report, a switch in each column. (source: `src/lib/reports/schedule/catalog.ts:30-34`, `src/components/reports/schedule-table.tsx:3-6`)
  - **One hour, one timezone.** Any hour of the day in Central, Eastern, Mountain or Pacific, defaulting to 8am Central. (source: `src/components/reports/schedule-table.tsx:46-53`, `src/lib/reports/schedule/actions.ts:59-63`)
  - **Always a PDF.** Every scheduled report is attached as a PDF, one answer so nobody is surprised by the file. (source: `src/lib/reports/schedule/catalog.ts:18-27`)
  - **Addressed to you.** Switching a cell on subscribes the signed-in user, and switching it off keeps the recipient list. (source: `src/lib/reports/schedule/actions.ts:7-10`)
  - **Honest about what cannot send yet.** A report the overnight job cannot build shows its switches disabled and says "cannot be emailed yet" rather than accepting a schedule it would never keep. (source: `src/lib/reports/schedule/catalog.ts:48-56`, `src/components/reports/schedule-table.tsx:200-207`)
- Screen: the `ReportScheduleTable` inside the Report delivery modal, as `reports-live.tsx` already lays it out with `settings` true. Fixture: `reportsSchedule()` with the digest daily and monthly, Daily Production daily and Production Variance weekly on.

### 8. Built overnight, sent on time
- Headline: Written at 2am, read at 8.
- Body: The expensive work happens while nobody is waiting, and a missed hour is caught up, never doubled.
- Cards:
  - **Compiled at 2am Central.** Aggregation, narrative, PDF render and the email summary run overnight, so an 8am send leaves at 8am. (source: `src/lib/reports/schedule/precompute.ts:3-11`, `src/app/api/cron/report-digests/compile/route.ts:19-20`)
  - **One email per morning.** Everything due for the same org and cadence is one message with every PDF attached, not six emails on a Friday. (source: `src/lib/reports/schedule/deliver.ts:3-9`)
  - **Three sentences on top.** The body says what is notable inside the attachments and names what came, written by the model with a plain fallback so an email is never held up. (source: `src/lib/reports/schedule/email.ts:1-12`, `src/lib/reports/schedule/summary.ts:3-22`)
  - **Weekly on Friday, monthly on the 1st and 20th.** The weekly covers seven complete days, the monthly production digest fires on the 1st, and the settled digest waits for statements until the 20th. (source: `src/lib/reports/digest/schedule.ts:15-24,43-47`)
  - **Missed hours are caught up.** Due-ness is a stored watermark, so a send missed in downtime goes out on the next pass and two passes in one minute send nothing twice. (source: `src/lib/reports/schedule/dispatch.ts:3-10`, `vercel.json` cron `/api/cron/report-digests` hourly)
- Screen: none

## FAQ
- **How many reports are there?** Twenty-four named reports in six groups, plus one production history per well. (source: `src/lib/reports/hub/sources.ts:265-283,291-306,357-363,379-615`)
- **Which reports can be emailed today?** The Company Digest and the eight Production reports. The Tanks, Wells, RRC and Pumper reports show in the grid with their switches disabled until the overnight builder covers them. (source: `src/lib/reports/schedule/catalog.ts:48-56`)
- **What format is the email attachment?** PDF, always. Excel and CSV are download formats on the page. (source: `src/lib/reports/schedule/catalog.ts:18-27`, `src/lib/export/mime.ts:3`)
- **Who receives a scheduled report?** The person who switched it on. There is no recipient picker in the grid. (source: `src/lib/reports/schedule/actions.ts:7-10`)
- **Who can change the schedule?** The owner, an admin, or a member with manage oil production, manage gas production, manage disposal or manage statements. (source: `src/lib/reports/schedule/actions.ts:30-40`)
- **Who can open the hub?** Members with `view_reports`, which requires both production and revenue viewing because one digest carries both. (source: `src/lib/settings/org.ts:304-312`, `src/app/reports/page.tsx:70`)
- **Does the digest use AI?** The headline narrative and the pumper comments summary do, on the computed numbers only, never raw rows, with a deterministic fallback when the org has no credit or the call fails. (source: `src/lib/reports/digest/summary.ts:3-14`, `src/lib/reports/digest/assemble.ts:13-18`)
- **Does Narrate cost anything?** It needs the `use_ai` permission, an ElevenLabs key on the account and AI credit, and it is metered like chat. (source: `src/app/api/voice/route.ts:23-42`)
- **Are the RRC reports the filing?** No. They reconcile what you would file. The Form PR itself is built on the Filings page. (source: `src/lib/rrc/report-data.ts:1-24`, `src/app/reports/page.tsx:52-53`)
- **How fresh is a report?** Digests are read from the 2am compile so the page shows what the morning email carried. Every other report is rebuilt after an hour. (source: `src/app/reports/page.tsx:42-46`, `src/lib/reports/cache/store.ts:53`)
- **Does a scheduled report ever send twice?** No. Each send claims a unique period row before mailing, so a racing dispatcher loses there rather than in your inbox. (source: `src/lib/reports/schedule/dispatch.ts:14-20`)

## Siblings
- **Dashboard**: the lease table's day is the digest's day, read on screen instead of in a PDF.
- **Filings**: the RRC Monthly Reconciliation and Well Detail reports reconcile the Form PR the Filings page generates.
- **Orion**: the voice that reads a report aloud is the same Orion you talk to in chat.
- **Mobile**: the gauges, meter reads and comments the reports summarize are logged there.

## Fixture notes
- One well list shared with the dashboard (see `dashboard.md` Fixture notes): the digest's `LEASES[].wells` must be the dashboard's 14 wells with the same names, so Roy Corbett 4's six down days show in the digest's Exceptions and in the brief.
- September volumes: `oil`, `gas`, `water` per lease in the digest equal the dashboard's `byWellMonthly` September rows summed per lease.
- `oilSales` per lease and the "3,484 barrels" in the digest summary must equal the run-ticket count the dashboard brief or table implies (`runs30d`), or drop the number from the summary prose.
- `OIL_PRICE` 60.12 and `GAS_PRICE` 2.41 already match the dashboard's `PRICES`. Keep `PRIOR_OIL_PRICE` and the benchmark 63.85 in the shared constants.
- Operator `Wilder Oil Co` and owner `Hank` in both the digest summary and the brief.
- Add fixture rows for the extra screens: `exceptions` and `comments` on the daily digest, Tanks Called In rows, Production Variance rows and Pumper Report visits, all over the same wells and tanks.
- `reportsSchedule()` cells already name `company-digest`, `production-company-daily-summary` and `production-production-variance`, which are all deliverable ids. Keep it that way so no disabled switch is shown on.

## Open questions
- **"Twenty-one reports" in the current copy is wrong.** The hub lists 24 named reports plus one per well (`src/lib/reports/hub/sources.ts`). Use twenty-four.
- **"Schedule the digests and production reports" is right, but the grid shows 21 rows and only 9 can be switched on.** The Tanks, Wells, RRC and Pumper rows are disabled with "cannot be emailed yet" (`src/lib/reports/schedule/catalog.ts:54-56`). Say which can be scheduled, do not imply all.
- **"PDF, Excel or CSV" applies to downloads only.** Scheduled emails are PDF only (`catalog.ts:18-27`). The current page copy "Any format. PDF, Excel, CSV, or read aloud." is fine for the page, not for the schedule.
- **Four reports exist as modules but are not in the hub.** Service Report, Inventory Report, Well Statement and Company Summary are registered in `src/components/reports/report-registry.ts:8-11,41-44` and have export routes (`src/app/api/reports/service/export/route.ts`, `src/app/api/reports/inventory/export/route.ts`), but the old `ReportsHub` modal list that showed them is not mounted under `src/app`. Do not list them until they are in `hub/sources.ts`.
- **The Filings docket is deliberately not linked from the hub** (`src/app/reports/page.tsx:52-53`). The Siblings line is fine, but the screen should not show a Filings entry in the nav.
- **No recipient picker.** A subscription goes to the signed-in user (`schedule/actions.ts:7-10`). The current copy's "they arrive by email" is true, "send them to your partners" would not be.
- **Daily digest narrative uses Sonnet, the email TLDR uses Opus** (`digest/summary.ts:40`, `schedule/summary.ts:31`). Not copy, but do not say "Opus" anywhere on this page.
- **Exceptions thresholds differ by surface.** The digest and the Exception Report use 20% at the battery (`exceptions.ts:46`), the dashboard brief uses 25% at the well (`brief/route.ts:41`). Quote each on its own page and never a single number for both.
- **Settings > Reports shows the same grid** (`src/components/settings/settings-workspace.tsx:241-247`). One behaviour, two entrances, mention only the gear on the Reports page.

---

# Filings

Source paths are relative to `/home/linuxuser/dev/wildcat` unless prefixed `landing:` (`/home/linuxuser/dev/wildcatiq-landing`). `spec:NNN` is the RRC's Form PR EDI requirements text at `docs/rrc-form-pr/edi-filing-requirements-2022-08-01.txt`.

## Intent
Filings turns the gauges, run tickets and meter readings the pumper already enters into the Form PR the RRC accepts, reviewed field by field and downloaded as the EDI file the operator uploads to RRC Online. The buyer must leave believing the monthly PR is no longer retyped from a spreadsheet, that every number in the file is the number already on their Dashboard, and that nothing goes to the state without their eyes on it. Read by the owner-operator and the office manager who files the PR each month.

## Hero
- Eyebrow: Filings
- Headline: Form PR from your gauges.
- Subhead: The month's Form PR is built from the gauges, run tickets and meter readings already in Wildcat, checked against the RRC's rules, and downloaded as the EDI file you upload.
- CTAs: Get started | Book a demo
- Screen: `landing:src/components/screens/filings-live.tsx` already covers the docket: the app's `FilingsTable` (`src/components/filings/filings-table.tsx:39`) on the fixture rows, Form PR tab with its Beta badge, the RRC filer button, Month / Status / File columns. The stronger hero is the review itself: `GeneratedModal` (`src/components/reports/form-pr/generated-modal.tsx:295`, already copied to `landing:src/components/reports/form-pr/generated-modal.tsx`) open on September 2026 with the Identifying Record, five records and the File section. It is a `SwipeUpModal` that portals to `document.body` (`filings-live.tsx:4-7`), so the hero needs its body rendered inside the frame (an `inline` prop the way `LeaseModal` has one, or a static capture). Recommendation: hero = table (exists), section 3 screen = the review body. No Mapbox.

## How it works
1. **Enter the day.** The pumper gauges tanks, drops run tickets and reads gas meters the way they do every day. (`src/lib/rrc/form-pr/derive.ts:1-9`)
2. **Open the month.** Generate on a row builds the cycle fresh from the ledger as it stands, with nothing stored up front. (`src/lib/rrc/form-pr/service.ts:1-8`, `src/components/filings/filings-table.tsx:6-8`)
3. **Review every field.** The Identifying Record and all fifty fields of every record are on screen and editable, with each issue marked on the field it is about. (`generated-modal.tsx:1-15`)
4. **Download the EDI.** Download in the review writes the file, logs it, and stores it on the row. That is the only way a file is made. (`src/lib/rrc/forms/actions.ts:9-13`)
5. **Upload it yourself.** You submit the file through your RRC Online account. Wildcat does not file for you. (`docs/plans/rrc-form-pr.md:5-8`)

## Sections

### 1. Derivation
- Headline: Built from the ledger, nothing retyped.
- Body: One PR record per RRC lease or gas well, computed from the readings already on your wells.
- Cards:
  - **Ending storage is the gauge.** Ending stock is the sum of closing gauges over the record's tanks, re-anchored every month so rounding never accumulates. (source: src/lib/rrc/form-pr/derive.ts:8-14)
  - **Dispositions are the tickets.** Each disposition column is the sum of run tickets carrying that RRC code, with truck, pipeline or barge decided by the battery's takeaway. (source: src/lib/rrc/form-pr/derive.ts:9, :317-328)
  - **Opening is what the RRC holds.** Opening storage is last month's filed ending: your last export, else the RRC mirror, else the gauge. (source: src/lib/rrc/form-pr/derive.ts:10-12)
  - **Gas balances by construction.** Formation production is the derived daily gas, fuel, flare and vent are their own entries, and sales lands in code 2 or 3 by the meter's takeaway. (source: src/lib/rrc/form-pr/derive.ts:15-18, :445-451)
  - **A haul is the gauge drop.** Barrels hauled come from the tank's gauge drop, not the ticket's net barrels. (source: memory wildcat-rrc-form-pr.md, `production-reconcile.test.ts`)
  - **Grouped the RRC's way.** Wells group by oil or gas code, district and RRC lease number, not by Wildcat lease, so a lease with an oil record and a gas well files two records. (source: src/lib/rrc/form-pr/derive.ts:4-7)
  - **Several P-5s.** Each well files under the operator number it was imported from, with that operator's name, because the Commission checks the pair. (source: src/lib/rrc/forms/data.ts, "The P-5 a filing goes out under")
- Screen: none.

### 2. Validation
- Headline: Caught before the RRC sees it.
- Body: The RRC's own business rules and format rules run on every record before you see the file.
- Cards:
  - **43 RRC rules.** The spec's PR rule codes plus the format rules a file must pass before the RRC reads a record. (source: src/lib/rrc/form-pr/validate.ts:1-10)
  - **Block or warn.** Anything the RRC rejects, and any discrepancy visible from your own data, blocks. What Wildcat cannot know, like the agent's RRC authorization, warns. (source: src/lib/rrc/form-pr/validate.ts:5-10)
  - **No guesses.** A tank feeding two records, an uncoded ticket or a meter with no takeaway becomes an issue on the record, never an invented number. (source: src/lib/rrc/form-pr/derive.ts:20-23)
  - **The writer refuses the impossible.** A negative or decimal volume or an over-long name cannot be written, so that record is left out and named rather than written wrong. (source: src/lib/rrc/form-pr/write.ts:19-23)
  - **Marked on the field.** Each issue sits on the field it is about, and hovering the mark says what is wrong. (source: src/components/reports/form-pr/generated-modal.tsx:10-12, :176)
  - **Issues inform, they do not block Download.** The file is yours to take with its issue list in hand. (source: src/components/reports/form-pr/generated-modal.tsx:323-326)
- Screen: the review's Issues panel open (`generated-modal.tsx:136`, `:388`) with two issues: one block (a tank shared by two records) and one warn (agent user ID not verifiable, PR090). Fixture: `PrIssue[]` on the September build.

### 3. Review
- Headline: Every field on screen first.
- Body: The whole filing is on one screen and editable before a byte leaves.
- Cards:
  - **The Identifying Record.** RRC Online user ID, agent name, email and phone, saved as the org's RRC filer and defaulted onto every month. (source: src/components/reports/form-pr/filer-modal.tsx:1-5, generated-modal.tsx:340-376)
  - **All fifty fields.** Every PR field, grouped the way an operator reads a record, with the guard that the grouping covers the spec. (source: src/lib/rrc/form-pr/sheet.ts:26-33)
  - **Locked where it must be.** A record's identity and the retired gas code 4 column cannot be edited. (source: src/components/reports/form-pr/generated-modal.tsx:13-16)
  - **Edits rebuild the file.** Download with edits rebuilds server-side with your numbers in place, re-checked against the same RRC facts. (source: src/lib/rrc/form-pr/service.ts:148-154, generated-modal.tsx:278-289)
  - **Zero means zero.** A volume with nothing in it shows 0, because that is what the accepted file writes. (source: src/components/reports/form-pr/generated-modal.tsx:7-9)
  - **A filed month is read-only.** Everything locks and Download hands back the stored file without a rebuild. (source: src/components/reports/form-pr/generated-modal.tsx:17-18)
- Screen: `GeneratedModal` body on September 2026: header row, Records 5, Due Oct 31 2026, the first record (Johnson A, 08-O-xxxxx) expanded. Fixture: a `GeneratedFormPr` built from the Fixture notes below.

### 4. The file
- Headline: The format the RRC accepts.
- Body: One file, matched byte for byte to a report the RRC has already taken.
- Cards:
  - **Held to a golden file.** The writer is tested byte for byte against a Form PR the RRC accepted, 26 records from one operator. (source: src/lib/rrc/form-pr/__tests__/golden.test.ts:3, fixtures/PR_00BOC.EDI)
  - **Tab delimited, CRLF, 50 fields.** Header token TAB, a trailing delimiter on every line, every numeric column written. (source: src/lib/rrc/form-pr/write.ts:7-17)
  - **The preview is the bytes.** The File section shows every line as it will upload, tabs marked, from the same pure writer the server uses. (source: src/components/reports/form-pr/generated-modal.tsx:87-91)
  - **Corrected months ride separately.** A current-month report with corrected records becomes two files, because the spec says they may not share one. (source: src/lib/rrc/form-pr/write.ts:135-151, spec:814)
  - **Paper too.** The same records laid onto the RRC's own blank Form PR, nine lines a page, as a PDF. (source: src/lib/rrc/form-pr/pdf.ts:1-16)
  - **Spreadsheet.** Every field labelled as the spec labels it, with a summary sheet of what each lease produced, what left and what is in the tanks. (source: src/lib/rrc/form-pr/sheet.ts:1-14, generated-modal.tsx:248-262)
  - **Named for the month.** `PR_<Operator>_<cycle>.EDI`. (source: src/lib/rrc/form-pr/write.ts:145-149)
- Screen: the File section of the review open (`generated-modal.tsx:137`), the header line and three record lines visible with tab marks, the PDF / EDI / Spreadsheet download menu beside it. Fixture: the EDI text comes from `planExportFiles` over the fixture records (pure, `write.ts:137`).

### 5. Docket
- Headline: Every month, in one table.
- Body: A row per ended cycle, its status and its file.
- Cards:
  - **Twelve months.** The current cycle and the eleven before it, each row Not generated, Generated or Filed. (source: src/lib/rrc/forms/data.ts:260, :57-62, src/components/filings/filings-table.tsx:35)
  - **One due-date rule.** Form PR is due the last day of the month after the cycle, computed in one function the table and the review both read. (source: src/lib/rrc/forms/schedule.ts:1-8, :74-77)
  - **The file stays.** The stored file re-downloads unchanged, byte for byte, for as long as the row exists. (source: src/app/filings/[id]/download/route.ts:1-7)
  - **Set the filer once.** Until the four RRC filer fields are set, the page says so and no file can be generated. (source: src/components/filings/filings-table.tsx:137-145)
  - **Permissions.** View with `view_reports`, generate with `manage_regulatory`. (source: src/app/filings/page.tsx:23-25, src/lib/rrc/forms/actions.ts:5-7)
- Screen: `FilingsTable` as `filings-live.tsx` renders it today. Fixture: `landing:src/lib/screens/filings-fixture.ts` (see Fixture notes for the row changes).

### 6. One write path
- Headline: Nothing leaves without being read.
- Body: The only way a file exists is Download inside the review.
- Cards:
  - **Download is the generator.** No row-level Generate, so a file cannot reach the row without the operator having opened the month. (source: src/lib/rrc/forms/actions.ts:9-13)
  - **Every download is logged.** Each file handed out is kept with its records, and next month's opening storage chains to it. (source: src/lib/rrc/form-pr/service.ts:5-11)
  - **Wildcat does not submit.** You upload the file through RRC Online. (source: docs/plans/rrc-form-pr.md:5-8)
  - **Same numbers as the pages.** The builder reads the same tank readings, tickets and meter series the well and facility pages show, with the allocation windows opened the same way. (source: src/lib/rrc/forms/data.ts:1-8, src/lib/rrc/form-pr/alloc-window.ts:1-17)
- Screen: none.

### 7. More forms
- Headline: Built for the next forms too.
- Body: The H-10, W-10, G-10 and P-18 builders exist with their schedules, and will join the docket as tabs.
- Cards:
  - **H-10.** Annual disposal and injection monitoring, twelve months of the SWD well's own disposal series, due the first of the second month after the cycle year. (source: src/lib/rrc/forms/schedule.ts:42-48, :11-13, src/lib/rrc/forms/h10.ts)
  - **W-10 and G-10.** Oil and gas well status from the latest well test, scheduled 12 or 6 months on, flagged stale when the test is older. (source: src/lib/rrc/forms/schedule.ts:14-19, :143-148)
  - **P-18.** Monthly skim oil from the skim facility's tank gauges and tickets, due the 15th. (source: src/lib/rrc/forms/schedule.ts:9-10, src/lib/rrc/forms/data.ts:520)
  - **Not on the docket yet.** Only Form PR is offered today, by the owner's call on 2026-10-15. (source: src/lib/rrc/forms/schedule.ts:25-30)
- Screen: none.

## FAQ
- **Does Wildcat file the Form PR for me?** No. It builds, checks and hands you the EDI file. You upload it through your RRC Online account. (source: docs/plans/rrc-form-pr.md:5-8)
- **Which forms are supported?** Form PR today, in Beta. H-10, W-10, G-10 and P-18 builders are in the code and are not docketed yet. (source: src/lib/rrc/forms/schedule.ts:25-30, src/components/filings/filings-table.tsx:122-125)
- **Is it Texas only?** Yes. Form PR is the Texas Railroad Commission's monthly production report, and the file follows the RRC's 2022 EDI requirements. (source: src/lib/rrc/form-pr/spec.ts:1-5)
- **What format is the file?** Tab-delimited EDI, header plus one 50-field line per record, CRLF, `.EDI`, matched byte for byte to a file the RRC accepted. (source: src/lib/rrc/form-pr/write.ts:1-17)
- **Where does opening storage come from?** Your last downloaded file, else the RRC mirror's filed ending for the prior month, else the rounded gauge. (source: src/lib/rrc/form-pr/derive.ts:10-12)
- **What if a tank serves two leases?** The builder stops and names it as an issue on the record. It never splits a number it cannot justify. (source: src/lib/rrc/form-pr/derive.ts:20-23)
- **Do issues stop the download?** No. Blocking issues are what the RRC would reject or a discrepancy visible from your own data. They are listed and marked on the field, and the file is still yours to take. (source: src/lib/rrc/form-pr/validate.ts:5-10, src/components/reports/form-pr/generated-modal.tsx:323-326)
- **When is a Form PR due?** The last day of the month after the production month. (source: src/lib/rrc/forms/schedule.ts:8, :74-77)
- **Who can generate one?** Members with `manage_regulatory`. Members with `view_reports` can see the docket and download a stored file. (source: src/app/filings/page.tsx:23-25, src/app/filings/[id]/download/route.ts:19)
- **Can I edit a figure before I file?** Yes. Every field except the record's identity and the retired gas code 4 is editable, and Download with edits rebuilds the file with your numbers. (source: src/components/reports/form-pr/generated-modal.tsx:13-16, src/lib/rrc/form-pr/service.ts:148-154)

## Siblings
- **Dashboard.** The month's oil and gas on the Form PR are the Dashboard's month, from the same rows.
- **Documents.** Run tickets and gauge sheets dropped on Documents become the tickets and readings the PR is built from.
- **Reports.** The RRC reconciliation report compares your ledger with what the state holds.
- **Recon.** The lease names and prior ending storage the PR is checked against come from the same RRC mirror Recon draws.

## Fixture notes
Form PR volumes for September 2026 (cycle `202609`) must equal the Dashboard fixture's 2026-09 month. The dashboard fixture (`landing:src/lib/screens/dashboard-fixture.ts`) has `LEASES` (five), `WELLS` (fourteen), `FIXTURE_TODAY = "2026-10-27"` and a built `monthly` / `byWellMonthly` series. The filings fixture (`landing:src/lib/screens/filings-fixture.ts`) has the filer (Hank Wilder) and `OPERATOR_LABEL = "WilderOilCo"`. Add:
- A `GeneratedFormPr` for `202609` with one oil record per lease: `district "08"`, the lease's RRC oil lease number (shared with Recon's fixture), `fieldName`, `leaseName` as the dashboard lease name upper-cased, `recordUnique` = `leaseMnemonic(leaseName)` (`src/lib/rrc/form-pr/record.ts`).
- Per record, oil production = round(sum of `byWellMonthly[well].oil` for 2026-09 over the lease's wells), gas = the same for gas. `endingStorage` = closing gauges you choose, `opening` = `endingStorage` of the `202608` row, and dispositions (`liqDisp1`, trucked) = opening + production minus ending so PR051 balances. Gas: `gasDisp3` (plant) = production minus any fuel.
- Header: `agentUserId`, `agentName`, `agentEmail`, `agentPhone` from `filer`, `recordCount: 5`, `currentProductionMonth: true`.
- `PrIssue[]`: one block on Roy Corbett (a tank shared with Smith) and one warn on `agentUserId` (PR090).
- Docket rows: `listDocket` offers the current cycle and the eleven before it regardless of sign-up date (`src/lib/rrc/forms/data.ts:57-62`), so the table shows twelve rows, the older ones Not generated. The fixture's five rows and the `filed` rows with confirmation numbers need changing (see Open questions).
- The per-month totals on this page must equal the Recon lease dossier's September row for Johnson A and the Dashboard lease table's September oil and gas.

## Open questions
- **Filed status has no UI path.** `MarkFiledModal` exists (`src/components/filings/mark-filed-modal.tsx`) and `markFiled` is an action (`forms/actions.ts:306`) but nothing mounts the modal, and the table comment says nothing marks a row filed from the page (`filings-table.tsx:8-9`). The fixture's four `filed` rows with confirmation numbers show a state the shipped UI cannot produce. Either drop them to `generated` or confirm Mark filed is coming back. The current landing copy's "tracks due dates and status" is also stronger than the table, which shows Month / Status / File and puts the due date in the review only (`filings-table.tsx:5-6`, `generated-modal.tsx:311-313`).
- **Eyebrow.** Current `site.ts` uses "Regulatory". The sidebar and page title say "Filings" (`src/components/app-shared.tsx:267`). Used "Filings" above.
- **Beta.** The Form PR tab carries a Beta badge and the sidebar entry does too (`filings-table.tsx:122-125`, `app-shared.tsx:270`). Sold as Beta.
- **Run-ticket disposition codes.** `data.ts:411` reads `rrc_disp_code` off run tickets, and an uncoded ticket blocks, but no UI writer for that column was found in `src/components`. Confirm where the pumper sets it before the "Dispositions are the tickets" card goes live.
- **Unverified upload.** Memory (`wildcat-rrc-form-pr.md`) says no Wildcat-generated file has yet been uploaded to the RRC. The golden file is a third party's accepted report. The copy says "matched to a file the RRC accepted", not "accepted by the RRC".
- **Older spec drift.** `docs/plans/rrc-form-pr.md:14-21` describes Reports tabs, an upload path and a full-page review that were deleted (memory, 2026-09-23). Trust the code.
- **Docket length.** Twelve virtual rows regardless of when the operator signed up. The fixture shows five. Reconcile one way.
- **Current copy** says "meter readings" and "gas meters". The builder reads derived daily gas per well from meters with a takeaway (`derive.ts:15-18`). Kept "meter readings".

---

# Flow map

## Intent
Show the operation drawn as it runs: wells to tanks, meters and SWD wells, per lease, with today's volumes on the lines, and make the buyer believe the picture is the allocation itself, not a drawing beside it. Readers: the owner-operator (where does my water go, which well feeds which tank), the office manager (is the wiring the office allocates on the same wiring the pumper sees), the pumper (which tank am I gauging for which wells).

## Hero
- Eyebrow: Facilities
- Headline: See where every barrel goes.
- Subhead: Oil, gas and saltwater run left to right from each producing well through every tank, meter and SWD well, drawn from the same wiring the app allocates on.
- CTAs: Get started | Book a demo
- Screen: keep `src/components/screens/flow-map-live.tsx`. It renders the app's own `FacilitiesFlowMap` (copied into `src/components/facilities/flow-map.tsx` with its node, search, create menu, connect dialog, detail modal and substances files) over `src/lib/screens/flow-map-fixture.ts`, with Smith 4 highlighted and the Smith lease selected (`flow-map-live.tsx:3-9`, `:33-34`). The graph is built by the app's `buildFacilityGraph`, so the wiring is derived the way the page derives it (`flow-map-fixture.ts:1-5`). It already covers the hero. Two changes: open on the All view rather than a lease so the three colours and the company totals bar show at once (the totals bar only renders above 88rem, `flow-map.tsx:1610-1621`), and add a water meter and a second SWD route so the saltwater lane has a split to show. The detail modal cannot open on the landing because `flowMapRows` is empty (`flow-map-fixture.ts:221-222`), so section screens that need it must seed `rows`.

## How it works
1. **Pick a stream and a lease.** Two selects, upper left: All, Oil, Gas or Saltwater, and one lease or every lease (`wildcat/src/components/facilities/flow-map.tsx:9-13`, `substances.ts:24-29`).
2. **Read the lanes.** Each lease is a lane, each column is a stage downstream, and the lines carry the stream's colour and move in the direction of flow (`src/lib/facilities/flow-layout.ts:1-14`, `src/app/globals.css:327-335`).
3. **Click a card.** Its connections, settings and allocation open in one modal, and everything more than one hop away fades (`src/components/facilities/facility-detail-modal.tsx:3-14`, `flow-map.tsx:594-607`).
4. **Draw what changed.** Pull a wire from a card's port to another card, or drop a new facility onto a line, and the connection is written where the allocation engine reads it (`flow-map.tsx:1106-1125`, `src/lib/facilities/actions.ts:355-372`).

## Sections

### 1. The picture
- Headline: Three streams, one canvas.
- Body: The map draws the operation like a workflow builder, one commodity's path at a time or all three together.
- Cards:
  - **Field colours.** Oil green, gas red, saltwater blue on every line, card and label (`src/components/facilities/substances.ts:9-13`).
  - **Saltwater, named so.** Produced water is labelled Saltwater on every surface of the page (`substances.ts:17-21`).
  - **Lines move.** Dashes travel from source to target at one cycle a second and stop under reduced motion (`src/app/globals.css:327-340`, `flow-map.tsx:1324-1325`).
  - **Six card kinds.** Well, SWD Well, Tank, Meter, Battery and Haul-off, each with its icon (`substances.ts:78-95`, `src/lib/facilities/graph.ts:34-40`).
  - **Lanes pack to the screen.** Twenty one-well leases pack toward a 16:9 canvas instead of a mile-long ribbon (`src/lib/facilities/flow-layout.ts:46-51`).
- Screen: `FlowMapLive` on the All view, every lease, fit to view. Fixture: the five Wilder leases as they are.

### 2. The numbers
- Headline: Every line carries its barrels.
- Body: Cards and lines print rates from the same per-well series the rest of the app runs on, rounded once and added once.
- Cards:
  - **Rate on every card.** A well's bbl/d or mcf/d for the stream on screen, all three on the All view (`src/components/facilities/flow-map-node.tsx:33-40`, `:131-133`).
  - **Tanks show percent full, meters show the rate.** A tank's fill from its latest gauge, a gas meter's 14-day EMA, a water meter's bbl/d (`src/lib/facilities/flow-layout.ts:217-233`, `src/lib/facilities/actions.ts:889-905`).
  - **Volume pills on downstream legs.** A split nothing else shows is printed on the line, never on the first leg out of a well, which the card already states (`flow-map.tsx:1454-1479`).
  - **The headline is the sum of the cards.** Company oil, gas and saltwater add the rounded card values, so the column you add by eye lands on the total (`flow-map.tsx:550-570`, `substances.ts:46-66`).
  - **Refresh really refreshes.** The button drops the 15-minute rate cache and re-derives every card from the readings (`src/lib/facilities/actions.ts:120-137`).
- Screen: `FlowMapLive` on the Oil view with the Smith lane and the company totals bar in frame. Fixture: Smith wells, tank fill 62 and 41 percent, the two LACT legs with their bbl/d pills.

### 3. Reading the wiring
- Headline: Same wiring the allocation runs on.
- Body: The map is not a second source of truth, it is the allocation tables and the drawn connections, read as a graph.
- Cards:
  - **Edges are the allocation rows.** Well to battery is the oil split, well to meter is the gas split, well to water tank and tank to SWD well are the water path (`src/lib/facilities/graph.ts:7-14`).
  - **Drawn connections overlay it.** Operator-drawn `flow_connections` edges merge into the derived graph and are the only edges that can be deleted here (`src/lib/facilities/flow-edges.ts:1-12`, `graph.ts:107-112`).
  - **Active today, active wells.** Splits are filtered to effective dates covering today and inactive wells drop off with their edges (`src/lib/facilities/actions.ts:9-11`, `:170-176`).
  - **Shared facilities are drawn muted.** An SWD well or haul-off another lease flows into appears dashed and labelled other lease (`flow-layout.ts:60-67`, `flow-map-node.tsx:105`, `:127`).
  - **Permitted rate on an SWD well.** The UIC permit's bbl/d is a ceiling beside the measured rate, never a substitute (`graph.ts:60-69`).
- Screen: `FlowMapLive` on the Saltwater view, Smith lease, with Smith SWD 1 showing 525 of 2,000 bbl/d permitted and Smith W1 feeding it. Fixture: as is, plus `permittedBblPerDay` already set (`flow-map-fixture.ts:69-70`).

### 4. Click a facility
- Headline: Connections, settings, allocation in one place.
- Body: A card opens the facility the rest of the app edits, not a summary of it.
- Cards:
  - **Connections tab.** What feeds it and what it feeds, as a list, with drawn ones removable after a confirm (`src/components/facilities/facility-detail-modal.tsx:7-9`, `:352-380`, `:18`).
  - **Settings tab.** The facility's own form, rendered inline, same fields and same save path as its page (`facility-detail-modal.tsx:9-12`).
  - **Allocation tab.** The tank, meter or battery allocation panel, loaded when opened (`facility-detail-modal.tsx:12-14`, `:1021-1022`).
  - **Focus on one hop.** The selected card and its neighbours stay, the rest fades to 30 percent (`flow-map.tsx:594-607`, `flow-map-node.tsx:108`).
  - **Search by name or kind.** Eight ranked results, prefix first, and "meter" lists the meters (`src/components/facilities/facility-search.tsx:10-40`).
- Screen: `FlowMapLive` with the detail modal open on Smith T1, Connections tab, inflows Smith 1 to 4 and outflow Plains LACT. Needs `flowMapRows.tanks` seeded with the Smith tank rows (`flow-map-fixture.ts:221-222`).

### 5. Build on the map
- Headline: Draw the chain, write the allocation.
- Body: Adding and connecting from the map writes the same rows the facility pages write, in one round trip.
- Cards:
  - **Pull a wire.** Drag from a card's right port to the card it feeds, or from the left port to the card that feeds it (`flow-map.tsx:418-423`, `:1106-1125`).
  - **New connection, many to many.** Pick several feeders and several targets in one dialog, and feeders of one target split evenly (`src/components/facilities/facility-connect-dialog.tsx:3-15`).
  - **New facility, same form.** Well, tank, meter, battery and lease open the dialogs their own pages use (`src/components/facilities/facility-create-menu.tsx:3-9`).
  - **Drop it in the line.** A new facility dropped on a drawn connection stands in the middle of it and inherits its substance and share (`flow-map.tsx:733-760`, `src/lib/facilities/actions.ts:406-420`).
  - **Carry a card to another lease.** Dropping a card in another lease's lane moves the facility, and a tank on a battery moves the battery (`flow-map.tsx:974-978`, `actions.ts:665-680`).
- Screen: `FlowMapLive` with a wire being pulled from Smith 3's out port toward Smith W1 (the `pull` state at `flow-map.tsx:423`), Saltwater view. Fixture: as is.

### 6. Oil, gas and water obey their own rules
- Headline: Oil lands on the battery.
- Body: The map knows which table each stream is allocated in and writes there, so a drawn edge never shows barrels the engine does not count.
- Cards:
  - **An oil wire is battery membership.** Drawing a well into an oil tank writes it onto the tank's battery at 100 percent for the first well and 0 percent after, for the operator to split (`src/lib/facilities/actions.ts:355-372`).
  - **Water meters are wiring, not cards.** A water meter sits inside the saltwater line, and a chain through it is drawn end to end (`src/lib/facilities/graph.ts:359-366`, `:397`, `src/lib/facilities/flow-edges.ts:40-48`).
  - **A meter in the line, not beside it.** A new water meter with a tank and an SWD well picked is a chain through the tank, and a well wired straight to the hole hands that route to the meter (`src/lib/facilities/meter-wiring.ts:1-21`, `actions.ts:627-635`).
  - **A battery's connection is its tanks'.** One battery to SWD edge feeds every water tank on it, and a tank's own edge wins for that tank (`src/lib/flow/battery-edges.ts:1-30`).
  - **Deleting a facility heals the line.** Every feeder is rejoined to every outlet per substance, with shares composed (`src/lib/flow/heal.ts:1-23`).
- Screen: none.

### 7. Disposal and the map agree
- Headline: One resolver, every surface.
- Body: Where the water goes on the map is where the SWD well's volume comes from on its page.
- Cards:
  - **A disposal well is a sink.** Its volume is the throughput of the water meters wired into it, over the same edges the map draws (`wildcat/docs/swd-connections-architecture.md:52-58`).
  - **Metered means hand entry closes.** When a meter edge is active today the well's Reading item disappears and the server refuses it (`docs/swd-connections-architecture.md:67-68`).
  - **Reach through the station.** A meter two hops upstream through a tank and battery still measures the well, with a four-hop cap (`docs/swd-connections-architecture.md:29-38`).
  - **Terminal tanks count their gauge.** A water tank with nothing downstream is measured by gauge and hauls, one feeding a meter counts only hauls (`src/lib/flow/water-nodes.ts:1-10`).
  - **Orion reads the same graph.** get_facilities, list_facility_connections, trace_facility_flow and get_facility_readouts answer "what feeds this tank" from the map's data (`wildcat/src/lib/ai/tools.ts:858-888`).
- Screen: none.

### 8. Permissions and safety
- Headline: View for everyone, edit for some.
- Body: The map reads under one permission and edits under another, and every edit is the facility page's own server action.
- Cards:
  - **view_facilities to look.** The page and both loaders require it (`wildcat/src/app/facilities/page.tsx:34`, `src/lib/facilities/actions.ts:140`, `:880`).
  - **manage_facilities to draw.** New connection, New facility, ports and card carries appear only with it, and it implies view (`flow-map.tsx:323`, `:1647-1649`, `src/lib/settings/org.ts:204-214`).
  - **RLS does the scoping.** Connections are read and written through the request-scoped client under the `flow_connections` policies (`src/lib/flow/connections.ts:11-20`).
  - **Only drawn edges can be removed.** An edge derived from an allocation table is unwired on the split, never deleted from the map (`actions.ts:465-476`).
  - **Zoom in steps, fit to view.** Fixed stops from 25 to 180 percent and a fit button that never passes 1:1 (`flow-map.tsx:107-114`, `:1795-1805`, `:617-625`).
- Screen: none.

## FAQ
- **Is the map a separate drawing I have to maintain?** No. Every edge is an allocation row or a drawn `flow_connections` row, and the page's comment says it never becomes a second source of truth for who feeds what (`wildcat/src/app/facilities/page.tsx:23-27`, `src/lib/facilities/graph.ts:7-14`).
- **What writes when I draw an oil connection?** Membership in the tank's battery, not a `flow_connections` row, because oil is derived from the battery split and nowhere else (`src/lib/facilities/actions.ts:355-372`).
- **Can I draw a connection to a water meter?** A water meter is not a card. It is created from the New facility menu with its tank and SWD well picked and wired into the line (`src/lib/facilities/graph.ts:397`, `actions.ts:594-613`, `:627-635`).
- **Does the map show history?** No. Edges and splits are filtered to today, and a closed connection is visible only through Orion's list_facility_connections (`actions.ts:9-11`, `src/lib/ai/tools.ts:871-875`).
- **Who can edit it?** Members with manage_facilities, which implies view_facilities. Others see the map and the detail modal without the New connection, New facility, ports or carries (`flow-map.tsx:323`, `src/lib/settings/org.ts:204-214`).
- **Can I delete a derived connection from the map?** No. Only operator-drawn connections have a delete, and that delete confirms first. A derived edge is changed on the facility's allocation (`src/components/facilities/facility-detail-modal.tsx:3-9`, `actions.ts:465-476`).
- **Does a drawn edge carry a volume?** The edge carries a share, not a volume. Volumes come from measured points, meters, hauls and terminal tank gauges, and are attributed upstream by share (`docs/swd-connections-architecture.md:206-226`, `src/lib/flow/types.ts:11-16`).
- **Does Orion write connections?** Orion can read the graph and trace flow, and any write goes through the same approval gate as every other write tool (`src/lib/ai/tools.ts:858-888`).
- **Is there a demo mode?** Yes for development. A Facilities lab runs the same map over a synthetic or RRC-seeded operation and reads none of the org's rows (`wildcat/src/app/dev/facilities/page.tsx:6-16`, `src/components/facilities/facility-writes.tsx:3-20`).

## Siblings
- **Mobile**: the gauges and meter reads the phone collects are the rates on these cards.
- **Dashboard**: the company oil and gas totals on the map's bar are the same per-well rates the dashboard sums.
- **Orion**: four tools read this graph, so "what feeds Smith T1" is answered from the same edges.
- **Recon**: an RRC import seeds a disposal well's whole station, meter to battery to well, which is what the saltwater lane then draws (`docs/swd-connections-architecture.md:3-8`).

## Fixture notes
`src/lib/screens/flow-map-fixture.ts` already exists and should stay the one source for this page. To reconcile with the other pages:
- Well rates: `flow-map-fixture.ts:57-60` gives Smith 1 to 4 oil 18.4, 12.1, 9.6, 24.8 bbl/d and `dashboard-fixture.ts:63-66` gives 12, 16, 9, 11. One set must win and the dashboard, mobile and flow map pages all read it. Same for Johnson A (4 wells on the dashboard, 3 on the map), Roy Corbett (4 and 5 on the dashboard, 1 and 2 on the map), Fannie Young (2A and 3 vs 1) and Roach Parrott (7 and 8 vs 1 and 2). Well names and counts per lease must match across fixtures.
- Gas: Smith M1 latest 235 mcf (`flow-map-fixture.ts:198`) must equal the sum of the Smith wells' gas rates, which the fixture gives as 61 + 44 + 38 + 92 = 235. Keep that identity if rates change.
- Tank strapping: every tank is 1.67 bbl/in here (`:214`) while the mobile hero uses 2.7778 bbl/in for Smith T2. Use the tank's own bblPerInch on both.
- Tank fill percent: Smith T1 62, T2 41, W1 55 (`:188-196`). The mobile gauge frame's derived barrels should land inside T2's 41 percent of 500 bbl.
- SWD: Smith SWD 1 at 525 bbl/d of 2,000 permitted (`:69-70`). The Smith wells' water sums to 525 (142 + 98 + 120 + 165), keep that identity.
- Prices for revenue: the fixture multiplies oil by 61.4 and gas by 2.9 (`:51`), the dashboard fixture uses 60.12 and 2.41 (`dashboard-fixture.ts:26`). Pick one.
- Detail modal rows: `flowMapRows` is empty (`:222`). Section 4 needs Tank rows for Smith T1 and T2 at least.
- FIXTURE_TODAY 2026-10-27, shared.

## Open questions
- **Current copy claims "Every line carries its volume."** Not quite. Pills print only on downstream legs with a positive flow, never on the first leg out of a well (`flow-map.tsx:1454-1462`). Say "downstream lines carry their volume" or "every card carries its rate".
- **Current copy says "Add a tank or connect a meter without leaving the map."** Adding a tank is true. Connecting a gas meter is a well-form picker, not a wire, and a water meter is not a card (`page.tsx:74-81`, `graph.ts:397`). Rephrase to "connect a well to a tank or an SWD well".
- **Design doc drift.** `docs/swd-connections-architecture.md:98-99` says connect is inspector-based and drag-to-connect is deferred. The code has port wires, card carries and drop-to-splice (`flow-map.tsx:1106-1125`, `:733-760`). Trust the code.
- **Palette strip is off the page.** `facility-palette.tsx` exists and the canvas still accepts its drag payload, but the strip is not rendered (`flow-map.tsx:73-75`). Do not show a palette in mocks.
- **Hex map references.** `flow-layout.ts:7` says it reads the same graph "the hex map reads". No hex view exists under `src/components/facilities`. Ignore.
- **Company totals bar hides below 88rem** (`flow-map.tsx:1619`). The hero mock must be wide enough or the bar will not render.
- **Water meter readout.** `facilityReadout` reads `waterMeterBblPerDay` (`flow-layout.ts:226-228`) but water meters are never cards (`graph.ts:397`), so that branch is dead on this page. Do not promise a water meter card.
- **One meter feeding two SWD wells** is still not representable (`docs/swd-connections-architecture.md:64-66`). Avoid "any split".
- **The landing's `flowMapRows` is empty** so the detail modal is shimmed out (`flow-map-live.tsx:7-8`). Section 4's screen needs real rows or a static render of the modal.
- **Phone has no facilities map.** `wildcat-phone/app/(app)` has no facilities route. Do not put the map in a phone frame.

---
