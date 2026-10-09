# 11 — The Project Ladder

> The hands-on spine of the course: ten projects, each with a spec, acceptance criteria, and a stretch goal. Projects 0 through 5, 7, and 9 also carry the author's notes from building them, because the lessons from the failures are worth more than the specs. After this chapter you know exactly what to build next and what "done" means for it.

Four meta-rules that every project follows:

1. **Build for yourself or one real user.** Toys teach nothing about failure.
2. **Run it for at least a week.** Watch what breaks.
3. **Write a one-page postmortem** naming the failure mode you found. That document is worth more than the code.
4. **Add an eval before you move on.** Even five cases. Project 6 is where they accumulate, but it starts at Project 1.

And the rule about frameworks: pick a primary by Project 4, do not switch until Project 6. Each switch adds thirty to fifty percent to that project's timeline.

The projects are numbered in the order the chapters introduce them; each chapter's **Build** section says which to do alongside it, and each project below links back to its chapter.

The stack notes below assume the Claude API plus LangGraph, which is what the author used. Swap freely; the specs are stack-neutral.

## The ladder

| # | Project | Chapter | Teaches | Rough time |
|---|---|---|---|---|
| 0 | The rings: Anthropic's tool-use tutorial in five stages | 01, 03 | The loop, one piece at a time | 2 hours |
| 1 | Hello Agent: manual loop, two tools | 03 | `tool_use` and `tool_result` with no abstraction | Half a day |
| 2 | Thinking agent: web search, trace log, A/B | 03 | Traces, budgets, the limits of asking the model to plan | 1 day |
| 3 | Thinking in graphs: triage with two approval gates | 04 | Routing into a chain with human-in-the-loop | Half a day |
| 4 | The five workflow patterns plus evaluator-optimizer | 04 | Pattern matching; the workflow/agent boundary | 1 to 2 days |
| 5 | Research agent with citations and budgets | 05 | A real single agent; termination; your first documented failure | 2 days |
| 6 | Eval suite and review workbench | 06 | The discipline that separates demos from products | 2 to 3 days |
| 7 | Memory, `agents.md`, skills | 07 | Write/select/compress/isolate in code | 1 to 2 days |
| 8 | Managed Agents deployment | 08 | What changes when the vendor owns the loop | 1 day |
| 9 | Multi-agent research with a cost governor | 09 | When multi-agent is worth it, measured | 2 to 3 days |
| 10 | Custom MCP server | 10 | Tool design from the producer side; building *for* agents | 2 to 3 days |

## Project 0 — The rings

*Pairs with [Chapter 01 — Mental models](./01_mental_models.md).*

Work through Anthropic's "build a tool-using agent" tutorial as five separate scripts, in order: one tool and one manual round trip; the `while stop_reason == "tool_use"` loop; multiple tools with parallel calls and all results in one user message; error handling with `is_error: true`; the SDK tool runner. [Chapter 03](./03_the_loop.md) is the commentary. Run them on a current model, without `temperature`, and note every place the tutorial's code has drifted from the current API.

**Acceptance.** You can write ring 2 from memory.


## Project 1 — Hello Agent

*Pairs with [Chapter 03 — The loop](./03_the_loop.md).*

**Goal.** See the loop with no abstraction. Plain Python or TypeScript, the raw Messages API, no framework.

**Spec.** Two tools, `calculator(expression)` and `get_weather(city)` (Open-Meteo is free and needs no key). Answer questions like "what is 17% of today's high in Paris?" Cap iterations at ten. Print every iteration. Use the AST calculator from [Chapter 03](./03_the_loop.md), not `eval`, and branch on `stop_reason != "tool_use"` rather than `== "end_turn"`.

**Acceptance.** Runs on a math question, a weather question, and a combined one. You can explain each printed iteration. You hit the iteration cap at least once on purpose ("what is the population of Mars?") and can describe the loop's failure mode.

**Stretch.** Streaming. A `final_answer` tool the agent must use; compare the behavior.


## Project 2 — Thinking agent

*Pairs with [Chapter 03 — The loop](./03_the_loop.md).*

**Goal.** Traces, budgets, and an honest A/B.

**Spec.** Extend Project 1 with a real `web_search` tool and a JSON-lines trace: one line per step with tool, input, output, latency, tokens. Enforce a token budget from `usage`, not a step count. Then run the same multi-source question ("compare the population density of Tokyo and São Paulo as a percentage") at two effort levels and compare tokens and quality.

**Acceptance.** You can read the trace and predict where the agent will struggle. You can say which effort level you would ship and why.

**Stretch.** A `reflect` tool that summarizes progress; measure whether it changes outcomes or is ritual.


## Project 3 — Thinking in graphs

*Pairs with [Chapter 04 — Patterns](./04_patterns.md).*

**Goal.** Your first fixed-topology workflow with human approval.

**Spec.** Support-email triage: classify, route to one of three handlers, draft a reply, pause for approval before anything sends, pause again on low confidence. LangGraph interrupts or the equivalent in your framework.

**Acceptance.** You can name which of the four HITL patterns in [Chapter 08](./08_production.md) this implements, and the LLM never decides which node runs next.


## Project 4 — The five workflow patterns

*Pairs with [Chapter 04 — Patterns](./04_patterns.md).*

**Goal.** Implement each pattern from [Chapter 04](./04_patterns.md) side by side so you can pattern-match a problem to a structure in seconds.

**Spec.** Six files, each under 100 lines: prompt chaining (outline, critique, write, with one retry gate); routing (ticket triage to three handlers); parallel sectioning (subject line, tweet, post, aggregated); parallel voting (three reviewers, merged and ranked); orchestrator-workers (a planner emits an unknown number of subtopics, a worker per subtopic, a synthesizer); evaluator-optimizer (translate, score, loop to a threshold or three iterations). Write a README comparing them.

**Acceptance.** Someone who has only read the README can pick the right pattern for a problem you describe. Export each graph as a diagram.

> **Author's note.** The sentence that fell out of building these: the model chooses *what to write* but never *what node runs next*. All six are workflows. The orchestrator's dynamic fan-out is the only place the graph shape is decided at run time, and that is the door to Project 5.


## Project 5 — Research agent

*Pairs with [Chapter 05 — Tools and MCP](./05_tools_and_mcp.md).*

**Goal.** A real, useful single agent end to end.

**Spec.** Given a research question, search, fetch the three to five most relevant pages, take notes in a scratchpad, decide when it has enough, and write a 600 to 1000 word report with inline citations to a file. Hard rules: single agent; a step cap and a tool-call budget that fail loudly; every claim cites a URL the agent actually fetched (enforce it in the `save_report` tool, not the prompt).

**Acceptance.** Works on three questions you make up. You find and document at least one failure mode in the README. That document matters more than the report quality.

**Stretch.** A `read_pdf` tool. Token tracking. Try the provider's server-side search and fetch tools in place of your own for one run and compare cost, quality, and code deleted.

> **Author's note.** The documented failure: on niche or freshness-bound questions the agent burned four or five search calls re-querying minor variations before fetching anything. Root cause: the prompt rewarded tool-call frugality but did not distinguish search from fetch. Fix: "stop after at most five fetches" *and* "you are budgeted to ten tool calls total." Without the second clause it over-searches. Lesson: budgets are per tool type, and most tool fixes are description fixes.


## Project 6 — Eval suite and review workbench

*Pairs with [Chapter 06 — Evals](./06_evals.md).*

**Goal.** The eval layer this course has been pointing at since Project 5, and the small tool that makes looking at traces frictionless. [Chapter 06](./06_evals.md) is the method.

**Spec, part A: the suite.**
- An eval set for Project 5 with the 20/10/10/5/5 composition: normal, ambiguous, adversarial, tool-failure, should-ask-approval. Hand-write twenty; generate inputs (never outputs) for the rest; mine your `reports/` and traces for real cases.
- Three layers: programmatic checks (citations resolve, required sections present, budget respected); a trajectory judge (tool selection, unnecessary calls, stop reason); an end-state judge (accuracy, completeness, source quality), binary pass/fail plus critique.
- Align the judge: you grade thirty, the judge grades the same thirty, iterate to at least 90% agreement on a held-out set, track true-positive and true-negative rates separately. Use a different model family than the agent.
- A regression runner: one command prints pass rate, cost per win, and a diff against the last run.

**Spec, part B: the workbench.** A small web app (Vite or Next.js, a data table, JSONL or SQLite) that imports eval results and traces; filters by score, model, prompt version, failure type; shows input, output, expected, tool calls, retrieved context, judge rationale; lets you label failure modes from the taxonomy in Chapter 06, add notes, and edit expected answers; exports the curated set and a failure-taxonomy summary.

**Acceptance.** Judge agreement at least 90% on a held-out twenty. After one review session you can name the top three failure modes with counts. A production failure becomes a regression case in under five minutes. A non-engineer could review examples without touching code. You have run the suite before and after one deliberate prompt change and can show the diff.

**Stretch.** Have a coding agent draft the first eval set from an interview and compare it to yours. Publish a sanitized eval dashboard as a static page.


## Project 7 — Memory, `agents.md`, skills

*Pairs with [Chapter 07 — Context and memory](./07_context_and_memory.md).*

**Goal.** Context engineering in practice. [Chapter 07](./07_context_and_memory.md) is the theory.

**Spec.** Extend Project 5 with: an `agents.md` (role, output format, citation style, never-do list) composed into every system prompt; a `memory.md` the agent reads at start and writes to via a `remember` tool when it learns something durable; one skill (`skills/weekly-briefing/SKILL.md`) loaded on demand through a manifest, never eagerly; compression of any tool result over a size threshold with a cheap model before it enters context.

**Acceptance.** The same prompt on session five is measurably better than on session one, judged by you. `memory.md` accretes useful preferences. The skill produces the same format every time.

**Stretch.** A reflection step at session end that *proposes* memory edits for human review. Do not auto-apply them.

> **Author's note.** Three decisions held up. Mapping write/select/compress/isolate onto specific files and tools (the table in Chapter 07) made the design legible. Not auto-applying reflection avoided the self-reinforcing-error failure mode, where a wrong inference is written, read, and confirmed. And the placement rule for any new instruction: permanent rule in `agents.md`, session preference in `memory.md`, task workflow in a skill. "Skills should not be loaded eagerly" was the conclusion that shaped the manifest design.


## Project 8 — Ship it on Managed Agents

*Pairs with [Chapter 08 — Production](./08_production.md).*

**Goal.** Deploy the Project 7 agent (with memory and its skill) as a Claude Managed Agent, run it on a schedule, and consume its output. Learn what changes when the vendor owns the loop and the sandbox.

**Spec.**
- Define the agent and environment as version-controlled YAML applied with the `ant` CLI: model, system prompt, server-side search and fetch tools, `save_report` as a custom tool your client answers, the weekly-briefing skill, an MCP server if you have one.
- A small client that streams events, answers custom tool calls, handles `tool_confirmation` round trips for anything with side effects, and reconnects losslessly.
- A memory store so semantic memory persists across sessions without you managing `memory.md`.
- A scheduled deployment that fires the weekly briefing.
- A session budget in dollars; observe `budget_reached`.
- Credentials in a vault as environment-variable credentials; the sandbox must never see them.

**Acceptance.** The same question produces a report comparable to Project 7 with your harness code deleted. One scheduled run completes unattended. A deliberate side-effect call pauses for confirmation and resumes. A postmortem: what the managed runtime did better, what it hid, what you would still self-host.

**Stretch.** A multiagent session with a cheaper worker in the roster; compare tokens and wall-clock to Project 9 once you have built it.

> **Snapshot 2026-09.** The Managed Agents surface is beta and moves; read the docs first and expect the YAML schema and beta header to have changed.


## Project 9 — Multi-agent research

*Pairs with [Chapter 09 — Multi-agent](./09_multi_agent.md).*

**Goal.** A small version of Anthropic's research system, built only after Projects 5 and 7 work, with the cost measured honestly.

**Spec.** A lead agent plans, persists the plan to disk *before* fan-out, spawns three to five parallel sub-agents each with one sub-question and a single exit tool (`return_sub_report`), reads the reports, optionally runs a second wave, and synthesizes. Lead on a strong model, workers on a cheaper one. Token usage logged per agent. A cost governor that caps waves and total spend.

**Acceptance.** Works on a breadth-first question ("founders and current CEOs of the top 20 companies in a startup batch"). You have a measured token ratio against Project 5 on the same question. It fails interestingly on a tightly coupled task (refactor a 500-line file for async), and you can explain why from Cognition's argument.

**Stretch.** A rainbow deployment: version the lead prompt, route 50/50 by question hash, log the variant on every trace. An LLM-judge comparison of single versus multi-agent on ten questions with cost per win as the critical column; add it to the Project 6 suite.

> **Author's note.** Measured about 4x tokens over the single agent, not the textbook 15x, because the workers ran on a terser model with tight budgets and waves were capped at two. The multiplier is a function of your budgets, not a law. Other findings: a third wave is almost never worth it; rate limits, not token price, bound cheap providers; provider quirks (an empty assistant message after a tool result) needed three layers of guard; and the rainbow router was thirty lines, with all the value in the versioning and logging discipline.


## Project 10 — A custom MCP server

*Pairs with [Chapter 10 — Platforms](./10_platforms.md).*

**Goal.** Build *for* agents. Expose a small domain (the example used throughout this course is a library concierge: search catalog, check availability, place hold, list holds) as an MCP server and use it from three clients.

**Spec.** The official SDK; tools with strict schemas and the analyst-derived operation list from [Chapter 05](./05_tools_and_mcp.md); one resource (the patron's current holds); one prompt template. Streamable HTTP with OAuth per the current spec. `place_hold` is gated: it returns a draft and a separate `confirm_hold` requires approval.

**Acceptance.** The same server works from Claude Code, from a Messages API request via the MCP connector, and from your own agent. The MCP Inspector shows every tool. Injection test: a catalog record containing "ignore previous instructions" does not change the agent's behavior. A postmortem on what the protocol made easier and harder than a local tool.

## Keeping the finished projects current

Model IDs, API parameters, and SDK versions drift under a finished project within months. A short modernization pass before each new project, under an hour each:

| Check | Why |
|---|---|
| Model IDs are current; no `temperature` on current Claude models | Sampling parameters return a 400 on current models |
| Content is handled as block arrays, not cast to a string | Thinking blocks and multi-block responses break the cast |
| `refusal` and other non-`tool_use` stops are handled | Current models return refusals as a stop reason |
| Hand-rolled features the API now provides are noted | Server-side search, memory tool, compaction, tool search ([Chapter 03](./03_the_loop.md)) |
| Instruction files reference only tools that exist | Drift between `agents.md` and the tool registry is silent |
| Per-run and per-step log schema from [Chapter 08](./08_production.md) is in place | Foundation for Project 6 |

## Beyond the ladder

Operate one of these for ninety days. The maintenance rhythm in [Chapter 08](./08_production.md) is the curriculum after the curriculum. Then pick a specialization: coding agents, research agents, customer support, data and analyst agents, or voice. Read three production case studies in the vertical, then build one.

## Checkpoint

- Every finished project runs on current model IDs and passes the modernization table.
- Each project has a postmortem naming one failure mode.
- Project 6's suite runs in one command and the workbench shows a failure taxonomy.
- Project 10's server is reachable from three clients.

## Sources

- Anthropic, *Build a tool-using agent* tutorial: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Anthropic, *Building Effective Agents* (the patterns in Project 4): https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, *How we built our multi-agent research system* (the shape of Project 9): https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition, *Don't Build Multi-Agents* (why Project 9 fails on coupled tasks): https://cognition.ai/blog/dont-build-multi-agents
- Anthropic, *Managed Agents* docs: https://platform.claude.com/docs/en/managed-agents/overview
- Anthropic, *Demystifying evals for AI agents*: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Hamel Husain, *Your AI Product Needs Evals* and *LLM-as-a-Judge*: https://hamel.dev/blog/posts/evals/ · https://hamel.dev/blog/posts/llm-judge/
- MCP, *Build a server*: https://modelcontextprotocol.io/docs/develop/build-server
