# 05 — Writing Good Tools, and MCP

> Tool design is the highest-leverage engineering in an agent. This chapter covers how to design a tool surface, how to gate it, how to evaluate it, and how MCP standardizes the boundary. After it you can take a napkin list of "things the agent needs to do" and turn it into a small, safe, well-described tool set, and you can decide when a tool should be an MCP server.

Anthropic's phrase for this is the **agent-computer interface (ACI)**. The framing: spend as much care on it as you would on a human-computer interface, and write for it the way you would onboard a junior developer.

## Think like an analyst

The Mastra book's tool-design story is the right starting frame. An investor tried dumping her whole library of books into the context window and the agent could not reason about it. She then wrote out the operations a human analyst would run (books by genre, recommendations by investor, sort recommenders by type) and made each one a tool. The agent became useful immediately.

The procedure: before coding, write down the list of operations a competent human would perform to do this job. Each one is a candidate tool. Then apply the cuts below.

## Anthropic's rules, condensed

From *Writing tools for agents* and *Building Effective Agents*:

1. **Do not just wrap the API.** `list_users` + `list_events` + `create_event` becomes `schedule_event`. Tools should match jobs, not endpoints.
2. **Namespace.** `asana_search`, `jira_search`. Prefix by system; try suffix later if it reads better.
3. **Return semantic identifiers, not UUIDs.** `user_name` and `user_id`, not an opaque `user` blob. The model reasons in language.
4. **Cap response size.** Roughly 25K tokens is the ceiling for a single tool result. Offer `response_format: "concise" | "detailed"`; concise saves about two thirds of tokens.
5. **Descriptions answer "when should I use this"** as much as "what does it do." Write them as if onboarding a new hire.
6. **Keep the format close to what the model has seen in the wild.** Markdown over JSON where possible; fewer formatting tokens, fewer errors.
7. **Give the model room to think before tool use.** Adaptive thinking handles this now; do not fight it with "answer immediately" instructions.
8. **Poka-yoke.** Design the tool so the wrong call is hard to make: enums, required fields, `strict: true`, filename-only paths.
9. **Test how the model actually uses the tool.** Build a prototype, write evals, watch transcripts, iterate. Then in production, capture failures and feed them back.

> **Author's note:** "should be thinking of how to identify edge cases as they happen and automatically enhancing agent instructions (skills, or similar?)… should probably be using the LLMs themselves to generate instructions, i.e. how we built a skill." That is exactly the loop Anthropic describes: an LLM reviews transcripts, proposes tool-description or skill edits, a human approves. Recursive improvement is the goal; [Chapter 06](./06_evals.md) is the machinery.

## The pre-tool checklist

Before adding any tool, answer all eight:

1. What user goal, and which **test case**, requires this tool?
2. Can it be read-only?
3. Does it require approval?
4. What arguments are allowed? (Enumerate. Constrain.)
5. What is the worst-case damage?
6. Can it be safely retried? (Idempotency key?)
7. How will traces represent it?
8. How will evals prove the agent uses it correctly?

Number one is the discipline that keeps tool counts down. An agent with thirty tools on day one is a design smell. Above roughly fifteen tools, models start confusing them; that is the point to split by task or use tool search.

## Blast radius and gating

For every tool, document: read or write, internal or external, maximum data reachable, maximum money or damage, safe to retry, approval required. Then apply the consequence matrix from [Chapter 02](./02_when_to_build.md).

Bad tool surface:

```
browser_control()             all permissions
run_shell(command)
database_query(sql)           with write access
send_email(to, subject, body) no approval
```

Better:

```
read_pricing_page(url)
search_docs(query)
create_email_draft(to, subject, body)
request_send_email_approval(draft_id)
```

Same capability, different autonomy level. Separate read tools from write tools; reads can be low-risk and parallel-safe, writes need approval, validation, rate limits, rollback.

Credentials never enter the model's context. Vaults, short-lived tokens, per-tool scopes, credential proxies. Managed Agents has vault credentials substituted at egress; the Claude Agent SDK masks sandbox credentials. If you host your own harness, the tool implementation holds the secret, not the prompt.

### Bash vs. dedicated tools

From Anthropic's agent-design guidance: a bash tool gives the model broad leverage and gives your harness an opaque string. A dedicated tool gives the harness an action-specific hook with typed arguments it can intercept, gate, render, audit, or run in parallel. Start with bash for breadth in a sandbox. Promote an action to a dedicated tool when you need to gate it (security boundary), check staleness (an `edit` tool can reject a write if the file changed since it was read), render it (Claude Code makes "ask the user" a tool so it can be a modal), or schedule it (`grep` is parallel-safe, `git push` is not, and bash cannot tell them apart).

## Errors, parallelism, and results

- Return errors as tool results with `is_error: true`. The model recovers well when it can see what happened.
- Execute independent tool calls concurrently and return all results in one user message.
- Keep results small and semantic. Post-process tool output before it hits the context; the raw API response is rarely what the model needs.
- Tool results are **untrusted data**. Web pages, documents, emails, MCP server responses can all carry injected instructions. Say so in the system prompt, then enforce it with permissions and validation, because a prompt is not a security boundary. [Chapter 08](./08_production.md).

## Beyond client tools

Client tools are the majority of what you write. Know the other kinds.

| Kind | Who runs it | Examples |
|---|---|---|
| Client tool | Your code | Everything in Projects 1 through 6 |
| Anthropic-defined, client-executed | Your code, Anthropic's schema | `bash`, text editor, computer use (self-hosted), memory |
| Server tool | Anthropic | `web_search`, `web_fetch`, `code_execution`, tool search |
| MCP tool | An MCP server, via your client or the API's MCP connector | Anything with an MCP server |

> **Author's note.** A common confusion: how does server-side `code_execution` differ from your own client tools, since that is tool use too? The answer: same request shape, different executor. You declare it in `tools`, Claude runs it in Anthropic's container, and the result arrives as a content block in the same response. There is no loop iteration on your side. Client tools pause the turn (`stop_reason: "tool_use"`) and wait for you.

Two features that change tool-surface design:

- **Programmatic tool calling.** Claude writes a script inside code execution that calls your tools as functions. Intermediate results stay in the sandbox; only the final output enters context. Use it when a task needs many sequential calls or large intermediate data you want filtered first.
- **Tool search.** Mark tools `defer_loading: true`; the model searches and loads only relevant schemas. Solves the "hundreds of tools" problem without swapping tool sets, which would invalidate the prompt cache. Never defer everything.

## Evaluating tools

Tool evals are their own layer under agent evals. For each tool, cases that check: called when it should be, not called when it should not, correct arguments, correct handling of an error result, and the number of unnecessary calls. The Project 4 failure described in [Chapter 11](./11_projects.md) (five search calls re-querying variations before a single fetch) is a tool-selection eval waiting to be written. The fix, budgeting fetches *and* total calls separately, is a description change, which is where most tool fixes live. Anthropic's cookbook has a tool-evaluation notebook worth running once.

## MCP

The Model Context Protocol is an open, JSON-RPC 2.0 standard for connecting LLM applications to tools, resources, and prompts. Before it, every integration was bespoke per model and per tool. It is now the default integration boundary across Anthropic, OpenAI, Google, and Microsoft, and the mental model that holds is REST for client-server: MCP is not about what a tool does, it is about how the conversation between agent and tool is structured.

**Primitives.** Servers expose *tools* (actions), *resources* (read-only context), and *prompts* (reusable templates). Clients can also offer sampling and elicitation back to servers. Transports are stdio for local subprocesses and streamable HTTP for remote servers. Capabilities are negotiated on connect.

**When to build a server.** When you have functionality other agents or other clients should use. When your project roadmap has many third-party integrations, build or reuse MCP clients rather than bespoke adapters. Do not build an MCP server for a tool only your own single agent will ever call; a local function is simpler.

**When not to.** Local, single-consumer tools. Anything where the extra hop adds latency you cannot afford. Cases where an existing API plus a thin client tool is enough.

**Security posture for third-party servers.** Verify provenance, pin versions, read every tool description (description poisoning is a real attack), restrict scopes, disable unused tools, never auto-approve unknown tools, log all calls, monitor for tool-list changes, and keep credentials in the server not the model.

> **Snapshot 2026-09.** MCP moved fast this year. The 2026-07-28 spec revision made the core stateless (no session handshake), added `server/discover`, deprecated dynamic client registration in favor of Client ID Metadata Documents, and tightened OAuth (issuer validation, credentials bound to the issuing authorization server). Enterprise-Managed Authorization (identity assertion via the IdP, Okta first) is a stable official extension. Governance moved to a foundation under the Linux Foundation in late 2025. The Claude API has an MCP connector (`mcp_servers` plus an `mcp_toolset` entry, beta header `mcp-client-2025-11-20`) so a server can be attached to a Messages request without you running a client. Verify all of this against modelcontextprotocol.io before relying on it; the auth story in particular is still settling.

**Skills vs. MCP.** Both are progressive disclosure. A skill is a folder of instructions and scripts the model reads when a task matches; it changes what the model *knows how to do*. An MCP server is a process the model *calls*; it changes what the model *can reach*. Skills are the right answer for "how we format the weekly briefing." MCP is the right answer for "read our Linear tickets."

## Checkpoint

- Take the library-concierge example and write the analyst's operation list, then cut it to the tools a first eval set demands.
- Rewrite `send_email` as a gated pair and say which autonomy level each version implies.
- Explain programmatic tool calling and tool search to a colleague and name a case for each.
- Say when you would ship an MCP server and when a local function is enough.
- Write three tool-eval cases for Project 4's search tool that would have caught the over-search failure.

## Sources

- Anthropic, *Writing tools for agents*: https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic, *Building Effective Agents*, appendix on prompt engineering your tools: https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, *Tool use overview* and *Advanced tool use*: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Anthropic, *Tool search tool*: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
- Anthropic, *Code execution with MCP*: https://www.anthropic.com/engineering/code-execution-with-mcp
- Anthropic cookbook, tool evaluation: https://platform.claude.com/cookbook/tool-evaluation-tool-evaluation
- MCP specification and docs: https://modelcontextprotocol.io/specification
- MCP blog, *Enterprise-managed authorization*: https://blog.modelcontextprotocol.io/posts/enterprise-managed-auth/
- Anthropic, *MCP connector*: https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- Agent Skills specification: https://agentskills.io/specification
- Sam Bhagwat, *Principles of Building AI Agents*, chapters 6 and 10: https://mastra.ai/book
