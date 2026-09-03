---
title: "jq"
description: "The command-line JSON processor: filters, operators, recipes, and curl pipelines that actually work."
category: "CLI & shell"
tags: ["cli", "filters", "recipes", "JSON"]
weight: 150
lead: "Slice JSON on the command line."
version: "1.8.x"
---
jq is a tiny filter language for JSON: pipe structured data in, emit transformed JSON out. It's the missing half of every `curl` command.

## The ten things you'll type most {#quickref}

If you remember nothing else, keep this table handy — it covers ~90% of everyday jq.

| Command | What it does |
| --- | --- |
| `jq '.'` | Identity — pretty-print JSON. |
| `jq '.foo'` | Extract a field; nest with `.a.b`. |
| `jq '.[]'` | Expand an array, one element per line. |
| `jq '.users[] \| select(.age > 30)'` | Keep elements that match a condition. |
| `jq '.users \| map(.name)'` | Transform each element into a new array. |
| `jq '.users \| sort_by(.age)'` | Sort an array by a key. |
| `jq '.users \| length'` | Count items, string length, or object keys. |
| `jq '[.items[].price] \| add'` | Sum an array (or merge objects). |
| `jq -r '[.a, .b] \| @csv'` | CSV line — pair `@csv` with `-r`. |
| `jq --arg name "Ada" '.name = $name'` | Inject a shell variable safely. |

## Pipe JSON in, get JSON out {#start}

jq reads JSON from stdin (or a file), applies a filter, and writes the result. The identity filter `.` pretty-prints.

### 1. Install

```
brew install jq      # macOS
sudo apt install jq  # Debian/Ubuntu
```

### 2. Pretty-print

```
jq '.' data.json
curl -s URL | jq '.'
```

### 3. Extract a field

```
jq '.name' data.json
jq '.user.name'
```

### 4. Iterate an array

```
jq '.[]' data.json
jq '.users[]'
```

> **KEY:** **Read filters right-to-left.** `.users[] | .name` means: take the `users` array, expand it (`[]`), then for each item grab `name`. The pipe `|` feeds one filter's output into the next.

## The five filters you'll use daily {#filters}

Most real jq is built from a handful of primitives chained with `|`.

| Filter | Meaning | Example | Result |
| --- | --- | --- |
| `.` | Identity (whole input) | `echo '{"a":1}' \| jq '.'` | pretty-printed `{"a":1}` |
| `.foo` | Object field | `jq '.name'` | `"Ada"` |
| `.foo.bar` | Nested field | `jq '.user.name'` | `"Ada"` |
| `.[0]` | Array index | `jq '.[0]'` | first element |
| `.[]` | Expand array / object values | `jq '.[]'` | each element, one per line |
| `.foo[]` | Expand a field's array | `jq '.users[]'` | each user |
| `\|` | Pipe into next filter | `jq '.users[] \| .name'` | each user's name |
| `,` | Multiple outputs | `jq '.a, .b'` | both values |

### Pipe vs comma

`|` feeds output forward; `,` produces parallel results.

```
jq '.a | .b'     # a, then b of a
jq '.a, .b'      # a and b side by side
```

### Optional keys are safe

Accessing a missing field returns `null` — never an error.

```
jq '.missing'      # → null
jq '.foo // "n/a"' # default value
```

## Copy-paste answers to real questions {#recipes}

Each shows the filter and what it answers about your data.

- `jq '.users | length'` — How many users?
- `jq '[.users[].name]'` — All names as an array.
- `jq '.users | map(.name)'` — Same, via map.
- `jq '.users[] | select(.age > 30)'` — Users older than 30.
- `jq '.users | map(select(.admin))'` — Only admins.
- `jq '.users | sort_by(.age)'` — Sort by age ascending.
- `jq '.users | sort_by(.age) | reverse'` — Descending.
- `jq '.users | group_by(.role)'` — Bucket users by role.
- `jq '.tags | unique'` — De-duplicate an array.
- `jq '[.items[].price] | add'` — Sum of prices.
- `jq '.users | max_by(.score).name'` — Name of top scorer.
- `jq 'del(.users[].password)'` — Strip a sensitive field.
- `jq 'with_entries(select(.value != null))'` — Drop null values.
- `jq 'flatten'` — Flatten nested arrays one level.

## The command-line switches {#flags}

A handful of flags change everything about how jq reads and writes.

| Flag | Effect | Use when |
| --- | --- | --- |
| `-r` | Raw output (strip quotes) | You want plain strings, not JSON. |
| `-c` | Compact, single-line JSON | Logs, pipes, one-object-per-line. |
| `-s` | Slurp input into one array | Aggregate across multiple objects. |
| `-n` | Null input (ignore stdin) | Build values from `--arg`. |
| `-e` | Set exit status from output | Scripts that need success/failure. |
| `--arg n v` | Pass a string variable | Inject shell values safely. |

## Things that bite everyone once {#gotchas}

Accessing `.foo` on an object without it returns `null`, not an error. Use `//` for defaults. Without `-r`, strings come back JSON-quoted. Two separate JSON objects on stdin aren't an array unless you slurp with `-s`.
