> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# First-Party Tracking

> Serve Snitcher's tracker from your own domain: let Snitcher manage it with one DNS record, or run your own proxy.

By default, Snitcher's tracker sends data to `radar.snitcher.com` and loads scripts from `cdn.snitcher.com`. While this works for most websites, some visitors use ad-blockers or privacy tools that may block requests to third-party tracking domains.

**First-party tracking** solves this by routing all Snitcher traffic through your own domain, making it indistinguishable from your website's regular traffic.

## Why Use First-Party Tracking?

> **Bypass Ad-Blockers**
>
> Requests to `your-domain.com` aren't blocked by tools that target third-party trackers.

> **Higher Data Quality**
>
> Capture more pageviews, sessions, and identified users.

> **First-Party Cookies**
>
> Cookies set by your domain have longer lifespans and better browser support.

> **Privacy Compliance**
>
> All data flows through your infrastructure, giving you full control.

## Setup Options

There are two ways to set up first-party tracking:

> **[Managed by Snitcher](#managed-by-snitcher)**
>
> Recommended. Add one DNS record and update your snippet. Snitcher runs the proxy and its certificate for you.

> **[Self-Hosted Proxy](#self-hosted-proxy)**
>
> Run the proxy on your own infrastructure, with CloudFront, nginx, Vercel or Netlify.

## Managed by Snitcher

Snitcher serves the tracker from a subdomain of your website's domain, such as `k3v9tq.yoursite.com`. You point that subdomain at Snitcher with one DNS record, then switch your site to a snippet that loads through it. Snitcher runs the proxy on its own network and issues and renews the SSL certificate, so there's nothing for you to host or maintain.

```
Your Website → k3v9tq.yoursite.com → Snitcher (tracker script and data)
```

Snitcher picks a short random name for the subdomain on purpose: ad blockers block obvious names like `analytics` or `tracking`.

Before you start, make sure that:

* You can edit your domain's DNS records, or a teammate who can is around.
* Your workspace's website address is on your own domain. A site on a hosting platform's shared domain, such as `yoursite.webflow.io`, can't take the DNS record, so set your own domain in your workspace settings first.

### Step 1: Start Setup in Snitcher

Go to **Settings → Tracker → Installation** and click **Start setup** on the "Serve the tracker from your own domain" card. Snitcher picks the subdomain and shows the DNS record to add.

### Step 2: Add the DNS Record

At your DNS provider, create the record shown under **Update DNS**:

| Field | Value |
| - | - |
| Name | Your subdomain, such as `k3v9tq.yoursite.com` |
| Type | `CNAME` |
| Value | The target Snitcher shows, such as `d1234abcd.cloudfront.net` |

Some DNS providers only want the first part of the name, `k3v9tq`.

> [!WARNING]
>
> Turn proxying off for this record. On Cloudflare, set it to **DNS only** (the grey cloud): a proxied record stops the certificate from being issued and the traffic from reaching Snitcher. Keep the record in place afterwards, since the certificate renews through it.

If your domain uses CAA records, they must let Amazon issue the certificate. Add `0 issue "amazon.com"` if it isn't there.

Then click **I've updated the DNS records**. If someone else manages your DNS, click **Ask for help** to email them the record, and click **I've updated the DNS records** once they've added it.

### Step 3: Wait for the Domain to Go Live

Step 1 shows **Waiting for DNS to propagate** while Snitcher checks the record every few minutes. Click **Check DNS records** to check it right away. Once the record points at Snitcher, step 1 shows **Activating** for a few more minutes, then **Live**.

If the record still doesn't resolve after four days, setup stops and says why. Fix the record, then click **Try again**.

### Step 4: Update Your Tracking Snippet

As soon as you confirm the DNS record, step 2 shows your new snippet: your current snippet with `apiEndpoint` and `cdn` pointing at your subdomain.

```javascript theme={null}
{
  "apiEndpoint": "k3v9tq.yoursite.com",
  "cdn": "k3v9tq.yoursite.com",
  "namespace": "Snitcher",
  "profileId": "YOUR_PROFILE_ID"
}
```

> [!WARNING]
>
> Wait until step 1 shows **Live** before you publish the new snippet. Until then it can't reach Snitcher, and tracking pauses. You can prepare the change in the meantime.

Once the domain is live, replace the snippet everywhere it's installed, including shared templates, tag managers and site builders. Each page should load exactly one Snitcher snippet, or visits are tracked twice. If your site sets a Content Security Policy, allow `https://k3v9tq.yoursite.com` in `script-src` and `connect-src`.

The subdomain serves the tracker for every site your workspace tracks, so use the new snippet on all of them.

> [!TIP]
>
> The coding-agent button next to the snippet opens the change in Cursor, Codex or Claude Code, or copies it as a prompt for another agent.

### Step 5: Verify the Installation

Click **Verify installation**. Once visits arrive through your subdomain, the card reads "Serving the tracker from k3v9tq.yoursite.com" and the tracker status reads "Your tracker is live via your own domain". If some pages still load the old snippet, Snitcher tells you: replace it there too and clear any page caches.

### Removing the Domain

Click the pencil next to the domain, then **Remove domain**. Put the standard snippet back on your site first: pages still loading the tracker from your subdomain stop being tracked once the domain is removed.

### Troubleshooting the Managed Setup

> **Stuck on Waiting for DNS to propagate**
>
> * Check the record: `dig CNAME k3v9tq.yoursite.com +short` should return the value Snitcher shows.
> * Make sure the record isn't proxied (Cloudflare's orange cloud).
> * If your domain has CAA records, make sure they allow `amazon.com`.

> **Start setup says your website is on a hosting platform's domain**
>
> Your workspace's website address is on a shared domain such as `yoursite.webflow.io`, where you can't add DNS records. Set it to your own domain in your workspace settings, then start setup again.

> **Some visits still come through cdn.snitcher.com**
>
> A page still loads the old snippet. Search your site and tag manager for your profile ID, `cdn.snitcher.com` and `radar.min.js`, and remove older Snitcher tags such as `snid.snitcher.com/YOUR_PROFILE_ID.js`. Then clear any page or CDN caches and verify again.

## Self-Hosted Proxy

Prefer to run the proxy yourself? Route Snitcher's traffic through your own CloudFront distribution, nginx server, or Vercel or Netlify rewrites.

### How It Works

Instead of:

```
Your Website → cdn.snitcher.com (script)
Your Website → radar.snitcher.com (data)
```

With first-party tracking:

```
Your Website → cdn.yoursite.com → cdn.snitcher.com
Your Website → tracking.yoursite.com → radar.snitcher.com
```

You set up a reverse proxy on your domain that forwards requests to Snitcher's servers. The tracker is configured to use your domain instead of ours.

### Setup Overview

You'll need to configure two proxies:

| Purpose | Your Domain | Proxies To |
| - | - | - |
| Tracker script (CDN) | `cdn.yoursite.com` | `cdn.snitcher.com` |
| Tracking API | `tracking.yoursite.com` | `radar.snitcher.com` |

> [!WARNING]
>
> Avoid subdomains containing words like `analytics`, `tracking`, or `pixel`—some ad-blockers target these patterns. Use neutral names like `api`, `cdn`, or your company abbreviation.

### CloudFront Setup (AWS)

CloudFront is a popular choice for proxying because it's fast, reliable, and easy to configure.

#### Step 1: Create SSL Certificates

If using Route 53 for DNS, create certificates for your proxy domains:

1. Go to **AWS Certificate Manager** in `us-east-1` (required for CloudFront)
2. Request certificates for:
   * `cdn.yoursite.com`
   * `tracking.yoursite.com`
3. Validate via DNS

#### Step 2: Create CloudFront Distribution for the API

1. Go to **CloudFront** → **Create Distribution**
2. Configure the origin:
   * **Origin Domain**: `radar.snitcher.com`
   * **Protocol**: HTTPS Only
3. Configure cache behavior:
   * **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   * **Allowed HTTP Methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   * **Cache Policy**: CachingDisabled
4. Create an **Origin Request Policy** that forwards:
   * Headers: `Origin`, `Accept`, `User-Agent`, `Content-Type`
   * Query strings: All
   * Cookies: All
5. Under **Settings**:
   * Add alternate domain name: `tracking.yoursite.com`
   * Select your SSL certificate
6. Create the distribution

#### Step 3: Create CloudFront Distribution for the CDN

Repeat the process for the CDN:

1. **Origin Domain**: `cdn.snitcher.com`
2. **Alternate Domain**: `cdn.yoursite.com`
3. Use default caching (scripts can be cached)
4. Select your SSL certificate

#### Step 4: Configure DNS

Create CNAME records pointing to your CloudFront distributions:

```
cdn.yoursite.com      → d1234abcd.cloudfront.net
tracking.yoursite.com → d5678efgh.cloudfront.net
```

#### Step 5: Update Your Tracking Script

Modify your Snitcher tracking script to use your proxy domains:

```html theme={null}
<script>
!function(e){"use strict";var t=e&&e.namespace;if(t&&e.profileId&&e.cdn){var i=window[t];if(i&&Array.isArray(i)||(i=window[t]=[]),!i.initialized&&!i._loaded)if(i._loaded)console&&console.warn("[Radar] Duplicate initialization attempted");else{i._loaded=!0;["track","page","identify","company","group","alias","ready","debug","on","off","once","trackClick","trackSubmit","trackLink","trackForm","pageview","screen","reset","register","setAnonymousId","addSourceMiddleware","addIntegrationMiddleware","addDestinationMiddleware","giveCookieConsent","denyCookieConsent"].forEach((function(e){var a;i[e]=(a=e,function(){var e=window[t];if(e.initialized)return e[a].apply(e,arguments);var i=[].slice.call(arguments);return i.unshift(a),e.push(i),e})})),i.bootstrap=function(){var t,i=document.createElement("script");i.async=!0,i.type="text/javascript",i.id="__radar__",i.setAttribute("data-settings",JSON.stringify(e)),i.src="https://"+e.cdn+"/releases/latest/radar.min.js";var a=document.scripts[0];a.parentNode.insertBefore(i,a)},i.bootstrap()}}else"undefined"!=typeof console&&console.error("[Radar] Configuration incomplete")}({
  "apiEndpoint": "tracking.yoursite.com",
  "cdn": "cdn.yoursite.com",
  "namespace": "Snitcher",
  "profileId": "YOUR_PROFILE_ID"
});
</script>
```

Note the changes:

* `apiEndpoint`: Your API proxy domain
* `cdn`: Your CDN proxy domain

### Nginx Setup

If you're running your own infrastructure, nginx is a lightweight proxy option.

#### Nginx Configuration

```nginx theme={null}
# API Proxy
server {
    listen 443 ssl http2;
    server_name tracking.yoursite.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass https://radar.snitcher.com;
        proxy_ssl_server_name on;
        proxy_set_header Host radar.snitcher.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CDN Proxy
server {
    listen 443 ssl http2;
    server_name cdn.yoursite.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass https://cdn.snitcher.com;
        proxy_ssl_server_name on;
        proxy_set_header Host cdn.snitcher.com;
        
        # Cache static assets
        proxy_cache_valid 200 1d;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

### Vercel Rewrites

For Next.js sites on Vercel, use rewrites in `next.config.js`:

```javascript theme={null}
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/sn-api/:path*',
        destination: 'https://radar.snitcher.com/:path*',
      },
      {
        source: '/sn-cdn/:path*',
        destination: 'https://cdn.snitcher.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

Then update your tracking script:

```javascript theme={null}
{
  "apiEndpoint": "yoursite.com/sn-api",
  "cdn": "yoursite.com/sn-cdn",
  ...
}
```

### Netlify Redirects

Add to your `netlify.toml`:

```toml theme={null}
[[redirects]]
  from = "/sn-api/*"
  to = "https://radar.snitcher.com/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/sn-cdn/*"
  to = "https://cdn.snitcher.com/:splat"
  status = 200
  force = true
```

### Testing Your Setup

After configuration, verify everything works:

#### 1. Test the CDN Proxy

```bash theme={null}
curl -I https://cdn.yoursite.com/releases/latest/radar.min.js
```

You should receive a `200 OK` response with JavaScript content.

#### 2. Test the API Proxy

```bash theme={null}
curl https://tracking.yoursite.com/health
```

You should receive a successful response.

#### 3. Check Browser Network Tab

1. Visit your website
2. Open Developer Tools → Network
3. Look for requests to your proxy domains
4. Verify no requests go to `*.snitcher.com`

### Troubleshooting

> **Requests still going to snitcher.com**
>
> * Clear your browser cache
> * Verify your tracking script has the correct `apiEndpoint` and `cdn` values
> * Check that DNS has propagated: `dig cdn.yoursite.com`

> **CORS errors in console**
>
> Ensure your proxy forwards the `Origin` header and returns appropriate CORS headers. CloudFront handles this automatically with the right origin request policy.

> **SSL certificate errors**
>
> * Verify certificates are valid and not expired
> * For CloudFront, certificates must be in `us-east-1`
> * Ensure the certificate covers your proxy subdomain

> **Cloudflare not working**
>
> Cloudflare doesn't support cross-account proxying. If your main domain is on Cloudflare, use a different CDN (CloudFront, Fastly) for the proxy, or use a different subdomain not on Cloudflare.

## Next Steps

> **[Verify Installation](https://docs.snitcher.com/product/tracker/installation.md#verify-installation)**
>
> Confirm tracking is working

> **[Cookie Consent](https://docs.snitcher.com/product/tracker/cookie-consent.md)**
>
> GDPR-compliant setup


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.