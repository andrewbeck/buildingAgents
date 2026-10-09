# Building Agents

## Intro from the human!

In early 2026 I felt I needed to get much better at building agents. Really I needed to understand them more deeply, and I ended up making this self-directed course for myself and now for anybody else who may find it useful. I spent time researching on my own, and iterated back and forth with claude code and codex to build out a more robust course which included practice problems. Added some visual tools along the way. Everything here is free and generally available; the benefit to this repo is that it's brought together into a "course" you can work through, helps to frame things and gives some direction if you're a beginner. The practice problems are helpful also.

What I think you should do is basically what I did: point an agent at this, have it get you going on the course, and also use it to personalize the course to you. The first thing to do is make sure the content is up to date - I have not updated this since September 2026, and much of it was initially put together earlier in the year around April 2026. Next, personalize it to your interests - if there's some topic you especially want, tell the agent that, and it can re-work the content to emphasize that more or move it up in prioritization or whatever. The visualization of the content was all just personal preference, you can change all that also. In fact, it all comes down to .md files so you can do whatever you want with it.

Ultimately I wanted to understand LLMs more completely, and be able to build agentic products and services, build with agents, and build for agents. This exercise was very helpful in getting me started, and from there it's all about spending time building.

Last note: the models are bad with timelines, take anything related to timing with a grain of salt. I took about 2-3 weeks going through everything, I didn't do it all day every day during that period but did spend real time on it.

The rest of this was written using AI models, only lightly edited.

## The rest of this is by AI (lightly edited)

A self-directed course on how AI agents work and how to build agentic products and services, plus a small local viewer for reading it.

The course has two aims. The first is to learn how agents work and how to build agentic products and services: the loop, tools, patterns, evals, context and memory, production, multi-agent, platforms. The second is to get better at the three skills that come with the territory: building *with* agents (using coding agents well), building agents, and building *for* agents (tools, skills, MCP servers, and harnesses that other agents consume).

**Content last revised: 2026-09-09.** It is not updated on a schedule. See [Keeping it current](#keeping-it-current-and-making-it-yours) before relying on anything perishable.

## What is here

```
content/course/   the course: 14 chapters plus a six-week short path
server/           Express API that serves the content directory (read-only)
src/              React viewer: markdown, code, Mermaid, search, notes, progress
```

Start at [`content/course/00_start_here.md`](content/course/00_start_here.md). The chapters are plain Markdown and read fine on GitHub or in any editor; the viewer adds search, reading progress, per-document notes, and rendered diagrams.

| # | Chapter | One line |
|---|---|---|
| 00 | Start here | Who it is for, the spine, how it was made |
| 01 | Mental models | What an agent is, four frames, a short history, the harness |
| 02 | When to build | The complexity ladder, the decision tree, the rubric, the autonomy overlay |
| 03 | The loop | The from-scratch agent on the current API, then the SDK tool runner |
| 04 | Patterns | The five workflows, the agent, multi-agent shapes, anti-patterns |
| 05 | Tools and MCP | Tool design, gating, tool evals, the protocol |
| 06 | Evals | Error analysis first, the eval stack, judges, what to measure |
| 07 | Context and memory | Write/select/compress/isolate, the four memory types, long-running architecture |
| 08 | Production | Checklist, threat model, HITL, observability, cost, deployment, graduation rubric |
| 09 | Multi-agent | When, how, a measured cost ratio, long-running harnesses |
| 10 | Platforms | The harness/deployment split, Anthropic's four approaches, the landscape |
| 11 | Projects | A ten-project ladder with specs, acceptance criteria, and lessons from building it |
| 12 | What changed | April to September 2026, per topic; a template for your own delta pass |
| 13 | Reading list | Filtered and annotated, with the filter rule and a weekly routine |

The projects in Chapter 11 are specs, not solutions. You build them.

## How this was assembled

This course was assembled, not written from scratch:

1. Five independent curriculum drafts were generated with LLM research assistants (two with ChatGPT, three with Claude) from the same brief: a first-principles course on building agents for an experienced engineer, primary sources only.
2. The author worked through the material, built the ten projects in Chapter 11, and kept reading notes.
3. In September 2026 the drafts, the project write-ups, and the notes were consolidated into one course with an LLM and then edited by hand. Duplicates were cut, disagreements between drafts were resolved and noted where they mattered, and every source was re-filtered.
4. Every URL was fetched and checked as live on 2026-09-09. Perishable facts (model IDs, prices, beta headers, versions) were re-verified against primary sources on that date and are marked with a `Snapshot 2026-09` callout.

**Source policy.** Only primary docs, papers, vendor engineering blogs, free courses, and practitioners who publish evidence. Paid-course promotion, listicles, vendor comparisons written by competitors, aggregators, social-media threads, and "follow these accounts" lists were cut. Chapter 13 states the rule and the categories that were removed so you can apply the same filter to new material.

## Keeping it current, and making it yours

The field moves monthly and this course is a snapshot. Two things to do before relying on it:

- **Bring it up to date.** Chapter 12 is a worked example of a quarterly "what changed" pass. Re-run that exercise for the months since September 2026, then re-verify each snapshot callout against the sources listed at the end of each chapter.
- **Personalize it.** The stack choices (Claude API, LangGraph, TypeScript and Python), the project ladder, and the reading order reflect one engineer's situation. The mental models hold across stacks; the specifics should be swapped. The fastest way is to hand the `content/course/` folder to a coding agent with your own constraints and have it propose edits. That is also a good first exercise in building *with* agents.

Contributions that update a snapshot callout, fix a dead link, or add a source that passes the Chapter 13 filter are welcome.

## Running the viewer

```sh
npm install
npm run dev
```

This launches an Express API on `http://127.0.0.1:3001` and a Vite dev server on `http://127.0.0.1:5173`, which opens in your browser. For a single-port production build:

```sh
npm run build
npm start
# → http://127.0.0.1:3001
```

**What it shows.** Top-level folders in `./content/` are treated as courses. Viewable extensions: `.md`, `.txt`, `.yaml`, `.yml`, `.py`, `.mmd`, `.json`, `.toml`, `.sh`, `.ts`, `.js`, plus extensionless plain text. Markdown renders with GFM tables, syntax-highlighted code, KaTeX math, and Mermaid diagrams. Drop in a new file or folder and it appears on the next sidebar refresh.

**Features.** Dark and light theme. Zoom (`⌘=` / `⌘−` / `⌘0`, or `Ctrl` on non-Mac). Fuzzy search across every document (`⌘K` / `Ctrl+K`), scoped to a folder if you like. Per-document "mark as read" with sidebar dots. Per-document markdown notes and per-heading anchor notes, saved to `.data/notes.json` inside this repo (gitignored). Scroll position persists per document.

**Configuration.** `CONTENT_ROOT` points the viewer at any content directory (default `./content/`). `PORT` sets the server port (default `3001`).

**Security posture.** A single-user local tool, but hardened: the server binds to `127.0.0.1` only; the file API uses an extension allowlist, path resolution, and a realpath check against `..` and symlink escapes; writes are limited to editing an existing allowlisted file inside the content root (the viewer's in-place editor) and to `.data/`; every request must carry a loopback `Host` and, if present, a loopback `Origin`, which blocks DNS-rebinding pages from reaching the API; note and progress payloads are schema-validated and size-capped; Helmet headers; no remote scripts (Mermaid, highlight.js, and KaTeX are bundled). No API keys are needed.

**Extending.** New course: `mkdir content/<name>` and drop files in. New file extension: add it to `ALLOWED_EXTENSIONS` in `server/tree.ts` and the language map in `src/lib/codeLang.ts`.

## License

MIT. See [LICENSE](LICENSE).
