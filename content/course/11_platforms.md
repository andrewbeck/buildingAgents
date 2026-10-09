# 11 — Frameworks and Platforms

> Frameworks exist to help you with one piece of the stack, some pieces, or all of it. This chapter is the map: what each one takes off your plate, what it hides, and how to choose. It is the most perishable chapter in the course, so every version-specific claim is in a snapshot callout. After it you can pick a stack for a new project in ten minutes and justify it in one sentence.

Read every framework against the twelve things a framework can add (from [Chapter 04](./04_the_loop.md)): streaming, concurrency, hooks, state persistence, tracing, memory abstractions, sub-agents, skills or tool-on-demand, retries, type safety, multi-provider routing, built-in tools. Most projects need two or three. Choosing the framework that gives you those without the other nine is the actual decision.

## Build

- [Project 10](./12_projects.md#project-10--a-custom-mcp-server): a custom MCP server for a small domain, used from three clients. Building *for* agents is the last rung, and the tool-design rules from Chapter 06 are the spec.
- Also write the one sentence justifying the stack you chose for Project 8, now that you have built on both sides of the harness/deployment split.

## Read

Read first:

- **[MCP specification](https://modelcontextprotocol.io/specification/2025-11-25)** (2025-11-25 revision). One hour, before building or trusting any server.
- **[Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)** (Anthropic, 2026). Session, harness, sandbox, and why harness assumptions go stale.
- **[How to think about agent frameworks](https://blog.langchain.com/how-to-think-about-agent-frameworks/)** (Harrison Chase, 2025). What a framework provides versus what is just abstraction.

Read after: the **[MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)** and [registry](https://github.com/modelcontextprotocol/registry) while building the server, and the LangGraph, Vercel AI SDK, and Cloudflare Agents docs as you need them. All in the [platforms and MCP tier](./14_reading_list.md#tier-platforms-and-mcp).

## The two questions

Every option answers two independent questions. Comparisons that ignore this compare apples to warehouses.

| | You supply the harness | Vendor or SDK supplies the harness |
|---|---|---|
| **You deploy** | Manual loop on the Messages API | SDK tool runner · Claude Agent SDK · LangGraph · Mastra · Pydantic AI · OpenAI Agents SDK · Vercel AI SDK |
| **Vendor deploys** | (rare) | Claude Managed Agents · LangGraph Platform · cloud agent runtimes |

## Anthropic's four approaches

| # | Approach | You write | Tools | Use when |
|---|---|---|---|---|
| 1 | Manual loop | The `while stop_reason == "tool_use"` loop | Yours | You want to own the whole loop, or a control flow the runner's hooks do not fit |
| 2 | SDK tool runner | Just the tool functions | Yours | A custom-tool agent without hand-writing the loop. Most cases. Per-turn hooks give approval gates, error interception, result modification, retries, streaming, compaction |
| 3 | [Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview) | Agent config and your tool results | Anthropic sandbox (bash, files, code) + skills + MCP + yours | Anthropic runs the loop and hosts a per-session workspace; persisted versioned configs; long sessions; scheduled runs |
| 4 | [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) | A prompt and options | Built-in Read/Write/Edit/Bash/Glob/Grep/WebSearch/WebFetch + MCP + sub-agents | A batteries-included coding or filesystem agent on your own infra |

Tool runner and Agent SDK sound alike and are different packages. The runner is a thin helper in the regular API SDK. The Agent SDK is Claude Code as a library: hooks, permissions, sessions, sub-agents, skills, plugins. Both are harness-only.

> **Snapshot 2026-09.** Claude Agent SDK: TypeScript 0.3.x, Python 0.2.x, released near-daily in lockstep with Claude Code. Since April: `startup()` pre-warm, session stores with S3/Redis/Postgres adapters, `"auto"` and `"defer"` permission decisions, hook events streamed, native binary instead of bundled JS, MCP servers connecting in the background, Task tools replacing TodoWrite, sub-agent depth cap of 1 and concurrency cap of 20, `permissionPrompts: 'none'` for unattended hosts. Managed Agents: public beta since April, still beta; memory stores, multiagent orchestration, outcomes, webhooks, self-hosted sandboxes, scheduled deployments, vault credentials, session budgets in dollars, priced at model tokens plus a small per-session-hour fee. Verify against the release notes.

## The wider landscape

Eight archetypes are a better first cut than a per-framework list.

| Archetype | Examples | What it optimizes | Learning curve |
|---|---|---|---|
| Vendor SDK | Claude Agent SDK, OpenAI Agents SDK, Google ADK | Least friction on one provider; the vendor's own loop | Low |
| Graph orchestrator | LangGraph | Explicit state machine, durable execution, human-in-the-loop interrupts, time travel | Medium-high |
| TypeScript web SDK | Mastra, Vercel AI SDK | Web stack, streaming UI, workflows with suspend/resume | Low-medium |
| Type-safe | Pydantic AI | Typed inputs and outputs, validation, testability | Low |
| Role-based | CrewAI | Fast role/crew prototyping | Low, ceiling arrives fast |
| Code-as-action | smolagents | Model writes code that calls tools; minimal core | Low |
| Enterprise umbrella | Microsoft Agent Framework (AutoGen + Semantic Kernel successor) | .NET and Python enterprise integration | Medium |
| Durable-execution host | Temporal, Inngest, LangGraph Platform | Long-running workflows that survive restarts | Medium |

Per-framework notes that held up across every draft of this course:

- **LangGraph.** The course's primary. Nodes, edges, typed state, checkpointers, `Send` for dynamic fan-out, interrupts for HITL. `createAgent` in LangChain 1.x is the prebuilt ReAct agent with middleware. Best when the value of your agent depends on the *topology*. Cost: the most concepts to learn, and a graph is overkill for a linear chain. LangSmith tracing is one environment variable away.
- **Mastra.** TypeScript-native, workflows with `.then()`/`.branch()`/`.parallel()` and suspend/resume, agents with memory and observational memory, MCP client and server helpers, a local Studio. Best when you are shipping a TypeScript product and want workflows plus agents in one package. The Mastra book is its manual.
- **OpenAI Agents SDK.** Agents, handoffs, guardrails, tracing, with the manager and decentralized patterns as first-class. Best if your stack is OpenAI-first.
- **Pydantic AI.** Typed, testable, small surface. A good second framework to learn because it changes how you think about outputs.
- **Vercel AI SDK.** Provider-agnostic model calls, streaming UI primitives, `generateText` with tools and step limits. Best for the UI layer of an agent product; pair with a real orchestrator underneath.
- **CrewAI.** Fast for role-based demos; hits a complexity ceiling; do not commit to it.
- **smolagents.** Worth an afternoon for the code-as-action idea, which is the same idea as programmatic tool calling on the Claude API.

> **Snapshot 2026-09.** Version numbers were not re-verified for this chapter after the research pass was cut short. Before choosing, check each project's releases page. Known directional facts: LangChain and LangGraph are on the 1.x line with Deep Agents as their opinionated harness and a visible push toward "managed agents"; Vercel AI SDK is on v6; Microsoft Agent Framework has replaced AutoGen and Semantic Kernel; OpenAI's hosted Evals platform is shutting down in November 2026 and its Agent Builder is in a transition window.

## The one heuristic

The one that holds: **does your agent's value depend on the topology, or on the model plus tools?** If topology (branching, parallel joins, suspend/resume, checkpointed loops), use LangGraph or Mastra. If model plus tools, use the provider's SDK and skip the orchestrator. Most single-agent products are the second case.

## Seven axes a framework decides for you

When you adopt a framework you are accepting its answer on each of these. Know what you are agreeing to.

1. Where state lives and whether it persists.
2. How tools are declared and validated.
3. How control flow is expressed (graph, code, prompt).
4. How human interrupts work.
5. What gets traced and where it goes.
6. How sub-agents are spawned and how they communicate.
7. How you swap models and providers.

## No-code and app builders

**Workflow tools** (n8n, Zapier, Make, and the AI-first ones) are the right answer for Category 1 problems: a stable flowchart with LLM nodes, triggers, retries, approvals, auditability. The advice stands: build the same workflow in two competitors' free tiers and judge for yourself, because every comparison blog is written by a vendor. Warning signs you have outgrown one are in [Chapter 03](./03_when_to_build.md).

**App builders** (Bolt, Lovable, v0, Replit) build apps, not agents. They are how a non-engineer gets a UI around an agent, and increasingly how one generates an agent scaffold. Replit's generated agents run on Mastra, which is a reasonable reference for "what a generated agent looks like."

## Observability and eval tooling

Pick one and instrument on day one. LangSmith if you are on LangGraph. Langfuse if you want open source and self-hosting. Braintrust or Arize Phoenix if evals are the center of gravity. All ingest OpenTelemetry. Details and the September 2026 state in [Chapter 07](./07_evals.md).

## Sandboxes and browsers

For your own harness: E2B, Modal, Daytona, Vercel Sandbox, Cloudflare Sandboxes. For browsers: Playwright and its MCP server for deterministic automation; Stagehand or Browser Use for language-directed automation; Cloudflare Browser Run and the newer agent-first browsers for hosted. Anthropic's computer-use and browser toolsets are GA on the API. The narrow-zone rule from [Chapter 03](./03_when_to_build.md) applies regardless of vendor.

## A decision matrix

| Situation | Start with |
|---|---|
| Single custom-tool agent, any language | Claude API tool runner |
| Coding or filesystem agent on your infra | Claude Agent SDK |
| Long-running, scheduled, or memory-backed agent you do not want to operate | Managed Agents |
| Branching, parallel, checkpointed workflow with HITL | LangGraph (Python or JS) |
| TypeScript product with workflows plus agents plus a UI | Mastra, or LangGraph JS plus Vercel AI SDK |
| Stable business flowchart with LLM nodes | n8n or equivalent |
| OpenAI-first stack | OpenAI Agents SDK |
| Typed, testable Python agent | Pydantic AI |

Pick a primary by Project 4 and do not switch until Project 6. Each switch adds thirty to fifty percent to that project's timeline. This course uses LangGraph as the primary and the Claude Agent SDK as the second; both remain sound choices.

## Exercises

1. For each of Projects 4, 5, 7, and 9, list which of the twelve framework additions you used. Count how many you would miss if the framework vanished.
2. Build the Project 10 server and run the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) against it before any model sees it.
3. Plant "ignore previous instructions" in one catalog record and confirm the agent's behavior does not change. Write down what would have to be true for it to change.
4. Write the stack justification sentence for a new project of your own, and the sentence for the stack you would have chosen before this course.

## Checkpoint

- For each of Projects 4, 5, 7, and 9 you have built, name which of the twelve framework additions you actually used.
- Explain the harness/deployment split to a colleague using Managed Agents and the Agent SDK as the two examples.
- Apply the topology-vs-model-plus-tools heuristic to the library-concierge and product-teardown examples.
- Write the one sentence justifying your stack for Project 8.

## Sources

- Anthropic, *Claude Agent SDK overview*: https://code.claude.com/docs/en/agent-sdk/overview
- Anthropic, *Building agents with the Claude Agent SDK*: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
- Anthropic, *Managed Agents overview*: https://platform.claude.com/docs/en/managed-agents/overview
- Anthropic, *Tool runner*: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- LangChain, *Why managed agents are the next big thing* (Aug 2026): https://www.langchain.com/blog/why-managed-agents-are-the-next-big-thing-in-agent-building
- LangGraph docs: https://docs.langchain.com/oss/javascript/langgraph/overview
- Mastra docs: https://mastra.ai/docs
- OpenAI Agents SDK: https://openai.github.io/openai-agents-python/
- Pydantic AI: https://ai.pydantic.dev
- Vercel AI SDK: https://ai-sdk.dev
- Anthropic, *Building Effective Agents*, "When and how to use frameworks": https://www.anthropic.com/engineering/building-effective-agents
