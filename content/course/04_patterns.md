# 04 — Patterns

> The pattern vocabulary from *Building Effective Agents*, with what each one fixes, what it leaves to the model, when it is the wrong choice, and where the workflow/agent boundary shows up in Project 4. After this chapter you can factor any agent design into named pieces and say which piece is the workflow and which piece is the agent.

Every pattern here is a constraint or a composition on the loop from [Chapter 03](./03_the_loop.md). Prompt chaining is the loop with no model decisions. Routing is the loop with one tool that picks a branch. Orchestrator-workers is the loop where one tool spawns sub-loops. Keep that in mind and the catalog stops feeling like a list to memorize.

## Build

- [Project 3](./11_projects.md#project-3--thinking-in-graphs): triage with two approval gates. Routing into a chain, with the human in the loop, in a graph where the model never picks the next node.
- [Project 4](./11_projects.md#project-4--the-five-workflow-patterns): the five workflows plus evaluator-optimizer, six files under 100 lines each. The checkpoint at the end of this chapter assumes you have them.

## Read

Read first:

- **[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** (Anthropic, 2024), re-read. This chapter is a commentary on it.
- **[How We Build Effective Agents](https://www.youtube.com/watch?v=D7_ipDqhtwk)** (Barry Zhang, AI Engineer talk, 2025). Twenty-five minutes; what the essay omits.
- **[Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)** (LangChain docs). The same patterns in LangGraph code.

Read after: **[Agent design patterns](https://rlancemartin.github.io/2026/01/09/agent_design/)** (Lance Martin, 2026), in the [patterns tier](./13_reading_list.md#tier-patterns).

## 0. The augmented LLM

One model call plus tools, retrieval, and memory. This is the building block and it is sufficient far more often than people admit. Anthropic's advice: tailor those three capabilities to the use case, then make sure the interface to them is well documented and easy to use.

Failure modes: tool misuse, context bloat, over-trusting retrieved content, no source verification.

## The five workflows

| Pattern | Topology | Fixed | Dynamic | Use when | Wrong when |
|---|---|---|---|---|---|
| **Prompt chaining** | Linear, optional gates | Steps and order | Whether a gate retries | The job decomposes into a known sequence, each step refining the last | Sometimes you need step 2 and sometimes you don't. That is routing. |
| **Routing** | Classifier → one of N handlers | The set of handlers | Which one runs | Inputs fall into a small known taxonomy and a specialized prompt beats a general one | Categories overlap, or the route needs tool results to decide. That is closer to an agent. |
| **Parallel, sectioning** | Fan out N *different* workers, aggregate | Which workers, the join | Their outputs | Output splits into independent sections | Sections depend on each other |
| **Parallel, voting** | Fan out N workers on the *same* input, merge | Reviewer count and roles | Their verdicts | You want diverse lenses or majority-vote robustness on one decision | There is no "true answer" to converge on |
| **Orchestrator-workers** | Planner → N (data-dependent) workers → synthesizer | The stages | The number and content of workers | The shape of the work is unknown until you look at the input | Sub-tasks are not independent, or every worker has the same prompt |
| **Evaluator-optimizer** | Producer ↔ critic loop, bounded | Loop budget, threshold | Iteration count | Quality is cheaply judgeable and the first draft is rarely good enough | Evaluation is subjective with no anchor, or one shot reaches the bar |

This decision flow, from the author's Project 4 write-up, is the fastest way to pick:

```
Is the work data-dependent (planner can't know N up front)?
  YES → Orchestrator-workers
  NO  → Is there a quality target you'll iterate toward?
          YES → Evaluator-optimizer
          NO  → Does the input fall into N known buckets?
                  YES → Routing
                  NO  → Can the work split into independent pieces?
                          YES, different shapes → Parallel sectioning
                          YES, same shape       → Parallel voting
                          NO                    → Prompt chaining
```

Implementation notes that matter:

- **Chaining.** One job per call. If a step does two things, split it. Add a gate only where intermediate quality matters.
- **Routing.** The router is small and fast. Do not use Opus to decide which Opus prompt to use. Its output is a constrained enum via structured outputs, never free text. Always have a fallback path.
- **Parallel.** Cost grows linearly with branches. Sectioning buys throughput and focus; voting buys quality on tasks with a true answer. Project 4's sectioning and voting files have the same graph shape; the difference is intent.
- **Orchestrator-workers.** This is the workflow-to-agent boundary. The orchestrator decides at run time how many workers and what each does. Sub-agent context isolation is the entire point; if workers share context you added cost without benefit. Synthesis is the hard part, so have workers return structured output. The orchestrator needs an explicit "enough" rule or it spawns too many or too few.
- **Evaluator-optimizer.** The evaluator does the harder job; spend more on its prompt. Cap iterations, loops oscillate between near-equivalent drafts. Evaluator and generator can be the same model with different prompts.

In every one of these the model chooses *what to write* but never *what node runs next*, except through a branch set you defined. That line is what Project 5 crosses.

## 6. The autonomous agent

LLM plus tools plus a while-loop, no predefined path. The model decides each turn whether to call a tool, reflect, or finish. Everything in [Chapter 03](./03_the_loop.md).

Required controls, all of them: max steps, max cost, max wall-clock, explicit stop reasons (`done | needs_human | blocked | failed_safely`), a tool allowlist, approval gates on side effects, a trace log. Stopping condition is everything. Tool surface design dominates quality. Observability is not optional.

## 7. Multi-agent shapes

Less a pattern than a family of compositions. [Chapter 09](./09_multi_agent.md) covers cost and coordination; here are the shapes.

| Shape | What it is | When | Failure mode |
|---|---|---|---|
| **Hierarchical (manager, agents as tools)** | Orchestrator-workers where each worker is a full agent. Anthropic's research system. Project 9. | Breadth-first parallel work, isolated context per branch | Planner over-decomposes; workers lack context; aggregator hides disagreement |
| **Handoffs (decentralized)** | Agent A hands the conversation to B, which now owns it | Ownership truly moves between domains (triage → refunds) | Lost context, confusing UX, handoff loops |
| **Pipeline of agents** | Researcher → writer → editor, each an agent | Each role genuinely needs autonomy, not just a prompt | Usually a prompt chain in disguise |
| **Specialist agents as tools** | Main agent calls `code_reviewer_agent` like a tool | Sub-tasks have very different domains | Same as hierarchical |
| **Debate / peer** | Agents with different roles argue to consensus | Research settings | Rarely the right production shape |

[OpenAI's guide](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) boils multi-agent down to two: **manager** (agents as tools, the good default) and **decentralized** (handoffs). Start with manager.

## Patterns that are really controls

Three more shapes show up in every serious system. They are not orchestration patterns, they are where safety lives.

- **Human-in-the-loop approval.** Agent proposes → policy gate → human approves, rejects, or edits → agent continues. Use for sends, deletes, purchases, deploys, external comms, regulated decisions. [Chapter 08](./08_production.md) has the four HITL patterns.
- **Sandbox execution.** Agent → isolated environment with limited network, scoped credentials, disposable state, audit log → result. Use for generated code, shell, file edits, browser automation, untrusted documents.
- **Retrieval plus verification.** Retrieve → extract claims → verify each claim against its source → answer with citations. Use for anything where truth matters. Failure modes: retrieval misses the key source, the source is stale, the model cites a source that does not support the claim. Project 5's `save_report` citation enforcement is this pattern.

## How patterns compose

Real systems are compositions. A workflow that ends in an agent for the open-ended last step. An orchestrator whose workers are prompt chains. A router that dispatches to one of several agents. An evaluator-optimizer wrapped around an agent to enforce a quality bar. Project 3 is routing into a chain with two approval gates.

The patterns are vocabulary, not rules. The win is being able to say "this is routing into a chain into an evaluator loop" and have everyone in the room see the same diagram.

## Anti-patterns

- **Plan-then-execute with no real planning.** "First plan, then execute" in a prompt produces plan-shaped tokens the model then ignores. Either commit to a real planner step with an output schema and validation, or drop it.
- **Agent of agents for variety.** If sub-agents share prompt and tools, you built a more expensive agent.
- **Reflection at every step.** Add reflection where it changes the trajectory. Remove it where it is ritual.
- **Memory as a vector dump of everything.** Without retrieval discipline this generates noise. [Chapter 07](./07_context_and_memory.md).

> **Author's note,** on the [harness-design post](https://www.anthropic.com/engineering/harness-design-long-running-apps): "agents doing self-eval are often over-confident; separate eval works better." That is the reason evaluator-optimizer exists as a distinct pattern instead of a line in the generator's prompt.

## Eight questions for reading any agent codebase

1. What rung on the complexity ladder is this, and is it warranted?
2. Which pattern or composition does it match?
3. Where is control flow: fixed in code, or in the model's hands?
4. What is the memory structure: working only, episodic, semantic, procedural?
5. What is the action space, and how are external actions gated?
6. What is the stopping condition, and is it explicit?
7. What is the cost profile: how many model calls per task, which models?
8. What is the eval strategy: programmatic, LLM-judge, human?

If you can answer these for a system, you understand it well enough to build, modify, or replace it.

## Exercises

1. Take one of your six Project 4 files and rewrite it as a different pattern. Record what got worse.
2. Add a fourth handler to Project 3's router without touching the routing prompt. If you cannot, say what the prompt is doing that the graph should.
3. Draw the composition for a product-teardown agent in pattern vocabulary, then mark the one node where the model decides what runs next.

## Checkpoint

- Open any of your six Project 4 files and name the pattern, what is fixed, and what is dynamic without reading the README.
- Sketch the composition for a product-teardown agent in pattern vocabulary.
- Explain why orchestrator-workers sits on the workflow/agent boundary and what makes Project 5 an agent.
- Run the eight questions on an open-source agent repo you have not seen before.

## Sources

- Anthropic, *Building Effective Agents*: https://www.anthropic.com/engineering/building-effective-agents
- Anthropic cookbook, agent patterns: https://platform.claude.com/cookbook/patterns-agents-basic-workflows
- LangChain, *Workflows and agents* (the same five patterns in LangGraph): https://docs.langchain.com/oss/javascript/langgraph/workflows-agents
- OpenAI, *A Practical Guide to Building Agents* (manager vs. decentralized): https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- Anthropic, *Harness design for long-running application development* (planner / generator / evaluator): https://www.anthropic.com/engineering/harness-design-long-running-apps
