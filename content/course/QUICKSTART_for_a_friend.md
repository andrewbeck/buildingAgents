# Building AI Agents — The Short Path

> A beginning-to-end outline for someone technical who has not built with agents yet. Roughly six weeks at five to ten hours a week. Every step is "read this, then build this." The long version of each step is a chapter in this folder, if you want it.

## The idea in one sentence

An agent is a language model in a loop with tools, given freedom to decide when it is done. Everything below is about how to build that loop, what to give it, how to keep it safe, and how to know if it works.

## Week 1 — What a model is, what an agent is

**Watch**
- Karpathy, *Intro to Large Language Models* (1 hr): https://www.youtube.com/watch?v=zjkBMFhNj_g
- Karpathy, *Deep Dive into LLMs like ChatGPT* (3 hr, optional but excellent): https://www.youtube.com/watch?v=7xTGNNLPyMI

**Read**
- Anthropic, *Building Effective Agents*. The single most important document. Read it twice: https://www.anthropic.com/engineering/building-effective-agents
- Simon Willison's definition of an agent: https://simonwillison.net/2025/Sep/18/agents/

**Know by the end:** the difference between a *workflow* (your code decides the next step) and an *agent* (the model decides). Most things called agents are workflows, and that is fine.

## Week 2 — Build the loop yourself

**Read**
- Anthropic tool-use docs, then the *Build a tool-using agent* tutorial (five short stages): https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Anthropic, *Writing tools for agents*: https://www.anthropic.com/engineering/writing-tools-for-agents

**Build**
- The five tutorial stages: one tool, then a loop, then several tools, then errors, then the SDK tool runner.
- Then a 100-line agent with three tools (calculator, search, save-to-file) and no framework. The code is in `04_the_loop.md`.

**Know by the end:** the loop is `while stop_reason == "tool_use"`, tool results go back in one message, and you always need a step cap and a token budget. Tool *descriptions* matter more than the system prompt.

## Week 3 — When to build one, and the patterns

**Read**
- OpenAI, *A Practical Guide to Building Agents* (PDF, short): https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- The LangGraph *Workflows and agents* page, which implements the five patterns from the Anthropic essay: https://docs.langchain.com/oss/javascript/langgraph/workflows-agents

**Build**
- The five workflow patterns (chaining, routing, parallel, orchestrator-workers, evaluator-optimizer), each in under 100 lines, in LangGraph or plain code.

**Know by the end:** the complexity ladder. Start at "one prompt," climb to "workflow," and only reach "agent" when the model must make decisions you could not script. Chapter `03_when_to_build.md` has the decision tree.

## Week 4 — A real agent, and its context

**Read**
- Anthropic, *Effective context engineering for AI agents*: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Lance Martin, *Context Engineering for Agents* (write / select / compress / isolate): https://rlancemartin.github.io/2025/06/23/context_engineering/

**Build**
- A research agent: given a question, it searches, reads, takes notes, and writes a cited report. Add a tool budget. Document the first way it fails.
- Then give it a `memory.md` it reads on start and writes to when it learns something.

**Know by the end:** "why is my agent being dumb" is answered by looking at what is actually in its context, not by rewriting the prompt.

## Week 5 — Evals and shipping

**Read**
- Hamel Husain, *Your AI Product Needs Evals*: https://hamel.dev/blog/posts/evals/
- Hamel Husain, *LLM-as-a-Judge*: https://hamel.dev/blog/posts/llm-judge/
- Simon Willison, *The lethal trifecta* (the one security idea to internalize): https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/

**Build**
- Read 30 traces from your research agent and write down what went wrong in each. Group them. That is error analysis, and it comes before any metric.
- Twenty test cases, pass/fail with a short critique. A judge model that agrees with you at least nine times in ten.
- Add tracing (LangSmith, Langfuse, or a JSON-lines log) and a kill switch.

**Know by the end:** an agent nobody evaluates drifts silently. Approval gates and permissions live in code, not in the prompt.

## Week 6 — Multi-agent, managed runtimes, and taste

**Read**
- Anthropic, *How we built our multi-agent research system*: https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition, *Don't Build Multi-Agents* (the counterargument): https://cognition.ai/blog/dont-build-multi-agents
- Anthropic, *Scaling Managed Agents* (what it looks like when the vendor runs the loop for you): https://www.anthropic.com/engineering/managed-agents

**Build**
- Only if your research agent has a real reason: a lead agent that spawns three parallel workers. Measure the token cost versus the single agent. Expect several times more.

**Know by the end:** default to one agent. Multi-agent only for parallel breadth or isolated context. By now you should have opinions.

## After that

- Keep current with two hours a week: the [Anthropic engineering blog](https://www.anthropic.com/engineering), the [MCP blog](https://blog.modelcontextprotocol.io/), [Simon Willison](https://simonwillison.net/tags/ai-agents/), Latent Space.
- Free book that covers the same ground from a framework author's view: Sam Bhagwat, *Principles of Building AI Agents*: https://mastra.ai/book
- Free courses if you want structure: LangChain Academy (LangGraph), Hugging Face Agents Course.
- The full course in this folder starts at `00_start_here.md`; the filtered reading list is `14_reading_list.md`.

## The three ideas that will still be true in five years

1. The simplest thing that works wins.
2. The loop is the agent; everything else is a wrapper.
3. Tools and memory are design decisions, not plumbing.
