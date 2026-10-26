---
source: https://vercel.com/ai-gateway
fetched: 2026-10-26
---

# Vercel - AI Gateway product page reference

## Structure
- Longest Vercel product page, about 14 sections: hero with a multi-tab code sample (API / Claude Code / Codex / Hermes / ...; AI SDK / Chat Completions / Messages / Responses; TypeScript / Python), provider logo row, a live pricing/promotions table, a 3-tab routing explainer (Availability / Costs / Latency) with a failover diagram, a 3-point "routing, billing, observability" block with a cost-breakdown mockup, a "works with your existing stack" block (4 API links, 3 bullets), "Recent ships" (3 dated changelog entries), 1 testimonial with 3 stats, a 3-bullet security block, a 6-bullet spend-controls block plus AWS Marketplace callout, an 8-modality strip, a coding-agents block with a setup command, a 6-step quickstart with code, an 8-question FAQ, and an "Ongoing promotions" model table.
- Depth: high and developer-grade. Every claim pairs with code, a table, or a numeric mockup; the FAQ answers are 1 to 3 sentences with doc links. The pricing argument ("no markup") is repeated in hero, billing block, and FAQ.
- Copy to screenshots: 26 images (logos, diagram, video placeholder); code and tables dominate; about 55% copy.
- Uses tabs (hero code, routing), tables (pricing, promotions), a stepper (quickstart), an accordion FAQ, and a changelog feed.
- Hand-off: dense doc linking (20+ /docs/ai-gateway/* links), /ai-sdk, /changelog, /ai-gateway/models catalog, a customer case study blog post.

## Title and meta
- Title: AI Gateway - Vercel
- Meta description: Use 400+ AI models without managing rate limits and API keys through Vercel AI Gateway.

## Hero
- Headline: The AI Gateway for developers
- Subhead: 400+ models at provider speed with near-zero overhead. One API key, no markup. Text, image, video, audio, realtime, retrieval, decisions, and tools.
- CTA: Get API key (dashboard deep link)
- Code tabs: API, Claude Code, Codex, Hermes, Command Code, OpenClaw, fx; AI SDK / Chat Completions / Messages / Responses; TypeScript / Python. Sample: `streamText({ model: 'spacexai/grok-4.7', prompt: 'Why is the sky blue?' })`. Button: Copy for agent
- Provider row: SpaceXAI, OpenAI, Anthropic, Gemini, OSS
- Pricing table: Model / Promotion / Input price / Output price / Type. Invoicing is available with no payment processing fees. See the AI Gateway pricing docs.

## Section: Optimize routing for availability, cost, or latency (tabs)
- Availability: If a provider degrades, the Gateway fails over to the same model on another provider. Identical output, no downtime. (diagram: Provider degraded? Claude Haiku 5.5 Anthropic to Claude Haiku 5.5 Amazon Bedrock)
- Costs: Everyday requests route to a cost-efficient open model. Complex jobs escalate to a frontier model only when needed.
- Latency: Latency-sensitive requests route to the fastest-responding model for the lowest time to first token. Heavier requests fall through to a larger model. Latency figures are illustrative and vary by region, traffic, and prompt length.

## Section: Routing, billing, and observability in one place
- One API key, 400+ models. Unified billing and observability across your entire AI stack, with text, image, video, audio, realtime, retrieval, decision, and tool models.
- Route on behavior, fallback anytime. Automatic fallbacks during provider outages so your app stays up even when a model goes down.
- No markup, just fair prices. Pay exactly what providers charge with no platform fees. (mockup: OpenAI $12.47, Anthropic $8.22, SpaceXAI $4.31, Platform fee $0.00, Total $25.00)

## Section: Works with your existing AI stack
- Move existing OpenAI, Anthropic, and AI SDK integrations to AI Gateway with a base URL swap.
- Links: OpenAI Chat Completions, OpenAI Responses, Anthropic Messages, Open Responses
- Seamless migration: Point your existing OpenAI or Anthropic SDK at AI Gateway. Same calls, no rewrites.
- Bring your own keys: Bring your own provider keys with no platform fee. Existing commitments flow through.
- Models on day zero: Immediate launch partner with major labs. New models work the minute they ship.

## Section: Recent ships
- 23 October: Kimi K3.1 Pro and Kimi K3.1 Pro Highspeed are available now in AI Gateway
- 21 October: Baseten's Mammoth-1 and Elephant-1 now available on AI Gateway for free
- 19 October: Mercury 3 now available on AI Gateway
- CTA: View the changelog

## Section: Testimonial
- Rob Cheung, Co-founder: "Moving to the gateway is just so ergonomic. We get references to model names, and rely on Vercel to do the correct implementations and handle the edge cases."
- Stats (animated): 20x, 30s, 25% (case study: how Zo Computer improved AI reliability 20x on Vercel)

## Section: Security and compliance
- Route only to ZDR providers, no training or prompt logging, configurable per request or team-wide.
- Zero Data Retention: Enforced on every request across your team. Routes only to providers under a ZDR agreement.
- No training on your data: Route only to providers that will not train on customer data, configurable per request.
- Provider allowlist: Restrict your team to approved providers. Enforced on every request, no code changes.

## Section: Take control
- Manage usage across teams with budgets, quotas, and full request visibility.
- Budgets. Cap spend with budgets at the team, project, and API key level.
- API key management. Create, view, and delete keys from the dashboard, CLI, or API.
- Short-lived OIDC tokens. Authenticate with expiring credentials. No static credentials to manage.
- Custom Reporting API. Tag requests by user, customer, feature, or environment. Analyze spend in the dashboard or your own systems.
- Dashboard observability. Usage, spend, requests, TTFT, and token counts at team, API key, and project scope.
- Request logs. Search and filter every request, follow traffic live, and open one to see how it routed and what it cost.
- Live on AWS Marketplace: Buy with private offers, using your existing cloud commits.

## Section: Every modality you need
- Text, image, video, realtime, speech, transcription, embeddings, and reranking through one endpoint.
- Tiles: Text, Image, Video (New), Realtime, Speech, Transcription, Embeddings, Reranking (with sample outputs: a paragraph, an embedding vector, a reranked list; provider logos Google, ElevenLabs, Deepgram, Cohere)

## Section: Works with the tools your team already uses
- Route 11+ AI coding agents through AI Gateway with a base URL change. Get unified observability and spend tracking across every tool, no matter who built it. Link: See all supported coding agents
- Or skip the config files. The setup command detects the supported agents on your machine, provisions an API key, and writes their configuration for you. `npx vercel@latest ai-gateway setup`
- Blackbox AI: Terminal CLI for AI code generation and debugging, with access to every model in the catalog.
- Cline: Autonomous coding agent for VS Code. Select Vercel AI Gateway as the provider for detailed token and cache metrics.

## Section: Get started (quickstart stepper)
- This quickstart walks you through making your first text generation request with AI Gateway. Link: Read the quickstart. Tabs: Text, Image, Video, Realtime, Speech & Transcription
- 1 Set up your project: Create a new directory and initialize a Node.js project. (`mkdir ai-text-demo`, `cd ai-text-demo`, `pnpm init`)
- 2 Install dependencies: Install the AI SDK and development dependencies. (`npm install ai@latest dotenv @types/node tsx typescript`; npm/yarn/pnpm/bun)
- 3 Set up your API key: Go to the AI Gateway API Keys page in your Vercel dashboard and click Create Key to generate a new API Key. Create a .env.local file and save your API Key. Instead of using an API Key, you can use OIDC tokens to authenticate your requests. (`AI_GATEWAY_API_KEY=...`)
- 4 Create your script: Create the index.ts file. (streamText with model 'openai/gpt-5.5', prompt 'Invent a new holiday and describe its traditions.', prints token usage and finish reason)
- 5 Run your script: You should see the AI model's response stream to your terminal. (`pnpm tsx index.ts`)
- 6 Next steps: Provider and model routing with fallbacks; AI SDK documentation; OpenAI Chat Completions API

## Section: Frequently asked questions
- How is AI Gateway priced? We offer tokens at list price from the upstream providers with no markup, including when you bring your own keys. Certain capabilities are available at higher plan tiers and metered separately. Invoicing is available with no payment processing fees. See the pricing page for details.
- What's the difference between using AI Gateway and going direct to each provider? AI Gateway gives you one integration, automatic failover, unified spend tracking, and one invoice across every major provider. Going direct means signing N contracts and stitching together N billing dashboards.
- Will AI Gateway work with our existing AI stack? Almost certainly. AI Gateway supports the AI SDK, OpenAI Chat Completions, OpenAI Responses, Anthropic Messages, and an OpenResponses-compatible endpoint. Migrating is typically a base URL swap with no code changes.
- Which modalities does AI Gateway support? Text, image, video, audio, realtime, embeddings, reranking, decisions, and web search tools, all with one API key. Browse the full model catalog for specific models and providers.
- How does AI Gateway handle our enterprise security and compliance requirements? AI Gateway supports Zero Data Retention routing, a no-training guarantee, and team-wide provider allowlists. See the security overview for full details.
- What observability does AI Gateway provide out of the box? A dashboard with usage, spend, request volume, TTFT, and token counts, broken down by model, provider, and project. For deeper analysis, the Custom Reporting API lets you pull the same data into your own tools.
- Can we use our existing provider contracts and committed spend? Yes, through BYOK. Bring your own keys for almost every supported provider and your existing commitments flow through. We try BYOK first and only fall back to system credentials on failure.
- Do I pay per request or get invoiced? AI Gateway uses pre-purchased credits by default. Top up in the dashboard and usage is drawn down per request. Enterprise customers can switch to a single consolidated invoice from Vercel covering every provider in their routing pool. For invoicing, reach out to sales for more details.
- Can we purchase AI Gateway through AWS Marketplace? Yes. AI Gateway is live on AWS Marketplace and available to purchase via AWS private offers. Procure it directly through AWS Marketplace and apply the spend toward your existing AWS cloud commits, within your existing budgets and procurement processes.

## Section: Ongoing promotions
- Explore free and discounted models on AI Gateway. Promotional pricing applies automatically at request time. 29 live now. Link: View all deals
- Example rows: Nemotron 3.5 Lightning (NVIDIA) Free $0; Gemini 3.8 Flash (Google) -50% $1.50/M to $0.75/M input, $7.50/M to $3.75/M output; GLM 5.2 (Z.AI) -25%; Gemini 4 Argon (Google) $4/M to $2/M, $20/M to $10/M; MiniMax M3 -20%; DeepSeek V4.1 Flash 1017 $0.02/M input, $0.60/M to $0.29/M output. Button: Show more

## Social proof
- 1 named testimonial with 3 animated stats and a case-study link; provider logo row; changelog feed as freshness proof.

## Cross-links
- Body: /ai-gateway/models, /ai-gateway/models?promo=true, /docs/ai-gateway (pricing, model-fallbacks, sdks-and-apis/*, byok, zdr, disallow-prompt-training, provider-allowlist, budgets, api-keys, custom-reporting, observability, logs, coding-agents, getting-started/text, provider-options, modalities, capabilities), /ai-sdk, /blog/cline-on-ai-gateway, /blog/how-zo-computer-improved-ai-reliability-20x-on-vercel, /changelog, /contact/sales, ai-sdk.dev.
- Footer: full Vercel product footer (Agent Stack column includes AI Gateway).
