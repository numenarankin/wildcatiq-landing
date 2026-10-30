> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Filter Fields Reference

> A complete reference of all available filter fields and their supported values for the advanced organisation filters endpoint.

When using the **List organisations using advanced filters** endpoint (see API Reference), you can filter on the following fields.

## Company Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `company.name` | string | The company's name | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with`, `set`, `not_set` |
| `company.website` | string | The company's website/domain | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with`, `set`, `not_set` |
| `company.industry` | string | The company's industry classification | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `company.size` | string | The company's employee count range | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `company.country` | string | The company's country (ISO 3166-1 code) | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `company.state` | string | The company's state/region | `equal`, `not_equal`, `contains`, `set`, `not_set` |
| `company.city` | string | The company's city | `equal`, `not_equal`, `contains`, `set`, `not_set` |
| `company.address` | string | The company's address | `equal`, `not_equal`, `contains`, `set`, `not_set` |
| `company.current_technologies.name` | string | Technologies used by the company | `equal`, `not_equal`, `in`, `not_in`, `contains`, `set`, `not_set` |
| `company.keywords` | string | Keywords associated with the company | `contains`, `not_contains` |

## Organisation Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `tag` | string | Tags assigned to the organisation | `equal`, `not_equal`, `in`, `not_in`, `contains`, `not_contains` |
| `account_list` | string | Account list membership | `equal`, `not_equal`, `in`, `not_in` |

## Activity & Visit Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `first_seen` | date | When the organisation was first seen | `equal`, `greater_than`, `less_than`, `between` |
| `last_seen` | date | When the organisation was last seen | `equal`, `greater_than`, `less_than`, `between` |
| `visited_at` | date | Visit date (for date range filtering) | `equal`, `greater_than`, `less_than`, `between` |
| `sessions` | number | Number of sessions | `equal`, `not_equal`, `greater_than`, `less_than`, `between` |
| `pageviews` | number | Number of pageviews | `equal`, `not_equal`, `greater_than`, `less_than`, `between` |
| `time_on_site` | number | Time spent on site (in seconds) | `equal`, `not_equal`, `greater_than`, `less_than`, `between` |
| `url` | string | Full URLs visited | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with` |
| `page` | string | Page paths visited | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with` |
| `entry_page` | string | Entry page path | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with` |
| `exit_page` | string | Exit page path | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with` |
| `first_touch` | string | First touch URL | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with` |
| `last_touch` | string | Last touch URL | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with` |
| `referrer` | string | Referrer URL | `equal`, `not_equal`, `contains`, `not_contains`, `starts_with`, `doesnt_start_with`, `set`, `not_set` |

## UTM Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `utm.source` | string | UTM source parameter | `equal`, `not_equal`, `contains`, `in`, `not_in`, `set`, `not_set` |
| `utm.medium` | string | UTM medium parameter | `equal`, `not_equal`, `contains`, `in`, `not_in`, `set`, `not_set` |
| `utm.campaign` | string | UTM campaign parameter | `equal`, `not_equal`, `contains`, `in`, `not_in`, `set`, `not_set` |
| `utm.term` | string | UTM term parameter | `equal`, `not_equal`, `contains`, `in`, `not_in`, `set`, `not_set` |
| `utm.content` | string | UTM content parameter | `equal`, `not_equal`, `contains`, `in`, `not_in`, `set`, `not_set` |

## Device Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `device.type` | string | Device type (e.g., `desktop`, `mobile`, `tablet`) | `equal`, `not_equal`, `in`, `not_in` |
| `device.browser` | string | Browser name | `equal`, `not_equal`, `in`, `not_in`, `contains` |
| `device.operating_system` | string | Operating system | `equal`, `not_equal`, `in`, `not_in`, `contains` |

## Visitor Location Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `visitor.country` | string | Visitor's country (ISO 3166-1 code) | `equal`, `not_equal`, `in`, `not_in` |
| `visitor.state` | string | Visitor's state/region | `equal`, `not_equal`, `contains`, `in`, `not_in` |
| `visitor.city` | string | Visitor's city | `equal`, `not_equal`, `contains`, `in`, `not_in` |

## CRM Integration Fields

### HubSpot Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `hubspot.synced` | boolean | Whether synced to HubSpot | `equal` |
| `hubspot.deal_owner` | string | HubSpot deal owner name | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `hubspot.deal_stage` | string | HubSpot deal stage | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `hubspot.deal_name` | string | HubSpot deal name | `equal`, `not_equal`, `contains`, `set`, `not_set` |
| `hubspot.company_type` | string | HubSpot company type | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `hubspot.company_owner` | string | HubSpot company owner name | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `hubspot.company_life_cycle_stage` | string | HubSpot company lifecycle stage | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |

### Other CRM Sync Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `salesforce.synced` | boolean | Whether synced to Salesforce | `equal` |
| `dynamics.synced` | boolean | Whether synced to Microsoft Dynamics | `equal` |
| `pipedrive.synced` | boolean | Whether synced to Pipedrive | `equal` |
| `zoho.synced` | boolean | Whether synced to Zoho | `equal` |

### Deal Fields

| Field | Type | Description | Supported Comparisons |
| - | - | - | - |
| `deal_stage` | string | Deal stage | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `deal_owner` | string | Deal owner | `equal`, `not_equal`, `in`, `not_in`, `set`, `not_set` |
| `deal_name` | string | Deal name | `equal`, `not_equal`, `contains`, `set`, `not_set` |

***

## Supported Field Values

### Industry Values

For the `company.industry` field, use one of the industry names from the [Company Industries](https://docs.snitcher.com/reference/company-industries.md) reference table.

**Example values:**

* `Computer Software`
* `Financial Services`
* `Marketing and Advertising`
* `Information Technology and Services`

> **View all industry values**
>
> See the full list of supported industry values in the [Company Industries](https://docs.snitcher.com/reference/company-industries.md) reference table.

### Size Values

For the `company.size` field, use one of the following exact values:

| Value |
| - |
| `Self-employed` |
| `1-10 employees` |
| `11-50 employees` |
| `51-200 employees` |
| `201-500 employees` |
| `501-1000 employees` |
| `1001-5000 employees` |
| `5001-10,000 employees` |
| `10,001+ employees` |

> [!TIP]
>
> See the [Company Sizes](https://docs.snitcher.com/reference/company-sizes.md) reference table for more details.

### Country Values

For the `company.country` and `visitor.country` fields, use ISO 3166-1 alpha-2 country codes.

**Example values:**

* `US` (United States)
* `GB` (United Kingdom)
* `DE` (Germany)
* `NL` (Netherlands)

> [!TIP]
>
> See the [Countries](https://docs.snitcher.com/reference/countries.md) reference table for the complete list of supported country codes.

***

## Filter Examples

### Filter by Industry

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company.industry",
        "comparison": "equal",
        "value": "Computer Software"
      }
    ]
  }
}
```

### Filter by Multiple Countries

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company.country",
        "comparison": "in",
        "value": ["US", "GB", "DE"]
      }
    ]
  }
}
```

### Filter by Company Size Range

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company.size",
        "comparison": "in",
        "value": ["51-200 employees", "201-500 employees", "501-1000 employees"]
      }
    ]
  }
}
```

### Filter by Company Name

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company.name",
        "comparison": "contains",
        "value": "Tech"
      }
    ]
  }
}
```

### Complex Filter with Multiple Conditions

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company.industry",
        "comparison": "in",
        "value": ["Computer Software", "Information Technology and Services"]
      },
      {
        "field": "company.size",
        "comparison": "in",
        "value": ["51-200 employees", "201-500 employees"]
      },
      {
        "field": "company.country",
        "comparison": "equal",
        "value": "US"
      }
    ]
  }
}
```

### Filter by Recent Activity

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "last_seen",
        "comparison": "greater_than",
        "value": 7,
        "unit": "day"
      }
    ]
  }
}
```

### Filter by UTM Campaign

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "utm.source",
        "comparison": "equal",
        "value": "google"
      },
      {
        "field": "utm.campaign",
        "comparison": "contains",
        "value": "summer-sale"
      }
    ]
  }
}
```

### Filter by Page Visits

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "page",
        "comparison": "contains",
        "value": "/pricing"
      }
    ]
  }
}
```

### Nested Filter Groups (OR within AND)

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company.size",
        "comparison": "in",
        "value": ["201-500 employees", "501-1000 employees"]
      },
      {
        "operator": "OR",
        "conditions": [
          {
            "field": "company.country",
            "comparison": "equal",
            "value": "US"
          },
          {
            "field": "company.country",
            "comparison": "equal",
            "value": "GB"
          }
        ]
      }
    ]
  }
}
```

### Filter by HubSpot Sync Status

```json theme={null}
{
  "filters": {
    "operator": "AND",
    "conditions": [
      {
        "field": "hubspot.synced",
        "comparison": "equal",
        "value": false
      },
      {
        "field": "company.size",
        "comparison": "in",
        "value": ["51-200 employees", "201-500 employees"]
      }
    ]
  }
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.