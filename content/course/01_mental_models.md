# 01 — Mental Models

> What an agent is, where the idea came from, and the handful of frames you will use on every design decision in the rest of this course. After this chapter you should be able to look at any "agent" product or codebase and say, in one sentence each, what its loop is, what its memory layers are, how autonomous it is, and whether it is really a workflow.

## Build

- [Project 0](./11_projects.md#project-0--the-rings): [Anthropic's tool-use tutorial](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) as five scripts. Two hours. You do not need the frames in this chapter to run it, and running it first makes the frames concrete. [Chapter 03](./03_the_loop.md) is the commentary; start it now and finish it there.

## Read

Read first:

- **[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** (Anthropic, 2024). The vocabulary every other source uses, and the workflow/agent distinction in Frame 1.
- **[Agents](https://simonwillison.net/2025/Sep/18/agents/)** (Simon Willison, 2025). The one-sentence definition this chapter builds on.
- **[LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)** (Lilian Weng, 2023). Once, for where the ideas came from.

Read after: [CoALA](https://arxiv.org/abs/2309.02427) and *[Levels of Autonomy for AI Agents](https://arxiv.org/abs/2506.12469)* for Frames 2 and 4, and the rest of the [mental models and history tier](./13_reading_list.md#tier-mental-models-and-history). Full citations are in Sources at the end of the chapter.

## Three definitions, in order of usefulness

**Russell and Norvig (1995).** An agent is anything that perceives its environment through sensors and acts on it through actuators. A thermostat qualifies. Their ladder of sophistication (simple reflex → model-based reflex → goal-based → utility-based → learning) is still useful for one reason: most production "AI agents" are model-based reflex agents, a model with tools and a system prompt, and it is healthier to say so than to pretend otherwise.

**Anthropic (December 2024).** From *[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)*:

> Workflows are systems where LLMs and tools are orchestrated through predefined code paths. Agents are systems where LLMs dynamically direct their own processes and tool usage, maintaining control over how they accomplish tasks.

Both are "agentic systems." The distinction is about who decides the next step: your code (workflow) or the model (agent). Workflows are predictable, cheap, and debuggable. Agents have a higher ceiling and a much larger failure surface. Most things called agents in the wild are workflows, and that is usually correct.

**The working consensus (2025 onward).** [Simon Willison's compression](https://simonwillison.net/2025/Sep/18/agents/) is the one to hold in your head:

> An LLM agent runs tools in a loop to achieve a goal.

Three parts: a model, a tool surface, a control loop that keeps calling the model until it stops calling tools or hits a limit. Memory, planning, sub-agents, and skills are all built on top of this. When you read code, find the model call, the tool registry, and the loop. If you cannot point to all three, you are looking at a wrapper, not an agent.

## The one sentence that is the whole field

> An agent is an LLM in a loop with tools, given freedom to decide when it is done.

Everything else in this course is variation on how you implement the loop, expose the tools, manage the state, and decide when to stop. The mark of a senior engineer here is choosing the *lowest*-autonomy design that solves the problem. Autonomy buys flexibility and costs predictability, latency, tokens, and debuggability. [Chapter 02](./02_when_to_build.md) turns that into a procedure.

## Four frames you will use constantly

### Frame 1: Workflow vs. agent

Already covered above. The gut check: if you can describe the system as "first A, then B, then C," it is a workflow. If you can only describe it as "figure out what to do next based on what happened, until done," it is an agent. Hybrids are normal and good: a deterministic shell with an agentic step inside it.

### Frame 2: Levels of autonomy

From Feng, McDonald, and Zhang, *[Levels of Autonomy for AI Agents](https://arxiv.org/abs/2506.12469)* (arXiv 2506.12469). The level is a property of the **harness**, not the model. You can run the same model at any level by changing what the human is asked to do.

| Level | Human role | Agent role | Example |
|---|---|---|---|
| 1 | Operator | Tool | Autocomplete |
| 2 | Collaborator | Co-worker | Pair-programming mode in an IDE |
| 3 | Consultant | Independent worker who checks in | Claude Code in its default permission mode |
| 4 | Approver | Independent worker who needs sign-off | A coding agent that opens a PR for review |
| 5 | Observer | Fully autonomous | A scheduled background research agent |

Default for a new product build: Collaborator or Approver. Do not ship Observer until you have evals, scoped tools, monitoring, and rollback. [Chapter 08](./08_production.md) has the graduation rubric.

### Frame 3: Three project categories

A framing that originated in a Lenny's Newsletter piece by Hamza Farooq and Jaya Rajwani, useful because it maps directly to tooling and time-to-ship.

| Category | Who decides the path | Tooling | Share of real opportunities | Ships in |
|---|---|---|---|---|
| 1. Deterministic automation | You define the whole flow; AI fills in content at fixed steps | n8n, Zapier, Make, workflow builders | Most (roughly two thirds) | Weeks |
| 2. Reasoning-and-acting agent | You define the tools; the model decides what to do next | Claude API tool runner, Claude Agent SDK, LangGraph, Mastra, Pydantic AI, OpenAI Agents SDK | A quarter to a third | Months |
| 3. Multi-agent network | Multiple specialized loops coordinate | LangGraph, Managed Agents multiagent, custom orchestrators | A small minority | Quarters |

The trap this frame prevents: building a Category 1 problem with Category 2 tools. If your problem really is a flowchart with fifteen branches, a workflow tool in two days beats a graph framework in two weeks.

### Frame 4: CoALA

Sumers et al., *Cognitive Architectures for Language Agents* (arXiv 2309.02427). It factors any agent design into three dimensions. Use it every time you read about a new architecture.

**Memory.**

| Type | What it is | Where it lives in a modern agent |
|---|---|---|
| Working | The scratchpad, what the agent can see right now | The context window |
| Episodic | Specific past experiences | Stored transcripts, session logs, past reports on disk |
| Semantic | General facts abstracted from experience | Knowledge bases, a `memory.md`, RAG corpora, the model's weights |
| Procedural | How to do things | Skills, tool definitions, `agents.md`, code the agent runs |

Most "muddled" agent designs are muddling these. If your entire memory story is one vector store, you have collapsed three distinct things into one. [Chapter 07](./07_context_and_memory.md) maps each of these to concrete files in Project 7.

**Action space.** Internal actions change the agent's own state (think, plan, retrieve). External actions change the world (call an API, write a file, send an email). External actions have consequences and need permissions, logging, and rollback. Conflating the two is how you ship an agent that sends ten thousand emails.

**Decision procedure.** The loop itself:

```
while not done:
    state    = perceive()
    plan     = propose(state)        # internal
    selected = decide(plan)          # internal
    result   = execute(selected)     # internal or external
    update_memory(state, selected, result)
```

ReAct is one decision procedure. "Always call this tool first, then summarize" is another. "Planner model writes a plan, executor model runs it" is a third.

When you meet a new architecture, ask three questions: what memory does it have, what is in its action space and how are external actions gated, and is the decision procedure a fixed graph, a model-driven loop, or a hybrid. That covers most of the design space.

## A short history, so the present makes sense

**Symbolic agents (1956 to roughly 2020).** Expert systems, BDI (belief-desire-intention) architectures, reinforcement-learning agents, cognitive architectures like SOAR and ACT-R. The durable lesson: specifying intelligence by hand is brittle. Systems worked in narrow domains and failed outside them. CoALA's memory taxonomy is a direct descendant of this era, which is why it feels familiar.

**The LLM moment (2020 to 2022).** GPT-3, then instruction tuning, then ChatGPT gave the field a model that could reason about novel tasks zero-shot. Three papers made tool-using agents a recognized pattern: [Chain-of-Thought](https://arxiv.org/abs/2201.11903) (Wei et al. 2022) showed reasoning is something models do when asked; ReAct (Yao et al. 2022) interleaved Thought, Action, Observation and made "model plus tools in a loop" concrete; Toolformer (Schick et al. 2023) framed tool use as a first-class model behavior.

**The hype cycle (2023).** AutoGPT and BabyAGI ran unbounded loops and mostly spent money. The lesson that took a year to absorb: autonomy without grounding and a stopping condition is useless. The same year produced durable work: Generative Agents, Voyager, Reflexion.

**The framework explosion (2023 to 2024).** LangChain, LangGraph, AutoGen, CrewAI, Pydantic AI, smolagents, and dozens more. By late 2024 the field converged on a definition (LLM plus tools plus loop) and a pattern vocabulary (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, autonomous agent) that does not depend on the framework. Anthropic's *Building Effective Agents* crystallized it.

**MCP and standardization (late 2024 onward).** The Model Context Protocol made the agent-to-tool boundary a public protocol, which lets agents and tools evolve independently. That is the same shape as HTTP for the web, and like HTTP it will outlive most of the frameworks built around it. [Chapter 05](./05_tools_and_mcp.md) covers the protocol.

**Skills, harnesses, managed runtimes (2025 to 2026).** Agent Skills (folders of instructions loaded on demand) solved the unmaintainable-system-prompt problem with progressive disclosure. Anthropic's harness posts shifted attention from "what can the model do" to "what does the code around the model need to do for hours-long tasks." Managed Agents made the harness and the sandbox something you rent instead of build.

> **Snapshot 2026-09.** The frontier conversation has moved again, from context engineering to *harness engineering* (Thoughtworks framed the harness as a specific form of context engineering, split into guides and sensors) and from single long sessions to *managed* runtimes where the vendor owns the loop, the container, and the session log. The Anthropic post that defines the current vocabulary is *Scaling Managed Agents: Decoupling the brain from the hands* (April 2026). See [Chapter 12](./12_whats_new_2026.md).

## The harness

The harness is the code around the model: control flow, tool execution, context management, error handling, logging, persistence, permissions. Framework code is mostly harness code. The model is one component; the harness is everything else, and it is usually ten to a hundred times more lines than your prompt.

Two independent questions separate every way of building an agent:

1. **Who supplies the harness?** You (manual loop), the SDK (tool runner, Claude Agent SDK, LangGraph), or the vendor (Managed Agents).
2. **Who supplies the deployment?** You, or the vendor.

| Approach | Harness | Deployment |
|---|---|---|
| Manual loop on the Messages API | You | You |
| SDK tool runner | SDK | You |
| Claude Agent SDK / LangGraph / Mastra | SDK | You |
| Managed Agents | Vendor | Vendor |

Keep this split in mind when reading [Chapter 10](./10_platforms.md). "Framework" and "platform" comparisons that ignore it are comparing apples to warehouses.

## Concepts you will keep meeting

**Tool use.** The model emits a structured call (name plus JSON arguments), your code runs it, you feed the result back. Without this the model is a chat partner. Every provider has it natively; the schemas differ slightly, the concept is universal.

**Context window and context rot.** The window is finite, and performance degrades before you hit the limit: recall drops, attention blurs, old turns distract. Fixes are compaction, structured note-taking to disk, and sub-agents with their own windows. [Chapter 07](./07_context_and_memory.md).

> **Snapshot 2026-09.** Current Claude models (Fable 5.1, Opus 5, Sonnet 5) have a 1M-token window at standard pricing and 128K output. Haiku 4.5 is 200K. Server-side compaction exists as a beta. A 1M window does not remove context rot; it moves the cliff.

**RAG vs. agentic search.** RAG fetches documents once at query time and stuffs them in. Agentic search lets the model decide what to look for, iterate, and choose when it has enough. RAG is cheaper and more predictable. Agentic search wins on open-ended questions where the right document cannot be found with the original query. The Mastra book's advice holds: build the agent with search tools first, use RAG as the fallback for pure document-processing problems.

**Planning vs. reactive.** A planner decides a sequence in advance; a reactive agent decides each step from current state. ReAct is reactive with reasoning. Modern agents are mostly reactive with light planning up front. Pure planning is brittle because the world changes; pure reactivity is myopic. Hybrid wins.

**Single vs. multi-agent.** Multi-agent buys parallelism, specialization, and context isolation. It costs coordination overhead, tokens, and debuggability. Anthropic's research system reported roughly fifteen times the tokens of a chat; the author's Project 9 build measured about four times on a breadth-first research task, for reasons covered in [Chapter 09](./09_multi_agent.md). Default to single-agent.

**Skills.** A folder with a `SKILL.md` (frontmatter plus instructions) and optional scripts and references, loaded only when the task matches the description. Progressive disclosure for capabilities. Now an [open spec at agentskills.io](https://agentskills.io/specification).

**MCP.** JSON-RPC 2.0 protocol with three server primitives (tools, resources, prompts), two transports (stdio, streamable HTTP), capability negotiation on connect. It is to agent-tool integration what REST is to client-server.

## Three durable ideas

1. **The simplest thing that works wins.** Most problems do not need agents. Many that need some model intelligence do not need autonomy. When you do need autonomy, less is more.
2. **The control loop is the agent.** Frameworks abstract it, SDKs hide it, managed runtimes run it for you. Build it from scratch once ([Chapter 03](./03_the_loop.md)) and you will see it everywhere.
3. **Memory and tools are design decisions, not plumbing.** Most agent pathologies trace back to muddled memory layers or sloppy tool surfaces.

## Exercises

1. Pick three agent products you use and write one sentence each: the loop, the memory layers, the autonomy level, and whether it is really a workflow.
2. Take Project 0's ring 2 script and label each line with the frame it belongs to: loop, tool, memory, or harness.
3. Place Claude Code, a nightly data pipeline with one LLM call, and a customer-support bot on the autonomy levels, and say what would move each up one level.

## Checkpoint

- You can state the workflow/agent distinction in one sentence and give an example of each from the project ladder (Project 4 vs. Project 5).
- You can place a product (Claude Code, a scheduled report bot, Copilot autocomplete) on the five autonomy levels and say what harness change would move it up or down.
- You can map the Project 7 files (`memory.md`, `agents.md`, `skills/`, `reports/`) onto the four CoALA memory types.
- You can explain why "the harness" and "the deployment" are separate questions, and which of the four approaches Project 5 uses.
- You can say why the ReAct paper mattered without looking it up.

## Sources

- Anthropic, *Building Effective Agents* (Dec 2024): https://www.anthropic.com/engineering/building-effective-agents
- Simon Willison, *Agents* (definition, Sept 2025): https://simonwillison.net/2025/Sep/18/agents/
- Feng, McDonald, Zhang, *Levels of Autonomy for AI Agents* (2025): https://arxiv.org/abs/2506.12469
- Sumers et al., *Cognitive Architectures for Language Agents* (CoALA, 2023): https://arxiv.org/abs/2309.02427
- Yao et al., *ReAct* (2022): https://arxiv.org/abs/2210.03629
- Wei et al., *Chain-of-Thought Prompting* (2022): https://arxiv.org/abs/2201.11903
- Schick et al., *Toolformer* (2023): https://arxiv.org/abs/2302.04761
- Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands* (Apr 2026): https://www.anthropic.com/engineering/managed-agents
- Thoughtworks / Martin Fowler, *Harness engineering* (Apr 2026): https://martinfowler.com/articles/harness-engineering.html
- Lilian Weng, *LLM Powered Autonomous Agents* (2023): https://lilianweng.github.io/posts/2023-06-23-agent/
- Russell and Norvig, *Artificial Intelligence: A Modern Approach*, chapter 2 (agent taxonomy).
- Sam Bhagwat, *Principles of Building AI Agents*, 3rd ed. (Mar 2026): https://mastra.ai/book
