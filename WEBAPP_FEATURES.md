# WildcatIQ - Complete Feature Inventory

A comprehensive map of every page, tab, drawer, modal, panel, table, and action in
the **WildcatIQ** webapp. Intended as the source-of-truth reference when writing
landing-page copy and deciding what to showcase. Derived directly from the
`wildcat-webapp` source.

**What it is:** an AI-powered operations platform for oil & gas operators -
unifying exploration/geology data, well production, field operations, people, and
finance, with an embedded AI assistant ("Orion") that can read and act across all
of it. Built by Wildcat Labs.

**Tech at a glance:** Next.js (App Router) · Supabase (Postgres, Auth, pgvector) ·
Vercel AI SDK + Claude Opus 4.8 (Orion) · Mistral embeddings · Stripe (billing) ·
ElevenLabs (voice) · Recharts/D3 (charts) · TipTap (rich text) · shadcn/ui.

---

## Table of Contents

1. [Global Shell & Navigation](#1-global-shell--navigation)
2. [Home / Dashboard](#2-home--dashboard)
3. [Files & Knowledge Base](#3-files--knowledge-base)
4. [Orion (AI) & the AI Drawer](#4-orion-ai--the-ai-drawer)
5. [Wells](#5-wells)
6. [Projects](#6-projects)
7. [Tasks](#7-tasks)
8. [Calendar](#8-calendar)
9. [Inventory](#9-inventory)
10. [People](#10-people)
11. [Accounting](#11-accounting)
12. [Analytics](#12-analytics)
13. [Pricing (commodity market data)](#13-pricing-commodity-market-data)
14. [Settings](#14-settings)
15. [Onboarding](#15-onboarding)
16. [Auth & Invites](#16-auth--invites)
17. [Permissions Model](#17-permissions-model)
18. [Cross-Cutting Capabilities](#18-cross-cutting-capabilities)

---

## 1. Global Shell & Navigation

A responsive **collapsible left sidebar** + **top bar**, wrapping every
authenticated route. Navigation is **permission-gated** - items the user can't
access are hidden, and empty groups disappear.

### Sidebar groups & items
- **Overview**
  - **Home** (`/`) - chat-first dashboard
  - **Files** (`/files`) - requires `manage_files`
  - **Orion** (`/orion`) - AI assistant, requires `use_ai`
- **Operations**
  - **Wells** (`/wells`) - droplet icon
  - **Projects** (`/projects`) - requires `manage_projects`
  - **Inventory** (`/inventory`) - requires `manage_inventory`
  - **Tasks** (`/tasks`) - requires `manage_tasks`
  - **Calendar** (`/calendar`) - requires `manage_personal_calendar` or `manage_org_calendar`
- **Business**
  - **People** (`/people`) - requires `view_royalty_owners`/`manage_royalty_owners`
  - **Accounting** (`/accounting`) - requires `view_accounting`/`manage_accounting`
  - **Analytics** (`/analytics`) - requires `view_analytics`
  - **Pricing** (`/pricing`) - commodity prices, requires `view_pricing`
- **Administration**
  - **Settings** (`/settings`)

Sidebar collapses to icon-only mode (animated width). Footer shows a copyright
line (hidden when collapsed).

### Top bar (height 3.5rem)
- **Left:** sidebar toggle · separator · **dynamic breadcrumbs** (section + optional
  editable detail crumb, e.g. click-to-rename a project; slugs are prettified
  until a page registers a custom label).
- **Right:** **commodity price ticker** (live WTI / Henry Hub, hidden on small
  screens) · **voice-mode toggle** (mic) · **Orion drawer trigger** (sparkle) ·
  separator · **user menu** (avatar).

### User menu (avatar dropdown)
- Avatar, name, email
- **AI Credits: {balance}** + **Buy more** button (opens the buy-credits modal)
- **Sign out** (destructive)

### Main content area
- **Full-bleed routes** (fill viewport, no padding): `/orion`, `/projects/*`,
  `/calendar`.
- **Standard routes:** padded, scrollable, left-aligned to the breadcrumb icon.
- A **global voice controller** is mounted shell-wide for the single mic loop.

---

## 2. Home / Dashboard

`/` - a **chat-first** home centered on Orion.

- **Empty state:** time-of-day greeting ("Good morning, {First Name}") over a large
  composer, with a decorative particle/dot field densest near the composer.
- **After first message:** transitions to a scrollable chat thread with a floating
  bottom composer.
- **Composer:** auto-growing textarea (max 240px), Enter-to-send / Shift+Enter
  newline; **Attach from knowledge base** (＋) and **Upload from disk** (paperclip,
  multi-file) actions; send button.
- **Attachments:** inline removable chips (KB = file icon, disk = paperclip), shown
  above the composer and inside message bubbles.
- **Messages:** user (right, primary bubble) vs assistant (left, gray), full
  Markdown/GFM rendering (tables, etc.).
- **Status:** "Orion is thinking…", upload/indexing indicator, red error banner on
  API failure.

---

## 3. Files & Knowledge Base

`/files` - the document hub and AI knowledge base. Two-pane: browser on the left,
preview/editor on the right.

### File browser (table)
Columns: **Icon · Name · Type · Size · Modified · Actions**.
- **Header actions:** **New Folder** (inline-named), **New Doc** (blank Markdown),
  **Upload File** (multi-file; uploads then OCR-indexes).
- **Breadcrumb navigation** across folder path (clickable crumbs, chevron
  separators).
- **Folder rows** navigate in; **file rows** open the editor (docs) or viewer
  (everything else).
- **Row actions (hover):** Download · Move (opens folder-tree dialog) · Rename
  (inline) · **Pin** (pinned files flagged with a filled pin).
- **Upload rows** show a spinner + "Uploading & indexing…"; empty folders show
  "This folder is empty."

### File types & icons
PDF · DOC · MD · TRANSCRIPT (audio) · NOTE · URL · IMAGE · **LAS** (well-log) ·
generic.

### Document editor (Markdown/notes)
Back button · editable inline title · save-status badge ("Saving…"/"Saved") ·
**TipTap** rich-text editor with toolbar · **autosave** (debounced 700ms, flush on
unmount).

### Document viewer
- **PDF:** react-pdf with page count, rotate 90°, zoom (40–400%, reset to 100%).
- **Image:** zoom + rotate.
- **LAS well logs:** Equinor **videx-wellog** multi-track petrophysics viewer with a
  metadata bar (Well, Field, API/UWI, depth interval, curve count) and depth-axis
  log plot.
- **Other:** iframe of signed URL.

### Move-to-folder dialog
Scrollable expandable folder tree; current folder disabled as destination;
**Cancel** / **Move here**.

---

## 4. Orion (AI) & the AI Drawer

Orion is the embedded AI assistant (Claude Opus 4.8), available as a **full page**
and as an **app-wide drawer**, in **text or voice** mode.

### Orion full page (`/orion`)
Two-pane, no page scroll.
- **Conversation list (left, w-72):** **New chat** button; conversations sorted by
  most-recent; each row has a title (tooltip) + delete (trash); active/hover
  states; empty state "No conversations yet."
- **Chat surface (right):** text or voice depending on mode.

### Text chat (OrionChat / drawer ChatPanel)
- Greeting: "Hi, I'm Orion. Ask me about the wells, geology, production, or anything
  else across the company."
- User/assistant bubbles, Markdown/GFM, **Copy** and **Read-aloud** under assistant
  messages, attachment chips.
- Floating composer ("Ask Orion…"), KB-attach (＋) and disk-upload (paperclip),
  send. Shows "Orion is thinking…" plus **live tool-call names** in monospace
  (e.g. `→ tool_name()`).
- **Context aware:** knows the current route and selected file/folder; drawer chats
  can be **scoped to a project folder** (retrieves folder-specific docs, refreshes
  memory each turn).

### Voice chat (OrionVoiceChat / VoiceChatPanel)
Hands-free via Web Speech API + ElevenLabs TTS. "Voice mode is on - just start
talking, or type below. I'll answer out loud and on screen. Talk over me to
interrupt." Color-coded **status pill** (idle/listening/processing/thinking/
speaking); barge-in interrupt; manual text fallback.

### Voice-mode toggle
Header mic button (blue when on, mic-off & disabled if browser unsupported).
Switches the Orion page or the open drawer into voice; a single mic loop runs at a
time.

### Tool approval flow
When Orion wants to perform a **write** action it shows an **ApprovalCard**: "Orion
wants to run {tool}. Approve?", a scrollable JSON input preview, and **Approve** /
**Deny**. Certain tools can be set to auto-approve (per user/project). Chat resumes
automatically after the decision.

### AI drawer (app-wide)
Right-edge, **resizable, side-by-side** (not an overlay), animated open/close,
width persisted. Header: sparkle · "Orion" · **AI**/**Voice** badge · close. Same
chat as the full page, sized for the drawer.

### Buy AI credits modal
Slide-up. Fields: **Amount to spend** ($, numeric) and **Payment method** (saved
cards, "Brand •••• 1234", default pre-selected; "Add a card on the Billing tab to
buy credits."). Error/success banners; **Buy ${amount}** with spinner.

**What Orion can reach:** wells, geology/production, accounting & posted prices,
documents (structured + unstructured via embeddings), and write actions
(e.g. create documents) behind approval.

---

## 5. Wells

The core exploration/production entity. Tracks geology, production, equipment,
files, royalty owners, and discussion.

### Wells index (`/wells`)
Header "Wells" + **New Well**. Table columns:
**Well Name · Depth (ft) · Zone · Perforations (ft) · County · Oil (bbl/d) ·
Gas (MCF/d) · Salt Water · Revenue · Lifting Cost · P/L** (P/L red when negative).
Rows click through to the well; keyboard-navigable; hover-prefetch; empty state
"No wells to display."

### Well detail (`/wells/{id}`)
- **Header:** well name + settings (opens Well Info dialog); subhead
  *Formation · County · Perforations*; **Upload File** and **+ Production** actions.
- **Production chart:** "Production History - last {30/90/365} days, daily
  readings", three lines - **Oil** (green), **Gas** (dark red), **Salt Water**
  (blue); **1M / 3M / 12M** range selector.
- **Five tabs:** Production · Comments · Equipment · Files · Royalty Owners.

**Tab - Production:** table **Date · Time · Oil Prod (bbl) · Oil Stock (bbl) ·
Oil Sales (bbl) · Gas (MCF) · Salt Water**, newest first. Row → **Edit** modal;
**+ Production** → **Add** modal. Modal fields: Date, Time, **Oil Prod/Stock/Sales
(gauge inches)**, Gas (MCF/d), Salt Water (bbl/d) - oil entered in gauge inches,
stored as barrels via the well's `oilBblPerInch`. Edit modal also **Delete**s.

**Tab - Comments:** avatar + textarea ("Add a comment…", ⌘+Enter to post),
newest-first thread with author, relative time, body; optimistic posting.

**Tab - Equipment:** inline-editable **Field / Value** table (e.g. Tbg Pump,
Casing, Motor); **+ Add Equipment**; standard template auto-seeded on first visit;
per-row delete on hover.

**Tab - Files:** **Name · Type · Size · Uploaded · Download**; PDF/image/LAS
viewers; multi-file upload with "Uploading & indexing…", error rows with
**Retry**/**Dismiss**.

**Tab - Royalty Owners:** inline-editable **Name · Interest Type
(Royalty/Overriding/Mineral) · Decimal Interest · Last Payment · Email ·
Mailing Address**; **+ Add Royalty Owner**; owners are shared records (editing
affects all wells they're linked to; removing just unlinks).

### Well Info dialog
Two-column form: **Name · Formation · County · Depth (ft) · Perforations ·
Date drilled · Coordinates · Oil bbl/in**. Used for both **New well** and editing.

> Production modals use a swipe-up animation pattern (mobile-friendly bottom sheet,
> centered on desktop).

---

## 6. Projects

`/projects` - file/notes/budget/task workspaces organized as folders.

- **Grid landing:** responsive folder cards (large folder icon, name, item count);
  **New Project** modal (Name → "Create project").
- **Project workspace (`/projects/{folder}`)** with three tabs:
  - **Tasks** - the Kanban board scoped to this project's folder.
  - **Files** - a file browser scoped to the project's folder subtree.
  - **Budget** - inline-editable table **Title · Budget · Spend · Remaining**
    (Remaining = Budget − Spend, red if negative) with a totals footer. Budget lines
    come from tasks given a budget in the Tasks tab.
- **Project-scoped Orion chat** in a side pane: context = this folder's files,
  per-project conversation history, can author files via `create_document`.

---

## 7. Tasks

`/tasks` - Kanban board (also embedded per-project).

- **Columns / statuses:** **Planned · Priority · Doing · Done**, each with a count
  badge; horizontal scroll; **react-dnd** drag between/within columns (optimistic).
- **Task card:** title, 2-line description preview, **priority badge**
  (High = red, Medium = amber, Low = muted), deadline (calendar icon, "Jun 20" or
  "Jun 20, 2:30 PM"), assignee.
- **Task modal:** left pane = **Title** + **rich-text Description** (TipTap: bold,
  italic, strike, lists, blockquote, links-in-new-tab; up to 3 heading levels);
  right meta pane = **Assignee** (Unassigned / contractors / "Me"), **Priority**,
  **Status**, **Deadline** (date + optional time), **Budget** ($, feeds project
  budget), **Spend** ($). Add/Save + Cancel.

---

## 8. Calendar

`/calendar` - month/week operations calendar.

- **Toolbar:** **Month / Week** toggle · current period title (e.g. "January 2024"
  or "Jan 5 – Jan 11, 2024") · prev/next · **New Event**.
- **Month grid:** 7-column, today highlighted, up to 3 event chips per day + "+N
  more"; out-of-month days dimmed.
- **Week grid:** hour grid (48px/hr, scrolls to 6am), all-day band on top, timed
  events positioned by start/end with greedy lane-packing for overlaps.
- **Event categories (colored dots):** production · maintenance · logistics ·
  compliance · office.
- **Task-deadline integration:** tasks with deadlines appear as **read-only**
  events (flag icon, "compliance" color); clicking jumps to the Tasks board.
- **Event modal:** **Title · Date · All-day · Start/End (if timed) · Location ·
  People (comma-separated) · Description**; Add/Save + Cancel.

---

## 9. Inventory

`/inventory` - materials, parts, and supplies.

- Header "Inventory" + **add-item** button.
- **Table columns:** **Item · Category · Qty · Unit · Location · Unit Cost ·
  Total Value (qty × cost) · Status · Description**. Sticky monospace header; rows
  click to edit; empty state "No inventory to display."
- **Status badges:** **In Stock** (emerald) · **Low** (amber) · **On Order** (blue),
  each with a colored dot.
- **Add/Edit modal:** **Item · Category · Location · Quantity · Unit (ea, ft,
  joint…) · Unit Cost (USD) · Status (segmented: In Stock / Low / On Order) ·
  Description**.

---

## 10. People

`/people` - contractors, service providers, and royalty owners in a tabbed
workspace; **Add Person** opens a type-selecting modal; rows click to edit.

- **Contractors table:** **Name · Company · Trade · Phone · Email · Status**
  (Active/Inactive).
- **Service Providers table:** grouped by service category - **Company · Contact ·
  Phone · Email · Status**.
- **Royalty Owners table:** **Name · Interest Type · Well (or "Multiple") ·
  Decimal Interest (6dp) · Last Payment · Email · Mailing Address**.
- **Person form (by type):**
  - *Contractor:* Name (req) · Company · Trade · Phone · Email · Status.
  - *Service Provider:* Company (req) · Service · Contact · Phone · Email · Status.
  - *Royalty Owner:* Name (req) · Decimal Interest · Last Payment (USD) · Email ·
    Mailing Address · Interest Type (Royalty/Overriding/Mineral).
  - All types: free-form **Description**.
- **Status badges:** Active / In Pay (emerald) · Inactive (muted) · Suspended (red).

---

## 11. Accounting

`/accounting` - revenue/expense tracking per well, with **AI document
extraction** and financial reporting.

- **Header:** **Add Transaction** dropdown → **Add manually** | **Upload file**.
- **Four tabs:** Overview · Reports · Ledger · Uploads.

### Overview
- **Financial chart** (line): metric selector **Net Revenue** (green) /
  **Expenses** (maroon) / **Cash Flow** (blue); ranges **6M / 12M / All**; compact
  $ axis; zero reference line; red fill below zero.
- **Well financials table:** **Well · Net Revenue · Expenses · Cash Flow** (sortable;
  negative cash flow in red); row → per-well accounting page.

### Ledger
Inline-editable, chronological. Columns: **☑ select · Date · Type (Revenue/Expense)
· Counterparty · Category · Well · Amount** (emerald for revenue, red for expense) **·
Added** (read-only). Multi-select with two-step **Delete** confirmation.

### Transaction form (manual + extraction editor)
Common: **Type · Date · Payer/Recipient · Category · Well · Net Amount · Invoice #**.
Revenue-only: **Volume · Price · WRK-1 NRI · Prod Tax**. Switching type clears
category/revenue fields.

### Upload transactions (AI extraction)
Split-pane modal: drop a **PDF / image / CSV / XLSX**, streamed to Storage, then
**Claude Opus 4.8** (`/api/accounting/extract`) OCRs and extracts a structured
draft of transactions (with date reasoning - revenue dated to production month +1,
expenses verbatim; category & well matched to the org's chart of accounts/wells).
Review/edit/add/delete drafts, then **Save**. Handles too-large/timeout/empty
gracefully.

### Reports
Toolbar: **Summary / Well Reports** toggle · Well filter · Month filter. Table:
**Report · Type · Well · Period · Cash Flow · View**.
- **Monthly (well) report modal:** Revenue detail (Source/Volume/Price/Total/NRI/
  Prod Tax/Net), Expenses (grouped by category), **Cash Flow**, and **Distributions
  to Interest Owners** (owner × decimal interest × gross revenue).
- **Summary report modal:** 3-stat header (Net Revenue / Expenses / Cash Flow) +
  per-well breakdown.

### Uploads
Imported-batch list: **File · Uploaded · Transactions (count) · Total · Actions**;
removing a batch cascades to delete the transactions it created (one-step undo for
bad imports).

### Per-well accounting (`/accounting/{well}`)
Well name + financial chart + month-by-month table; click a month → monthly report
modal.

---

## 12. Analytics

`/analytics` - company-wide production dashboard. Merges **official** accounting
figures with **unofficial** self-reported production (only for months after a
well's latest accounting record, valued at live commodity prices; no month is
double-counted).

- **Company production chart:** lines for **Volume** (Oil bbl / Gas MCF / Salt
  Water bbl) or **Revenue** (Net Revenue / Cash Flow), ranges **6M / 12M / All**;
  unofficial months shaded; compact axes; month tooltips.
- **Production-by-well donut:** share of **Oil / Gas / Revenue / Cash Flow**
  (metric dropdown), color-coded slices + ranked legend with values and %.
- **Production log table:** **Well (link) · Date · Time · Oil Prod (bbl) · Oil Stock
  (bbl) · Oil Sales (bbl) · Gas (MCF) · Salt Water**, newest first, sticky header,
  scrollable.
- **Upcoming widget:** next 6 events/task-deadlines (Today/Tomorrow/date, time,
  location) + "View calendar" link.

---

## 13. Pricing (commodity market data)

`/pricing` - **commodity benchmark vs realized posted prices** (not subscription
billing).

- **Commodity toggle:** **Oil** / **Gas** (large header buttons).
- **Price chart:** three overlaid lines - **Benchmark** (WTI / Henry Hub, from Yahoo
  Finance), **Posted** (actual realized price derived from the accounting ledger,
  volume-weighted, attributed to production month), and **Projected** (dashed;
  forward model riding the benchmark minus the historical basis differential).
  Ranges **1M / 3M / 12M**.
- **Posted price table:** **Month · Posted Price** ($/bbl oil, $/MMBtu or $/MCF gas),
  newest first.
- **Global price ticker** (top bar): live **WTI** and **Nat Gas** with price + %
  change (green up / red down), polled every 60s, Yahoo (delayed) tooltip.

**APIs:** `/api/prices` (latest quotes, 60s cache) and `/api/prices/history`
(daily series by commodity/range, 5-min cache), both with last-good-data fallback.
**Commodities:** Oil (WTI, $/bbl, green) · Gas (Henry Hub, $/MMBtu, maroon).

---

## 14. Settings

`/settings` - five sections: **Profile · Organization · Accounting · Billing · AI**.

### Profile
- **Name** (autosave), **Email** (read-only), **Phone** (autosave), **Avatar
  upload** (PNG/JPEG/WebP/GIF, ≤5MB, initials fallback).
- **Referral card:** org referral **code** + shareable **link** (`/auth?ref=…`),
  each with copy-to-clipboard.

### Organization
- **Company** name + address (save when dirty).
- **Invite new member:** Name · Email (req) · **Set permissions** (opens the
  permissions modal) · **Invite** → generates a secure invite link (copyable).
- **Members table:** **Member · Email · Status** (Pending/Owner/Active) ·
  **Permissions** (summary: Admin / Full access / No access / N permissions, opens
  modal) · **Manage** (Resend/Cancel for pending; Remove for active - owner can't be
  removed).
- **Member permissions modal:** **Admin** master toggle + grouped switches across
  General/Members/Files/Wells/Projects/People/Inventory/Tasks/Calendar/Accounting/
  AI/Analytics/Pricing/Skills; `manage_*` auto-implies its `view_*`; admin locks all
  on.

### Accounting
**Accounting codes** editor - JSON textarea of the org's chart-of-accounts
categories, with a **Copy prompt** button (generate the JSON via any LLM), validate
+ **Save**.

### Billing
- Preview banners when billing/Stripe is off; checkout-return + error states.
- **Current plan:** tier label, status badge (Active/Trial/Past due/Canceled/…),
  well capacity + renew/cancel date; **Cancel / Resume / Manage Subscription**
  (Stripe portal).
- **Plan grid (5 tiers):** each card shows price (or "Custom"), **well capacity**,
  **monthly free AI credits**; current/Switch/Subscribe/Talk-to-sales actions;
  subscribing opens a **Stripe card-form** checkout modal ("Start free trial").
- **Payment methods:** table **Card · Name · Expires · Default · Settings**; **Add
  card** modal; edit modal (cardholder name, exp month/year, default toggle, remove).
  Cards collected via Stripe `CardElement` ("Saved securely with Stripe.").

### AI
- **Credits remaining** (large balance).
- **Buy more credits:** preset amounts $25/$50/$100/$250/$1,000 → **Buy ${amount}**
  (requires a card on file).
- **Skills:** table **Skill · Category · Type (Built-in/Custom) · Enabled**.
  **New skill** / edit modal: Name · Category · Description · Example prompts (one
  per line). Built-in skills are always on and read-only (show tools used + an
  "Approval" badge when they require approval); custom skills toggle on/off.

---

## 15. Onboarding

`/onboarding` - multi-step setup for new org owners; resumes at the right step.

1. **Details** - "Set up your workspace": Company Name · Address · Employee Count ·
   **Well Count** (drives the plan recommendation).
2. **Plan** - recommended tier highlighted (3-up cards: price, well cap, monthly AI
   credits); "Continue to payment" or finish-now if Stripe off.
3. **Payment** (optional) - Stripe card form, "Start free trial".
4. **Done** - "You're all set": optional **Invite your team** (Name · Email →
   copyable invite links) + **Continue to your workspace**.

---

## 16. Auth & Invites

- **`/auth`** - particle-background card.
  - **Sign in:** Email · Password → validates, accepts any pending invite, lands on
    `?next` or home.
  - **Sign up:** Email · **Referral code** (optional, prefilled from `?ref=`) ·
    Password → server creates the **account + organization + referral code**, signs
    in, routes to onboarding.
- **`/invite/{token}`** - validates the token (friendly invalid/accepted/expired/
  unavailable states), then **Accept invite**: read-only Email · First/Last name ·
  Phone · Password → creates the account linked to the pending membership, signs in,
  lands in the workspace with the inviter-assigned permissions.

---

## 17. Permissions Model

Org-scoped, role + granular capabilities. **Owners** (org creators) bypass checks
and hold every permission. **Members** start with none and are granted specific
capabilities. `admin` grants all; each `manage_*` implies its `view_*`. Enforced in
the database (RLS); the UI hides what you can't do via a `Can` component /
`useCan` / `usePermissions`.

**Catalog (key → what it allows):** `admin` · `manage_members` · `manage_files` ·
`add_wells` · `view_well_production` · `manage_well_production` ·
`manage_well_equipment` · `view_well_files` · `manage_well_files` ·
`view_royalty_owners` · `manage_royalty_owners` · `manage_projects` ·
`manage_inventory` · `use_ai` · `buy_ai_credits` · `manage_tasks` ·
`manage_personal_calendar` · `manage_org_calendar` · `view_accounting` ·
`manage_accounting` · `view_analytics` · `view_pricing` · `manage_skills`.

---

## 18. Cross-Cutting Capabilities

- **AI everywhere:** Orion (full page + drawer + voice), per-project scoped chat,
  accounting statement extraction, custom skills, tool-approval for writes.
- **Knowledge base / RAG:** every uploaded file is OCR'd and embedded
  (Mistral + pgvector) so Orion can search across structured + unstructured data.
- **Voice:** speech-to-text + read-aloud (ElevenLabs), barge-in interrupt.
- **Live market data:** commodity ticker + benchmark/posted/projected price charts.
- **Rich text:** TipTap editors for documents and task descriptions.
- **Optimistic UI:** inline-editable tables and drag-and-drop with immediate updates.
- **Billing & credits:** Stripe subscriptions (well-based tiers) + metered AI
  credits with top-ups.
- **Team & permissions:** secure invite links, granular per-member permissions,
  referral codes.
- **Units & domain formatting:** oil in bbl (entered as gauge inches), gas in MCF,
  water in bbl, decimal interests to 6dp, USD currency throughout.
