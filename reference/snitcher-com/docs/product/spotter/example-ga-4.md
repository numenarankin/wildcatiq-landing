> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Google Analytics 4 Integration

> Send company identification data to Google Analytics 4 for enhanced B2B analytics.

Snitcher can automatically sync identified company data to Google Analytics 4, enabling you to build powerful reports, create audiences, and optimize your marketing based on company firmographics.

## Native Integration (Recommended)

Snitcher now offers a **native Google Analytics 4 integration** that requires no code. Company data is automatically synced as GA4 user properties.

### Setup in Dashboard

1. Go to your [Snitcher Dashboard](https://app.snitcher.com)
2. Navigate to **Settings > Workspace > Integrations > Google Analytics**
3. Click **Connect Google Analytics**
4. Authorize Snitcher to access your GA4 property
5. Select your GA4 property and configure which company attributes to sync
6. Save your settings

> [!TIP]
>
> The native integration handles everything automatically - no GTM setup, no custom code, no maintenance.

### What Gets Synced

The integration automatically sends these user properties to GA4:

| User Property | Description |
| - | - |
| `snitcher_company_name` | Company name |
| `snitcher_company_domain` | Company domain |
| `snitcher_company_industry` | Industry category |
| `snitcher_company_size` | Employee count range |

You can customize which attributes are synced and their property names in the dashboard.

### Creating Custom Dimensions in GA4

To use the synced data in reports, create custom dimensions:

1. Sign in to [Google Analytics](https://analytics.google.com/)
2. Navigate to **Admin > Custom definitions > Custom dimensions**
3. Click **Create custom dimension**
4. Configure:
   * **Dimension name**: e.g., "Company Name"
   * **Scope**: User
   * **User property**: e.g., `snitcher_company_name`
5. Click **Save**

Repeat for each attribute you want to use in reports.

### Use Cases

With company data in GA4, you can:

* **Build B2B reports**: Analyze traffic and conversions by company size or industry
* **Create audiences**: Target enterprise companies or specific industries in Google Ads
* **Segment behavior**: Compare how different company types engage with your site
* **Optimize campaigns**: Exclude competitors or low-value segments from ad spend

***

## Manual Integration (Advanced)

If you need custom control over how data flows to GA4, you can use the Spotter callback method.

> [!NOTE]
>
> The manual approach requires more maintenance and is only recommended for advanced use cases where the native integration doesn't meet your needs.

### Using Data Layer Variables

Push company data to the dataLayer for use in Google Tag Manager:

```javascript theme={null}
// Define the callback before Snitcher loads
window.SpotterSettings = {
  callback: function(identification) {
    if (identification && identification.type !== "isp") {
      var company = identification.company;
      
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "snitcher_identified",
        snitcher: {
          name: company.name,
          domain: company.domain,
          industry: company.industry,
          size: company.employee_range
        }
      });
    }
  }
};
```

Then in GTM:

1. Create Data Layer Variables for each property
2. Create a trigger for the `snitcher_identified` event
3. Configure your GA4 tag to send user properties using those variables

### Using getSpotterIdentification()

For more control, call the method directly after the tracker initializes:

```javascript theme={null}
// Wait for tracker to initialize
Snitcher.on('initialized', async function() {
  const identification = await Snitcher.getSpotterIdentification();
  
  if (identification && identification.success) {
    gtag('set', 'user_properties', {
      company_name: identification.data.name,
      company_industry: identification.data.industry,
      company_size: identification.data.size
    });
  }
});
```

***

## Viewing Data in GA4

Once configured, company data appears in:

* **Reports > User > User attributes**: See user property values
* **Explore**: Create custom explorations with company dimensions
* **Audiences**: Build audiences based on company attributes

> [!NOTE]
>
> It may take 24-48 hours for new custom dimensions to appear in GA4 reports.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.