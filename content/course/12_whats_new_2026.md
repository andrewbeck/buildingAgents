# 12 — What Changed, April to September 2026

> The original passes were written in April and May 2026. This chapter is the delta: what moved, what it means for each chapter, and what still needs re-verifying. Every item here is a snapshot; re-run this exercise quarterly.

Sources are primary (vendor docs, release notes, GitHub releases, official blogs) unless marked unverified. Web research for OpenAI, Google, and the framework roundup was cut short to save budget, so those sections are thinner and flagged.

## Models

**Claude.** Four releases in five months: Opus 4.7 (April 16, new tokenizer), Opus 4.8 (May 28), Fable 5 and Mythos 5 (June 9), Sonnet 5 (June 30), Opus 5 (July 24), Fable 5.1 and Mythos 5.1 (September 1). Current lineup: Fable 5.1, Opus 5, Sonnet 5, Haiku 4.5. All current models except Haiku have a 1M context window at standard pricing and 128K output. Sonnet 5's introductory price ($2 / $10 per MTok) was made permanent in August. Fable 5.1 cut cache reads to a quarter of a cent per thousand and removed forced tool choice. Fable 5 was suspended under export controls for about three weeks in June and restored July 1. Retired this window: Haiku 3, Sonnet 4, Opus 4, Opus 4.1. Haiku 4.5's retirement floor is October 15, 2026, so expect a new Haiku.

**What it means.** Any project built in spring 2026 is running model IDs one to two generations old. `temperature` is gone on current models; `effort` replaced `budget_tokens`. Thinking is always on for Fable. Refusals now arrive as a stop reason with a category, and server-side fallbacks exist so a refusal can route to another model. [Chapter 03](./03_the_loop.md).

**Others** (thin, verify): OpenAI's lineup moved through GPT-5.4, 5.5, 5.6 "Sol," and a GPT-6 "Astra" appeared on leaderboards in September; Google is on Gemini 3.x; Qwen and Muse Spark models lead several agent benchmarks. The Mastra book's "providers and models (March 2026)" table is already stale.

## Messages API

New since April, in rough order of usefulness:

- **`xhigh` effort** (April), and per-message effort via mid-conversation system messages (July, beta).
- **Task budgets** (April, beta): a token ceiling the model can see and pace against.
- **Server tools** `code_execution_20260521`, `web_search`/`web_fetch` newer variants (June), code execution free alongside the newer search tools.
- **Refusal `stop_details`** (May) and **fallbacks** (June, `"default"` mode July).
- **Mid-conversation system messages** GA (May), turn-scoped `clear_at` (August, beta), mid-conversation tool changes without cache invalidation (July, beta).
- **Cache diagnostics** (May, beta): `cache_miss_reason` tells you why the cache missed.
- **Files API and Skills API GA** (August). Computer use GA as `computer_toolset_20260801` plus a new `browser_toolset_20260801`.
- **Advisor tool** (April, beta): a stronger model advises the executor.
- **Python SDK 1.0** (August): httpx2, Python ≥3.10, removes Text Completions and sampling params. The `ant` CLI launched in April and now applies agent and environment YAML.
- **Admin API** in SDKs (August). Workload Identity Federation (May). Claude Platform on AWS (May).
- Thinking blocks are now bound to the producing model, and accounts created after August 31 get a 400 if history is edited under a thinking block. Make harnesses append-only.

## Claude Agent SDK and Claude Code

Near-daily releases. The changes that affect how you would build Project 6 or 8 on the SDK:

- Sessions: `startup()` pre-warm, session stores with S3/Redis/Postgres adapters, `resume` with safe truncation, cross-session messaging.
- Permissions: `"auto"` mode (now the default on paid plans since August 14), `"defer"` decisions that pause headless runs, `permissionPrompts: 'none'` for unattended hosts, `Tool(param:value)` rules, `--restricted`.
- Sub-agents: no nesting by default, concurrency cap 20, background by default, fork mode by default, permission prompts forwarded from background agents.
- Hooks: hook events streamed to the SDK, `MessageDisplay`, `DirectoryAdded`, model-switch hooks, `PermissionDenied`.
- Tasks: `TaskCreate/Update/Get/List` replaced TodoWrite. Dynamic **workflows** (a Claude-written orchestration script over many background agents, keyword `ultracode`).
- Routines (scheduled cloud agents), self-hosted runners for cloud sessions, artifacts published from a session, Claude in Chrome GA with browser actions under permission checks.
- `/skill-doctor` reports unused loaded skills and their context cost. Plugins can come from zip archives with SHA-256.
- Default effort moved from medium to high in April after a quality postmortem; `xhigh` is opt-in.

## Managed Agents

Public beta since April 8, still beta. Added since: memory stores, multiagent orchestration and outcomes, webhooks on session, agent, deployment, environment, and memory-store events, self-hosted sandboxes, scheduled deployments, vault credentials substituted at egress, session budgets in dollars with a `budget_reached` stop reason, advisor roster entries, GitHub-repo skills, per-session agent overrides, web domain allow and block lists. Pricing is model tokens plus a small per-session-hour fee. LangChain's CEO published "why managed agents are the next big thing" in August, which tells you the category is now contested.

## MCP

The 2026-07-28 spec revision: stateless core (no session handshake), `server/discover`, multi-round-trip requests, dynamic client registration deprecated in favor of Client ID Metadata Documents, OAuth tightened (issuer validation, credentials bound to the issuing server). Enterprise-Managed Authorization is a stable extension with Okta first and Claude, Claude Code, Cowork, and VS Code as clients. The MCP Registry and the foundation governance status were not re-verified; check modelcontextprotocol.io.

## Agent identity, auth, and payments

A whole layer appeared. Google donated its Agent Payments Protocol to the FIDO Alliance, which formed agentic authentication and payments working groups with Google, OpenAI, Visa, Mastercard, Okta, and Amazon. Coinbase's x402 became a Linux Foundation project with forty members and tens of millions of monthly transactions. Stripe shipped a Machine Payments Protocol and agent wallets. Visa and Mastercard shipped agent credentialing products. The IETF chartered a Web Bot Auth working group and Cloudflare will block agent and training bots by default on new ad-supported domains from mid-September. Microsoft, Okta, Auth0, and AWS all have GA agent-identity products. Practical implication: the "agent that logs in somewhere" question now has real protocols behind it, and browser-agent login at scale is moving from "dangerous" to "governed."

## Evals, observability, benchmarks

Langfuse v4 GA (August). Braintrust added automated trace investigation, single-trace debugging, and pairwise scoring. LangSmith added tuned evaluators and issue detection. W&B Weave traces Claude Agent SDK sub-agents. Cisco acquired Galileo. Promptfoo was acquired by OpenAI (OSS continues). **OpenAI's hosted Evals platform shuts down in November 2026.** OpenTelemetry moved GenAI conventions to their own repo, still not stable.

Benchmarks turned over: Terminal-Bench went through 2.1, 3.0, 4.0 and added a science variant; OSWorld 2.0 shipped with hour-plus tasks; MCP-Atlas is the new tool-use benchmark; METR's fifty-percent time horizon is now measured in many hours and their suite tops out. Leaderboard positions change monthly; do not put numbers in a course.

## Security

The year prompt injection became catalogued CVEs rather than a hypothetical: RCE in an agent framework from injected prompts, a Claude Code GitHub Action permission bypass, Anthropic disclosing models escaping eval sandboxes, OWASP's agentic security report with per-project advisory counts and an Agent Control Standard. Anthropic's containment post is the design guidance. [Chapter 08](./08_production.md).

## Browser agents

Stagehand v4 removed Playwright and runs as a browser extension with non-AI locator primitives. Browser Use rebuilt on Firecracker, shipped a CLI that gives coding agents a browser, and takes x402 payments. Playwright MCP added recording-to-code. Chrome DevTools MCP ships agent plugins. Cloudflare renamed Browser Rendering to Browser Run and launched an agent-first browser. Google's WebMCP is in several tools. The tooling improved a lot; the narrow-zone rule still applies.

## Vocabulary

"Harness engineering" (Thoughtworks framed it as a specialization of context engineering with guides and sensors). "Managed agents" as a category. "Forked vs. isolated sub-agents." "Agents on a leash" and "human-on-the-loop" from survey work showing most agent use at work is still monitored. Stack Overflow's pulse survey: 59% of developers use agents at work, 37% daily, 63% rarely run them on autopilot, 69% prefer single-agent workflows.

## What did not change

The loop. The workflow/agent distinction. The five patterns. Tool design as the highest-leverage work. Error analysis before metrics. Binary judgments with critique. The simplest thing that works. Everything in Chapters 01 through 05 was written to survive this list.

## Not re-verified

OpenAI Agents SDK and AgentKit status; Google ADK, Gemini CLI, Antigravity; exact versions of LangGraph, Mastra, Pydantic AI, CrewAI, Vercel AI SDK, Microsoft Agent Framework; sandbox provider pricing; MCP Registry status; whether the Skills spec has changed since April. Treat those chapters' snapshot callouts as prompts to check, not facts.

## Sources

- Claude API release notes: https://platform.claude.com/docs/en/release-notes/overview
- Claude model overview and deprecations: https://platform.claude.com/docs/en/models/overview
- Claude Code changelog and weekly "what's new": https://code.claude.com/docs/en/changelog
- Claude Agent SDK releases: https://github.com/anthropics/claude-agent-sdk-typescript/releases
- Anthropic, *Scaling Managed Agents*; *How we contain Claude*; *April 23 postmortem*: https://www.anthropic.com/engineering
- MCP 2026-07-28 changelog: https://modelcontextprotocol.io/specification/2026-07-28/changelog
- FIDO Alliance agentic working groups: https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/
- Linux Foundation, x402 Foundation: https://www.linuxfoundation.org/press/linux-foundation-announces-operational-launch-of-x402-foundation-to-standardize-internet-native-payments-for-ai-agents-and-applications
- OWASP GenAI, *State of Agentic AI Security and Governance*: https://genai.owasp.org/resource/state-of-agentic-ai-security-and-governance/
- Thoughtworks, *Harness engineering*: https://martinfowler.com/articles/harness-engineering.html
- Stack Overflow, *Agents on a leash*: https://stackoverflow.blog/2026/05/27/agents-on-a-leash-agentic-ai-remains-mostly-monitored-at-work/
- METR time horizons: https://metr.org/time-horizons/
- Langfuse v4: https://langfuse.com/changelog/2026-08-17-langfuse-v4
- Stagehand v4: https://www.browserbase.com/changelog/stagehand-v4
