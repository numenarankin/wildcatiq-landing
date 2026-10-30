> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting Started with Spotter

> Use Snitcher's Spotter API to identify companies visiting your website in real-time for personalization and targeting.

The Spotter API lets you identify the company behind a website visitor in real-time, directly from JavaScript. Use it to personalize your website, show relevant content, or trigger custom workflows based on who's visiting.

## What is Spotter?

Spotter is a client-side JavaScript API that:

* **Identifies companies** visiting your website in real-time
* **Returns rich company data** including industry, size, location, and contact info
* **Works automatically** with the Snitcher tracker once your domains are authorised
* **Integrates natively** with Google Analytics 4

> [!NOTE]
>
> Spotter is included with your Snitcher subscription. It uses the same identification data that powers your dashboard.

## Setup

Before using Spotter, you need to authorise the domains that are allowed to make Spotter API requests. This prevents unauthorised websites from using your identification quota.

1. Go to your [Snitcher Dashboard](https://app.snitcher.com)
2. Navigate to **Settings > Integrations > Spotter**
3. Add the domains you want to authorise (e.g. `*.example.com`)
4. Click **Save**

> [!TIP]
>
> Use a wildcard prefix like `*.example.com` to authorise all subdomains at once, including the root domain itself.

## Access Identification Data

Once your domains are authorised and the Snitcher tracker is installed, you can access identification data in two ways:

#### Option 1: Using `getSpotterIdentification()` (Recommended)

Call the method directly on the Snitcher object:

```javascript theme={null}
// Get identification data
const identification = await Snitcher.getSpotterIdentification();

if (identification && identification.success) {
  console.log("Company:", identification.data.name);
  console.log("Industry:", identification.data.industry);
  console.log("Size:", identification.data.size);
}
```

#### Option 2: Using a Callback

If you prefer a callback-based approach, define `window.SpotterSettings` before the tracker loads:

```html theme={null}
<script>
  // Define callback before Snitcher tracker
  window.SpotterSettings = {
    callback: function(identification) {
      if (identification && identification.type !== "isp") {
        var company = identification.company;
        console.log("Company:", company.name);
      }
    }
  };
</script>

<!-- Snitcher tracking script loads after -->
```

> [!NOTE]
>
> No token or API key is required. Spotter authenticates using the `Origin` header of your request, matched against your [authorised domains](#setup).

## Response Structure

### Successful Identification

When a company is identified, you receive:

```javascript theme={null}
{
  success: true,
  data: {
    uuid: "abc123",
    name: "Acme Corporation",
    website: "acme.com",
    email: "info@acme.com",
    phone: "+1-555-0100",
    industry: "Software",
    founded: 2010,
    size: "51-200 employees",
    logo: "https://...",
    address: {
      street: "Market Street",
      street_number: "123",
      postal_code: "94102",
      city: "San Francisco",
      state: "California",
      country: "United States",
      full_address: "123 Market Street, San Francisco, CA 94102",
      latitude: 37.7749,
      longitude: -122.4194
    },
    profiles: [
      { name: "linkedin", handle: "acme-corp", url: "https://linkedin.com/company/acme-corp" },
      { name: "twitter", handle: "acme", url: "https://twitter.com/acme" }
    ],
    tags: ["Enterprise", "Target Account"],
    segments: [
      { uuid: "seg123", name: "High-Value Prospects" }
    ],
    icp_tier: "A",
    custom_fields: {
      account_owner: "Jane Smith",
      contract_value: 48000,
      is_target_account: true,
      renewal_date: "2026-11-01",
      product_interests: ["Analytics", "Enrichment"]
    }
  }
}
```

The `custom_fields` object contains the custom fields your workspace has chosen to expose to Spotter, as a `key: value` map. The key is omitted when there are none to return.

### Callback Format (Legacy)

If using the callback approach, you receive data in the legacy format:

```javascript theme={null}
{
  type: "business",  // "business" or "isp"
  domain: "acme.com",
  company: {
    name: "Acme Corporation",
    domain: "acme.com",
    industry: "Software",
    employee_range: "51-200 employees",
    founded_year: 2010,
    location: "San Francisco, United States",
    emails: ["info@acme.com"],
    phones: ["+1-555-0100"],
    geo: { /* location details */ },
    profiles: { /* social profiles */ }
  }
}
```

### Unidentified Visitor

When using the callback format, if the visitor can't be identified:

```javascript theme={null}
{
  type: "isp"
}
```

When using `getSpotterIdentification()`:

```javascript theme={null}
{
  success: false,
  message: "No company identified"
}
```

## Common Use Cases

### Personalize Headlines

```javascript theme={null}
const id = await Snitcher.getSpotterIdentification();

if (id?.success) {
  document.querySelector('h1').textContent = 
    `Welcome, ${id.data.name}!`;
}
```

### Show Relevant Content by Industry

```javascript theme={null}
const id = await Snitcher.getSpotterIdentification();

if (id?.success) {
  const industry = id.data.industry;
  
  if (industry.includes("Finance") || industry.includes("Banking")) {
    showCaseStudy('finance');
  } else if (industry.includes("Software") || industry.includes("Technology")) {
    showCaseStudy('tech');
  }
}
```

### Adjust Pricing Display

```javascript theme={null}
const id = await Snitcher.getSpotterIdentification();

if (id?.success) {
  const size = id.data.size;
  
  // Show enterprise pricing for large companies
  if (size.includes("1000") || size.includes("5000") || size.includes("10,000")) {
    document.querySelector('.pricing-toggle').dataset.default = 'enterprise';
  }
}
```

### Track High-Value Visitors

```javascript theme={null}
const id = await Snitcher.getSpotterIdentification();

if (id?.success && isTargetAccount(id.data)) {
  Snitcher.track("Target Account Visit", {
    company_name: id.data.name,
    industry: id.data.industry
  });
  
  // Notify sales team
  notifySalesTeam(id.data);
}
```

## Company Data Reference

| Field | Type | Description |
| - | - | - |
| `name` | string | Company name |
| `website` | string | Primary domain |
| `industry` | string | Industry category |
| `size` | string | Employee range (e.g., "51-200 employees") |
| `founded` | number | Year founded |
| `email` | string | Primary contact email |
| `phone` | string | Primary phone number |
| `address` | object | Full location details |
| `profiles` | array | Social media profiles |
| `tags` | array | Your custom tags |
| `segments` | array | Matching segments |
| `icp_tier` | string \| null | ICP fit tier: one of `A+`, `A`, `B`, `C`, or `D`. `null` if the company hasn't been scored |
| `custom_fields` | object | Map of the custom fields your workspace exposes to Spotter, keyed by field key, each value in its natural JSON type (string, number, boolean, array for multi-select, ISO-8601 string for dates). The key is omitted when there are none |

> [!NOTE]
>
> See [Company Sizes](https://docs.snitcher.com/reference/company-sizes.md) and [Company Industries](https://docs.snitcher.com/reference/company-industries.md) for all possible values.

## Native Integrations

Snitcher can automatically sync identification data to:

> **[Google Analytics 4](https://docs.snitcher.com/product/spotter/example-ga-4.md)**
>
> Sync company data as GA4 user properties

> **[Google Tag Manager](https://docs.snitcher.com/product/spotter/example-tag-manager.md)**
>
> Push data to the dataLayer for GTM

## Best Practices

1. **Handle missing data gracefully**: Not all companies have complete profiles
2. **Don't block page load**: Identification is async; design for delayed data
3. **Cache is automatic**: Data is cached in sessionStorage to avoid repeated calls
4. **Respect privacy**: Don't use identification in ways that might concern visitors

## Troubleshooting

> **Getting a 401 error or no identification data**
>
> * Make sure your domain is listed under **Settings > Integrations > Spotter** in the dashboard
> * If using subdomains, add a wildcard entry like `*.example.com`
> * Changes to authorised domains may take up to 10 minutes to take effect

> **getSpotterIdentification() returns undefined**
>
> * Ensure the tracker is fully initialized before calling
> * Use `Snitcher.on('initialized', callback)` to wait for initialization
> * Check browser console for errors

> **Always getting 'isp' type or success: false**
>
> * Residential/consumer IPs don't identify to companies
> * VPN users may not be identified
> * Test from a business network or office

> **Callback never fires**
>
> * Ensure `SpotterSettings` is defined before the tracking script
> * Consider using `getSpotterIdentification()` instead


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.