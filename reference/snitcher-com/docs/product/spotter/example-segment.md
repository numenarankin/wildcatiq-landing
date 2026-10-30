> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Segment Integration

> Sync company identification data to Segment for use across your analytics stack.

Sync Snitcher's company identification data to Segment.com, making it available across all your connected destinations.

## Using getSpotterIdentification() (Recommended)

The cleanest approach is to call `getSpotterIdentification()` after the tracker initializes:

```javascript theme={null}
// Wait for Snitcher to initialize
Snitcher.on('initialized', async function() {
  const identification = await Snitcher.getSpotterIdentification();
  
  if (identification && identification.success) {
    const data = identification.data;
    
    // Send to Segment as a track event
    analytics.track("Company Identified", {
      company_name: data.name,
      company_domain: data.website,
      company_industry: data.industry,
      company_size: data.size
    });
    
    // Or set as user traits
    analytics.identify({
      company: {
        id: data.uuid,
        name: data.name,
        industry: data.industry,
        employee_count: data.size
      }
    });
  }
});
```

## Using Callback (Legacy)

If you prefer the callback approach, define `SpotterSettings` before the Snitcher script loads:

```html theme={null}
<script>
  window.SpotterSettings = {
    callback: function(identification) {
      // Ignore ISP identifications
      if (identification && identification.type !== "isp") {
        var company = identification.company;

        // Sync to Segment
        analytics.track("Company Identified", {
          company_name: company.name,
          company_domain: company.domain,
          company_industry: company.industry,
          company_size: company.employee_range
        });
      }
    }
  };
</script>

<!-- Snitcher tracking script loads after -->
```

> [!NOTE]
>
> No API token is required. Make sure your domain is [authorised in the Spotter settings](https://docs.snitcher.com/product/spotter/installation.md#setup) before getting started.

## What Data to Send

We recommend tracking these company attributes:

| Segment Property | Snitcher Field | Description |
| - | - | - |
| `company_name` | `data.name` / `company.name` | Company name |
| `company_domain` | `data.website` / `company.domain` | Primary domain |
| `company_industry` | `data.industry` / `company.industry` | Industry category |
| `company_size` | `data.size` / `company.employee_range` | Employee range |

## Use Cases

Once company data flows to Segment, you can:

* **Enrich CRM records** in Salesforce, HubSpot, etc.
* **Personalize experiences** in tools like Intercom or Drift
* **Build audiences** for advertising platforms
* **Power analytics** in Amplitude, Mixpanel, or BigQuery


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.