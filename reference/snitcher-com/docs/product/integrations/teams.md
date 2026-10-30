> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Microsoft Teams

> Get real-time notifications in Microsoft Teams when target accounts visit your website.

Connect Snitcher to Microsoft Teams to receive instant notifications when important companies visit your website.

## Features

* **Real-time alerts** when companies are identified
* **Rich adaptive cards** with company details
* **Flexible setup** - OAuth or webhook URL
* **Channel selection** - choose where notifications go

## Setup Options

### Option 1: OAuth (Recommended)

Full integration with channel selection:

1. Go to **Settings** → **Integrations** → **Microsoft Teams**
2. Click **Connect Microsoft Teams**
3. Sign in with your Microsoft account
4. Grant permissions to Snitcher
5. Select your team and channel

### Option 2: Incoming Webhook

Simple setup using a webhook URL:

1. In Teams, go to your channel → **Manage channel** → **Connectors**
2. Add **Incoming Webhook**
3. Copy the webhook URL
4. In Snitcher, go to **Settings** → **Integrations** → **Microsoft Teams**
5. Paste the webhook URL

## Configuring Alerts

Teams notifications are triggered through **Automations**:

1. Go to **Automations** in Snitcher
2. Create a new automation
3. Set your trigger (e.g., "New company identified")
4. Add a segment filter
5. Add the **Send to Microsoft Teams** action

## Message Content

Teams notifications include:

* Company name and logo
* Industry and size
* Location
* Website activity summary
* Direct link to view in Snitcher

## Troubleshooting

> **Not receiving notifications**
>
> * Verify the integration is connected
> * Check that you have an active automation
> * For webhooks, verify the URL is correct and the connector is active

> **Channel not appearing**
>
> If using OAuth, ensure you have permission to post to the channel. Try refreshing the channel list.

> **Webhook errors**
>
> Webhook URLs can expire if the connector is removed. Regenerate the webhook in Teams if needed.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.