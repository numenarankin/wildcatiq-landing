> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# REST API Introduction

> Access your Snitcher data programmatically using our REST API for integrations, automation, and custom workflows.

The Snitcher REST API allows you to programmatically access and manage your Snitcher data. Use it to build custom integrations, automate workflows, or sync data with your other business tools.

## Authentication

All API requests require authentication using a Personal Access Token (PAT) passed as a Bearer token.

### Generate an API Token

1. Go to your [Snitcher Dashboard](https://app.snitcher.com)
2. Navigate to **Settings > Account > API**
3. Click **Generate New Token**
4. Copy and securely store your token

> [!WARNING]
>
> Treat your API token like a password. Never expose it in client-side code or public repositories.

### Making Authenticated Requests

Include your token in the `Authorization` header:

```bash theme={null}
curl -X GET 'https://api.snitcher.com/v1/workspaces' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Accept: application/json'
```

## Base URL

All API endpoints use this base URL:

```
https://api.snitcher.com/v1
```

## Rate Limits

To ensure fair usage and platform stability, the REST API enforces the following rate limits:

* **60 requests per minute** (per API token)

When you exceed the rate limit, the API returns:

```json theme={null}
{
  "message": "Too Many Attempts."
}
```

**Status Code:** `429 Too Many Requests`

> [!TIP]
>
> Implement exponential backoff in your application to handle rate limiting gracefully. Start with a 1-second delay, then double it on each retry.

> [!NOTE]
>
> Need higher rate limits? Contact support to discuss your requirements.

## Response Format

All responses are JSON. Successful responses include the requested data:

```json theme={null}
{
  "data": {
    // Response data
  }
}
```

Error responses include a message:

```json theme={null}
{
  "message": "Error description",
  "errors": {
    "field": ["Validation error"]
  }
}
```

## Common HTTP Status Codes

| Status | Description |
| - | - |
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `422` | Validation Error - Check `errors` object |
| `429` | Rate Limited - Too many requests |
| `500` | Server Error - Contact support |

## Available Endpoints

The REST API provides access to:

> **Workspaces**
>
> List, create, and manage your workspaces

> **Organisations**
>
> Access identified companies and their data

> **Sessions**
>
> Retrieve visitor session data

> **Contacts**
>
> Access contacts and reveal emails or phone numbers

> **Segments**
>
> List and manage segments

> **Tags**
>
> Create and manage company tags

## Example: List Workspaces

```bash theme={null}
curl -X GET 'https://api.snitcher.com/v1/workspaces' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Accept: application/json'
```

**Response:**

```json theme={null}
{
  "data": [
    {
      "uuid": "ws_abc123",
      "name": "My Website",
      "url": "https://example.com",
      "status": "active"
    }
  ]
}
```

## Example: Get Sessions with Events

Sessions now include an `events` array containing all tracking events (pageviews, form submissions, custom events, clicks, and downloads). The `views` array is deprecated and only contains pageviews.

```bash theme={null}
curl -X GET 'https://api.snitcher.com/v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/sessions?date=2025-03-01' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Accept: application/json'
```

**Response (abbreviated):**

```json theme={null}
{
  "data": [
    {
      "uuid": "...",
      "organisation_uuid": "...",
      "started_at": "2025-03-01T10:00:00+00:00",
      "ended_at": "2025-03-01T10:05:00+00:00",
      "events": [
        {
          "event_type": "pageview",
          "url": "https://acme.com/pricing",
          "triggered_at": "2025-03-01T10:00:00+00:00",
          "time_on_page": 45
        },
        {
          "event_type": "form_submit",
          "url": "https://acme.com/contact",
          "triggered_at": "2025-03-01T10:02:00+00:00",
          "form_id": "contact-form",
          "form_name": "Contact Form",
          "fields": [
            { "name": "email", "value": "j@acme.com" }
          ]
        },
        {
          "event_type": "track",
          "url": "https://acme.com/pricing",
          "triggered_at": "2025-03-01T10:03:00+00:00",
          "name": "plan_selected",
          "properties": [
            { "name": "plan", "value": "enterprise" }
          ]
        },
        {
          "event_type": "click",
          "url": "https://acme.com/page",
          "triggered_at": "2025-03-01T10:04:00+00:00",
          "name": "CTA Button",
          "properties": [
            { "name": "elementText", "value": "Get Started" }
          ]
        },
        {
          "event_type": "download",
          "url": "https://acme.com/whitepaper.pdf",
          "triggered_at": "2025-03-01T10:05:00+00:00",
          "name": "$download",
          "properties": [
            { "name": "url", "value": "https://acme.com/whitepaper.pdf" }
          ]
        }
      ],
      "views": [
        {
          "url": "https://acme.com/pricing",
          "visited_at": "2025-03-01T10:00:00+00:00",
          "time_on_page": 45
        }
      ]
    }
  ]
}
```

Each event has a common `event_type`, `url`, and `triggered_at` field. Additional fields depend on the event type:

| Event Type | Additional Fields |
| - | - |
| `pageview` | `time_on_page` |
| `form_submit` | `form_id`, `form_name`, `fields` |
| `track` | `name`, `properties` |
| `click` | `name`, `properties` |
| `download` | `name`, `properties` |

## Example: Get Organisations

```bash theme={null}
curl -X GET 'https://api.snitcher.com/v1/workspaces/{workspaceUuid}/organisations' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Accept: application/json'
```

## Pagination

List endpoints support pagination using query parameters:

| Parameter | Type | Default | Description |
| - | - | - | - |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 25 | Items per page (max 100) |

```bash theme={null}
curl -X GET 'https://api.snitcher.com/v1/workspaces/{workspaceUuid}/organisations?page=2&per_page=50' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Accept: application/json'
```

## Filtering & Searching

Many endpoints support filtering. Use the `POST` method with a JSON body for advanced searches:

```bash theme={null}
curl -X POST 'https://api.snitcher.com/v1/workspaces/{workspaceUuid}/organisations' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "filters": {
      "industry": "Software",
      "size": ["51-200 employees", "201-500 employees"]
    }
  }'
```

## SDK & Libraries

While we don't provide official SDK libraries, the REST API is straightforward to use with any HTTP client:

* **JavaScript/Node.js**: `fetch`, `axios`
* **Python**: `requests`, `httpx`
* **PHP**: `Guzzle`, `cURL`
* **Ruby**: `HTTParty`, `Faraday`

## Best Practices

1. **Store tokens securely**: Use environment variables, not hardcoded values
2. **Handle rate limits**: Implement retry logic with exponential backoff
3. **Cache responses**: Reduce API calls by caching data locally when appropriate
4. **Use pagination**: Don't try to fetch all data in one request
5. **Monitor usage**: Track your API usage to stay within limits

## Need Help?

> **[API Reference](https://docs.snitcher.com/product/rest-api/introduction.md)**
>
> Browse the full API documentation

> **[Support](https://app.snitcher.com)**
>
> Contact our support team


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.