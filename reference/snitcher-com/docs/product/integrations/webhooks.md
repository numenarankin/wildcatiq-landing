> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Webhooks

> Send real-time data to any endpoint. Build custom integrations with webhooks.

Use webhooks to send identified company data to any URL in real-time. Build custom integrations, power internal tools, or connect to any service.

## Features

* **Real-time delivery** when events occur
* **Custom endpoints** - send to any URL
* **Flexible payload** with full company data
* **Retry logic** for failed deliveries
* **Secret authentication** for security
* **Delivery logs** for debugging

## Setup

1. Go to **Settings** → **Integrations** → **Webhooks**
2. Click **Create Webhook**
3. Enter a name and your endpoint URL
4. Optionally add a secret for signature verification
5. Save and activate

## Webhook Events

Configure which events trigger your webhook via **Automations**:

| Event | Trigger |
| - | - |
| New company | When a new company is first identified |
| Company returns | When a known company visits again |
| Session started | When any session begins |
| Contact revealed | When a contact email or phone number is revealed |
| Enters segment | When a company matches a segment |

## Payload Format

```json theme={null}
{
  "event": "company.identified",
  "timestamp": "2024-01-15T10:30:00Z",
  "workspace": {
    "uuid": "ws_abc123",
    "name": "My Workspace"
  },
  "company": {
    "uuid": "org_xyz789",
    "name": "Acme Inc",
    "domain": "acme.com",
    "industry": "Technology",
    "employee_range": "50-200",
    "location": {
      "city": "San Francisco",
      "region": "California",
      "country": "United States"
    }
  },
  "session": {
    "uuid": "sess_123",
    "started_at": "2024-01-15T10:25:00Z",
    "pages_viewed": 3,
    "referrer": "google.com"
  }
}
```

### Contact Revealed Payload

```json theme={null}
{
  "event": "contacts_revealed",
  "site_id": 12345,
  "subjects": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@acme.com",
      "phone": "+1-555-123-4567",
      "headline": "VP of Sales at Acme Inc",
      "title": "VP of Sales",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "location": "San Francisco, CA",
      "company": {
        "name": "Acme Inc",
        "domain": "acme.com"
      }
    }
  ]
}
```

> [!NOTE]
>
> The `phone` field is only included when a phone number has been revealed for the contact.

## Security

### Signature Verification

If you add a secret, each webhook request includes a `Signature` header. The signature is an HMAC-SHA256 hash of the request body using your secret as the key, so it will be different for every request.

```
Signature: abc123...
```

Verify the signature by computing HMAC-SHA256 of the raw JSON request body with your secret and comparing it to the header value:

```javascript theme={null}
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

## Retry Logic

Failed webhook deliveries are retried automatically:

| Attempt | Delay |
| - | - |
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

After 5 failed attempts, the delivery is marked as failed and logged.

## Viewing Logs

1. Go to **Integrations** → **Webhooks**
2. Click on your webhook
3. Select **View Logs**

Logs include:

* Request payload
* Response status code
* Response body (if any)
* Error messages
* Timestamp

## Testing

Send a test webhook to verify your endpoint:

1. Edit your webhook
2. Click **Send Test**
3. Choose an event type
4. Check your endpoint for the test payload

## Common Use Cases

| Use Case | Description |
| - | - |
| Internal dashboard | Send data to your own analytics system |
| Custom CRM | Integrate with CRMs not natively supported |
| Slack bot | Build custom notifications |
| Data warehouse | Stream to Snowflake, BigQuery, etc. |
| Lead scoring | Trigger custom scoring workflows |

## Troubleshooting

> **Webhooks not firing**
>
> * Verify you have an automation configured to trigger the webhook
> * Check that the webhook is not archived
> * Review webhook logs for errors

> **Signature verification failing**
>
> * Ensure you're using the raw request body (not parsed JSON)
> * Verify the secret matches exactly
> * Check for any proxy/middleware modifying the request

> **Timeouts**
>
> Webhooks time out after 30 seconds. Ensure your endpoint responds quickly. For slow processing, respond immediately and process asynchronously.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.