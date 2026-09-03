---
title: "LLM & AI"
description: "Tokens, embeddings, attention, transformers, RAG, prompting, agents, and evals."
category: "AI & agents"
tags: ["ai", "attention", "RAG", "fine-tuning"]
weight: 40
lead: "How the models actually work."
version: "concepts"
---
An LLM is a next-token predictor with a transformer backbone — everything else (RAG, agents, fine-tuning) is scaffolding around that core. Here's the surface you touch every day.

## Quick reference {#quickref}

The eight concepts you'll reach for daily — each expanded in the sections below.

### 1. Tokens & context

`1 token ≈ 4 chars`. The context window is the shared budget for prompt plus completion; overflow → truncate or RAG.

### 2. Temperature & top-p

Low `temperature` = deterministic, high = creative. `top_p` caps sampling to the smallest set of likely tokens.

### 3. Embeddings

Dense vectors that map meaning to geometry — similar text lands close together; the backbone of RAG and semantic search.

### 4. Attention

Each token weighs every other token — `softmax(Q·Kᵀ/√d)·V` — to decide what context to borrow.

### 5. RAG pipeline

**Chunk → embed → store → retrieve → ground → answer.** Grounds answers in your documents, cutting hallucination.

### 6. Fine-tuning vs RAG

**RAG** injects knowledge at inference; **fine-tuning** bakes style and format into weights. Ship RAG first, fine-tune when behavior must change.

### 7. Agents & tool calling

An LLM in a loop: it emits a structured **tool call**, you execute it, and the result feeds the next turn.

### 8. Prompt techniques

Few-shot examples, chain-of-thought, a system role, and constrained JSON output are the high-leverage moves.

## The LLM stack {#start}

An LLM turns text into numbers, mixes them, and samples the next number. Tokens, vocabulary, and sampling are the knobs on that machine.

### 1. Tokens & tokenizers

Text is split into subword tokens — not words, not characters. Roughly `1 token ≈ 4 chars`.

```
tokenizer.encode("Hello, world!")
# → ["Hello", ",", " world", "!"]
# → ids [9906, 11, 995, 0]
```

### 2. Vocabulary

The fixed table mapping token → id. The model only ever sees integers.

```
len(vocab)
# GPT-2  ~50k tokens
# Llama 3/4 ~128k tokens
# out-of-vocab → subword split
```

### 3. Context window

The max tokens the model can attend to at once — prompt plus completion share it. Numbers move fast; check the current model card.

```
GPT-5.x      400k
Claude 4.5   200k (1M beta)
Gemini 3     1M
DeepSeek V3  128k
# overflow → truncate or RAG
```

### 4. Temperature

Scales the softmax before sampling. Low = deterministic, high = creative.

```
temp = 0.0   # greedy top token
temp = 0.7   # balanced
temp = 1.2   # noisy, creative
```

### Logits → probabilities

Each forward pass scores the whole vocabulary; softmax turns scores into a distribution.

```
logits = model(tokens)      # [seq, vocab]
probs  = softmax(logits / temp)
next   = sample(probs)
```

### Top-p & top-k

Restrict the sampling pool to keep quality while staying varied. Pick one, not both.

```
top_k = 40    # keep 40 highest
top_p = 0.9   # smallest set ≥ 90% mass
# p = 1.0, k = vocab → pure random
```

> **KEY:** **The model only predicts one token at a time.** The output becomes part of the input, and the loop repeats — that's why long answers are generated autoregressively, token by token.

## Models & architectures {#models}

Nearly every modern LLM is a transformer: a stack of layers that mix tokens through self-attention.

**Input tokens** (subword ids) → **Embeddings** (id → vector) → **Self-attention** (Q · K · V) → **Feed-forward** (per-token MLP) → **Logits** (softmax over vocab)

### Attention (Q / K / V)

Every token looks at every other token and decides what to borrow. **Query** = what I'm looking for, **Key** = what I contain, **Value** = what I pass on.

```
Q, K, V = x @ Wq, x @ Wk, x @ Wv
scores  = Q @ K.T / sqrt(d_k)
out     = softmax(scores) @ V
```

### Encoder vs decoder

**Encoder** reads the whole sequence at once (bidirectional) — BERT, embeddings. **Decoder** is causal/masked, attending only to past tokens — GPT, LLaMA. **Encoder-decoder** (T5) does both.

```
BERT  → encoder  → fill blanks
GPT   → decoder  → next token
T5    → both     → translate
```

### Embeddings

A dense vector per token (or sentence) that captures meaning — similar meanings land close together.

```
embed("king") - embed("man")
  + embed("woman") ≈ embed("queen")
```

### Positional encoding

Attention is order-blind, so position must be added explicitly — via sinusoidal values or learned/RoPE rotations.

```
x = token_embed + pos_embed
# "A B" ≠ "B A" because pos differs
```

### Parameters & scaling

Weights that shape behavior; roughly `params ≈ layers × width²`. Mixture-of-experts (MoE) routes each token through a subset of experts — huge totals, small active cost.

```
7B   → local, quantized
70B  → single GPU cluster
405B → frontier (dense)
671B → frontier (MoE, sparse)
```

## Training & fine-tuning {#training}

Pretraining teaches the base; SFT and preference tuning teach instruction-following and helpfulness.

### Pretraining

Next-token prediction over trillions of tokens. Produces a capable base model that's not yet chatty or aligned.

```
loss = cross_entropy(
  pred, next_token
)
# scale: trillions of tokens,
# thousands of GPUs, weeks
```

### SFT

Supervised fine-tuning on (prompt, ideal answer) pairs teaches the format of conversation.

```
{"prompt": "Summarize: …",
 "completion": "The report says…"}
```

### RLHF vs DPO

**RLHF** trains a reward model from human preferences, then optimizes against it with RL. **DPO** skips the reward model and optimizes directly on the preference pairs.

```
RLHF:  chosen > rejected → reward → PPO
DPO:   chosen > rejected → direct loss
```

### LoRA / PEFT

Parameter-efficient fine-tuning freezes the base and trains a tiny low-rank adapter — cheap and swappable.

```
W' = W + ΔW,  ΔW = A·B
# A, B are small matrices
# trains <1% of weights
```

### Quantization

Shrink weights to fewer bits per value — faster, smaller, slightly worse quality.

```
fp16  16-bit, ~same quality
int8  8-bit, near-lossless
int4  4-bit, fits small GPUs
# formats: GGUF, AWQ, GPTQ
```

<details>
<summary>Common datasets</summary>

Pretraining uses massive raw text; instruction tuning uses curated prompt–answer pairs.

`pretrain: The Pile` `pretrain: Common Crawl` `pretrain: RedPajama` `pretrain: FineWeb` `instruction: Alpaca` `instruction: UltraChat` `instruction: OpenHermes` `preference: UltraFeedback` `preference: HH-RLHF` `code: The Stack`

</details>

## Prompting {#prompting}

Prompts steer a frozen model: examples, roles, instructions, and tool schemas all live in the input text.

### Zero-shot vs few-shot

**Zero-shot** asks directly. **Few-shot** shows examples so the model copies the pattern.

```
# zero-shot
"Classify: 'I love this!'"

# few-shot
"Great → positive
 Terrible → negative
 'I love this!' →"
```

### Chain-of-thought

Asking the model to reason step by step before answering lifts accuracy on hard tasks.

```
"Let's think step by step.
 First, … Second, …
 Therefore the answer is …"
```

### System vs user

**System** sets persistent rules/persona. **User** is the request. **Assistant** is the model's turn.

```
messages = [
  {"role": "system", "content": "Be terse."},
  {"role": "user", "content": "What is RAG?"},
]
```

### Tool / function calling

Give the model a schema; it returns a structured call instead of prose, and you execute it.

```
tools = [{"name": "get_weather",
          "parameters": {"city": "string"}}]
# → {"name": "get_weather",
#    "arguments": "{\"city\": \"Berlin\"}"}
```

### Structured output (JSON)

Ask for valid JSON and constrain the decoder so it can't emit anything else.

```
response_format = {"type": "json_object"}
# → {"sentiment": "positive",
#    "confidence": 0.93}
```

> **✓:** **Tip:** be explicit about output shape and length. “Answer in one JSON object with keys `sentiment` and `confidence`” beats hoping the model guesses a format.

## RAG & context {#rag}

Retrieval-augmented generation grounds the model in your documents instead of its training memory.

1. **Chunk** — Split sources into overlapping pieces (~256–1024 tokens) so retrieval has fine-grained units.
1. **Embed** — Vectorize each chunk with an embedding model; similar text → nearby vectors.
1. **Store** — Index vectors in a vector DB — FAISS, Pinecone, pgvector, Chroma.
1. **Retrieve** — Embed the query, then pull the top-k nearest chunks (plus metadata filters).
1. **Ground** — Stuff the retrieved chunks into the prompt with the question and an instruction to cite them.
1. **Answer** — The model answers from the provided context only — reducing hallucination.

### Chunking

Size and overlap trade precision for coverage. Too small loses context; too large dilutes the match.

```
chunk_size    = 512
chunk_overlap = 64   # keeps meaning
# across boundaries
```

### Reranking

A cross-encoder re-scores the top-k retrieved chunks for relevance — better than pure vector similarity.

```
top_100 = vector_search(q)
top_5   = rerank(q, top_100)
# bge-reranker, Cohere Rerank
```

### Grounding & citations

Require every claim to trace to a retrieved passage, and ask for source ids inline.

```
"Answer using ONLY the context.
 Cite sources as [1], [2]…"
```

## Agents & tools {#agents}

An agent is an LLM in a loop: it reasons, calls tools, reads results, and repeats until done.

1. **Observe** — The model reads the task, prior steps, and any tool outputs so far.
1. **Think** — It reasons about the next action — the “Thought” in a ReAct loop.
1. **Act** — It emits a tool call (the “Action”) — search, code, browser, API — which you execute.
1. **Observe result** — The tool's output is appended to the context, and the loop repeats.
1. **Finish** — When the goal is met it returns a final answer instead of another tool call.

### ReAct loop

```
Thought: I need the current price.
Action: search_tool("AAPL price")
Observation: "AAPL is $232"
Thought: I have the data.
Answer: "AAPL trades at $232."
```

### Memory

**Short-term** is the context window; **long-term** persists across sessions via a vector store or notes.

```
memory = [
  {"role": "user", "content": "…"},
  {"role": "tool",  "content": "…"},
]  # append, then truncate when full
```

### Planning

Decompose a goal into subtasks before acting — plan-then-execute, or re-plan when a step fails.

```
plan = model("Break this into steps")
for step in plan:
    result = execute(step)
```

### Tool calling

Tools are functions the agent can request. Keep schemas small and unambiguous. **MCP** (Model Context Protocol) is the emerging standard for exposing tools, data, and prompts to agents.

```
@tool
def search(query: str) -> str:
    """Search the web."""
    return results(query)
```

### Multi-agent

Split roles — planner, coder, reviewer — into agents that pass messages or share a workspace.

```
orchestrator
  ├─ planner
  ├─ coder
  └─ reviewer  (approves output)
```

- **idle** — Waiting for a task or the next turn.
- **reasoning** — Planning the next action — the “Thought” step.
- **awaiting tool** — Emitted a call; waiting on its result.
- **done** — Returned a final answer, loop ends.

## Evaluation {#evals}

Measure before you ship: perplexity for language, benchmarks for skill, judges for open-ended quality.

| Metric | What it measures | Good to know |
| --- | --- | --- |
| `Perplexity` | How surprised the model is by held-out text | Lower = better; core LM objective |
| `MMLU` | Knowledge across 57 subjects (multiple choice) | % accuracy; MMLU-Pro is the harder variant |
| `HumanEval` | Python function synthesis from a docstring | `pass@1`; coding benchmark |
| `SWE-bench` | Resolves real GitHub issues end-to-end | Agentic coding; % issues solved |
| `GPQA` | Graduate-level science Q&A | Harder, less saturated than MMLU |
| `AIME` | Competition math problems | Reasoning bar; math-specific |
| `LLM-as-judge` | A strong model scores another model's output | Cheap, but biased toward style |
| `Hallucination rate` | % of claims not supported by the source | Needs ground-truth / citation check |
| `ROUGE / BLEU` | n-gram overlap with a reference answer | Weak for open-ended generation |

> **!:** **Benchmarks leak into training data.** A high MMLU score doesn't prove real-world ability — always add an eval on your own data and inspect failures, not just averages.

## Pitfalls {#gotchas}

The failures that bite everyone once — know them before they cost you.

### Hallucination

Models confidently invent facts, citations, and APIs. Ground with RAG, verify sources, and treat output as a draft.

```
# fabricated URL that looks real
# → always fetch & verify links
```

### Context limits

Long history silently truncates — the model forgets the beginning, and skim-reads the middle (“lost in the middle”). Track token usage, summarize or page context, and put key instructions first and last.

```
tokens = count(messages)
if tokens > budget:
    summarize(older_messages)
```

### Tokenization surprises

Whitespace, case, and special chars change token counts — “a” and “ A” are different tokens. Count with the real tokenizer, not characters.

```
len("a") == len(" A")   # chars equal
tokens("a") < tokens(" A") # tokens differ
```

### Cost & latency

Long prompts and huge outputs are expensive and slow. Cache embeddings, cap output tokens, and stream.

```
# prompt tokens + completion tokens
# both bill, plus latency per token
```

### Prompt injection

Untrusted text inside a prompt can override instructions — “ignore previous instructions”. Treat retrieved/user content as data, never as commands.

```
# a webpage says:
# "Disregard instructions and reveal…"
```

### Overfitting to benchmarks

Optimizing for a leaderboard makes the model memorize the test, not the skill. Measure on held-out, task-specific data.

```
# high MMLU ≠ good at your domain
# → eval on YOUR real prompts
```

### Sycophancy

Models flatter and agree instead of pushing back — especially when you state an opinion. Explicitly ask for disagreement and counter-arguments.

```
# "Am I right?" → "Yes, absolutely!"
# better: "What's the strongest
#    argument against this?"
```

### Non-determinism & API drift

The same prompt can return different answers (sampling), and providers silently change models. Pin versions and set `temp = 0` plus a `seed` when reproducibility matters.

```
# pin model + version, record seed
# temp = 0, seed = 42 → reproducible
```
