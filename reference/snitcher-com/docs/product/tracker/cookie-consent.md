> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Cookie Consent

> Configure Snitcher to work with your cookie consent management solution for GDPR and privacy compliance.

Snitcher supports integration with popular Consent Management Platforms (CMPs) to help you comply with GDPR, CCPA, and other privacy regulations.

## Enabling Consent Management

To enable consent management, add `waitForConsent: true` to your tracking script configuration:

```javascript theme={null}
{
  "profileId": "YOUR_PROFILE_ID",
  "apiEndpoint": "radar.snitcher.com",
  "cdn": "cdn.snitcher.com",
  "namespace": "Snitcher",
  "waitForConsent": true
}
```

> [!WARNING]
>
> Without `waitForConsent: true`, Snitcher grants consent automatically on page load and visitor identity persists immediately—bypassing your consent flow.

## How It Works

When `waitForConsent` is enabled:

1. **Before Consent**: Snitcher tracks pageviews and sessions, but visitor identity is not persisted across browser sessions.

2. **After Consent**: Visitor identity persists across sessions, enabling cross-session recognition and attribution.

> [!NOTE]
>
> Even without consent, Snitcher still tracks pageviews and sessions—visitors just won't be recognized when they return.

## Automatic CMP Integration

Snitcher automatically integrates with these Consent Management Platforms:

| CMP | Detection | Notes |
| - | - | - |
| **Cookiebot** | Automatic | Listens for consent events |
| **CookieYes** | Automatic | Listens for CookieYes consent events |
| **OneTrust** | Automatic | Integrates with OneTrust's consent API |
| **Transcend** | Automatic | Detects Transcend consent signals |

If you use one of these CMPs, Snitcher will automatically:

* Detect when a visitor grants analytics or marketing consent
* Enable persistent visitor recognition

> [!TIP]
>
> Just ensure your CMP script loads before the Snitcher tracking script.

## Manual Consent Handling

For custom cookie banners or other CMPs, you can manually grant consent:

```javascript theme={null}
// Call this when your visitor accepts cookies
Snitcher.giveCookieConsent();
```

### Example: Custom Cookie Banner

```html theme={null}
<div id="cookie-banner">
  <p>We use cookies to improve your experience. Do you accept?</p>
  <button id="accept-cookies">Accept</button>
  <button id="decline-cookies">Decline</button>
</div>

<script>
  document.getElementById('accept-cookies').addEventListener('click', function() {
    // Grant consent to Snitcher
    Snitcher.giveCookieConsent();

    // Hide the banner
    document.getElementById('cookie-banner').style.display = 'none';

    // Store preference (optional)
    localStorage.setItem('cookie_consent', 'granted');
  });

  document.getElementById('decline-cookies').addEventListener('click', function() {
    // Revoke consent in Snitcher
    Snitcher.denyCookieConsent();

    // Hide the banner
    document.getElementById('cookie-banner').style.display = 'none';

    // Store preference (optional)
    localStorage.setItem('cookie_consent', 'denied');
  });
</script>
```

### Opting Out (CCPA)

Under opt-out regulations like the CCPA, Snitcher identifies visitors by default and the visitor has the right to withdraw consent at any time—for example, through a "Do Not Sell or Share My Personal Information" link. Call `denyCookieConsent()` when a visitor opts out:

```javascript theme={null}
// Call this when your visitor opts out or withdraws consent
Snitcher.denyCookieConsent();
```

This clears the visitor's persisted identity (device ID, traits, and session) from cookies and `localStorage`, and stops recognizing them across sessions from that point forward. The opt-out persists across page loads and future sessions.

> [!NOTE]
>
> The opt-out is reversible. If the visitor later opts back in, call `Snitcher.giveCookieConsent()` to clear the opt-out and re-enable cross-session recognition.

### Checking Existing Consent

If a visitor has previously set a preference (stored in your own cookie/localStorage), apply it on page load:

```javascript theme={null}
// Check your own consent storage
const preference = localStorage.getItem('cookie_consent');
if (preference === 'granted') {
  Snitcher.giveCookieConsent();
} else if (preference === 'denied') {
  Snitcher.denyCookieConsent();
}
```

## Integration with Tag Managers

### Google Tag Manager

Create a Custom HTML tag that fires when your consent trigger activates:

```javascript theme={null}
<script>
  if (window.Snitcher) {
    Snitcher.giveCookieConsent();
  }
</script>
```

Set this tag to fire on your consent-granted trigger (e.g., when a user accepts cookies).

### Cookiebot via GTM

If using Cookiebot through GTM, create a trigger for the `CookiebotOnAccept` event:

```javascript theme={null}
<script>
  window.addEventListener('CookiebotOnAccept', function() {
    if (Cookiebot.consent.statistics && window.Snitcher) {
      Snitcher.giveCookieConsent();
    }
  });
</script>
```

## Best Practices

1. **Load order matters**: Ensure your CMP script loads before the Snitcher tracking script
2. **Test both scenarios**: Verify tracking works both with and without consent
3. **Don't over-complicate**: If using a supported CMP, automatic integration should "just work"

## Troubleshooting

> **Consent not being detected**
>
> * Ensure the CMP script loads before Snitcher
> * Check browser console for CMP-related errors
> * Verify the CMP is correctly configured

> **Visitors not being recognized across sessions**
>
> * Confirm `giveCookieConsent()` was called
> * Check if localStorage is being cleared by the browser
> * Verify consent was actually granted in your CMP

> **Data not appearing in dashboard**
>
> * Tracking still works without consent—just without cross-session recognition
> * Check network requests to `radar.snitcher.com` in DevTools


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.