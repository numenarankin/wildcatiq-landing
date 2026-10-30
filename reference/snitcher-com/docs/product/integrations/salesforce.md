> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Salesforce

> Sync identified companies to Salesforce as Leads, Contacts, or Accounts.

Connect Snitcher to Salesforce to automatically create Leads, Contacts, and Accounts when visitors are identified on your website.

## Features

* **Flexible object mapping** - create Leads, Contacts, or Accounts
* **Custom field support** - map to standard and custom fields
* **Two-way field mapping** - import any Salesforce field into a Snitcher custom field
* **Deal/Opportunity tracking** - associate website activity with opportunities
* **SOQL integration** - advanced querying for deduplication
* **30-minute sync cycle** - regular polling for reliable data transfer

## Setup

1. Go to **Settings** → **Integrations** → **Salesforce**
2. Click **Connect Salesforce**
3. Log in to your Salesforce org and authorize Snitcher
4. Configure your object and field mappings

## Configuration Options

### Object Mapping

Choose which Salesforce objects to create:

| Option | Use Case |
| - | - |
| **Lead** | New prospects not yet qualified |
| **Account + Contact** | Qualified companies with contact details |
| **Account only** | Company-level tracking without contacts |

### Field Mapping

Map Snitcher data to Salesforce fields:

| Snitcher Field | Suggested Salesforce Field |
| - | - |
| Company Name | Account Name / Lead Company |
| Domain | Website |
| Industry | Industry |
| Employee Count | Number of Employees |
| Annual Revenue | Annual Revenue |
| Location | Billing Address |
| First Seen | Custom: First Website Visit |
| Last Seen | Custom: Last Website Visit |

> [!TIP]
>
> Create custom Salesforce fields to capture Snitcher-specific data like segments, page views, and session count.

### Import fields from Salesforce

Field mapping is two-way. Alongside pushing Snitcher data into Salesforce, you can pull **any Salesforce field into a Snitcher custom field** on the company. Snitcher detects the field's type automatically (text, number, date, checkbox, or list) and keeps the value up to date on each sync.

To set it up, open **Settings** → **Integrations** → **Salesforce**, choose the Salesforce fields to import, and either create a new custom field from each or link it to an existing one.

### Sync Settings

| Setting | Description |
| - | - |
| **Sync frequency** | Every 30 minutes |
| **Duplicate handling** | Match on domain/website field |
| **Update existing** | Optionally update existing records |

## Deduplication

Snitcher uses the Website/Domain field to match existing records:

1. Searches for existing Account/Lead with matching domain
2. If found, optionally updates the record
3. If not found, creates a new record

## Troubleshooting

> **Records not creating**
>
> * Verify required fields are mapped (Salesforce may require specific fields)
> * Check your Salesforce validation rules
> * Ensure the connected user has create permissions

> **Duplicate records**
>
> * Enable the "match on domain" setting
> * Ensure existing records have the Website field populated
> * Consider using Salesforce duplicate rules

> **Connection errors**
>
> Salesforce tokens expire periodically. Reconnect the integration if you see authentication errors.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.