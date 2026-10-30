> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Lemlist

> Add identified contacts to Lemlist campaigns for automated outreach.

Connect Snitcher to Lemlist to add identified contacts directly to your cold email campaigns.

## Features

* **Add contacts to campaigns** with one click
* **Personalize with company data** (name, industry, size)
* **Trigger based on visits** via automations
* **Campaign selection** - choose which campaign to add contacts to

## Setup

1. Go to **Settings** → **Integrations** → **Lemlist**
2. Enter your Lemlist API token
3. Click **Connect**

### Getting Your API Token

1. Log in to [Lemlist](https://app.lemlist.com)
2. Go to **Settings** → **Integrations**
3. Find your API key or generate a new one
4. Copy and paste into Snitcher

## Usage

### Manual Push

1. View a company in Snitcher
2. Click on a revealed contact
3. Select **Add to Lemlist**
4. Choose the campaign
5. Contact is added to the sequence

### Automated Push

Use Automations to automatically add contacts:

1. Go to **Automations**
2. Create a new automation
3. Trigger: "Contact revealed" or "Company enters segment"
4. Action: **Add to Lemlist campaign**
5. Select the target campaign

## Data Passed to Lemlist

| Field | Lemlist Variable |
| - | - |
| Email | `{{email}}` |
| First Name | `{{firstName}}` |
| Last Name | `{{lastName}}` |
| Company Name | `{{companyName}}` |
| Position | `{{jobTitle}}` |

> [!TIP]
>
> Use Snitcher data in your Lemlist templates for better personalization. Reference company name, industry, or recent page views.

## Troubleshooting

> **Invalid API token**
>
> * Verify you copied the full token
> * Check that the token hasn't been revoked in Lemlist
> * Generate a new token if needed

> **Contacts not appearing in campaign**
>
> * Ensure the campaign is active (not paused)
> * Check for duplicate email detection in Lemlist
> * Verify the contact has a valid email address


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.