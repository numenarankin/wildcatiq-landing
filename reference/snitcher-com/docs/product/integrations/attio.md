> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Attio

> Sync identified companies to Attio CRM.

Connect Snitcher to Attio to automatically sync identified companies to your modern CRM.

## Features

* **Company sync** to Attio
* **Contact association**
* **Custom attribute mapping**
* **Two-way field mapping** - import any Attio attribute into a Snitcher custom field
* **OAuth authentication**

## Setup

1. Go to **Settings** → **Integrations** → **Attio**
2. Click **Connect Attio**
3. Authorize Snitcher in Attio
4. Configure your sync settings

## Data Mapping

| Snitcher Field | Attio Attribute |
| - | - |
| Company Name | Name |
| Domain | Domain |
| Industry | Industry |
| Employee Count | Team size |
| Location | Location |

## Import fields from Attio

Field mapping is two-way. Alongside pushing Snitcher data into Attio, you can pull **any Attio attribute into a Snitcher custom field** on the company. Snitcher detects the attribute's type automatically (text, number, date, checkbox, or list) and keeps the value up to date on each sync.

To set it up, open **Settings** → **Integrations** → **Attio**, choose the Attio attributes to import, and either create a new custom field from each or link it to an existing one.

## Troubleshooting

> **Companies not syncing**
>
> Verify the integration is connected and check your sync settings.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.