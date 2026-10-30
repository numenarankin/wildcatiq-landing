# Copy review

2026-10-30. Covers the eight product pages (`src/lib/product/*.ts`), the home page and the role pages (`src/lib/site.ts`).

**Status (2026-10-30):** the plan below is done for every public page. All copy passes the budget check.

**Verdict at review time:** the copy follows the written rules almost to the letter, and it fails the one that matters most: it is too long. Each product page says about three times what a buyer will read.

## Against the rules in `landing-copy.md`

| Rule | Result |
|---|---|
| Headline of six words or fewer | 64 of 65 pass. The miss is "Tops and pay from the LAS itself." |
| No em dashes, semicolons, exclamation points or banned words | Clean |
| No "it's not X, it's Y" framing | Clean |
| One claim per sentence | 16 of 1,258 sentences run past 25 words. The worst is the home Orion body: 39 words, six claims. |
| Operator's words, numbers over adjectives | Followed |
| Copy matches shipped code | Followed |
| "itself" | 4 on product pages, all filler |

## Length

| | Words | Cards | FAQ | Steps |
|---|---|---|---|---|
| Our product pages | 866 to 1,536 | 20 to 49 | 7 to 11 | 4 to 5 |
| Reference product pages | n/a | about 12 to 20 items | 6 to 14 | 0 to 5 |

Ramp's AP page, the deepest in the reference set, has about 15 items. Our dashboard page has 40 cards. `product-pages-plan.md` targeted 39 to 60 cards on purpose, on the theory that the references "sell depth through repetition." They don't: they repeat one short unit four to six times, with three or four items in each.

## Where the words go

Most cards are release notes, not reasons to buy. From the dashboard page:

- "Presets run 1M, 3M, 6M, 12M, 5Y and All, with a day per point at 1M and a week per point at 3M and 6M."
- "The table's Net rev/day column carried over 30.4 days, counting only leases with an interest on file."
- "Settings > Charts picks the preset the chart opens on."

Each one is true and checked against the code. None of them changes whether an operator signs up. They belong in help docs or the FAQ, if anywhere.

## Against your intent

- **Short beats complete.** The pages read as an inventory of the app, which confuses quantity with quality.
- **Outcome first.** The headlines do this. The cards under them slide back into mechanism.
- **Pithy headlines.** Mostly fine. A few couplets read corny ("Ask the field, from the field.", "No signal, no problem."), and "itself" is overused.

## What adhering would take

1. Cut each product page to four to six sections of three cards, each card one sentence on what the operator gets.
2. Move mechanism (presets, formulas, settings paths) into the FAQ, or out.
3. Cap section and card bodies at one sentence, and the home feature bodies at two (the home Orion body is 84 words now).
4. Drop "itself" from headlines and labels.

## Plan to fix the copy

### Principle: what it does for them, not how it works

The copy keeps explaining the architecture: loaders, server actions, mirrors, model calls, allocation tables, row security. An operator buys what changes in their day: hours they stop spending, money they find, a problem caught before it costs them, a filing that isn't rejected. Every line answers "what does this do for me?" How it works goes in the FAQ only when a buyer would ask, and is cut otherwise.

Order of preference: **outcome** ("Catch a dying well a month sooner.") over **feature** ("Decline per well.") over **mechanism** ("Every well's own curve summed forward."). Mechanism never appears in a headline, section body or card.

### Budgets

Every page is cut to these limits. `scripts/check-copy.ts` fails any line that goes over (run it with `npx tsx --tsconfig tsconfig.json scripts/check-copy.ts`). The 450-word page limit counts everything above the FAQ. The FAQ and the "Works with" links have their own limits. The flow map page is local-only and exempt.

| Piece | Limit |
|---|---|
| Product page | 450 words in total, 4 to 6 sections |
| Hero subhead | One sentence, 20 words |
| How it works | 4 steps at most, 10 words each |
| Section body | One sentence, 20 words |
| Cards | 3 per section. Label 5 words, body one sentence of 15 words |
| FAQ | 6 questions, answers of two sentences at most |
| Home feature body | Two sentences, 35 words |
| Role page section | One or two sentences, 25 words |

A card has to say what the operator gets. Mechanism (formulas, presets, settings paths, column names) moves to the FAQ or is cut.

### Sections per product page

Merged sections keep the stronger of their two screens. Cut sections lose their screen.

| Page | Now | Keep or merge | Cut |
|---|---|---|---|
| Dashboard | 8 | Morning brief · The four cards + One basis · Company chart + Decline · Lease table + Who carries the company | Prices and permissions (to FAQ) |
| Orion | 11 | Reads your operation + Knows the page · Reads the state's record · Works the problem + Reads your logs · Asks before it writes + Under your control · Acts across the app | Remembers, Talks and listens, Attach and print (one FAQ each) |
| Mobile | 5 | All five, trimmed to 3 cards | None |
| Recon | 9 | Layers + Filters · Dossiers + Browse · Permits + Alerts · Market | Land and midstream, Orion (to FAQ) |
| Documents | 8 | Upload where it lives + Approval · Field photos · Statements · Well paperwork + History · Files + Well logs | None |
| Reports | 8 | The library · Company Digest · Production + Tank + Wells, RRC and the pumper · Set once + Built overnight | Downloads and Narrate (to FAQ) |
| Filings | 6 | Derivation · Validation + Review · The file | Docket, One write path (to FAQ) |
| Flow map | 8 | The picture + The numbers · Reading the wiring + Click a facility · Build on the map + Stream rules · Disposal | Permissions (to FAQ) |

### Rest of the site

- **Home:** cut each feature body to the budget. Orion goes from 84 words to two sentences.
- **Role pages:** cut each section body to the budget and keep the heroes as they are.
- **Headlines:** drop "itself", and replace the corniest couplets ("Ask the field, from the field.", "No signal, no problem.") only where a plainer outcome reads better.
- **Plan doc:** mark `product-pages-plan.md`'s card counts as superseded, so nobody rebuilds to 40 cards.

### Order

1. Write the budget check script and run it on today's copy as a baseline.
2. Rewrite Dashboard first as the template, and get your sign-off on it.
3. Rewrite the other seven product pages to that template, then home, then the role pages.
4. Re-run the check, grep for em dashes and "itself", and confirm every claim kept still matches shipped code.
5. Remove the cut sections' screen entries, then lint and typecheck.

## Architecture talk to remove

Found by scanning every headline, body, card and FAQ. These are the lines that explain how the product works instead of what it does for the operator. FAQ answers that state a limit a buyer needs (permissions, models, file sizes) are left off this list.

**Dashboard**
- "Every number adds up. The cards, the chart, the pie and the table read one map of rates, so no two of them can disagree."
- "Cards are the table, added up": columns summed, "Net rev/day column times 30.4".
- "Card, curve, rows and Orion agree … one derivation at three grains."
- "The lease picker is the table's rows."
- "The model is never called" (brief card).
- "Polls the cached Yahoo Finance feed once a minute."
- "The data is read as that member through row security."
- Step: "the allocation engine turns each battery's day into per-well barrels."

**Orion**
- "Orion reads the same rows your pages read, so its answer and your screen agree."
- "Analytical turns run in code." / "run through one dispatcher, not prose."
- "A faster model gathers the context, then the analyst reasons once."
- "Pages publish what is on screen." / "Recon publishes the wells in view."
- "Enforced in code. A write tool missing its gate is replaced by a refusal."
- "Through the same server action with the same fields."
- "Permissions are a table of areas and actions, checked on the way into every tool."

**Mobile**
- "Computed on the device."
- "Screens read a copy of the data kept on the phone, and every write queues in an outbox."
- "Live in SQLite on the phone." / "all go through the outbox."
- "The network never gates the page."
- "Filled through the same row-level security as the web."

**Recon**
- "Orion reads the same mirror through 28 RRC tools."
- "The mirror's nightly arrivals." / "Alerts read from a cursor, so a late mirror night is reported late."
- "The monthly table … is the chart's series, row for row."
- "A dossier's written summary is a button, never a model call on every click."
- "A mirror of the RRC's own files on a separate read-only database."
- "Recon carries no permission key."

**Documents**
- Steps: "A validator audits the rows against the document." / "Rows that match records already on file are dropped."
- "So code parses them instead of a model."
- "Read by shape, with no model call." / "One call writes the column mapping and code applies it to each row."
- "Cost tracks irregularity, not row count."
- "Approving re-checks that you may write that record type, then writes through the page's own action."
- "Bytes go straight from the browser to storage."
- "The file on screen is published to Orion."
- "Read to text by Reducto first. Search OCR is Mistral."

**Reports**
- Step: "Each report is one loader and one column set, shared by the screen and the file."
- "Every report reads the same loaders as its export and the production pages."
- "The schedule grid is built from that list."
- "The same per-well series rolled up."
- "From the series every production page shows."
- "Each send claims its period before mailing, so a second dispatcher stops there."

**Filings**
- "Generate builds the cycle fresh from the ledger. Nothing is stored up front."
- "Gas balances by construction. Formation production is the derived daily gas."
- "Download is the generator."
- "The builder reads the tank readings, tickets and meter series."
- "View with view_reports. Generate with manage_regulatory."

**Flow map** (the worst page)
- Hero: "drawn from the same wiring the app allocates on."
- "Cards print rates from the same per-well series … rounded once and added once."
- "The map is not a second source of truth. It is the allocation tables and the drawn connections, read as a graph."
- "Edges are the allocation rows." / "merge into the derived graph."
- "Writes the same rows the facility pages write, in one round trip."
- "The map knows which table allocates each stream and writes there."
- "One resolver, every surface."
- "Every edit is the facility page's own server action."
- "view_facilities to look. The page and both of its loaders require it."
- "Row-level security does the scoping … under the connection table's policies."
- FAQ: "Every edge is an allocation row or a drawn connection row." / "Membership in the tank's battery, not a connection row."
