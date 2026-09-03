---
title: "Bash"
description: "Variables, quoting, loops, conditionals, functions, and expansion."
category: "CLI & shell"
tags: ["shell", "quoting", "loop", "expansion"]
weight: 140
lead: "The shell that runs everything."
version: "5.3"
---
Bash is the glue language of Unix: variables, conditionals, loops, and pipelines you can read off the page. Here is the daily surface — quoted, tested, and copy-paste ready.

## The daily surface, at a glance {#quickref}

The patterns you reach for most, on one screen. Each block is copy-paste ready — string a few together and you've written most shell scripts.

### Shebang + strict mode

```
#!/usr/bin/env bash
set -euo pipefail
```

### Variables & defaults

```
name="Ada"
echo "$name" "${name}s"
echo "${1:-none}"   # default
```

### Quoting

```
echo '$HOME'      # literal
echo "$HOME"      # expands
echo "$var"       # no split
```

### Tests

```
[[ -f "$f" ]] && echo file
[[ -n "$x" && "$x" == y ]]
[[ $n -gt 0 ]]
```

### Loops

```
for f in *.txt; do echo "$f"; done
while read -r l; do :; done < f
```

### Command substitution

```
now=$(date)
files=$(find . -name '*.sh')
```

### Redirection

```
cmd > out 2>&1   # both
cmd >> log         # append
cmd 2>/dev/null     # drop err
```

### Exit status

```
cmd || echo "failed"
echo "$?"          # last status
exit 0             # signal result
```

> **KEY:** **Quote every expansion, then run ShellCheck.** `"$var"` and `"$@"` keep values whole, and `[[ ]]` needs no extra quoting. These eight patterns cover most day-to-day shell work.

## Scripts & running {#start}

Every script starts with a shebang, a permission bit, and — for real scripts — strict mode. Nail these and most bugs die early.

### 1. Shebang

```
#!/usr/bin/env bash
# portable: finds bash via $PATH
```

### 2. Make executable

```
chmod +x script.sh
./script.sh
```

### 3. Strict mode

```
set -euo pipefail
# -e exit on error
# -u error on unset var
# -o pipefail fail on pipe error
```

### 4. Source a file

```
source ./lib.sh   # run in THIS shell
. ./lib.sh        # same, POSIX
```

### Exit codes

`0` means success; anything else means failure. Signal a result with `exit`.

```
exit 0   # success
exit 1   # failure
command || echo "failed"
```

### $? — last status

`$?` holds the exit status of the most recent command. Read it once, right away.

```
true; echo $?    # → 0
false; echo $?   # → 1
```

1. **Write the script** — A shebang line, then commands — one per line, in order.
1. **chmod +x** — Add the execute bit so the kernel will run it directly.
1. **Run it** — `./script.sh` starts a new bash process under the shebang.
1. **Read $?** — The process exits with a status your caller can inspect.
> **KEY:** **Strict mode is not optional for new scripts.** `set -euo pipefail` turns silent failures into loud ones: errors abort, unset variables abort, and a failing command inside a pipeline aborts. It will catch bugs you didn't know you had.

## Variables & expansion {#variables}

Assign with no spaces around `=`, read with `$`, and reach for braces when the name runs into text or you want a default.

### Assign & expand

```
name="Ada"
echo "$name"        # → Ada
echo "${name}s"     # → Adas (braces)
```

### Default value

```
echo "${1:-none}"   # none if $1 unset
: "${cfg:=default}" # assign if unset
```

### Arithmetic

```
n=$(( 6 * 7 ))      # → 42
n=$(( n + 1 ))      # increment
```

| Syntax | Meaning | Example |
| --- | --- | --- |
| `${var}` | Expand variable (braces disambiguate) | `echo "${x}_suffix"` |
| `${var:-dflt}` | default if unset or empty | `echo "${1:-none}"` |
| `${var:=dflt}` | assign default if unset or empty | `: "${name:=guest}"` |
| `${var:?msg}` | error and exit if unset or empty | `: "${cfg:?missing}"` |
| `$(cmd)` | command substitution | `now=$(date)` |
| `$(( expr ))` | arithmetic expansion | `n=$(( a + b ))` |
| `$0` | script name | `echo "$0"` |
| `$1 … $9` | positional arguments | `echo "$1"` |
| `$@` | all arguments (each quoted) | `for a in "$@"` |
| `$#` | argument count | `echo "got $# args"` |

> **KEY:** **Always quote expansions.** `"$var"` keeps one value intact; unquoted `$var` word-splits on whitespace and expands globs. When in doubt, put it in double quotes.

## Quoting & word splitting {#quoting}

Quotes decide when Bash splits and expands. Single quotes are literal, double quotes expand, and unquoted variables split on whitespace.

### Single quotes (literal)

```
echo '$HOME'        # → $HOME
echo 'it'\''s'      # → it's
```

### Double quotes (expand)

```
echo "$HOME"        # → /home/you
name="Ada"
echo "hi $name"     # → hi Ada
```

### Backslash escape

```
echo \$HOME         # → $HOME
echo "a\"b"         # → a"b
```

### Arrays

Arrays hold multiple values; index from 0 and expand with `[@]`.

```
arr=(a b "c d")
echo "${arr[0]}"    # → a
echo "${arr[@]}"    # → a b c d
echo "${#arr[@]}"   # → 3
```

### "$@" vs $@

`"$@"` keeps every argument intact — always use it. Bare `$@` re-splits and breaks args containing spaces.

```
# correct: each arg stays whole
for f in "$@"; do echo "$f"; done

# wrong: splits "a b" into two
for f in $@; do echo "$f"; done
```

<details>
<summary>Globbing patterns</summary>

#### Wildcards

```
*.txt         # every .txt file
file?.md      # one-char names
[abc]*.log    # a/b/c prefix
```

#### Unmatched globs

```
echo *.nonexistent    # stays literal
shopt -s nullglob     # → empty instead
shopt -u nullglob     # back to literal
```

</details>

> **⚠:** **Unquoted variables split on whitespace.** `files="a b.txt"` unquoted becomes two words (`a` and `b.txt`); `"$files"` stays one. Quote every expansion unless you specifically want splitting.

## Conditionals & loops {#control}

Test with `[[ ]]`, branch with `if`/`case`, and iterate with `for`/`while`/`until`. Semicolons before `then` and `do` are required on one line.

### if / elif / else

```
if [[ -f "$f" ]]; then
  echo "file"
elif [[ -d "$f" ]]; then
  echo "dir"
else
  echo "nope"
fi
```

### case

```
case "$1" in
  start) echo "go";;
  stop)  echo "stop";;
  *)     echo "usage: $0 start|stop";;
esac
```

| Test | True when | Example |
| --- | --- | --- |
| `-f file` | exists and is a regular file | `[[ -f "$f" ]]` |
| `-d dir` | exists and is a directory | `[[ -d "$d" ]]` |
| `-e path` | exists (any type) | `[[ -e "$p" ]]` |
| `-z str` | string is empty | `[[ -z "$x" ]]` |
| `-n str` | string is non-empty | `[[ -n "$x" ]]` |
| `a == b` | strings equal | `[[ "$a" == "$b" ]]` |
| `a != b` | strings differ | `[[ "$a" != "$b" ]]` |
| `n -eq m` | integers equal | `[[ $n -eq 0 ]]` |
| `n -lt m` / `-gt` | integer less / greater | `[[ $n -gt 10 ]]` |
| `! test` | negation | `[[ ! -f "$f" ]]` |
| `&&` / `\|\|` | and / or inside [[ ]] | `[[ -f "$f" && -s "$f" ]]` |

### for

```
for f in *.txt; do
  echo "$f"
done
```

### while / until

```
while read -r line; do
  echo "$line"
done < input.txt

until ping -c1 host &>/dev/null; do
  sleep 1
done
```

### break / continue

```
for f in *; do
  [[ -d "$f" ]] && continue
  echo "$f"
  [[ $f == stop.txt ]] && break
done
```

> **KEY:** **Prefer `[[ ]]` over `[ ]`.** `[[ ]]` is a bash keyword: no word splitting, supports `&&`/`||` and `=~` regex. The `[` form is a command and needs quoting plus `-a`/`-o`. For arithmetic conditions, use `(( n > 0 ))`.

## Functions {#functions}

Functions get their own positional arguments, can local their variables, and return an exit status. Define once, call many times.

### Define & call

```
greet() {
  echo "hello, $1"
}
greet "Ada"   # → hello, Ada
```

### Arguments

Inside a function, `$1` is the first argument and `$@` is all of them.

```
print_args() {
  echo "first: $1"
  echo "all:   $@"
}
print_args a b c
```

### local variables

`local` scopes a variable to the function so it doesn't leak into the caller.

```
run() {
  local tmp
  tmp=$(mktemp)
  echo "$tmp"
}
# $tmp is empty out here
```

### return / exit status

`return` sets the function's status; `(( ))` returns `0`/`1`.

```
is_even() {
  (( $1 % 2 == 0 ))
}
if is_even 4; then echo even; fi
```

<details>
<summary>trap cleanup</summary>

`trap` runs a command when the script receives a signal or exits — the standard way to clean up temp files and lockfiles.

```
tmp=$(mktemp)
cleanup() { rm -f "$tmp"; }
trap cleanup EXIT

trap 'echo "interrupted"; exit 1' INT
# common traps: EXIT INT TERM ERR
```

</details>

> **KEY:** **Return statuses are 0–255.** `return 1` (or the status of the last command) signals failure; `return` alone returns the last command's status. Only `exit` ends the whole script.

## String & parameter manipulation {#strings}

Bash string surgery happens through parameter expansion — no `sed` needed for trim, replace, case, and substring.

| Syntax | What it does | Example |
| --- | --- | --- |
| `${#name}` | string length | `echo "${#name}"` → 11 |
| `${name:0:5}` | substring (offset : length) | `${name:0:5}` → hello |
| `${name/hello/hi}` | replace first match | → hi world |
| `${name//l/L}` | replace all matches | → heLLo worLd |
| `${name^^}` | uppercase all | → HELLO WORLD |
| `${name,,}` | lowercase all | → hello world |
| `${path##*/}` | basename (strip longest prefix) | → tool |
| `${path%/*}` | dirname (strip shortest suffix) | → /usr/local/bin |

### dirname & basename

```
path="/usr/local/bin/tool"
dir="${path%/*}"        # /usr/local/bin
base="${path##*/}"      # tool
```

### substring & replace

```
name="hello world"
echo "${name:0:5}"      # hello
echo "${name/hello/hi}" # hi world
echo "${name//l/L}"     # heLLo worLd
```

> **KEY:** **Negative offsets need a space.** `${var: -3}` takes the last three characters; `${var:-3}` is a default value of `3`. The space disambiguates substring from default.

## Redirection & pipes {#io}

File descriptors: `0` stdin, `1` stdout, `2` stderr. Redirect them with `>` `>>` `<`, merge with `2>&1`, and chain commands with `|`.

**stdin** (fd 0 · read) → **command** (the process) → **stdout** (fd 1 · results) → **pipe / file** (destination) → **stderr** (fd 2 · errors)

| Syntax | Effect | Example |
| --- | --- | --- |
| `cmd > file` | stdout → file (truncate) | `echo hi > out.txt` |
| `cmd >> file` | stdout → file (append) | `echo hi >> log` |
| `cmd < file` | stdin ← file | `wc -l < data.txt` |
| `2> file` | stderr → file | `ls bad 2> err.txt` |
| `2>&1` | stderr → wherever stdout goes | `ls bad > out 2>&1` |
| `&> file` | stdout + stderr → file | `ls bad &> out` |
| `2>/dev/null` | discard stderr | `curl -s URL 2>/dev/null` |
| `a \| b` | pipe a's stdout into b | `ps aux \| grep bash` |

### Pipes

```
ps aux | grep bash | wc -l
cat data.txt | sort | uniq -c
```

### Process substitution

Feed a command's output where a file is expected.

```
diff <(sort a.txt) <(sort b.txt)
grep -f <(printf 'a\nb\n') data.txt
```

<details>
<summary>Heredocs</summary>

#### Expand variables

```
cat <<EOF
hello $USER
EOF
```

#### Literal (quoted)

```
cat <<'EOF'
literal $USER
EOF
```

</details>

> **KEY:** **Order matters.** `2>&1` must come after the stdout redirect it should follow: `cmd > file 2>&1` sends both to the file, while `cmd 2>&1 > file` sends stderr to the terminal and stdout to the file.

## Gotchas {#gotchas}

Behaviors that bite experienced scripters — usually silently.

### Word splitting

Unquoted variables split on whitespace into multiple words.

```
files="a b.txt"
for f in $files; do    # → a, b.txt (2 words)
  echo "$f"
done
for f in "$files"; do  # → 1 word
  echo "$f"
done
```

### Always quote "$@"

Bare `$@` re-splits arguments that contain spaces; `"$@"` passes them through intact.

```
cp $@ dest     # wrong: splits names
cp "$@" dest   # right: args intact
```

### set -e pitfalls

`set -e` skips commands in conditions and after `||`; a bare failing command still exits.

```
set -e
grep foo file || true      # ok
if grep foo file; then     # ok
  :
fi
grep foo file              # exits if no match
```

### [[ vs [

`[[ ]]` doesn't split or glob; `[ ]` is a command and needs quoting and a single `=`.

```
[[ $a == $b ]]      # safe
[ "$a" = "$b" ]     # must quote
[[ $s =~ ^[0-9]+$ ]]  # regex
```

### Globbing surprises

Unmatched globs stay literal, and `*` never matches hidden dotfiles.

```
echo *.nonexistent    # → *.nonexistent
ls *                  # skips .hidden
shopt -s nullglob     # unmatched → empty
```

### Subshells & pipelines

`( )` and pipeline stages run in subshells; their variable changes don't reach the parent.

```
x=1
( x=2 )           # subshell
echo "$x"         # → 1

n=0
cat f | while read l; do n=$((n+1)); done
echo "$n"         # → 0 (lost)
```

### read without -r

Bare `read` treats `\` as an escape and mangles trailing backslashes. Use `-r` for raw input.

```
read -r line        # raw, keeps \
read line           # \n → n, trailing \ lost
while read -r l; do :; done < f
```

### local masks exit status

`local x=$(cmd)` returns `local`'s own status (`0`), not `cmd`'s — so it defeats `set -e`. Split the assignment.

```
# wrong: failure invisible to set -e
local x=$(false)

# right: status preserved
local x
x=$(false)
```

> **⚠:** **Quote everything, then run ShellCheck.** Most of these gotchas are one unquoted variable away. `shellcheck script.sh` catches word splitting, `set -e` traps, and quoting mistakes before you ship.
