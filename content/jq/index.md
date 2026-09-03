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
| --- | --- | --- | --- |
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

<details>
<summary>Shape-shifting recipes</summary>

#### Rename a field

```
jq '{first: .name}'
```

#### Pick several fields

```
jq '{id: .id, name: .name}'
```

#### key → value pairs

```
jq 'to_entries'
```

#### and back

```
jq 'from_entries'
```

#### Index by key

```
jq '.users | map({key: .id, value: .}) | from_entries'
```

#### Merge objects

```
jq -s 'add' a.json b.json
```

#### Project with pick() (1.7+)

```
jq '.users[] | pick(.id, .name)'
```

#### Sum a generator (1.8+)

```
jq -c '.sum = add(.xs[])'
```

</details>

## The builtins that do the heavy lifting {#operators}

Higher-order functions take a filter as an argument and apply it to every element.

### Transforming

- `map(f)` — apply f to each element → array.
- `map_values(f)` — map over object values.
- `select(f)` — keep elements where f is truthy.
- `unique` — dedupe sorted array.
- `sort, sort_by(f)` — sort values / by key f.
- `group_by(f)` — bucket by key f.
- `flatten` — flatten nested arrays.
- `add` — sum array, or merge objects.

### Reducing

- `reduce .[] as $x (init; f)` — fold.
- `length` — length of string/array/object.
- `keys, keys_unsorted` — object keys.
- `has("k")` — does key exist?
- `del(.k)` — delete key / element.
- `min, max, min_by(f)` — extremes.
- `join(str)` — join array with string.
- `split(str)` — split string.

### Conditionals & defaults

- `//` — alternative (default) operator.
- `if c then a else b end` — conditional.
- `and, or, not` — boolean logic.
- `==, !=, <, >=` — comparisons.
- `+ - * /` — arithmetic.
- `any, all` — array quantifiers.
- `contains(x)` — substring / subset test.
- `startswith, endswith` — string prefix/suffix.

<details>
<summary>Newer builtins (jq 1.7 / 1.8)</summary>

- `pick(.a, .b.c)` — project object to these paths (1.7+).
- `abs` — absolute value (1.7+).
- `scan(re; flags)` — emit every regex match (1.7+).
- `debug(msgs)` — debug a transformed value to stderr (1.7+).
- `trim, ltrim, rtrim` — strip whitespace (1.8+).
- `skip(n; stream)` — drop first n of a stream (1.8+).
- `toboolean` — string → boolean (1.8+).
- `@urid` — URI-decode, reverse of @uri (1.8+).

</details>

## Construct the JSON you actually want {#build}

Object and array constructors reshape input; string interpolation formats it.

### New objects

```
{name: .user.name,
 age: .user.age}
# shorthand: {name, age}
# (when fields are already .name, .age)
```

### New arrays

```
[.a, .b, .c]
[.users[].name]
[range(0; 10)]
```

### String interpolation

```
"Hello \(.name)!"
# → "Hello Ada!"

[.a, .b] | @csv    # CSV line
[.a, .b] | @tsv    # TSV line
[.a, .b] | @json   # JSON-encode
```

> **⌁:** Remember to pair `@csv` / `@tsv` with the `-r` flag so quotes aren't escaped in the final output.

## The command-line switches {#flags}

A handful of flags change everything about how jq reads and writes.

| Flag | Effect | Use when |
| --- | --- | --- |
| `-r` | Raw output (strip quotes) | You want plain strings, not JSON. |
| `--raw-output0` | Raw output, NUL-separated (1.7+) | Safe filenames via `xargs -0`. |
| `-c` | Compact, single-line JSON | Logs, pipes, one-object-per-line. |
| `-s` | Slurp input into one array | Aggregate across multiple objects. |
| `-S` | Sort object keys | Deterministic diffs / output. |
| `-n` | Null input (ignore stdin) | Build values from `--arg`. |
| `-R` | Read raw strings, not JSON | Process line-oriented text. |
| `--stream` | Parse input incrementally | Very large files / streaming APIs. |
| `-e` | Set exit status from output | Scripts that need success/failure. |
| `--arg n v` | Pass a string variable | Inject shell values safely. |
| `--argjson n v` | Pass a JSON variable | Inject structured values. |
| `--slurpfile n f` | Load file into an array var | Join data from two files. |

### Variables with --arg

```
jq --arg name "Ada" '.greeting = "hi \($name)"'
```

### Slurp for aggregation

```
jq -s '.[0] + .[1]' a.json b.json
jq -s 'sort_by(.ts)' events*.json
```

## The other half of every API call {#curl}

Pipe an API response straight into a filter and read the answer inline.

### Typical pipelines

```
curl -s https://api.github.com/repos/jqlang/jq | \
  jq '.stargazers_count'

curl -s URL | jq '.items[] | {name, version}'

curl -s URL | jq -r '.items[].html_url'
```

### In a script

```
resp=$(curl -s URL)
count=$(echo "$resp" | jq '.total')
if [ "$count" -gt 0 ]; then
  echo "$resp" | jq -r '.items[].name'
fi
```

> **✓:** **Tip:** `curl -sS` shows errors but hides progress. Add `jq -e` to get a non-zero exit when the last output is `false` or `null`.

## Things that bite everyone once {#gotchas}

Small behaviors that change what your pipeline returns.

### Missing keys → null

Accessing `.foo` on an object without it returns `null`, not an error. Use `//` for defaults and `has()` to test existence.

```
jq '.foo // "n/a"'
jq 'has("foo")'
```

### .[] on null → nothing

Expanding `null` produces no output, so a missing array silently yields zero lines.

```
jq '.items[]?'   # tolerate missing
```

### Quotes vs raw

Without `-r`, strings come back JSON-quoted. With `@csv` and `-r` together you get clean columns.

```
jq '.name'      # "Ada"
jq -r '.name'   # Ada
```

### Multiple objects need -s

Two separate JSON objects on stdin aren't an array unless you slurp.

```
jq -s '.' a.json b.json
```

### tonumber is strict (1.8)

Since 1.8, `tonumber` rejects leading/trailing whitespace — pipe through `trim` first. (1.7+ also lets you omit an `if`'s `else`.)

```
echo ' 42 ' | jq -Rr 'tonumber'         # 1.8: error
echo ' 42 ' | jq -Rr 'trim | tonumber'  # → 42
jq -n '1,2 | if . == 1 then "one" end' # → "one", 2
```

### New builtins need 1.7+

`pick`, `abs`, and `scan` landed in 1.7; `trim`, `skip`, `toboolean`, and `@urid` in 1.8. Older distro packages may still ship 1.6.

```
jq --version          # want 1.8.x
jq -n '{a:1,b:2,c:3} | pick(.a, .c)'   # 1.7+
jq -n '" hi " | trim'                  # 1.8+
```
