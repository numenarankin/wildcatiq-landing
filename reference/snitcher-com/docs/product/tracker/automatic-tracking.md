> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Automatic Tracking

> Enable form, click, and download tracking with zero code. Understand what each feature captures and how to use the data.

Snitcher can automatically track common visitor actions without any code changes. Enable these features in **Settings → Tracker → Features**.

## Form Tracking

**What it does:** Captures when visitors submit or abandon forms on your website.

### Events Captured

| Event | When It Fires |
| - | - |
| `$form_submit` | Visitor submits any form |
| `$form_abandon` | Visitor starts filling a form but leaves without submitting |

### Data Collected

* Form ID or name
* Form action URL
* Field names (not values, for privacy)
* Page URL where the form exists

### Why Enable It

* **See which forms convert** - Identify high-performing lead capture forms
* **Find form abandonment issues** - Discover forms that visitors start but don't complete
* **Segment by form submissions** - Create segments like "Submitted contact form" or "Started but didn't submit"

> [!TIP]
>
> Form abandonment data is valuable for identifying UX issues. If many visitors start your pricing calculator but don't complete it, the form might be too long or confusing.

***

## Click Tracking

**What it does:** Tracks clicks on links and buttons, plus enables declarative tracking with `data-track-event` attributes.

### What Gets Tracked

* **All link clicks** - Internal and external navigation
* **Button clicks** - Any `<button>` element
* **Declarative events** - Elements with `data-track-event` attribute

### Data Collected

* Element text (button label, link text)
* Target URL (for links)
* Element position on page
* Custom properties from `data-*` attributes

### Why Enable It

* **Understand navigation patterns** - See which links visitors click most
* **Track CTAs without code** - Know which "Start Free Trial" buttons perform best
* **Enable declarative tracking** - Add `data-track-event` to any element for custom tracking

### Declarative Tracking Example

With click tracking enabled, you can track any element by adding an attribute:

```html theme={null}
<button data-track-event="CTA Clicked" data-location="hero">
  Start Free Trial
</button>
```

No JavaScript required. The click is automatically captured with your custom event name and properties.

> [!NOTE]
>
> See [Declarative Click Tracking](https://docs.snitcher.com/product/tracker/custom-events.md#declarative-click-tracking) for more examples.

***

## Download Tracking

**What it does:** Captures when visitors download files from your website.

### File Types Tracked

| Category | Extensions |
| - | - |
| Documents | `.pdf`, `.doc`, `.docx`, `.txt`, `.rtf` |
| Spreadsheets | `.xls`, `.xlsx`, `.csv` |
| Presentations | `.ppt`, `.pptx` |
| Archives | `.zip`, `.rar`, `.7z`, `.tar`, `.gz` |
| Other | Any link with `download` attribute |

### Data Collected

* File name
* File URL
* File extension
* Page URL where download occurred

### Why Enable It

* **Identify high-intent visitors** - Visitors who download pricing sheets or case studies are often further along in their buying journey
* **Measure content performance** - See which whitepapers, ebooks, or resources get downloaded most
* **Segment by downloads** - Create segments like "Downloaded pricing PDF" for targeted follow-up

> [!TIP]
>
> Downloads often indicate buying intent. A visitor who downloads your ROI calculator or implementation guide is likely evaluating seriously.

***

## Where the Data Appears

Once enabled, tracking data shows up in several places:

### Company Timeline

Each company's timeline shows their tracked events:

* Form submissions and abandonments
* Click events
* File downloads

### Session Details

Drill into any session to see the full sequence of events, including automatic tracking data.

### Segments

Create segments based on automatic tracking events:

* "Submitted a form in the last 7 days"
* "Downloaded any PDF"
* "Clicked pricing page CTA"

### Automations

Trigger automations based on events:

* Send to Slack when someone downloads a case study
* Add a tag when a form is submitted
* Notify sales when high-intent actions occur

***

## Recommended Setup

For most websites, we recommend enabling all three features:

| Feature | Recommendation | Why |
| - | - | - |
| Form Tracking | ✅ Enable | Essential for lead gen sites |
| Click Tracking | ✅ Enable | Valuable for understanding navigation + enables declarative tracking |
| Download Tracking | ✅ Enable | Great for identifying high-intent visitors |

> [!NOTE]
>
> These features track actions, not personal data. Form tracking captures field names but not the values visitors enter.

***

## Going Further

Once you're comfortable with automatic tracking, you can layer on custom events for business-specific actions:

> **[Custom Events](https://docs.snitcher.com/product/tracker/custom-events.md)**
>
> Track purchases, video views, and other custom actions

> **[Best Practices](https://docs.snitcher.com/product/tracker/best-practices.md)**
>
> Get the most out of your tracking setup


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.