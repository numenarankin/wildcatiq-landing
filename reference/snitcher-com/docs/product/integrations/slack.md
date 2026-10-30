> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Slack

> Get real-time notifications in Slack when target accounts visit your website.

Connect Snitcher to Slack to receive instant notifications when important companies visit your website.

## Features

* **Real-time alerts** when companies are identified
* **Multiple channels** - route different segments to different channels
* **Rich messages** with company details and quick actions
* **Customizable** - choose what data to include

## Setup

1. Go to **Settings** → **Integrations** → **Slack**
2. Click **Connect Slack**
3. Select your Slack workspace
4. Choose a default channel for notifications
5. Configure which companies trigger alerts via Automations

## Configuring Alerts

Slack notifications are triggered through **Automations**:

1. Go to **Automations** in Snitcher
2. Create a new automation
3. Set your trigger (e.g., "New company identified")
4. Add a segment filter (e.g., "Enterprise companies")
5. Add the **Send to Slack** action
6. Choose the channel

### Example Automations

| Automation | Trigger | Segment | Channel |
| - | - | - | - |
| Hot leads | New company | ICP Match | #sales-alerts |
| Target accounts | Company visit | Named Accounts | #target-accounts |
| Enterprise | New company | 500+ employees | #enterprise |

## Message Content

Slack notifications include:

* Company name and logo
* Industry and employee count
* Location
* Pages viewed
* Session duration
* Link to view in Snitcher

## Channel Management

* **Default channel** - where notifications go if no automation specifies otherwise
* **Multiple channels** - use automations to route to different channels
* **Private channels** - invite the Snitcher bot first

> [!TIP]
>
> Create a dedicated channel like `#website-visitors` to keep notifications organized without cluttering your main channels.

## Troubleshooting

> **Not receiving notifications**
>
> * Verify the integration shows as "Connected"
> * Check that you have an active automation with Slack action
> * Ensure the segment filter isn't too restrictive
> * Verify the Snitcher bot is in the target channel

> **Wrong channel**
>
> Update the channel in your automation settings, or change the default channel in integration settings.

> **Bot not in channel**
>
> For private channels, invite the Snitcher bot by typing `/invite @Snitcher` in the channel.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.