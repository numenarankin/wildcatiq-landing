> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Microsoft Dynamics

> Sync identified companies to Microsoft Dynamics 365 as Accounts and Contacts.

Connect Snitcher to Microsoft Dynamics 365 to automatically create Accounts and Contacts when visitors are identified on your website.

## Features

* **Account and Contact sync**
* **Custom field mapping**
* **Two-way field mapping** - import any Dynamics field into a Snitcher custom field
* **Activity tracking**
* **Workflow integration**
* **30-minute sync cycle**

## Setup

1. Go to **Settings** → **Integrations** → **Microsoft Dynamics**
2. Click **Connect Dynamics**
3. Sign in with your Microsoft account
4. Select your Dynamics environment
5. Configure field mappings

## Configuration Options

### Entity Mapping

| Snitcher Data | Dynamics Entity |
| - | - |
| Company | Account |
| Contact | Contact |
| Activity | Activity |

### Field Mapping

| Snitcher Field | Dynamics Field |
| - | - |
| Company Name | Account Name |
| Domain | Website |
| Industry | Industry |
| Employee Count | Number of Employees |
| Revenue | Annual Revenue |
| Location | Address |

### Import fields from Dynamics

Field mapping is two-way. Alongside pushing Snitcher data into Dynamics, you can pull **any Dynamics field into a Snitcher custom field** on the company. Snitcher detects the field's type automatically (text, number, date, checkbox, or list) and keeps the value up to date on each sync.

To set it up, open **Settings** → **Integrations** → **Microsoft Dynamics**, choose the Dynamics fields to import, and either create a new custom field from each or link it to an existing one.

## Troubleshooting

> **Connection issues**
>
> Ensure your Dynamics user has the necessary security roles to create and update records.

> **Records not appearing**
>
> Check that required fields are mapped. Dynamics may require specific fields for record creation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.