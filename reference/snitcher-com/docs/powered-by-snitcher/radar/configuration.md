> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuration

> A complete reference for all the options available in the Radar loader script configuration.

The Radar loader script accepts a configuration object that allows you to customize its behavior, enable features, and manage integrations. While only a few parameters are required for basic setup, a rich set of options is available for advanced use cases.

## Basic Configuration

These are the essential parameters required to get Radar running.

**profileId** `string` *required*

The unique tracking script ID generated for each of your customers via the Operator API. This ensures data is routed to the correct account.

**namespace** `string` *required*

The name of the global JavaScript object your customers will use to interact
with the tracker (e.g., `YourAppName`). This allows them to call functions
like `YourAppName.track("Custom Event")`. We recommend using a single,
consistent namespace across all customers.

**cdn** `string`

Your custom CDN proxy domain (e.g., `cdn.your-app.com`). Defaults to
`cdn.snitcher.com` if not provided.

**apiEndpoint** `string`

Your custom API proxy domain (e.g., `api.your-app.com`). Defaults to
`radar.snitcher.com` if not provided.

**debug** `boolean` (default: false)

When `true`, enables verbose console logging from the tracker. Useful for debugging during development. Should be set to `false` in production.

## Feature Flags

The `features` object allows you to enable or disable specific automatic tracking capabilities.

```javascript theme={null}
!(function (e) {
  /* ...loader script... */
})({
  profileId: "ts_a1b2c3d4e5f6g7h8",
  namespace: "YourAppName",
  features: {
    formTracking: true,
    clickTracking: true,
    downloadTracking: true,
  },
});
```

**features.formTracking** `boolean` (default: false)

When `true`, enables automatic tracking of form interactions, including:

* `$form_start`: When a user first interacts with a form.
* `$form_submit`: When a form is submitted.
* `$form_abandon`: When a user interacts with a form but leaves the page
  before submitting.

Radar automatically redacts values from fields commonly associated with sensitive data (e.g., `password`, `credit_card`).

**features.clickTracking** `boolean` (default: false)

When `true`, automatically captures clicks on links, buttons, and elements with a `data-track-event` attribute.

**features.downloadTracking** `boolean` (default: false)

When `true`, automatically tracks clicks on links that point to files with common document extensions (e.g., `.pdf`, `.docx`, `.zip`).

**features.errorCapture** `boolean` (default: false)

When `true`, the tracker will report its own internal JavaScript errors to Snitcher for debugging purposes.

## Consent Management

**waitForConsent** `boolean` (default: false)

If set to `true`, Radar will not use persistent storage (cookies or `localStorage`) until the `giveCookieConsent()` method is called, or user consent is provided through one of the supported consent management platforms (CMP). This is essential for complying with privacy regulations like GDPR. See the [Consent Management](https://docs.snitcher.com/powered-by-snitcher/radar/consent-management.md) guide for more details.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.