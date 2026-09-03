---
title: "Hermes Agent"
description: "Terminal-first coding agent: CLI, keybindings, slash commands, sessions, providers, and configuration."
category: "AI & agents"
tags: ["agent", "TUI", "slash cmds", "config"]
weight: 30
lead: "An agent that lives in the terminal."
version: "terminal agent"
---
Hermes Agent is a full terminal UI — multiline editing, slash-command autocomplete, session history, interrupt-and-redirect, and streaming tool output. Built for people who never leave the shell.

## Everything you reach for daily {#quickref}

The handful of commands and keys that cover most of a session — full detail in the sections below.

### Run it

- `hermes` — Start an interactive session (or `--tui`).
- `hermes -z "…"` — One-shot: prompt in, final answer out.
- `hermes -c [name]` — Resume most recent (matching) session.
- `hermes -r <id>` — Resume an exact session by ID/title.
- `hermes chat -q "…"` — Single non-interactive query, then exit.
- `hermes setup` — First-run wizard (providers & keys).

### In-session

- `/help` — List every slash command.
- `/model` — Show / switch model (`provider:model`).
- `/new` — Fresh session (`/reset` is the same).
- `/compress` — Summarize context now, manually.
- `/retry` — · Resend last turn · drop last exchange.
- `/quit` — Exit (`/exit`, `/q`).

### Keys

- Send — <kbd>Enter</kbd>
- Interrupt — <kbd>Ctrl C</kbd>
- New line — <kbd>Meta Enter</kbd>/<kbd>Esc Enter</kbd>
- Autocomplete — <kbd>Tab</kbd>
- Clear screen — <kbd>Ctrl L</kbd>
- History — <kbd>↑</kbd><kbd>↓</kbd>

## From zero to first prompt {#start}

Set up once with the wizard, then start chatting. One command for the easiest path.

### 1. Install

Grab the agent from the repo, then the wizard handles providers and keys.

```
# install via the official repo
# (NousResearch/hermes-agent)
```

### 2. First-run setup

One command runs the wizard: provider, API key, terminal backend. `--portal` does a one-shot Nous Portal OAuth.

```
hermes setup
hermes setup --portal   # one-shot Nous Portal OAuth
```

### 3. Start chatting

Default is an interactive session. A `-q` query runs once, then exits.

```
hermes
hermes chat -q "Summarize the latest PRs"
```

### 4. Exit & resume

Leave with <kbd>Ctrl</kbd>+<kbd>D</kbd> or `/quit`, come back later with `--continue`.

```
hermes --continue   # -c
```

> **KEY:** **Two surfaces:** `hermes` (the interactive session) and `hermes --tui` (modal TUI with mouse). Same engine, different surface. `--cli` forces the classic line-based REPL if your config defaults to TUI.

> **!:** **`hermes model` vs `/model`.** Run `hermes model` from your terminal (outside a session) to add providers and API keys. `/model` inside a session only switches between what's already set up.

## Three boxes. One home directory. {#model}

Everything lives under `~/.hermes/`. Sessions are stored in SQLite, and config is one YAML file.

**~/.hermes/** (home dir) → **config.yaml** (one config) → **.env** (credentials) → **state.db** (sessions) → **Session** (resumable turn history)

### Profile

An isolated Hermes instance with its own config, sessions, skills, and home. Use named profiles for hard separation between work and personal setups.

```
hermes profile create work --clone
hermes -p work chat
```

### Session

One conversation, stored in SQLite and fully resumable. The agent sees every prior message and tool call when you resume.

```
hermes --resume latest
hermes sessions list
```

### Config

A single `~/.hermes/config.yaml` controls display, compression, personalities, quick commands, and more. Many keys can be changed mid-session.

```
hermes config
hermes doctor
```

## Interactive, single-shot, or scripted {#running}

Same agent, three wrappers. Pick the one that matches the job.

### The default REPL

`Interactive`
```
hermes
```

Multiline editing, autocomplete, history, redirect mid-turn. `hermes --tui` for the modal TUI.

### One run, then exit

`Single query`
```
hermes chat -q "Summarize PRs"
```

`-q` runs one non-interactive query and exits. Plain `hermes` to stay in the session.

### Pure one-shot

`Scripted`
```
hermes -z "Capital of France?"
# → Paris.
```

Prompt in, final answer out — nothing else on stdout. Built for shell scripts and CI.

| Mode | Command | Behavior |
| --- | --- | --- |
| Interactive session | `hermes` | REPL/TUI; stays open. |
| Single query | `hermes chat -q "…"` | Non-interactive; answers and exits. |
| From file / stdin | `hermes chat --query-file prompt.txt` | Nothing shell-interpreted; safe for untrusted text. |
| Pure one-shot | `hermes -z "…"` | Only the final reply, plain text. |

### Useful `chat` options

| `-m, --model <model>` | Override the model for this run. |
| --- | --- |
| `--provider <provider>` | Force a provider (anthropic, openrouter, zai…). |
| `-t, --toolsets <csv>` | Enable toolsets, e.g. `web,terminal,skills`. |
| `-s, --skills <name>` | Preload skills (repeat or comma-separate). |
| `-Q, --quiet` | Suppress banner/spinner/tool previews — final response only. |
| `-v, --verbose` | Verbose output. |
| `--worktree, -w` | Start in an isolated git worktree. |
| `--checkpoints` | Snapshot files before destructive ops (enables `/rollback`). |
| `--yolo` | Skip dangerous-command approval prompts. |
| `--max-turns <N>` | Tool-calling iterations per turn (default 500). |

### Global options

| `-p, --profile <name>` | Use a named profile. |
| --- | --- |
| `-r, --resume <session>` | Resume by ID or title. |
| `-c, --continue [name]` | Resume most recent (matching) session. |
| `--in <dir>` | Start in a directory; scopes resume lookups. |
| `--ignore-user-config` | Ignore config.yaml, use built-in defaults. |
| `--ignore-rules` | Skip AGENTS.md / SOUL.md / memory / skills. |
| `--safe-mode` | Disable ALL customizations for troubleshooting. |
| `--pass-session-id` | Include session ID in the system prompt. |

## The daily keymap {#keyboard}

Modeled on Claude Code / Codex / OpenCode multiline conventions. New line is `Meta+Enter` (`Esc` then `Enter` also works). On Windows Terminal use `Ctrl+J` or `Ctrl+Enter` for a newline (`Alt+Enter` is captured by the terminal).

### Composing

- Send message — <kbd>Enter</kbd>
- New line — <kbd>Meta Enter</kbd>/<kbd>Esc Enter</kbd>/<kbd>Ctrl J</kbd>
- Edit in $EDITOR — <kbd>Ctrl G</kbd>/<kbd>Ctrl X Ctrl E</kbd>
- Stash draft (stack) — <kbd>Ctrl S</kbd>
- Accept suggestion — <kbd>Tab</kbd>
- Input history — <kbd>↑</kbd><kbd>↓</kbd>
- Paste image — <kbd>Alt V</kbd>

### Controlling

- Interrupt agent — <kbd>Ctrl C</kbd>
- Force exit (2×) — <kbd>Ctrl C</kbd>×2
- Exit session — <kbd>Ctrl D</kbd>
- Clear screen — <kbd>Ctrl L</kbd>
- Suspend (Unix) — <kbd>Ctrl Z</kbd>
- Voice record — <kbd>Ctrl B</kbd>
- Paste text — <kbd>Ctrl V</kbd>

### Shell mode

- Run shell command — <kbd>!</kbd><kbd>git status</kbd>
- Zero cost no LLM call
- Not in history context stays clean
- Approvals apply dangerous cmds still gated
> **!:** **Shell mode:** start a line with `!` to run it yourself without spending a model turn — `!git status`, `!pytest -x`. The command and its output never enter the conversation.

## Type `/` and pick {#slash}

Commands are case-insensitive (`/HELP` = `/help`). Installed skills also become slash commands automatically.

- `/help` — Show all available commands.
- `/model [provider:model]` — Show or switch model; `provider:` tab-completes.
- `/new` — · Start a fresh session (new ID + empty history).
- `/clear` — Clear the screen and start a new session (CLI only).
- `/retry` — Resend your last message.
- `/undo` — Drop the last user/assistant exchange from context.
- `/title <name>` — Name the current session.
- `/resume [name]` — Resume a previously-named session.
- `/compress` — Summarize context manually, now.
- `/rollback [n]` — List / restore filesystem checkpoints (needs `--checkpoints`).
- `/background` — · Run a prompt in a parallel background session.
- `/stop` — Kill running background processes.
- `/provider` — Show available providers + the active one.
- `/personality <name>` — Change tone (concise, pirate, kawaii…).
- `/reasoning [level|show|hide]` — none/low/minimal/medium/high/xhigh; show/hide the block.
- `/skin [name]` — Show or switch the active CLI skin.
- `/voice [on|off|tts|status]` — Voice input / spoken replies.
- `/verbose` — Cycle tool-preview verbosity.
- `/tools [list|disable|enable]` — Manage enabled tools.
- `/toolsets` — List available toolsets.
- `/skills [search|browse|inspect|install|list]` — Search, install, and manage skills.
- `/reload-mcp` — Reload MCP server connections from config.
- `/usage` — Token / cost stats for the current session.
- `/status` — Session info — gateway only; the CLI shows it in the banner.
- `/quit` — · · Exit the CLI.

<details>
<summary>Built-in personalities</summary>

`helpful` `concise` `technical` `creative` `teacher` `kawaii` `catgirl` `pirate` `shakespeare` `surfer` `noir` `uwu` `philosopher` `hype`

Reset with `/personality none` (`default` and `neutral` also work). Define your own under `personalities:` in config.yaml.

</details>

## Leave, come back, pick up where you stopped {#sessions}

Resuming restores the full conversation from SQLite — messages, tool calls, and responses.

### Resume

```
hermes --continue                # -c, most recent
hermes -c "my project"           # latest matching title
hermes --resume <session_id>     # -r, exact ID
hermes --resume latest           # same as -c
hermes --resume "refactoring auth"
hermes --resume latest --in ./dir
```

### Manage

```
hermes sessions list
hermes sessions browse
hermes sessions rename <id> <title>
hermes sessions delete <id>
hermes sessions export out.jsonl
hermes sessions prune --older-than 90d
hermes sessions stats
```

> **↺:** **Compression.** Long conversations auto-summarize near the context limit, keeping the first 3 and last 4 turns intact. A fast auxiliary model (default `google/gemini-3-flash-preview`) writes the summary. The 🗜️ badge in the status bar shows how many times compression fired.

## Any model, `/model` away {#models}

Set up providers from the terminal wizard, then switch freely mid-session.

### Add providers

Run from outside a session to add providers, run OAuth flows, and enter API keys.

```
hermes model
```

### Switch mid-session

Only switches between already-configured models. `provider:model` tab-completes.

```
/model anthropic/claude-opus-4.6
/model openrouter:anthropic/claude-opus-4.6
```

### Fallbacks

Configure fallback providers tried when the primary errors.

```
hermes fallback
```

<details>
<summary>Provider families (--provider)</summary>

`auto` `openrouter` `nous` `anthropic` `openai-codex` `copilot` `copilot-acp` `gemini` `deepseek` `xai` `qwen-oauth` `bedrock` `ollama-cloud` `lmstudio` `zai` `kimi-coding` `minimax` `minimax-cn` `alibaba` `nvidia` `openai-api` `huggingface` `opencode-zen` `opencode-free` `commandcode` `kilocode` `azure-foundry` `nebius-token-factory` `router` `…and more`

Use `hermes chat --provider anthropic -m anthropic/claude-opus-4.6` to force a provider for one run; `auto` lets Hermes pick. The full list is long — check `hermes chat --help` for the authoritative set.

</details>

## Change behavior without changing the model {#config}

Everything lives in `~/.hermes/config.yaml`. Credentials stay in `~/.hermes/.env`.

### Quick commands

Custom slash commands that run shell instantly, no LLM.

```
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader
  restart:
    type: alias
    target: /gateway restart
```

### Compression & auxiliary

```
compression:
  enabled: true
  threshold: 0.50   # compress at 50% context

auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"   # default fast summarizer
```

### Display

```
display:
  interface: cli          # or tui
  busy_input_mode: "interrupt"  # | queue | steer
  tool_preview_length: 80       # 0 = no limit
  cli_multiline_shortcuts: true
```

### Personalities

```
personalities:
  helpful: "You are a helpful assistant."
  pirate: "Arrr! Talk like a captain."
```

<details>
<summary>Shell completions</summary>

```
# zsh
hermes completion zsh >> ~/.zshrc
# bash
hermes completion bash >> ~/.bashrc
# fish
hermes completion fish > ~/.config/fish/completions/hermes.fish
```

</details>

## Hermes in pipelines {#scripting}

For shell scripts, CI, and cron, `hermes -z` is the purest entry point.

1. **One-shot** — `answer=$(hermes -z "summarize this" < file.txt)` — prompt in, final answer out, nothing else.
1. **Per-run overrides** — `hermes -z "…" --provider deepseek --model deepseek-chat`, or `HERMES_INFERENCE_MODEL=… hermes -z "…"`.
1. **Usage report** — `--usage-file /tmp/usage.json` writes tokens, cost, and session ID — even on failure.
1. **Send messages** — `hermes send` posts a one-shot to a messaging platform (Telegram, Discord, Slack…) with no agent loop.

### Read back usage

```
hermes -z "summarize this repo" \
  --usage-file /tmp/usage.json
jq .estimated_cost_usd /tmp/usage.json
```

### Query from a file

```
hermes chat --query-file - < prompt.txt
```

Nothing is shell-interpreted — quotes, `$(…)`, and backticks arrive verbatim.

## The `hermes` surface {#cli}

The most useful top-level commands. Run `hermes --help` for the complete, authoritative list.

- `hermes chat` — Interactive or one-shot chat with the agent.
- `hermes model` — Choose default provider + model (wizard).
- `hermes setup` — Setup wizard (add `--portal` for one-shot).
- `hermes auth` — Manage credentials — add, list, status, logout.
- `hermes status` — Show agent, auth, and platform status.
- `hermes doctor` — Diagnose config and dependency issues.
- `hermes config` — Show, edit, migrate, query config.
- `hermes profile` — Manage isolated profiles.
- `hermes skills` — Browse, install, publish, audit skills.
- `hermes tools` — Configure enabled tools per platform.
- `hermes plugins` — Manage plugins (install/enable/disable).
- `hermes mcp` — Manage MCP servers.
- `hermes memory` — Configure external memory provider.
- `hermes sessions` — Browse, export, prune, rename sessions.
- `hermes logs` — View, tail, filter log files.
- `hermes gateway` — Run/manage the messaging gateway service.
- `hermes send` — One-shot message to a platform, no LLM.
- `hermes cron` — Inspect and tick the scheduler.
- `hermes insights` — Token / cost / activity analytics.
- `hermes dashboard` — Web dashboard (config, keys, sessions).
- `hermes serve` — Headless backend server.
- `hermes update` — Pull latest code and reinstall.
- `hermes version` — Print the installed version.
- `hermes uninstall` — Remove Hermes Agent.
- `hermes completion` — Print shell completion scripts.
- `hermes security audit` — Supply-chain audit (OSV.dev).
- `hermes backup / import` — Back up / restore the Hermes home dir.

## Fast diagnosis {#troubleshooting}

Isolate whether a problem comes from your setup or from Hermes itself.

<details>
<summary>“Is this bug mine or Hermes'?”</summary>

```
hermes chat --safe-mode -q "repro the issue"
```

`--safe-mode` disables user config, rules, plugins, shell hooks, and MCP servers. If the bug disappears, it's in your setup.

</details>

<details>
<summary>“I only see OpenRouter models in /model.”</summary>

You've only configured OpenRouter. Exit the session and run `hermes model` from the terminal to add another provider.

</details>

<details>
<summary>“A config edit had no effect.”</summary>

Run `hermes config` to inspect, and `hermes doctor` to check for invalid values. Some startup-only settings need a session restart.

</details>

<details>
<summary>“Shift+Enter inserts a newline but I want it to send.”</summary>

Your terminal may not distinguish Shift+Enter. Use `Meta+Enter` / `Esc` then `Enter` / `Ctrl+J` for newlines, or disable multiline shortcuts via `display.cli_multiline_shortcuts: false`.

</details>

<details>
<summary>“The gateway keeps disconnecting on WSL.”</summary>

Prefer `hermes gateway run` (foreground) over `hermes gateway start` on WSL, and wrap it in tmux: `tmux new -s hermes 'hermes gateway run'`.

</details>

<details>
<summary>“`hermes chat -q` exited right after answering.”</summary>

That's expected: `-q` is non-interactive in current builds — one query, then exit. Use plain `hermes` (then type your message) for an ongoing session, or `hermes -z` for scripts.

</details>

<details>
<summary>“`/rollback` says there are no checkpoints.”</summary>

Filesystem checkpoints must be enabled first. Start the session with `hermes --checkpoints` (or `hermes chat --checkpoints`) so destructive file operations are snapshotted and restorable via `/rollback`.

</details>
