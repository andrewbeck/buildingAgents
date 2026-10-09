# 08 — Context Engineering and Memory

> What goes in the window, what stays out, and how the agent remembers across sessions. It leans on the Project 7 build from [Chapter 12](./12_projects.md), which is where these ideas become files and tools. After it you can diagnose "why is my agent being stupid" by asking "what is actually in its context right now," and you can name which of the four memory types you are building before you build it.

## Build

- [Project 7](./12_projects.md#project-7--memory-agentsmd-skills): memory, `agents.md`, and skills on top of Project 5. The four operations and the four memory types become files and tools. Run Project 6's suite before and after; the acceptance criterion is a measured improvement, not a feeling.

## Read

Read first:

- **[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)** (Anthropic, 2025). Attention budget, context rot, and the compaction, note-taking, sub-agent triad.
- **[Context Engineering for Agents](https://rlancemartin.github.io/2025/06/23/context_engineering/)** (Lance Martin, 2025). Write, select, compress, isolate; the spec for Project 7 is these four buckets.
- **[Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)** and **[Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)** (Claude docs). Progressive disclosure in three levels.

Read after: the [Manus lessons](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) when the agent runs past fifty turns, **[LangMem conceptual guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)** for the four memory types, and **[Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)**. All in the [context and memory tier](./14_reading_list.md#tier-context-and-memory), which also carries the author's notes from this project.

## Context is a finite, degrading resource

Context is every token the model sees on a turn: system prompt, tools, history, tool results, documents, memory. It is finite, and performance degrades before the limit. [Lance Martin's four failure modes](https://rlancemartin.github.io/2025/06/23/context_engineering/) are the diagnostic vocabulary:

| Failure | What it looks like |
|---|---|
| Poisoning | A hallucination or bad tool result lands in context and gets reused as fact |
| Distraction | So much context that the model over-attends to it and under-uses its training |
| Confusion | Superfluous context (irrelevant tools, stale notes) shapes the answer |
| Clash | Parts of the context disagree and the model splits the difference |

[Anthropic's definition](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) of good context: the smallest set of high-signal tokens that maximizes the likelihood of the desired outcome. "Prompt engineering" became "context engineering" because with capable models the question moved from "what should I say" to "what configuration of context produces the right behavior."

## The four operations

Lance Martin's frame, which Project 7 implemented:

| Operation | Meaning | In Project 7 |
|---|---|---|
| **Write** | Persist context outside the window | `take_note` scratchpad; `remember` hot-path writes to `memory.md`; `save_report` to `reports/` |
| **Select** | Pull the right context in at run time | `agents.md` + `memory.md` composed into the system prompt; `load_skill` on demand; search and fetch tools |
| **Compress** | Reduce what is in the window | Haiku compression of tool results over 20K chars; compaction |
| **Isolate** | Give work its own window | Sub-agents in Project 9; sandboxed code execution; state fields the agent never sees |

Two diagnostic rules worth memorizing: "we're running out of context" is usually a Compress problem upstream of a Select problem; "the agent keeps doing the wrong thing" is usually a Select problem masquerading as a prompt-engineering problem.

## Which memory are you building?

[CoALA](https://arxiv.org/abs/2309.02427)'s four types, mapped to files. This table is the single most useful artifact from Project 7.

| Type | Holds | Project 7 file | Write policy |
|---|---|---|---|
| Working | The current turn's state | `state.messages[]` | Automatic |
| Episodic | Specific past runs | `reports/*.md`, session logs | Append on completion |
| Semantic | Facts learned, user preferences | `memory.md` | Hot path for explicit "remember"; reflection proposals human-reviewed |
| Procedural | How to do things | `agents.md`, `skills/*/SKILL.md`, tool definitions | Edited by a human, or by an LLM with review |

The rule from Project 7: when adding a memory feature, ask which of the four you are building. If the answer is "all of them," you are building a mess. And the placement question for any new rule: permanent rule → `agents.md`; session-scoped preference → `memory.md`; workflow specific to one task → a skill.

## Hot path vs. background writes

Memory writes happen in two places with different failure modes. **Hot-path** writes (the agent calls `remember` mid-task) cost latency and can be wrong in the moment. **Background** writes (a reflection step after the run proposes memories) risk drift and unwanted injection. Project 7 chose hot-path for explicit user asks and human-reviewed proposals for reflection. That was the right call. Auto-applied reflection is the first thing that hits the self-reinforcing-error failure mode: a wrong inference gets written, then read, then confirmed.

The four named memory failure modes, from the memory literature. Walk this list before assuming the model is dumb:

1. **Summarization drift.** Each compaction loses a little; over many, the agent's picture of the task diverges from reality.
2. **Semantic mismatch in retrieval.** The query and the stored memory describe the same thing in different words, and the lookup misses.
3. **Self-reinforcing errors.** A bad memory is read, acted on, and re-written as confirmed.
4. **Contradiction handling.** Two memories conflict and nothing decides which wins.

## Simple beats clever

The most important finding, from Lance Martin's benchmark: the simple `claude.md` plus filesystem approach that Claude Code uses, with zero RAG and zero auto-write, performed as well as or better than IDE competitors' semantic chunking and knowledge graphs. The simple thing is often the right thing. Rules that follow:

- Keep instruction files short. Under 300 lines, ideally under 60. Every line is paid on every turn.
- Never send an LLM to do a linter's job. Deterministic checks belong in hooks or tools, not prompts.
- Prefer pointers to copies. Give the agent a file path or a query it can run, not the file's contents.
- Just-in-time over pre-computed. As models improve, the trend is to give the agent lightweight identifiers (paths, links, stored queries) and let it load what it needs. Slower per call, more robust overall, and it enables progressive disclosure.

[Mem0's published numbers](https://mem0.ai/blog/state-of-ai-agent-memory-2026) (a vendor's own benchmark; keep the shape, not the figures) make the tradeoff concrete: naive full-context replay scored highest on a memory benchmark but ate 26K tokens per turn; selective retrieval gave up six accuracy points for ninety percent fewer tokens and ninety-one percent lower p95 latency. Choose per use case, not by default.

## Long-running agents: the event log and the active context

For tasks that run for hours the architecture that has held up is a split:

```
┌──────────────────────────────┐        ┌──────────────────────────┐
│  Event log (durable)         │  harness │  Active context (model)  │
│  every message, tool call,   │ ───────▶ │  compacted summary +     │
│  result, decision, timestamp │  decides │  recent turns + notes    │
│  append-only, queryable      │  what    │  fits in the window      │
└──────────────────────────────┘  crosses └──────────────────────────┘
```

Durability lives in the log. Attention lives in the active context. The harness decides what crosses. [Anthropic's Managed Agents architecture](https://www.anthropic.com/engineering/managed-agents) is exactly this: session (append-only log), harness (the loop), sandbox (the hands), each swappable. Three techniques feed the active context:

- **Compaction.** Summarize the window and restart with the summary. Now available server-side on the Claude API (beta `compact-2026-01-12`); the critical rule is to append `response.content` back every turn so compaction blocks survive. Hierarchical compaction (summaries of summaries) for very long runs.
- **Structured note-taking.** The agent writes notes to disk outside the window and reads them back. Anthropic's research lead saves its plan to memory before spawning sub-agents because its own context will be truncated. Project 9 persists plans to `plans/` for the same reason.
- **Sub-agents.** Fresh windows for sub-tasks; only a compressed result returns. [Chapter 10](./10_multi_agent.md).

[Anthropic's harness-design post](https://www.anthropic.com/engineering/harness-design-long-running-apps) describes the arc: context anxiety was real on earlier models and needed fresh sessions; later models tolerated long contexts and the workaround was removed. Check whether a context refresh is still necessary task by task rather than assuming it.

## Observational memory

The Mastra book's variant is worth knowing because it is concrete. The window is split into two blocks: a list of timestamped observations (roughly 30K tokens) and raw recent messages (roughly 40K). When raw messages overflow, an observer agent compresses them into observations. When observations overflow, a reflector agent garbage-collects. Observations are plain text, not structured objects, with a three-date model (observed, referenced, relative). It is a sensible default for a chat-shaped product and a good example of "text is the universal interface."

## Skills as procedural memory

A skill is a folder: `SKILL.md` with frontmatter (name, description) plus optional scripts and references. The description sits in context; the body loads only when the task matches. Rules from the Project 7 build and the Anthropic guidance:

- One level deep, max. Nested skill trees get ignored.
- `SKILL.md` body under 500 lines. Move detail into referenced files.
- Avoid time-sensitive content in a skill. Point at a source instead.
- **Do not load skills eagerly.** The Project 7 conclusion, and the reason its spec is built on a manifest.
- Author with one model, use with another, observe, edit. That loop is how a skill gets good.

> **Snapshot 2026-09.** Claude Code's `/skill-doctor` reports skills that are loaded but unused and what they cost in context. Run it on any skill set older than a month. The Skills API on the Claude platform is GA; `container.skills` on a Messages request plus code execution lets a skill generate files server-side.

## The API-level toolkit

Things Project 7 builds by hand that are now request features. Know them before rebuilding them.

| Need | Feature | Note |
|---|---|---|
| Cross-session memory with a file interface | `memory_20250818` tool | You implement the backend (disk, S3, DB); Claude reads and writes `/memories` |
| Clear stale tool results without summarizing | Context editing (beta) | Prunes; does not summarize |
| Summarize when near the limit | Compaction (beta) | Server-side; preserve the blocks |
| Cheaper repeated prefixes | Prompt caching | Stable content first; verify `cache_read_input_tokens` is nonzero; a timestamp in the system prompt silently kills it |
| Operator instruction mid-session without a cache reset | Mid-conversation `role: "system"` message | Opus 5 and Fable 5.1; not Sonnet 5 |
| Many tools without bloating context | Tool search | Appends schemas instead of swapping; cache-safe |

Editing, compaction, and memory are complementary: editing prunes within a session, compaction summarizes when near the limit, memory persists across sessions. Long-running agents commonly use all three.

## Diagnosis procedure

When an agent misbehaves:

1. Dump the exact request that produced the bad turn. Read it. All of it.
2. Classify: poisoning, distraction, confusion, or clash.
3. Ask which operation is failing: write (nothing persisted), select (wrong thing pulled in), compress (too much in), isolate (should have been a sub-task).
4. Ask which memory type is involved and whether it is in the right file.
5. Only then touch the prompt.

## Exercises

1. Before writing any memory code, list every piece of state in Project 5 and assign each to working, episodic, semantic, or procedural memory.
2. Implement compression for one tool result type and measure tokens per run before and after on the same five questions.
3. Run the same prompt on session one and session five of Project 7 and grade both with the Project 6 judge.
4. Take a misbehaving transcript and run the diagnosis procedure from this chapter. Name the operation that failed before changing anything.

## Checkpoint

- Map every file in your Project 7 to a CoALA memory type and a write policy.
- Explain why Project 7 does not auto-apply reflection, and which failure mode it avoids.
- Describe the event-log / active-context split and name which Claude API features implement each half.
- Given a misbehaving transcript, run the diagnosis procedure and name the operation that failed.
- State the rule for where a new instruction goes: `agents.md`, `memory.md`, or a skill.

## Sources

- Anthropic, *Effective context engineering for AI agents*: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Lance Martin, *Context Engineering for Agents*: https://rlancemartin.github.io/2025/06/23/context_engineering/
- Lance Martin, *Learning the Bitter Lesson* (remove scaffolding as models improve): https://rlancemartin.github.io/2025/07/30/bitter_lesson/
- Anthropic, *Effective harnesses for long-running agents*: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Anthropic, *Harness design for long-running application development*: https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic, *Scaling Managed Agents*: https://www.anthropic.com/engineering/managed-agents
- Anthropic, *Equipping agents for the real world with Agent Skills*: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic, *Memory tool*, *Context editing*, *Prompt caching* docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- Sumers et al., *CoALA*: https://arxiv.org/abs/2309.02427
- Packer et al., *MemGPT*: https://arxiv.org/abs/2310.08560
- Sam Bhagwat, *Principles of Building AI Agents*, chapter 7 (observational memory): https://mastra.ai/book
