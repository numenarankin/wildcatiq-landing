> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Events

> Track custom events and conversions with automatic tracking or the Snitcher JavaScript API.

Snitcher tracks events in two ways: **automatic tracking** (zero code required) and **custom events** (for business-specific actions). Most users should start with automatic tracking enabled.

## Automatic Event Tracking

Enable automatic tracking in your dashboard under **Settings → Tracker → Features**. No code changes required.

| Feature | What It Tracks | Events Generated |
| - | - | - |
| **Form Tracking** | All form submissions and abandonments | `$form_submit`, `$form_abandon` |
| **Click Tracking** | Link and button clicks, plus `data-track-event` elements | Click events |
| **Download Tracking** | File downloads (.pdf, .docx, .zip, .xlsx, etc.) | Download events |

> [!NOTE]
>
> **Recommended:** Enable all three for comprehensive tracking without writing any code. You can always add custom events later for specific use cases.

### What Gets Tracked Automatically

**With Form Tracking enabled:**

* Form submissions (with form ID, action URL, and field names)
* Form abandonment (when users start but don't complete forms)

**With Click Tracking enabled:**

* All link clicks (with href, text, and position)
* Button clicks
* Elements with `data-track-event` attribute (see [Declarative Tracking](#declarative-click-tracking))

**With Download Tracking enabled:**

* PDF, Word, Excel, PowerPoint downloads
* ZIP, RAR, and other archive files
* Any link with a `download` attribute

***

## Custom Events

For business-specific actions not covered by automatic tracking, use the `Snitcher.track()` method.

### When to Use Custom Events

| Use Automatic Tracking | Use Custom Events |
| - | - |
| Form submissions | Demo requests with custom fields |
| General click tracking | Pricing plan selection |
| File downloads | Video engagement (play, complete) |
| Link navigation | In-app feature usage |
| | Purchases and conversions |
| | A/B test interactions |

### The `track` Method

```javascript theme={null}
Snitcher.track(eventName, properties);
```

**eventName** `string` *required*

The name of the event. Use `[Object] [Action]` format (e.g., "Trial Started", "Plan Selected").

**properties** `object`

Additional context about the event.

### Examples

**Track a demo request with business context:**

```javascript theme={null}
Snitcher.track("Demo Requested", {
  company_size: formData.company_size,
  industry: formData.industry,
  use_case: formData.use_case
});
```

**Track pricing interactions:**

```javascript theme={null}
Snitcher.track("Pricing Plan Selected", {
  plan_name: "Pro",
  plan_price: 99,
  billing_cycle: "monthly"
});
```

**Track video engagement:**

```javascript theme={null}
video.addEventListener('play', () => {
  Snitcher.track("Video Started", { video_title: "Product Demo" });
});

video.addEventListener('ended', () => {
  Snitcher.track("Video Completed", { video_title: "Product Demo" });
});
```

**Track in-app actions:**

```javascript theme={null}
Snitcher.track("Feature Enabled", {
  feature_name: "Dark Mode",
  user_plan: "pro"
});
```

***

## Declarative Click Tracking

For simple click tracking, you can use HTML `data-*` attributes instead of writing JavaScript. This is perfect for marketing sites, CMS-managed content, or anywhere you want to track clicks without code changes.

### The `data-track-event` Attribute

Add `data-track-event` to any element to make it trackable:

```html theme={null}
<button data-track-event="CTA Clicked">
  Start Free Trial
</button>
```

When clicked, Snitcher automatically captures the click with the event name you specified.

### Adding Custom Properties

Include additional `data-*` attributes to pass properties with the event:

```html theme={null}
<button 
  data-track-event="CTA Clicked"
  data-button-location="hero"
  data-button-variant="primary"
  data-campaign="summer-2024"
>
  Start Free Trial
</button>
```

This sends an event with properties:

```javascript theme={null}
{
  buttonLocation: "hero",
  buttonVariant: "primary",
  campaign: "summer-2024"
}
```

> [!NOTE]
>
> Property names are automatically converted from `kebab-case` to `camelCase`. So `data-button-location` becomes `buttonLocation`.

### Common Examples

**Tracking navigation clicks:**

```html theme={null}
<nav>
  <a href="/pricing" data-track-event="Nav Click" data-nav-item="pricing">Pricing</a>
  <a href="/docs" data-track-event="Nav Click" data-nav-item="docs">Docs</a>
  <a href="/blog" data-track-event="Nav Click" data-nav-item="blog">Blog</a>
</nav>
```

**Tracking feature interest:**

```html theme={null}
<div class="features">
  <div data-track-event="Feature Clicked" data-feature="analytics">
    <h3>Analytics</h3>
    <p>Real-time insights...</p>
  </div>
  <div data-track-event="Feature Clicked" data-feature="integrations">
    <h3>Integrations</h3>
    <p>Connect to your stack...</p>
  </div>
</div>
```

**Tracking pricing tier interest:**

```html theme={null}
<div class="pricing-cards">
  <div data-track-event="Pricing Card Clicked" data-plan="starter" data-price="29">
    <h3>Starter</h3>
    <p>$29/mo</p>
    <button>Choose Plan</button>
  </div>
  <div data-track-event="Pricing Card Clicked" data-plan="pro" data-price="99">
    <h3>Pro</h3>
    <p>$99/mo</p>
    <button>Choose Plan</button>
  </div>
</div>
```

### When to Use Declarative vs JavaScript Tracking

| Use Declarative (`data-track-event`) | Use JavaScript (`Snitcher.track()`) |
| - | - |
| Simple click tracking | Complex event logic |
| Static HTML / CMS content | Dynamic values from state |
| No JavaScript access | Need to track non-click events |
| Marketing pages | Application interactions |

> [!NOTE]
>
> **Requires Click Tracking:** Enable click tracking in **Settings → Tracker → Features** for declarative tracking to work.

***

## Event Naming Best Practices

> **Do**
>
> * Use `[Object] [Action]` format
> * Be specific: "Pricing Plan Selected"
> * Use consistent capitalization
> * Keep names concise

> **Don't**
>
> * Don't use vague names: "Clicked"
> * Don't include dynamic data in event names
> * Don't use special characters
> * Don't exceed 100 characters

### Good Event Names

```javascript theme={null}
"Demo Requested"
"Pricing Page Viewed"
"Feature Toggle Enabled"
"Trial Started"
"Document Downloaded"
"Chat Widget Opened"
```

### Property Guidelines

* Use `snake_case` for property names
* Keep values short and meaningful
* Include context: page URL, button location, user action
* Don't include PII (emails, names) unless necessary

## Viewing Events in Snitcher

Custom events appear in:

1. **Company Timeline**: See all events from a specific company
2. **Session Details**: View events within a visitor session
3. **Segments**: Create segments based on custom events

## Flush Events Immediately

By default, events are batched and sent periodically. To send immediately (useful before navigation):

```javascript theme={null}
// Track the event
Snitcher.track("Checkout Started", { cart_value: 99.99 });

// Force immediate send
Snitcher.flush();

// Now safe to navigate away
window.location.href = '/checkout';
```

## React / Vue / SPA Integration

For single-page applications, track events normally—the tracker handles client-side navigation automatically:

```javascript theme={null}
// React example
function handlePurchase() {
  Snitcher.track("Purchase Completed", {
    order_id: order.id,
    total: order.total
  });
}

// Vue example
methods: {
  onFeatureClick(feature) {
    Snitcher.track("Feature Selected", {
      feature_name: feature.name
    });
  }
}
```

## Event Listeners

Snitcher emits events that you can listen to for custom integrations, debugging, or triggering other actions.

### The `on` Method

Subscribe to tracker events:

```javascript theme={null}
Snitcher.on(eventType, callback);
```

### Available Events

| Event | Fired When |
| - | - |
| `initialized` | Tracker finishes loading |
| `pageview` | A pageview is tracked |
| `identify` | A user is identified |
| `track` | A custom event is tracked |
| `form_submit` | A form submission is captured |
| `click` | A click is tracked (when enabled) |

### Examples

**Wait for tracker to initialize:**

```javascript theme={null}
Snitcher.on('initialized', function(data) {
  console.log('Snitcher loaded, version:', data.version);
  
  // Safe to call other Snitcher methods
  loadUserAndIdentify();
});
```

**React to pageviews:**

```javascript theme={null}
Snitcher.on('pageview', function(page) {
  console.log('Page viewed:', page.path);
  
  // Trigger third-party analytics
  thirdPartyAnalytics.pageview(page.path);
});
```

**Log all tracked events:**

```javascript theme={null}
Snitcher.on('track', function(event) {
  console.log('Event tracked:', event.name, event.properties);
});
```

**Sync identification with other tools:**

```javascript theme={null}
Snitcher.on('identify', function(traits) {
  console.log('User identified:', traits.email);
  
  // Sync with other tools
  if (window.Intercom) {
    Intercom('update', { email: traits.email, name: traits.name });
  }
});
```

### One-Time Listeners

Use `once` to listen for an event only once:

```javascript theme={null}
Snitcher.once('initialized', function() {
  // This only fires once, even if tracker re-initializes
  performOneTimeSetup();
});
```

### Remove Listeners

Use `off` to remove a listener:

```javascript theme={null}
function myCallback(event) {
  console.log('Event:', event);
}

// Add listener
Snitcher.on('track', myCallback);

// Remove listener
Snitcher.off('track', myCallback);
```

> [!NOTE]
>
> Event listeners are useful for integrating Snitcher with other tools, debugging, or building custom analytics dashboards.

## Debugging

Open your browser's Developer Tools to see event tracking in action:

1. Go to the **Network** tab
2. Filter by `radar.snitcher.com`
3. Click on requests to see event payloads

Events are batched, so you may see multiple events in a single request.

### Debug Mode

Enable debug mode to see detailed logs in the console:

```javascript theme={null}
{
  "profileId": "YOUR_PROFILE_ID",
  "debug": true,
  ...
}
```

With debug mode enabled, you'll see logs for:

* Tracker initialization
* Every event sent
* Any errors encountered


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.