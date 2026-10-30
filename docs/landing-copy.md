# Landing page outline and copy

Written 2026-10-26. Companion to `landing-redesign-plan.md`. Section order follows the plan. Bracketed items are placeholders for proof we do not have yet.

## Prose rules

Taken from the reference pages that sell best (Rillet, Beside, Antimetal, Puzzle):

- Headline is an outcome in six words or fewer. The feature name goes in the eyebrow.
- Subhead is one sentence that says who it is for and what changes.
- Lead with the verb. "Drop a run ticket" beats "Run tickets can be dropped."
- One claim per sentence. One idea per block.
- Name the AI's limits as a feature. "Nothing is saved until you approve it" appears on every page that mentions Orion writing.
- Use the operator's words: lease, gauge, run ticket, pumper, P-5, Form PR, SWD. Never translate them.
- Numbers over adjectives. "Twenty-one reports" not "a full suite of reports."
- Illustrate with realistic field data in the screens, not lorem ipsum: Smith #4, 18 inches of oil, 150 MCF.
- No exclamation points. No "powerful," "seamless," "robust," "leverage."
- No em dashes. No semicolons.

---

# Home

## Topbar

Product | Solutions | Pricing | Sign in | Get started

## 1. Hero

Eyebrow: WildcatIQ

Headline: AI for the independent oil & gas operator

Subhead: WildcatIQ runs production, field operations, documents and regulatory work for independent oil and gas operators, with an assistant that already knows the business.

CTAs: Get started | Book a demo

Screen: Dashboard with the morning brief, oil, gas and net revenue cards, lease table.

## 2. Proof strip

[Operator logos] or [N wells under management across N Texas counties]

## 3. Dashboard

Eyebrow: Dashboard

Headline: Your whole operation, every morning.

Body: Orion writes a brief of what changed overnight. Oil, gas and net revenue per day with the one-day and thirty-day change. Fleet decline. Every lease trending, with its wells underneath. Ask Orion about whatever chart you have open.

Screen: Morning brief and KPI cards.

## 4. Orion

Eyebrow: Orion

Headline: An analyst, not a chatbot.

Body: Ask it what a neighbor's new permit means for your well and it pulls the permit, the operator, their offset wells and your own production, fits the declines, draws the comparison and tells you what to do about it. It reasons over the public record and your data together: allocation, decline, economics at strip, RRC rules, SWD and UIC. It reads the page you are on, remembers your wells and the way you like things done, and anything it changes waits for your OK.

Sub-blocks:
- Ask the hard question. "What does that new permit mean for A-3?" It pulls the permit, the operator, the offsets and your production, fits the curves and answers with the chart.
- Then put it to work. A task, a reading, a lease term, a note to the crew.
- It asks first. Every write arrives as an approval card. Nothing is saved until you accept it.

Screen: Chat with an approval card showing a proposed gauge entry.

## 5. Mobile

Eyebrow: Mobile app

Headline: Pumpers log it once. Nobody keys it twice.

Body: Gauge, meter and SWD readings go in from the lease in seconds, opened already filled from yesterday so you only change what moved. Scan a run ticket and Orion fills the form. Dictate notes. Work offline and sync when the signal returns. Charts, logs, comments and team messages are on the phone too.

Screen: Phone showing the gauge entry form and a scanned ticket.

## 6. Recon

Eyebrow: Recon

Headline: The whole state on one map.

Body: Nearly a million Texas wellbores, with their leases, permits, orphan wells and operators from the RRC, searchable and clustered. Market rollups by district and county. Pick your counties and get an email when a permit is filed or approved or a new well appears.

Screen: Recon map with a permit panel open.

## 7. Log analysis

Replaced Documents on the home page (2026-10-29). Documents keeps its product page. The link goes to the Orion page, which carries the log screen.

Eyebrow: Log analysis

Headline: Tops and pay from the LAS itself.

Body: Open a LAS in a project and it draws as a triple combo: gamma ray, resistivity and density against depth. Ask Orion about it and it reads every row of the file in one call, picks the tops, works porosity and net pay on cutoffs it states, and names the zone behind pipe worth shooting. Every depth it quotes is in the file.

Screen: The Smith 4 recompletion project. Files tab, the LAS opened in the log viewer and zoomed to the zone behind pipe, then the Orion tab: the question with the log attached, read_las_full, the tops and zone tables, the porosity-feet chart and the recompletion call.

## 8. Reports

Eyebrow: Reports

Headline: Reports that write themselves and send themselves.

Body: Twenty-one reports, from the daily digest to gross versus net and RRC reconciliation. PDF, Excel or CSV. Schedule the digests and production reports once and they arrive by email. Orion will read any of them aloud.

Screen: Report hub with the delivery schedule open.

## 9. Filings

Eyebrow: Regulatory

Headline: Form PR from the data you already have.

Body: The filing is generated from your gauges, run tickets and meter readings, reviewed on screen and downloaded in the RRC's EDI format. The docket tracks due dates and status. More forms are coming.

Screen: Filings docket with a generated PR in review.

## 10. Flow map

Eyebrow: Facilities

Headline: See how the oil actually moves.

Body: Wells to tanks to meters to SWD, drawn per lease and animated by commodity. Filter to oil, gas or water. Every line carries its volume. Click a facility for its connections and allocation. Add a tank or connect a meter without leaving the map.

Screen: Flow map with one lease expanded.

## 11. Getting started

Eyebrow: Day one

Headline: Populated before you enter a single reading.

Body: Enter your P-5 number and WildcatIQ imports your leases, wells and facilities from the RRC and shows your production history from the state record. Drop in your old statements and gauge sheets and Orion backfills the rest.

Steps:
1. Match your operator number.
2. Review the import.
3. Drop in your paperwork.

## 12. One system

Headline: Other tools give you a dashboard. WildcatIQ does the work.

Comparison table, WildcatIQ vs the usual pile:

| | WildcatIQ | Spreadsheets, texts and the RRC portal |
|---|---|---|
| Field readings | Entered once on the phone | Texted, then retyped |
| Paperwork | Read by Orion, approved by you | Keyed by hand |
| Reports | Generated and emailed on schedule | Built in Excel every month |
| Form PR | Generated from your field data | Typed into the RRC site |
| The state's data | On your map, with alerts | Another browser tab |
| The bill | One | Several |

## 13. Testimonial

[Quote from an operator with name, company and county]

[Stat: hours per month back, or days cut from close]

## 14. Pricing summary

Headline: Priced by the well.

Body: Four bands from 1 to 100+ wells. Every plan includes the whole platform and a monthly allotment of Orion credits.

CTA: See pricing

## 15. Security and ownership

Headline: Your data is yours.

Bullets:
- Never used to train a model.
- Every organization's rows are isolated at the database level.
- Permissions are set per person, down to the tab.
- Orion cannot write anything without your approval.

## 16. FAQ

- Do I have to change how my pumpers work? No. They log the same readings they log today, on a phone instead of a sheet.
- What if Orion gets something wrong? It cannot save anything on its own. Every change is a card you accept, edit or reject.
- How long does the import take? Most operators see their leases and history the same day they enter their P-5 number.
- Who can see my data? Your team, with the permissions you set. Nobody else.
- Does it work without signal? Readings and notes are kept on the phone and sync when it comes back.
- What does it cost? Four bands by well count. See pricing.

## 17. Closing CTA

Headline: Ready to run the company from one place?

CTAs: Get started | Book a demo

---

# Product pages

Shared template: hero (eyebrow, headline, subhead, CTA, screen), three mechanics blocks each with a screen, a related features row, closing CTA.

## Dashboard

Headline: The state of the company, every morning.

Subhead: One screen with what changed, what is producing and what it is worth.

Blocks:
1. The morning brief. Orion writes what moved overnight and why it matters.
2. Numbers that reconcile. Oil, gas and net revenue roll up from the same rows your reports use.
3. Drill from company to well. Lease table to wells to the chart, in two clicks.

## Orion

Headline: Not a chatbot. An operator's assistant.

Subhead: It analyzes. Your wells against the public record, with the math shown, and nothing changed without your say.

Blocks:
1. Knows the business. Allocation, decline, RRC forms and rules, SWD and UIC, run tickets.
2. Knows your business. Reads the page you are on. Remembers your wells, your numbers and your preferences.
3. Asks before it writes. Every proposed change is an approval card. Accept, edit or reject.
4. Talks and listens. Voice in the truck, text at the desk.

## Mobile app

Headline: Built for the lease road.

Subhead: Everything a pumper needs to record and everything an owner wants to see, on the phone.

Blocks:
1. Readings in seconds. Gauge, meter and SWD entry, prefilled from yesterday.
2. Scan instead of type. Run tickets read by Orion, straight into the form.
3. Works without signal. Notes and readings sync when coverage returns.
4. The rest of the app. Charts, logs, comments, messages.

## Recon

Headline: Nearly a million wells, on your map.

Subhead: The RRC's records, made usable.

Blocks:
1. Wells, leases, permits, orphans, operators. Clustered, searchable, cross-linked.
2. Market by district and county. Oil, gas, condensate and casinghead rollups.
3. Alerts. Pick your counties and get email when a permit is filed or approved or a new well appears.

## Documents

Headline: From the filing cabinet to the ledger.

Subhead: Any document an operator touches becomes structured records you approve.

Blocks:
1. Drop anything. Run tickets, statements, invoices, gauge sheets, old production reports.
2. Orion extracts, you approve. Rows, duplicate flags and an approval grid.
3. Contracts too. Dates, obligations and terms, checked against your other files.

## Reports

Headline: Twenty-one reports. Zero spreadsheets.

Subhead: Generated from your data and delivered on your schedule.

Blocks:
1. The library. Daily, weekly and monthly digests, production variance and exceptions, gauge history, tickets, well tests, gross versus net, RRC reconciliation, pumper report.
2. Any format. PDF, Excel, CSV, or read aloud.
3. Set once, sent forever. Email schedules for the digests and production reports.

## Filings

Headline: The RRC scramble, retired.

Subhead: Form PR generated from your field data, reviewed and downloaded.

Blocks:
1. Generate. The month's PR from your gauges, run tickets and gas meters.
2. Review. Every line on screen before anything leaves.
3. Track. Due dates and status in one docket.

## Flow map

Headline: The field, drawn as it runs.

Subhead: Wells to tanks to meters to SWD, per lease, live.

Blocks:
1. See the flow. Animated lines by commodity.
2. Ask the map. Click any line or facility for what passes through it.
3. Build on it. Add and connect facilities from the map.

---

# Solutions

## By role

### Owner-operator

Headline: Run the company from your phone.

Body: The morning brief, every lease trending, Recon for what the neighbors are doing, and Form PR handled. Ask Orion anything about your own wells.

### Office manager

Headline: Stop retyping the field.

Body: Pumper readings arrive already entered. Statements, invoices and tickets become ledger rows you approve. Reports go out on schedule. The monthly PR comes from the field data.

### Pumper

Headline: Log it and get back in the truck.

Body: Gauge and meter readings in seconds, prefilled from yesterday so you only change what moved, scan the ticket, dictate the note. Works without signal.

## By size

### 1 to 24 wells

Headline: Everything in one place from the first well.

Body: Import your leases and wells from the RRC, log readings on the phone and let Orion keep the books straight.

### 25 to 99 wells

Headline: Growing without growing the office.

Body: Several pumpers, several purchasers, one ledger. Reports and filings run on schedule.

### 100+ wells

Headline: Field operations at scale.

Body: Per-well pricing, permissions down to the tab, and an assistant that knows every lease.

---

# Pricing

Existing page. Add an FAQ on Orion credits: what uses them, what happens when they run out, how to buy more.

# Supporting pages

- Security: the four bullets from the home page expanded, with the permission model.
- Privacy: existing.
- Book a demo: existing CTA target.
