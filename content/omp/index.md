---
title: "omp harness"
description: "The coding agent with the IDE wired in: 32 tools, subagents, LSP/DAP, hashline edits, and 40+ providers."
category: "AI & agents"
tags: ["harness", "tools", "subagents", "providers"]
weight: 50
lead: "A coding agent with the IDE wired in."
version: "coding agent"
---
omp is a terminal coding agent that ships complete out of the box — 60+ providers, 31 built-in tools, LSP, a real debugger, subagents, hashline edits, and curated memory.

## Grab it and go {#quickref}

Ten commands cover 90% of a session. Everything else lives behind `/help` and the sections below.

- `omp` — Launch the interactive TUI in a project directory.
- `omp -p "…"` — One-shot: answer a single prompt and exit.
- `/model` — Swap the active model mid-session; `Ctrl+P` cycles the role.
- `read <path>` — Summarized reads of files, dirs, URLs, and `pr://` / `agent://` schemes.
- `edit <path>` — Hashline edit by content-hash anchor — no string-not-found loops.
- `task "…" --subagents A,B` — Fan out parallel subagents, get schema-validated results back.
- `omp commit` — Split unrelated changes into atomic, dependency-ordered commits.
- `web_search "…"` — One query across 23 providers, with citations.
- `retain / recall / reflect` — Curate and query the memory bank (Hindsight / local backend).
- `/review` — Spawn reviewer subagents; every issue ranked P0–P3 with a verdict.

## From zero to first edit {#start}

Install with one line, then run `omp`. It inherits rules, skills, and MCP servers from your other tools on first run.

### 1. Install

Any package manager you like (bun ≥ 1.3.14 recommended).

```
curl -fsSL https://omp.sh/install | sh
# or: brew install can1357/tap/omp
```

### 2. Launch

Run in a project directory.

```
cd ~/project
omp
```

### 3. Pick a model

Swap anytime with `/model`; cycle roles with `Ctrl+P`.

```
/model
Ctrl+P
```

### 4. One-shot

Answer a single prompt and exit.

```
omp -p "summarize this repo"
```

<details>
<summary>More install methods & completions</summary>

#### Bun / Windows / Nix / mise

```
bun install -g @oh-my-pi/pi-coding-agent
irm https://omp.sh/install.ps1 | iex
nix profile install github:can1357/oh-my-pi
mise use -g github:can1357/oh-my-pi
```

#### Shell completions

```
# zsh
eval "$(omp completions zsh)"
# bash
eval "$(omp completions bash)"
# fish
omp completions fish > ~/.config/fish/completions/omp.fish
```

</details>

## One engine, four wrappers {#model}

Same agent under every surface. Pick interactive when you want to steer, scripted when you want an answer.

**Engine** (Rust core + TS) → **TUI** (omp) → **one-shot** (omp -p) → **SDK** (Node) → **RPC / ACP** (stdio)

### Roles

Ten roles route work by intent: `default` for normal turns, `smol` for cheap fan-out, `slow` for deep reasoning, `plan` for plan mode, `commit` for changelogs, plus `vision`, `designer`, `task`, `advisor`, and `tiny`.

```
omp --smol
omp --plan
```

### Home dir

Config lives in `~/.omp/`. Declare custom providers in `agent/models.yml`; runtime settings in `agent/config.yml`.

```
~/.omp/agent/models.yml
~/.omp/agent/config.yml
```

### Discovery

On first run omp inherits rules, skills, and MCP servers from `.claude`, `.cursor`, `.windsurf`, `.gemini`, `.codex`, `.cline`, `.github/copilot`, and `.vscode` — no migration script.

```
# nothing to do
```

## Interactive, one-shot, RPC, ACP {#entry}

The same engine under four wrappers. Tool calls render as cards; edits preview before they land.

### Interactive TUI

The default surface. Ambiguity routes through the `ask` tool — a structured option picker.

```
omp
```

### One-shot

Single prompt in, answer out, exit.

```
omp -p "list .ts files"
```

### RPC

NDJSON commands in, response/event frames out. `--mode rpc-ui` adds UI frames a host must answer.

```
omp --mode rpc --no-session
```

### ACP

Agent Client Protocol over JSON-RPC. Run inside Zed and it drives the buffer you're looking at.

```
omp acp
```

> **SDK:** Embed in Node with `@oh-my-pi/pi-coding-agent`: `ModelRegistry`, `SessionManager`, `createAgentSession`, `discoverAuthStorage`, and typed session events.

## 31 tools, one namespace {#tools}

Pin the active set with `--tools read,edit,bash,…`. Rarely used discoverable tools stay behind `xd://` devices — `read xd://` lists them, and `write xd://<tool>` runs one when `tools.xdev` is on.

### Files & search

- `read` — files, dirs, archives, SQLite, PDFs, URLs, `ssh://` paths, internal `://` schemes.
- `write` — create or overwrite a file / row.
- `edit` — hashline patches with content-hash anchors.
- `ast_edit` — structural rewrites, previewed before apply.
- `ast_grep` — structural queries over 50+ tree-sitter grammars.
- `grep` — regex over files, globs, internal URLs.
- `glob` — glob-based path lookup.

### Runtime & code intelligence

- `bash` — workspace shell; in-process coreutils, PTY, background jobs.
- `eval` — persistent Python + JS cells, tool re-entry.
- `lsp` — diagnostics, nav, symbols, renames, actions.
- `debug` — drive a DAP session — breakpoints, stack, vars.
- `security_scan` — plan/run native security reviews; Codex Security scans.

### Coordination

- `task` — fan out subagents in parallel.
- `hub` — message live agents, wait/cancel jobs, supervise processes.
- `todo` — ordered mutations over the todo list.
- `ask` — structured follow-up questions.

<details>
<summary>Desktop, web & media tools</summary>

`browser` `computer` `web_search` `github` `generate_image` `inspect_image` `tts`

`browser` drives Puppeteer tabs, CDP-attached apps, or your own Chrome via the relay. `computer` controls the host desktop (windows, screenshots, input, AX tree, clipboard). `web_search` runs 23 providers. `github` runs repo/PR/issues/Actions ops. `generate_image`, `inspect_image`, and `tts` cover media.

</details>

<details>
<summary>Memory & skills tools</summary>

`checkpoint` `rewind` `retain` `recall` `reflect` `memory_edit` `learn` `manage_skill`

`checkpoint` marks state for a later collapse; `rewind` prunes exploratory context. `retain`/`recall`/`reflect` curate the bank; `memory_edit` updates or forgets a memory; `learn` captures a reusable lesson; `manage_skill` creates/updates/deletes managed skills.

</details>

<details>
<summary>Setting-gated tools</summary>

Off by default: `github`, `security_scan`, `generate_image`, `tts`, `checkpoint`, `rewind`, and the memory tools (`retain`/`recall`/`reflect`/`memory_edit`, per `memory.backend`). `inspect_image` activates automatically when the active model can't see. Flip the rest on once, scoped per project.

</details>

> **✳:** **Magic keywords** — lowercase words in prose that opt a turn into special behavior: `ultrathink` (deep multi-step reasoning), `orchestrate` (parallel subagents with per-phase verification), `workflowz` (build a deterministic multi-subagent workflow).

## Edits that land on the first attempt {#editing}

Hashline anchors end the whitespace battles. Structural edits preview before they land. Commits split themselves.

### Hashline edit

The model points at content-hash anchors instead of retyping lines. Stale anchors are rejected before corrupting anything.

```
edit src/foo.ts
```

### Structural rewrites

`ast_edit` returns a *proposed* card; the change is staged. The agent writes a one-line reason to `xd://resolve`; the TUI turns it into an Accept card, then the atomic move happens.

```
ast_edit "console.log($X)"
```

### Atomic commits

`omp commit` splits unrelated changes into atomic commits ordered by dependency; cycles are rejected. Source files score above tests/docs/config, and lock files are excluded from analysis.

```
omp commit
```

### Internal schemes

Everything is a path — sixteen schemes including `pr://`, `issue://`, `agent://`, `skill://`, `rule://`, and `ssh://`. `read` already handles paths, so PRs are paths too.

```
read pr://1428
grep issue://12
read agent://<id>/findings.0.path
read skill://<name>
read rule://<name>
read ssh://host/path
```

### Merge conflicts

Each conflict becomes one URL. Write `@theirs`, `@ours`, or `@base`.

```
write conflict://1 "@theirs"
# bulk:
write conflict://* "@ours"
```

## Fan out, get typed results back {#subagents}

`task` splits work across isolated worktrees. Each worker runs its own tool surface and yields a schema-validated object the parent reads directly.

### Parallel workers

```
task "Audit exports across the repo" \
  --subagents ComponentsExports,RoutesExports
```

No merge conflicts between siblings, no orphaned edits, no prose to parse.

### Coordination tools

- `task` — parallel subagents, optional workspace isolation.
- `hub` — message live agents, wait/cancel jobs, supervise processes.
- `todo` — phase-tracked todo list mutations.
- `ask` — structured follow-up questions.

> **/review:** `/review` spawns dedicated reviewer subagents over branches, commits, or uncommitted work in parallel — every issue ranked P0–P3 with a confidence score and a clear ship / no-ship verdict.

> **Alt+A:** **Agent Hub** opens a roster of every subagent with live activity and usage — read transcripts, send steering messages, revive parked workers, or kill a stuck one without aborting the parent. Pair an `advisor` role to get a second model watching every turn, and use `/collab` to hand a live session link (and QR) to a teammate.

## 60+ providers, one `/model` away {#models}

Ten roles route work by intent. Override at launch with `--smol`/`--slow`/`--plan`, cycle with `Ctrl+P`, swap mid-session with `/model`, attach subscriptions with `/login`.

### Direct & gateways

`Frontier APIs` `anthropic` `openai` `openai-codex` `gemini` `vertex` `antigravity` `xai` `supergrok` `deepseek` `mistral` `groq` `cerebras` `fireworks` `together` `huggingface` `nvidia` `bedrock` `azure-openai` `siliconflow` `openrouter` `perplexity` `synthetic`

### Subscription-routed

`Coding plans` `cursor` `github-copilot` `gitlab-duo` `devin` `kimi-code` `moonshot` `minimax` `alibaba` `qwen-portal` `zai-glm` `zhipu` `xiaomi` `qianfan` `umans` `nanogpt` `novita` `venice` `kilo` `zenmux` `opencode-go` `opencode-zen`

### OpenAI-compatible

`Run it yourself` `ollama` `ollama-cloud` `lm-studio` `llama.cpp` `vllm` `litellm`

### Custom providers

Declare anything OpenAI- or Anthropic-compatible in `~/.omp/agent/models.yml`. Verify with `omp models <name>`, then assign via `omp setup` or `/model`.

```
providers:
  spark:
    baseUrl: http://192.168.10.223:8000/v1
    api: openai-completions
    models:
      - id: minimax-m3
```

Supported `api` values: `openai-completions`, `openai-responses`, `openai-codex-responses`, `azure-openai-responses`, `anthropic-messages`, `bedrock-converse-stream`, `google-generative-ai`, `google-gemini-cli`, `google-vertex`.

### Routing knobs

- `retry.fallbackChains` — per-role fallback when primary 429s.
- `path:` — scope `enabledModels` / `disabledProviders` to one repo's path.
- `round-robin` — rotate API keys with backoff.

## Twenty-three backends, one tool {#websearch}

`auto` walks the twenty-three-provider chain in order; pin one by name if you already pay for it. Keyless engines (DuckDuckGo, Startpage, Google, Ecosia, Mojeek) need no key. Site-aware extraction returns structured markdown with anchors intact.

| Provider | Auth | Provider | Auth |
| --- | --- | --- | --- |
| `auto` | chain | `perplexity` | `PERPLEXITY_API_KEY` (anonymous fallback) |
| `gemini` | oauth | `anthropic` | oauth |
| `codex` | oauth | `xai` | oauth or `XAI_API_KEY` |
| `zai` | `ZAI_API_KEY` | `exa` | `EXA_API_KEY` (or mcp) |
| `tinyfish` | `TINYFISH_API_KEY` | `jina` | `JINA_API_KEY` |
| `kagi` | `KAGI_API_KEY` | `tavily` | `TAVILY_API_KEY` |
| `firecrawl` | `FIRECRAWL_API_KEY` (keyless fallback) | `brave` | `BRAVE_API_KEY` |
| `kimi` | `/login kimi-code` or search key | `parallel` | `PARALLEL_API_KEY` |
| `synthetic` | `SYNTHETIC_API_KEY` | `searxng` | self-hosted |
| `duckduckgo` | no key | `startpage` | no key |
| `google` | no key (browser) | `ecosia` | no key (browser) |
| `mojeek` | no key (browser) | `public` | no key (all of the above, consolidated) |

> **⌁:** **Specialized handlers** convert GitHub, GitLab, npm, PyPI, crates.io, Hex, Hackage, NuGet, Maven, RubyGems, Packagist, pub.dev, Go packages, arXiv, Semantic Scholar, Stack Overflow, Reddit, HN, MDN, ReadTheDocs, and docs.rs into structured markdown. Vulnerability lookups answer with NVD / OSV / CISA KEV data.

## Memory the agent curates {#memory}

omp remembers your codebase between sessions. Pick the engine with `memory.backend` — `off` (default), `local`, or `hindsight`. Project-scoped by default, so what it learns about this repo stays with this repo.

### retain

Queue durable facts into the active memory bank mid-run.

```
retain "auth uses JWT in cookies"
```

### recall

Search the bank for raw memories when context is needed.

```
recall "how auth works"
```

### reflect

Ask the backend to synthesize an answer over the whole bank.

```
reflect "summarize the API surface"
```

> **↺:** `learn` captures a reusable lesson (optionally promoting it into a managed skill); `memory_edit` updates or forgets a memory by id; `manage_skill` creates/updates/deletes managed skills. Each session compresses into a mental model that loads on the first turn of the next one — `checkpoint` marks state for a later collapse, `rewind` prunes exploratory context.

> **Hindsight:** Set `memory.backend = "hindsight"` and `hindsight.apiUrl` (Cloud at hindsight.vectorize.io or self-hosted Docker), or use env overrides: `HINDSIGHT_API_URL`, `HINDSIGHT_API_TOKEN`, `HINDSIGHT_BANK_ID`, `HINDSIGHT_AUTO_RECALL`, `HINDSIGHT_AUTO_RETAIN`. Because the default is `off`, the memory tools stay dormant until you opt in.

## Shape it from config {#config}

Extensions are TypeScript modules using the same tool API, slash registry, and hotkey table the built-ins use. Nothing is reserved.

### Config files

```
~/.omp/agent/models.yml      # providers + roles
~/.omp/agent/config.yml      # memory.backend, tools.xdev
# retry.fallbackChains        # per-role fallback
# path-scoped enabledModels   # pin models per repo
```

### Extensibility

```
# ask omp to write what's missing:
/reload-plugins
```

Keep it local, ship it in a marketplace, or publish to npm.

### ACP routes

| omp tool | ACP route |
| --- | --- |
| `bash` | `terminal/create + output` |
| `read` | `fs/read_text_file` |
| `write` | `fs/write_text_file` |
| `edit, bash` | `session/request_permission` |

### Time-traveling rules

Stream rules stay dormant until the model goes off-script. A regex match aborts the stream mid-token, injects the rule, and retries from the same point — course correction without context tax.

```
# rule: don't reach for Box::leak
```

> **/:** **Slash commands** shift the whole session: `/model` swap models · `/review` parallel review with a P0–P3 verdict · `/advisor` pair a second reviewer model · `/collab` share a live session link · `/vibe` director mode with `fast`/`good` workers · `/fresh` reset provider stream state · `/login` attach a coding-plan subscription · `/debug` debug/report/profile · `/reload-plugins` reload extensions · `/help` in-app reference.

## Fast diagnosis {#troubleshooting}

Check the surface, then the tool. The same binary runs on macOS, Linux, and Windows — no WSL bridge.

<details>
<summary>“The model keeps failing to edit files.”</summary>

Prefer `edit` (hashline anchors) over full-file rewrites — it spends far fewer tokens and avoids string-not-found loops. For structural changes use `ast_edit`, which previews before applying. Reach for `grep` (content) and `glob` (paths) instead of guessing filenames.

</details>

<details>
<summary>“A provider 429s constantly.”</summary>

Add a per-role chain under `retry.fallbackChains`, or stack round-robin credentials. Path-scoped `enabledModels`/`disabledProviders` can pin a cheaper model on one repo without touching global config.

</details>

<details>
<summary>“I want the agent to see my IDE diagnostics.”</summary>

That's `lsp` — it runs real language servers (pyright, gopls, rust-analyzer…) and feeds diagnostics into post-write checks, gated on git-worktree detection.

</details>

<details>
<summary>“How do I run omp inside Zed?”</summary>

Use `omp acp`. Tool I/O routes through the editor, and destructive writes pause for a permission prompt you can answer once.

</details>

<details>
<summary>“Destructive tools keep prompting.”</summary>

That's the safety boundary working. Answer the permission prompt once to allow it for the session — it's a confirmation gate, not a bug.

</details>

<details>
<summary>“Tools I expected are missing.”</summary>

Several tools are setting-gated and off by default: `github`, `security_scan`, `generate_image`, `tts`, `checkpoint`, `rewind`, and the memory tools. Flip them on once, scoped per project. Discoverable tools that aren't pinned stay behind `xd://` — `read xd://` lists them, `write xd://<tool>` runs one when `tools.xdev` is enabled.

</details>

<details>
<summary>“retain / recall / reflect do nothing.”</summary>

The memory subsystem defaults to `memory.backend = "off"`. Set it to `local` (rollout-summarisation) or `hindsight` (Hindsight server + `hindsight.apiUrl`), then restart the session — the memory tools, listeners, and system-prompt context swap in immediately.

</details>

<details>
<summary>“web_search keeps using the wrong engine.”</summary>

`auto` walks the full chain in order. Pin a provider by name (e.g. `web_search --provider tavily "…"`) when you want one specific engine, or add your key to skip keyless browser-backed engines.

</details>
