> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> The Snitcher IP to Company API allows you to identify companies based on IP addresses, providing detailed business insights for B2B use cases.

> [!WARNING]
>
> **Please Note:** The IP 2 Company API is a standalone offering and is not included with our standard product plans. If you'd like to purchase or learn more about IP 2 Company,
> please answer a few quick questions so our team can reach out.

## Authentication

Authentication is done via the API key which will be provided to you separately.

Requests are authenticated by passing your API key as a bearer token in an `Authorization` header.

```bash theme={null}
curl --location --request POST 'https://api.snitcher.com/company/find?ip={IP}' \
--header 'Authorization: Bearer {key}' \
--header 'Accept: application/json'
```

## Rate Limits

* **600 requests per minute**

> [!NOTE]
>
> Higher rate limits can be enabled on your account upon request. These are typically included within your contract terms.

## Input Methods

You can identify a company in two ways. Pick the one that matches how you've integrated Snitcher:

| Input | When to use | Endpoint |
| - | - | - |
| **IP address** | You have the visitor's IP address and aren't running Radar. | `POST /company/find?ip={IP}` |
| **Session ID** | You're also running [Radar](https://docs.snitcher.com/powered-by-snitcher/radar/introduction.md) and have a visitor's `session_uuid`. | `POST /radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find` |

> [!TIP]
>
> **Running Radar? Prefer the session ID.** A session lookup resolves the visitor through Radar's fingerprinting model rather than the IP alone, which yields a higher match rate than a raw IP lookup.

### By IP Address

Send the IP address as the `ip` query parameter. This is the default method described throughout this page.

```bash theme={null}
curl --location --request POST 'https://api.snitcher.com/company/find?ip={IP}' \
--header 'Authorization: Bearer {key}' \
--header 'Accept: application/json'
```

### By Session ID

When you also run Radar, every visitor session has a `session_uuid`. Pass it to the Radar identification endpoint to identify the company behind that session. See [Receiving Events](https://docs.snitcher.com/powered-by-snitcher/radar/receiving-events.md) for how session IDs are generated and delivered.

```bash theme={null}
curl --location --request POST 'https://api.snitcher.com/radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find' \
--header 'Authorization: Bearer {key}' \
--header 'Content-Type: application/json' \
--data '{
  "session_uuid": "42b7c5e0-76c0-4f8d-9b7c-6b8e1a2d3f45"
}'
```

> [!WARNING]
>
> **Session IDs are short-lived.** By default this lookup only covers sessions from the **last 2 days**. To identify an older session, add the optional `since` field — an ISO 8601 date (UTC) naming the day the session took place. The date may be up to **30 days** in the past and cannot be in the future. Requests for a session that falls outside the queried window won't match.
>
> ```bash theme={null}
> curl --location --request POST 'https://api.snitcher.com/radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find' \
> --header 'Authorization: Bearer {key}' \
> --header 'Content-Type: application/json' \
> --data '{
>   "session_uuid": "42b7c5e0-76c0-4f8d-9b7c-6b8e1a2d3f45",
>   "since": "2026-05-11"
> }'
> ```

## Endpoint

The API endpoint is as follows:

```
https://api.snitcher.com/company/find?ip={IP}
```

## Example Request

Here is an example of a curl request to this endpoint:

```bash theme={null}
curl --location --request POST 'https://api.snitcher.com/company/find?ip={IP}' \
--header 'Authorization: Bearer {key}' \
--header 'Accept: application/json'
```

## Response Codes

The Snitcher API uses standard HTTP status codes to indicate the success or failure of an API request. Below are examples of different responses you may encounter:

### HTTP 429 - Rate Limit Exceeded

```json theme={null}
{
  "message": "Too Many Attempts."
}
```

### HTTP 403 - Quota Exceeded

```json theme={null}
{
  "message": "You have exceeded your allowed quota. Please upgrade to a plan that allows more volume or wait for your billing cycle to reset."
}
```

### HTTP 202 - Enrichment Queued

```json theme={null}
{
  "status": 202,
  "message": "Queued for enrichment. Please retry this request in a few seconds."
}
```

### HTTP 200 - Identified Company Response

```json theme={null}
{
  "ip": "127.0.0.1",
  "fuzzy": true,
  "domain": "snitcher.com",
  "type": "business",
  "company": {
    "name": "Snitcher",
    "domain": "snitcher.com",
    "website": "https://snitcher.com",
    "industry": "Information Technology and Services",
    "founded_year": "2015",
    "employee_range": "2-10 employees",
    "annual_revenue": 2000000,
    "total_funding": null,
    "location": "Oude Enghweg 2, 1217 JC Hilversum, Netherlands",
    "description": "Snitcher supports B2B teams by identifying the company's anonymous website visitors work for.",
    "phone": "+1 (120) 261-5475",
    "geo": {
      "country": "Netherlands",
      "country_code": "NL",
      "state": "Noord-Holland",
      "state_code": "NH",
      "postal_code": "1217 JC",
      "city": "Hilversum",
      "street": "Oude Enghweg",
      "street_number": "2"
    },
    "profiles": {
      "crunchbase": {
        "handle": "snitcher",
        "url": "https://crunchbase.com/organization/snitcher"
      },
      "linkedin": {
        "handle": "snitcher",
        "url": "https://linkedin.com/companies/snitcher"
      }
    }
  },
  "geoIP": {
    "country": "Netherlands",
    "country_code": "NL",
    "city": "Almere Stad",
    "state": "Flevoland"
  }
}
```

### **HTTP 404 - Non-Identified Response (ISP)**

```json theme={null}
{
  "ip": "223.19.38.219",
  "fuzzy": false,
  "domain": null,
  "type": "isp",
  "geoIP": {
    "country": "Hong Kong",
    "country_code": "HK",
    "city": "Hong Kong",
    "state": "Hong Kong"
  }
}
```

## Checking Usage

The API endpoint is as follows:

```
https://api.snitcher.com/company/usage
```

### **HTTP 200 - Example Response**

```json theme={null}
{
  "status": "trial",
  "credits": {
    "total": 100,
    "used": 0,
    "remaining": 100
  },
  "billing_cycle": {
    "starts_at": "2025-03-23T14:10:04.000000Z",
    "ends_at": "2025-04-23T14:10:04.000000Z"
  }
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.