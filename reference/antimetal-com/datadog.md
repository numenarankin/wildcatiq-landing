---
source: https://antimetal.com/integrations/datadog
fetched: 2026-10-26
note: Captured as the representative integration detail page; Antimetal has no single-feature marketing pages (see integrations.md).
---

# Antimetal - Datadog integration page reference

## Structure
- Docs-style product page, 5 sections with an on-page table of contents: hero (logo, H1, Native badge, two-sentence lead, Connect + Read the docs CTAs), "What Antimetal does with X" (5 bullets of investigative actions), "Connecting X" (prerequisites + 5 numbered setup steps), "Permissions and access" (read-only scope statement + isolation note), "Resources" (video walkthrough, support contact), then a 3-card "Related integrations" block and Previous / Next pagination.
- All copy, no screenshots. The "what it does with" bullets are the only marketing; everything else is setup documentation. Template is identical across the 79 integrations.

## Title and meta
- Title: Datadog integration · Antimetal
- Meta description: Datadog is one of the richest signals Antimetal can pull from during an investigation: metrics, logs, and traces already correlated in one place. Antimetal connects with a read-only API key and Application key so it can query that data while an incident is live.

## Hero
- Breadcrumb: Integrations / Monitoring & Observability
- Headline: Datadog (badge: Native)
- Subhead: Datadog is one of the richest signals Antimetal can pull from during an investigation: metrics, logs, and traces already correlated in one place. Antimetal connects with a read-only API key and Application key so it can query that data while an incident is live.
- CTAs: Connect Datadog, Read the docs
- Table of contents: What Antimetal does with Datadog; Connecting Datadog; Permissions and access; Resources

## Section: What Antimetal does with Datadog
- Query metrics to establish when behavior changed and which services moved with it
- Search logs and error tracking for the failure signature behind an alert
- Follow APM traces across service boundaries to locate the failing hop
- Read monitors, events, and SLOs to understand what fired and what it protects
- Pull case and incident management records for prior occurrences of the same failure

## Section: Connecting Datadog
- Prerequisites: A Datadog account with permissions to generate API keys; Access to Organization Settings in Datadog
- 1 Navigate to Organization Settings: Go to Datadog, click your user icon in the bottom left, and select Organization Settings.
- 2 Create an API key: Click API Keys in the left sidebar, then select New Key. Name it Antimetal. Save the secret API key securely - it won't be shown again.
- 3 Create an Application key: Click Application Keys in the left sidebar, then click New Key. Name it Antimetal.
- 4 Edit app key scopes (optional): By default the app key inherits the owner's permissions. To limit access, click Edit Scopes and grant read access to APM, Case and Incident Management, Compliance, Dashboards, Error Tracking, Events, Log Management, Metrics, Monitors, Service Level Objectives, and Synthetics. See Datadog's full list of permissions.
- 5 Share the keys with Antimetal: Paste both keys and select your region in the Antimetal UI. You can find your region in your Datadog URL - app.datadoghq.eu means EU.

## Section: Permissions and access
- Antimetal uses read-only API and Application keys. No write operations are performed in your Datadog environment. Required scopes: APM, Metrics, Logs, Events, Monitors, and Case & Incident Management.
- All tenant data is processed in isolated environments. See security and compliance for details. (-> docs.antimetal.com/admin/security)

## Section: Resources
- Video walkthrough (Loom)
- Need help? Contact us via Slack or at support@antimetal.com.

## Section: Related integrations
- Sentry (Monitoring & Observability, Native): Track application errors to their source.
- PagerDuty (Incident Management, Native): Ingest incidents and alerts from PagerDuty.
- GitHub (Source Control, Native): Search your codebase for the root cause.
- Pagination: Previous Customer.io | Next Dynatrace

## Cross-links to other product pages
- /integrations, /integrations/sentry, /integrations/pagerduty, /integrations/github, /integrations/customer-io, /integrations/dynatrace
