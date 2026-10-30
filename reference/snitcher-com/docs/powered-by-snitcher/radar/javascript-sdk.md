> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# JavaScript SDK

> A complete reference for the methods available on the Radar JavaScript object for your customers to use.

Once your customer installs the Radar loader script on their website, it exposes a global object with the `namespace` you defined. This JavaScript SDK provides a set of methods that your customers can use to send custom data, manage their users' identity, and control the tracker's behavior.

Throughout this guide, we'll use `YourAppName` as the example namespace that you would provide to your customers.

## Core Methods

### track

The `track` method is the primary way for your customers to send custom event data to Radar.

```javascript theme={null}
YourAppName.track(eventName, properties);
```

**eventName** `string` *required*

The name of the event to track. You should advise your customers to use a consistent `[Object] [Verb]` naming convention, such as `Document Signed` or `Video Played`.

**properties** `object`

A JSON object of key-value pairs to send as metadata with the event.

**Example Implementation:**

```javascript theme={null}
// Your customer would implement this after a successful action
YourAppName.track("Trial Started", {
  plan: "Pro",
  source: "Website CTA"
});
```

### identify

The `identify` method allows your customers to associate a known user with their activity on the website. Once identified, the provided traits are stored by Radar and attached to all future events from that user.

```javascript theme={null}
YourAppName.identify(email, traits);
```

**email** `string` *required*

The user's email address. Radar uses this as the primary identifier for enrichment.

**traits** `object`

A JSON object of additional key-value pairs representing the user's traits.

**Example Implementation:**

```javascript theme={null}
// Your customer could call this after a user signs in
YourAppName.identify("hello@snitcher.com", {
  name: "Alex",
  plan: "Enterprise"
});
```

### page

While Radar tracks pageviews automatically in most cases, the `page` method can be used to manually trigger a pageview event. This is useful in Single-Page Applications (SPAs) where routing changes don't always trigger a full page load.

```javascript theme={null}
YourAppName.page();
```

## Consent Management

### giveCookieConsent

This method signals to Radar that an end user has provided consent to use persistent storage (cookies and `localStorage`). See the [Consent Management](https://docs.snitcher.com/powered-by-snitcher/radar/consent-management.md) guide for a full walkthrough.

```javascript theme={null}
// Your customer calls this when their user accepts the cookie policy
YourAppName.giveCookieConsent();
```

### denyCookieConsent

This method is the symmetric counterpart to `giveCookieConsent`. It signals that an end user has revoked (or declined) consent — the CCPA opt-out case. Radar clears the user's persisted identity (device ID, traits, and session data) from both cookies and `localStorage`, drops back to session-scoped storage so the user is no longer recognized across sessions, and records the opt-out so it persists across page loads. The opt-out is reversible: calling `giveCookieConsent()` again re-enables persistent storage. See the [Consent Management](https://docs.snitcher.com/powered-by-snitcher/radar/consent-management.md) guide for a full walkthrough.

```javascript theme={null}
// Your customer calls this when their user opts out or withdraws consent
YourAppName.denyCookieConsent();
```

## Advanced Methods

### flush

Forces the tracker to immediately send any queued events to the Radar API. This can be useful for your customers in specific situations where they need to ensure data is sent before a certain action.

```javascript theme={null}
YourAppName.flush();
```

### on

Allows you to build functionality that listens for events emitted by the tracker on your customer's site. Your customers can use this to integrate the tracker's lifecycle with their own application code.

```javascript theme={null}
YourAppName.on(eventName, callback);
```

**eventName** `string` *required*

The name of the internal tracker event to listen for. Common events include: `initialized`, `identify`, `page_view`, `track`, `form_submit`, `click`, `download`.

**callback** `function` *required*

A function to execute when the event occurs. The callback will receive the event payload as an argument.

**Example Implementation:**

```javascript theme={null}
// Your customer could use this to update their UI when a user is identified
YourAppName.on('identify', (traits) => {
  console.log('User identified:', traits);
});
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.