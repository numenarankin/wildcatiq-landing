> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# HubSpot Integration

> Connect Snitcher to HubSpot CRM to automatically sync identified companies and contacts with real-time webhooks and custom field mapping.

**Connect Snitcher to HubSpot to automatically create Companies and Contacts when visitors are identified on your website.** Snitcher syncs in real-time via webhooks, maps fields to any HubSpot property, and tracks pipeline attribution to measure sourced and influenced revenue.

## Features

* **Real-time sync** via webhooks - no delays
* **Auto-create Companies** when new organizations are identified
* **Auto-create Contacts** with revealed contact information
* **Two-way field mapping** - map Snitcher data to any HubSpot property, and import any HubSpot property into Snitcher
* **Timeline activities** - log website visits as activities
* **Deal pipeline tracking** - measure sourced and influenced revenue

## Setup

1. Go to **Settings** → **Integrations** → **HubSpot**
2. Click **Connect HubSpot**
3. Authorize Snitcher in the HubSpot OAuth popup
4. Configure your sync settings

## Configuration Options

### Company Sync

Choose when to create or update companies in HubSpot:

| Option | Description |
| - | - |
| **All identified companies** | Sync every company Snitcher identifies |
| **Segment-based** | Only sync companies matching specific segments |
| **Manual only** | Don't auto-sync, push manually from Snitcher |

### Contact Sync

Configure how contacts are synced:

| Option | Description |
| - | - |
| **Auto-create** | Create contacts when emails are revealed |
| **Associate to Company** | Link contacts to their company record |
| **Update existing** | Enrich existing contacts with Snitcher data |

### Field Mapping

Map Snitcher fields to HubSpot properties:

| Snitcher Field | Default HubSpot Property |
| - | - |
| Company Name | Company name |
| Domain | Company domain |
| Industry | Industry |
| Employee Count | Number of employees |
| Annual Revenue | Annual revenue |
| LinkedIn URL | LinkedIn company page |
| Location | City, State, Country |

> [!TIP]
>
> Create custom HubSpot properties to store additional Snitcher data like segments, tags, or first seen date.

### Import fields from HubSpot

Field mapping is two-way. Alongside pushing Snitcher data into HubSpot, you can pull **any HubSpot property into a Snitcher custom field** on the company. Snitcher detects the field's type automatically (text, number, date, checkbox, or list) and keeps the value up to date on each sync.

To set it up, open **Settings** → **Integrations** → **HubSpot**, choose the HubSpot fields to import, and either create a new custom field from each or link it to an existing one.

## Pipeline Attribution

Track how Snitcher contributes to your pipeline:

* **Sourced** - Deals where Snitcher identified the company before any CRM activity
* **Discovered** - Companies found by Snitcher not previously in your CRM
* **Influenced** - Deals where the company visited your site during the sales cycle
* **Engaged** - Companies showing repeat engagement on your website

## Troubleshooting

> **Companies not syncing**
>
> * Check that your segment filters aren't too restrictive
> * Verify the integration shows as "Connected" in settings
> * Ensure you have the required HubSpot permissions

> **Duplicate companies**
>
> Snitcher matches on domain to prevent duplicates. If duplicates exist:
>
> * Check for companies without domains in HubSpot
> * Merge duplicates in HubSpot directly

> **Permission errors**
>
> Reconnect the integration to refresh permissions. Go to Settings → Integrations → HubSpot and click **Reconnect**.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.