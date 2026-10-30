> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Capturing Events

> How Radar tracks pageviews, interactions, and custom behavior on your customers' sites.

Radar's tracking script is designed to capture key user interactions automatically while giving you the tools to let your customers track what's unique to their sites.

## Automatic Event Capture

Once installed on your customer's site, Radar automatically captures `$pageview` events. You can enable more advanced automatic event tracking by setting the appropriate [feature flags](https://docs.snitcher.com/powered-by-snitcher/radar/configuration.md#feature-flags) in your configuration.

### Page Tracking (Enabled by Default)

* **`$pageview`**: Fired every time a page is loaded or the URL hash changes. Includes details like the page URL, title, and referrer. When a user navigates away from a page, Radar captures engagement data (total time on page and engaged time) and includes it in the event as `$total_time_on_page` and `$engaged_time_on_page` properties.

### Form Tracking (`features.formTracking`)

When you enable `formTracking`, Radar will automatically capture the following events on your customers' websites:

* **`$form_start`**: Fired when a user first interacts with a form field (e.g., focus or input). Includes the form's ID.
* **`$form_submit`**: Fired when a user successfully submits a form. The event includes the form's name, ID, and all non-sensitive field values.
* **`$form_abandon`**: Fired when a user interacts with a form's fields but navigates away from the page without submitting.

> [!NOTE]
>
> Radar automatically redacts data from fields that appear to be sensitive (e.g., fields with names like `password`, `credit_card`, `ssn`).

### Click & Download Tracking (`features.clickTracking`, `features.downloadTracking`)

* **Click Tracking**: When you enable `clickTracking`, Radar automatically captures clicks on `<a>` and `<button>` elements, as well as any element with a `data-track-event` attribute on your customer's site. Each click event includes the element's text, href, CSS classes, DOM path, data attributes, and parent element info.
* **Download Tracking**: When you enable `downloadTracking`, Radar will fire a `$download` event when a user clicks a link that points to a common file type. Supported extensions include documents (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.pptx`), archives (`.zip`, `.rar`, `.7z`, `.tar`, `.gz`), media (`.mp4`, `.mp3`, `.mov`, `.wav`), and design files (`.psd`, `.ai`, `.sketch`, `.fig`). The event includes the file name and link href.

***

## Tracking Custom Events

For actions specific to your customers' applications, you can provide documentation and examples showing them how to send custom events using the `track` method, which is exposed by the `namespace` you defined in the loader script.

```javascript theme={null}
// Your customer would implement this on their site
// to track a specific action.
YourAppName.track("CTA Clicked");
```

> [!TIP]
>
> Advise your customers to use a consistent `[Object] [Verb]` naming convention to keep their events organized and readable. For example: `File Downloaded`, `User Upgraded`, or `Video Played`.

### Adding Event Properties

You should instruct your customers on how they can enrich custom events with metadata by passing a second argument containing a JSON object. This is essential for capturing the full context of an action.

```js theme={null}
// Example for your customer's documentation
YourAppName.track("CTA Clicked", {
  cta_text: "Try for free",
  cta_position: "navbar-right",
});
```

These properties will be included in the `event_properties` object of the webhook payload you receive. See an example in [Receiving Events](https://docs.snitcher.com/powered-by-snitcher/radar/receiving-events.md#example-custom-event-session-based).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.