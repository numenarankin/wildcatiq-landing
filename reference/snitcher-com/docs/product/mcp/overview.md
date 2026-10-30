> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# MCP Server

> Connect Snitcher to Claude, ChatGPT, and other AI assistants with the Snitcher MCP server. Explore identified companies, manage segments, reveal contacts, and sync to your CRM in natural language.

**The Snitcher MCP server gives AI assistants secure access to your Snitcher workspace.** Ask Claude, ChatGPT, or any MCP-compatible client to look up identified companies, dig into their website activity, build segments, reveal contacts, and push accounts to your CRM — all in plain language, using your own Snitcher permissions.

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard for connecting AI assistants to external tools and data. Snitcher hosts a remote MCP server, so there's nothing to install — you connect your AI client once over OAuth and start asking questions.

## Why use it

* **No setup beyond a one-time connection.** Snitcher hosts the server. Add the URL to your AI client, sign in with your Snitcher account, and you're done.
* **Work in natural language.** Skip the dashboard for everyday questions — "Which enterprise companies visited pricing this week?" — and let the assistant call the right tools.
* **Your data, your permissions.** The server acts as *you*. It can only see and change what your Snitcher account can, scoped to the workspaces you have access to.
* **Read and act in one place.** Go from "who visited" to "tag them, add them to a segment, and sync to HubSpot" without leaving the conversation.
* **Safe by default.** Write actions are confirmed before they run, credit-consuming actions state the cost first, and destructive changes preview as a dry run.

## What you can do

> **Explore visitors**
>
> List and inspect identified companies, their website sessions, engagement, and top pages.

> **Find the right accounts**
>
> Build and refine segments with filters, then list the companies that match.

> **Reach the right people**
>
> See contacts and buyer personas at a company, and reveal verified email addresses.

> **Organize and act**
>
> Tag companies, update notes, set custom fields, and push accounts to your CRM, Slack, or Teams.

## Getting started

### Prerequisites

* An active Snitcher account with access to at least one workspace.
* An MCP-compatible AI client — for example [Claude](https://claude.ai) (web, desktop, or mobile), ChatGPT, Cursor, or any client that supports remote MCP servers.

### Connection URL

Connect your client to the Snitcher MCP server at:

```
https://app.snitcher.com/mcp/snitcher
```

Authentication uses OAuth. When you add the connector, your client opens a Snitcher sign-in page in the browser; approve access and you're connected. No API keys to copy or rotate.

**Claude**

1. Open **Settings → Connectors** (in Claude on the web or desktop).
2. Choose **Add custom connector**.
3. Enter the URL `https://app.snitcher.com/mcp/snitcher` and save.
4. Click **Connect** and sign in to Snitcher when prompted to authorize access.

The Snitcher tools are now available in your conversations. Try asking *"List my Snitcher workspaces."*

**ChatGPT**

1. Open **Settings → Connectors** and choose to add a custom / remote MCP connector.
2. Enter the URL `https://app.snitcher.com/mcp/snitcher`.
3. Complete the Snitcher OAuth sign-in to authorize access.

Availability of custom MCP connectors depends on your ChatGPT plan.

**Other clients**

Any client that supports remote (HTTP) MCP servers can connect. Point it at:

```
https://app.snitcher.com/mcp/snitcher
```

The server uses OAuth for authentication — your client will open a browser sign-in flow. Refer to your client's documentation for where to add a remote MCP server.

> [!NOTE]
>
> Every tool operates on a **workspace**. Start a session by asking your assistant to list your workspaces — it will use the workspace identifier automatically for follow-up requests.

## Available tools

The assistant decides which tools to call based on your request. Tools are grouped by what they do. **Read** tools only fetch data; **Write** tools change data and are confirmed before they run.

### Workspaces

| Tool | Type | Description |
| - | - | - |
| `list-workspaces` | Read | List all workspaces you have access to. Usually the first call in a session. |
| `get-workspace` | Read | Get a workspace's name, URL, plan status, usage limits, and tags. |

### Companies

| Tool | Type | Description |
| - | - | - |
| `list-organisations` | Read | List identified companies, filtered by segment, date range, or name search. Returns websites, industries, employee counts, and visit data. |
| `get-organisation` | Read | Full details of a company: profile, tags, segments, technologies, CRM data, and visit stats. |
| `get-organisation-engagement` | Read | Engagement over a time period: total sessions, timeline, unique visitors, time on site, first/last seen, and traffic sources. |
| `get-organisation-insights` | Read | Key insights: unique visitors, pageview stats, most popular pages, and top traffic sources. |
| `get-organisation-activities` | Read | Session-by-session activity: page views, duration, referrer, location, and visitor details (paginated). |
| `get-organisation-people` | Read | Contacts at a company with titles, departments, seniority, LinkedIn, and email availability (paginated). |
| `update-organisation-notes` | Write | Replace the notes on a company with new text. |

### Segments & filters

| Tool | Type | Description |
| - | - | - |
| `list-segments` | Read | List segments with their filter definitions and matching company counts. |
| `create-segment` | Write | Create a segment from filter groups and conditions. |
| `update-segment` | Write | Replace a segment's filter definition. |
| `list-filter-options` | Read | Discover valid values for a filter attribute (e.g. technologies, industries) when building segments. |

### Tags

| Tool | Type | Description |
| - | - | - |
| `list-tags` | Read | List all tags with their UUIDs, names, and colors. |
| `create-tag` | Write | Create a new tag in a workspace. |
| `add-tag-to-organisation` | Write | Add a tag to a company (by tag name or UUID). |
| `remove-tag-from-organisation` | Write | Remove a tag from a company. |

### Contacts

| Tool | Type | Description |
| - | - | - |
| `list-contacts` | Read | List people at a company with names, titles, departments, seniority, and email status. |
| `reveal-contact-email` | Write | Reveal a contact's email address. **Consumes 1 email reveal credit.** |

### Buyer personas

| Tool | Type | Description |
| - | - | - |
| `list-buyer-personas` | Read | List buyer personas and their filter definitions (job titles, seniority, departments, countries). |
| `get-organisation-buyer-personas` | Read | Show which buyer personas match a company, with the associated contacts. |
| `create-persona` | Write | Create a buyer persona with filters. |
| `update-persona` | Write | Update a persona's name and/or filters. |

### Sessions & usage

| Tool | Type | Description |
| - | - | - |
| `list-sessions` | Read | List visits for a company: pages viewed, duration, referrer, location, and visitor info. |
| `list-tracking-scripts` | Read | List tracking scripts for a workspace with IDs, types, and active status. |
| `get-usage` | Read | Current identification usage and credit balance against your plan limits. |

### Custom fields

| Tool | Type | Description |
| - | - | - |
| `list-custom-fields` | Read | List custom field definitions for companies in a workspace. |
| `create-custom-field` | Write | Create a custom field definition on companies. Previews as a dry run by default. |
| `update-custom-field` | Write | Update a custom field's name or description. Previews as a dry run by default. |
| `delete-custom-field` | Write | Archive (soft-delete) a custom field. Reversible. Previews as a dry run by default. |
| `set-organisation-custom-field` | Write | Set or clear a custom field value on a company. Previews as a dry run by default. |

### Integrations

| Tool | Type | Description |
| - | - | - |
| `sync-to-crm` | Write | Push a company to a connected CRM (HubSpot, Salesforce, Pipedrive, Zoho, Dynamics, or Attio). |
| `share-to-slack` | Write | Share a company to a Slack channel or user. |
| `share-to-teams` | Write | Share a company to a Microsoft Teams channel. |

### Feedback

| Tool | Type | Description |
| - | - | - |
| `capture-mcp-feedback` | Write | Send feedback about the MCP server — feature requests, bugs, or friction. |

## Workspace context resources

Beyond tools, the server exposes **resources** — read-only snapshots an assistant can pull in for context without making a request. Most clients read these automatically when relevant.

| Resource | Description |
| - | - |
| `snitcher://session/state` | Who you're authenticated as and current session metadata. |
| `snitcher://workspaces/{workspace_uuid}` | Workspace name, URL, plan status, usage limits, and tags. |
| `snitcher://workspaces/{workspace_uuid}/segments` | All segments with filters and matching counts. |
| `snitcher://workspaces/{workspace_uuid}/tags` | All tags with UUIDs, names, and colors. |
| `snitcher://workspaces/{workspace_uuid}/buyer-personas` | Buyer personas with their filter definitions. |
| `snitcher://workspaces/{workspace_uuid}/tracking-scripts` | Tracking scripts with IDs, types, and status. |
| `snitcher://workspaces/{workspace_uuid}/integrations` | Status of CRM, Slack, and Teams connections. |

## Example prompts

**Explore visitors**

* "List the companies that visited my site this week, biggest first."
* "Show me everything you know about Acme Corp — industry, size, tags, and which pages they viewed."
* "How engaged has Acme been over the last 30 days? Sessions, unique visitors, and traffic sources."
* "What are the most popular pages among companies that visited yesterday?"

**Find the right accounts**

* "Create a segment for SaaS companies with 200+ employees in the US."
* "Which companies match my 'Enterprise' segment right now?"
* "What technology filter values can I use when building a segment?"

**Reach the right people**

* "Who are the decision-makers at Acme Corp?"
* "Which of my buyer personas does Acme match, and who are the contacts?"
* "Reveal the email for their VP of Marketing." *(uses 1 credit — the assistant will confirm first)*

**Organize and act**

* "Tag every company that visited the pricing page this week as 'Hot Lead'."
* "Add a note to Acme: 'Reached out via LinkedIn on Monday.'"
* "Push Acme Corp to HubSpot."
* "Share Acme to the #sales Slack channel."

**Account hygiene**

* "How much of my monthly identification quota have I used?"
* "List my custom fields, then set 'Account Owner' to 'Jordan' on Acme."

## Safety and confirmations

The server is designed to be safe to use conversationally:

* **Writes are confirmed.** The assistant explains any change and asks before calling a write tool.
* **Bulk actions show their scope.** Before changing many companies at once, the assistant states how many will be affected.
* **Credits are surfaced first.** Revealing an email consumes one credit, and the assistant states the cost and your balance before it runs.
* **Destructive changes preview first.** Custom field changes default to a dry-run preview so you can confirm the exact effect before applying it.
* **Permissions are inherited.** The server can only access the workspaces and data your Snitcher account can. It never elevates your access.

## Feedback and support

The MCP server is actively evolving. If something is missing or doesn't work as expected, ask your assistant to send feedback with `capture-mcp-feedback`, or reach us through the [Help Center](https://help.snitcher.com/en/).

Looking for direct, programmatic access instead? See the [REST API reference](https://docs.snitcher.com/product/rest-api/introduction.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.