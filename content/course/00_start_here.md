# Building AI Agents — The Course

> A self-directed course on how agents work and how to build agentic products and services. First-principles before frameworks, primary sources over summaries, ship things that are not toys. Content last revised September 2026; see [How to keep it current](#how-to-keep-it-current) before trusting anything perishable.

## Who this is for

A builder who wants one coherent path from "what is an agent" to "I have shipped and operated one." Its best if you have some coding knowledge beforehand, and ideally spent some time building products either by yourself or with a team. The course is complete enough to serve as a first pass through building agents, and complete enough to be a reference for further investigation afterward.

The course has two aims. The first is to learn how agents work and how to build agentic products and services. The second is to get better at the three related skills that come with the territory: building *with* agents (using coding agents well), building agents, and building *for* agents (tools, skills, MCP servers, and harnesses that other agents consume).

## The spine

| # | Chapter | One line |
|---|---|---|
| 01 | [What is an LLM](./01_what_is_an_llm.md) | The model under the agent: tokens, pretraining, post-training, and what the weights do and do not know |
| 02 | [Mental models](./02_mental_models.md) | What an agent is, four frames, a short history, the harness |
| 03 | [When to build](./03_when_to_build.md) | The ladder, the tree, the rubric, the autonomy overlay |
| 04 | [The loop](./04_the_loop.md) | The from-scratch agent on the current API, then the tool runner |
| 05 | [Patterns](./05_patterns.md) | The five workflows, the agent, multi-agent shapes, anti-patterns |
| 06 | [Tools and MCP](./06_tools_and_mcp.md) | Tool design, gating, tool evals, the protocol |
| 07 | [Evals](./07_evals.md) | Error analysis first, the eval stack, judges, what to measure |
| 08 | [Context and memory](./08_context_and_memory.md) | Write/select/compress/isolate, the four memory types, long-running architecture |
| 09 | [Production](./09_production.md) | Checklist, threat model, HITL, observability, cost, deployment, rubric |
| 10 | [Multi-agent](./10_multi_agent.md) | When, how, a measured cost ratio, long-running harnesses |
| 11 | [Platforms](./11_platforms.md) | The harness/deployment split, Anthropic's four approaches, the landscape |
| 12 | [Projects](./12_projects.md) | A ten-project ladder with specs, acceptance criteria, and lessons from building it |
| 13 | [What changed](./13_whats_new_2026.md) | April to September 2026, per topic |
| 14 | [Reading list](./14_reading_list.md) | Filtered and annotated |

There is also a [short path](./QUICKSTART_for_a_friend.md): six weeks, read-this-then-build-this, for someone who wants the outline without the depth.

## How to use it

**Starting fresh**, at roughly ten hours a week:

1. **Weeks 1 to 2.** Read 01, 02, 03, 04. Build Projects 0, 1, and 2 from [Chapter 12](./12_projects.md). Do the exercises in 04; they are the actual learning.
2. **Weeks 3 to 4.** Read 05 and 06. Build Project 3 (triage with approval gates), Project 4 (the five workflow patterns), and Project 5 (a research agent). Document the first way Project 5 fails.
3. **Weeks 5 to 6.** Read 07 and 08. Build Project 6 part A, a real eval suite for Project 5, before going further. Evals sit in the middle of this course on purpose; deferring them is the most common and most expensive mistake. Then build Project 7 (memory and skills).
4. **Weeks 7 to 8.** Read 09, 10, 11. Build Project 8 on a managed runtime. Build Project 9 (multi-agent) and measure it against Project 5.
5. **After that.** Project 10 (an MCP server), then pick one of the ten to operate for ninety days. The maintenance rhythm in 09 is the curriculum after the curriculum.

Each chapter opens with a **Build** section naming the projects to do alongside it and a **Read** section naming what to read first, and closes with **Exercises** and a **Checkpoint**. The project numbers ascend with the chapters, so working the chapters in order works the ladder in order.

**As a reference**, each chapter ends with a checkpoint you can test yourself against and a source list you can trust.

**Keeping current.** Chapter 14 ends with a two-hour-a-week routine and a skip rule. Chapter 13 is the template for a quarterly "what changed" pass.

## Conventions

- Anything perishable (model IDs, prices, beta headers, version numbers, "GA since") is inside a `> **Snapshot 2026-09.**` callout. When you re-verify, edit the callout and its date.
- Model IDs are written without date suffixes.
- "Author's note" callouts are lightly edited observations from the author's own builds of the projects in Chapter 12. They are one practitioner's experience, not a source.
- Each chapter's sources are primary (vendor docs, papers, engineering blogs, practitioners who publish evidence) and were checked as live on 2026-09-09 where tooling allowed.

## How to keep it current

Every URL was checked as live and every perishable fact re-verified against primary sources on 2026-09-09. The author does not update this on a schedule. Two consequences:

- **Bring it up to date before you rely on it.** The field moves monthly. Start with [Chapter 13](./13_whats_new_2026.md), which is a worked example of a delta pass, and re-run that exercise for the months since September 2026. Then re-verify each snapshot callout. The sources lists at the bottom of each chapter tell you where to look, and the filter rule in Chapter 14 says what to admit: primary docs, papers, vendor engineering blogs, and practitioners who publish evidence.
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
