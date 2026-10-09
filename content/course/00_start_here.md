# Building AI Agents — The Course

> A self-directed course on how agents work and how to build agentic products and services. First-principles before frameworks, primary sources over summaries, ship things that are not toys. Content last revised September 2026; see [How this was made](#how-this-was-made-and-how-to-keep-it-current) before trusting anything perishable.

## Who this is for

An engineer who wants one coherent path from "what is an agent" to "I have shipped and operated one." It assumes you can write Python or TypeScript and have called an LLM API at least once. It is not a beginner programming course, but it is complete enough to be a first agents course, and it is dense enough to serve as a reference afterward.

The course has two aims. The first is to learn how agents work and how to build agentic products and services. The second is to get better at the three related skills that come with the territory: building *with* agents (using coding agents well), building agents, and building *for* agents (tools, skills, MCP servers, and harnesses that other agents consume).

## The spine

| # | Chapter | One line |
|---|---|---|
| 01 | [Mental models](./01_mental_models.md) | What an agent is, four frames, a short history, the harness |
| 02 | [When to build](./02_when_to_build.md) | The ladder, the tree, the rubric, the autonomy overlay |
| 03 | [The loop](./03_the_loop.md) | The from-scratch agent on the current API, then the tool runner |
| 04 | [Patterns](./04_patterns.md) | The five workflows, the agent, multi-agent shapes, anti-patterns |
| 05 | [Tools and MCP](./05_tools_and_mcp.md) | Tool design, gating, tool evals, the protocol |
| 06 | [Evals](./06_evals.md) | Error analysis first, the eval stack, judges, what to measure |
| 07 | [Context and memory](./07_context_and_memory.md) | Write/select/compress/isolate, the four memory types, long-running architecture |
| 08 | [Production](./08_production.md) | Checklist, threat model, HITL, observability, cost, deployment, rubric |
| 09 | [Multi-agent](./09_multi_agent.md) | When, how, a measured cost ratio, long-running harnesses |
| 10 | [Platforms](./10_platforms.md) | The harness/deployment split, Anthropic's four approaches, the landscape |
| 11 | [Projects](./11_projects.md) | A ten-project ladder with specs, acceptance criteria, and lessons from building it |
| 12 | [What changed](./12_whats_new_2026.md) | April to September 2026, per topic |
| 13 | [Reading list](./13_reading_list.md) | Filtered and annotated |

There is also a [short path](./QUICKSTART_for_a_friend.md): six weeks, read-this-then-build-this, for someone who wants the outline without the depth.

## How to use it

**Starting fresh**, at roughly ten hours a week:

1. **Weeks 1 to 2.** Read 01, 02, 03. Build Projects 0, 1, and 2 from [Chapter 11](./11_projects.md). Do the exercises in 03; they are the actual learning.
2. **Weeks 3 to 4.** Read 04 and 05. Build Project 3 (the five workflow patterns) and Project 4 (a research agent). Document the first way Project 4 fails.
3. **Weeks 5 to 6.** Read 06 and 07. Build Project 5 (memory and skills). Then stop and build Project 8 part A, a real eval suite for Project 4, before going further. Evals sit in the middle of this course on purpose; deferring them is the most common and most expensive mistake.
4. **Weeks 7 to 8.** Read 08, 09, 10. Build Project 6 (multi-agent) and measure it against Project 4. Build Project 7 on a managed runtime.
5. **After that.** Project 9 (an MCP server), then pick one of the ten to operate for ninety days. The maintenance rhythm in 08 is the curriculum after the curriculum.

**As a reference**, each chapter ends with a checkpoint you can test yourself against and a source list you can trust.

**Keeping current.** Chapter 13 ends with a two-hour-a-week routine and a skip rule. Chapter 12 is the template for a quarterly "what changed" pass.

## Conventions

- Anything perishable (model IDs, prices, beta headers, version numbers, "GA since") is inside a `> **Snapshot 2026-09.**` callout. When you re-verify, edit the callout and its date.
- Model IDs are written without date suffixes.
- "Author's note" callouts are lightly edited observations from the author's own builds of the projects in Chapter 11. They are one practitioner's experience, not a source.
- Each chapter's sources are primary (vendor docs, papers, engineering blogs, practitioners who publish evidence) and were checked as live on 2026-09-09 where tooling allowed.

## How this was made, and how to keep it current

This course was assembled, not written from scratch. The process:

1. Five independent curriculum drafts were generated with LLM research assistants (two with ChatGPT, three with Claude) from the same brief: a first-principles course on building agents for an experienced engineer, primary sources only.
2. The author worked through the material, built the projects in Chapter 11, and kept reading notes.
3. In September 2026 the five drafts, the project write-ups, and the notes were consolidated into this single course with an LLM, then edited by hand. Duplicate material was cut, disagreements between drafts were resolved and noted where they mattered, and every source was re-filtered against the rule in Chapter 13: primary docs, papers, vendor engineering blogs, and practitioners who publish evidence. Paid-course promotion, listicles, vendor comparisons written by competitors, aggregators, and "follow these accounts" lists were cut.
4. Every URL was fetched and checked as live on 2026-09-09, and perishable facts were re-verified against primary sources on that date.

The author does not update this on a schedule. Two consequences:

- **Bring it up to date before you rely on it.** The field moves monthly. Start with [Chapter 12](./12_whats_new_2026.md), which is a worked example of a delta pass, and re-run that exercise for the months since September 2026. Then re-verify each snapshot callout. The sources lists at the bottom of each chapter tell you where to look.
- **Personalize it.** The project ladder, the stack choices, and the reading order reflect one engineer's situation: TypeScript and Python, the Claude API and LangGraph as the primary stack. If your stack is different, the mental models hold and the specifics should be swapped. The fastest way to do that is to hand this folder to a coding agent with your own constraints and have it propose the edits; that is also a good first exercise in building *with* agents.

## What "mastery" looks like

1. Read any agent system and identify its rung, its pattern, its autonomy level, and whether it is really a workflow.
2. Build the loop without a framework, then improve it with one, and explain what the framework bought.
3. Diagnose a misbehaving agent by inspecting what is in its context, not by rewriting the prompt.
4. Have an eval running before you ship, and a judge you trust.
5. Choose a stack for any new project and justify it in one sentence.
6. Anticipate the failure modes of multi-agent systems, and refuse to build one when one agent will do.
7. Talk fluently about the tradeoffs: tokens, latency, autonomy, observability, drift, cost.

The last one matters most. Most people building agents in 2026 can write the code. Far fewer can reason crisply about when to build, what to build, and when not to.
