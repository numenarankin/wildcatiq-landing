> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Receiving Events

> Deliver Radar events to your backend via webhooks.

Radar delivers tracked data to your backend using webhooks. Before you can receive events, you must configure a webhook endpoint. You can choose between two delivery modes depending on your use case.

## Choosing a Delivery Mode

> **Event-Based Delivery**
>
> Events are pushed to your webhook **as they occur**, in near real-time.
>
> **Pros:**
>
> * Low latency for real-time applications.
> * Immediate access to individual events.
>
> **Tradeoffs:**
>
> * Requires you to perform session stitching.
> * You must calculate session-level metrics (like time on page).

> **Session-Based Delivery (Recommended)**
>
> Events are grouped by session and sent in a single payload **after the session ends** (typically 30 minutes of inactivity).
>
> **Pros:**
>
> * Session metrics are pre-computed for you.
> * Data is fully enriched and ready for analysis.
> * Simpler to process and store.

> [!NOTE]
>
> Event-based and session-based payloads share the same structure. The difference is that event-based payloads contain a single event in the `events` array and are sent in near real-time, while session-based payloads contain all events from the session and are sent after 30 minutes of inactivity.

### Selecting your delivery mode

Set the delivery mode with the `event_aggregation` field (`per_session` or `per_event`) on the [webhook configuration endpoint](https://docs.snitcher.com/powered-by-snitcher/radar-api-reference). See the API Reference for the request and response details.

> [!TIP]
>
> Need an identification **during** a session rather than waiting for a webhook? Call the **Identify company for a session** endpoint (`POST /radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find`) with the visitor's `session_uuid`.
>
> By default this lookup only covers sessions from the **last 2 days**. To identify an older session, pass the optional `since` field — an ISO 8601 date (UTC) naming the day the session took place. The lookup is then scoped to that single calendar day. The date may be up to 30 days in the past and cannot be in the future.
>
> ```bash cURL theme={null}
> curl -X POST 'https://api.snitcher.com/radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find' \
>      -H 'Authorization: Bearer YOUR_API_KEY' \
>      -H 'Content-Type: application/json' \
>      -d '{
>        "session_uuid": "42b7c5e0-76c0-4f8d-9b7c-6b8e1a2d3f45",
>        "since": "2026-05-11"
>      }'
> ```

***

## Example: Pageview Event (Session-Based)

This example shows a session payload containing a single `$pageview` event. Note the enriched context and pre-computed engagement times.

```json Pageview Event expandable theme={null}
{
  "internal_identifier": "my-customer-id",
  "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2025-06-16T13:00:00+00:00",
  "last_activity": "2025-06-16T13:15:42+00:00",
  "engagement_time": 937,
  "user_properties": {
    "$uuid": "anonymous-user-4455"
  },
  "events": [
    {
      "event_uuid": "89ab1234-cdef-5678-9012-3456789abcde",
      "event_name": "$pageview",
      "created_at": "2025-06-16T13:02:17+00:00",
      "context": {
        "type": "browser",
        "geo": {
          "ip": "192.0.2.45",
          "country": "Germany",
          "region": "Berlin",
          "city": "Berlin"
        },
        "device_uuid": "device-789",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "browser": {
          "name": "Chrome",
          "version": "122.0.0.0"
        },
        "device": {
          "type": "Desktop",
          "operating_system": "Windows",
          "operating_system_version": "10"
        },
        "referrer": {
          "scheme": "https",
          "host": "newsletter.example.com",
          "path": "/latest",
          "query": "utm_source=newsletter&utm_medium=email",
          "fragment": "section-2"
        },
        "utm": {
          "source": "newsletter",
          "medium": "email",
          "campaign": "june-product-update",
          "content": "cta-button",
          "term": "conversion"
        },
        "page": {
          "url": "https://app.example.com/dashboard?view=analytics",
          "title": "User Dashboard - Analytics Overview",
          "engagement_time": 542
        }
      },
      "event_properties": {
        "$url": "https://app.example.com/dashboard?view=analytics",
        "$title": "User Dashboard - Analytics Overview",
        "$scheme": "https",
        "$host": "app.example.com",
        "$path": "/dashboard",
        "$query": {
          "view": "analytics"
        },
        "$fragment": "section-2",
        "$total_time_on_page": 937,
        "$engaged_time_on_page": 542
      },
      "user_properties": {
        "$uuid": "anonymous-user-4455"
      },
      "meta": {
        "library": {
          "name": "radar.js",
          "version": "1.8.0"
        }
      }
    }
  ]
}
```

## Example: Identified Visitor (Session-Based)

When a visitor is identified — for example via the [`identify`](https://docs.snitcher.com/powered-by-snitcher/radar/javascript-sdk#identify) SDK method or an `sn_email` query parameter — `user_properties` includes their `$email` and any `$traits` at both the session and event level.

```json Identified Visitor expandable theme={null}
{
  "internal_identifier": "my-customer-id",
  "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2025-06-16T13:00:00+00:00",
  "last_activity": "2025-06-16T13:15:42+00:00",
  "engagement_time": 937,
  "user_properties": {
    "$uuid": "anonymous-user-4455",
    "$email": "jane.doe@example.com",
    "first_name": "Jane",
    "title": "VP Marketing"
  },
  "events": [
    {
      "event_uuid": "89ab1234-cdef-5678-9012-3456789abcde",
      "event_name": "$pageview",
      "created_at": "2025-06-16T13:02:17+00:00",
      "context": {
        "type": "browser",
        "geo": {
          "ip": "192.0.2.45",
          "country": "Germany",
          "region": "Berlin",
          "city": "Berlin"
        },
        "device_uuid": "device-789",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "browser": {
          "name": "Chrome",
          "version": "122.0.0.0"
        },
        "device": {
          "type": "Desktop",
          "operating_system": "Windows",
          "operating_system_version": "10"
        },
        "referrer": {
          "scheme": "https",
          "host": "newsletter.example.com",
          "path": "/latest",
          "query": "utm_source=newsletter&utm_medium=email",
          "fragment": null
        },
        "utm": {
          "source": "newsletter",
          "medium": "email",
          "campaign": "june-product-update",
          "content": "cta-button",
          "term": null
        },
        "page": {
          "url": "https://app.example.com/pricing?sn_email=jane.doe@example.com&sn_trait_first_name=Jane&sn_trait_title=VP+Marketing",
          "title": "Pricing - Plans for Every Team",
          "engagement_time": 542
        }
      },
      "event_properties": {
        "$url": "https://app.example.com/pricing?sn_email=jane.doe@example.com&sn_trait_first_name=Jane&sn_trait_title=VP+Marketing",
        "$title": "Pricing - Plans for Every Team",
        "$scheme": "https",
        "$host": "app.example.com",
        "$path": "/pricing",
        "$query": {
          "sn_email": "jane.doe@example.com",
          "sn_trait_first_name": "Jane",
          "sn_trait_title": "VP Marketing"
        },
        "$fragment": null,
        "$total_time_on_page": 937,
        "$engaged_time_on_page": 542
      },
      "user_properties": {
        "$uuid": "anonymous-user-4455",
        "$email": "jane.doe@example.com",
        "$traits": {
          "first_name": "Jane",
          "title": "VP Marketing"
        }
      },
      "meta": {
        "library": {
          "name": "radar.js",
          "version": "1.8.0"
        }
      }
    }
  ]
}
```

## Example: Form Submit Event (Session-Based)

This example shows how a form submit event appears in a session payload.

```json Form Submit Event expandable theme={null}
{
  "internal_identifier": "my-customer-id",
  "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2025-06-16T13:00:00+00:00",
  "last_activity": "2025-06-16T13:15:42+00:00",
  "engagement_time": 937,
  "user_properties": {
    "$uuid": "pirate-user-456"
  },
  "events": [
    {
      "event_uuid": "89ab1234-cdef-5678-9012-3456789abcde",
      "event_name": "$form_submit",
      "created_at": "2025-06-16T13:02:17+00:00",
      "context": {
        "type": "browser",
        "geo": {
          "ip": "198.51.100.23",
          "country": "Netherlands",
          "region": "North Holland",
          "city": "Amsterdam"
        },
        "device_uuid": "pirate-device-789",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
        "browser": {
          "name": "Safari",
          "version": "16.4"
        },
        "device": {
          "type": "Desktop",
          "operating_system": "macOS",
          "operating_system_version": "12.6.1"
        },
        "page": {
          "url": "https://www.example.com/pricing",
          "title": "Pricing - Plans for Every Team",
          "engagement_time": 542
        }
      },
      "event_properties": {
        "$form_id": "contact-form",
        "$form_name": "Contact us",
        "$fields": [
          {
            "$name": "full_name",
            "$type": "text",
            "$tag_name": "input",
            "$value": "Jane Doe"
          },
          {
            "$name": "email",
            "$type": "email",
            "$tag_name": "input",
            "$value": "jane.doe@example.com"
          },
          {
            "$name": "message",
            "$type": "textarea",
            "$tag_name": "textarea",
            "$value": "I'd like to learn more about your pricing options."
          }
        ]
      },
      "meta": {
        "library": {
          "name": "radar.js",
          "version": "1.8.0"
        }
      }
    }
  ]
}
```

## Example: Custom Event (Session-Based)

This example shows how a custom `track` event appears in a session payload. The data from the second argument of the `track` call is nested inside `event_properties`.

```json Custom Event expandable theme={null}
{
  "internal_identifier": "my-customer-id",
  "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2025-06-16T13:00:00+00:00",
  "last_activity": "2025-06-16T13:15:42+00:00",
  "engagement_time": 937,
  "user_properties": {
    "$uuid": "pirate-user-456"
  },
  "events": [
    {
      "event_uuid": "89ab1234-cdef-5678-9012-3456789abcde",
      "event_name": "CTA_clicked",
      "created_at": "2025-06-16T13:02:17+00:00",
      "context": {
        "type": "browser",
        "geo": {
          "ip": "198.51.100.23",
          "country": "Netherlands",
          "region": "North Holland",
          "city": "Amsterdam"
        },
        "device_uuid": "pirate-device-789",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
        "browser": {
          "name": "Safari",
          "version": "16.4"
        },
        "device": {
          "type": "Desktop",
          "operating_system": "macOS",
          "operating_system_version": "12.6.1"
        },
        "page": {
          "url": "https://www.example.com/pricing",
          "title": "Pricing - Plans for Every Team",
          "engagement_time": 542
        }
      },
      "event_properties": {
        "cta_text": "Try for free",
        "cta_position": "navbar-right"
      },
      "meta": {
        "library": {
          "name": "radar.js",
          "version": "1.8.0"
        }
      }
    }
  ]
}
```

## Example: Click Event (Session-Based)

This example shows how a click event appears in a session payload when `clickTracking` is enabled.

```json Click Event expandable theme={null}
{
  "internal_identifier": "my-customer-id",
  "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2025-06-16T13:00:00+00:00",
  "last_activity": "2025-06-16T13:15:42+00:00",
  "engagement_time": 937,
  "user_properties": {
    "$uuid": "pirate-user-456"
  },
  "events": [
    {
      "event_uuid": "89ab1234-cdef-5678-9012-3456789abcde",
      "event_name": "$click",
      "created_at": "2025-06-16T13:05:30+00:00",
      "context": {
        "type": "browser",
        "geo": {
          "ip": "198.51.100.23",
          "country": "Netherlands",
          "region": "North Holland",
          "city": "Amsterdam"
        },
        "device_uuid": "pirate-device-789",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
        "browser": {
          "name": "Safari",
          "version": "16.4"
        },
        "device": {
          "type": "Desktop",
          "operating_system": "macOS",
          "operating_system_version": "12.6.1"
        },
        "page": {
          "url": "https://www.example.com/pricing",
          "title": "Pricing - Plans for Every Team",
          "engagement_time": 542
        }
      },
      "event_properties": {
        "$element_tag": "a",
        "$element_text": "Start Free Trial",
        "$href": "https://www.example.com/signup",
        "$element_classes": "btn btn-primary",
        "$element_path": "body > main > section.hero > a.btn"
      },
      "meta": {
        "library": {
          "name": "radar.js",
          "version": "1.8.0"
        }
      }
    }
  ]
}
```

## Example: Download Event (Session-Based)

This example shows how a download event appears in a session payload when `downloadTracking` is enabled.

```json Download Event expandable theme={null}
{
  "internal_identifier": "my-customer-id",
  "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2025-06-16T13:00:00+00:00",
  "last_activity": "2025-06-16T13:15:42+00:00",
  "engagement_time": 937,
  "user_properties": {
    "$uuid": "pirate-user-456"
  },
  "events": [
    {
      "event_uuid": "89ab1234-cdef-5678-9012-3456789abcde",
      "event_name": "$download",
      "created_at": "2025-06-16T13:08:12+00:00",
      "context": {
        "type": "browser",
        "geo": {
          "ip": "198.51.100.23",
          "country": "Netherlands",
          "region": "North Holland",
          "city": "Amsterdam"
        },
        "device_uuid": "pirate-device-789",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
        "browser": {
          "name": "Safari",
          "version": "16.4"
        },
        "device": {
          "type": "Desktop",
          "operating_system": "macOS",
          "operating_system_version": "12.6.1"
        },
        "page": {
          "url": "https://www.example.com/resources",
          "title": "Resources - Whitepapers & Guides",
          "engagement_time": 320
        }
      },
      "event_properties": {
        "$href": "https://www.example.com/files/2025-product-guide.pdf",
        "$file_name": "2025-product-guide.pdf",
        "$element_path": "body > main > section.resources > a.download-link"
      },
      "meta": {
        "library": {
          "name": "radar.js",
          "version": "1.8.0"
        }
      }
    }
  ]
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.