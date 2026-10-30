> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Google Tag Manager Integration

> Push company identification data to the dataLayer for use in GTM tags and triggers.

Push Snitcher company data to the Google Tag Manager dataLayer, making it available for use in tags, triggers, and variables throughout your GTM container.

## Setup Overview

1. Configure the Spotter callback to push data to the dataLayer
2. Create Data Layer Variables in GTM
3. Use those variables in your tags

## Step 1: Push Data to dataLayer

### Using getSpotterIdentification() (Recommended)

```javascript theme={null}
Snitcher.on('initialized', async function() {
  const identification = await Snitcher.getSpotterIdentification();
  
  if (identification && identification.success) {
    const data = identification.data;
    
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'snitcher_identified',
      snitcher: {
        name: data.name,
        domain: data.website,
        industry: data.industry,
        size: data.size
      }
    });
  }
});
```

### Using Callback (Legacy)

Define `SpotterSettings` before the Snitcher script loads:

```html theme={null}
<script>
  window.SpotterSettings = {
    callback: function(identification) {
      // Ignore ISP identifications
      if (identification && identification.type !== "isp") {
        var company = identification.company;

        // Push to dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'snitcher_identified',
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
</script>

<!-- Snitcher tracking script loads after -->
```

> [!NOTE]
>
> No API token is required. Make sure your domain is [authorised in the Spotter settings](https://docs.snitcher.com/product/spotter/installation.md#setup) before getting started.

## Step 2: Create Data Layer Variables in GTM

1. [Sign in to Google Tag Manager](https://tagmanager.google.com/)
2. Navigate to **Variables** → **User-Defined Variables** → **New**
3. Configure each variable:

| Variable Name | Data Layer Variable Name | Version |
| - | - | - |
| SnitcherCompanyName | snitcher.name | Version 2 |
| SnitcherCompanyDomain | snitcher.domain | Version 2 |
| SnitcherCompanyIndustry | snitcher.industry | Version 2 |
| SnitcherCompanySize | snitcher.size | Version 2 |

For each variable:

* Click **Variable Configuration** → **Data Layer Variable**
* Enter the **Data Layer Variable Name** from the table
* Set **Data Layer Version** to **Version 2**
* Click **Save**

## Step 3: Create a Trigger (Optional)

To fire tags when a company is identified:

1. Go to **Triggers** → **New**
2. Choose **Custom Event**
3. Set **Event name** to `snitcher_identified`
4. Save the trigger

## Using the Variables

Once configured, use `{{"{{SnitcherCompanyName}}"}}`, `{{"{{SnitcherCompanyIndustry}}"}}`, etc. in any tag:

### Example: GA4 Event

Create a GA4 Event tag with these event parameters:

| Parameter Name | Value |
| - | - |
| company\_name | `{{"{{SnitcherCompanyName}}"}}` |
| company\_industry | `{{"{{SnitcherCompanyIndustry}}"}}` |
| company\_size | `{{"{{SnitcherCompanySize}}"}}` |

### Example: LinkedIn Insight Tag

Use company data to build retargeting audiences based on company attributes.

## Available Data

| Variable | Description |
| - | - |
| `snitcher.name` | Company name |
| `snitcher.domain` | Primary domain |
| `snitcher.industry` | Industry category |
| `snitcher.size` | Employee range |

You can extend the callback to include additional fields as needed. See [Spotter API documentation](https://docs.snitcher.com/product/spotter/installation.md) for the full response structure.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.