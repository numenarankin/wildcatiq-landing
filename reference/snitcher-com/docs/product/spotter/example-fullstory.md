> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Fullstory Integration

> Enrich Fullstory session recordings with company identification data.

Enrich your Fullstory session recordings with company data from Snitcher, allowing you to filter and search sessions by company attributes.

> [!NOTE]
>
> Fullstory requires specific naming conventions for custom properties. We use the `_str` suffix for string values as per their [property name requirements](https://help.fullstory.com/hc/en-us/articles/360020623234#Custom%20Property%20Name%20Requirements).

## Using getSpotterIdentification() (Recommended)

Call `getSpotterIdentification()` after the tracker initializes:

```javascript theme={null}
Snitcher.on('initialized', async function() {
  const identification = await Snitcher.getSpotterIdentification();
  
  if (identification && identification.success) {
    const data = identification.data;
    
    // Set Fullstory user vars
    FS.setUserVars({
      snitcher_company_name_str: data.name,
      snitcher_company_domain_str: data.website,
      snitcher_company_industry_str: data.industry,
      snitcher_company_size_str: data.size
    });
  }
});
```

## Using Callback (Legacy)

Define `SpotterSettings` before the Snitcher script loads:

```html theme={null}
<script>
  window.SpotterSettings = {
    callback: function(identification) {
      // Ignore ISP identifications
      if (identification && identification.type !== "isp") {
        const company = identification.company;

        // Sync to Fullstory
        FS.setUserVars({
          snitcher_company_name_str: company.name,
          snitcher_company_domain_str: company.domain,
          snitcher_company_industry_str: company.industry,
          snitcher_company_size_str: company.employee_range
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

## Available Properties

All string properties should use the `_str` suffix:

| Fullstory Property | Snitcher Field | Description |
| - | - | - |
| `snitcher_company_name_str` | `name` | Company name |
| `snitcher_company_domain_str` | `website` / `domain` | Primary domain |
| `snitcher_company_industry_str` | `industry` | Industry category |
| `snitcher_company_size_str` | `size` / `employee_range` | Employee range |

## Using in Fullstory

Once configured, you can:

1. **Search sessions** by company name or industry
2. **Create segments** for enterprise companies or specific industries
3. **Filter recordings** to focus on target accounts
4. **Build funnels** segmented by company size


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.