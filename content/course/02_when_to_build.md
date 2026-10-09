# 02 — When to Build an Agent

> A decision procedure for the question "should this be an agent?" and its three follow-ups: how autonomous, how many, and how much can it be allowed to do without asking. This is the most important chapter for your career. After it you should be able to run any new idea through the ladder, the tree, and the rubric in under five minutes and defend the answer.

The single most common mistake in this field is building an agent for a problem that does not need one. Agents cost tokens, add latency, behave nondeterministically, and produce long branching traces that are painful to debug. Sometimes that is worth it. Usually it is not. The core principle, stated three ways by three sources that agree:

- Anthropic: find the simplest solution possible, and only increase complexity when needed.
- OpenAI: start with a capable model, well-defined tools, and clear instructions, and move to multi-agent only when needed.
- One of the drafts this course was consolidated from put it best: **use the least autonomous architecture that reliably completes the job.**

## The complexity ladder

Climb one rung at a time. Stop at the lowest rung that solves the problem.

```
Rung 0: No LLM at all
Rung 1: One well-engineered prompt
Rung 2: One prompt plus retrieval or in-context examples
Rung 3: A workflow: multiple LLM calls in a fixed pipeline
Rung 4: A workflow with model-driven routing
Rung 5: A single autonomous agent (LLM + tools + loop)
Rung 6: A multi-agent system
```

Two rules. Start at the bottom, because a Rung 5 build of a Rung 2 problem is more code, more tokens, and flakier output. Climb only after you have built the lower rung, evaluated it, and found where it fails. The one exception: when a problem clearly cannot be solved lower down (it needs unbounded tool use), skip ahead, but be honest that it is actually that case.

| Rung | Sign you are at the right rung | Sign you should go higher |
|---|---|---|
| 0 | A regex, a SQL query, a cron job, or an API call solves it | The input space is too varied for rules |
| 1 | One prompt gets above ninety percent quality | Quality is inconsistent on edge cases |
| 2 | Examples or retrieved context fix most failures | The task has multiple distinct steps |
| 3 | A linear pipeline (extract → transform → write) works | Different inputs need different paths |
| 4 | A classifier routes among three to five paths | The set of paths cannot be enumerated in advance |
| 5 | The model must make run-time decisions you could not script | Sub-tasks are independent and parallel, or context pressure is real |
| 6 | Parallelism, role separation, or context isolation buys measurable wins | You are at the top. Stop. |

There is one more rung that sits beside 5 and 6 rather than above them: the **managed agent**. Same loop, but the vendor hosts it along with a sandbox, sessions, and credential isolation. Reach for it when the job takes minutes to hours, may resume later, or would otherwise require you to build a lot of runtime infrastructure. [Chapter 10](./10_platforms.md) covers the tradeoffs.

## The decision tree

```
Q1  Can this be solved without an LLM?
    Yes → code, SQL, a traditional model. Done.
    No  → Q2

Q2  Is the task essentially one model turn (input → output)?
    Yes, and one prompt works           → prompt. Done.
    Yes, but it needs domain context    → add retrieval or examples. Done.
    No, the task has structure          → Q3

Q3  Can you write down the steps in advance, in order?
    Yes → workflow (fixed pipeline). Done.
    No, steps depend on intermediate outputs → Q4

Q4  Can you enumerate the TYPES of paths and route between them?
    Yes → workflow with a routing step. Done.
    No  → Q5

Q5  Does the task genuinely need autonomous tool use in a loop?
    No  → you over-complicated it. Back to Q3.
    Yes → single agent. Then Q6.

Q6  Is there a structural reason for more than one agent?
    Parallel sub-tasks with independent context      → multi-agent
    Strict role separation for permissions or safety → multi-agent
    "Different agents for different perspectives"    → no. One agent, structured prompts.
    None of the above                                → single agent
```

## Anthropic's four criteria

Before committing to Rung 5, check all four. If any answer is no, stay lower.

1. **Complexity.** Is the task multi-step and hard to fully specify in advance? ("Turn this design doc into a PR" yes; "extract the title from this PDF" no.)
2. **Value.** Does the outcome justify higher cost and latency?
3. **Viability.** Is the model actually capable at this task type? Test it by hand first.
4. **Cost of error.** Can errors be caught and recovered from, through tests, review, or rollback?

Number four is the one people skip. An agent whose mistakes are cheap to detect and undo (code with tests, drafts a human reads) is a very different proposition from one whose mistakes are silent and permanent (sends, pays, deletes).

## Build an agent only when all of these are true

1. The model must **make decisions at run time** you cannot predict.
2. It has **tools that ground those decisions in feedback**. Tool results inform the next step. Without grounding, "autonomous" means "runaway."
3. There is a **clear stopping condition**. "Find the bug" stops when tests pass. "Answer the question" stops when the answer is produced. Without one you are rebuilding AutoGPT.
4. The **cost and latency are acceptable**. Agents are five to twenty times slower and more expensive than non-agentic solutions. If a user is waiting in real time, that is often a dealbreaker.
5. You can **evaluate the output**: tests, programmatic checks, or at minimum an LLM-judge rubric. Agents nobody evaluates drift silently.

The first three are what Anthropic calls the agentic frontier: genuine need for flexibility, environmental ground truth, a well-defined loop.

## The scoring rubric

When the tree gives an ambiguous answer, score the problem. Zero to two on each factor.

| Factor | Question |
|---|---|
| Ambiguity | Does the system need judgment, not just rules? |
| Dynamic state | Does each step depend on new observations? |
| Tool diversity | Are several different tools genuinely required? |
| Horizon | More than three to five steps? |
| Error recovery | Must it adapt when tools fail or information is missing? |
| Personalization | Does user history or context materially change the answer? |
| Consequence | Are the actions reversible? (score 2 if fully reversible) |
| Evaluability | Can you measure success? (score 2 if yes) |

| Total | Build |
|---|---|
| 0 to 4 | App or automation |
| 5 to 8 | Workflow with LLM steps |
| 9 to 12 | Single agent with a strict tool set |
| 13 and up | Consider multi-agent, but only after a single-agent or workflow baseline exists |

## The autonomy overlay

Whatever rung you land on, separately choose the autonomy level (from [Chapter 01](./01_mental_models.md)): Operator, Collaborator, Consultant, Approver, Observer. Default for early builds is Collaborator or Approver. Observer requires evals, scoped tools, monitoring, and rollback, in that order.

The consequence of a wrong action sets the ceiling on autonomy:

| Consequence of a wrong action | Autonomy allowed |
|---|---|
| Trivial or reversible | Autonomous, with logs |
| Annoying but reversible | Autonomous, with guardrails and undo |
| User-visible or costly | Human approval before the action |
| Legal, financial, security, production, health | Approval plus least privilege, audit, tests, and probably a deterministic workflow |
| Irreversible and destructive | Avoid, or require explicit multi-step confirmation |

This table is why `send_email` should not exist as a single tool in an early build. `create_email_draft` plus `request_send_approval` is the same capability at Approver level. [Chapter 05](./05_tools_and_mcp.md) develops this.

## Worked examples

**"Summarize this document."** Rung 1. One prompt.

**"Extract the structured fields from this contract PDF."** Rung 1 or 2. One prompt with a structured-output schema. Add examples if quality is inconsistent.

**"Answer questions about our internal docs."** Rung 2, RAG. Go higher only if the retrieval must iterate: the answer requires follow-up queries based on what the first query found.

**"Triage support tickets into five categories."** Rung 1 if categories are crisp. Rung 4 if category-specific responses differ enough to want specialized prompts.

**"Write a marketing article from a brief."** Rung 3. Outline → critique → sections → polish. Prompt chaining is almost always enough for content generation.

**"Review a pull request."** Rung 3 if you produce comments on a diff. Rung 5 if the agent must navigate the codebase, run tests, and decide what to investigate.

**"Find every place in a 500-page contract where party A's rights conflict with party B's obligations."** Rung 5. Iterative search, cross-referencing, judgment about what counts as a conflict. The agent decides what to look at next based on what it found.

**"Who are the leading cancer immunotherapy companies and how do their pipelines compare?"** Rung 6, with caveats. Breadth-first, parallelizable, each sub-topic wants its own context window. This is the canonical multi-agent case, and the canonical multi-agent cost. Make sure the answer is worth it.

**"Autonomously manage my email."** Trick question, usually Rung 0 to 2. Filter, label, and draft are scripts plus a single model call. Only if "manage" means multi-step coordination across calendar and contacts with judgment calls does it become an agent, and even then Approver level.

**"Triage inbound email and draft replies."** Category 1. A workflow tool with LLM nodes, a confidence threshold that routes low-confidence cases to a human, and an approval card before anything sends. Two days of work, not two weeks.

## When the answer is "not an agent"

- **"It needs multiple tools."** Multi-tool is not agent. A workflow calls tools in order. You need an agent only when the *choice* of next tool is data-dependent.
- **"It needs to handle varied inputs."** Routing handles variety. You need an agent only when the variety cannot be enumerated.
- **"We want it to be smart."** Smart is not agent. A well-prompted single call can be very smart. Agent is about autonomy, not capability.
- **"It is an agent for [SaaS API]."** In almost every case you need the API, wrapped in code, with a model call only for the parts that need language reasoning.
- **"Our competitors are building agents."** Build what the problem needs.

## Warning signs you are outgrowing a lower rung

These are the tripwires for moving from a workflow tool to code, or from a workflow to an agent. They are sharper than most published guidance.

- Thirty or more workflow branches, and growing.
- The model needs to choose which tool or API to use.
- Each request may require a different action sequence.
- Failures come from unmapped edge cases, not implementation bugs.

And the tripwire for adding a tool at all: **add a tool only when a test case requires it.** An agent with thirty tools on day one is a red flag, not a feature.

## Special cases

**Coding.** Code is verifiable: tests, linters, type checkers give the agent crisp ground truth at every step. That is why agentic coding works better than most other domains and why the entire Claude Code bet exists. If your problem has any programmatically checkable component, agents become much more attractive.

**Long-running and asynchronous.** Migrations, comprehensive research, multi-day analysis. The question here is not "agent vs. workflow," it is "agent vs. nothing," because no human will sit through it. These need a real harness: durable state, a queryable event log, recovery. [Chapter 09](./09_multi_agent.md) and [Chapter 08](./08_production.md).

**Computer use and browser agents.** Still the highest-failure category. Many tasks that look browser-shaped are API-shaped underneath; check for the API first. Ship a browser agent only inside the narrow zone: bounded, idempotent, reversible or read-only, observed. Hard step budgets and wall-clock timeouts are mandatory.

> **Snapshot 2026-09.** Anthropic's computer-use toolset and a browser toolset went GA in August 2026, Stagehand hit v4 with Playwright removed, and Cloudflare shipped an agent-first browser. The tooling improved a lot; the risk profile of letting an agent log in somewhere at scale did not. Verify current state in [Chapter 12](./12_whats_new_2026.md) before relying on any of this.

## Red flags on a design review

- "We need an agent" with no success metric.
- Thirty tools on day one.
- No human approval before irreversible actions.
- No trace logs. No eval cases. No stop condition. No cost budget.
- The model can reach credentials directly.
- Prompt injection treated as a prompt problem rather than a system-design problem.
- No distinction between trusted instructions and untrusted content.
- Memory that stores everything.
- Browser automation where an API exists.
- Multi-agent chosen before single-agent failure has been demonstrated.
- "Let's have a bunch of agents debate" before success is defined.

## Failure modes from getting this wrong

- **Loops forever.** No stopping condition. Cost: real money, zero value.
- **Fabricates tool results.** The model hallucinated a response. Fix: results only ever come from real execution.
- **A "research agent" that is a workflow with extra steps.** Three times the code, slightly worse output.
- **Multi-agent where every agent has the same context anyway.** All the cost, none of the benefit.
- **Nobody evaluates it.** Works in the demo, degrades in production for weeks unnoticed.
- **Built around a flaky tool.** Network blips and rate limits cascade into retries that look like agent failures. Harden tools first; the agent inherits their reliability.

If you find yourself in any of these, climb back down the ladder.

## The one-page version

> Default to the simplest thing. For most LLM problems that is one prompt or a small workflow.
>
> Build an agent only when the model must make run-time decisions you could not predict, with tools that ground those decisions in real outcomes, toward a clear stopping condition, at an acceptable cost, with a way to evaluate it.
>
> Pick the autonomy level from the consequence of a wrong action, not from what the model can do.
>
> Multi-agent only for a structural reason: parallelism, isolation, role-specific permissions. Never because more agents sounds better.

## Checkpoint

- Take three ideas from your own backlog, or borrow the course's running examples (a library concierge, a product-teardown agent, a compliance screenshot monitor). Run each through the tree and the rubric. Write the rung, the autonomy level, and the one sentence that justifies it.
- Name the tripwire that would move each of those from a workflow to an agent.
- Explain to a colleague why "it uses five tools" does not make something an agent.
- Given a proposed tool list for a new agent, cut it to the tools a test case demands.

## Sources

- Anthropic, *Building Effective Agents* (when to use agents; the agentic frontier): https://www.anthropic.com/engineering/building-effective-agents
- OpenAI, *A Practical Guide to Building Agents* (foundations; when to build): https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- Feng, McDonald, Zhang, *Levels of Autonomy for AI Agents*: https://arxiv.org/abs/2506.12469
- Anthropic, *How we built our multi-agent research system* (the cost of Rung 6): https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition, *Don't Build Multi-Agents* (the case against Rung 6 for coupled tasks): https://cognition.ai/blog/dont-build-multi-agents
- Farooq and Rajwani, *Not All AI Agents Are Created Equal* (origin of the three categories): https://www.lennysnewsletter.com/p/not-all-ai-agents-are-created-equal
