---
title: "Herdr"
description: "Persistent terminal workspaces, panes, agent states, remote sessions, automation, and plugins."
category: "AI & agents"
tags: ["workspace", "panes", "agents", "CLI"]
weight: 20
lead: "Keep every agent in sight."
version: "docs 0.8.2"
---
Herdr is a persistent terminal workspace manager for coding agents. Organize projects, split real terminal panes, watch agent state, detach safely, and come back later.

## The ten commands you'll reach for {#quickref}

The 80/20 of Herdr. Master these and the rest of this guide is detail.

- `herdr` — Launch or attach to the default session; run again to reattach after detaching.
- `herdr --session work` — Launch or attach to a named session.
- `herdr agent list` — See every live agent and its state at a glance.
- `herdr agent prompt reviewer "…"` — Send a prompt to a named agent; add --wait to block for a state.
- `herdr agent read reviewer --source recent-unwrapped` — Read an agent's transcript text for scripting.
- `herdr pane split --current --direction right` — Split the focused pane; use down for a horizontal split.
- `herdr pane run <pane> "npm run dev"` — Submit a shell command atomically (adds Enter for you).
- `herdr workspace create --cwd ~/api --label api` — Create a workspace (with its first tab and pane).
- `herdr worktree create --cwd ~/repo --branch feat/x` — Isolate parallel branch work in a Git worktree.
- `herdr status` — Inspect server and client state before debugging.

> **KEY:** **Detach, don't stop.** <kbd>prefix</kbd>+<kbd>q</kbd> disconnects only the client — agents keep running. <kbd>prefix</kbd>+<kbd>?</kbd> shows the live keymap; <kbd>prefix</kbd>+<kbd>c</kbd> opens a new tab.

## From zero to persistent workspace {#start}

Install Herdr, launch it in a project, start an agent normally, then detach without stopping anything.

### 1. Install

On this Mac, Homebrew is the shortest path.

```
brew install herdr
```

### 2. Launch

Run from the directory where the work lives.

```
cd ~/project
herdr
```

### 3. Run an agent

Use the same CLI you already use. Herdr detects it.

```
omp
# or: claude, codex, opencode…
```

### 4. Detach safely

Leave all panes and agents running in the server.

<kbd>Ctrl</kbd>+<kbd>B</kbd> then <kbd>Q</kbd>

```
herdr  # reattach later
```

> **KEY:** **Prefix notation:** `prefix+c` means press <kbd>Ctrl</kbd> + <kbd>B</kbd>, release both, then press <kbd>C</kbd>. It is a sequence—not one three-key chord.

<details>
<summary>Other installation methods</summary>

#### Linux / macOS installer

```
curl -fsSL https://herdr.dev/install.sh | sh
```

#### Windows

```
curl.exe -fsSLo install.cmd https://herdr.dev/install.cmd && install.cmd && del install.cmd
```

#### mise

```
mise use -g herdr
```

#### Nix

```
nix profile install github:herdrdev/herdr/v0.x.y
```

</details>

## Five boxes. One simple hierarchy. {#model}

The server owns persistent sessions. A session contains project workspaces; workspaces contain tab layouts; tabs contain terminal panes; agents run inside panes.

**Session** (persistent server) → **Workspace** (one project/context) → **Tab** (one pane layout) → **Pane** (real terminal) → **Agent** (detected process)

### Session

A named background runtime. Attach many times; detach without killing processes. Use separate named sessions only when you need hard isolation.

```
herdr --session work
herdr session list
```

### Workspace + tab

A workspace is usually one repository. Tabs are alternate layouts within it: coding, tests, logs, review.

```
herdr workspace create --cwd ~/api --label api
herdr tab create --label tests
```

### Pane + agent

A pane is the terminal itself. An agent is a recognized interactive process currently occupying that terminal.

```
herdr pane split --current --direction right
herdr agent list
```

> **!:** **Detach is not stop.** `prefix+q` disconnects only your client. `herdr server stop` ends the session and its panes. Closing a pane ends the process running in that pane.

## What are you trying to do? {#use-cases}

Pick the route that matches the job. The command surface is broad; daily work only needs a small part of it.

- **Keep a coding agent alive** — Launch locally, detach, close the terminal, and reattach later.
- **Watch several agents** — Split panes or workspaces and use state labels to find the one needing input.
- **Work on another machine** — Run inside a normal SSH shell, from a phone, or attach with a local thin client.
- **Isolate parallel branches** — Create and group Git worktrees without mixing agent edits.
- **Orchestrate agents** — Create topology, launch named agents, prompt, wait, read results.
- **Add reusable workflows** — Install or link plugins with actions, hooks, logs, and managed panes.

## You can learn Herdr without shortcuts. {#mouse}

Herdr is mouse-native. Most layout management is discoverable through clicks, borders, and context menus.

### 01. Focus and switch

Click a pane, tab, workspace, or agent. Clicking an agent focuses the pane that hosts it.

### 02. Split and manage

Right-click inside a pane for splits and pane actions. Right-click workspace and tab rows for their actions.

### 03. Resize

Drag the divider between two panes. The split ratio updates immediately.

### 04. Copy text

Drag-select to copy automatically. Double-click a token to copy it directly. No `Ctrl+C` required.

### 05. Open links

Ctrl-click OSC 8 links and visible HTTP(S) URLs. On macOS with mouse capture, use Ctrl-click rather than Cmd-click.

### 06. Pass right-click through

For a mouse-aware pane app, choose **Send right-clicks to pane**. Right-click the pane frame to reopen Herdr’s menu.

## The complete daily keymap {#keyboard}

Defaults are prefix-first so Herdr does not steal keys from shells, editors, or agents. Press `prefix+?` inside Herdr for the authoritative active map.

Example: split right
<kbd>Ctrl</kbd>+<kbd>B</kbd> release, then <kbd>V</kbd>
written as `prefix+v`

### Start with these five

- New tab — <kbd>prefix</kbd><kbd>C</kbd>
- Split right / down — <kbd>prefix</kbd><kbd>V</kbd>/<kbd>-</kbd>
- Move between panes — <kbd>prefix</kbd><kbd>H J K L</kbd>
- Workspace picker — <kbd>prefix</kbd><kbd>W</kbd>
- Detach — <kbd>prefix</kbd><kbd>Q</kbd>

### Panes

- Focus direction — <kbd>prefix</kbd><kbd>H/J/K/L</kbd>
- Cycle next / previous — <kbd>prefix</kbd><kbd>Tab</kbd>/<kbd>Shift Tab</kbd>
- Swap direction — <kbd>prefix</kbd><kbd>Shift H/J/K/L</kbd>
- Zoom — <kbd>prefix</kbd><kbd>Z</kbd>
- Resize mode — <kbd>prefix</kbd><kbd>R</kbd>
- Rename / close — <kbd>prefix</kbd><kbd>Shift P</kbd>/<kbd>X</kbd>

### Tabs

- New tab — <kbd>prefix</kbd><kbd>C</kbd>
- Next / previous — <kbd>prefix</kbd><kbd>N</kbd>/<kbd>P</kbd>
- Jump to 1–9 — <kbd>prefix</kbd><kbd>1…9</kbd>
- Rename — <kbd>prefix</kbd><kbd>Shift T</kbd>
- Close — <kbd>prefix</kbd><kbd>Shift X</kbd>

### Workspaces + UI

- New workspace — <kbd>prefix</kbd><kbd>Shift N</kbd>
- New worktree — <kbd>prefix</kbd><kbd>Shift G</kbd>
- Rename / close — <kbd>prefix</kbd><kbd>Shift W</kbd>/<kbd>Shift D</kbd>
- Session navigator — <kbd>prefix</kbd><kbd>G</kbd>
- Toggle sidebar — <kbd>prefix</kbd><kbd>B</kbd>

### Help + text

- Keybinding help — <kbd>prefix</kbd><kbd>?</kbd>
- Settings — <kbd>prefix</kbd><kbd>S</kbd>
- Copy mode — <kbd>prefix</kbd><kbd>[</kbd>
- Edit scrollback — <kbd>prefix</kbd><kbd>E</kbd>
- Reload config — <kbd>prefix</kbd><kbd>Shift R</kbd>
- Open notification target — <kbd>prefix</kbd><kbd>O</kbd>

### Copy mode

- Move — <kbd>H/J/K/L</kbd><kbd>W/B/E</kbd>
- Search forward/back — <kbd>/</kbd>/<kbd>?</kbd>
- Repeat search — <kbd>N</kbd>/<kbd>Shift N</kbd>
- Start selection — <kbd>V</kbd>or<kbd>Space</kbd>
- Copy — <kbd>Y</kbd>or<kbd>Enter</kbd>
- Exit — <kbd>Q</kbd>or<kbd>Esc</kbd>

## Know who is working—and who is waiting. {#agents}

Herdr detects supported coding agents from terminal state and shows lifecycle status across every workspace.

- **working** — The agent is actively processing or generating output.
- **blocked** — Herdr recognized an approval prompt or question that needs you.
- **done** — Background work completed in a tab you have not viewed yet.
- **idle** — Ready for another prompt and already seen in the focused UI.
> **?:** `unknown` means an agent exists but Herdr cannot classify its state confidently. It does **not** mean success. Read the pane before acting.

### Manual launch

Start an agent normally in a pane. Herdr detects it. Address unnamed agents by pane ID, or assign a readable name.

```
omp
herdr agent list
herdr agent rename w1:p2 reviewer
```

### Managed launch

Create a shell pane first, then let Herdr start and name a supported agent in it.

```
herdr agent start reviewer \
  --kind omp \
  --pane w1:p2
```

### Prompt and wait

Send a prompt and optionally wait for a settled state. Specify exact acceptable states when correctness depends on them.

```
herdr agent prompt reviewer \
  "Review the current diff" \
  --wait --until done --until idle \
  --timeout 120000
```

### Inspect and interact

Read unwrapped transcript text; use logical keys for approval or UI navigation.

```
herdr agent read reviewer \
  --source recent-unwrapped --lines 120

herdr agent send-keys reviewer esc
```

<details>
<summary>Supported managed agent kinds</summary>

`pi` `claude` `codex` `gemini` `cursor` `devin` `agy` `cline` `omp` `mastracode` `opencode` `copilot` `kimi` `kiro` `droid` `amp` `grok` `hermes` `kilo` `qodercli` `qwen` `maki`

Names must match `[a-z][a-z0-9_-]{0,31}` and be unique among live agents.

</details>

## Copy-paste recipes for real work {#workflows}

These cover local development, named sessions, branch isolation, services, reviews, and shutdown.

<details>
<summary>Daily local workflow: code, detach, return</summary>

```
cd ~/project
herdr                         # launch/attach default session
# Run your shell, editor, agent, dev server normally.
# Detach in the UI: Ctrl+B, then Q
herdr                         # reattach later
herdr status                  # inspect server/client state
herdr server stop             # only when you truly want to end it
```

</details>

<details>
<summary>Named sessions: hard separation between contexts</summary>

```
herdr --session work
herdr --session personal

herdr session list
herdr session attach work
herdr session stop work
herdr session delete work
```

Use workspaces inside one session for ordinary project separation. Named sessions are useful when you need independent servers or lifecycles.

</details>

<details>
<summary>Parallel branch work with Git worktrees</summary>

```
herdr worktree create \
  --cwd ~/project \
  --branch feat/api-cache \
  --base main \
  --label api-cache \
  --focus

herdr worktree list --cwd ~/project
herdr worktree open --cwd ~/project --branch feat/api-cache

# Close Herdr state only:
herdr workspace close <workspace_id>

# Remove checkout; branch is never deleted:
herdr worktree remove --workspace <workspace_id>
```

If Git refuses to remove a dirty checkout, Herdr requires `--force`. Review uncommitted work first.

</details>

<details>
<summary>Run a service and wait for readiness</summary>

```
herdr pane run w1:p3 "npm run dev"
herdr pane wait-output w1:p3 \
  --regex "ready|listening|Local:" \
  --source recent-unwrapped \
  --timeout 120000

herdr pane read w1:p3 --source recent-unwrapped --lines 80
```

Use pane output waits for servers, tests, and ordinary commands. Use `agent wait` for coding agents.

</details>

<details>
<summary>Open a review pane beside the current agent</summary>

```
split=$(herdr pane split --current --direction right --no-focus)
review_pane=$(printf '%s\n' "$split" | jq -r '.result.pane.pane_id')

herdr agent start reviewer --kind codex --pane "$review_pane"
herdr agent prompt reviewer "Review the current diff" --wait --timeout 120000
herdr agent read reviewer --source recent-unwrapped --lines 120
```

</details>

<details>
<summary>Safe shutdown and deletion choices</summary>

| Intent | Action | What survives |
| --- | --- | --- |
| Leave UI, keep everything running | `prefix+q` | Session, layouts, terminals, processes |
| Close one terminal | `herdr pane close <id>` | Other panes; target process ends |
| Close workspace state | `herdr workspace close <id>` | Repository files; worktree checkout remains |
| Stop a named session | `herdr session stop <name>` | Persisted session record may remain |
| Delete a session record | `herdr session delete <name>` | Unrelated sessions |
| End default server and panes | `herdr server stop` | Files on disk only |

</details>

## The command map {#cli}

Most commands print JSON for deterministic scripting. CLI misuse exits 2; timeout/server errors emit JSON on stderr and exit 1.

<details>
<summary>Launch, status, updates, completion, and API</summary>

- `herdr` — Launch or attach to the default session.
- `herdr --session work` — Launch or attach to a named session.
- `herdr --remote workbox` — Attach through SSH using local keybindings.
- `herdr --remote workbox --remote-keybindings server` — Use the remote server’s keybindings.
- `herdr --remote workbox --handoff` — Opt into supported live server handoff.
- `herdr --no-session` — Single-process escape hatch without persistence.
- `herdr status [server|client]` — Inspect overall, server, or client state.
- `herdr --default-config` — Print the full commented default config.
- `herdr update [--handoff]` — Update direct installs; package-manager installs update there.
- `herdr channel show|set stable|set preview` — Inspect or change direct-install update channel.
- `herdr completion zsh|bash|fish|powershell|elvish` — Print a shell completion script. `completions` is an alias.
- `herdr api schema [--json|--output PATH]` — Inspect or export the socket protocol schema.
- `herdr --version` — Print installed version.

</details>

<details>
<summary>Server, notifications, and sessions</summary>

```
herdr server
herdr server stop
herdr server reload-config
herdr server agent-manifests [--json]
herdr server update-agent-manifests [--json]
herdr server reload-agent-manifests

herdr notification show <title> \
  [--body TEXT] \
  [--position top-left|top-right|bottom-left|bottom-right] \
  [--sound none|done|request]

herdr session list [--json]
herdr session attach <name>
herdr session stop <name> [--json]
herdr session delete <name> [--json]
```

</details>

<details>
<summary>Workspaces</summary>

```
herdr workspace list
herdr workspace create [--cwd PATH] [--label TEXT] \
  [--env KEY=VALUE] [--focus|--no-focus]
herdr workspace get <workspace_id>
herdr workspace focus <workspace_id>
herdr workspace rename <workspace_id> <label>
herdr workspace report-metadata <workspace_id> --source ID \
  [--token NAME=VALUE] [--clear-token NAME] \
  [--seq N] [--ttl-ms N]
herdr workspace close <workspace_id>
```

Creation returns workspace, first tab, and root pane IDs in JSON. Creation leaves focus unchanged unless `--focus` is supplied.

</details>

<details>
<summary>Git worktrees</summary>

```
herdr worktree list [--workspace ID | --cwd PATH]
herdr worktree create [--workspace ID | --cwd PATH] \
  [--branch NAME] [--base REF] [--path PATH] [--label TEXT] \
  [--focus|--no-focus]
herdr worktree open [--workspace ID | --cwd PATH] \
  (--path PATH | --branch NAME) [--label TEXT] [--focus|--no-focus]
herdr worktree remove --workspace ID [--force]
```

`workspace close` only closes Herdr state. `worktree remove` deletes the checkout through Git but never deletes the branch.

</details>

<details>
<summary>Tabs</summary>

```
herdr tab list [--workspace <workspace_id>]
herdr tab create [--workspace <workspace_id>] [--cwd PATH] \
  [--label TEXT] [--env KEY=VALUE] [--focus|--no-focus]
herdr tab get <tab_id>
herdr tab focus <tab_id>
herdr tab rename <tab_id> <label>
herdr tab close <tab_id>
```

Closing a workspace’s last tab also closes that workspace.

</details>

<details>
<summary>Pane topology and layout</summary>

```
herdr pane list [--workspace <workspace_id>]
herdr pane current [--pane ID|--current]
herdr pane get <pane_id>
herdr pane layout [--pane ID|--current]
herdr pane process-info [--pane ID|--current]
herdr pane neighbor --direction left|right|up|down [--pane ID|--current]
herdr pane edges [--pane ID|--current]
herdr pane focus --direction left|right|up|down [--pane ID|--current]
herdr pane resize --direction left|right|up|down [--amount FLOAT] [--pane ID|--current]
herdr pane zoom [<pane_id>|--pane ID|--current] [--toggle|--on|--off]
herdr pane rename <pane_id> <label>|--clear
herdr pane input [<pane_id>|--pane ID|--current] --right-click herdr|pane
herdr pane split [<pane_id>|--pane ID|--current] \
  --direction right|down [--ratio FLOAT] [--cwd PATH] \
  [--env KEY=VALUE] [--right-click herdr|pane] [--focus|--no-focus]
herdr pane swap --direction left|right|up|down [--pane ID|--current]
herdr pane swap --source-pane ID --target-pane ID
herdr pane move <pane_id> --tab <tab_id> --split right|down \
  [--target-pane ID] [--ratio FLOAT] [--focus|--no-focus]
herdr pane move <pane_id> --new-tab [--workspace ID] [--label TEXT] [--focus|--no-focus]
herdr pane move <pane_id> --new-workspace [--label TEXT] [--tab-label TEXT] [--focus|--no-focus]
herdr pane close <pane_id>
```

Inside Herdr, `--current` resolves from `HERDR_PANE_ID`. An omitted split target uses the UI-focused pane.

</details>

<details>
<summary>Pane input, output, and waits</summary>

```
herdr pane read <pane_id> \
  [--source visible|recent|recent-unwrapped|detection] \
  [--lines N] [--format text|ansi] [--ansi] [--raw]

herdr pane send-text <pane_id> <text>
herdr pane send-keys <pane_id> <key> [key ...]
herdr pane run <pane_id> <command>

herdr pane wait-output <pane_id> \
  (--match <text> | --regex <pattern>) \
  [--source visible|recent|recent-unwrapped] \
  [--lines N] [--timeout MS] [--raw]
```

| Read source | Best use |
| --- | --- |
| `visible` | Current rendered screen; UI feedback loops. |
| `recent` | Recent scrollback with terminal wrapping. |
| `recent-unwrapped` | Logs, transcripts, and stable text parsing. |
| `detection` | Bottom-buffer snapshot used for agent-state detection. |

`pane run` submits a command plus Enter atomically and is preferred over separate text/key sends.

</details>

<details>
<summary>Agents</summary>

```
herdr agent list
herdr agent get <target>
herdr agent read <target> [--source visible|recent|recent-unwrapped|detection] \
  [--lines N] [--format text|ansi] [--ansi]
herdr agent send-keys <target> <key> [key ...]
herdr agent prompt <target> <text> \
  [--wait] [--until STATUS]... [--timeout MS]
herdr agent rename <target> <name>|--clear
herdr agent focus <target>
herdr agent wait <target> [--until STATUS]... [--timeout MS]
herdr agent attach <target> [--takeover]
herdr agent start <name> --kind KIND --pane ID \
  [--timeout MS] [-- <agent-args...>]
herdr agent explain <target> [--json|--verbose]
herdr agent explain --file PATH --agent LABEL [--json|--verbose]
```

A target is a unique live agent name or the pane ID hosting it. Bare agent-kind labels are not targets.

</details>

<details>
<summary>Direct terminal attach and streams</summary>

```
herdr terminal attach <terminal_id> [--takeover]
herdr terminal session control <target> [--takeover] [--cols N] [--rows N]
herdr terminal session observe <target> [--cols N] [--rows N]
herdr terminal title set <title>
herdr terminal title clear
```

Detach from direct attach with `ctrl+b q`. Send a literal `ctrl+b` with `ctrl+b ctrl+b`. Observe streams are read-only; one controller owns writable control at a time.

</details>

<details>
<summary>Integrations</summary>

```
herdr integration install <agent>
herdr integration uninstall <agent>
herdr integration status [--outdated-only]
```

Install an integration for improved lifecycle accuracy. Supported install targets include `pi`, `omp`, `claude`, `codex`, `copilot`, `devin`, `droid`, `kimi`, `opencode`, `kilo`, `hermes`, `qodercli`, `qwen`, `cursor`, `mastracode`, and `grok`.

</details>

## Run Herdr where the code lives. {#remote}

Choose between a normal remote shell and a local thin client. Both attach to the persistent Herdr server on the remote machine.

### Plain local work

`Local machine`
```
cd ~/project
herdr
```

Best when code, credentials, agents, and terminal are all on one machine.

### Normal SSH first

`SSH / phone`
```
ssh you@server
herdr
```

Simplest remote path. Herdr runs entirely on the server. Good for phone and tablet SSH clients.

### Attach from local terminal

`Thin client`
```
herdr --remote workbox
herdr --remote ssh://you@server:2222
```

Remote agents, local rendering and keybindings. Can bridge local clipboard image paste.

| Need | Use | Reason |
| --- | --- | --- |
| Existing SSH habit, phone, simplest setup | `ssh host`, then `herdr` | Everything runs remotely; behaves like a traditional multiplexer. |
| Remote work that feels local | `herdr --remote host` | Local thin client streams the remote session and keeps local keybindings. |
| Remote server keybindings | `--remote-keybindings server` | Overrides the default local-keybinding behavior. |
| Repeat host/user/port | SSH config alias | Use `Host workbox`, then attach by short name. |

> **SSH:** Detach with `prefix+q` before ending the connection. A network drop also leaves the remote Herdr server and panes running.

## Topology first. Agent second. {#automation}

Herdr separates terminal layout from agent lifecycle. Create a workspace/pane, launch into an available shell, prompt, wait, then read.

1. **Create topology** — Use `workspace create`, `tab create`, and `pane split`. Capture returned IDs from JSON.
1. **Start and name an agent** — `agent start` requires an available interactive shell pane and waits until the expected agent owns it.
1. **Send a prompt** — `agent prompt` submits text safely. Add `--wait` only when you need a settled lifecycle state.
1. **Wait or react** — Wait for `idle`, `done`, or `blocked`. Use exact `--until` states for machine decisions.
1. **Collect evidence** — Read `recent-unwrapped` output. Reading does not mark unseen background completion as seen.

### Complete orchestration example

```
created=$(herdr workspace create \
  --cwd ~/project --label api --no-focus)

pane_id=$(printf '%s\n' "$created" | \
  jq -r '.result.root_pane.pane_id')

split=$(herdr pane split "$pane_id" \
  --direction right --no-focus)

review_pane=$(printf '%s\n' "$split" | \
  jq -r '.result.pane.pane_id')

herdr agent start reviewer \
  --kind codex --pane "$review_pane"

herdr agent prompt reviewer \
  "Review the current diff" \
  --wait --timeout 120000

herdr agent read reviewer \
  --source recent-unwrapped --lines 120
```

### Choose the correct primitive

| Goal | Command |
| --- | --- |
| Submit shell command | `pane run` |
| Wait for server/test text | `pane wait-output` |
| Submit agent turn | `agent prompt` |
| Wait for lifecycle state | `agent wait` |
| Interact with terminal UI | `agent send-keys` |
| Read stable log text | `agent read --source recent-unwrapped` |
| Watch raw terminal stream | `terminal session observe` |

> **!:** `agent prompt --wait` tracks lifecycle, not a unique turn ID. If the agent is already working, completion of that active work can satisfy the wait.

## Change behavior without changing the model. {#config}

Herdr works without a config file. Add one for custom keys, shell behavior, remote policy, themes, sidebar, notifications, and metadata.

### Config locations

```
# Linux and macOS
~/.config/herdr/config.toml

# Windows
%APPDATA%\herdr\config.toml
```

```
herdr --default-config
herdr server reload-config
```

### Useful environment variables

| `HERDR_CONFIG_PATH` | Override config path. |
| --- | --- |
| `HERDR_SESSION` | Select session for CLI calls. |
| `HERDR_PANE_ID` | Current managed pane. |
| `HERDR_TAB_ID` | Current tab. |
| `HERDR_WORKSPACE_ID` | Current workspace. |
| `HERDR_LOG` | Log filter, e.g. `herdr=debug`. |
| `HERDR_DISABLE_SOUND` | Disable all sound playback. |

<details>
<summary>A practical starter config</summary>

```
onboarding = false

[terminal]
shell_mode = "auto"
new_cwd = "follow"

[worktrees]
directory = "~/.herdr/worktrees"

[remote]
manage_ssh_config = true

[keys]
prefix = "ctrl+b"
help = "prefix+?"
new_tab = "prefix+c"
next_tab = "prefix+n"
previous_tab = "prefix+p"
focus_pane_left = ["prefix+h", "ctrl+alt+h"]
focus_pane_down = ["prefix+j", "ctrl+alt+j"]
focus_pane_up = ["prefix+k", "ctrl+alt+k"]
focus_pane_right = ["prefix+l", "ctrl+alt+l"]
split_vertical = ["prefix+v", "ctrl+alt+d"]
split_horizontal = ["prefix+minus", "ctrl+alt+shift+d"]
zoom = ["prefix+z", "ctrl+alt+z"]
```

Direct `ctrl+alt` chords are broadly terminal-safe, but check operating-system and terminal bindings. Keep the prefix alternatives until the direct map is proven.

</details>

<details>
<summary>Shell completions</summary>

```
# Temporary zsh completion
source <(herdr completion zsh)

# Persistent zsh completion
mkdir -p ~/.zfunc
herdr completion zsh > ~/.zfunc/_herdr

# Add before compinit in ~/.zshrc:
fpath=(~/.zfunc $fpath)
autoload -Uz compinit
compinit
```

</details>

<details>
<summary>Reset old custom keys to current defaults</summary>

```
herdr config reset-keys
herdr server reload-config
```

Herdr backs up `config.toml`, removes custom key tables, and returns to built-in v2 defaults.

</details>

<details>
<summary>What's new in 0.8.2</summary>

This guide reflects the latest stable release (v0.8.2). Notable additions: `ui.window_title` keeps the outer terminal window title in sync with the active workspace and host; optional `keys.move_tab_previous` / `keys.move_tab_next` reorder the active tab; and the desktop tab bar accepts configurable right-aligned status entries. Qwen Code detection was also added. Exact syntax lives in `herdr --default-config`.

</details>

## Package repeatable terminal workflows. {#plugins}

Plugins are trusted local executables described by a manifest. They can expose actions, event hooks, managed panes, link handlers, and logs.

### Install and manage

```
herdr plugin install owner/repo[/subdir] [--ref REF] [--yes]
herdr plugin list [--plugin ID] [--json]
herdr plugin enable <plugin_id>
herdr plugin disable <plugin_id>
herdr plugin uninstall <plugin_id|owner/repo/subdir>
```

Install accepts GitHub shorthand only and shows a trust preview in interactive terminals.

### Local development

```
herdr plugin link <path> [--disabled]
herdr plugin unlink <plugin_id>
herdr plugin config-dir <plugin_id>
```

Link a directory containing `herdr-plugin.toml` or a direct manifest path. Unlink leaves source files untouched.

### Actions and logs

```
herdr plugin action list [--plugin ID]
herdr plugin action invoke <action_id> [--plugin ID]
herdr plugin log list [--plugin ID] [--limit N]
```

### Managed terminal panes

```
herdr plugin pane open \
  --plugin ID --entrypoint ID \
  [--placement overlay|popup|split|tab|zoomed] \
  [--width SIZE] [--height SIZE] \
  [--workspace ID] [--target-pane PANE] \
  [--direction right|down] [--cwd PATH] \
  [--env KEY=VALUE] [--focus|--no-focus]

herdr plugin pane focus <pane_id>
herdr plugin pane close <pane_id>
```

## Fast diagnosis {#troubleshooting}

Start with state, then inspect the exact pane or agent. Avoid restarting the server until you know a reload cannot solve it.

<details>
<summary>“My agent disappeared when I closed the terminal.”</summary>

Run `herdr` again. Closing the client normally leaves the background server alive. If the session is absent, check `herdr status server` and `herdr session list`. `--no-session` is intentionally non-persistent.

</details>

<details>
<summary>“A shortcut types into my shell instead.”</summary>

Prefix bindings are sequential: <kbd>Ctrl</kbd>+<kbd>B</kbd>, release, then the action key. Open `prefix+?` to inspect the active map. If a direct chord fails, the OS or outer terminal may consume it before Herdr sees it.

</details>

<details>
<summary>“Agent state is wrong or unknown.”</summary>

```
herdr integration status --outdated-only
herdr server agent-manifests --json
herdr server update-agent-manifests --json
herdr agent explain <target> --verbose
```

Install the official integration for that agent when available. Use `agent explain` to inspect the rule and evidence that produced the state.

</details>

<details>
<summary>“A config edit had no effect.”</summary>

```
herdr server reload-config
```

Most UI settings reload live; startup-only settings require a session restart. Invalid values fall back safely and produce a startup warning.

</details>

<details>
<summary>“A command targeted the wrong pane.”</summary>

Use explicit IDs in scripts. Inside a Herdr-managed pane, `--current` resolves through `HERDR_PANE_ID`. Omitting a target can use the UI-focused pane, which is convenient interactively but fragile in automation.

</details>

<details>
<summary>“Worktree removal refuses.”</summary>

Git found modified or untracked files. Inspect them before using `herdr worktree remove --workspace ID --force`. Removal deletes the checkout, never the branch.

</details>

<details>
<summary>“Remote attach cannot use my local clipboard image.”</summary>

If you SSH first and run Herdr remotely, the process cannot access your local desktop clipboard. Use `herdr --remote host` so a local thin client can bridge image paste.

</details>

<details>
<summary>“I updated but the version did not change.”</summary>

`herdr update` only applies to direct installs made with the shell installer. Homebrew, mise, and Nix installs update through their own package manager. Check the channel with `herdr channel show` and the installed build with `herdr --version`.

</details>

<details>
<summary>“I cannot stop or delete the default session.”</summary>

Pass the literal name `default`: `herdr session stop default` or `herdr session delete default`. Bare `herdr` attaches to the default session, but the stop and delete verbs need an explicit name.

</details>

<details>
<summary>“agent prompt --wait returned before my prompt finished.”</summary>

`--wait` watches lifecycle state, not a unique turn. If the agent was already working, that active work can satisfy the wait. Use exact `--until` states plus a `--timeout`, then confirm the result with `agent read` rather than trusting the wait alone.

</details>
