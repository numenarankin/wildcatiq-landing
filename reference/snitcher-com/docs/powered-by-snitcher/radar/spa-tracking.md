> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# SPA & Client-Side Routing

> How Radar automatically tracks pageviews in your customers' Single-Page Applications (SPAs).

Radar is designed to work seamlessly with modern Single-Page Applications (SPAs) built with frameworks like React, Vue, or Svelte, which your customers may be using.

## Automatic Pageview Tracking

By default, Radar automatically detects client-side route changes on your customer's website. In modern browsers, it uses the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) for reliable detection. In older browsers, it falls back to monkey-patching the browser's History API (`pushState` and `replaceState`) and listening for the `popstate` event.

This means that for the vast majority of your customers' SPAs, you do **not** need to provide any extra configuration to get accurate pageview tracking. As long as their routing library uses standard browser navigation, Radar will automatically fire a `$pageview` event every time the route changes.

## Manual Tracking with the `page` Method

In some rare cases, your customer may need to manually tell Radar when a pageview has occurred. The `YourAppName.page()` method is provided for these scenarios.

You should advise your customers to use this if:

* Their application uses a routing library that does not interact with the browser's History API in a standard way.
* They want to record a pageview for an interaction that doesn't change the URL, such as opening a significant modal window.

To manually trigger a pageview, your customer would call the `page` method:

```javascript theme={null}
// Your customer would call this to manually trigger a pageview event
YourAppName.page();
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.