---
source: https://railway.com/agents
fetched: 2026-10-26
note: the hero headline renders with an animated agent-name slot ("Build with <agent> on Railway"); captured as "Build with on Railway"
---

# Railway - Agent Directory page reference

## Structure
- Directory-plus-pitch page, 6 sections: hero with a one-line install command (CLI / Prompt tabs), an 8-card agent directory (each: agent name, vendor, form-factor tags, one-sentence description, 4 capability bullets, a "Use with Railway" link row, "View guide"), a compare-agents matrix (IDE / Terminal / Cloud / Extension / Standalone / Open source), an 8-card "Why Railway for agents?" grid (heading plus one sentence), and a closing CTA pair.
- Depth: each agent card is a mini product summary; the Railway pitch itself is eight one-liners that restate platform features (scaling, Postgres/Redis, isolation, CLI & MCP, templates, observability, rollbacks, team collaboration).
- Copy to screenshots: no images; entirely text and link rows.
- Uses tabs (CLI / Prompt) and a comparison table; no accordion, no FAQ, no quotes.
- Hand-off: heavy. Per-agent links to railway-skills on GitHub, remote MCP server docs (anchored per agent), CLI reference, Claude Code plugin, Cursor Marketplace, GitHub autodeploys guide; per-agent sub-pages (/agents/grok, /agents/claude, /agents/cursor, /agents/devin).

## Title and meta
- Title: Agent Directory | Railway
- Meta description: Deploy on Railway with AI coding agents. Claude Code, Codex, Cursor, and more. Railway provides the infrastructure for any workload.

## Hero
- Headline: Build with [agent] on Railway
- Subhead: One command. That's it.
- Tabs: CLI / Prompt. Command: `curl -fsSL agents.railway.com | sh`
- Link: View Railway for Agents docs. Button: Agents Directory

## Section: Agent directory
- Deploy to Railway with your favorite AI coding agents. Autonomous software development now has the infrastructure to match.
- Railway's Remote MCP Server is available for testing. Learn more in Railway Docs.
- Grok Build (xAI) Terminal, Standalone: xAI's terminal coding agent. Plan Mode, parallel subagents, and native MCP. (/goal support, Web and X search, Parallel subagents, Composer model support) Use with Railway: Skills, MCP Server, CLI. View guide (/agents/grok)
- Claude Code (Anthropic) IDE, Terminal, Standalone: Agentic coding in your terminal. Understands your codebase, runs commands, and edits files. (Full codebase understanding, Terminal command execution, Git operations, Multi-file editing) Use with Railway: Skills, MCP Server, CLI, Claude Code Plugin
- Codex (OpenAI): Lightweight terminal agent. Reads and writes files, executes commands, and browses the web. (File read/write operations, Command execution, Web browsing, Sandboxed environment)
- Cursor IDE, Terminal, Extension: AI-first code editor. Composer mode for multi-file edits and background agents. (Multi-file Composer, Background agents, Codebase indexing, Terminal integration) Use with Railway: Skills, MCP Server, CLI, Cursor Marketplace
- OpenCode (Anomaly): Open-source terminal agent. Works with 75+ LLMs, TUI interface, and provider-agnostic architecture. (75+ model support, Rich terminal TUI, Built-in agents (build/plan), LSP integration)
- GitHub Copilot (GitHub): AI pair programmer with agent mode. Workspace agent understands your entire project. (Agent mode, Workspace context, CLI integration, PR summaries) Use with Railway: Skills, MCP Server, CLI, GitHub Autodeploys
- Pi (Earendil): Minimal, extensible open-source coding agent in your terminal. Bring any of 15+ LLM providers. (Minimal agent harness, Extensions, skills & themes, 15+ LLM providers, Interactive, RPC & SDK modes) Use with Railway: Skills, CLI
- Devin (Cognition) Cloud, Standalone: Autonomous AI software engineer. Plans, codes, debugs, and deploys independently. (Full autonomy, Long-running tasks, Browser + terminal, Self-debugging) Use with Railway: Skills, MCP Server, GitHub Autodeploys

## Section: Compare agents
- Find the right agent for your Railway workflow. Matrix columns: Agent, IDE, Terminal, Cloud, Extension, Standalone, Open source.

## Section: Why Railway for agents?
- Agents need infrastructure that scales with their ambition
- Instant scaling: Scale from zero to thousands of instances. Pay only for compute you use.
- Persistent state: Built-in Redis and Postgres. Volumes for long-term storage and retrieval.
- Secure execution: Isolated environments, encrypted secrets, private networking. SOC 2 compliant.
- CLI & MCP access: Full programmatic control via CLI and MCP server. Agents deploy without leaving the terminal.
- One-click templates: Deploy full stacks instantly. Postgres, Redis, MongoDB, and thousands of ready-to-use templates.
- Real-time observability: Live logs, metrics, and traces. Debug agent behavior with full visibility into every request.
- Instant rollbacks: Every deployment is versioned. Roll back to any previous state with a single command.
- Team collaboration: Shared projects, role-based access, and audit logs. Built for teams shipping together.

## Closing CTA
- Ready to deploy? Get started in minutes. Railway handles the infrastructure. CTAs: Start a new project (/new), Read the docs (docs.railway.com)

## Social proof
- None.

## Cross-links
- Body: /agents/grok, /agents/claude, /agents/cursor, /agents/devin, docs.railway.com/agents, docs.railway.com/ai/remote-mcp-server (per-agent anchors), docs.railway.com/reference/cli-api, docs.railway.com/ai/claude-code-plugin, docs.railway.com/guides/github-autodeploys, github.com/railwayapp/railway-skills, cursor.com/marketplace/railway.
- Footer product column: Features, Mobile app, Pricing, Agents, Sandboxes, Changelog, Templates, Template kickback.
