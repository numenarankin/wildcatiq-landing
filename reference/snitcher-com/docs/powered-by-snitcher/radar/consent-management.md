> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Consent Management

> How to manage user privacy and consent on your customers' websites.

Radar is designed with privacy in mind and includes features to help your customers comply with regulations like GDPR and CCPA. By default, Radar uses session storage. You can configure it to require active consent from your customer's users before using persistent storage (cookies and `localStorage`).

## How It Works

When you enable consent management, Radar operates in two stages on your customer's website:

1. **Before Consent:** The tracker is fully functional but stores all data (like the device ID and user traits) in the end user's `sessionStorage`. This data is cleared when the user closes their tab.
2. **After Consent:** Once the end user gives consent, a specific Radar function must be called. The tracker then migrates all data from `sessionStorage` to `localStorage` and will use persistent storage from that point forward, allowing it to remember users across multiple sessions.

## 1. Enable Consent Management

To enable consent management, set the `waitForConsent` option to `true` in your Radar loader script configuration.

```html HTML theme={null}
<script>
  !function(e){ /* ...loader script... */ }({
    // ... other settings
    "namespace": "YourAppName",
    "waitForConsent": true
  });
</script>
```

When this setting is active, Radar will not use cookies or `localStorage` on your customer's site until you explicitly tell it to via the `giveCookieConsent` method, or automatically via a supported consent management platform (CMP).

## 2. Granting Consent

There are two ways for your customers to grant consent:

### a. Automatic Consent (CMP Integration)

Radar includes built-in integrations with major Consent Management Platforms (CMPs):

* [Cookiebot](https://www.cookiebot.com/)
* [CookieYes](https://www.cookieyes.com/)
* [OneTrust](https://www.onetrust.com/)
* [Transcend](https://transcend.io/)

If your customer uses one of these CMPs, Radar will automatically detect when a user has granted consent and will call giveCookieConsent() behind the scenes. No extra coding is required — simply enable waitForConsent and install Radar after the CMP script.

> [!NOTE]
>
> This ensures Radar seamlessly respects your customer's existing consent workflow without requiring duplicate consent logic.

### b. Manual Consent (Custom Banner or Logic)

Your customer will need to implement logic to call the `giveCookieConsent()` method on the tracker's namespace object when one of their users provides consent (for example, by clicking "Accept" on a cookie banner).

```javascript theme={null}
// Your customer calls this when their user accepts the cookie policy
YourAppName.giveCookieConsent();
```

Calling this function does two things:

* It signals to Radar that it now has permission to use persistent storage for that end user.
* It migrates any existing anonymous ID and user traits from that user's session storage to `localStorage`, so their identity is maintained.

> [!NOTE]
>
> The `giveCookieConsent` function only needs to be called once per user. Radar will remember that consent has been granted for all future sessions from that device.

#### Example: Integrating with a Cookie Banner

Here is a simple example of how your customer could integrate Radar with a common cookie consent banner on their website. You can provide this snippet to them as a guide.

```html HTML theme={null}
<!-- A cookie banner on your customer's website -->
<div id="cookie-banner">
  <p>We use cookies to improve your experience. Do you accept?</p>
  <button id="accept-cookies">Accept</button>
</div>

<script>
  // The Radar loader script you provide to your customer
  !function(e){ /* ...loader script... */ }({
    "namespace": "YourAppName",
    "waitForConsent": true
  });

  // Logic for the cookie banner
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('accept-cookies');

  acceptBtn.addEventListener('click', () => {
    // 1. Grant consent in Radar
    window.YourAppName.giveCookieConsent();

    // 2. Hide the cookie banner
    banner.style.display = 'none';

    // 3. (Optional) Store consent preference in a separate cookie
    //    so the banner isn't shown again to this user.
    document.cookie = "cookie_consent=true; path=/; max-age=31536000";
  });
</script>
```

## 3. Revoking Consent (CCPA Opt-Out)

The `waitForConsent` flow above is the **opt-in** model used for regulations like GDPR, where tracking stays session-scoped until the user actively agrees. Regulations like the CCPA instead use an **opt-out** model: tracking is on by default, and the user has the right to withdraw consent at any time (for example, via a "Do Not Sell or Share My Personal Information" link).

For this posture, leave `waitForConsent` at its default (`false`) so Radar identifies visitors normally, and call the `denyCookieConsent()` method when one of your customer's users opts out.

```javascript theme={null}
// Your customer calls this when their user opts out or withdraws consent
YourAppName.denyCookieConsent();
```

Calling this function does three things:

* It clears that end user's persisted identity — device ID, user traits, and session data — from both cookies and `localStorage`.
* It drops Radar back to session-scoped storage, so the user is no longer recognized across sessions from that point forward.
* It records the opt-out durably, so the choice survives page loads and future sessions and is not overridden by an automatic (CMP-reported) grant.

> [!NOTE]
>
> The opt-out is reversible. If the user later opts back in, calling `giveCookieConsent()` clears the recorded opt-out and re-enables persistent storage.

#### Example: Integrating an Opt-Out Control

Here is a simple example of how your customer could wire a "Do Not Track" control to Radar. It mirrors the accept flow above.

```html HTML theme={null}
<!-- An opt-out control on your customer's website -->
<button id="opt-out-tracking">Do Not Sell or Share My Personal Information</button>

<script>
  // The Radar loader script you provide to your customer
  !function(e){ /* ...loader script... */ }({
    "namespace": "YourAppName"
    // waitForConsent left at its default (false): CCPA opt-out posture
  });

  // Logic for the opt-out control
  document
    .getElementById('opt-out-tracking')
    .addEventListener('click', () => {
      // 1. Revoke consent in Radar (clears identity, stops cross-session tracking)
      window.YourAppName.denyCookieConsent();

      // 2. (Optional) Store the opt-out preference in your own cookie
      //    so your UI can reflect the user's choice on their next visit.
      document.cookie = "cookie_consent=false; path=/; max-age=31536000";
    });
</script>
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.