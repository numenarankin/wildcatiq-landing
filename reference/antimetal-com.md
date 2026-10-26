---
source: https://antimetal.com/
fetched: 2026-10-26
---

## Structure
- Dev-tool page whose hero is a four-word headline ("Production that runs itself."), a one-sentence subhead, a single CTA ("Book a Demo"), a compliance line, and a large interactive product mock (issues list, issue detail, causal graph, chat) that doubles as the explainer.
- About 9 sections after the hero: logo strip, four-step "how it works" (World model, Signal triage, Priorities, Fix & verify), mid-page CTA + quote + stat, Patrol agents (7 named agents, tabbed), "Understand how your environment works" (3 cards), "Your system, at your command" (Slack demo, 2 cards), quote + stat, closing CTA, research log carousel.
- Framing is product-mechanism first: nearly all copy is a numbered walkthrough of what the system does, illustrated with realistic fake incident data (ISS-2 checkout 5xx, IMP-1 staging overprovisioned). Value stats (45% fewer recurring incidents, 82% less investigation time) are attached to customer quotes rather than a stats row.
- Minimal nav (Blog, Careers, Sign In, Book a Demo), no pricing, footer is three short columns.

## Meta
- Title: Antimetal
- Description: The autonomous system for production.

## Header nav
- Blog | Careers | Sign In | Book a Demo

## Hero
- Status line: All Systems Normal - Built in NYC
- Eyebrow: The Autonomous System for Production - SOC 2, GDPR, and HIPAA compliant.
- Headline: Production that runs itself.
- Subhead: The autonomous system for production that diagnoses, fixes, and prevents issues across your environment.
- CTA: Book a Demo
- Product mock (illustrative copy): chat prompt "Why is checkout slower?"; counters 7 Patrols running, 5 Errors found, $1,200 Savings, 24 Events; "Today's issues 3" (ISS-2 Checkout failing 0.9% of requests since deploy v3.2.1; ISS-3 Three web apps exposed to a Next.js middleware bypass; ISS-6 SharePoint site picker fails for orgs without Graph credentials); "Today's improvements 2" (IMP-16 Checkout autoscaler near its replica max; IMP-1 Staging cluster overprovisioned by 3.2x); issue detail tabs Overview, Related events, Causal graph, Findings, Changes; event sources Service health check, Datadog, Kubernetes, GitHub; causal chain Trigger -> Change -> Effect -> Symptom -> Result.

## Logo strip: Trusted by engineering teams at
- Logos (from aria-labels): Google, Pocket, Lindy, Logitech, Infinite Machine, Hanover Park

## Section: Antimetal automates production engineering so your team can focus on building.
- 01 World model - Models your environment: Antimetal builds a World Model from your code, infrastructure, and observability data, refining it with every change, investigation, and team decision. (Mock: Reading your code... Building to now - Cloning 42 repositories from acme; legend Issue / Improvement / Healthy)
- 02 Signal triage - Triages incoming signals: Antimetal ingests tickets, alerts, deployments, and other signals, grouping related events and filtering out noise. (Mock: event feed with columns Time, Source, Event, Linked finding, Severity; "6 related events - 6 sources - Turned into an Issue ISS-2")
- 03 Priorities - Shows what needs attention: Antimetal distills those signals into a prioritized list of Issues to address and Improvements to make your system healthier. (Mock: Today's issues 9 - ISS-11 Checkout fails during deploys when database connections run out; ISS-2; ISS-3. Today's improvements 10 - IMP-16; IMP-4 No p95 latency monitor on search-api)
- 04 Fix & verify - Fixes and verifies: Antimetal generates code and configuration fixes for review, then verifies approved changes in production to confirm the problem is resolved and the fix holds. (Mock: PR "Recycle checkout-svc database connections after 60 seconds", one-line diff adding maxLifetimeSeconds: 60; CI checks build / lint / unit-tests / e2e-smoke running; "Antimetal is watching. Nothing to do until they report." CTA Apply fix; World model "Observer added automatically" OBS-12 Checkout 5xx over 0.3%, "For 48h after merge. Reopens ISS-2 if it trips.")

## Mid-page CTA
- See Antimetal in action. CTA: Get Started

## Testimonial 1
- "Antimetal helps us stay focused on product by resolving issues as they come in." - Mihir Penugonda, Head of Engineering, Pocket
- Stat: 45% fewer recurring incidents (Before / After visual)

## Section: Patrol finds what your alerts don't.
- Body: Powered by the Antimetal World Model, Patrol agents continuously investigate your system to find problems, improve performance and reliability, and reduce costs.
- CTA: Put Patrol to work
- Agents (tabbed):
  - Ledger - Cloud & LLM costs (412 checks): Find idle capacity and spend that isn't earning its keep. Example IMP-1 Right-size idle staging capacity: 3.2x more capacity than the workload needs. ~$840/mo in projected savings. Scope: Cloud accounts
  - Surveyor - Observability posture (188 checks): Find the blind spots before they hide an incident. Example IMP-4 Close a monitoring blind spot: search-api has no p95 latency monitor. New monitor drafted for review. Scope: Production services
  - Tuner - Database health (96 checks): Find slow queries and database risks before they affect services. Example ISS-5 Catch replication lag early: read-replica-2 lag spiked to 5.1 seconds. Verified recovery below 1 second. Scope: Production databases
  - Medic - Service health (214 checks): Spot slow degradation before it becomes downtime. Example ISS-4 Find degradation before the alert: search-api p99 rose 9% while still inside its SLO. Trend surfaced for investigation. Scope: Production services
  - Planner - Scaling & capacity (64 checks): Keep demand from running into a hard ceiling. Example IMP-16 Create room for the next peak: checkout-svc is within 15% of its scaling ceiling. Raise max replicas to 12. Scope: Compute & queues
  - Sentinel - Vulnerability scanning (327 checks): Find vulnerable dependencies and where they run. Example ISS-3 Keep dependency upgrades moving: Scheduled audits found vulnerable dependencies in 3 repos. Upgrade PRs generated - Checks passed. Scope: Connected repositories
  - Sleuth - Error sweep (158 checks): Catch new errors. Group the repeats. Find the source. Example ISS-6 Turn recurring error sweeps into fixes: 1,284 exceptions grouped and traced to missing configuration. SharePoint picker fix ready for review. Scope: Production services

## Section: Understand how your environment works.
- Connects the dots.: Links code changes, infrastructure events, and runtime behavior to show what's behind a problem. (Mock: Replica rollout merged / Database replica restarted / Checkout timeouts rising -> Likely cause - 3 systems: Stale database connections)
- Knows who owns what.: Uses code ownership and review history to identify service owners and the right people to review a fix. (Mock: PR #3775 - Payments team CODEOWNERS Owner; Shreyas Recent GitHub reviews Reviewer; Review requested 2 people)
- Remembers your decisions.: Keeps past investigations, fixes, and team decisions in the World Model to guide future recommendations. (Mock: "Keep checkout at eight replicas. We need the capacity for peak traffic." -> World Model updated; minReplicas 8 Your team's constraint)

## Section: Your system, at your command.
- Ask questions. Direct the work.: Ask Antimetal to investigate a problem, explain what changed, or generate a fix. Add context and steer it as it works.
- Works where you work.: Antimetal works directly within your team's conversations in Slack or Microsoft Teams to help resolve issues and make decisions faster. (Mock Slack thread in #production-alerts: "Checkout errors are rising. @Antimetal can you investigate?" / "Stale database connections caused this. I've opened a fix for review. Here's the fix: #3775 - Recycle stale connections")

## Testimonial 2
- "Compared to our internal bot, Antimetal is more comprehensive and connects the dots across our data sources." - Armando Canals, Applied ML, Finch Legal
- Stat: 82% less time spent investigating issues (June 2026 to October 2026 chart)

## Quote
- "You may be able to build software rapidly, but if people can't depend on it, if you can't figure out what breaks, well, people aren't going to use it." - Ben Lutch, VP of Engineering (Google)

## Closing CTA: Put Antimetal to work.
- Body: Antimetal works alongside your team to understand your environment, keep it running, and make it better.
- CTA: Try Now

## Section: From the research log
- CTA: View all articles
- Research, Oct 23, 2026: Denoising production alerts to make on-call easier
- Research, Aug 3, 2026: Compressing Production Telemetry for Agents
- Research, Jun 10, 2026: We used Antimetal to resolve 76% of our production errors in one day
- Engineering, Jun 5, 2026: How we automated technical implementation
- Product, Apr 16, 2026: Introducing Antimetal for Coding Agents

## Pricing
None on the home page.

## Footer nav
- Company: Careers, Blog
- Resources: Docs, Guides, Glossary, Integrations
- Compliance: Trust Center, Terms, Privacy
