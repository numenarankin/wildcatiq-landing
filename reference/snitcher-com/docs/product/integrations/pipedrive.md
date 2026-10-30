> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Pipedrive

> Sync identified companies to Pipedrive as Organizations with real-time webhooks.

Connect Snitcher to Pipedrive to automatically create Organizations and Persons when visitors are identified on your website.

## Features

* **Real-time sync** via webhooks
* **Auto-create Organizations** when companies are identified
* **Auto-create Persons** with revealed contacts
* **Activity notes** for website sessions
* **Custom fields** for web activity data
* **Two-way field mapping** - import any Pipedrive field into a Snitcher custom field
* **Deal enrichment** with visitor insights

## Setup

1. Go to **Settings** → **Integrations** → **Pipedrive**
2. Click **Connect Pipedrive**
3. Authorize Snitcher in the Pipedrive OAuth popup
4. Configure your sync settings

## Configuration Options

### Organization Sync

| Option | Description |
| - | - |
| **All companies** | Sync every identified company |
| **Segment filter** | Only sync companies in specific segments |
| **New only** | Only create, never update existing |

### Field Mapping

| Snitcher Field | Pipedrive Field |
| - | - |
| Company Name | Organization name |
| Domain | Website |
| Industry | Custom field |
| Employee Count | Custom field |
| Location | Address |
| First Seen | Custom field |

### Import fields from Pipedrive

Field mapping is two-way. Alongside pushing Snitcher data into Pipedrive, you can pull **any Pipedrive field into a Snitcher custom field** on the company. Snitcher detects the field's type automatically (text, number, date, checkbox, or list) and keeps the value up to date on each sync.

To set it up, open **Settings** → **Integrations** → **Pipedrive**, choose the Pipedrive fields to import, and either create a new custom field from each or link it to an existing one.

### Activity Tracking

Optionally log website visits as Pipedrive activities:

* Session start time
* Pages viewed
* Time on site
* Referral source

## Troubleshooting

> **Organizations not syncing**
>
> * Check that webhooks are enabled in Pipedrive
> * Verify the integration is connected
> * Review segment filter settings

> **Custom fields not appearing**
>
> Custom fields must be created in Pipedrive first, then mapped in Snitcher settings.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.