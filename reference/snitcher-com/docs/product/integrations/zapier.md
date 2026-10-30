> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Zapier

> Connect Snitcher to 6,000+ apps with Zapier. Automatically sync identified companies with your CRM, Slack, email tools, and more.

Connect Snitcher to thousands of apps with Zapier. Automatically sync your identified website visitors with your CRM, marketing tools, and more.

## Setup

### 1. Get Your API Key

1. Log in to your [Snitcher account](https://app.snitcher.com)
2. Go to **Settings** → **API**
3. Generate a new API key
4. Copy the key for use in Zapier

### 2. Connect in Zapier

1. In Zapier, search for "Snitcher"
2. Click **Connect**
3. Paste your API key
4. Test the connection

***

## Available Triggers

Triggers start your Zap when something happens in Snitcher.

| Trigger | Description |
| - | - |
| **New Organisation** | Fires when Snitcher identifies a new company visiting your website |
| **Organisation Enters Segment** | Fires when a company matches a specific segment |

> [!TIP]
>
> Use segments to filter which companies trigger your Zaps. For example, only trigger for companies with 100+ employees in the Technology industry.

***

## Available Actions

Actions are things Zapier can do in Snitcher.

| Action | Description |
| - | - |
| **Add Tag to Organisation** | Add an existing tag to a company |
| **Remove Tag from Organisation** | Remove a tag from a company |
| **Create Tag** | Create a new tag in your workspace |
| **Reveal Contact Email** | Reveal a contact's email address (uses credits) |

***

## Available Searches

Searches let you find existing data in Snitcher to use in your Zap.

| Search | Description |
| - | - |
| **Find Organisation** | Find a company by name or domain |
| **Search Organisations** | Search companies with filters (segment, date range) |
| **Find Contacts** | Find contacts for a company |

***

## Common Recipes

### Track Leads in Google Sheets

Build a custom reporting spreadsheet with identified companies.

1. **Trigger:** Organisation Enters Segment ("Hot Leads")
2. **Action:** Google Sheets → Create Row
3. Map fields: Company Name, Domain, Industry, Employee Count, LinkedIn URL

### Add to Notion Database

Create entries in your Notion sales pipeline.

1. **Trigger:** New Organisation
2. **Action:** Notion → Create Database Item
3. Map to your pipeline properties

### Create Outreach Sequence

Automatically add contacts to Outreach.io sequences.

1. **Trigger:** Organisation Enters Segment
2. **Action:** Reveal Contact Email
3. **Action:** Outreach → Add to Sequence

### Add to Airtable

Build a custom lead database in Airtable.

1. **Trigger:** New Organisation
2. **Action:** Airtable → Create Record
3. Map fields to your base columns

### Build LinkedIn Ads Audience

Export companies to a CSV for LinkedIn matched audiences.

1. **Trigger:** Organisation Enters Segment
2. **Action:** Google Sheets → Create Row (company domains)
3. Upload sheet to LinkedIn Campaign Manager

### Alert on Discord

Notify your team in Discord when target accounts visit.

1. **Trigger:** Organisation Enters Segment ("Target Accounts")
2. **Action:** Discord → Send Message

***

## Advanced Recipes

### Tag Leads from Your Target Account List

Automatically tag companies in Snitcher if they appear in your Google Sheet of target accounts.

1. **Trigger:** New Organisation
2. **Search:** Google Sheets → Lookup Row (match by domain)
3. **Filter:** Only continue if row found
4. **Action:** Add Tag to Organisation ("Target Account")

### Enrich and Route by Company Size

Route leads to different destinations based on company size.

1. **Trigger:** New Organisation
2. **Path A (Enterprise):** If Employee Count > 500 → Notion → Add to "Enterprise Pipeline"
3. **Path B (Mid-Market):** If Employee Count 50-500 → Google Sheets → Add Row
4. **Path C (SMB):** If Employee Count \< 50 → Mailchimp → Add to nurture list

### Sync Tags from Your CRM

When a deal stage changes in your CRM, update the tag in Snitcher.

1. **Trigger:** Close CRM → Deal Updated
2. **Search:** Find Organisation (by domain)
3. **Action:** Remove Tag ("Prospect")
4. **Action:** Add Tag ("Customer")

### Auto-Reveal High-Value Contacts

Automatically reveal contact emails for companies that match your ICP.

1. **Trigger:** Organisation Enters Segment ("ICP Match")
2. **Search:** Find Contacts (for organisation)
3. **Action:** Reveal Contact Email
4. **Action:** Lemlist → Add to Campaign

### Cross-Reference with Technographic Data

Combine Snitcher with BuiltWith or similar to tag companies using specific technologies.

1. **Trigger:** New Organisation
2. **Action:** BuiltWith → Lookup Technologies (by domain)
3. **Filter:** If uses "Shopify"
4. **Action:** Add Tag to Organisation ("Shopify User")

***

## Data Available

### Organisation Fields

| Field | Description |
| - | - |
| Organisation ID | Unique identifier |
| Company Name | Identified company name |
| Domain | Company website domain |
| Industry | Company industry |
| Employee Count | Company size range |
| Annual Revenue | Estimated revenue |
| First Seen | First visit timestamp |
| Last Seen | Most recent visit |
| Tags | Applied tags |
| LinkedIn URL | Company LinkedIn page |

### Contact Fields

| Field | Description |
| - | - |
| Contact ID | Unique identifier |
| Email | Contact email (after reveal) |
| First Name | Contact first name |
| Last Name | Contact last name |
| Position | Job title |
| Department | Department |
| Seniority | Seniority level |

***

## Troubleshooting

> **Authentication errors**
>
> * Ensure your API key is valid and not expired
> * Check that you have access to the workspace
> * Try regenerating your API key in Snitcher settings

> **No data appearing**
>
> * Verify your workspace has identified companies
> * Check that segment filters aren't too restrictive
> * Wait a few minutes for new data to sync

> **Zap not triggering**
>
> * Confirm the Zap is turned on
> * Check that companies match your segment criteria
> * Review Zap history for errors

***

## Need Help?

* [Snitcher Help Center](https://help.snitcher.com)
* [Zapier Help](https://zapier.com/help)
* Email: [support@snitcher.com](mailto:support@snitcher.com)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.