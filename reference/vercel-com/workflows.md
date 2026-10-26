---
source: https://vercel.com/workflows
fetched: 2026-10-26
---

# Vercel - Workflows product page reference

## Structure
- Short developer-first product page, 6 sections: hero with install command, "Powered by Workflow SDK" with a toggle (With / Without Workflow SDK) over a 13-line code sample, "Inspect every run" with a dashboard trace mockup, "Deploy and scale" with 4 benefit cards (each a bold claim plus one sentence and a mockup), 3 template cards, closing CTA pair.
- Depth: minimal prose; the code sample and the trace mockup are the explanation. Four benefit statements carry the whole value proposition.
- Copy to screenshots: 9 images plus a code block and an inline dashboard mockup; about 35% copy.
- Uses a code toggle; no tabs beyond that, no accordion, no FAQ, no quotes.
- Hand-off: external to workflow-sdk.dev and GitHub examples; "Fluid compute, serverless functions, queues and persistence" named in-body; closing CTAs go to sales.

## Title and meta
- Title: Vercel Workflows
- Meta description: Build and deploy long running workflows on Vercel

## Hero
- Headline: "use workflow" for infinite compute durability
- Subhead: With zero configuration, atomic versioning and out of the box observability, Vercel makes Workflows easy
- CTA: Get started; install command `npm install workflow`

## Section: Powered by Workflow SDK
- Workflows bring durability, reliability, and observability to async JavaScript. Build apps and AI Agents that can suspend, resume, and maintain state with ease.
- CTA: Get started (workflow-sdk.dev)
- Toggle: With Workflow SDK / Without Workflow SDK
- Code: `export async function welcome(userId) { "use workflow"; const user = await getUser(userId); const { subject, body } = await generateEmail({ name: user.name, plan: user.plan }); const { status } = await sendEmail({ to: user.email, subject, body }); return { status, subject, body }; }`
- Status line: Queueing the getUser step...

## Section: Inspect every run end-to-end
- When deploying a workflow on Vercel, deep workflow observability is built into the Vercel dashboard with no configuration or storage
- Mockup: run wrun_01KC7XRJ, Running, Created 2m ago, Completed 1m ago; spans workflow, fetchOrder, validate, enrichWithPricing, saveOrder, sendEmail (925ms, 230ms, 155ms)

## Section: Deploy and scale
- You don't have to configure queues, servers, or storage to get started with Workflow SDK on Vercel. Everything works automatically.
- Zero infrastructure management. Fluid compute, serverless functions, queues and persistence work out of the box. (mockup: Queue, Telemetry, Kubernetes, Database crossed out vs Vercel Workflows)
- Deploy confidently. Running workflows continue on their original version while new executions use the latest code. (mockup: deployment list, Preview/Production, Building/Ready)
- No timeout limits. Write long-running workflows without worrying about execution time limits. (mockup: workflowTrigger() 58s, 4m, waiting)
- Pay for what you use. Only pay for actual execution time, not idle resources. (mockup: 5s, idle)

## Section: Get started (templates)
- See Workflow SDK in action with one of our templates. Link: All examples
- Story Generator Slack Bot: A Slack bot that generates children's stories from collaborative input.
- Flight Booking App: Use Workflows on Vercel to make AI agents reliable and production-ready.
- Natural Language Image Search: A free, open-source template for building natural language image search.

## Section: Build workflows (closing CTA)
- CTAs: Talk to an expert (/contact/sales), Get an enterprise trial (/contact/sales)

## Social proof
- None.

## Cross-links
- Body: workflow-sdk.dev, github.com/vercel/workflow-examples, /kb/guide/stateful-slack-bots-with-vercel-workflow, /contact/sales; Fluid compute by name.
- Footer: full Vercel product footer (Agent Stack column includes Workflows; SDKs column includes Workflow SDK).
