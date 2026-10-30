> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Close Integration

> Connect Snitcher to Close CRM to automatically sync identified companies as Leads, reveal contacts, and import Opportunities — with real-time two-way sync.

**Connect Snitcher to Close to automatically create and enrich Leads when visitors are identified on your website.** Snitcher syncs in real-time in both directions, maps fields to any Close field (including custom fields), reveals contacts directly onto the right Lead, and imports your Opportunities for pipeline visibility.

> [!NOTE]
>
> The Close integration is currently in **beta**. Want early access? [Contact support](https://help.snitcher.com) and we'll enable it for your workspace.

## How Snitcher maps to Close

In Close, a **Lead represents the company** — contacts and opportunities live underneath it. Snitcher follows that model:

| Snitcher | Close |
| - | - |
| Company | Lead |
| Contact | Contact (on the Lead) |
| Deal | Opportunity |

Snitcher matches companies to existing Leads by **website domain**, so connecting to an existing Close organization enriches your current Leads instead of creating duplicates.

## Features

* **Real-time two-way sync** — changes flow through securely signed webhooks, in both directions
* **Auto-create Leads** when new companies are identified
* **Auto-create Contacts** with revealed contact information, attached to the right Lead
* **Custom field mapping** — map Snitcher data to any Close Lead field, including your custom fields
* **Opportunity import** — see deal stage, value, and owner alongside visitor activity in Snitcher
* **Deal segments** — automatic Open Deals and Lost Deals segments for retargeting and win-back
* **Self-healing sync** — if Close pauses webhook delivery, Snitcher reactivates it and backfills missed changes automatically

## Setup

1. Go to **Settings** → **Integrations** → **Close**
2. Click **Connect Close**
3. Authorize Snitcher in the Close OAuth screen (select your Close organization)
4. Configure your sync settings

Snitcher automatically creates its enrichment fields in Close during setup — no manual field creation needed.

## Data Mapping

### Default field mapping

| Snitcher Field | Close Field |
| - | - |
| Company Name | Lead name |
| Website | Lead URL (used for duplicate matching) |
| Description | Description |
| Lead Status | Lead status (read into Snitcher) |

You can remap or extend these under **Settings** → **Integrations** → **Close**, including mapping to your own Close custom fields. Close custom fields are tracked by their internal ID, so renaming a field in Close never breaks the mapping.

### Snitcher enrichment fields

During setup, Snitcher creates these custom fields on your Close Leads:

| Field | Type |
| - | - |
| Snitcher Total sessions | Number |
| Snitcher Total page views | Number |
| Snitcher Total time on site | Number |
| Snitcher Segments | Text |
| Snitcher Tags | Text |
| Snitcher First visit date | Date |
| Snitcher Last visit date | Date |
| Snitcher Source | Text |

These keep every Lead's engagement data fresh as visitors return to your site — ideal for Close Smart Views like "engaged this week."

### Opportunities

Snitcher imports Opportunities from Close (read-only) so you can see pipeline context next to visitor activity:

* Value, currency, and status/pipeline stage
* Owner
* Created and won dates

Snitcher never creates or modifies Opportunities in Close.

## Contact Reveal

When you reveal a contact in Snitcher and send it to Close, Snitcher:

1. Checks whether a contact with that email already exists in your Close organization
2. Creates the contact **on the matching Lead** with name, title, email, and phone
3. Updates the existing contact instead if one is found on the same Lead

If the email already belongs to a contact on a *different* Lead, Snitcher reports it rather than moving the contact.

## Troubleshooting

> **Companies not syncing**
>
> * Check that your segment filters aren't too restrictive
> * Verify the integration shows as "Connected" in settings
> * Companies need an identified website domain to be matched or created in Close

> **Duplicate Leads**
>
> Snitcher matches on the Lead URL field to prevent duplicates. If duplicates appear:
>
> * Make sure your existing Leads have their URL field filled in
> * Merge duplicates in Close directly — Snitcher follows Lead merges automatically

> **Snitcher fields missing in Close**
>
> Creating custom fields requires a Close role with organization management permission. Reconnect with an admin account, then use **Reinstall** on the integration page.

> **Changes in Close not appearing in Snitcher**
>
> Close can pause webhook delivery after extended downtime on either side. Snitcher detects this and recovers automatically within about 30 minutes, including changes made while delivery was paused.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.