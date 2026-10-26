---
source: https://giga.ai/cli
fetched: 2026-10-26
---

# Giga - CLI product page reference

## Structure
- The shortest Giga product page: hero with install command, three example commands and a 1:09 film; one "New in Giga" feature block (Event Telemetry) with a terminal mockup; a "Get started" block with two CTAs; compliance badges. Three content sections.
- Depth: one sentence of body per block; the terminal output does the explaining (four timestamped events ending in a failed call transfer).
- Copy to screenshot: one video, one terminal mockup. Copy is minimal and developer-voiced.
- Tabs/accordions/FAQ/quotes/stats: none.
- Handoff: Scout appears in the hero sentence ("ask Scout why") and example command; the page splits its audience in the Get started block (customers sign in, prospects see a demo). Links out to a launch post and an announcement post.

## Title and meta
- Title: Giga CLI: Ship and Operate AI Support Agents from the Terminal | Giga
- Meta description: Find a failed ticket, ask Scout why, ship the fix and check the impact, all from your terminal. MIT-licensed, on PyPI: pip install giga-sdk.

## Hero
- Eyebrow: Giga CLI
- Headline: Your Giga agents, now live in the terminal.
- Subhead: Find a failed ticket, ask Scout why, ship the fix and check the impact, all from the command line.
- Install: $ pip install giga-sdk
- CTA: Read the launch post
- Try: giga --help; giga tickets show TICKET-1842; giga scout ask "Why did TICKET-1842 fail?"
- Video: Play the film (1:09), Introducing Giga CLI

## Section: New in Giga. Event Telemetry. See exactly where a customer request went wrong.
- Body: Available now: your Giga agents' calls, actions, code runs and API requests, as events your team pulls with giga logs into its own systems.
- CTA: Read the announcement
- Terminal mockup: giga logs list --conversation CA7d13e2. Window: 2026-10-20T17:15:44Z to 2026-10-20T17:26:52Z, 4 event(s). conversation.ended (info): Conversation ended after 68 s: the caller hung up or left (reason=user_ended duration_ms=68000). agent.action (info): Agent action transfer_conversation returned in 31204 ms; a human has not picked up yet (action=transfer_conversation state=pending outcome=unknown). call.transfer (error): Call transfer failed: the destination did not take the transfer (stage=refer outcome=failure reason=refer_failed transfer_reason=sales). conversation.initialized (info): Conversation started (phone).

## Section: Get started. Run the loop on your own agents.
- Body: The CLI works on agents built on Giga. If you're a customer, sign in to the console and pip install giga-sdk. If you're not yet, we'll show you the loop on your own tickets.
- CTAs: See a demo, Sign in

## Compliance badges
- SOC 2 Type II (AICPA), ISO 42001, ISO 27001, PCI DSS 4.0.1, +1

## Social proof
- None

## Cross-links to other product pages
- In-body: Scout (hero and command), /news/event-telemetry, launch post, console.giga.ai
- Footer: Platform overview, Build agents, Observe outcomes, Improve with Scout, Agent Canvas, Scout, CLI, Browser Agent, Omnichannel, Voice Experience, Insights
