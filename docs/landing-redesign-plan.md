# Landing page redesign plan

Written 2026-10-26. Replaces the current six-screen feature tour with a value-led page.

## Problem

The current site reads as a feature list (chat, well logs, production, documents, accounting, insights). It covers about six of the app's twenty-five features, leads with nothing the buyer cares about, and omits the mobile app, Recon, reports, filings and the flow map entirely. The accounting screen promotes a surface that is parked.

## Audience

Owner-operator or office manager, depending on company size. Each section leads with the buyer outcome (what they now know or stop doing) and backs it with the mechanics. The owner reads the headline, the manager reads the detail. Technical detail is fine. It reads as real.

## Section order

1. Dashboard
2. Orion
3. Mobile app
4. Recon
5. Documents
6. Reports
7. Regulatory filings
8. Flow map
9. Getting started
10. Pricing
11. Book a demo

## Sections

### 1. Dashboard (hero)

Outcome: the state of the whole company every morning without asking anyone.

Proof: Orion's morning brief. Oil, gas and net revenue per day with 1-day and 30-day change. Fleet decline. Every lease trending with wells underneath. Production by well.

### 2. Orion

Outcome: an assistant that already knows the business, not a generic chatbot.

Proof: domain knowledge base (allocation, decline curves, RRC forms and rules, SWD and UIC, division orders, run-ticket math with API and BS&W). Reads whatever page the user is on. Remembers the operator's wells, numbers and preferences and improves with use. Voice in and out. Every write goes through an approval card, nothing is saved until the user accepts it.

### 3. Mobile app

Outcome: pumpers log it once in the field and the office never re-keys it.

Proof: fullscreen gauge, meter and SWD entry with same-as-yesterday. Run-ticket and gauge-sheet scanning. Voice dictation for notes. Offline notes that sync later. Per-well charts and LAS viewer on the phone. Comments and team messages. Push alerts.

### 4. Recon

Outcome: see the whole state, not just your own leases.

Proof: every Texas wellbore, lease, permit, orphan well and operator on one map. District and county market rollups. Saved areas that email when a permit or operator change lands. RRC records search with cross-linked dossiers.

### 5. Documents

Outcome: paperwork becomes records, and the history is in the system in the first week.

Proof: drop a run ticket, purchaser statement, vendor invoice, gauge sheet or old production report. Orion extracts the rows, flags duplicates and presents an approval card. Leases and contracts yield key dates and obligations cross-checked against the rest of the files. OCR and search across everything stored.

### 6. Reports

Outcome: the numbers arrive without anyone building them.

Proof: twenty-one reports (daily, weekly and monthly digests, gauge history, tickets, well tests, gross vs net, RRC reconciliation, pumper report). PDF, Excel and CSV. Orion reads them aloud. Emailed on a schedule set once.

### 7. Regulatory filings

Outcome: the monthly RRC scramble disappears.

Proof: Form PR generated from the operator's own ledger, reviewed on screen, downloaded in the RRC-accepted format. Docket with due dates and status. More forms to follow.

### 8. Flow map

Outcome: understand how the oil actually moves through the field.

Proof: wells to tanks to meters to SWD, per lease, animated by commodity. Filter by oil, gas or water. Click any line or facility to see what flows through it. Create and connect facilities from the map.

### 9. Getting started

Outcome: populated before the first reading is entered.

Proof: onboarding matches the P-5 operator number and imports leases, wells and production history from the RRC. Document ingest backfills the operator's own paperwork.

### 10. Pricing

Keep the four well-count tiers. Rewrite the included list without finance language. The platform summary line ("Exploration, Production, Operations & Finance") becomes production, field, regulatory and intelligence.

### 11. Book a demo

Keep as is.

## Cuts

- Accounting demo screen and "Understand your financial performance."
- Finance framing in page metadata and pricing copy.
- Well-log demo as a standalone section. Fold the LAS viewer into mobile and documents.
- "Insights across your entire operation" as a section. It becomes the Orion section.

## Fixes regardless of redesign

- Done 2026-10-26: the old demo screens (stale sidebar, "Salt Water" label) were replaced by `src/components/screens/`, whose sidebar mirrors the app's `app-shared.tsx`.
- `WEBAPP_FEATURES.md` and `VALUE_DRIVERS.md` predate leases, disposal, revenue, filings and Recon and still cite Opus 4.8 and `/wells`. Regenerate from the current app before writing copy.

## Color scheme

Black on white. The current dark theme (dark background, white text, particle field) is replaced with a white background, black text, black CTAs and hairline borders. Product screens render in the app's light theme. Copy and outline are in `landing-copy.md`.

## Site structure

Topbar: Product, Solutions, Pricing, plus Sign in (ghost) and Get started (filled). Replaces the current Exploration / Production / Finance / Operations anchor links.

- Product: menu of feature pages, one line each: Dashboard, Orion, Mobile app, Recon, Documents, Reports, Filings, Flow map. Each links to its own page or to its home-page section until the pages exist.
- Solutions: the same product sorted by who is buying. By role (owner-operator, office manager, pumper) and by size (small independent, growing operator, established field operation), matching the pricing tiers.
- Pricing: existing /pricing page.

## Reference landing pages

- https://puzzle.io/
- https://www.brex.com/
- https://mercury.com/
- https://ramp.com/
- https://www.rho.co/
- https://www.checkhq.com/
- https://www.rillet.com/
- https://save.design/
- https://www.beside.com/
- https://antimetal.com/
- https://linear.app/
- https://twenty.com/
- https://nor.ma/
- https://www.v7labs.com/
- https://vercel.com/
- https://railway.com/
- https://www.harvey.ai/
- https://www.serus.ai/
- https://x.ai/
- https://giga.ai/

## Status

Built 2026-10-26: home, eight product pages, six solutions pages, pricing, security, header menus, footer. Proof strip and testimonial are left out until there is real proof to show.

## Open

- Whether the approval card appears in its own screen or inside Orion and Documents. It answers "what if the AI is wrong" for both audiences.
- Which eight or nine demo screens to build. Each section wants one.
