---
source: https://railway.com/sandboxes
fetched: 2026-10-26
---

# Railway - Sandboxes product page reference

## Structure
- Deep single-product page, 8 sections: hero with a 3-tab code block (TypeScript SDK / CLI / Agent prompt), "Useful right when you provision" with a Railway-vs-other-providers timeline graphic, "Reach your sandbox" with a dashboard mockup and a live provisions counter, a 9-card capability grid (name plus one sentence each), a pricing section (3 rates, 4 priced scenarios, a worked example), an 8-question FAQ, and a brand closing CTA.
- Depth: the capability grid is one sentence per item, but every item is concrete (10 domains per sandbox, 8 sites in 4 regions, SSH keys tied to account). The pricing section is unusually specific: per-minute rates, scenario prices ("$0.01 per pull request", "$1.17 per working day") and an itemized 8-minute run. FAQ answers are 2 to 4 sentences and spec-grade.
- Copy to screenshots: 2 images; code blocks and an inline dashboard mockup instead of screenshots; about 70% copy.
- Uses code tabs and an accordion FAQ; no other tabs.
- Hand-off: docs links throughout (sandboxes, cli/sandbox, agents-in-sandboxes guide, TypeScript SDK on GitHub, pricing page); "agent provisioning from the MCP" ties to /mcp and /agents; "same included credit and usage limits as your services" ties to pricing.

## Title and meta
- Title: Sandboxes | Railway
- Meta description: Create Linux VMs with coding agents preinstalled. Run commands, connect to your private network, checkpoint, and fork. Pay for measured usage.

## Hero
- Headline: A full computer on demand
- Subhead: Railway Sandboxes are full Linux VMs you create in code. Wire one into your project's private network, checkpoint it, fork it, and throw it away. Just pay for what it uses, not how long it exists.
- CTAs: Create a sandbox (/new), Read the docs (docs.railway.com/sandboxes)
- Availability line: Available on every plan. CLI, TypeScript SDK, dashboard, and API.
- Code tabs: TypeScript SDK / CLI / Agent prompt. Sample: `Sandbox.create({ networkIsolation: "PRIVATE" })`, `exec("git clone ...")`, `exec("npm ci")`, `checkpoint("app-ready")`, `fork()`, `fork.exec("npm test")`, destroy both.

## Section: Useful right when you provision
- Claude Code, Codex, and other coding agents come preinstalled, along with Node.js and Git. Start running commands as soon as your sandbox is ready, with your databases and services on the same private network when you need them. Read the guide
- From provision to first command: Railway (Setting up...) vs Other sandbox providers (Provision, Install tooling, Executing code). Railway's base image includes Claude Code, Codex, and other coding agents, along with Node.js and Git. The other-provider path shows the setup steps needed when these tools aren't included in the image.

## Section: Reach your sandbox by web, Android, iOS, or SSH
- Watch your sandboxes list from code, or step in yourself with Railway's unrivaled developer experience. Dashboard docs
- Dashboard mockup: project glorious-hippo / production; tabs Architecture, Observability, Logs, Sandboxes, Settings; Region US-WEST2; Idle timeout 30m; Preview :3000 sandbox-7f3a9c21.up.railway.app; Console / Network / Flow / Logs; sessions "main shell · live · attached", "exec-2 Claude Code · running"
- Live counter: provisions and counting

## Section: Everything a sandbox needs, in the SDK and the CLI
- The same primitives from TypeScript, from your terminal, or from an agent provisioning from the MCP.
- exec with durable sessions: Run code live, detach, and reattach from another process. Sandboxes are great when you want to outlive the process that started them.
- Files API: Every box gets a file-browser, read, write, list, and stream files of any size.
- Checkpoints and forks: Named disk snapshots stored in the environment. Fork a running sandbox in one call.
- Templates: Bootstrap the base image for reusability. Railway then builds, hashes, and caches the image for quicker start-up.
- Private networking: Opt a sandbox into the environment's private network to reach your Railway services by hostname.
- Public domains: Up to 10 Railway-provided HTTPS domains per sandbox, one per port.
- SSH and port forwarding: railway sandbox ssh and railway sandbox are all SSH native with keys tied to your account.
- Four regions: Use our 8 sites in US West, US East, EU West, and Southeast Asia.
- Idle: Forgotten sandboxes destroy themselves, or have them not de-provision. Your call.

## Section: Priced for how agents actually work
- A sandbox bills per second for the CPU it actually uses and the memory it holds. See all pricing
- Rates: Memory $0.001157 per GB-minute; CPU $0.001157 per vCPU-minute; Egress $0.05 per GB
- Scenarios: Code review on every PR (Clone, install, run the agent.) $0.01 per pull request; Five agents on one bug (Fork a checkpoint five ways. Keep the winner.) $0.08 per attempt; Code execution in your product (An untrusted snippet runs, returns, and the sandbox is gone.) $0.0006 per execution; A dev box for your day (SSH in with Claude Code and leave it attached all day.) $1.17 per working day
- Worked example: One run of 8 min · 1 GB · 25% of a vCPU busy: Memory 1 GB x 8 min $0.0093; CPU 25% of a vCPU x 8 min $0.0023; 1,000 PRs a month $11.57
- Sandbox usage draws from the same included credit and usage limits as your services. Destroyed sandboxes cost nothing. Per-plan limits are on the pricing page.

## Section: Common questions (FAQ)
- What is a Railway sandbox? An isolated Linux VM you create through the TypeScript SDK, CLI, or dashboard. Git, Node.js, and coding agents are already installed, so you can start running commands and working with files right away.
- How is a sandbox different from a service? A service runs your deployed app, API, or worker. A sandbox gives your application a VM for a task, like running an agent or testing a change. They are isolated VMs outside of the Railway service lifecycle that you manage.
- How much does a sandbox cost? CPU and memory usage are billed per second, at $50/vCPU-month and $50/GB-month. Outbound traffic costs $0.05/GB. For example, a 20-minute task averaging 1 GB of memory and 30% of a vCPU costs about $0.03, plus outbound traffic.
- Do I pay for an idle sandbox? Yes. It still uses memory, and background work can use CPU and bandwidth. Sandboxes have an idle timeout by default, though running commands or active sessions can keep them alive. Destroy yours when you're done to stop compute charges.
- Can a sandbox reach my database? Yes. Set networking to PRIVATE and pass in your database credentials. Your sandbox can then connect to databases and services in the same environment. The default setting, ISOLATED, only allows outbound internet access.
- What are checkpoints, forks, and templates? A checkpoint saves a sandbox's disk so you can start from it later, even after deleting the original. A fork creates another sandbox from a running one's files. A template lets you reuse a setup, with builds cached for next time. Each new sandbox boots fresh; processes and memory aren't copied.
- Which plans include sandboxes? All of them, including Free and Trial. Your plan determines how many sandboxes you can run in each environment, their CPU and memory limits, and idle timeout options. Usage counts toward your plan's included credit.
- Can my sandbox have a public URL? Yes. Choose PRIVATE networking and request a domain when you create it. You can have up to 10 domains, each pointing to a different port. They're removed when you destroy the sandbox.

## Closing CTA
- Your agent's next computer is now boarding. Create your first sandbox today

## Social proof
- Live provisions counter only; no quotes or logos.

## Cross-links
- Body: docs.railway.com/sandboxes, docs.railway.com/cli/sandbox, docs.railway.com/guides/agents-in-sandboxes, github.com/railwayapp/railway-ts-sdk, /pricing, /new; MCP and agents by name.
- Footer product column: Features, Mobile app, Pricing, Agents, Sandboxes, Changelog, Templates, Template kickback.
