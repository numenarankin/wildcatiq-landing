---
source: https://giga.ai/platform
fetched: 2026-10-26
---

# Giga - Platform overview page reference

## Structure
- A long "how the product works" page organized as three numbered chapters (01 Build, 02 Observe, 03 Improve) that the footer links to as anchors (#build, #observe, #improve). Each chapter: a two-line heading, a one-sentence intro, a one-sentence "Scout does X with you" line, then 3 to 5 sub-features. Then a version-history chart, lead-capture CTA, compliance badges.
- Depth: every sub-feature is an eyebrow label (Policies, Tool access, Shared resources, Conversations, Evaluation details, Quality review, Objectives, Opportunities, Track every change, Experiments, Version history), an H3 headline written as a sentence, and one or two sentences of body. 11 sub-features in all.
- Copy to screenshot: no images at all. Every visual is an HTML/CSS UI mockup with realistic sample data (a KPI card, a policy editor with a diff, an API list, a knowledge base table, a conversation transcript with tool calls, an experiment with control vs variant). Mockup text is a big share of the page's words.
- Tabs/accordions: chapter stepper (01/02/03), KPI time-range pills (1W 4W 3M 12M YTD), Plan/Build toggle, Overview/Interactions/Metadata tabs, Scenario/Draft/Publish controls. No FAQ, quotes or stats.
- Handoff: Scout is named in every chapter and is the hero CTA ("Work with Scout"); Agent Canvas, CLI and Browser Agent are footer-only. One continuous example (a service-appointment booking agent, booking rate 64% to 75% target) runs through all three chapters.

## Title and meta
- Title: Giga Platform: Build, Observe, and Improve AI Support Agents | Giga
- Meta description: Build the agent. Understand the outcome. Improve what happens next. Configure the work your agents do, follow the conversations they handle, and work with Scout to find and test improvements.

## Hero
- Eyebrow: The Giga platform
- Headline: Build the agent. Understand the outcome. Improve what happens next.
- Subhead: Configure the work your agents do. Follow the conversations they handle. Work with Scout to find and test improvements.
- CTA: Work with Scout
- Mockup: console with Dashboard / Tickets / Review / KPIs / Metrics / Alerts / Billing / Agents (Pickup & Drop-off, In-Transit, End-to-End, Post-Delivery) / Configure (Knowledge, Policies, Intents). KPI card: Resolution Rate, Trending to goal, Current 61%, Potential 84% (+23 pts), Auto-improve this KPI with Scout, Daily. Top opportunities: 1 Offer delivery upgrades (Callers checking on an order can upgrade to express delivery in the same call.) 2 Share delivery status up front (The agent can open with the order's tracking status, before callers ask.)
- Line under stepper: Scout works alongside your team. Build an agent, investigate behavior, propose a change, or run a test.

## Section: 01 Build. Describe the agent. Make it yours.
- Intro: Policies, knowledge, and connected tools define what your agent can do.
- Scout line: Scout builds it with you. Ask it to draft or update instructions and connect the tools a workflow needs.
- Policies. Instructions you can read. Behavior you can change. Define scenarios, brand voice, and rules. Review the draft before publishing a new agent version. (Mockup: Scenario "Service Appointment": Use when a customer wants to book or move an appointment. 1. Check availability with find_available_appointments. If a time is open: offer an available appointment time. If nothing fits: follow the scenario "Waitlist". 2. If a person is needed, transfer with transfer_conversation. "Synced across 2 agents. Edits apply to both.")
- Tool access. Give the agent the tools to finish the job. Attach APIs to an agent and control how they can be called. An available integration is not automatically an available agent tool. (Mockup: find_available_appointments GET, LLM Available; create_booking POST, Via Codeblock; transfer_conversation POST, Default Action; add_service "In your team, not attached".)
- Shared resources. Connect your systems. Reuse your knowledge. Give agents access to selected knowledge, shared policies, APIs, and code. Keep reusable resources separate from each agent's configuration. (Mockup: Knowledge base "Service policies" attached to Service agent and Billing agent; rows Rescheduling an appointment, Add-on services, Opening hours by location, What to bring to a visit; Viewing 4 of 214 documents.)

## Section: 02 Observe. Every outcome has a story.
- Intro: Move from performance measures to the conversations and actions behind them.
- Scout line: Scout finds the story behind a number. Ask which conversations moved a metric, and why the agent acted as it did.
- Conversations. Go from a metric to the conversation. Open the cases behind a number. Follow their interactions, customer messages, agent responses, and actions. (Mockup: Booking rate 64%, Booked 755; transcript #4821 where the customer moves an appointment to Friday 2:30, with tool calls find_available_appointments and create_booking and a "What happened" summary ending "Resolved. Moved to Friday at 2:30.")
- Evaluation details. See the evidence behind the assessment. Inspect resolution, sentiment, and other extracted fields alongside the conversation. Evaluation criteria can be configured for your agent. (Mockup: Hallucination Low, Sentiment Positive, Intent Reschedule appointment, booking_confirmed true, Channel Chat, Agent version Live v12.)
- Quality review. Find patterns across your conversations. Review quality measures over time, spot what's working, and route cases into human review. (Mockup: filter "Times offered is 3" and "Resolution is Resolved"; 212 tickets since Sep 12.)

## Section: 03 Improve. Make the next version better.
- Intro: Follow one change from conversation evidence to a measured comparison.
- Scout line: Scout proposes the next version. Give it a KPI. It grounds each change in conversation evidence and tests it before you publish.
- Objectives. Define what success means. Specify the outcome you want to measure and which conversations qualify. Track objectives and guardrails for your agents. (Mockup: Appointment booking rate, Current 64%, Target 75%, 11 pts to go; Counts as success: A booking is confirmed; Eligible conversations: Customers requesting an appointment, 1,180 in 7 days; Guardrails: Transfer rate <= 15% (11%), Median latency <= 1.5 s (1.2 s).)
- Opportunities. Turn a recurring pattern into a proposed change. Review improvement items and trace them back to the conversations that prompted them. (Mockup kanban: Triage "Offer a waitlist spot +2 pts"; Ready to experiment "Offer a choice of open times, 212 tickets, +6 pts, Customers offered three times book more often."; Collecting data.)
- Track every change. See what Scout would change. Compare the draft with the live version, then approve it before publishing. (Mockup diff Live v12 to Draft v13: minus "If a time is open: offer an available appointment time." plus "If times are open: offer up to three, so the customer can pick." "Scout's change, accepted. Accepting doesn't publish it.")
- Experiments. Test the change. Measure the outcome. Test each new version on a slice of traffic to verify the improvements. (Mockup: Control 50% Live v12 64.1%; Variant 50% Draft v13 70.8%; +6.7 pts, guardrails held; Publish Draft v13.)
- Version history. Learn from each new version. See how your agents improve. (Mockup: Target 75%, Live 64.1%, Since +12.8 pts, Experiments 3, 2 adopted, 1 ready.)

## Closing CTA
- Eyebrow: AI agents for customer support
- Heading: See what Giga would resolve at your company.
- Body: AI agents for email, chat, and voice. Enter your work email to see what they'd resolve.
- CTA: Show me

## Compliance badges
- SOC 2 Type II (AICPA): Independently audited security, availability, and confidentiality controls for SaaS systems.
- ISO 42001: AI management system standard ensuring responsible AI development and governance.
- ISO 27001: Global standard for information security management and data protection.
- PCI DSS 4.0.1: Payment card industry standard for securely handling cardholder data.
- +1 (links to Trust Center)

## Social proof
- None (no logos, quotes or stats; all numbers are sample data inside mockups)

## Cross-links to other product pages
- Footer Platform: Platform overview, Build agents (#build), Observe outcomes (#observe), Improve with Scout (#improve), Agent Canvas, Scout, CLI, Browser Agent
- Footer Solutions: Omnichannel, Voice Experience, Insights
- In-body: Scout (hero CTA and every chapter)
