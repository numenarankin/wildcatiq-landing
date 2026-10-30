> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Identify Email Recipients

> Track and identify visitors who click links in your outbound and marketing emails.

Snitcher can detect when a user clicks a link to your website from an outbound or marketing email. This allows you to collect identities from any clicks in your email campaigns—no form submission required.

This integration significantly increases your identified visitor count, helping you understand how email recipients interact with your content and product before they ever fill out a form.

> [!NOTE]
>
> Snitcher also captures all UTM parameters from email clicks, so you can attribute website activity to specific campaigns.

## Why Email Identification Matters

Snitcher can usually identify which company is visiting your site, but many email clicks are harder to trace—people check emails on their phones, at home, or use privacy-focused email apps that hide their identity.

Email link tracking solves this. When someone clicks a link in your email, you'll know exactly who they are—not just their company, but the actual person.

Instead of "Someone from Acme Corp viewed pricing," you'll see "**Sarah Chen** from Acme Corp viewed pricing."

## How It Works

Add a special parameter to your email links that contains the recipient's email. When they click through:

1. Snitcher reads the email parameter from the URL
2. The visitor is immediately identified
3. All their activity is linked to their email address
4. The parameter is automatically removed from the URL (no ugly query strings)

## Two Ways to Identify

Snitcher supports two methods for passing email addresses in URLs:

### Option 1: Plain Email (`sn_email`)

The simplest approach—pass the email address directly:

```
https://yoursite.com/pricing?sn_email=sarah@acme.com
```

**Pros:** Simple to implement, easy to debug\
**Cons:** Email is visible in the URL

### Option 2: Base64 Encoded (`sn_eid`)

For better privacy and shorter URLs, encode the email as base64:

```
https://yoursite.com/pricing?sn_eid=c2FyYWhAYWNtZS5jb20=
```

**Pros:** Obfuscates the email address, shorter URLs for long email addresses\
**Cons:** Requires encoding step

To encode an email address:

```javascript theme={null}
// JavaScript / Node.js
const email = "sarah@acme.com";
const encoded = Buffer.from(email).toString("base64");
// Result: "c2FyYWhAYWNtZS5jb20="
```

```python theme={null}
# Python
import base64
email = "sarah@acme.com"
encoded = base64.b64encode(email.encode()).decode()
# Result: "c2FyYWhAYWNtZS5jb20="
```

> [!TIP]
>
> Use base64 encoding when generating URLs programmatically or when you want to avoid exposing email addresses in browser history and server logs.

***

## Platform-Specific Setup

### HubSpot

Add Snitcher parameters to your Sales and Marketing email templates.

**For Sales Templates:**

1. Go to **Conversations** → **Templates**
2. Edit your template and add the parameter to your links

**For Marketing Emails:**

1. Go to **Marketing** → **Emails**
2. Edit your template and add the parameter to your links

**URL Parameters:**

If there are no other URL params:

```
?sn_email={{contact.email}}
```

If there are other URL params:

```
&sn_email={{contact.email}}
```

> **Using Base64 Encoding with HubSpot**
>
> For base64-encoded emails, you'll need to create a custom property and workflow:
>
> **1. Create a `base64_email` property** in your Contact object schema.
>
> **2. Create a HubSpot Workflow:**
>
> Set the enrollment trigger to:
>
> * `Email` is known
> * `Email` has been updated in the last 1 day
>
> Add a custom code step:
>
> ```javascript theme={null}
> exports.main = async (event, callback) => {
>   const email = event.inputFields['email'];
>   const base64Encoded = Buffer.from(email).toString("base64");
>
>   callback({
>     outputFields: {
>       base64_email: base64Encoded
>     }
>   });
> }
> ```
>
> Set the output variable to update the contact's `base64_email` property.
>
> **3. Update your templates** to use `{{contact.base64_email}}`:
>
> ```
> ?sn_eid={{contact.base64_email}}
> ```

### Apollo.io

Update your sequence templates to include Snitcher parameters.

1. Go to **Engage** → **Sequences**
2. Edit your email template
3. Add the parameter to your links

If there are no other URL params:

```
?sn_email={{email}}
```

If there are other URL params:

```
&sn_email={{email}}
```

### Salesloft

Update your email templates to include Snitcher parameters.

1. Open the email template editor
2. Add the parameter to your links

If there are no other URL params:

```
?sn_email={{email}}
```

If there are other URL params:

```
&sn_email={{email}}
```

### Outreach

Update your sequence templates to include Snitcher parameters.

1. Open your sequence in the template editor
2. Add the parameter to all links pointing to your website

If there are no other URL params:

```
?sn_email={{email}}
```

If there are other URL params:

```
&sn_email={{email}}
```

### Smartlead

Update your campaign sequence templates to include Snitcher parameters.

1. Open your campaign and go to the **Sequences** tab
2. Edit your email template
3. Add the parameter to any links pointing to your website

If there are no other URL params:

```
?sn_email={{email}}
```

If there are other URL params:

```
&sn_email={{email}}
```

> [!NOTE]
>
> `{{email}}` is a default variable in Smartlead, automatically mapped from your lead list CSV. You can insert it by typing `{{` in the template editor and selecting from the dropdown.

### Lemlist

Update your campaign sequence to include Snitcher parameters.

1. Go to **Campaigns** and open your campaign
2. Click the **Sequences** tab
3. Edit your email step and add the parameter to your links

If there are no other URL params:

```
?sn_email={{email}}
```

If there are other URL params:

```
&sn_email={{email}}
```

### Mailchimp

Use merge tags to include the recipient's email in links.

If there are no other URL params:

```
?sn_email=*|EMAIL|*
```

If there are other URL params:

```
&sn_email=*|EMAIL|*
```

### Constant Contact

Use Constant Contact's **dynamic links** feature to insert the recipient's email address into your link URL.

1. In the email editor, highlight the text or select the button you want to link
2. Click the link icon and choose **Web Page**
3. Enter your URL with the `[[EmailAddress]]` variable

If there are no other URL params:

```
?sn_email=[[EmailAddress]]
```

If there are other URL params:

```
&sn_email=[[EmailAddress]]
```

> [!NOTE]
>
> Dynamic link variables like `[[EmailAddress]]` don't resolve when you preview or send a test email—they only populate during a live, scheduled send. To verify, send a real campaign to yourself and click the link.

### Customer.io

Use Liquid templating to include the email in links.

If there are no other URL params:

```
?sn_email={{customer.email}}
```

If there are other URL params:

```
&sn_email={{customer.email}}
```

### beehiiv

Use beehiiv's merge tags to include the subscriber's email in your newsletter links.

1. Open the post editor
2. Select or create a link or button pointing to your website
3. Add the parameter to the URL

If there are no other URL params:

```
?sn_email={{email}}
```

If there are other URL params:

```
&sn_email={{email}}
```

> [!NOTE]
>
> `email` is a reserved field in beehiiv, so it works out of the box—no custom fields needed. Merge tags work inside both hyperlink URLs and button URLs.

### Marketo

Use Marketo tokens in your email templates.

If there are no other URL params:

```
?sn_email={{lead.Email Address}}
```

If there are other URL params:

```
&sn_email={{lead.Email Address}}
```

***

## Custom Implementation

For any email platform or custom-built emails, simply append the appropriate parameter to your links:

### Using Plain Email

```
https://yoursite.com/demo?sn_email=recipient@company.com
```

### Using Base64 Encoding

```javascript theme={null}
// Generate the encoded ID
const email = "recipient@company.com";
const encodedId = Buffer.from(email).toString("base64");

// Construct the URL
const url = `https://yoursite.com/demo?sn_eid=${encodedId}`;
// Result: https://yoursite.com/demo?sn_eid=cmVjaXBpZW50QGNvbXBhbnkuY29t
```

***

## Adding Traits to Email Links

You can enrich identification with additional traits by adding `sn_trait_` parameters to your URLs. Snitcher detects any parameter following the pattern `sn_trait_<property>` and includes it in the user's profile.

**Example traits:**

```
?sn_email=sarah@acme.com&sn_trait_first_name=Sarah&sn_trait_last_name=Chen&sn_trait_title=VP%20Marketing
```

This identifies the visitor with:

* Email: [sarah@acme.com](mailto:sarah@acme.com)
* First Name: Sarah
* Last Name: Chen
* Title: VP Marketing

```javascript JavaScript theme={null}
const params = new URLSearchParams({
  sn_email: "sarah@acme.com",
  sn_trait_first_name: "Sarah",
  sn_trait_last_name: "Chen",
  sn_trait_title: "VP Marketing",
  sn_trait_company: "Acme Corp"
});

const url = `https://yoursite.com/demo?${params.toString()}`;
```

```python Python theme={null}
from urllib.parse import urlencode

params = urlencode({
    "sn_email": "sarah@acme.com",
    "sn_trait_first_name": "Sarah",
    "sn_trait_last_name": "Chen",
    "sn_trait_title": "VP Marketing",
    "sn_trait_company": "Acme Corp"
})

url = f"https://yoursite.com/demo?{params}"
```

### Common Traits to Include

| Trait | Parameter | Example |
| - | - | - |
| First Name | `sn_trait_first_name` | `Sarah` |
| Last Name | `sn_trait_last_name` | `Chen` |
| Full Name | `sn_trait_name` | `Sarah Chen` |
| Job Title | `sn_trait_title` | `VP Marketing` |
| Company | `sn_trait_company` | `Acme Corp` |
| Phone | `sn_trait_phone` | `+1-555-123-4567` |

> [!TIP]
>
> URL encode trait values that contain spaces or special characters. For example, "VP Marketing" becomes `VP%20Marketing`.

***

## Best Practices

> **Use Base64 for Programmatic URLs**
>
> When generating links via code (APIs, scripts, automation), use `sn_eid` to keep emails out of logs and analytics.

> **Test Your Links**
>
> Before sending a campaign, click a test link and verify the visitor appears identified in Snitcher.

> **Include Key Traits**
>
> Add name and title traits to make identified visitors immediately actionable for sales.

> **Combine with UTMs**
>
> Use UTM parameters for campaign attribution (`utm_campaign`, `utm_content`) alongside Snitcher's `sn_*` params for identity.

### Combine with UTM Parameters

Snitcher's `sn_*` parameters identify **who** clicked your link. UTM parameters tell you **what** they clicked and **where** it came from. We recommend always using both together.

Most email platforms (HubSpot, Mailchimp, ActiveCampaign, etc.) already have built-in UTM tagging—keep using that alongside Snitcher parameters.

| Purpose | Parameters | Example |
| - | - | - |
| Who clicked | `sn_email`, `sn_trait_*` | `sn_email=sarah@acme.com` |
| Which campaign | `utm_campaign` | `utm_campaign=spring_launch` |
| Which channel | `utm_source`, `utm_medium` | `utm_source=email&utm_medium=outreach` |
| Which link | `utm_content` | `utm_content=hero_cta` |

### Example: Complete Email Link

A fully instrumented email link might look like:

```
https://yoursite.com/case-studies?utm_source=email&utm_medium=outreach&utm_campaign=q1-enterprise&utm_content=case_study_cta&sn_email=sarah@acme.com&sn_trait_first_name=Sarah&sn_trait_company=Acme%20Corp
```

Or with base64 encoding:

```
https://yoursite.com/case-studies?utm_source=email&utm_medium=outreach&utm_campaign=q1-enterprise&utm_content=case_study_cta&sn_eid=c2FyYWhAYWNtZS5jb20=&sn_trait_first_name=Sarah&sn_trait_company=Acme%20Corp
```

***

## Privacy Considerations

> [!WARNING]
>
> Only use email link tracking for emails you send directly to recipients. Never expose email addresses in public links, social posts, or anywhere they could be accessed by unintended parties.

Email link tracking is designed for:

* Sales outreach emails
* Marketing campaigns to your own lists
* Transactional emails
* Newsletter links

**Not appropriate for:**

* Public landing pages
* Social media posts
* Shared documents
* Any link that could be forwarded or shared publicly

***

## Troubleshooting

> **Visitor not showing as identified**
>
> * Verify the parameter name is correct (`sn_email` or `sn_eid`)
> * Check that the Snitcher tracker is installed on the landing page
> * Ensure the email format is valid
> * For base64, verify the encoding is correct (no padding issues)

> **Base64 encoding not working**
>
> Make sure you're using standard base64 encoding. Test your encoding:
>
> ```javascript theme={null}
> // Encode
> const encoded = Buffer.from("test@example.com").toString("base64");
> console.log(encoded); // "dGVzdEBleGFtcGxlLmNvbQ=="
>
> // Decode to verify
> const decoded = Buffer.from(encoded, "base64").toString();
> console.log(decoded); // "test@example.com"
> ```

> **Traits not appearing on profile**
>
> * Ensure trait parameters follow the `sn_trait_` prefix pattern
> * Check that values are properly URL encoded
> * Traits should appear within a few minutes of the click

> **Parameter still visible in URL after page load**
>
> Snitcher automatically removes identification parameters from the URL. If they persist:
>
> * Check that the tracker script is loading correctly
> * Verify there are no JavaScript errors on the page
> * Ensure the tracker version is up to date

## Next Steps

> **[Identify Users](https://docs.snitcher.com/product/tracker/identify-users.md)**
>
> Learn about the `identify()` method for form and login identification

> **[Custom Events](https://docs.snitcher.com/product/tracker/custom-events.md)**
>
> Track specific actions taken by identified visitors


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.