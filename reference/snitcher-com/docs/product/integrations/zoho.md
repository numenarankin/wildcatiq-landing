> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Zoho CRM

> Sync identified companies to Zoho CRM as Accounts and Contacts.

Connect Snitcher to Zoho CRM to automatically create Accounts and Contacts when visitors are identified on your website.

## Features

* **Real-time sync** via webhooks
* **Account and Contact creation**
* **Custom module support**
* **Two-way field mapping** - import any Zoho field into a Snitcher custom field
* **Web activity timeline**
* **Lead scoring integration**

## Setup

1. Go to **Settings** → **Integrations** → **Zoho CRM**
2. Click **Connect Zoho**
3. Log in to your Zoho account and authorize Snitcher
4. Configure your sync settings

## Configuration Options

### Object Mapping

| Snitcher Data | Zoho Object |
| - | - |
| Company | Account |
| Contact | Contact |
| Activity | Note/Activity |

### Field Mapping

| Snitcher Field | Zoho Field |
| - | - |
| Company Name | Account Name |
| Domain | Website |
| Industry | Industry |
| Employee Count | Employees |
| Location | Billing Address |

### Import fields from Zoho

Field mapping is two-way. Alongside pushing Snitcher data into Zoho, you can pull **any Zoho field into a Snitcher custom field** on the company. Snitcher detects the field's type automatically (text, number, date, checkbox, or list) and keeps the value up to date on each sync.

To set it up, open **Settings** → **Integrations** → **Zoho CRM**, choose the Zoho fields to import, and either create a new custom field from each or link it to an existing one.

## Troubleshooting

> **Records not syncing**
>
> * Verify the integration is connected
> * Check field mapping for required Zoho fields
> * Ensure your Zoho user has create permissions

> **Token expired**
>
> Zoho tokens refresh automatically. If issues persist, reconnect the integration.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.