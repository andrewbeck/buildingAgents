# 03 — The Loop

> Build the agent loop from scratch, on the raw Messages API, with no framework. Then see the same loop in the SDK's tool runner. After this chapter you can write a working agent from memory, explain every line, and recognize the loop inside any framework you open.

The single best predictor of whether someone can debug an agent in production is whether they can write the loop without looking it up. Projects 0, 1, and 2 in [Chapter 11](./11_projects.md) are where you do it. This chapter is the current-API version of that loop, including the parts that are wrong or missing in most tutorial code.

## Build

- [Project 0](./11_projects.md#project-0--the-rings): the tutorial as five scripts, one per ring. Do it before reading past "The four ideas" if you have not already.
- [Project 1](./11_projects.md#project-1--hello-agent): the manual loop with two tools, no framework. The from-scratch agent in this chapter is the reference implementation.
- [Project 2](./11_projects.md#project-2--thinking-agent): trace log, token budget, and an effort-level A/B. Exercises 3 to 6 below are the steps that turn Project 1 into Project 2.

## Read

Read first:

- **Tool use overview** (Claude docs). The substrate: schemas, `tool_use` and `tool_result` blocks, parallel calls, stop reasons.
- **Building agents with the Claude Agent SDK** (Anthropic, 2025). Gather, act, verify, and why filesystem plus bash is a general tool surface.

Read after: **Claude Agent SDK overview** once you commit to it, and **Code Mode** (Cloudflare) when tool count or tool output starts to crowd the window. Both in the [the loop and tools tier](./13_reading_list.md#tier-the-loop-and-tools).

## The four ideas

### 1. A tool is three things

A JSON schema the model reads to decide *whether* to call it and *with what*, a callable that runs when it does, and a description. The description is the most important prompt engineering in a tool-using agent. Bad descriptions cause most bad tool calls, far more than bad system prompts.

Rules that hold:

- Name tools as verbs: `search_database`, `create_calendar_event`. Verbs encode action.
- The description answers "when should I use this?" more than "what does this do?"
- Constrain the schema: required fields, enums, types. Fewer degrees of freedom, fewer hallucinated calls.
- Say briefly what the tool returns.
- Do not repeat tool instructions in the system prompt. Duplication drifts.

[Chapter 05](./05_tools_and_mcp.md) goes deep on tool design. Here we just need enough to run the loop.

### 2. The loop is a while-loop with three exits

```
LOOP:
    response = model(messages, tools)

    if response.stop_reason is not "tool_use":
        return the text            # model finished, refused, or hit a limit

    execute every tool_use block
    append assistant message (as-is) and a user message of tool_results
    continue

    if steps or tokens exceed budget:
        return "did not converge"
```

That is the whole agent. Every framework is a wrapper around it. The crucial detail: append the assistant's content **unchanged** (the model needs to see what it said, and on current models the thinking blocks must round-trip untouched), then append one user message containing every tool result for that turn, keyed by `tool_use_id`.

### 3. Stopping conditions matter more than starting conditions

The model's "I'm done" is a learned behavior, not a guarantee. Always have a programmatic cap. For production add a token budget, a wall-clock timeout, and where possible a task-specific check ("does the output file exist and validate?"). Much tutorial code, including the first draft of this chapter, checks only for `end_turn`, which meant a `max_tokens` or `refusal` stop fell through into an empty user message and an API error. Branch on `tool_use`, not on `end_turn`.

### 4. Tool errors are signals, not failures

Return the error *as the tool result*, flagged with `is_error: true`. The model is good at recovering when it can see what went wrong. Swallowing errors, or crashing on them, are the two ways to make an agent stall.

## The from-scratch agent (Python, current API)

```python
"""
A working tool-using agent on the raw Messages API. No framework.
pip install anthropic   (1.x)
export ANTHROPIC_API_KEY=...   or run `ant auth login`
"""
from __future__ import annotations
import ast, json, operator
from typing import Any, Callable
from anthropic import Anthropic

client = Anthropic()

# --- tools -----------------------------------------------------------------

_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
        ast.Div: operator.truediv, ast.USub: operator.neg}

def _safe_eval(node):
    # AST whitelist instead of eval(): no names, no calls, no ** (which can hang).
    if isinstance(node, ast.Expression): return _safe_eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)): return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_safe_eval(node.operand))
    raise ValueError("unsupported expression")

def calculator(args: dict[str, Any]) -> str:
    expr = args["expression"]
    return f"{expr} = {_safe_eval(ast.parse(expr, mode='eval'))}"

def web_search(args: dict[str, Any]) -> str:
    # Fake, for reproducibility. Swap in a real search API or use the
    # server-side web_search tool (see below).
    canned = {
        "anthropic headquarters": "Anthropic is headquartered in San Francisco, California.",
        "san francisco paris distance": "San Francisco to Paris is approximately 5,580 miles.",
        "miles km": "1 mile = 1.609 kilometers.",
    }
    q = args["query"].lower()
    for key, val in canned.items():
        if all(w in q for w in key.split()):
            return val
    return f"No results for {args['query']!r}. Try a different query."

def save_to_file(args: dict[str, Any]) -> str:
    path, content = args["path"], args["content"]
    if "/" in path or "\\" in path or path.startswith("."):
        return f"Error: {path!r} not allowed (filename only)."
    with open(path, "w") as f:
        f.write(content)
    return f"Wrote {len(content)} chars to {path}."

TOOLS: dict[str, dict] = {
    "calculator": {
        "function": calculator,
        "schema": {
            "name": "calculator",
            "description": "Evaluate an arithmetic expression (+ - * / and parentheses). "
                           "Use for any numeric computation. Returns the result as text.",
            "input_schema": {
                "type": "object",
                "properties": {"expression": {"type": "string",
                               "description": "e.g. '5580 * 1.609'"}},
                "required": ["expression"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
    "web_search": {
        "function": web_search,
        "schema": {
            "name": "web_search",
            "description": "Search the web for facts you do not already have: locations, "
                           "distances, current information. Returns a short snippet.",
            "input_schema": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
    "save_to_file": {
        "function": save_to_file,
        "schema": {
            "name": "save_to_file",
            "description": "Save text to a file in the working directory. Use this as the "
                           "FINAL step, once you have the complete answer.",
            "input_schema": {
                "type": "object",
                "properties": {"path": {"type": "string", "description": "Filename only."},
                               "content": {"type": "string"}},
                "required": ["path", "content"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
}

# --- the loop ---------------------------------------------------------------

def run_agent(task: str, system: str, *, model: str = "claude-opus-5",
              max_steps: int = 10, token_budget: int = 300_000,
              verbose: bool = True) -> str:
    messages: list[dict] = [{"role": "user", "content": task}]
    tool_defs = [t["schema"] for t in TOOLS.values()]
    spent = 0

    for step in range(max_steps):
        response = client.messages.create(
            model=model,
            max_tokens=16_000,
            system=system,
            tools=tool_defs,
            messages=messages,
            thinking={"type": "adaptive"},
            output_config={"effort": "medium"},
        )
        spent += response.usage.input_tokens + response.usage.output_tokens
        if verbose:
            print(f"--- step {step+1}  stop={response.stop_reason}  tokens={spent}")

        # Always echo the assistant turn back unchanged (thinking blocks included).
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "refusal":
            cat = response.stop_details.category if response.stop_details else "unknown"
            return f"(refused: {cat})"

        if response.stop_reason != "tool_use":
            # end_turn, max_tokens, stop_sequence, pause_turn, ...
            text = "".join(b.text for b in response.content if b.type == "text")
            return text or f"(stopped: {response.stop_reason})"

        results: list[dict] = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            if verbose:
                print(f"  {block.name}({json.dumps(block.input)})")
            try:
                out = TOOLS[block.name]["function"](block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": out})
            except Exception as e:  # noqa: BLE001
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": f"Error: {e}", "is_error": True})
        # All tool results for the turn go back in ONE user message.
        messages.append({"role": "user", "content": results})

        if spent > token_budget:
            return f"(token budget {token_budget} exceeded at step {step+1})"

    return f"(did not finish in {max_steps} steps)"


SYSTEM = """You are a careful, methodical assistant with tools.
Work step by step: identify what you need, use a tool to get it, reason about
the result, then continue. When you have the complete answer, save it with
save_to_file. If a tool returns an error, try a different approach rather than
repeating the same call."""

TASK = """Find the city where Anthropic is headquartered, look up the distance
from that city to Paris in miles, convert it to kilometers, and save a summary
(city, miles, km) to result.txt."""

if __name__ == "__main__":
    print(run_agent(TASK, SYSTEM))
```

What differs from typical tutorial code, and why each matters:

| Change | Why |
|---|---|
| Branch on `stop_reason != "tool_use"` | `end_turn` is not the only non-tool stop. `max_tokens`, `refusal`, `stop_sequence`, and `pause_turn` all exist. |
| Handle `refusal` explicitly | Current models return HTTP 200 with `stop_reason: "refusal"` and a `stop_details.category`. Check it before reading content. |
| Append the assistant turn *before* branching | Keeps the transcript valid on every exit path and keeps thinking blocks intact for the next call. |
| `is_error: true` on failed tools | The API and the model treat flagged errors differently from normal results. |
| `strict: true` plus `additionalProperties: false` | Guarantees `tool_use.input` validates against the schema. No more missing-key crashes. |
| AST calculator, no `eval` | `eval` with a character whitelist still allows `9**9**9**9`, which hangs. |
| `thinking: {type: "adaptive"}` and `output_config.effort` | The current thinking API. `budget_tokens` is rejected on Opus 5 and Sonnet 5. |
| No `temperature` | Sampling parameters return a 400 on Opus 5, Sonnet 5, and Opus 4.7 and later. Older framework examples pass `temperature: 0` everywhere; that is a landmine when you bump model IDs. |
| Token budget as well as step budget | Steps are a bad proxy for cost when tool results vary in size. |

> **Snapshot 2026-09.** Model IDs: `claude-opus-5` (default for serious work), `claude-sonnet-5` (cheaper, faster), `claude-haiku-4-5` (cheapest, no `effort` support, still takes `budget_tokens`), `claude-fable-5-1` (most capable; thinking always on; forced `tool_choice` returns 400). Never append date suffixes. If you write Opus 5 or Fable 5.1 code for production, add the server-side `fallbacks` parameter so a refusal routes to a fallback model instead of failing the turn.

## Parallel tool calls

One assistant message can contain several `tool_use` blocks. Execute them (concurrently if they are independent) and return **all** results in a **single** user message. Splitting them across messages silently teaches the model to stop making parallel calls. The loop above already does this. Ring 3 of Anthropic's tutorial (Project 0) is exactly this lesson.

## The same loop with the SDK tool runner

Once you understand the loop, stop hand-writing it. The Anthropic SDK's tool runner drives the request → execute → loop cycle for tools you define, and gives you per-turn hooks for approval gates, logging, and result modification. This is Ring 5.

Python:

```python
from anthropic import Anthropic, beta_tool

client = Anthropic()

@beta_tool
def calculator(expression: str) -> str:
    """Evaluate an arithmetic expression such as '5580 * 1.609'.

    Args:
        expression: The expression. Supports + - * / and parentheses.
    """
    return f"{expression} = {_safe_eval(ast.parse(expression, mode='eval'))}"

runner = client.beta.messages.tool_runner(
    model="claude-opus-5",
    max_tokens=16_000,
    tools=[calculator, web_search, save_to_file],
    messages=[{"role": "user", "content": TASK}],
    thinking={"type": "adaptive"},
)
final = runner.until_done()
print("".join(b.text for b in final.content if b.type == "text"))
```

TypeScript:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const client = new Anthropic();

const calculator = betaZodTool({
  name: "calculator",
  description: "Evaluate an arithmetic expression such as '5580 * 1.609'.",
  inputSchema: z.object({ expression: z.string() }),
  run: async ({ expression }) => safeEval(expression),
});

const runner = client.beta.messages.toolRunner({
  model: "claude-opus-5",
  max_tokens: 16_000,
  tools: [calculator, webSearch, saveToFile],
  messages: [{ role: "user", content: TASK }],
  thinking: { type: "adaptive" },
});
const final = await runner;
```

The docstring (Python) or `description` (TypeScript) becomes the tool description. The type hints or Zod schema become the input schema. You lose nothing you had in the manual loop and gain hooks, streaming, retries, and compaction support.

**Tool runner is not the Claude Agent SDK.** The tool runner is a thin helper inside the regular API SDK: your tools, your hosting, no built-in tools. The Claude Agent SDK is Claude Code packaged as a library: built-in file, bash, grep, and web tools, subagents, hooks, permissions, sessions. Both are harness-only; you still deploy them. [Chapter 10](./10_platforms.md).

## What the API now does for you

Several things that used to require hand-rolling are now request parameters. You do not need them for the tutorial, but you should know they exist before you write a harness feature the API already has.

| Need | API feature |
|---|---|
| Real web search and page fetching | Server-side `web_search_20260209` and `web_fetch_20260209` tools. Declare in `tools`; results come back as content blocks. No client execution. |
| Run code in a sandbox | Server-side `code_execution_20260521`. |
| Compose many tool calls without round trips | Programmatic tool calling: the model writes a script that calls your tools from inside code execution; only the final output returns to context. |
| JSON output that validates | `output_config.format` (structured outputs), or `client.messages.parse()`. Prefill is gone on current models. |
| Long conversations past the window | Server-side compaction (beta `compact-2026-01-12`). Append `response.content` back every turn or you lose the compaction state. |
| Clear stale tool results without summarizing | Context editing (beta `context-management-2025-06-27`). |
| Cross-session memory | The `memory_20250818` tool; you implement the storage. |
| Pace a long agentic turn | Task budgets (beta): a token ceiling the model can see, distinct from `max_tokens`. |
| Cheaper repeated prefixes | Prompt caching. Stable content first, `cache_control` breakpoints, verify with `usage.cache_read_input_tokens`. |
| Many tools, few relevant per request | Tool search: mark tools `defer_loading: true`, the model loads schemas on demand. |

> **Snapshot 2026-09.** Server tools that reach `pause_turn` (long searches) need the loop to resend the conversation and continue; the manual loop above returns on any non-`tool_use` stop, so extend it if you add server tools. Beta headers change; check the release notes before shipping.

## The rings, as a progression

Anthropic's "build a tool-using agent" tutorial, worked as five separate scripts (Project 0), is the cleanest ladder for the loop:

1. **One tool, one turn.** A nested JSON-schema tool and a manual `tool_result` round trip.
2. **The loop.** `while stop_reason == "tool_use"`.
3. **Multiple tools, parallel calls.** All results back in one user message.
4. **Error handling.** `is_error: true`.
5. **The tool runner.** `@beta_tool` plus `until_done()`.

Re-run them with `claude-opus-5` and without `temperature`. That is a twenty-minute refresher and it will surface every API drift since the tutorial was written.

## Exercises

Do at least the first six. They are the actual learning. Each one is tagged with the project it feeds; the untagged ones stand alone.

1. Run the agent. Count the model calls. That is your intuition for agent cost. *(Project 1)*
2. Make `web_search` lie ("Anthropic is headquartered on Mars"). Watch what the agent does. Agents are bottlenecked by ground truth from their environment. *(Project 1)*
3. Add `read_from_file` and a task that needs it. *(Project 2)*
4. Add a programmatic stopping check: after each step, if `result.txt` exists and validates, stop early. Compare with trusting the model. *(Project 2)*
5. Replace prints with JSON-lines logging: step, tool, input, output, latency, tokens. That is a trace log, the foundation of observability. *(Project 2)*
6. Enforce the token budget from `response.usage` instead of the step count. Then set `output_config.effort` to `low` and `high` and compare tokens and quality. *(Project 2)*
7. Convert to streaming with `client.messages.stream()`.
8. Add a `before_tool` hook that can veto a call. That is the seed of permissions and human-in-the-loop. Then do the same with the tool runner's per-turn hook and notice how much less code it is. *(Project 3)*
9. Make the agent able to call itself as a tool: `delegate(task)` spawns a fresh loop with its own context. Multi-agent in thirty lines. *(preview of Project 9)*
10. Rewrite the loop against the OpenAI Responses API. Same loop, different message shapes. The difference between providers at this layer is thin.

## Common mistakes

**"It loops forever."** No step cap, or the model keeps making calls that do not make progress (hallucinated tool names, repeated identical calls). Add the cap, log every call, read the log. Usually one tool description is misleading.

**"It ignores my system prompt."** The system prompt is fighting the tool descriptions, or the same instruction is in both. Tool descriptions govern tool selection; the system prompt governs role and approach.

**"Wrong tool, wrong args."** Descriptions too vague, schemas too loose. Add `strict: true`, required fields, enums.

**"Inconsistent across runs."** Nondeterminism. Use structured outputs for anything that must parse, an evaluator step for anything that must be consistent, and evals to catch regressions. You can no longer reach for `temperature: 0` on current models; effort and structure are the levers.

**"I can't tell what went wrong."** Dump `messages` to disk after every run and read it. The transcript is your most powerful debugging tool.

**"Works in dev, flakes in prod."** Timeouts, retries with backoff for transient errors, alerting on max-steps and budget-exceeded events.

## Checkpoint

- You can write the loop from memory, including the three exits and the single-user-message rule for tool results.
- You can explain why the assistant turn is appended before the branch, and what breaks on current models if you edit it.
- You can say what `strict: true` buys and what it requires of the schema.
- You can convert the manual loop to the tool runner in both Python and TypeScript.
- You can list five things the API now does that older agent code did by hand.

## Sources

- Anthropic, *Tool use overview* and *Build a tool-using agent*: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Anthropic, *Tool runner*: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- Anthropic, *Structured outputs*: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Anthropic, *Effort*: https://platform.claude.com/docs/en/build-with-claude/effort
- Anthropic, *Refusals and fallbacks*: https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback
- Anthropic, *Prompt caching*: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Anthropic, *Writing tools for agents*: https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic, *Claude API release notes* (check before shipping): https://platform.claude.com/docs/en/release-notes/overview
- Yao et al., *ReAct*: https://arxiv.org/abs/2210.03629
