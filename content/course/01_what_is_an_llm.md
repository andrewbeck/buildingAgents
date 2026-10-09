# 01 — What Is an LLM

> The model under every agent, in enough depth to reason about its behavior and no more. After this chapter you can say what a token is, what pretraining and post-training each put into the model, why it hallucinates, why it is better at some things than others, and what "context" means mechanically. Everything in the rest of the course assumes this.

If you learn one thing from this chapter, learn it from the source. Andrej Karpathy's **Intro to Large Language Models** is the best introduction to the basics of what an LLM actually is, in any medium, and it is free: https://www.youtube.com/watch?v=zjkBMFhNj_g. One hour. Watch all of it before building anything. It is from late 2023 and the specific models it names are long gone, but nothing it says about what a model *is* has changed, which is the point. The rest of this chapter is a map of what the talk covers and why each piece matters to an agent builder, not a substitute for it. When you want the long version, his three-and-a-half-hour **Deep Dive into LLMs like ChatGPT** is the sequel.

## Build

No project on the ladder belongs to this chapter. [Project 0](./12_projects.md#project-0--the-rings) starts in the next chapter. The build here is the tokenizer exercise below: ten minutes, and it will change how you read every trace for the rest of the course.

## Read

Read first:

- **Intro to Large Language Models** (Andrej Karpathy, 2023). https://www.youtube.com/watch?v=zjkBMFhNj_g. One hour, the whole thing. A model is two files; pretraining is lossy compression of the internet; finetuning turns a document simulator into an assistant; scaling laws; tools; system 1 versus system 2; the LLM as an operating system; and the security section, which is the first prompt-injection explainer most people see.

Read after:

- **Deep Dive into LLMs like ChatGPT** (Karpathy, 2025). https://www.youtube.com/watch?v=7xTGNNLPyMI. Three and a half hours. Tokenization in detail, the post-training pipeline, hallucination and why "I don't know" has to be trained in, reinforcement learning and reasoning models, and the "lossy, probabilistic simulation of an internet text author" frame.
- **Software Is Changing (Again)** (Karpathy, 2025). https://www.youtube.com/watch?v=LCEmiRjPEtQ. The product-level consequences: Software 3.0, the autonomy slider, and partial autonomy with fast verification loops. [Chapter 03](./03_when_to_build.md) builds on it.
- **Chain-of-Thought Prompting** (Wei et al., 2022). https://arxiv.org/abs/2201.11903. The paper behind "the model needs tokens to think."

## A model is two files

The talk opens with the most useful simplification in the field. An LLM is a parameters file, billions of numbers, and a few hundred lines of code that run them. Everything interesting is in the numbers, and the numbers come from training. There is no database, no rules, no lookup table. When the model answers a question, it is running the same next-token computation it would run to continue any text.

## The three stages

The spine of both videos, and the frame to keep:

1. **Pretraining.** Take a large slice of the internet, filter it, tokenize it, and train a neural network to predict the next token. The result is a **base model**: a compressed, lossy, probabilistic simulation of internet text. It is not an assistant. Prompt it with a document and it continues the document. Everything it "knows" is a statistical recollection of what it read, with recent and rare facts remembered worst. Karpathy's frame: pretraining is lossy compression of the internet, and the model's knowledge is what survived the compression.
2. **Supervised fine-tuning.** Train the same network on a much smaller dataset of conversations written by human labelers following a labeling spec. Now the model continues a conversation the way a helpful labeler would. This is the step that turns a text simulator into something that answers questions, and it is where the assistant's persona and style come from.
3. **Reinforcement learning.** In the 2023 talk this is RL from human feedback: labelers compare outputs, a reward model learns their preferences, and the model is trained against it, because comparing is easier than writing. The Deep Dive covers what came next: let the model generate many attempts at problems with checkable answers, keep the ones that work, and train on those. That is where the model discovers its own strategies and where "reasoning" or "thinking" models come from. It is strongest exactly where answers could be verified.

An agent builder needs the frame because the three stages explain the three families of behavior you will debug: the model confidently stating things it half-remembers from pretraining, the model following the shape of its fine-tuning conversations rather than your instructions, and the model's reasoning being strong exactly where RL could verify answers and weaker elsewhere.

## Tokens

The model does not see characters or words. It sees **tokens**, chunks of text from a fixed vocabulary of around a hundred thousand entries, produced by a tokenizer that was itself learned from the training data. Common words are one token; rare words, numbers, code, and non-English text are several. Three consequences:

- **Cost and latency are in tokens.** Every budget, every context limit, every price is denominated in them. Build the intuition early: paste text into a tokenizer viewer and look. The exercise below does this.
- **Spelling and counting are hard** because the model cannot see the letters inside a token. "How many r's in strawberry" fails for a mechanical reason, not a cognitive one.
- **Everything is text.** Tools, structured outputs, conversation turns, and system prompts are all just token sequences with special delimiter tokens. The agent loop in [Chapter 04](./04_the_loop.md) is a protocol built on top of this fact, and most framework abstractions are thin layers over it.

## Where knowledge lives

Two kinds of memory, and the whole of [Chapter 08](./08_context_and_memory.md) follows from the difference:

- **Parameters.** What pretraining put in the weights. Vague, probabilistic, frozen at the training cutoff, and recalled best for things the internet repeated often. Karpathy's phrase: a hazy recollection of something read a long time ago.
- **Context window.** The tokens in front of the model right now. Precise, working memory, and the only thing you control at run time. Anything you need the model to be exact about goes here: the document, the tool result, the instruction.

This is why agents retrieve, search, and call tools instead of asking the model to remember. It is also why "it knew this yesterday" is not a bug report; the model knows nothing between calls.

## Hallucination

A base model trained to continue text will produce a confident-sounding answer to any question, because that is what the text it learned from looks like. Post-training reduces this by teaching the model to say "I don't know" in the cases where probing shows it does not, and by giving it tools, so it can look something up instead of guessing. Neither is complete. Treat every unsupported factual claim as a sample from a distribution, and design the agent so that claims that matter are grounded in a tool result that is in context. The citation rule in [Project 5](./12_projects.md#project-5--research-agent) is this principle as code.

## The model needs tokens to think

Each token is produced by a fixed amount of computation. A question whose answer needs many steps cannot be answered correctly in one token; the model has to spread the work across intermediate tokens. This is why chain-of-thought works, why reasoning models generate long hidden thinking before answering, why "answer with just the number" degrades accuracy on anything nontrivial, and why effort and thinking budgets exist as API parameters. When an agent fails on a task that looks easy, ask first whether you gave it room to work.

## System 1 and system 2

The talk borrows Kahneman's split. Out of the box the model is system 1: fast, instinctive, one token at a time with no ability to pause and deliberate. The research direction Karpathy points at, converting time into accuracy by letting the model think longer, is what reasoning models and thinking budgets became. The section above is the mechanism; this is the frame. The same section of the talk previews tool use and the "LLM OS" picture, a model at the center with a context window as RAM and tools, files, and other models as peripherals. That picture is the whole of this course drawn on one slide.

## Jagged intelligence

The model is superhuman at some things and worse than a child at others, and the boundary does not follow human intuitions about difficulty. It can write a working parser and miscount the letters in a word. The practical rule: never assume capability from adjacent capability, and test the actual task. [Chapter 07](./07_evals.md) is the discipline for doing that honestly.

## What this means for the rest of the course

- An agent is this model in a loop with tools ([Chapter 02](./02_mental_models.md)). Nothing in the loop changes what the model is.
- Tools exist to move facts from the world into the context window ([Chapter 06](./06_tools_and_mcp.md)), because the weights cannot be trusted with specifics.
- Context engineering is memory management for a system whose only reliable memory is the window ([Chapter 08](./08_context_and_memory.md)).
- Evals exist because capability is jagged and cannot be inferred ([Chapter 07](./07_evals.md)).
- Models change every few months. The three-stage frame, tokens, and the parameter/context split have not changed since the video and are unlikely to.

## Exercises

1. Paste a paragraph of English, a paragraph of code, and a paragraph in another language into a tokenizer viewer (the tiktokenizer web app, or your provider's token-counting endpoint). Record tokens per word for each. That ratio is your first cost intuition.
2. Ask a model a question whose answer it should know from pretraining and one it cannot know (something from last week). Note how the two answers differ in confidence, and whether the model says it does not know.
3. Ask the same multi-step arithmetic question twice: once with "answer with only the number" and once allowing it to work. Count the tokens and compare the answers.
4. Write down, in your own words, the difference between what the weights know and what the context knows. Keep it; you will need it in [Chapter 08](./08_context_and_memory.md).

## Checkpoint

- You can describe pretraining, supervised fine-tuning, and reinforcement learning in one sentence each, and name a failure mode that comes from each stage.
- You can explain why a model miscounts letters and why "answer with just the number" hurts accuracy, from the mechanism.
- You can say where a given fact should live, weights or context, and why agents retrieve instead of remember.
- You have watched the Karpathy intro talk to the end.

## Sources

- Andrej Karpathy, *Intro to Large Language Models* (Nov 2023): https://www.youtube.com/watch?v=zjkBMFhNj_g
- Andrej Karpathy, *Deep Dive into LLMs like ChatGPT* (Feb 2025): https://www.youtube.com/watch?v=7xTGNNLPyMI
- Andrej Karpathy, *Software Is Changing (Again)* (Y Combinator, Jun 2025): https://www.youtube.com/watch?v=LCEmiRjPEtQ
- Wei et al., *Chain-of-Thought Prompting* (2022): https://arxiv.org/abs/2201.11903
