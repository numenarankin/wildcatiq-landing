> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Snitcher Identity Layer

> The Identity Layer connects anonymous website visitors to known users by linking email addresses to browsing sessions across devices.

**The Snitcher Identity Layer connects anonymous website visitors to known users by linking their email address to all past and future browsing sessions.** When a visitor provides their email (through a form, login, or email link click), Snitcher retroactively associates their previous anonymous sessions with that identity—giving you complete visibility into the buyer journey from first touch to conversion.

## Why Identity Matters

Company-level identification tells you "someone from Acme Corp visited pricing." User-level identification tells you "Sarah Chen, VP Marketing at Acme Corp, visited pricing for the third time this week."

Benefits of identified traffic:

* **100% accurate**: No guessing—you know exactly who visited
* **Privacy-friendly**: Users opted in by providing their email
* **Perfect match rate**: Identified users stay identified across sessions
* **Person-level detail**: See individual behavior, not just company aggregates

> [!NOTE]
>
> Snitcher does not use third-party cookies or any third-party data in our Identity Layer. All identification comes from first-party interactions on your website.

## How Users Get Identified

Snitcher captures user identity through several methods:

### 1. Automatic Form Tracking

When enabled, Snitcher automatically detects form submissions containing email addresses. This includes:

* Demo request forms
* Newsletter signups
* Gated content downloads
* Contact forms
* Webinar registrations

No code changes required—Snitcher observes the form and extracts the email automatically.

### 2. Manual Identification via `identify()`

For logins, signups, and non-standard flows, call `Snitcher.identify()`:

```javascript theme={null}
// After user logs in
Snitcher.identify("sarah@acme.com", {
  name: "Sarah Chen",
  title: "VP Marketing",
  company: "Acme Corp"
});
```

Call `identify()` whenever a user:

* Signs up for your product
* Logs in
* Provides their email in a form you control
* Completes onboarding

### 3. OAuth and SSO Logins

For Google Sign-In, GitHub OAuth, SSO, and similar flows, you'll need to call `identify()` manually after successful authentication:

```javascript theme={null}
// After OAuth callback
async function handleOAuthSuccess(user) {
  // Identify to Snitcher
  Snitcher.identify(user.email, {
    name: user.name,
    auth_provider: "google"
  });
}
```

> [!TIP]
>
> Install the tracker on your logged-in application pages and call `identify()` on every page load for authenticated users. This ensures sessions are always linked to the correct user.

### 4. Email Link Tracking

When you send outbound emails, you can embed identification parameters that reveal who clicked through. Snitcher supports both plain email and base64-encoded formats:

```
# Plain email
https://yoursite.com/pricing?sn_email=sarah@acme.com

# Base64 encoded (recommended for privacy)
https://yoursite.com/pricing?sn_eid=c2FyYWhAYWNtZS5jb20=
```

When the recipient clicks, Snitcher captures the email and identifies them automatically. This works with:

* Sales outreach emails (Outreach, Salesloft, Apollo)
* Marketing campaigns (HubSpot, Mailchimp, Marketo)
* Transactional emails

You can also pass additional traits via URL parameters like `sn_trait_first_name` and `sn_trait_company`.

> **[Identify Email Recipients](https://docs.snitcher.com/product/tracker/identify-email-recipients.md)**
>
> See the complete guide with platform-specific setup instructions for HubSpot, Apollo, Salesloft, and more.

> [!WARNING]
>
> Only use email link tracking for emails you send directly. Don't expose email addresses in public links.

## Cross-Session Identity Persistence

Once a user is identified, their identity persists across sessions (as long as cookies aren't cleared):

| Session | Status | Activity |
| - | - | - |
| Week 1 | Anonymous | Visited blog, read 3 articles |
| Week 2 | Anonymous | Returned, viewed pricing |
| Week 3 | **Identified** | Filled out demo form as [sarah@acme.com](mailto:sarah@acme.com) |
| Week 4 | Identified | Returned, viewed case studies |

After identification in Week 3, **all four sessions** are linked to Sarah's profile in Snitcher.

## Profile Merging

Snitcher automatically handles complex scenarios:

### Same Person, Multiple Devices

When Sarah visits from her laptop and phone, she creates two device IDs. Once she identifies on both devices (e.g., logs in), Snitcher merges the activity:

```
Laptop sessions → sarah@acme.com
Phone sessions  → sarah@acme.com
```

### Company + User Linking

If Sarah visits from Acme Corp's office, we identify both:

* **Company**: Acme Corp (from IP intelligence)
* **User**: [sarah@acme.com](mailto:sarah@acme.com) (from identification)

The session shows both, giving you company context and individual detail.

## Improving Your Identification Rate

Want more identified traffic? Try these strategies:

> **Install the tracker on your app**
>
> When users log in to your product, call `identify()`. This links their in-app behavior with website visits, giving you a complete picture of the customer journey.

> **Gate your best content**
>
> Require email for high-value content: ebooks, webinars, industry reports. Use progressive profiling to collect more data over time.

> **Use email link tracking**
>
> Add tracking parameters to outbound emails. When prospects click through, you'll know exactly who they are—no form required. See the [complete setup guide](https://docs.snitcher.com/product/tracker/identify-email-recipients.md) for HubSpot, Apollo, Salesloft, and more.

> **Integrate with chat widgets**
>
> Connect Snitcher with Intercom, Drift, or other chat tools. When visitors provide their email in chat, identify them in Snitcher.

> **Track webinar registrations**
>
> Host valuable webinars and capture emails at registration. Install Snitcher wherever registrations happen.

## Privacy Considerations

The Identity Layer is built on first-party data and user consent:

* **No third-party cookies**: All data comes from your website
* **User-initiated**: Identification only happens when users provide their email
* **Transparent**: Users know they're submitting a form or logging in
* **GDPR-compatible**: Works with consent management when configured

If you use cookie consent:

```javascript theme={null}
// Only identify after consent
if (hasMarketingConsent()) {
  Snitcher.identify(user.email, { name: user.name });
}
```

## Next Steps

> **[Identify Users](https://docs.snitcher.com/product/tracker/identify-users.md)**
>
> Implementation guide for `identify()`

> **[Email Recipients](https://docs.snitcher.com/product/tracker/identify-email-recipients.md)**
>
> Track clicks from outbound emails

> **[Cookie Consent](https://docs.snitcher.com/product/tracker/cookie-consent.md)**
>
> GDPR-compliant tracking setup


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.