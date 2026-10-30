> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Best Practices

> Get the most out of Snitcher with these proven strategies for tracking, identification, and data quality.

Follow these best practices to maximize the value you get from Snitcher and ensure high-quality data for your sales and marketing teams.

## Driving More Identified Users

The more visitors you identify, the more valuable your Snitcher data becomes. Here's how to increase your identification rate:

### Install on Your Application

When users log in to your product, identify them to Snitcher:

```javascript theme={null}
// After successful login
Snitcher.identify(user.email, {
  name: user.name,
  plan: user.subscription?.plan,
  company: user.company
});
```

This links their in-app behavior with their website visits, giving you a complete picture of the customer journey.

### Gate Your Best Content

Require email for high-value content:

* **Ebooks and whitepapers**: Gate behind a download form
* **Webinars**: Capture email at registration
* **Product demos**: Interactive demos behind email capture
* **Industry reports**: Exclusive data behind email gate

> [!TIP]
>
> Consider "progressive profiling"—ask for email first, then collect more data (company, role) on subsequent downloads.

### Use Email Link Tracking

Add identification parameters to outbound emails:

```
https://yoursite.com/case-study?sn_email=prospect@company.com
```

When recipients click, they're automatically identified—no form required.

### Integrate with Chat Widgets

If you use Intercom, Drift, or similar tools, identify users when they provide their email:

```javascript theme={null}
// Intercom example
Intercom('onUserEmail', function(email) {
  Snitcher.identify(email);
});

// Drift example  
drift.on('emailCapture', function(data) {
  Snitcher.identify(data.email);
});
```

### Capture Newsletter Signups

Every email subscription is an opportunity to identify:

```javascript theme={null}
form.addEventListener('submit', function(e) {
  const email = form.querySelector('[name="email"]').value;
  Snitcher.identify(email, {
    source: 'newsletter_signup'
  });
});
```

## Event Tracking Best Practices

### Use Consistent Naming Conventions

Adopt a clear pattern for event names:

```javascript theme={null}
// Good: [Object] [Action] format
"Button Clicked"
"Form Submitted"
"Video Played"
"Document Downloaded"
"Trial Started"

// Bad: Inconsistent patterns
"click_button"
"formSubmit"
"user watched video"
```

### Include Meaningful Properties

Add context to every event:

```javascript theme={null}
// Good: Rich context
Snitcher.track("CTA Clicked", {
  button_text: "Start Free Trial",
  button_location: "pricing_page",
  plan_selected: "pro",
  page_url: window.location.href
});

// Bad: No context
Snitcher.track("CTA Clicked");
```

### Don't Include Dynamic Data in Event Names

Keep event names consistent; use properties for variations:

```javascript theme={null}
// Good: Consistent event name, dynamic property
Snitcher.track("Feature Viewed", { feature_name: "Analytics" });
Snitcher.track("Feature Viewed", { feature_name: "Integrations" });

// Bad: Dynamic event names
Snitcher.track("Analytics Feature Viewed");
Snitcher.track("Integrations Feature Viewed");
```

### Track High-Intent Actions

Focus on actions that indicate buying intent:

| Action | Why It Matters |
| - | - |
| Pricing page visit | Evaluating cost |
| Comparison page | Active evaluation |
| Integration docs | Technical fit check |
| Contact sales click | Ready to talk |
| Demo request | High intent |
| Case study view | Social proof seeking |

## Automatic vs Custom Event Tracking

### Start with Automatic Tracking (Recommended)

Enable all three tracking features in **Settings → Tracker → Features**:

| Feature | What You Get |
| - | - |
| **Form Tracking** | All form submissions and abandonments captured automatically |
| **Click Tracking** | Link/button clicks + `data-track-event` declarative tracking |
| **Download Tracking** | PDF, Word, Excel, and other file downloads |

> [!TIP]
>
> Most users should enable all three features. This gives you comprehensive tracking with zero code changes.

### When to Add Custom Events

Layer custom events on top of automatic tracking for business-specific actions:

| Automatic Tracking Handles | Add Custom Events For |
| - | - |
| Generic form submissions | Demo requests with company size/industry |
| All link clicks | Pricing plan selection |
| File downloads | Video engagement (play, pause, complete) |
| | In-app feature usage |
| | Purchases and conversions |

### Example: Enriching Automatic Tracking

Automatic tracking captures that a form was submitted. Custom events add business context:

```javascript theme={null}
// Automatic tracking already captures $form_submit
// Add a custom event with business-specific data
form.addEventListener('submit', function() {
  Snitcher.track("Demo Request Submitted", {
    company_size: form.querySelector('[name="size"]').value,
    industry: form.querySelector('[name="industry"]').value,
    use_case: form.querySelector('[name="use_case"]').value
  });
});
```

## Privacy Best Practices

### Respect Cookie Consent

Integrate with your consent management platform:

```javascript theme={null}
// Initialize with consent requirement
{
  "waitForConsent": true,
  ...
}

// Grant consent when user accepts
cookieConsentTool.on('accept', function() {
  Snitcher.giveCookieConsent();
});
```

### Don't Track Sensitive Data

Avoid sending PII in event properties unless necessary:

```javascript theme={null}
// Good: Aggregate/safe data
Snitcher.track("Profile Updated", {
  fields_updated: ["name", "company"],
  profile_complete: true
});

// Bad: Unnecessary PII
Snitcher.track("Profile Updated", {
  new_name: "John Smith",
  ssn: "123-45-6789"  // Never do this!
});
```

### Honor Do Not Track

Consider respecting the browser's DNT setting:

```javascript theme={null}
if (navigator.doNotTrack !== "1") {
  // Initialize Snitcher
}
```

## Data Quality Tips

### Identify Early

Don't wait until checkout to identify users:

```javascript theme={null}
// Good: Identify as soon as email is captured
emailField.addEventListener('blur', function() {
  if (isValidEmail(this.value)) {
    Snitcher.identify(this.value);
  }
});

// Bad: Only identify at the end
form.addEventListener('submit', function() {
  Snitcher.identify(email);
});
```

### Update Traits Over Time

Call `identify()` whenever you learn new information:

```javascript theme={null}
// Initial signup
Snitcher.identify("user@company.com", {
  name: "Alex"
});

// After profile completion
Snitcher.identify("user@company.com", {
  role: "Marketing Manager",
  company_size: "51-200"
});

// After upgrade
Snitcher.identify("user@company.com", {
  plan: "enterprise",
  upgraded_at: new Date().toISOString()
});
```

### Use Consistent Property Names

Standardize across your codebase:

```javascript theme={null}
// Pick one format and stick with it
{ company_size: "51-200" }  // snake_case
{ companySize: "51-200" }   // camelCase

// Don't mix:
{ company_size: "51-200", companyName: "Acme" }  // Inconsistent!
```

## Common Mistakes to Avoid

> **Don't Over-Track**
>
> Track meaningful actions, not every click. Too many events create noise and slow down analysis.

> **Don't Forget Mobile**
>
> Ensure the tracker loads on mobile devices. Test on real devices, not just browser simulators.

> **Don't Skip Testing**
>
> Always verify tracking works in staging before deploying to production.

> **Don't Block the Main Thread**
>
> The Snitcher tracker is async by design. Don't wrap it in synchronous code.

## Next Steps

> **[Identify Users](https://docs.snitcher.com/product/tracker/identify-users.md)**
>
> Deep dive into user identification

> **[Custom Events](https://docs.snitcher.com/product/tracker/custom-events.md)**
>
> Track meaningful actions


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.