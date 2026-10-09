# 06 — Evals

> The eval discipline for agents: how to find what is actually breaking, turn it into a test set and a grader you trust, and measure so a prompt or model change is a decision instead of a gamble. After it you can run an error-analysis pass on 30 traces, build a 50-case eval set with a calibrated LLM judge, and say whether a change made your Project 9 agent better, worse, or just different.

## Build

- [Project 6](./11_projects.md#project-6--eval-suite-and-review-workbench), part A: the eval suite for Project 5. Twenty hand-written cases, generated inputs for the rest, three layers of graders, and a judge aligned to your labels. Build it now, before Project 7; the course puts evals in the middle on purpose.
- Part B, the review workbench, can wait until you have enough traces to need it, which is usually Project 9.

## Read

Read first:

- **Your AI Product Needs Evals** (Hamel Husain, 2024). Three levels and the Rechat case study. Before any tooling.
- **LLM Evals FAQ** (Husain and Shankar, 2025). How many examples, binary versus Likert, who arbitrates.
- **Demystifying evals for AI agents** (Anthropic, 2026). Agent evals are trajectory evals.

Read after: **LLM-as-a-Judge** and **Field Guide to Rapidly Improving AI Products** (Husain) before adding a judge; Eugene Yan's three pieces when your judge disagrees with you. All in the [evals tier](./13_reading_list.md#tier-evals).

## Why evals are the whole job

Every other chapter describes something you build once. Evals are the thing you do every week, forever, because you will change prompts, swap models, and add tools, and each of those is a regression waiting to happen. An agent without evals is a demo you have stopped looking at. Hamel Husain's framing: evaluation belongs to development the way debugging does. Nobody schedules a debugging phase.

Three convictions run through every serious source on this topic. The rest of the chapter is a long footnote to them.

1. **The metric is downstream of the look.** You cannot define "good" until you have read a few hundred raw traces. Criteria emerge from observation. Shankar et al. named this *criteria drift*: you need criteria to grade outputs, but grading outputs is what teaches you the criteria.
2. **Binary, with critique.** Pass/fail forces a decision. A written reason forces a rationale. A 1 to 5 scale hides both behind an average.
3. **The judge is a model you train.** An LLM-as-judge is not a metric you import. It is a small model you align to one domain expert until you trust its votes on data it has not seen.

Hamel's own description of why he pushes LLM judges is the honest one: "Creating an LLM judge is a nice hack I use to trick people into carefully looking at their data." The judge is the excuse. The looking is the work.

Start now, with five examples. Teams delay evals because they imagine a real eval needs hundreds of cases. Anthropic's multi-agent research team started with roughly 20 queries, and one prompt change moved success from about 30% to 80%. At that signal-to-noise ratio you do not need n=2000. You need a good n=20 and the willingness to read every one.

## The eval stack

Two framings are common: a three-layer stack by *what* you evaluate (unit steps, trajectories, production traces) and a five-rung hierarchy by *quality of signal* (vibes, heuristics, judge, ground truth, human). Same ladder, two sides. One table.

| Rung | Layer | What it is | Cost | Runs | Named failure mode |
|---|---|---|---|---|---|
| Vibes | none | You read the output and it looks right | Free | Whenever | Catches big regressions, not small wins |
| Heuristics / assertions | Unit | Programmatic checks on discrete steps: schema valid, right tool, args in range, no leaked UUID, under N steps | Cheap, deterministic | Every PR, in CI | Only catches what you thought to assert |
| LLM-as-judge | Trajectory | A second model grades a full run against a rubric built from expert critiques | Medium | Scheduled and pre-deploy | Unaligned judge measures nothing. Prefers long, confident answers |
| Ground truth | Trajectory | You wrote the right answer (or the right tool sequence) for each input | Expensive to build, cheap to run | Every change | Set goes stale. Overfits if never refreshed |
| Human review | Trajectory + production | A domain expert reads traces and labels pass/fail with a reason | Expensive, does not scale | Weekly sample | Finds *kinds* of errors the judge was never told about |
| A/B in production | Production | Real users, real outcomes, conversion and thumbs | Slowest, final | Post-launch | Needs traffic. Reveals distribution shift nothing above can see |

The stack is a sequencing rule. Hamel: conquer a good portion of Level 1 before you move into model-based tests. Cheap assertions catch the dumb regressions so the judge only spends tokens on ambiguous ones.

Sources disagree on where to start: "3 + 4" (judge plus ground truth) versus unit assertions. Take both, in this order: error analysis, then a 20-case ground-truth set, then assertions for the failure cluster the analysis surfaced, then a judge only for dimensions assertions cannot reach.

## Start with error analysis, not metrics

You do not build infrastructure for failures you have not characterized. Before an assertion, before a judge, before a vendor, you read traces.

The loop:

1. **Gather.** 30 traces minimum, typically 50 to 100. Real if you have them, synthetic if not. Include successes. Do not pre-filter.
2. **Open code.** Read each trace and write whatever phrase fits, in prose. No taxonomy yet. If you reach for a 1 to 5 score here, you have already lost.
3. **Axial code.** Cluster the open codes into stable categories, yourself or with a model. Categories are axes, codes are instances.
4. **Count and prioritize.** Frequency per cluster over the last 100 traces. The biggest cluster is your next two weeks.
5. **Automate.** For each cluster that persists, build the cheapest scorer that catches it. Assertion first, judge only if the failure is genuinely subjective.
6. **Repeat** every release, until new traces stop producing new categories. Saturation is the exit condition, not a count.

This is grounded-theory qualitative research borrowed wholesale. It feels slow. It is the fastest thing you will do all quarter.

### What open coding looks like

Seven traces from a coding-assistant agent, coded raw:

| Code | Trace note |
|---|---|
| hallu | Cited "Sec 4.2 of the EU AI Act." No such section exists. |
| tool | Called `search_db` twice with identical params before reading either result. |
| ctx | Forgot the user said Python. Recommended TypeScript libraries. |
| loop | Re-planned four times, then gave up. |
| tool | `get_user` called with `name` when the schema wanted `id`. |
| ctx | Lost which file the user was editing after a tool error. |
| hallu | Claimed a bash command would work. It does not exist on macOS. |

One person codes. Notes are prose, not enums. The goal is not categorization. It is seeing.

### Then axial coding

Cluster the codes and count across the last 100 traces:

| Cluster | Share |
|---|---|
| Hallucinated facts and citations | 38% |
| Lost user context mid-session | 24% |
| Wrong tool or wrong parameter | 18% |
| Planning loops and surrender | 12% |
| Long tail | 8% |

38% of failures share one root cause. That is your roadmap and your first automated eval. The other clusters wait their turn.

Hamel's discipline, the one most teams skip: only automate an eval for a failure mode that survived a prompt fix. If half your failures are one prompt bug, fix the bug and re-run the analysis.

## Building the eval set

### Three sources

Bhagwat lists the three ways to get cases, and a mature set is a mix of all three:

| Source | Strength | Watch for |
|---|---|---|
| Hand-curate | Forces you to say what good looks like. Work with a domain expert if the domain is not yours | Small, and biased toward what you imagined |
| Synthesize | Fast coverage of scenarios real users have not sent yet | Models generate easy cases. Check every one |
| Mine production | Highest signal. Every incident becomes a regression case | Only available once you are live |

The production channel is the one people forget to wire up. A failed trace already contains the exact context that produced it, so turning it into a regression case is a copy, not a design task. Version the eval set like code.

### Composition

A 50-case set for one agent holds up well as a default shape:

| Count | Kind | What it exercises |
|---|---|---|
| 20 | Normal | Task success, tool selection, args, cost baseline |
| 10 | Ambiguous | Asks for clarification instead of guessing |
| 10 | Adversarial / prompt injection | Ignores instructions inside tool output |
| 5 | Tool failure | Recovers from timeouts, empty results, malformed payloads |
| 5 | Should ask for approval | Permission gates actually gate |

The pre-launch minimum is smaller: 10 success, 5 edge, 3 adversarial, all passing. Twenty cases with a runnable judge is the floor.

### Generate inputs, never outputs

Synthetic data is for coverage, not ground truth. Let a model dream up the *inputs* your users have not sent yet. Let your *actual system* produce the outputs. Let your *expert* grade them.

Structure the generation along three axes:

| Dimension | Examples | Purpose |
|---|---|---|
| Feature | summarize, search, book, refund, escalate | The capability under test, one per code path |
| Scenario | happy path, zero results, multi-step, ambiguous, adversarial | The shape of the request. Forces edge coverage |
| Persona | first-time user, power user, non-native speaker, skeptical, rushed | Linguistic and emotional variation. Surfaces tone bugs |

Hamel's recipe: hand-write about 20 tuples, ask a model for 200 variations on those axes, run them through the real product. Do not ask the model to grade them. Synthetic generation fails for specialized domains (legal, medical), low-resource languages, underrepresented users, and anything high-stakes. Use real samples there.

### How many traces

Eugene Yan's product-evals essay gives one formula worth memorizing. To estimate a defect rate `p` within margin `E` at confidence `z`:

```
n = (z² · p · (1 − p)) / E²
```

To detect a 10% defect rate within ±2.5% at 95% confidence (`z = 1.96`), that is 554 traces, or about 80 a week for seven weeks. The formula is conservative; stratified samples need fewer. The corollary: a 200-trace eval reporting 143 pass, 57 fail is telling you the defect rate is 28.5% ± 2.4%. That is a number you can act on.

### What a golden case looks like

Adapted from the eval-harness template for an agent rather than a chatbot. Each case pins the goal, the allowed and forbidden tool surface, the approval expectation, a step cap, and the rubric. `expected` says what must be *true of the trajectory*, not what the output text must be verbatim.

```yaml
- id: research_yc_w24_001
  user_goal: "Identify the founders and current CEOs of the top 20 YC W24 companies."
  expected:
    must_call_tools: ["web_search", "web_fetch", "return_sub_report"]
    must_not_call_tools: ["send_email"]
    max_steps: 12
    max_cost_usd: 1.50
    requires_approval: false
    final_answer_must:
      - "list exactly 20 companies"
      - "give founder and current CEO per company"
      - "cite at least one source per company"
      - "flag inferred entries as inferred"
  rubric:
    task_success: "All 20 entries present and each is verifiable from a cited source."
    grounding: "No founder or CEO name that does not appear in a fetched page."
    efficiency: "No sub-agent repeats an identical search query."
  labels:
    expert_verdict: null   # pass | fail, filled in by hand
    critique: null         # one paragraph, becomes a judge few-shot example
```

The `labels` block is the part most templates leave out. Every golden case eventually carries a human verdict and a critique. Those critiques feed the judge.

## Grading

### Binary plus critique beats Likert

The argument against 1 to 5 scales is not about resolution. It is about commitment.

| Binary (pass / fail + why) | Likert (1 to 5) |
|---|---|
| Forces a decision. No "3" to hide in | Middle-value flight. Annotators cluster on 3 when unsure |
| Consistent across annotators. Easy to align humans and judges | One person's 3 is another's 4 |
| Composable. Many binary judges beat one rubric judge | Adjacent-point disagreement bloats noise |
| The critique compounds into the prompt and into the judge | The score hides the reason |

Same 200 traces, same expert. Binary gives "defect rate 28.5% ± 2.4%." Likert gives "1: 6, 2: 24, 3: 89, 4: 61, 5: 20, mean 3.32." Nobody knows what to do with a 3. Some templates have the judge emit 1 to 5 per criterion; every primary source says binary. Go binary. If you want gradation, add binary dimensions, not scale points.

### The judge alignment loop

An LLM judge is a way to bottle one domain expert's judgment and run it on thousands of traces. The bottling is the work. Most "our judge is broken" stories are "we never aligned it to a human."

1. **Pick one principal expert.** Not a committee. One person whose verdict the team accepts.
2. **Build a diverse 30-row sample.** Feature × scenario × persona. Organic failures, edge cases, routine traffic.
3. **Binary label plus written critique.** Pass or fail and a one-paragraph reason per row. The critiques become the judge's few-shot examples.
4. **Fix the obvious.** If one prompt bug is half the failures, ship that fix first.
5. **Write the judge prompt.** Critiques as few-shot examples. Output pass/fail plus reasoning. Run it on a held-out set, not the rows you tuned on.
6. **Measure TPR and TNR separately.** If 80% of rows pass, a judge that always says "pass" scores 80% and is useless. Cohen's κ if you must.
7. **Iterate to ≥90% agreement on held-out data.** Refine the prompt, add critiques, split the judge, swap models. Fresh rows each time.

What convergence typically looks like (illustrative numbers, in the shape of the Honeycomb case study in Hamel's judge post):

| Iteration | Agreement (held-out) | TPR | TNR | What changed |
|---|---|---|---|---|
| 1 | 61% | 0.72 | 0.49 | Off-the-shelf hallucination rubric. Catches surface lies, misses the citation drift the expert flagged |
| 2 | 78% | 0.84 | 0.71 | Six expert critiques added as few-shot. Catches most citation issues, still misses tone |
| 3 | 89% | 0.92 | 0.85 | Split into two binary judges, citation accuracy and completeness. Composition beats the monolith |
| 4 | 94% | 0.95 | 0.92 | Clarified rubric edge cases against held-out failures. Safe to grade unseen traces |

Three iterations is typical. Notice the step from 2 to 3: the fix was two narrower judges, not a better prompt.

### Which model judges

Two rules, in priority order:

1. **A different model family than the agent, when you can.** Bhagwat's point: a judge favors outputs that sound like itself. If Sonnet runs the agent, a non-Anthropic judge removes self-preference.
2. **A stronger model than the agent, when you cannot switch families.** Opus judges Sonnet. The judge runs offline, so cost matters less than calibration.

Sources disagree on which rule leads. Family first: self-preference is a systematic bias, capability gap is a noisy one. Other biases to correct for: length (judges prefer longer answers even when they are not better) and confidence (a hedged correct answer loses to an assertive wrong one). Feed the expert's critiques back in. That is the loop.

### When ground truth exists, use it

Do not ask a judge whether the agent called the right tool. Assert it. Whether the JSON parsed: parse it. Whether the tests pass: run them. The judge is for dimensions with no single right answer: tone, completeness, source quality, whether a caveat was warranted. Everything else is a Level 1 assertion in CI.

### Eval the eval

Your judge drifts too, when its model is updated under you or its prompt accrues edits. Keep a frozen-label set of 30 to 50 rows and run the judge against it monthly. If agreement drops, re-align first.

## What to measure for agents specifically

Chat evals grade an answer. Agent evals grade a trajectory: tool calls, arguments, steps consumed, and whether the job got done. Bhagwat's framing: you want `expect(fn).toBeCalled` for tool use, and the most important eval is the simplest one, did it finish the job?

### The dashboard

For any agent shipped to users, the dashboard answers all seven. A regression in any of them blocks deploy.

| Metric | How | Why |
|---|---|---|
| Task success | Programmatic check or LLM judge | The headline. Did it work? |
| Tool selection | Trace assertion: `must_call_tools`, `must_not_call_tools` | Wrong tool means wrong everything downstream |
| Tool args | Per-tool schema and value checks | Garbage in poisons the context |
| Cost / tokens | Per-task average and p99 | A prompt change can 5× cost silently |
| Latency | p50 / p95 / p99 | Means do not catch user pain |
| Refusal rate | Stop reason, plus a classifier for soft bails | A polite "I can't help" is a failure if it could have |
| Hallucination rate | Judge over tool-grounded claims | Only checkable if you log what the tools returned |

> **Modernization note (Snapshot 2026-09).** On current models the Claude API returns `stop_reason: "refusal"` with a populated `stop_details` object (`type`, `category`, `explanation`). Log it as an outcome label and track refusal rate alongside `max_tokens` and `end_turn`; a rise after a prompt or model change is a regression like any other. `stop_details` is `null` for every other stop reason, so guard before reading. On `claude-fable-5-1` and `claude-opus-5` the server-side `fallbacks` parameter can route a refused request to another model, so record whether an answer came from the primary or a fallback. Verify category names against the API docs.

### Trajectory evals

A trajectory eval checks the path, not just the destination. Each scenario carries the goal, the available tools, an expected sequence *or* an allowed tool set, approval expectations, a step cap, forbidden actions, and a rubric for the final answer. You rarely need an exact sequence. "Search before fetch, never `send_email`, under 12 steps" catches what matters without breaking when the model finds a legitimately different route. Efficiency is its own dimension: call count, duplicate calls with identical arguments, and steps-to-completion are cheap assertions that surface loops long before a judge would.

### Multi-turn

Most textual evals are single-turn. Agents are not. A multi-turn eval runs a full conversation or task sequence and grades the whole thing: did it keep context across turns, recover when a tool failed, stay on task after a tangent? The "lost user context" cluster from the error-analysis example is only visible here.

### What Anthropic learned on the research agent

Anthropic's multi-agent research system, the one Project 9 is modeled on, shipped with a single LLM judge that scored five axes in one call and output both a 0.0 to 1.0 score and a pass/fail:

| Axis | Question |
|---|---|
| Factual accuracy | Do claims match retrieved sources? |
| Citation accuracy | Do cited sources support the claim they are attached to? |
| Completeness | Are all requested aspects covered? |
| Source quality | Primary over secondary over SEO |
| Tool efficiency | Is the tool-call rate appropriate for the task? |

One model, one prompt, most aligned with humans of everything they tried. The bias humans caught that the judge missed: early agents preferred SEO content farms over academic PDFs. The judge graded factual accuracy correctly; only a human noticed the drift in *where* facts came from. That became the source-quality axis. Judges find errors. Humans find kinds of errors the judge was never told to look for.

Anthropic's tool-evaluation cookbook flips the frame: have the agent grade your tools by emitting a `<feedback>` block on what was confusing, then have a coding agent rewrite the tool descriptions from the stack of feedback, checked against held-out tasks. See [Tools and MCP](./05_tools_and_mcp.md).

### Cost per win

For scoring a multi-agent system against the single agent (Project 9's stretch goal), the critical column in the results table is **cost per win**. Multi-agent should win on breadth-first questions and lose on single-answer factual questions, at a token cost in the neighborhood of the roughly 4× the author measured in [Chapter 09](./09_multi_agent.md). If the wins do not justify the cost, the system is over-engineered for the question.

A workable dataset shape: 10 questions, 3 breadth-first, 3 comparison, 2 single-answer factual (where multi-agent should *not* help), 2 deep single-source, each with a hand-written rubric. Blind the judge with A/B labels. Hand-grade 3 of the 10 pairs first and iterate the judge prompt until you disagree on at most one. Score each criterion pass/fail with a one-line rationale rather than 1 to 5; rubric bullets are binary questions in disguise.

## Offline and online

Offline evals run against a fixed dataset before deploys and catch regressions. Online evals sample live traffic, score it, and watch metrics over time; noisier, because inputs drift, but real users break agents in ways your test set never will. Start offline, add online once you are in production.

### Production sampling policy

You cannot store every trace forever. The pattern that works:

- **First week of a release:** store 100% of traces.
- **After that:** store every errored trace, every flagged trace (low judge score, thumbs-down, refusal, `max_steps`), and a random sample of successful ones, 10% is a common default.
- **Alert** on error rate, latency spike, token-cost spike, refusal spike, and unusual tool-use distribution.

Run your offline evals on the sampled traces post-hoc. That is what catches model updates, distribution shift, and inputs a static set never had.

For a trace to become an eval case later it needs, per the [Production](./08_production.md) logging spec: run ID, input, prompt version, model ID, per-step tokens and stop reason, every tool call with args and result, final output, cost, and an outcome label. Skip tool results and you cannot measure hallucination. Skip the prompt version and you cannot tie a regression to its cause.

### A/B testing

The Level 3 eval. Leaders at big consumer and developer AI companies half-joke that they rely more on A/B testing of user metrics than on evals. That works when traffic is high enough that a quality drop shows up fast. Most of your agents do not have that traffic. Reserve A/B for changes already validated at Levels 1 and 2. Project 9's rainbow-deployment stretch is the small-scale version: a variant flag, 50/50 routing by question hash, the variant on every trace, an append-only run log. The router is 30 lines, the value is the logging discipline, and it is only worth it if you are actually varying something.

### Human review cadence

Automated evals do not retire the human. The expert reads a sample every week in a review interface with keyboard shortcuts and one-click pass/fail, because friction in the looking is what kills the practice.

Weekly: the expert reviews 30 or more sampled traces, binary plus critique, and new critiques go into the judge. Per release: an error-analysis pass on that release's traces, re-cluster, update assertions. Monthly: run the full suite from scratch and the judge against the frozen-label set, look for drift.

### Count experiments, not features

The field guide's contentious recommendation: stop promising AI features by date. Commit to a capability funnel. Feasibility, two weeks: can the model do this at all on a 20-row eval? Most ideas die here. Prototype, four weeks: end-to-end loop plus error analysis. A/B, six weeks: promote or revert. At any step, if it does not work, you pivot. It is an exploration budget, not a roadmap.

## Antipatterns

Twelve in the catalog. These are the ones that actually cost teams quarters.

| Antipattern | What it costs | Instead |
|---|---|---|
| Buying a platform before looking at data | Dashboards you paid for that stay empty | Spreadsheet plus notebook for the first 200 traces |
| Eval-driven development, top-down taxonomies | Assertions and buckets for imagined failures. You miss the real ones | Ship, look at traces, open code, then encode what broke |
| God evaluators | One judge scoring 5 to 10 dimensions. Each cancels the others | One binary judge per dimension. Compose |
| Off-the-shelf hallucination scores | Generic metrics with no relation to your failures. False confidence | Build the judge from your expert's critiques |
| Raw accuracy on imbalanced classes | 95% accuracy when 95% of rows pass is a judge that always says pass | TPR and TNR, separately |
| Likert and vanity dashboards | The modal vote is the middle. "Avg 4.1, +0.02 this week" tracks nothing | Binary with critique. Defect rate with a confidence interval |
| Outsourced labeling | The loop between "what failed" and "why" breaks when it leaves the team | In-house expert, custom review tool, small N |
| Skipping held-out sets | You tune the judge on the data you trust it to grade. Silent overfit | Dev/test split. Always |
| No eval on the eval | The judge drifts and nobody notices | Frozen-label set, monthly |
| Pass rate as the success bar | 100% is arbitrary and unreachable | Threshold per failure type based on user tolerance |

Also in the catalog: ROUGE and BERTScore on agent outputs (lexical similarity does not track quality), and engineers gatekeeping prompts from domain experts. Prompts are just English. Give the expert edit access.

### Failure taxonomy as trace labels

A seed taxonomy for labeling traces in review. Your own axial coding will rename half of it. The point of a shared vocabulary is that a label on a trace can become an assertion on a test.

| Category | Labels |
|---|---|
| Goal understanding | misunderstood goal, failed to ask clarification, over-scoped, under-scoped |
| Planning / tool use | wrong tool, right tool wrong args, unnecessary call, missing call, repeated-call loop, failed to stop |
| Retrieval / context | bad query, irrelevant context used, ignored relevant context, stale source, prompt injection followed |
| Synthesis | unsupported claim, citation mismatch, wrong inference, overconfident, missing caveat |
| Safety | skipped approval, excessive permissions, attempted forbidden action, exposed secret, unsafe external call |
| Reliability | tool timeout, schema parse failure, external API failure, retry failure, state corruption |

### Three scenarios

A self-test.

1. You shipped a coding agent two weeks ago. Quality "feels worse." No evals. First move? **Read 50 recent traces.** Not a judge, not a model bump. You do not know what is broken yet.
2. Your judge says 92% pass. Production thumbs-down is 18%. Diagnosis? **The judge is not aligned to a human.** Label 50 thumbs-down traces with the expert, re-align, report TPR and TNR. Swapping judge models will not help.
3. A teammate wants the eval framework set up before the agent exists. Your move? **Build, run, read traces, then build evals.** Imagined test cases overfit to what you think will go wrong.

## Tooling

Hamel's October 2025 review concluded the platforms are comparable feature-for-feature; what matters is fit with your stack. His recommendation: a vendor as the trace store, analysis in a notebook, an annotation interface you build yourself. The roughly 10× iteration speed comes from removing the friction generic UIs add to looking at data. Instrument with OpenTelemetry's GenAI semantic conventions so switching vendors is a config change.

> **Snapshot 2026-09.** LangSmith: first-party for the LangGraph projects, trace-to-playground loop, auto-eval features risk false confidence. Braintrust: clean human-review workflow, CI-blocking on regression, proprietary query language. Langfuse: open source, self-hostable, OTel-first, v4 GA August 2026, evals secondary to observability. Arize Phoenix: open source, notebook-centric, best raw trace transparency. W&B Weave: tracing plus eval on the Weights & Biases stack. Promptfoo: declarative eval config and red-teaming, acquired by OpenAI March 2026, OSS continues. Inspect AI: UK AISI's framework, strongest for capability and safety evals with sandboxed agent tasks. Harbor: from the Terminal-Bench team, containerized agent benchmarks you can point at your own tasks. OpenAI's hosted Evals platform shuts down November 2026; do not build on it. `pytest` plus a JSON file is still a fine eval suite for many projects. Verify before committing; this list ages fast.

Hamel's evals-skills repo reframes tooling as *skills* for a coding agent rather than platforms for a human: seven markdown method files (eval-audit, error-analysis, generate-synthetic-data, write-judge-prompt, validate-evaluator, evaluate-rag, build-review-interface), each one piece of the loop in this chapter. Fork it and rewrite each skill against the failure modes you have actually seen.

## Ship checklist

Each box maps to an artifact, not a feeling. If you cannot tick one, you are consciously accepting risk on it, which is fine only if you have named which one and to whom.

- [ ] **Level 1 assertions** for every known failure cluster. At least 10 success, 5 edge, 3 adversarial cases, all passing. Eval set of 20 or more, versioned.
- [ ] **LLM judge calibrated** to one human on a 50-trace held-out set, ≥90% agreement, TPR and TNR reported separately, different model family where possible.
- [ ] **Production sampling plan**: 100% week 1, then all errored, all flagged, and a random sample. Every trace carries prompt version, model ID, tool results, stop reason, cost.
- [ ] **Cost and latency dashboards** with alerts on regression. p50 / p95 / p99, not means.
- [ ] **Refusal and hallucination rates** measured on a stable test set. `stop_reason: "refusal"` logged as an outcome label. A regression blocks deploy.
- [ ] **Eval on the eval**: a frozen-label set the judge is run against monthly.
- [ ] **Rollback plan**: a kill switch that disables the agent when the dashboard goes red at 2 AM.

For the trajectory rubric, score each run 0 to 10 across the six dimensions and gate promotion on the total, with no safety regression allowed at any tier:

| Dimension | Points |
|---|---|
| Task success | 0 to 3 |
| Tool selection | 0 to 2 |
| Argument correctness | 0 to 1 |
| Grounding | 0 to 1 |
| Safety / permissions | 0 to 2 |
| Efficiency | 0 to 1 |

| Score | Promotion |
|---|---|
| 9 to 10 | Production, low-risk cases |
| 7 to 8 | Beta with human review |
| 5 to 6 | Internal only |
| Under 5 | Redesign the architecture or the tools |

Promote only if the total improves *and* safety does not drop. Then convert every production incident into a regression case and run the loop again.

## Exercises

1. Open code thirty raw Project 5 traces before reading past "Start with error analysis." Cluster the codes and name the largest cluster with a percentage.
2. Write ten golden cases in the YAML shape from this chapter. Generate inputs, never outputs, for ten more.
3. Grade twenty traces yourself, then have the judge grade them. Report agreement, true-positive rate, and true-negative rate separately.
4. Make one deliberate prompt change to Project 5 and show the before-and-after diff from the regression runner.

## Checkpoint

- You can open code 30 raw traces from your Project 9, cluster the codes, and name the largest failure cluster with a percentage.
- You can write a 50-case eval set in the 20/10/10/5/5 shape as YAML golden cases with `must_call_tools`, `max_steps`, `expert_verdict`, and `critique`.
- You can align a binary LLM judge to your own labels on a held-out set, report TPR and TNR separately, and say why raw agreement is not enough.
- You can produce a blinded cost-per-win table for Project 7 versus Project 9 across breadth-first, comparison, single-fact, and deep questions.
- You can point at the seven dashboard metrics for your agent and say which one you are not currently logging.

## Sources

- Hamel Husain, *Your AI Product Needs Evals*, 2024. https://hamel.dev/blog/posts/evals/
- Hamel Husain, *Creating an LLM-as-a-Judge That Drives Business Results*, 2024. https://hamel.dev/blog/posts/llm-judge/
- Hamel Husain, *A Field Guide to Rapidly Improving AI Products*, 2025. https://hamel.dev/blog/posts/field-guide/
- Hamel Husain, *Frequently Asked Questions About LLM Evals*, 2025. https://hamel.dev/blog/posts/evals-faq/
- Hamel Husain, *Selecting the Right AI Evals Tool*, 2025. https://hamel.dev/blog/posts/eval-tools/
- Hamel Husain, *Eval Skills*, 2026, and the repo. https://hamel.dev/blog/posts/evals-skills/ · https://github.com/hamelsmu/evals-skills
- Eugene Yan, *How to Run Product Evals*. https://eugeneyan.com/writing/product-evals/
- Shreya Shankar et al., *Who Validates the Validators? Aligning LLM-Assisted Evaluation of LLM Outputs with Human Preferences*, UIST 2024. https://arxiv.org/abs/2404.12272
- Lianmin Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, 2023. https://arxiv.org/abs/2306.05685
- Anthropic, *How we built our multi-agent research system*, 2025. https://www.anthropic.com/engineering/multi-agent-research-system
- Anthropic, *Writing Tools for Agents*, 2025. https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic, Claude API Messages reference (stop reasons, `stop_details`). https://platform.claude.com/docs/en/api/messages
- Sam Bhagwat, *Principles of Building AI Agents*, 3rd ed., Mastra, March 2026, section 27 "Evals". https://mastra.ai/book
- OpenTelemetry, *Semantic Conventions for Generative AI*. https://opentelemetry.io/docs/specs/semconv/gen-ai/
