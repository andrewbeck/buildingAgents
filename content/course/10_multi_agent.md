# 10 — Multi-Agent and Long-Running Agents

> When more than one loop is worth its cost, how to structure the coordination, and what a harness needs when a single task runs for hours. Built on Anthropic's research-system post, Cognition's counterargument, and one measured Project 9 build. After this chapter you can refuse a multi-agent design for the right reasons and build one for the right reasons.

## Build

- [Project 9](./12_projects.md#project-9--multi-agent-research): lead plus parallel sub-agents with a cost governor, built only after Projects 5 and 7 work. The acceptance criterion is a measured token ratio against Project 5 on the same question, and an interesting failure on a tightly coupled task. Extend the Project 6 suite with a blinded cost-per-win comparison.

## Read

Read first:

- **[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)** (Anthropic, 2025). The shape Project 9 copies, and the fifteen-times-the-tokens number.
- **[Don't Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents)** (Cognition, 2025). Immediately after. Parallelize read-only work, serialize writes.
- **[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)** (Anthropic, 2025). The harness, not the model, owns durability.

Read after: **[Benchmarking Multi-Agent Architectures](https://blog.langchain.com/benchmarking-multi-agent-architectures/)** (LangChain) for numbers, **[Open Deep Research](https://blog.langchain.com/open-deep-research/)** to compare against your own build, and **[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)**. All in the [multi-agent and long-running tier](./14_reading_list.md#tier-multi-agent-and-long-running).

## The default is one agent

Single-agent with good tools handles more than people expect. Add tools before adding agents; a base prompt with policy variables (prompt templates) stretches one agent across many tasks without the coordination tax. Go multi-agent only for a structural reason.

**Five justifications**, sharper than most published lists. At least one must be true:

1. **Distinct permissions.** One agent reads, another writes, another approves.
2. **Distinct expertise.** Specialist prompts and tools measurably improve quality.
3. **Distinct context windows.** Each branch needs different context and one window would bloat.
4. **Distinct evaluation roles.** A critic, skeptic, or verifier adds value that self-evaluation does not.
5. **Distinct ownership.** Different teams own different workflow states.

"Different perspectives" is not on the list. One agent with structured prompts does that.

## Why it works when it works

[Anthropic's research system](https://www.anthropic.com/engineering/multi-agent-research-system): multi-agent beat single-agent Opus by a wide margin on breadth-first research, and token usage explained roughly eighty percent of the performance variance. Parallel context windows let more tokens work on the problem at once. That is the mechanism. It also means the cost is the feature: their system used about fifteen times the tokens of a chat.

Good fit: breadth-first tasks with parallelizable sub-tasks (research, broad data gathering, multi-file surveys). Bad fit: tightly coupled tasks where context must be shared, which is most coding. Cognition's *[Don't Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents)* is the canonical statement of the failure: sub-agents make conflicting decisions because neither sees the other's context, and reconciliation costs more than the parallelism saved.

## One measured example: Project 9

The author's Project 9 build, single agent vs. lead-plus-sub-agents on the same breadth-first question (founders and current CEOs of a twenty-company startup batch):

| | Tokens |
|---|---|
| Single agent | 183,581 |
| Multi-agent (lead + workers, 2 waves) | 733,107 |
| Ratio | about 4x |

Not the textbook fifteen times. Two honest reasons: sub-agents ran on a cheaper, terser model with tight budgets, and the lead capped waves at two. Both are design choices any real system would make. The point to carry forward: the multiplier is a function of your budgets, not a law. Measure it.

Other things Project 9 taught that the papers do not:

- **Wave 3 is almost never worth it.** Token cost rises super-linearly past two waves and you get a more verbose answer, not a better one.
- **Rate limits, not token price, are the constraint** on cheap providers. Multi-agent means many small requests.
- **Persist the plan before fan-out.** The lead's context will be truncated; the plan on disk is what survives. Anthropic does the same.
- **Sub-agents need one exit.** `return_sub_report` as the only way out prevents a worker wandering off.
- **Provider quirks compound.** An empty assistant message after a tool result from one provider needed three layers of guard. Budget time for glue.

## Designing the orchestration

From the research-system post:

- **Teach the lead to delegate.** Each sub-agent gets an objective, an output format, tool and source guidance, and clear boundaries. Sub-agents are agents; direct them like agents.
- **Scale effort to query complexity, explicitly.** Models judge effort poorly. Embed scaling rules: simple fact-finding is one worker with three to ten calls; a comparison is two to four workers with more; a survey is ten-plus. Your prompts, your numbers.
- **Start wide, then narrow.** Broad queries first, then drill.
- **Tool heuristics in the prompt.** Examine all tools first, match tool to intent, prefer specialized over general, use web search for broad exploration.
- **Parallelize twice.** Spawn workers in parallel and have each worker call tools in parallel.
- **Heuristics over rigid rules**, with explicit guardrails to stop spin-outs.
- **Structured hand-offs.** Workers return structured output, not prose. Free text does not scale through a synthesizer. Sub-agents can write large artifacts (files, reports) directly to a filesystem to avoid the game of telephone through the lead.
- **Lead on the stronger model, workers on the cheaper one.** Project 9 does this. On the Claude API today that is Opus 5 lead, Sonnet 5 or Haiku 4.5 workers; on Managed Agents it is a multiagent roster entry.

**Forked vs. isolated sub-agents.** A distinction that firmed up this year: a *forked* sub-agent inherits the parent's context (cache-friendly, good for "continue this line of work in parallel"); an *isolated* sub-agent starts clean (right for verifiers and for breadth-first branches that would be polluted by the parent's assumptions). Claude Code's fork mode and the LangChain multi-agent harness post both make this explicit. Pick per branch.

> **Snapshot 2026-09.** Claude Code and the Claude Agent SDK changed sub-agent defaults in July: no nested sub-agents by default (depth cap 1), concurrency cap 20, sub-agents run in the background by default, and fork mode is on by default. If you build on the Agent SDK, `listSubagents()` and per-agent permission prompts forwarded to `canUseTool` are the primitives. Managed Agents has a multiagent orchestration beta with a roster (`{"type": "self"}` to delegate to copies of itself, or a cheaper worker by ID).

## Evaluating multi-agent systems

Harder than single-agent because the paths vary. Evaluate end state, not turn by turn, especially when agents mutate state. Start with about twenty queries and a judge that scores factual accuracy, citation accuracy, completeness, source quality, and tool efficiency. Human review still catches what the judge misses: Anthropic's judge did not notice agents preferring SEO content farms over academic PDFs; humans did. Track **cost per win**, not pass rate. [Chapter 07](./07_evals.md).

Emergent behavior is real: a tweak to the lead prompt changes sub-agent behavior unexpectedly. Test interaction patterns, not agents in isolation.

## Long-running agents

A task that runs for hours is a different engineering problem from a task that runs for a minute, whether or not it is multi-agent. Three lessons from Anthropic's harness posts:

1. **Agents are stateful; models are not.** Errors compound. You need durable execution, checkpoints, retries, and graceful tool-failure surfacing so the model can adapt instead of the run dying.
2. **Harness assumptions go stale.** A harness encodes beliefs about model limits (needs a context refresh here, cannot plan past N steps). The next model invalidates them. Anthropic's answer is to decouple: the **session** (append-only event log), the **harness** (the loop that calls the model and routes tool calls), and the **sandbox** (where code runs and files live) are separate components that can be swapped independently. Brain, hands, log.
3. **Remove scaffolding as models improve.** The harness-design post is a diary of deleting things: context refreshes went away when context anxiety went away; the sprint negotiation between generator and evaluator went away later. Planner and evaluator survived. Keep the parts that add judgment, delete the parts that compensate for a limit the model no longer has.

The event-log / active-context split from [Chapter 08](./08_context_and_memory.md) is the concrete architecture. Add to it: a task budget the model can see (so it paces itself instead of being cut off), server-side compaction, structured notes to disk, a stop-reason vocabulary (`done | needs_human | blocked | failed_safely | budget_reached`), and a way to resume from the log after a restart.

> **Snapshot 2026-09.** Measured autonomy horizons roughly doubled this year ([METR's fifty-percent time horizon](https://metr.org/time-horizons/) for frontier models is now measured in many hours and their task suite tops out). Current Claude models ship with 1M context, 128K output, a memory tool, compaction, and task budgets specifically for this. Managed Agents adds session budgets in dollars, scheduled deployments, and webhooks on session events. The practical implication: fewer tasks need multi-agent to work around context limits, and more need a harness that can run a single agent for a long time safely.

## When to reach for Managed Agents instead

If the reason you want multi-agent is context isolation or parallel breadth, and the reason you want a harness is hours-long durability, a managed runtime gives you both without operating the loop. You describe the agent (prompt, tools, MCP servers, skills), the vendor runs sessions with a container and a durable log, and you consume an event stream. Project 8 in [Chapter 12](./12_projects.md) is the build. The tradeoff is control and lock-in; the win is not writing the harness.

## Exercises

1. Run Project 9 and Project 5 on the same breadth-first question and record tokens, wall-clock, and the judge's verdict. That is your first row of the cost-per-win table.
2. Give Project 9 the tightly coupled task from its spec and write down, from the trace, where the sub-agents' implicit decisions conflicted.
3. Cap waves at one, then three. Report what the third wave bought.
4. Write the one-page postmortem naming the failure mode you found.

## Checkpoint

- For a product-teardown agent, decide single or multi-agent using the five justifications, and write the sentence.
- Explain why the Project 9 example measured 4x rather than 15x and which knob would move it.
- Name the three components in Anthropic's brain/hands/log split and what each of your Project 9 files corresponds to.
- Say which sub-agents in Project 9 should be forked and which isolated.
- List what you would delete from Project 9's harness if the lead model got materially better tomorrow.

## Sources

- Anthropic, *How we built our multi-agent research system*: https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition, *Don't Build Multi-Agents*: https://cognition.ai/blog/dont-build-multi-agents
- Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands*: https://www.anthropic.com/engineering/managed-agents
- Anthropic, *Effective harnesses for long-running agents*: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Anthropic, *Harness design for long-running application development*: https://www.anthropic.com/engineering/harness-design-long-running-apps
- LangChain, *Organizing context in a multi-agent harness* (forked vs. isolated, Sept 2026): https://www.langchain.com/blog/organizing-context-in-a-multi-agent-harness
- LangChain, *Benchmarking multi-agent architectures*: https://blog.langchain.com/benchmarking-multi-agent-architectures/
- METR, *Time horizons*: https://metr.org/time-horizons/
