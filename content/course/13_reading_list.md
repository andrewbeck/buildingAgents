# Annotated reading list

> This is the index for the whole course: every source the other chapters lean on, plus the papers, books, and free courses that earn their time. It was built by merging five earlier reading lists and the author's Project 7 literature review, then filtering hard. Kept: primary docs, papers, vendor engineering blogs, a short list of practitioners who publish evidence (Hamel Husain, Eugene Yan, Simon Willison, Lance Martin, Chip Huyen, Lilian Weng, Karpathy, Maggie Appleton, Geoffrey Litt), and courses that are free. Cut: paid bundles, bootcamps, listicles, vendor comparisons written by competitors, follow lists, and anything whose value is motivation rather than substance. After this chapter you know the nine things to read first, where each chapter's depth lives, and how to spend two hours a week without drowning.

Every entry gives what it teaches and when to read it. Years are publication years where known.

## If you only read nine things

This list is weighted toward production rather than introduction. If you have not yet built an agent, read the [short path](./QUICKSTART_for_a_friend.md) first; its reading list is the beginner's version of this one. Everything else in the chapter is depth on demand.

1. **Building Effective Agents** (Anthropic, Schluntz and Zhang, 2024). https://www.anthropic.com/engineering/building-effective-agents. The vocabulary the field uses. Re-read quarterly and notice which of its warnings you are currently ignoring.
2. **A Practical Guide to Building Agents** (OpenAI, 2025). https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf. The guardrails taxonomy and the three "when to build" criteria.
3. **Writing tools for agents** (Anthropic, 2025). https://www.anthropic.com/engineering/writing-tools-for-agents. Tool count and overlap degrade performance. Consolidate, namespace, return semantic identifiers, cap output.
4. **Effective context engineering for AI agents** (Anthropic, 2025) with **Context Engineering for Agents** (Lance Martin, 2025). URLs in the context tier. Principles and playbook for the same problem.
5. **How we built our multi-agent research system** (Anthropic, 2025) with **Don't Build Multi-Agents** (Cognition, 2025). They disagree. Hold both until your own token bill settles it.
6. **Effective harnesses for long-running agents** (Anthropic, 2025). https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents. The initializer plus worker pattern, and why the harness, not the model, owns durability.
7. **Your AI Product Needs Evals** and **LLM Evals FAQ** (Hamel Husain, 2024 and 2025). Error analysis first, evaluators second. Binary judgments over Likert scales.
8. **The Lethal Trifecta** (Simon Willison, 2025). https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/. Private data plus untrusted content plus an exfiltration path is an exploit, not a risk.
9. The full docs of the platform you commit to, end to end, not the quickstart. For the stack this course assumes, that is the Claude Agent SDK and LangGraph.

## Tier: mental models and history

Feeds [Mental models](./01_mental_models.md).

- **LLM Powered Autonomous Agents** (Lilian Weng, 2023). https://lilianweng.github.io/posts/2023-06-23-agent/
  Teaches: planning, memory, and tool use as three pillars, with the paper lineage under each. Read when: once, for vocabulary. Dated in specifics, still the cleanest map of where the ideas came from.
- **Agents** (Chip Huyen, 2025). https://huyenchip.com/2025/01/07/agents.html
  Teaches: tool inventory, planning granularity, reflection, and a catalog of failure modes in one essay. Read when: every six months. It reads differently each time because you have hit different failures.
- **Agents are models using tools in a loop** (Simon Willison, 2025). https://simonwillison.net/2025/Sep/18/agents/
  Teaches: the definition. Read when: someone starts arguing about the word.
- **Software Is Changing (Again)** (Andrej Karpathy, Y Combinator, 2025). https://www.youtube.com/watch?v=LCEmiRjPEtQ
  Teaches: Software 3.0, the autonomy slider, and why partial-autonomy apps with fast verification loops beat full autonomy. Read when: you want the frame behind [When to build](./02_when_to_build.md).
- **Squish Meets Structure** and **Language Model Sketchbook** (Maggie Appleton, 2023 and 2024). https://maggieappleton.com/squish-structure and https://maggieappleton.com/lm-sketchbook
  Teaches: expose the agent's procedural steps without overwhelming the user; "spell-check sized" models win in interfaces. Read when: designing what the user sees while the agent works.
- **Malleable software in the age of LLMs** (Geoffrey Litt, 2023). https://www.geoffreylitt.com/2023/03/25/llm-end-user-programming.html
  Teaches: "code like a surgeon": humans for judgment, agents for preparation and grunt work. Read when: deciding which steps stay human.
- **Artificial Intelligence: A Modern Approach**, chapter 2 (Russell and Norvig). The classical taxonomy: reflex, model-based, goal-based, utility-based, learning. One hour. Replaces the IBM "types of AI agents" explainer from earlier passes.
- **Levels of Autonomy for AI Agents** (Feng, McDonald, Zhang, 2025). Under papers. Autonomy is a design decision about the human's role, separable from capability.

## Tier: when to build

Feeds [When to build](./02_when_to_build.md).

- **Building Effective Agents** and its reference code: https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents. Each pattern is about 100 lines of Python. Run them before reading any framework's docs.
- **Workflows and agents** (LangChain docs). https://docs.langchain.com/oss/python/langgraph/workflows-agents
  Teaches: the five Anthropic patterns plus the agent, in LangGraph code. Read when: you want the patterns concrete.
- **Learning the Bitter Lesson** (Lance Martin, 2025). https://rlancemartin.github.io/2025/07/30/bitter_lesson/
  Teaches: hand-crafted workflow structure becomes a bottleneck as models improve; remove scaffolding aggressively. Read when: you are about to add a fourth node that a better prompt might handle.
- **Agent design patterns** (Lance Martin, 2026). https://rlancemartin.github.io/2026/01/09/agent_design/
  Teaches: the current pattern catalog from someone who has shipped both LangGraph and Managed Agents. Read when: after Bitter Lesson, as the constructive half.
- **How to think about agent frameworks** (Harrison Chase, LangChain, 2025). https://blog.langchain.com/how-to-think-about-agent-frameworks/
  Teaches: what a framework provides (durability, streaming, HITL) versus what is just abstraction. Read when: choosing or defending a framework.
- **Not All AI Agents Are Created Equal** (Farooq and Rajwani, Lenny's Newsletter, 2026). https://www.lennysnewsletter.com/p/not-all-ai-agents-are-created-equal
  Mentioned once, here, as the origin of the three-category framing (deterministic automation, ReAct agent, multi-agent) that [When to build](./02_when_to_build.md) uses. Partly paywalled; the free portion is enough.

## Tier: the loop and tools

Feeds [The loop](./03_the_loop.md) and [Tools and MCP](./05_tools_and_mcp.md).

- **Tool use overview** (Claude docs). https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
  Teaches: the substrate under every framework: schemas, `tool_use` and `tool_result` blocks, parallel calls, strict schemas. Read when: before any framework, and whenever a framework hides something you need.
- **Building agents with the Claude Agent SDK** (Anthropic, 2025). https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
  Teaches: gather-act-verify, and why filesystem plus bash is a general-purpose tool surface. Read when: deciding whether to write your own loop or inherit Claude Code's harness.
- **Claude Agent SDK overview** (docs). https://platform.claude.com/docs/en/agent-sdk/overview
  Teaches: permission modes, hooks, subagents, in-process MCP servers. Read when: you commit to it. The whole thing, not the quickstart.
- **OpenAI Agents SDK** (docs). https://openai.github.io/openai-agents-python/
  Teaches: the handoff-shaped mental model and the sandbox section. Read when: comparing against LangGraph's graph-shaped model. Thirty minutes if you are not adopting it.
- **Code Mode** (Cloudflare, 2025). https://blog.cloudflare.com/code-mode/
  Teaches: give the model a typed API and let it write code that calls many tools in a sandbox, instead of one tool call per turn. Read when: your tool count passes twenty or tool results flood context.
- **Claude Code: best practices for agentic coding** (Anthropic, 2025). https://www.anthropic.com/engineering/claude-code-best-practices and the living version: https://code.claude.com/docs/en/best-practices
  Teaches: how the best-known production loop is driven: CLAUDE.md, explore-plan-code-commit, verification targets. Read when: writing any instruction file for any agent.

## Tier: patterns

Feeds [Patterns](./04_patterns.md). The chapter is a commentary on the Building Effective Agents essay and cookbook, plus:

- **How We Build Effective Agents** (Barry Zhang, Anthropic, AI Engineer talk, 2025). https://www.youtube.com/watch?v=D7_ipDqhtwk
  Teaches: what the essay omits: "think like your agent," and the Q&A. Read when: after the essay, 25 minutes.
- **Agent design patterns** (Lance Martin) and **Workflows and agents** (LangChain), both above.

## Tier: context and memory

Feeds [Context and memory](./07_context_and_memory.md). This tier folds in the author's annotations from building Project 7, lightly edited and marked "Author's note."

- **Effective context engineering for AI agents** (Anthropic, 2025). https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  Teaches: context as an attention budget, context rot, and the compaction / structured note-taking / sub-agent triad. Author's note: the source for the "attention budget" and "context rot" vocabulary; the triad maps directly onto compress, write, and isolate. Re-read before any project where the context starts to bloat.
- **Context Engineering for Agents** (Lance Martin, 2025). https://rlancemartin.github.io/2025/06/23/context_engineering/ and the talk: https://www.youtube.com/watch?v=_IlTcWciEC4
  Teaches: write, select, compress, isolate, framed as an OS managing RAM. Author's note: the cleanest organizing metaphor for the space; Project 7's spec is literally these four buckets. His observation that Claude Code's flat CLAUDE.md plus filesystem beats semantic chunking and knowledge graphs on coding tasks is the strongest argument for the simple thing. Re-read before designing memory or sub-agent topologies. The talk covers the same claims as several popular videos on the topic, with evidence.
- **Context Engineering for AI Agents: Lessons from Building Manus** (Manus, 2025). https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus and Lance Martin's reading: https://rlancemartin.github.io/2025/10/15/manus/
  Teaches: KV-cache hit rate as the production metric, mask tools instead of removing them, filesystem as unlimited context, recitation via a todo file, keep failures in context. Read when: your agent runs past fifty turns.
- **Agent Skills overview** and **Skill authoring best practices** (Claude docs). https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview and https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  Teaches: progressive disclosure in three levels: name and description always loaded (about 100 tokens), SKILL.md body on trigger (under 5k), bundled files and scripts on demand where only script output enters context. Author's note: do not load skills eagerly; list `{name, description}` and let the agent call `load_skill`. Match degrees of freedom to task fragility. The description must work alone because it is all the model sees at startup. Re-read before adding any skill.
- **Equipping agents for the real world with Agent Skills** (Anthropic, 2025). https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
  Teaches: the Claude A authors, Claude B uses, observe, iterate loop. Author's note: the only authoring discipline that treats skills like code: evals first, observe real usage, iterate on observations not assumptions.
- **LangMem conceptual guide** (LangChain). https://langchain-ai.github.io/langmem/concepts/conceptual_guide/ and https://docs.langchain.com/oss/python/langchain/long-term-memory
  Teaches: the CoALA-derived split into working, episodic, semantic, and procedural memory, and hot-path versus background writes. Author's note: a flat memory.md collapses all four. The upgrade path is agents.md as procedural, memory.md as semantic, reports/ as episodic, the window as working memory. Use the taxonomy as a rubric: if a new feature is "all four," you are building a mess. Before any auto-write, ask hot path or background; they fail differently (latency versus drift).
- **State of AI Agent Memory 2026** (Mem0, 2026). https://mem0.ai/blog/state-of-ai-agent-memory-2026
  Teaches: the selective memory pipeline (extract, dedupe, embed, retrieve, async write), graph memory, rerankers, actor-aware tags. Author's note: don't build Mem0 in v1, but borrow the vocabulary; read when ready to graduate from a flat file. Caveat added here: it is a vendor's own benchmark. Keep the trade-off shape, not the numbers.
- **A Practical Guide to Memory for Autonomous LLM Agents** (Towards Data Science). https://towardsdatascience.com/a-practical-guide-to-memory-for-autonomous-llm-agents/
  Kept for one thing: four named failure modes. Summarization drift, semantic mismatch in retrieval, self-reinforcing errors, contradiction handling. Author's note: walk this list before assuming the model is dumb. Skip the rest.
- **Writing a good CLAUDE.md** (HumanLayer, 2025). https://www.humanlayer.dev/blog/writing-a-good-claude-md
  Teaches: under 300 lines, ideally 60; pointers not copies; never send an LLM to do a linter's job. Author's note: the default move when in doubt is "split into a file the agent reads on demand," not "add another paragraph." For every rule decide: permanent (agents.md), session preference (memory.md), or task workflow (a skill).
- **Memory paper list**. https://github.com/Shichun-Liu/Agent-Memory-Paper-List. The index when you need the paper behind a technique.
- **MemGPT** and **CoALA**, under papers. Read the MemGPT architecture diagram and the first half of CoALA before designing tiered memory.

## Tier: platforms and MCP

Feeds [Platforms](./10_platforms.md) and [Tools and MCP](./05_tools_and_mcp.md).

- **MCP specification** (2025-11-25 revision). https://modelcontextprotocol.io/specification/2025-11-25
  Teaches: JSON-RPC 2.0, three server primitives, two transports. Read when: before building or trusting any server. One hour.
- **MCP blog and 2026 roadmap**. https://blog.modelcontextprotocol.io/ and https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
  Teaches: where transport scaling, agent-to-agent, and enterprise auth are heading. Read when: monthly, new posts only.
- **MCP Inspector** and **registry**. https://modelcontextprotocol.io/docs/tools/inspector and https://github.com/modelcontextprotocol/registry
  Teaches: debug servers with no model in the loop; browse the registry as a corpus of good and bad tool design. Read when: building a server.
- **Introducing the Model Context Protocol** (Anthropic, 2024). https://www.anthropic.com/news/model-context-protocol. The N-by-M argument. Ten minutes, for explaining MCP to someone else.
- **Scaling Managed Agents: Decoupling the brain from the hands** (Anthropic, Lance Martin et al., 2026-04-08). https://www.anthropic.com/engineering/managed-agents
  Teaches: session (append-only event log), harness (cattle, can crash and wake), sandbox (credentials never reachable from inside). Harnesses encode assumptions about what the model cannot do, and those assumptions go stale. Read when: designing any loop you expect to outlive one model generation.
- **Managed Agents docs**. https://platform.claude.com/docs/en/managed-agents/overview
  Teaches: what you give up (harness control) for what you get (hosted loop, sandbox, compaction). Read when: deciding managed versus DIY for a product.

> **Snapshot 2026-09.** Managed Agents launched in beta in April 2026. Verify status and pricing before committing a product to it.

- **Cloudflare Agents SDK**. https://developers.cloudflare.com/agents/
  Teaches: one Durable Object per user or session as tenant isolation, hibernation, built-in approvals. Read when: you need per-tenant stateful agents at the edge.
- **LangGraph overview**. https://docs.langchain.com/oss/python/langgraph/overview
  Teaches: checkpointers, interrupts, time-travel debugging. Read when: re-read the persistence section before every production deploy.
- **Vercel AI SDK**. https://ai-sdk.dev/docs
  Teaches: streaming tool calls to a UI, typed message parts, tool approval. Read when: putting a TypeScript agent in front of users.

## Tier: evals

Feeds [Evals](./06_evals.md).

- **Your AI Product Needs Evals** (Hamel Husain, 2024). https://hamel.dev/blog/posts/evals/
  Teaches: three levels (unit assertions, human review, A/B) and the Rechat case study. Read when: first, before any tooling.
- **LLM Evals FAQ** (Husain and Shankar, 2025). https://hamel.dev/blog/posts/evals-faq/
  Teaches: how many examples, binary versus Likert, who is the arbiter, when to automate. Read when: right after the first one.
- **LLM-as-a-Judge** and **Field Guide to Rapidly Improving AI Products** (Hamel Husain, 2024 and 2025). https://hamel.dev/blog/posts/llm-judge/ and https://hamel.dev/blog/posts/field-guide/
  Teaches: calibrate the judge against one domain expert's binary labels before trusting it; 60 to 80 percent of dev time is error analysis. Read when: about to add a judge, or when evals exist but the product is not improving.
- **Eval tools comparison** (Hamel Husain, 2025). https://hamel.dev/blog/posts/eval-tools/
  Teaches: no tool wins on every axis. The one honest comparison. Read when: picking a vendor.
- **Task-Specific LLM Evals That Do and Don't Work**, **Evaluating LLM-Evaluators**, **An LLM-as-Judge Won't Save the Product** (Eugene Yan, 2024 to 2025). https://eugeneyan.com/writing/evals/ · https://eugeneyan.com/writing/llm-evaluators/ · https://eugeneyan.com/writing/eval-process/
  Teaches: per-task eval design, judges have to be evaluated too, process beats tooling. Read when: your judge disagrees with you and you are not sure who is wrong.
- **Demystifying evals for AI agents** (Anthropic, 2026). https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
  Teaches: agent evals are trajectory evals, not output evals: tool sequences, state, cost. Read when: moving from single-turn to agent evals.
- **Evaluating Deep Agents** and **How we build evals for Deep Agents** (LangChain, 2025). https://blog.langchain.com/evaluating-deep-agents-our-learnings/ and https://blog.langchain.com/how-we-build-evals-for-deep-agents/
  Teaches: how a team that ships long-horizon agents grades them. Read when: your agent runs more than ten tool calls per task.
- **OpenTelemetry GenAI semantic conventions**. https://opentelemetry.io/docs/specs/semconv/gen-ai/
  Teaches: vendor-neutral trace shape, so you can change observability vendors without re-instrumenting. Read when: instrumenting.
- **Langfuse** or **LangSmith** docs. https://langfuse.com/ and https://docs.smith.langchain.com/. Pick one: Langfuse for open source and self-hosting, LangSmith if all-in on LangGraph.
- **tau-bench**, **SWE-bench**, **WebArena**, under papers. Read the task design, not the leaderboards.

## Tier: production and security

Feeds [Production](./08_production.md).

- **The Lethal Trifecta** (Simon Willison, 2025). In the nine. Follow with CaMeL: https://simonwillison.net/2025/Apr/11/camel/ (the one architectural mitigation with a real design behind it) and his running tag: https://simonwillison.net/tags/ai-agents/
- **How we contain Claude across products** (Anthropic, 2026-05-25). https://www.anthropic.com/engineering/how-we-contain-claude
  Teaches: the containment model across Claude Code, Managed Agents, and computer use: what runs where, what the model can reach, and how boundaries are enforced rather than prompted. Read when: designing any sandbox or permission boundary. Pair with the credential vaulting section of Scaling Managed Agents.
- **Prompt injection defenses** (Anthropic). https://www.anthropic.com/news/prompt-injection-defenses
  Teaches: what model-side defenses do and, more usefully, what they do not cover. Read when: you catch yourself relying on the model to refuse.
- **OWASP Top 10 for LLM Applications**. https://owasp.org/www-project-top-10-for-large-language-model-applications/
  Teaches: shared threat-model vocabulary. Read when: someone from security asks for a checklist.
- **Prompt caching** (Claude docs). https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  Teaches: breakpoints at stable prefix boundaries, dynamic content as tail. Read when: cost per task is dominated by re-sent system prompts and tool schemas. The ProjectDiscovery case study (https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching) shows breakpoint placement with real numbers.

## Tier: multi-agent and long-running

Feeds [Multi-agent](./09_multi_agent.md).

- **How we built our multi-agent research system** (Anthropic, 2025). https://www.anthropic.com/engineering/multi-agent-research-system
  Teaches: orchestrator-worker with a lead on the strongest model and parallel workers, and the number that matters: about 15 times the tokens of a chat. Read when: you are about to build a second agent.
- **Don't Build Multi-Agents** (Cognition, 2025). https://cognition.ai/blog/dont-build-multi-agents
  Teaches: share full context; actions carry implicit decisions that conflict when made in parallel. Read when: immediately after the Anthropic piece. The reconciliation: parallelize read-only work, serialize writes.
- **Benchmarking Multi-Agent Architectures** (LangChain, 2025). https://blog.langchain.com/benchmarking-multi-agent-architectures/
  Teaches: measured numbers for supervisor versus swarm versus single agent. Read when: choosing a topology and you want data instead of opinions.
- **Open Deep Research** (LangChain, 2025). https://blog.langchain.com/open-deep-research/
  Teaches: an open orchestrator-worker research agent with the design choices explained. Read when: comparing against your own Project 9.
- **Introducing Ambient Agents** (LangChain, 2025). https://blog.langchain.com/introducing-ambient-agents/
  Teaches: agents triggered by events instead of chat, with human-in-the-loop as the core primitive. Read when: building anything that runs unattended.
- **Harness design for long-running application development** (Anthropic, 2026-03). https://www.anthropic.com/engineering/harness-design-long-running-apps
  Teaches: the follow-up to the harnesses post, applied to multi-session builds: how state, verification, and hand-off between context windows are structured. Read when: any task will outlive one context window.
- **Effective harnesses for long-running agents** and **Scaling Managed Agents**, both above. The session, harness, sandbox split is the long-running architecture.

## Tier: coding, computer-use, and browser agents

Feeds [Projects](./11_projects.md) and [What's new 2026](./12_whats_new_2026.md).

- **Claude Code docs**. https://code.claude.com/docs/
  Teaches: hooks, permissions, subagents, MCP configuration, and hard-won design about file operations and command execution. Read when: even if you never build a coding agent; it is the reference harness.
- **Harness engineering for coding agent users** (Thoughtworks, on martinfowler.com, 2026-04). https://martinfowler.com/articles/harness-engineering.html
  Teaches: the scaffolding around a coding agent (instructions, verification, guardrails, feedback loops) as an engineering artifact in its own right. Read when: your CLAUDE.md, hooks, and CI have grown into a system and nobody owns it.
- **SWE-agent** and **mini-SWE-agent** (Princeton). https://github.com/swe-agent/swe-agent and https://github.com/SWE-agent/mini-swe-agent
  Teaches: the agent-computer interface matters as much as the model; the mini version shows how little loop you need. Read when: writing your own coding loop. Read the mini version's source.
- **SWE-bench**. https://www.swebench.com/original.html. What a realistic coding eval looks like. Read when: designing evals for projects that touch code.
- **Computer use tool** (Claude docs) and reference demo. https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool and https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo
  Teaches: screenshot-act loops and why they are slow. Read when: a task has no API and no DOM.
- **agent-browser** (Vercel Labs). https://github.com/vercel-labs/agent-browser
  Teaches: separating the agent's reasoning from browser actions behind a CLI. Read when: building a browser agent without screenshot-driven loops.
- **How we contain Claude across products**, above. Read it before you let a browser agent log into anything. It is the vetted answer to "can an agent safely be logging in places at scale."

## Papers

Read abstract, intro, figures, conclusion. Decide whether to go deeper afterward.

| Paper | Link | Why it is on the list |
|---|---|---|
| Chain-of-Thought Prompting (Wei et al., 2022) | https://arxiv.org/abs/2201.11903 | The reasoning half of reason-and-act. |
| ReAct (Yao et al., 2022) | https://arxiv.org/abs/2210.03629 | Thought, action, observation. Every tool loop is this. Read the prompt examples. |
| Toolformer (Schick et al., 2023) | https://arxiv.org/abs/2302.04761 | Tools as something the model invokes mid-generation. The training approach lost; the framing won. |
| Reflexion (Shinn et al., 2023) | https://arxiv.org/abs/2303.11366 | Verbal self-critique and retry. Ancestor of evaluator-optimizer. |
| Generative Agents (Park et al., 2023) | https://arxiv.org/abs/2304.03442 | Episodic memory plus reflection plus planning at scale. The memory stream is still copied. |
| Tree of Thoughts (Yao et al., 2023) | https://arxiv.org/abs/2305.10601 | Search over partial solutions, when you can score partial states. |
| Voyager (Wang et al., 2023) | https://arxiv.org/abs/2305.16291 | A skill library that grows over time, indexed by description. Skills by another name. |
| WebArena (Zhou et al., 2023) | https://arxiv.org/abs/2307.13854 | Realistic web tasks are much harder than demos. |
| CoALA (Sumers et al., 2023) | https://arxiv.org/abs/2309.02427 | Working, episodic, semantic, procedural memory; the decision cycle. Project 7's vocabulary. |
| SWE-bench (Jimenez et al., 2023) | https://arxiv.org/abs/2310.06770 | How coding tasks and grading were constructed. |
| MemGPT (Packer et al., 2023) | https://arxiv.org/abs/2310.08560 | The OS-paging metaphor: main context versus external storage, model-managed. Look at the architecture diagram. |
| SWE-agent (Yang et al., 2024) | https://arxiv.org/abs/2405.15793 | The agent-computer interface as a design variable. |
| tau-bench (Yao et al., Sierra, 2024) | https://arxiv.org/abs/2406.12045 and https://github.com/sierra-research/tau-bench | Simulated user plus pass^k reliability. The right shape for customer-facing agent evals. |
| Levels of Autonomy for AI Agents (Feng, McDonald, Zhang, 2025) | https://arxiv.org/abs/2506.12469 | Five levels by the human's role: operator, collaborator, consultant, approver, observer. Skim the policy half. |

## Books

- **AI Engineering** (Chip Huyen, O'Reilly, 2025). https://www.oreilly.com/library/view/ai-engineering/9781098166298/
  Teaches: evaluation methodology, RAG and agents, fine-tuning decisions, inference optimization, as one stack. Read when: you want one book that ties the blog posts together. Foundational; the specifics age.
- **Build a Large Language Model (From Scratch)** (Sebastian Raschka, Manning, 2024). https://www.manning.com/books/build-a-large-language-model-from-scratch and https://github.com/rasbt/LLMs-from-scratch
  Teaches: what the model does with your tokens. Read when: you want the intuition behind context limits, attention cost, and "lost in the middle." Pair with Karpathy's videos.
- **Evals for AI Engineers** (Husain and Shankar, O'Reilly, in progress). Search the title; the free companion is https://hamel.dev/blog/posts/evals-faq/
  Teaches: the eval process end to end. Read when: the blog posts left gaps. They cover most of it for free.
- **Principles of Building AI Agents** and **Patterns for Building AI Agents** (Sam Bhagwat, Mastra, free). https://mastra.ai/book
  Teaches: a practitioner's tour of models, tools, memory, workflows, RAG, and evals from the TypeScript side. Read when: you want a short, opinionated companion to the Anthropic essays. Mastra-flavored, not Mastra-dependent.

## Free courses and video

Only free material. The paid equivalents were checked and offer the same content plus a cohort.

- **Neural Networks: Zero to Hero** (Andrej Karpathy). https://karpathy.ai/zero-to-hero.html
  Teaches: backprop to GPT, in code, from nothing. Read when: you want to understand the model rather than the API. Prioritize "Let's build GPT": https://www.youtube.com/watch?v=kCc8FmEb1nY
- **Intro to Large Language Models** (Karpathy, 2023). https://www.youtube.com/watch?v=zjkBMFhNj_g
  Teaches: the one-hour mental model, including the "LLM OS" frame. Read when: a colleague needs the field in an hour.
- **Deep Dive into LLMs like ChatGPT** (Karpathy, 2025). https://www.youtube.com/watch?v=7xTGNNLPyMI
  Teaches: pretraining, post-training, RLHF, hallucination, tool use, and why models behave as they do. Read when: after the intro. Three and a half hours, worth all of it.
- **LangChain Academy** (free). https://academy.langchain.com/
  Teaches: LangGraph in depth, ambient agents, deep agents, deep research, by the team that wrote them. Read when: the module matches the project you are on.
- **Hugging Face Agents Course** (free). https://huggingface.co/learn/agents-course
  Teaches: fundamentals, smolagents (code-as-action), LlamaIndex, LangGraph, with a final eval. Read when: you want the code-agent paradigm contrasted with JSON tool calling. Unit 1 and the smolagents unit.
- **DeepLearning.AI short courses** (free). AI Agents in LangGraph: https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/ · Long-Term Agentic Memory with LangGraph: https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/ · Building Code Agents with smolagents: https://www.deeplearning.ai/short-courses/building-code-agents-with-hugging-face-smolagents/ · Claude Code: https://www.deeplearning.ai/short-courses/claude-code-a-highly-agentic-coding-assistant/ · Agentic AI (Ng): https://learn.deeplearning.ai/courses/agentic-ai/
  One to two hours each, code included. Read when: you want a guided build of something you have read about. The memory course pairs with Project 7.
- **Anthropic Academy** (free). https://anthropic.skilljar.com
  Teaches: Claude API, MCP intro and advanced, Claude Code skills. Read when: you want the vendor's walkthrough before the docs.
- **AI Engineer conference channel**. https://www.youtube.com/@aidotengineer
  Start with Barry Zhang (above), Lance Martin on context engineering and deep research, Hamel Husain on evals. One talk a month, chosen by author.
- **Latent Space**. https://www.latent.space/
  Long-form interviews with the people who wrote the sources above. Read when: an episode features an author already on this list.

## How to keep current

Two hours a week. The point of the routine is the skip rule at the end.

| Slot | Time | What |
|---|---|---|
| 1 | 30 min | New posts only on https://www.anthropic.com/engineering, https://blog.langchain.com, https://blog.modelcontextprotocol.io/. Skip if nothing is new. |
| 2 | 30 min | https://simonwillison.net/tags/ai-agents/ as the filter for everything else. He reads the firehose so you do not have to. |
| 3 | 30 min | One paper, abstract and figures only, cited by something in slot 1 or 2. Only if it names a pattern you could use. |
| 4 | 30 min | Re-read one of the nine against the code of one of your projects. Write one paragraph in that project's notes on what you would change. |

Every other week, swap slot 3 for one Latent Space episode or one AI Engineer talk, chosen by author.

> **Snapshot 2026-09.** Once a month, spend slot 1 on the Claude platform changelog and model release notes instead. Model IDs, pricing, and beta headers in this course go stale; the changelog is where you refresh them.

Skip rule: if the source is selling a course, a tool, a subscription, or a follow, it gets none of the two hours. If it is a summary of a source on this list, read the source.

## What was cut and why

The earlier drafts of this list contained a fair amount of this material. It was removed by category rather than by judging individual authors; the categories are listed so you can apply the same filter to whatever you find next.

| Cut | Why |
|---|---|
| Paid prompt packs, bundles, and "mastery" products | Marketing with first-party testimonials. The vendor docs and the free courses above cover the content. |
| Paid bootcamps and cohort courses | Where the instructors publish evidence, their free writing is on this list. The paid value is the cohort, not the content. |
| Subscription tutorial platforms | Tutorials that track the docs with a lag. Read the docs. |
| Business and monetization framing videos by non-engineers | No evidence, no transcript. Lance Martin's talk covers the same claims with data. |
| "Best tools 2026" listicles published by a vendor on the list | Comparisons that rank the vendor. Hamel's eval-tools comparison is the honest version. |
| Framework comparisons written by competing frameworks | Same problem. Use Harrison Chase's post, then the docs. |
| Subreddits | Useful for "what is annoying this week," useless as a reading list. |
| "Follow these accounts" lists | Following is not reading. The people who publish evidence are here by URL. |
| Playlists, "N lessons" threads, rule collections, and cheat sheets | Secondary summaries of primary sources listed here. |
| Course-vendor and consultancy posts on CLAUDE.md, pricing, and similar | Marketing. HumanLayer and the Claude Code docs cover it. |
| Corporate "types of AI agents" explainers | Vocabulary. Russell and Norvig chapter 2 does it properly. |
| Daily AI newsletters and aggregators | Volume without filter. Simon Willison is the filter. |
| "Agent in 5 minutes" posts and pre-2024 framework tutorials | Thin wrappers over deprecated APIs. |
| AutoGen, MetaGPT, ChatDev, AutoGPT, BabyAGI | Historical. Worth knowing why naive autonomy loops failed; not worth reading. |
| Social-media threads and posts | Not fetchable, not citable, not durable. If one holds up, the primary source it points at belongs here instead. |

## Checkpoint

- You can name the nine and say in one sentence what each changed about your design.
- For any chapter in this course, you can point at the two or three sources it is a commentary on.
- Given a new blog post about agents, you can classify it in under a minute: primary source, evidence-bearing practitioner, or motivation.
- You can explain the four memory kinds and hot-path versus background writes without opening your notes.
- You can say why Anthropic's multi-agent post and Cognition's post are both right, and what the reconciling rule is.
- You have a two-hour weekly slot on the calendar and a skip rule you apply.

## Adding to this list

A new source earns a row when it is primary (docs, a paper, a vendor's own engineering post) or comes from a practitioner who publishes evidence, and when you can write its "teaches" and "read when" lines without reaching. If you cannot, it is motivation, and motivation goes in the cut table. Date your additions; the list is a snapshot.

## Sources

This chapter is its own source list. Filtering decisions were made against five earlier generated reading lists and the author's annotated literature review from Project 7. Every URL above was fetched and returned a live page on 2026-09-09, except the O'Reilly book page, which blocks automated requests.
