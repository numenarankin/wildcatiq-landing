> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Tracker Installation

> Install the Snitcher JavaScript tracker on your website in minutes. Supports WordPress, Next.js, Webflow, Shopify, Google Tag Manager, and more.

**Install the Snitcher tracker by adding a lightweight JavaScript snippet to your website's `<head>` section.** The tracker works on any website platform including WordPress, Next.js, Webflow, Shopify, and via Google Tag Manager. Once installed, it automatically captures pageviews, sessions, and identifies companies visiting your site.

## Quick Start

1. Log in to your [Snitcher Dashboard](https://app.snitcher.com)
2. Navigate to **Settings → Tracker → Installation Instructions**
3. Copy your unique tracking script
4. Paste it into the `<head>` section of your website

## Your Tracking Script

Your tracking script looks like this (with your unique `profileId`):

```html theme={null}
<script>
!function(e){"use strict";var t=e&&e.namespace;if(t&&e.profileId&&e.cdn){var i=window[t];if(i&&Array.isArray(i)||(i=window[t]=[]),!i.initialized&&!i._loaded)if(i._loaded)console&&console.warn("[Radar] Duplicate initialization attempted");else{i._loaded=!0;["track","page","identify","company","group","alias","ready","debug","on","off","once","trackClick","trackSubmit","trackLink","trackForm","pageview","screen","reset","register","setAnonymousId","addSourceMiddleware","addIntegrationMiddleware","addDestinationMiddleware","giveCookieConsent","denyCookieConsent"].forEach((function(e){var a;i[e]=(a=e,function(){var e=window[t];if(e.initialized)return e[a].apply(e,arguments);var i=[].slice.call(arguments);return i.unshift(a),e.push(i),e})})),i.bootstrap=function(){var t,i=document.createElement("script");i.async=!0,i.type="text/javascript",i.id="__radar__",i.setAttribute("data-settings",JSON.stringify(e)),i.src="https://"+e.cdn+"/releases/latest/radar.min.js";var a=document.scripts[0];a.parentNode.insertBefore(i,a)},i.bootstrap()}}else"undefined"!=typeof console&&console.error("[Radar] Configuration incomplete")}({
  "apiEndpoint": "radar.snitcher.com",
  "cdn": "cdn.snitcher.com",
  "namespace": "Snitcher",
  "profileId": "YOUR_PROFILE_ID"
});
</script>
```

> [!WARNING]
>
> Always copy the script from your dashboard to get your unique `profileId`. Do not modify the script code.

## Installation Methods

> **Direct HTML Installation**
>
> Add the tracking script directly to your website's HTML:
>
> 1. Open your website's HTML template or CMS settings
> 2. Locate the `<head>` section
> 3. Paste the tracking script immediately before the closing `</head>` tag
> 4. Save and publish your changes
>
> ```html theme={null}
> <head>
>   <!-- Other head elements -->
>
>   <!-- Snitcher Tracking Script -->
>   <script>
>     <!-- Your tracking script here -->
>   </script>
> </head>
> ```

> **Google Tag Manager**
>
> Deploy Snitcher via Google Tag Manager:
>
> 1. Log in to [Google Tag Manager](https://tagmanager.google.com)
>
> 2. Create a new **Custom HTML** tag
>
> 3. Paste your Snitcher tracking script
>
> 4. Set the trigger to **All Pages**
>
> 5. Save and publish your container
>
> > [!TIP]
> >
> > For GTM, ensure the tag fires on all pages and before other marketing tags for best results.

> **WordPress**
>
> **Option 1: Using a Plugin**
>
> Use a header script plugin like "Insert Headers and Footers":
>
> 1. Install and activate the plugin
> 2. Go to Settings > Insert Headers and Footers
> 3. Paste your tracking script in the "Scripts in Header" section
> 4. Save changes
>
> **Option 2: Theme Editor**
>
> 1. Go to Appearance > Theme Editor
>
> 2. Select `header.php`
>
> 3. Add the script before `</head>`
>
> 4. Update the file
>
> > [!WARNING]
> >
> > When using the theme editor, your changes may be lost when the theme updates. Use a child theme or plugin method for persistence.

> **Webflow**
>
> 1. Go to **Project Settings > Custom Code**
> 2. Paste the script in the **Head Code** section
> 3. Save changes
> 4. **Publish** your site (changes won't appear until published)

> **Shopify**
>
> 1. Go to **Online Store > Themes**
> 2. Click **Actions > Edit Code**
> 3. Find and open `theme.liquid`
> 4. Paste the script just before `</head>`
> 5. Save the file

> **Wix**
>
> 1. Go to **Settings > Custom Code**
> 2. Click **+ Add Custom Code**
> 3. Paste your tracking script
> 4. Set placement to **Head** and pages to **All Pages**
> 5. Apply and publish

> **Squarespace**
>
> 1. Go to **Settings > Advanced > Code Injection**
> 2. Paste the script in the **Header** section
> 3. Save changes

> **HubSpot CMS**
>
> 1. Go to **Settings > Website > Pages**
> 2. Click **Templates** or go to the specific page
> 3. Add the script to the **Site Header HTML** section
> 4. Publish changes

> **Next.js**
>
> **App Router (Next.js 13+)**
>
> Create a client component for the tracker:
>
> ```tsx theme={null}
> // components/SnitcherTracker.tsx
> 'use client';
>
> import Script from 'next/script';
>
> export function SnitcherTracker() {
>   return (
>     <Script
>       id="snitcher-tracker"
>       strategy="afterInteractive"
>       dangerouslySetInnerHTML={{
>         __html: `
>           !function(e){"use strict";var t=e&&e.namespace;if(t&&e.profileId&&e.cdn){var i=window[t];if(i&&Array.isArray(i)||(i=window[t]=[]),!i.initialized&&!i._loaded)if(i._loaded)console&&console.warn("[Radar] Duplicate initialization attempted");else{i._loaded=!0;["track","page","identify","company","group","alias","ready","debug","on","off","once","trackClick","trackSubmit","trackLink","trackForm","pageview","screen","reset","register","setAnonymousId","addSourceMiddleware","addIntegrationMiddleware","addDestinationMiddleware","giveCookieConsent","denyCookieConsent"].forEach((function(e){var a;i[e]=(a=e,function(){var e=window[t];if(e.initialized)return e[a].apply(e,arguments);var i=[].slice.call(arguments);return i.unshift(a),e.push(i),e})})),i.bootstrap=function(){var t,i=document.createElement("script");i.async=!0,i.type="text/javascript",i.id="__radar__",i.setAttribute("data-settings",JSON.stringify(e)),i.src="https://"+e.cdn+"/releases/latest/radar.min.js";var a=document.scripts[0];a.parentNode.insertBefore(i,a)},i.bootstrap()}}else"undefined"!=typeof console&&console.error("[Radar] Configuration incomplete")}({
>             "apiEndpoint": "radar.snitcher.com",
>             "cdn": "cdn.snitcher.com",
>             "namespace": "Snitcher",
>             "profileId": "YOUR_PROFILE_ID"
>           });
>         `,
>       }}
>     />
>   );
> }
> ```
>
> Add to your root layout:
>
> ```tsx theme={null}
> // app/layout.tsx
> import { SnitcherTracker } from '@/components/SnitcherTracker';
>
> export default function RootLayout({ children }) {
>   return (
>     <html>
>       <body>
>         {children}
>         <SnitcherTracker />
>       </body>
>     </html>
>   );
> }
> ```
>
> **Pages Router**
>
> Add to `_app.tsx`:
>
> ```tsx theme={null}
> // pages/_app.tsx
> import Script from 'next/script';
>
> export default function MyApp({ Component, pageProps }) {
>   return (
>     <>
>       <Script
>         id="snitcher-tracker"
>         strategy="afterInteractive"
>         dangerouslySetInnerHTML={{
>           __html: `// Paste your Snitcher snippet here`,
>         }}
>       />
>       <Component {...pageProps} />
>     </>
>   );
> }
> ```
>
> **Identifying Users**
>
> ```tsx theme={null}
> // After login or form submission
> if (typeof window !== 'undefined' && window.Snitcher) {
>   window.Snitcher.identify('user@example.com', {
>     name: 'User Name'
>   });
> }
> ```

> **React (Vite, CRA)**
>
> For React apps without Next.js, add the script to your `index.html`:
>
> ```html theme={null}
> <!-- public/index.html -->
> <head>
>   <!-- Your Snitcher script here -->
> </head>
> ```
>
> Or load it dynamically in your app:
>
> ```tsx theme={null}
> // src/hooks/useSnitcher.ts
> import { useEffect } from 'react';
>
> export function useSnitcher() {
>   useEffect(() => {
>     // Skip if already loaded
>     if (window.Snitcher) return;
>
>     const script = document.createElement('script');
>     script.innerHTML = `/* Your Snitcher snippet */`;
>     document.head.appendChild(script);
>   }, []);
> }
>
> // Usage in App.tsx
> function App() {
>   useSnitcher();
>   return <div>...</div>;
> }
> ```
>
> **TypeScript Types**
>
> Add type declarations for Snitcher:
>
> ```typescript theme={null}
> // src/types/snitcher.d.ts
> interface Snitcher {
>   track: (event: string, properties?: Record<string, any>) => void;
>   identify: (email: string, traits?: Record<string, any>) => void;
>   on: (event: string, callback: (...args: any[]) => void) => void;
> }
>
> declare global {
>   interface Window {
>     Snitcher?: Snitcher;
>   }
> }
> ```

## Verify Installation

After installing the script:

1. Visit your website in a new browser tab
2. Open your browser's Developer Tools (F12 or right-click > Inspect)
3. Go to the **Network** tab
4. Look for requests to `radar.snitcher.com` or `cdn.snitcher.com`
5. In your Snitcher dashboard, you should see data appear within a few minutes

> [!TIP]
>
> Don't forget to clear any caches (CDN, browser, CMS) after installing the script.

## What Gets Tracked Automatically

Once installed, Snitcher automatically tracks:

| Event | Description |
| - | - |
| **Pageviews** | Every page load and client-side navigation |
| **Sessions** | Visitor sessions with engagement time |
| **Referrer** | Where visitors came from |
| **UTM Parameters** | Campaign tracking data |
| **Device Info** | Browser, OS, and device type |

## Optional Features

Enable additional tracking by adding feature flags to your script configuration:

```javascript theme={null}
{
  "profileId": "YOUR_PROFILE_ID",
  "features": {
    "formTracking": true,      // Track form submissions
    "clickTracking": true,     // Track button and link clicks
    "downloadTracking": true   // Track file downloads
  }
}
```

> [!NOTE]
>
> Feature flags are configured in your Snitcher dashboard. Changes apply automatically without updating your tracking script.

## Content Security Policy (CSP)

If your website uses a strict Content Security Policy, you'll need to allow Snitcher's domains for the tracker to work properly.

### Required CSP Directives

Add these endpoints to your CSP:

**For `script-src`:**

```
https://cdn.snitcher.com
```

**For `connect-src`:**

```
https://radar.snitcher.com
https://cdn.snitcher.com
```

### Example CSP Header

```http theme={null}
Content-Security-Policy: 
  script-src 'self' https://cdn.snitcher.com;
  connect-src 'self' https://radar.snitcher.com https://cdn.snitcher.com;
```

### Using a Nonce

If you use nonces for inline scripts, you can either:

1. Add the nonce to the Snitcher script tag
2. Use the external script approach instead of inline

> [!NOTE]
>
> If you're using [first-party tracking](https://docs.snitcher.com/product/tracker/first-party-tracking.md), update your CSP to use your proxy domains instead.

## Cross-Subdomain Tracking

Snitcher automatically tracks visitors across subdomains of the same root domain:

| Domain | Tracked Together? |
| - | - |
| `example.com` + `app.example.com` | ✅ Yes |
| `example.com` + `docs.example.com` | ✅ Yes |
| `example.com` + `otherdomain.com` | ❌ No (different root domains) |

### How It Works

When you install the tracker on multiple subdomains, Snitcher:

1. Sets cookies on the root domain (`.example.com`)
2. Shares the device ID across all subdomains
3. Links sessions from different subdomains to the same visitor

### Installation Across Subdomains

Install the **same tracking script** on all subdomains. Use the same `profileId`:

```javascript theme={null}
// Same script on example.com, app.example.com, docs.example.com
{
  "profileId": "YOUR_PROFILE_ID",
  ...
}
```

> [!TIP]
>
> If a visitor is identified on any subdomain (via form or login), they'll be identified across all subdomains automatically.

### Different Root Domains

For completely different domains (e.g., `yourcompany.com` and `yourblog.io`), visitors are tracked separately. They'll be merged if the same user identifies on both domains.

## Troubleshooting

> **How do I verify the tracker is installed?**
>
> 1. Open your browser's Developer Tools (F12)
> 2. Go to the **Console** tab
> 3. Type `Snitcher` and press Enter
> 4. You should see an array or object—not "undefined"
>
> Alternatively, check the **Network** tab for requests to `cdn.snitcher.com`.

> **Events are not appearing in my dashboard**
>
> * Clear your browser cache and try again
> * Check if an ad-blocker is blocking requests to `*.snitcher.com`
> * Verify your `profileId` matches what's in your dashboard
> * Look for JavaScript errors in the Console tab

> **Tracker conflicts with another library**
>
> If `Snitcher` conflicts with another global variable, you can use a custom namespace:
>
> ```javascript theme={null}
> {
>   "namespace": "MySnitcher",
>   ...
> }
> ```
>
> Then access the tracker via `window.MySnitcher` instead.

> **CSP errors in the console**
>
> If you see Content Security Policy errors:
>
> 1. Add `https://cdn.snitcher.com` to your `script-src` directive
> 2. Add `https://radar.snitcher.com` to your `connect-src` directive
>
> See the [CSP section](#content-security-policy-csp) above for details.

## Need Help?

> **[Help Center](https://help.snitcher.com/en/articles/6166598-how-do-i-install-the-snitcher-tracker-on-my-website)**
>
> Step-by-step guides with screenshots

> **[Support](https://app.snitcher.com)**
>
> Contact our support team via live chat


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.