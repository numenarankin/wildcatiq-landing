> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Google Analytics 4

> Enrich your GA4 data with company information using custom dimensions.

Connect Snitcher to Google Analytics 4 to add company data as custom dimensions, enabling B2B analytics and audience segmentation.

## Features

* **Custom dimensions** for company data (name, industry, size, location)
* **Server-side enrichment** via Measurement Protocol
* **Multiple GA4 properties** support
* **Selective dimension mapping** - choose which data to sync

## Setup

1. Go to **Settings** → **Integrations** → **Google Analytics**
2. Click **Connect Google Analytics**
3. Authorize with your Google account
4. Select your GA4 property and data stream
5. Choose which dimensions to create

## Available Dimensions

### Basic Info (Default)

| Dimension | Description |
| - | - |
| Snitcher Company Name | Identified company name |
| Snitcher Company Domain | Company website domain |
| Snitcher Company Industry | Industry classification |
| Snitcher Company Size | Employee count range |

### Location

| Dimension | Description |
| - | - |
| Snitcher Company City | City where company is located |
| Snitcher Company Region | State/region |
| Snitcher Company Country | Country |
| Snitcher Company Postal | Postal/ZIP code |

### Financial

| Dimension | Description |
| - | - |
| Snitcher Company Revenue | Estimated annual revenue |
| Snitcher Company Funding | Total funding raised |
| Snitcher Company Founded | Year founded |

### Snitcher-Specific

| Dimension | Description |
| - | - |
| Snitcher Segments | Segments the company belongs to |
| Snitcher Tags | Tags assigned to the company |

> [!WARNING]
>
> GA4 allows up to 25 user-scoped custom dimensions. Choose the dimensions most relevant to your analysis.

## How It Works

1. Visitor arrives on your website
2. Snitcher identifies the company
3. Company data is sent to GA4 via Measurement Protocol
4. Data appears as user properties in your reports

## Using the Data

### Custom Reports

Create reports filtered by company attributes:

* Sessions by Company Industry
* Conversions by Company Size
* Engagement by Company Country

### Audiences

Build GA4 audiences based on company data:

* Enterprise visitors (500+ employees)
* Technology industry visitors
* Companies in specific regions

### Looker Studio

Connect GA4 to Looker Studio for B2B dashboards combining traffic data with company insights.

## Troubleshooting

> **Dimensions not appearing**
>
> * Custom dimensions can take 24-48 hours to populate in reports
> * Verify the integration shows as connected
> * Check that you have traffic from identified companies

> **Dimension limit reached**
>
> GA4 limits user-scoped dimensions to 25. Remove unused dimensions in GA4 Admin before adding new ones.

> **Permission errors**
>
> You need Admin or Editor access to the GA4 property to create custom dimensions. Ask your GA4 admin to grant access.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.