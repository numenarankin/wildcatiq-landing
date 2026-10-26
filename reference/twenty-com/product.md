---
source: https://twenty.com/product
fetched: 2026-10-26
---

# Twenty - Product (features) page reference

## Structure
- Twenty's only product page; the site has no per-feature pages (footer "Sitemap": Home, Product, Pricing, Customers, Partners, Why Twenty). About 8 sections: hero with a full live-looking CRM table mock and an AI side panel, logo strip, a numbered 7-step "Core Features" scroller (each step: H3 + exactly 3 bullet features + a text-rendered UI mock), a 3-pillar "modern CRM" block, a 3-tab "Customization" block with data-model / workflow / layout mocks, a closing CTA, and a 7-item FAQ that doubles as the pricing and platform spec.
- Copy to mock ratio favors mocks (the Companies table alone is a dozen rows of sample data); real copy per feature is one headline plus three short bullets. FAQ carries the hard facts (open source, $9 / $19 per user, MCP server, Apps framework, migration).
- No cross-links to sibling feature pages (none exist); hands off to Pricing and Why Twenty via footer only.

## Title and meta
- Title: Twenty CRM Features — Modern Open Source CRM Platform
- Meta description: Pipelines, custom objects, AI assistants, and a native API on top of Postgres. Twenty is the open source CRM with the modern UX teams actually want to use.

## Hero
- Headline: A CRM for teams that move fast
- Subhead: Track relationships, manage pipelines, and take action quickly with an intuitive CRM that helps your team move faster from day one with confidence.
- CTAs: Get started, Talk to us
- Mock: full app shell (Home, Favorites, Sales Dashboard, Workspace: Companies, People, Opportunities, Tasks, Notes, Dashboards, Workflows; Book a demo) showing an All Companies table with columns Url, Created By, Address, Account Owner, ICP, ARR, Linkedin, Industry, Main contact, Employees, Opportunities, Added, and sample rows (Anthropic, Linkedin, Slack, Notion, Figma, Github, Airbnb, Stripe, Sequoia, Segment, Mailchimp, Accel, Founders Fund, Google)
- Second headline: ...with AI that actually helps you work faster
- Second subhead: Ask questions, automate tasks, and get insights with AI that understands your data and helps you move faster every day, end to end across teams.
- AI prompt chips: Build a pipeline board grouped by stage; Generate tasks for my top 10 accounts; Build a dashboard of pipeline by stage; Draft a workflow for an email sequence. Side panel mock: Ask AI, "Thinking", "Ask, search or make anything...", model label Claude Opus 4.6

## Section: trusted by
- Logos: République Française, Bayer, PwC, Windmill, Fora, Wazoku, CivicActions, OTIIMA, NIC Industries, Shiawase Home; "+10k others"

## Section: Core Features. Everything you need, out of the box
- 01/07 Reports & Dashboards, Metrics you can actually trust.: Build custom dashboards from live CRM data. Aggregate anything - deals, accounts, activity - into charts your team actually reads. Bullets: Aggregate, bar, line, and pie widgets; Filtered metrics from any object; Real-time data. Mock: Sales performance dashboard, Revenue (YTD) $1.2M +12%, Avg deal size $9.4K +5%, Win rate 34% +3%, Deals by month, Deals by stage 140 Total
- 02/07 Tasks & Activities, Context lives with the record.: Create tasks from records; Assign owners and due dates; Rich notes attached to records. Mock: TODO 3 (Send NDA, Follow up on pricing, Prepare onboarding deck), DONE 1 (Schedule security review)
- 03/07 Emails & Calendar, Every thread, on the right record.: Connect Google or Microsoft accounts; Emails and events linked to CRM records; Full communication history in one place. Mock: Inbox 4 with threads (Partnerships - Q4 Strategy, Proposal Submission, Follow-up on Discussion, Customer Feedback)
- 04/07 Contacts & Companies, Your network, fully mapped.: Custom fields and relationships; Unified timeline (emails, events, tasks, notes, files); Email/calendar activity on each record. Mock: All Companies · 9 table
- 05/07 Pipeline Management, Deals that move themselves.: Custom deal stages for your process; Drag-and-drop deals between stages; Track amount and close date. Mock: By Stage · 5 kanban (New 2, Meeting 1, Customer 2) with deals API Integration Deal $75k, Workspace Rollout $45k, Enterprise Plan Upgrade $50k, Design Partnership $30k, Billing Expansion $60k
- 06/07 Files, Attachments without the chaos.: Multi-file upload on records; Rename, download, and delete attachments; In-app preview for supported file types (when enabled). Mock: NDA - Anthropic.pdf, Pricing Q4.xlsx, Onboarding deck.pptx, Brand assets.png
- 07/07 Data import, From CSV to CRM in minutes.: CSV import flow; Column-to-field mapping (including relations); CSV export anytime. Mock: Imported data -> Twenty fields mapping (First Name -> Name, Email -> Emails, Company -> Company, Job Title -> Job Title)

## Section: Stop settling for trade-offs. A modern CRM with an intuitive interface
- Built for speed: Fly through your workspace with shortcuts and short load times.
- Real-time data: See updates as they happen. Work with your team and agents seamlessly.
- Stay in Flow: AI chat, settings, and records in a side panels for fast, single-screen access.

## Section: Customization. Go the extra mile with no-code
- Lead: Need a quick change? Skip the engineering ticket. Customize your workspace in minutes.
- Tabs: Data model (Add objects and fields) | Automation (Create a workflow) | Layout (Tailor record pages, menus, and views)
- Data model mock: People · 840 (22 fields), Companies · 120 (39 fields), Employment History · 48 (8 fields), Opportunities · 64 (11 fields), Demos · 45 (6 fields)
- Workflow mock: Trigger: Record is Created -> Filter -> Search Records -> AI Agent -> Update Record -> Send Email -> Create Record
- Layout mock: record page sections General (Account Owner · Relation, Revenue · Currency), Additional (ICP · Boolean), Other (Employees · Number, Address · Address, Creation date · Date & Time), "Add a Section"

## Closing CTA
- Start moving faster today. Open-source, AI-ready, and set up in minutes. CTAs: Get started, Talk to us
- Second banner above FAQ: Stop fighting custom. Start building, with Twenty. CTAs: Get started, Talk to us

## Section: Any Questions? (FAQ)
- Is Twenty really open-source? Yes. Twenty is the #1 Open Source CRM on GitHub. You can self-host to fully own your infrastructure, or run it on our managed cloud for a zero-ops setup.
- How long does it take to get started? Sign up for Cloud in under a minute and start your 30-day trial. For larger rollouts, our 4-hour Onboarding Packs or certified partners get you live in 1–2 weeks.
- Can I migrate from Salesforce or HubSpot? Yes. Import your data via CSV, or use our API for 50,000+ records. Our partners can handle the full migration for you.
- Do I need a developer to customize Twenty? No. Build custom objects, fields, views, and no-code workflows straight from Settings. Unlimited, no extra charge.
- Can developers extend Twenty with code? Yes, with our Apps framework. Scaffold an extension with `npx create-twenty-app` and ship custom objects, server-side logic functions, React components that render inside Twenty's UI, AI skills and agents, views, and navigation, all in TypeScript, deployable to any workspace.
- Does Twenty work with Claude, ChatGPT, and Cursor? Yes. Every Cloud workspace ships with a native MCP server. Connect your AI assistant via OAuth and it can read and write your CRM data in natural language.
- What does Twenty cost? Cloud Pro is $9/user/month (yearly). Organization is $19/user/month and unlocks SSO and row-level permissions for teams that need finer access control.

## Footer nav
- Sitemap: Home, Product, Pricing, Customers, Partners, Why Twenty
- Help: Developers, User Guide, Release Notes, Halftone generator
- Legal: Privacy Policy, Terms and Conditions, Trust Center
- Connect: LinkedIn, Talk to us, Get started

## Cross-links to other product pages
- None in body; /pricing, /why-twenty, /apps reachable from footer/nav only
