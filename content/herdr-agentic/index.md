---
title: "Agentic patterns with Herdr"
description: "Orchestrator-worker, reviewer loops, parallel worktrees, and blocked-state handling for driving agents."
category: "AI & agents"
tags: ["patterns", "orchestrator", "reviewer", "worktree"]
weight: 10
lead: "Orchestrate agents as a system."
version: "agentic"
---
Herdr turns a terminal into a controllable multi-agent runtime. Script the topology, start named agents, drive them with prompts, and wait on lifecycle state — all from the CLI.

## Quick reference {#quickref}

Eight commands cover most orchestration. Full recipes, wait semantics, and caveats live in the sections below.

### Create workspace

```
herdr workspace create \
  --cwd . --label api --no-focus
```

Reads `.result.root_pane.pane_id` — capture it with `jq`.

### Split a pane

```
herdr pane split --current \
  --direction right --no-focus
```

New pane ID is at `.result.pane.pane_id`.

### Start an agent

```
herdr agent start worker \
  --kind codex --pane w1:p1
```

Needs a free shell pane; 30s startup timeout. Args after `--` go to the agent.

### Prompt & wait

```
herdr agent prompt worker "…" \
  --wait --timeout 300000
```

`--wait` settles on `idle`/`done`/`blocked`; add `--until` to narrow.

### Wait for a state

```
herdr agent wait worker \
  --until blocked --timeout 60000
```

Use `--until` for one exact lifecycle state.

### Read transcript

```
herdr agent read worker \
  --source recent-unwrapped --lines 120
```

Unwrapped logs/transcripts; `--format ansi` keeps colors.

### Create worktree

```
herdr worktree create \
  --cwd . --branch feat/x \
  --base main --label feat/x
```

Opens an isolated checkout; the branch survives `worktree remove`.

### Approve / dismiss

```
herdr agent send-keys worker enter
herdr agent send-keys worker esc
```

`ctrl+c` cancels; `escape` is an alias for `esc`.

> **KEY:** **Read IDs, don't guess them.** Every create/split command prints JSON. Agent names must match `[a-z][a-z0-9_-]{0,31}` and stay unique among live agents — a bare kind label like `codex` is not a target.

## Agent topology {#start}

Build the shape first, then start agents inside it: a workspace owns tabs, tabs own panes, and each agent runs inside a pane.

**Workspace** (one project) → **Tab** (one layout) → **Pane** (real terminal) → **Agent** (named process)

### 1. Workspace

```
herdr workspace create \
  --cwd ~/project --label api --focus
```

### 2. Tab

```
herdr tab create --label tests
```

### 3. Pane

```
herdr pane split --current \
  --direction right --no-focus
```

### 4. Agent

```
herdr agent start builder \
  --kind omp --pane w1:p1
```

> **KEY:** **Capture the IDs.** `workspace create`, `tab create`, and `pane split` each print JSON with IDs. Parse them with `jq` so the next command targets the exact pane — the full recipe lives in [Orchestrator](#orchestrator).

## Orchestrator-worker {#orchestrator}

One controller shell drives many named agents: create topology, start workers, prompt, wait for a settled state, then read the transcript.

1. **Create topology** — `workspace create` then `pane split`; capture `root_pane.pane_id` from JSON.
1. **Start named agents** — `agent start` launches a supported kind into an available shell pane.
1. **Prompt and wait** — `agent prompt --wait` blocks until the agent settles on `idle`, `done`, or `blocked`.
1. **Read the result** — `agent read --source recent-unwrapped` returns stable transcript text.

### Full shell recipe

```
created=$(herdr workspace create \
  --cwd ~/project --label api --no-focus)

root_pane=$(printf '%s\n' "$created" | \
  jq -r '.result.root_pane.pane_id')

herdr agent start worker \
  --kind codex --pane "$root_pane"

herdr agent prompt worker \
  "Implement the ticket in TASK.md" \
  --wait --timeout 300000

herdr agent read worker \
  --source recent-unwrapped --lines 200
```

### Wait semantics

`--wait` blocks until the agent reaches a settled state or the timeout fires. The default settled set is `idle`, `done`, and `blocked` — repeat `--until` to narrow to exact states (or add `unknown`). On `agent prompt`, `--until` requires `--wait`.

| Flag | Effect |
| --- | --- |
| `--wait` | Block until a settled state (`idle`/`done`/`blocked`) or timeout. |
| `--until done` | Accept only the `done` state (repeatable). |
| `--until blocked` | Wait specifically for an approval prompt. |
| `--timeout MS` | Give up after MS milliseconds. |

> **KEY:** **One controller, many workers.** The orchestrator never types inside an agent pane — it only runs `agent` commands from its own shell and reads output back. Keep it that way so state stays machine-readable.

## Reviewer loop {#reviewer}

Split a review pane beside the worker and start a second agent whose only job is to read the diff and report.

### Split and start the reviewer

```
split=$(herdr pane split "$root_pane" \
  --direction right --no-focus)

review_pane=$(printf '%s\n' "$split" | \
  jq -r '.result.pane.pane_id')

herdr agent start reviewer \
  --kind codex --pane "$review_pane"
```

### Prompt, wait, read

```
herdr agent prompt reviewer \
  "Review the current diff" \
  --wait --timeout 120000

herdr agent read reviewer \
  --source recent-unwrapped --lines 120
```

> **TIP:** Any managed kind works as a reviewer — `codex` and `omp` are common picks. Split with `--no-focus` so the worker keeps keyboard focus while the reviewer runs beside it.

## Parallel agents & worktrees {#parallel}

Give each parallel agent its own Git worktree so their edits never collide, and address each by a unique name.

### Create an isolated worktree

```
herdr worktree create \
  --cwd ~/project \
  --branch feat/api-cache \
  --base main \
  --label api-cache \
  --focus

herdr worktree list --cwd ~/project
```

### Run agents side by side

```
herdr agent start cache \
  --kind omp --pane w1:p1
herdr agent start docs \
  --kind codex --pane w2:p1

herdr agent prompt cache "…" --wait
herdr agent prompt docs "…" --wait
```

| Intent | Command | What it does |
| --- | --- | --- |
| Close Herdr state only | `herdr workspace close <workspace_id>` | Leaves the checkout and files on disk. |
| Delete the checkout | `herdr worktree remove --workspace <workspace_id>` | Removes the checkout through Git; the branch is never deleted. |

> **!:** **Avoid edit collisions.** Two agents in the same checkout can overwrite each other's files. One worktree per parallel agent keeps each workspace's changes separate.

## Blocked state & approvals {#blocked}

When an agent hits an approval prompt it goes `blocked`. Detect it, approve with a key, then resume with a new prompt.

- **working** — Mid-turn. Check back after `--wait`.
- **blocked** — Approval prompt detected. Act now.
- **done** — Turn settled after approval.
- **idle** — Ready for the next prompt.
1. **Detect** — `herdr agent list` reports `blocked` — an approval prompt or question needs you.
1. **Approve** — `herdr agent send-keys builder enter` accepts; `esc` dismisses, `ctrl+c` cancels.
1. **Resume** — `herdr agent prompt builder "Continue" --wait` sends the next turn.
1. **Verify** — `herdr agent read builder --source recent-unwrapped` for context.

### Approve or dismiss

```
herdr agent send-keys builder enter    # approve
herdr agent send-keys builder esc      # dismiss
herdr agent send-keys builder ctrl+c   # cancel
```

### Resume with context

```
herdr agent read builder \
  --source recent-unwrapped --lines 120

herdr agent prompt builder \
  "Approved — continue." --wait
```

> **!:** **Prompting a blocked agent bounces.** `agent prompt --wait` on an already-`blocked` agent returns `agent_blocked` without sending input. Inspect the dialog and respond deliberately with `agent send-keys`.

## Lifecycle states {#states}

Five states describe an agent's lifecycle. `agent wait` blocks until the one you need; read before you act on `unknown`.

- **working** — Actively processing or generating output.
- **blocked** — An approval prompt or question needs you.
- **done** — Background work completed in a tab you have not viewed yet.
- **idle** — Ready for another prompt and already seen in the focused UI.
> **?:** `unknown` means an agent exists but Herdr cannot classify its state confidently — not success. Read the pane before acting.

### Wait for a state

```
# defaults to idle / done / blocked
herdr agent wait builder \
  --timeout 120000

# or one exact state
herdr agent wait builder \
  --until blocked --timeout 60000
```

### Wait, then act

```
if herdr agent wait builder \
     --until blocked --timeout 60000; then
  herdr agent send-keys builder enter
fi
```

> **!:** **`prompt --wait` tracks lifecycle, not turn ID.** If the agent is already working, completion of that active work can satisfy the wait before your new prompt finishes.

## Copy-paste recipes {#recipes}

Four self-contained scripts. Each creates or targets explicit IDs so they are safe to paste and adapt.

<details>
<summary>Service readiness: run and wait for output</summary>

```
herdr pane run w1:p3 "npm run dev"

herdr pane wait-output w1:p3 \
  --regex "ready|listening|Local:" \
  --source recent-unwrapped \
  --timeout 120000

herdr pane read w1:p3 \
  --source recent-unwrapped --lines 80
```

</details>

<details>
<summary>Full orchestrator script</summary>

```
set -euo pipefail

created=$(herdr workspace create \
  --cwd ~/project --label api --no-focus)
root_pane=$(printf '%s\n' "$created" | \
  jq -r '.result.root_pane.pane_id')

herdr agent start worker \
  --kind codex --pane "$root_pane"

herdr agent prompt worker "Implement TASK.md" \
  --wait --timeout 300000

herdr agent read worker \
  --source recent-unwrapped --lines 200
```

</details>

<details>
<summary>Reviewer script</summary>

```
split=$(herdr pane split "$root_pane" \
  --direction right --no-focus)
review_pane=$(printf '%s\n' "$split" | \
  jq -r '.result.pane.pane_id')

herdr agent start reviewer \
  --kind omp --pane "$review_pane"
herdr agent prompt reviewer \
  "Review the current diff" \
  --wait --timeout 120000
herdr agent read reviewer \
  --source recent-unwrapped --lines 120
```

</details>

<details>
<summary>Parallel worktree script</summary>

```
for branch in feat/api feat/web feat/db; do
  herdr worktree create \
    --cwd ~/project \
    --branch "$branch" \
    --base main \
    --label "$branch" \
    --no-focus
done

herdr worktree list --cwd ~/project

# Remove one checkout (branch survives):
herdr worktree remove --workspace <workspace_id>
```

Start one agent per worktree with a unique name, then `agent prompt` each in parallel from your orchestrator shell.

</details>

## Pitfalls {#gotchas}

Six behaviors that bite orchestrators once.

### Targets must be exact

A target is a unique live agent name or the pane ID hosting it. A bare agent-kind label (like `codex`) is not a target, and names must match `[a-z][a-z0-9_-]{0,31}`.

```
herdr agent prompt reviewer "…"   # name
herdr agent prompt w1:p2 "…"       # pane ID
```

### Use explicit IDs in scripts

Inside a pane, `--current` resolves via `HERDR_PANE_ID`; omitting a target can fall back to the UI-focused pane — fragile in automation.

```
herdr pane split "$root_pane" \
  --direction right --no-focus
```

### Reading does not mark done

`agent read` returns transcript text but does not mark unseen background completion as seen. The state stays until you view it in the UI.

```
herdr agent read worker \
  --source recent-unwrapped
```

### --wait is not a turn ID

`agent prompt --wait` can be satisfied by in-flight work: if the agent is already working, that completion may end the wait early. From another non-working state, Herdr must observe a lifecycle change within 5 s or it returns `agent_prompt_stalled`.

```
herdr agent prompt worker "…" \
  --wait --timeout 300000
```

### agent start needs a free pane

`agent start` never creates, splits, or moves layout. The pane must be sitting at its shell prompt, and startup detection times out after 30 s by default (`agent_not_ready` if it reports `blocked`).

```
herdr agent start worker \
  --kind codex --pane w1:p1
```

### Scrollback has limits

Full-screen agents render history on the alternate screen, not host scrollback. `agent read --lines N` returns `agent_not_idle` while `working`/`blocked`/`unknown` — wait for idle and retry, or use `--source visible`.

```
herdr agent read worker \
  --source visible --lines 80
```
