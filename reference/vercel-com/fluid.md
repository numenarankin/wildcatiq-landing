---
source: https://vercel.com/fluid
fetched: 2026-10-26
---

# Vercel - Fluid Compute product page reference

## Structure
- Tight single-concept page, 5 sections: hero, "Pay for compute, not idle time" (3-point explanation plus 1 quote plus 4 workload cards), a 6-row Servers vs Serverless vs Fluid comparison table, a 6-item feature grid, closing CTA pair.
- Depth: the argument is made once, in three sentences, then proven with a table and a quote; each feature-grid item is a bold name plus one sentence. This is the most text-efficient Vercel product page.
- Copy to screenshots: 3 images plus inline mockups (model logos, API route list); about 60% copy.
- Uses a comparison table; no tabs, no accordion, no FAQ.
- Hand-off: "Vercel Functions" label on the workloads block; CTAs go to /new and /contact/sales only; Sandbox and Workflows pages reference Fluid as their execution model.

## Title and meta
- Title: Fluid Compute - Vercel
- Meta description: Fluid compute combines the efficiency of servers and the flexibility of serverless, enabling real-time, dynamic workloads like APIs, streaming, and AI.

## Hero
- Headline: The power of servers, in serverless form
- Subhead: Fluid compute combines the efficiency of servers and the flexibility of serverless, enabling real-time, dynamic workloads like APIs, streaming, and AI.
- CTAs: Enable Fluid (/new), Request demo (/contact/sales)

## Section: Pay for compute, not idle time
- Fluid runs many requests on a single instance. Billing is based on CPU usage.
- Traditional serverless wastes idle time. Provisioned instances can sit idle between requests.
- Fluid runs invocations concurrently. Overall cloud resources provisioned are dramatically reduced while invocations are kept alive in-memory.
- CPU that's charged when active, not idle. No more paying for I/O wait times, network latency, and API calls.
- Quote: "By leveraging in-function concurrency, we were able to share compute resources between invocations, cutting costs by over 50% with zero code changes." Lead Fullstack developer
- Workload cards:
  - AI workloads. Run tasks with reduced latency and higher concurrency, delivering faster, scalable results for all users, regardless of the workload size. (Claude, GPT, Gemini, Grok, Deepseek)
  - Business-critical APIs. Fluid Compute runs multiple API invocations concurrently on a single instance to handle traffic spikes. (POST /api/auth/login, GET /api/inventory, POST /api/checkout, ...)
  - Server-side and partial pre-rendering. Pre-render dynamic pages before requests arrive to reduce work at request time.
  - Middleware. Perform authentication checks and apply personalization with Fluid Compute. (Personalization, Authentication, Localization, Experimentation)
  - Label: Vercel Functions

## Section: Bridging servers and serverless
- Taking the best of servers and serverless to create a new model in computing, scaling business-critical workloads efficiently across global environments.
- Table (Features / Servers / Serverless / Fluid):
  - Cold start handling: Not applicable / Cold starts / Cold-start prevention
  - Scaling: Manual scaling / Auto-scaling / Efficient auto-scaling
  - Concurrency: Horizontal / Vertical / Horizontal & vertical
  - Operational overhead: High maintenance / Minimal, inefficient / Minimal, optimized
  - Pricing model: Upfront cost per server / Pay-as-you-go model / Pay-as-you-compute
  - CPU efficiency: High efficiency / I/O bound inefficiency / Optimized I/O efficiency

## Section: Fluid compute for dynamic web applications
- In-function concurrency: Run multiple invocations on a single function instance, reducing idle compute time and lowering costs.
- Cold-start reduction: Functions are pre-warmed and use bytecode caching to reduce cold starts.
- Streaming: Send data to users as it becomes available, improving performance for AI, media, and real-time apps.
- Cross-region failover: Reroutes traffic to backup regions during outages.
- Dynamic scaling: Automatically adjusts concurrency and resource allocation based on real-time demand.
- Post-response tasks: Keep functions running after sending a response to handle tasks like logging or database updates.

## Section: Experience fluid (closing CTA)
- CTAs: Contact sales (/contact/sales), Start deploying (/new)

## Social proof
- One anonymous quote (title only). No logos, no stats.

## Cross-links
- Body: /new, /contact/sales only.
- Footer: Core Platform (Security, CDN, Fluid, Observability, Previews) and the rest of the Vercel product footer.
