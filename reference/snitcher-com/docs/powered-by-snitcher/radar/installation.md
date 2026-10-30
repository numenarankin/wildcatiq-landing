> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Installation

> Get Radar up and running with custom branding for your customers.

Installing Radar is a two-part process. First, you'll perform a **one-time setup** to brand the tracking infrastructure with your own domains. After that, you'll follow a simple workflow to **generate and deploy a unique tracker** for each of your customers.

## Prerequisites

Before installing Radar, ensure you have:

* A Snitcher account with Radar access. Contact support to enable it.
* Your API key for accessing the Radar Operator API.

***

## Part 1: One-Time Branding Setup (Whitelabeling)

> [!NOTE]
>
> This branding setup is highly recommended for a true whitelabel experience. However, it is **optional**. If you prefer to get started quickly without configuring custom domains,
> you can skip this section and use the default Snitcher-branded hosts in your loader script: \\
>
> \
> &#x20;**CDN Host:** `cdn.snitcher.com` \
> &#x20;**API Host:** `radar.snitcher.com`

To make Radar feel completely native to your product, you'll proxy its core services through your own branded domains. This is crucial for maintaining a seamless user experience and ensuring first-party data collection.

The following guides walk through setting this up with **AWS CloudFront**, a common and reliable choice.

> **Configure CDN Proxy (cdn.your-app.com)**
>
> This proxy serves the `radar.js` script from your domain, building trust and improving reliability.
>
> **1. 1. Create CloudFront Distribution**
>
> Log in to the **AWS Console**, navigate to **CloudFront**, and click **Create distribution**. You will be guided through a multi-step wizard.
>
> **Step 1: Get Started**
>
> * **Distribution name (optional):** Give your distribution a memorable name, like `YourApp Radar CDN`.
> * **Custom domain:** Enter your desired subdomain (e.g., `cdn.your-app.com`).
>
> Click **Next**.
>
> ***
>
> **Step 2: Specify Origin**
>
> * **Specify origin type:** Select **Other**.
> * **Custom origin:** Enter `cdn.snitcher.com`.
> * **Settings:** Keep the defaults. Select **Use recommended origin settings** and **Use recommended cache settings**. These defaults are optimized for custom origins and will handle caching, allowed methods (`GET`, `HEAD`), and protocol policies (`Redirect HTTP to HTTPS`) correctly.
>
> Click **Next**.
>
> ***
>
> **Step 3: Enable Security**
>
> * **Web Application Firewall (WAF):** For this basic setup, you can select **Do not enable security protections**.
>
> Click **Next**.
>
> ***
>
> **Step 4: Get TLS Certificate**
>
> * A **Custom SSL certificate** is required to use your custom domain. You must have a certificate for your domain (e.g., `cdn.your-app.com`) available in **AWS Certificate Manager (ACM)** in the **us-east-1** region.
> * CloudFront will automatically find and select the correct certificate for the custom domain you entered in Step 1.
>
> Click **Next**.
>
> ***
>
> **Step 5: Review and Create**
>
> * Review the summary of your settings to ensure they are correct.
> * Click **Create distribution**.
>
> After you create it, wait for the distribution to finish deploying. Once ready, copy the **Distribution domain name** (e.g., `d12345abcdef.cloudfront.net`) for the next step.
>
> **2. 2. Add CNAME Record in Your DNS**
>
> In your domain registrar's DNS panel, create a new `CNAME` record pointing your branded subdomain to CloudFront.
>
> * **Type:** `CNAME`
> * **Name / Host:** `cdn` (or the subdomain you chose)
> * **Value / Points to:** The CloudFront **Distribution domain name** you just copied.
>
> Save the record. DNS changes can take a few minutes to a few hours to propagate.
>
> **3. 3. Verify the Setup**
>
> Once DNS has updated, run the following command in your terminal. A `403 Forbidden` response is expected and confirms the proxy is working correctly.
>
> ```bash theme={null}
> curl -I https://cdn.your-app.com
> ```

> **Configure API Proxy (api.your-app.com)**
>
> This proxy routes all tracking data through your branded endpoint, making Radar's infrastructure invisible.
>
> **1. 1. Create CloudFront Distribution**
>
> Create a second CloudFront distribution with settings optimized for a real-time API. Go to the **AWS Console**, navigate to **CloudFront**, and click **Create distribution**.
>
> **Step 1: Get Started**
>
> * **Distribution name (optional):** `YourApp API Proxy`
> * **Custom domain:** `api.your-app.com`
>
> Click **Next**.
>
> ***
>
> **Step 2: Specify Origin**
>
> * **Specify origin type:** Select **Other**.
> * **Custom origin:** Enter `radar.snitcher.com`.
> * **Settings:** This is the most critical step. Select **Customize cache settings**.
>   * **Cache policy:** From the dropdown, select the managed policy named **`CachingDisabled`**. This ensures API requests are never cached and are always passed through in real-time.
>   * **Origin request policy:** Select the managed policy named **`AllViewerExceptHostHeader`**. This forwards all necessary headers, cookies, and query strings to the Radar API.
>
> Click **Next**.
>
> ***
>
> **Step 3: Enable Security**
>
> * **Web Application Firewall (WAF):** Select **Do not enable security protections**.
>
> Click **Next**.
>
> ***
>
> **Step 4: Get TLS Certificate**
>
> * A **Custom SSL certificate** for `api.your-app.com` must be available in **AWS Certificate Manager (ACM)** in the **us-east-1** region. CloudFront will automatically select it.
>
> Click **Next**.
>
> ***
>
> **Step 5: Review and Create**
>
> * Review the settings and click **Create distribution**.
> * Wait for the distribution to deploy, then copy the **Distribution domain name** (e.g., `d67890uvwxyz.cloudfront.net`).
>
> **2. 2. Disable IPv6 (Important)**
>
> After the distribution is created and deployed, you must disable IPv6.
>
> 1. In the CloudFront distributions list, click on the ID of the API proxy distribution you just created.
> 2. Under the **General** tab, click **Edit**.
> 3. Scroll down to the **Settings** section.
> 4. Find the **IPv6** option and select **Off**.
> 5. Click **Save changes**.
>
> **3. 3. Add CNAME Record in Your DNS**
>
> Create another `CNAME` record in your DNS settings:
>
> * **Type:** `CNAME`
> * **Name / Host:** `api` (or `api.your-app`)
> * **Value / Points to:** The CloudFront **Distribution domain name** you copied for your API proxy.
>
> **4. 4. Verify the Setup**
>
> Run a `curl` command to verify the API proxy. The server should respond with a message confirming the connection is live.
>
> ```bash theme={null}
> curl https://api.your-app.com
> ```

***

## Part 2: Customer Installation Workflow

Once your branded domains are ready, you can start generating trackers for your customers.

**1. Generate a Tracking Script**

For each customer, make a `POST` request to the **Generate a Tracking Script** endpoint in the API Reference.

Include an `internal_identifier` that maps to the customer's ID in your own system. This identifier will be included in every webhook event, making it easy to associate data with the correct customer account.

```bash cURL theme={null}
curl -X POST 'https://api.snitcher.com/radar/operator/v1/tracking-scripts' \
     -H 'Authorization: Bearer YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "internal_identifier": "customer-abc-123",
       "description": "Tracking script for Customer ABC"
     }'
```

```json Response theme={null}
{
  "tracking_script_id": "ts_a1b2c3d4e5f6g7h8",
  "internal_identifier": "customer-abc-123",
  "description": "Tracking script for Customer ABC",
  "created_at": "2025-08-13T18:30:00Z"
}
```

You'll receive a unique `tracking_script_id` for this customer.

**2. Provide the Loader Script**

Construct the loader script for your customer to install on their website. It's crucial to populate the configuration object with your branded domains and the `tracking_script_id` you just generated.

```html HTML theme={null}
<script>
  !function(e){"use strict";var a=e&&e.namespace;if(a&&e.profileId&&e.cdn){var r=window[a];if(r&&Array.isArray(r)||(r=window[a]=[]),!r.initialized&&!r._loaded)if(r._loaded)console&&console.warn("[Radar] Duplicate initialization attempted");else{r._loaded=!0;["track","page","identify","company","group","alias","ready","debug","on","off","once","trackClick","trackSubmit","trackLink","trackForm","pageview","screen","reset","register","setAnonymousId","addSourceMiddleware","addIntegrationMiddleware","addDestinationMiddleware","giveCookieConsent","denyCookieConsent"].forEach((function(e){var i;r[e]=(i=e,function(){var e=window[a];if(e.initialized)return e[i].apply(e,arguments);var r=[].slice.call(arguments);return r.unshift(i),e.push(r),e})})),r.bootstrap=function(){var a=document.createElement("script");a.async=!0,a.type="text/javascript",a.id="__radar__",a.dataset.settings=JSON.stringify(e),a.src="https://"+e.cdn+"/releases/latest/radar.min.js";var r=document.scripts[0];r.parentNode.insertBefore(a,r)},r.bootstrap()}}else"undefined"!=typeof console&&console.error("[Radar] Configuration incomplete")}({
    "cdn": "cdn.your-app.com",
    "apiEndpoint": "api.your-app.com",
    "profileId": "ts_a1b2c3d4e5f6g7h8",
    "namespace": "YourAppName",
    "waitForConsent": true
  });
</script>
```

**Configuration Parameters:**

* `cdn`: **(Required)** Your custom CDN proxy domain (e.g., `cdn.your-app.com`).
* `apiEndpoint`: **(Required)** Your custom API proxy domain (e.g., `api.your-app.com`).
* `profileId`: **(Required)** The unique `tracking_script_id` generated for the customer.
* `namespace`: **(Required)** The name of the global JavaScript object your customers will use to interact with the tracker (e.g., `YourAppName`). This allows them to call functions like `YourAppName.track("Custom Event")`. We recommend using a single, consistent namespace across your entire customer base. This simplifies your own documentation, as you can always instruct your customers to use the same object name. It also prevents conflicts with other scripts on your customer's site.
* `waitForConsent`: **(Optional)** When set to true, the tracker will wait until a visitor has given cookie consent before saving any data in their browser. If consent isn't given, the tracker will still work but will only keep data for the current visit (not saved after the browser is closed). The default is false. See [Consent Management](https://docs.snitcher.com/powered-by-snitcher/radar/consent-management.md) for more details

All of these settings and more can be customized. See the full [Configuration Reference](https://docs.snitcher.com/powered-by-snitcher/radar/configuration.md) for a complete list of options, including how to enable powerful features like automatic session, form, and click tracking.

**3. Verify Installation & Receive Events**

Ask your customer to place the script in the `<head>` section of their website. Once the script is live, Radar will immediately begin to capture events.

You can verify the installation is working by checking your configured webhook endpoint for incoming data.

> **[Capturing Events](https://docs.snitcher.com/powered-by-snitcher/radar/capturing-events.md)**
>
> Learn what events Radar captures automatically and how to track custom actions.

> **[Receiving Events](https://docs.snitcher.com/powered-by-snitcher/radar/receiving-events.md)**
>
> See the data structure of webhook payloads and choose your delivery mode.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.