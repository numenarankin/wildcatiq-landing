> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Identify Users

> Associate known user data with Snitcher visitor sessions for enhanced lead intelligence.

When a visitor logs in, fills out a form, or otherwise reveals their identity, you can use the `identify` method to associate their information with the Snitcher session. This enables richer lead data and better attribution.

## The `identify` Method

```javascript theme={null}
Snitcher.identify(email, traits);
```

**email** `string` *required*

The user's email address. This is the primary identifier used for enrichment and CRM matching.

**traits** `object`

Additional properties about the user, such as name, company, role, or any custom attributes.

## Basic Example

```javascript theme={null}
Snitcher.identify("john@company.com", {
  name: "John Doe",
  company: "Acme Inc",
  role: "Marketing Manager"
});
```

## When to Identify

Call `identify` whenever you learn who a visitor is:

> **User Login**
>
> When a user signs into your app

> **Form Submission**
>
> When someone submits a lead form

> **Trial Signup**
>
> When a visitor starts a trial

> **Chat Initiation**
>
> When they provide email in chat

## Common Use Cases

### After Login

```javascript theme={null}
// After successful authentication
async function handleLogin(credentials) {
  const user = await login(credentials);
  
  // Identify the user to Snitcher
  Snitcher.identify(user.email, {
    name: user.name,
    user_id: user.id,
    plan: user.subscription.plan,
    account_created: user.createdAt
  });
}
```

### On Form Submission

```javascript theme={null}
document.querySelector('#lead-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  
  // Identify with form data
  Snitcher.identify(formData.get('email'), {
    name: formData.get('name'),
    company: formData.get('company'),
    phone: formData.get('phone'),
    message: formData.get('message')
  });
  
  // Continue with form submission
  this.submit();
});
```

### Trial Signup

```javascript theme={null}
async function handleTrialSignup(data) {
  const trial = await createTrial(data);
  
  Snitcher.identify(data.email, {
    name: data.name,
    company: data.company,
    company_size: data.companySize,
    trial_started: new Date().toISOString(),
    trial_plan: data.plan
  });
}
```

### Chat Widget Integration

```javascript theme={null}
// Example with Intercom
Intercom('onUserEmail', function(email) {
  Snitcher.identify(email);
});

// Example with Drift
drift.on('emailCapture', function(data) {
  Snitcher.identify(data.email, {
    source: 'drift_chat'
  });
});
```

## OAuth, SSO, and Passwordless Login

For login methods that don't use traditional forms—Google Sign-In, GitHub OAuth, SAML SSO, or magic links—you'll need to call `identify` manually after authentication completes.

> [!NOTE]
>
> Snitcher's automatic form tracking captures emails from standard forms, but OAuth and SSO flows bypass form submission entirely. Manual identification is required.

### Google Sign-In

```javascript theme={null}
// Using Google Identity Services
google.accounts.id.initialize({
  client_id: 'YOUR_CLIENT_ID',
  callback: handleCredentialResponse
});

function handleCredentialResponse(response) {
  // Decode the JWT to get user info
  const payload = decodeJwt(response.credential);
  
  // Identify to Snitcher
  Snitcher.identify(payload.email, {
    name: payload.name,
    auth_provider: 'google',
    google_id: payload.sub
  });
  
  // Continue with your auth flow
  authenticateWithBackend(response.credential);
}
```

### GitHub OAuth

```javascript theme={null}
// After OAuth callback
async function handleGitHubCallback(code) {
  const { user, token } = await exchangeCodeForToken(code);
  
  // Identify to Snitcher
  Snitcher.identify(user.email, {
    name: user.name,
    auth_provider: 'github',
    github_username: user.login
  });
  
  // Store token and redirect
  setAuthToken(token);
}
```

### SAML SSO / Enterprise SSO

```javascript theme={null}
// After SSO callback/assertion processing
async function handleSSOCallback(samlResponse) {
  const user = await processSAMLResponse(samlResponse);
  
  // Identify to Snitcher
  Snitcher.identify(user.email, {
    name: user.displayName,
    auth_provider: 'saml',
    organization: user.organization,
    role: user.role
  });
}
```

### Magic Links / Passwordless

```javascript theme={null}
// When user clicks magic link and lands on your app
async function handleMagicLinkAuth() {
  const token = getTokenFromURL();
  const user = await verifyMagicLink(token);
  
  if (user) {
    // Identify to Snitcher
    Snitcher.identify(user.email, {
      name: user.name,
      auth_provider: 'magic_link'
    });
  }
}
```

### Auth0

```javascript theme={null}
// Using Auth0 SPA SDK
auth0.handleRedirectCallback().then(async () => {
  const user = await auth0.getUser();
  
  if (user?.email) {
    Snitcher.identify(user.email, {
      name: user.name,
      auth_provider: 'auth0',
      auth0_id: user.sub
    });
  }
});
```

### Firebase Authentication

```javascript theme={null}
// Firebase Auth state observer
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    Snitcher.identify(user.email, {
      name: user.displayName,
      auth_provider: user.providerData[0]?.providerId || 'firebase',
      firebase_uid: user.uid
    });
  }
});
```

### Next.js with NextAuth

```typescript theme={null}
// In your authentication callback or middleware
import { getSession } from 'next-auth/react';

export default function AuthenticatedPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      window.Snitcher?.identify(session.user.email, {
        name: session.user.name,
        auth_provider: 'nextauth'
      });
    }
  }, [session]);

  return <div>...</div>;
}
```

### Best Practices for OAuth/SSO

> **Call on Every Page Load**
>
> For authenticated sections, call `identify` on every page load to ensure sessions are linked, not just on login.

> **Handle Async Properly**
>
> OAuth flows are async. Make sure `identify` is called after you have the user data, not before.

> **Include Provider Info**
>
> Track which auth provider was used. This helps analyze user acquisition channels.

> **Don't Block Auth**
>
> `identify` is async and non-blocking. Don't wait for it to complete before redirecting users.

## What Happens After Identification

When you call `identify`:

1. **Email is stored**: Associated with the current device/session
2. **Traits are merged**: Added to the user profile
3. **Event is sent**: An `$identify` event is recorded
4. **Enrichment triggered**: Snitcher enriches data based on the email domain

> [!NOTE]
>
> Identification persists across sessions (if cookie consent is granted), so returning visitors are automatically recognized.

## Best Practices

### Include Useful Traits

```javascript theme={null}
// Rich identification
Snitcher.identify("sarah@startup.io", {
  name: "Sarah Chen",
  role: "Head of Growth",
  company: "Startup Inc",
  company_size: "51-200",
  industry: "SaaS",
  plan_interest: "Enterprise",
  source: "demo_request"
});
```

### Identify Early

Call `identify` as soon as you have the email—don't wait:

```javascript theme={null}
// Good: Identify immediately after email capture
emailInput.addEventListener('blur', function() {
  if (isValidEmail(this.value)) {
    Snitcher.identify(this.value);
  }
});
```

### Update Traits Over Time

You can call `identify` multiple times—traits are merged:

```javascript theme={null}
// Initial identification
Snitcher.identify("user@company.com", {
  name: "Alex"
});

// Later, add more info
Snitcher.identify("user@company.com", {
  plan: "Pro",
  upgraded_at: new Date().toISOString()
});

// Result: { name: "Alex", plan: "Pro", upgraded_at: "..." }
```

## Privacy Considerations

> [!WARNING]
>
> Only identify users who have consented to tracking. In regions with strict privacy laws (GDPR, CCPA), ensure you have appropriate consent before calling `identify`.

If you're using consent management:

```javascript theme={null}
// Only identify after consent
if (hasUserConsent()) {
  Snitcher.identify(user.email, { name: user.name });
}
```

## Viewing Identified Users

Identified users appear in your Snitcher dashboard with:

* **Email address** (clickable to reveal company)
* **Associated company** (from email domain + enrichment)
* **Custom traits** you provided
* **Full session history**

## Combining with Custom Events

For complete tracking, combine identification with events:

```javascript theme={null}
// User signs up
Snitcher.identify(email, { name, company });
Snitcher.track("Trial Started", { 
  plan: "Pro",
  source: "website" 
});

// User converts
Snitcher.track("Subscription Started", {
  plan: "Pro",
  mrr: 99
});
```

## Troubleshooting

> **User not showing as identified**
>
> * Verify `identify` was called (check network requests)
> * Ensure email format is valid
> * Check if consent was granted (if using consent management)

> **Traits not appearing**
>
> * Traits may take a few minutes to sync
> * Verify traits are being sent in network request
> * Check for JavaScript errors in console

> **Multiple sessions not linking**
>
> * Ensure cookie consent is granted
> * Check if localStorage is being cleared
> * Verify same email is used across sessions

## Other Ways to Identify Users

> **[Identify Email Recipients](https://docs.snitcher.com/product/tracker/identify-email-recipients.md)**
>
> Don't have user logins or forms? You can identify visitors directly from email clicks by adding tracking parameters to your outbound and marketing emails.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.