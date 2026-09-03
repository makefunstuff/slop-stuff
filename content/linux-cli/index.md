---
title: "Linux CLI essentials"
description: "sed, awk, grep, find, xargs, sort, tar, git, and networking."
category: "CLI & shell"
tags: ["shell", "sed", "awk", "git"]
weight: 160
lead: "The toolbox for text & files."
version: "essentials"
---
Everyday Linux command-line tools — sed, awk, grep, find, sort, git, and networking — in one copy-paste reference. Pipe text in, transform it, ship it out.

## Quick reference {#quickref}

The eight commands you'll reach for most. Memorize these and you can solve the majority of day-to-day text and file problems.

- `grep -rE 'pattern' dir` — Recursive extended-regex search.
- `sed -i 's/old/new/g' file` — Edit a file in place.
- `awk '{print $1}' file` — Print the first column.
- `find . -name '*.log' -exec rm {} \;` — Find files, then act on each match.
- `sort f | uniq -c | sort -rn` — Count duplicates, most common first.
- `find . -print0 | xargs -0 cmd` — Pass names safely (spaces & newlines).
- `tar czf archive.tgz dir` — Create a gzipped tarball.
- `ps aux` — List every running process.

## The daily loop {#start}

Move around, chain commands, and read the manual. These six habits carry most of the rest.

### 1. Navigate

```
cd ~/projects    # go to projects
ls -la           # all files + details
pwd              # print working dir
```

### 2. Pipe

```
cat f.txt | grep err | wc -l
# stdout → stdin of the next cmd
```

### 3. Redirect

```
ls > files.txt        # overwrite
echo hi >> log        # append
cmd 2>/dev/null       # drop stderr
```

### 4. Help & history

```
man ls
ls --help
history | tail -20
!!                    # rerun last command
```

> **&&:** **Chain with `&&` and `||`.** `a && b` runs `b` only if `a` succeeds; `a || b` runs `b` only if `a` fails. Combine them: `make && make install || echo "build failed"`.

## sed {#sed}

A stream editor: apply substitutions and filters to text line by line, without opening an editor.

| Expression | Meaning | Example |
| --- | --- | --- |
| `s/old/new/` | Replace first match on each line | `sed 's/foo/bar/' f` |
| `s/old/new/g` | Replace every match on the line | `sed 's/foo/bar/g' f` |
| `/pattern/d` | Delete matching lines | `sed '/^$/d' f` |
| `-n '5p'` | Print only line 5 | `sed -n '5p' f` |
| `-n '2,5p'` | Print lines 2 through 5 | `sed -n '2,5p' f` |
| `-i` | Edit the file in place | `sed -i 's/a/b/' f` |
| `-E` | Extended regex (`+`, `\|`, `()` unescaped) | `sed -E 's/a+/b/' f` |
| `-e '…'` | Apply multiple commands | `sed -e 's/a/b/' -e 's/c/d/' f` |
| `-z` | Treat NUL as the record separator (whole file) | `sed -z 's/foo/bar/g' f` |

### Capture groups

Wrap part of a match and replay it with `\1`, `\2`… Use plain parens with `-E`, escaped parens in basic regex.

```
sed -E 's/(foo)(bar)/\2\1/'    # ERE → barfoo
sed 's/\(foo\)\(bar\)/\2\1/'   # BRE → barfoo
```

### In-place editing

GNU and BSD disagree on `-i`: GNU takes an optional backup suffix, BSD requires an empty argument.

```
sed -i.bak 's/old/new/g' file  # GNU: backup
sed -i '' 's/old/new/g' file    # macOS/BSD
```

## awk {#awk}

A tiny programming language for columns and rows — the fastest way to slice, sum, and reshape tabular text.

| Variable | Meaning |
| --- | --- |
| `$0` | The whole line |
| `$1, $2, …` | Fields (split on whitespace by default) |
| `NF` | Number of fields in the line |
| `NR` | Line (record) number so far |
| `FS` | Input field separator (default whitespace) |
| `OFS` | Output field separator |
| `BEGIN` | Block that runs once before input |
| `END` | Block that runs once after input |

- `awk '{print $2}' file` — Print column 2.
- `awk -F: '{print $1}' /etc/passwd` — Split on `:` and print usernames.
- `awk '{s += $1} END {print s}' file` — Sum of column 1.
- `awk '{s += $1; n++} END {print s/n}' file` — Average of column 1.
- `awk '$3 > 100' file` — Lines where column 3 exceeds 100.
- `awk 'END {print NR}' file` — Count lines.
- `awk '{print $NF}' file` — Last field of each line.
- `awk 'BEGIN {OFS=","} {print $1, $3}' file` — Rearrange columns, comma-joined.
- `gawk --csv '{print $2}' data.csv` — Parse CSV with quoting rules (gawk 5.3+).

<details>
<summary>More awk recipes</summary>

#### Skip the header row

```
awk 'NR>1 {print $1}' file
```

#### Number the lines

```
awk '{print NR ": " $0}' file
```

#### Find long lines

```
awk 'length($0) > 80' file
```

#### Swap field order

```
awk '{print $3, $1}' file
```

</details>

## grep & ripgrep {#grep}

Find lines that match a pattern. ripgrep (`rg`) does the same faster and respects `.gitignore`.

| Flag | Effect |
| --- | --- |
| `-E` | Extended regex (`+`, `\|`, `()` without escaping) |
| `-F` | Fixed string — literal text, no regex |
| `-r` | Recursive search through directories |
| `-v` | Invert — show lines that do NOT match |
| `-i` | Case-insensitive matching |
| `-l` | Only filenames that contain a match |
| `-n` | Show line numbers |
| `-c` | Count matches per file |
| `-o` | Print only the matching part, one per line |
| `-A N` / `-B N` / `-C N` | Show N lines after / before / around each match |
| `-m N` | Stop after N matches per file |
| `-P` | PCRE — Perl-compatible regex (GNU only, not BSD/macOS) |

### ripgrep equivalents & extras

```
grep -r "foo" .     →  rg "foo"
grep -rn "foo" .    →  rg -n "foo"
grep -rl "foo" .    →  rg -l "foo"
grep -v "foo" f     →  rg -v "foo" f
# rg-only (ripgrep 14+):
rg --hidden "foo" .     # search dotfiles
rg -uuu "foo" .         # also binary + ignore
rg --files -g '*.js'    # list matching files
rg -t js "foo"          # by file type
```

### Typical pipelines

```
grep -rn "TODO" src/
grep -oE '[0-9]+\.[0-9]+' log
grep -A2 -B1 "error" log
ps aux | grep nginx
rg "TODO" -g '*.js'
```

<details>
<summary>grep recipes</summary>

#### Exclude a directory

```
grep -rn "foo" --exclude-dir=node_modules .
```

#### Whole-word match

```
grep -w "err" log
```

#### Count across files

```
grep -rc "foo" src/
```

#### Search inside gzip'd logs

```
zgrep "foo" access.log.gz
```

</details>

## find & xargs {#find}

Locate files by name, type, age, or size, then act on them — safely — with `xargs`.

| Expression | Meaning |
| --- | --- |
| `-name '*.log'` | Match filename pattern (quote the glob!) |
| `-iname '*.log'` | Case-insensitive name match |
| `-type f` / `-type d` | Files only / directories only |
| `-mtime +7` | Modified more than 7 days ago |
| `-mtime -1` | Modified within the last day |
| `-size +100M` | Larger than 100 MB |
| `-exec cmd {} \;` | Run `cmd` on each match |
| `-delete` | Delete matches (careful!) |
| `-print0` | NUL-separated output (for `xargs -0`) |

### -exec vs -delete

```
find . -name '*.tmp' -delete
find . -name '*.log' -exec rm {} \;
find . -name '*.log' -print0 | xargs -0 rm
```

### Batch with xargs

`xargs` turns stdin into arguments; `-0` pairs with `-print0` to survive spaces and newlines.

```
echo a b c | xargs mkdir
find . -name '*.txt' -print0 | xargs -0 wc -l
```

> **!:** **Quote your patterns.** `find . -name *.log` lets the shell expand `*.log` first. Write `find . -name '*.log'` so `find` does the matching.

## Text tools {#text}

The small tools that sort, split, count, and compare text, ready to pipe together.

| sort flag | Effect |
| --- | --- |
| `-n` | Numeric sort (10 comes after 9) |
| `-r` | Reverse order |
| `-k 2` | Sort by column 2 |
| `-u` | Unique — drop duplicate adjacent lines |
| `-t,` | Field separator used with `-k` |
| `-h` | Human-readable sizes (1K, 2M) |

### cut & tr

```
cut -d, -f1 file      # field 1, comma
cut -c1-10 file       # characters 1–10
tr 'a-z' 'A-Z' < f    # uppercase
tr -d '\r' < f        # strip CRLF
```

### uniq & wc

```
sort f | uniq -c      # count each line
sort f | uniq         # dedupe (sort first!)
wc -l file            # line count
wc -w -c file         # words, bytes
```

### head, tail, diff, comm, paste, join

```
head -5 f; tail -5 f
comm -12 a b          # lines in both
diff -u a b           # unified diff
paste a b             # columns side by side
join a b              # merge on common field
```

<details>
<summary>More pipelines</summary>

#### Top 5 most common lines

```
sort f | uniq -c | sort -rn | head -5
```

#### Column total

```
cut -d, -f3 f | paste -sd+ | bc
```

#### Unique values in a column

```
cut -d, -f1 f | sort -u
```

#### Merge sorted files

```
sort -m a b | uniq
```

</details>

## Files & archives {#archiving}

Bundle, compress, sync, and move files, and keep an eye on disk space.

### tar

```
tar czf a.tgz dir     # create
tar xzf a.tgz         # extract
tar tzf a.tgz         # list
```

### gzip & zstd

```
gzip file             # → file.gz
gunzip file.gz
zstd file             # faster modern
unzstd file.zst
```

### zip

```
zip -r out.zip dir
unzip out.zip
unzip -l out.zip      # list
```

### rsync

```
rsync -av src/ dst/
rsync -av --delete src/ dst/
rsync -av host:src/ ./
```

### Copy & move

```
cp -r src dst         # recursive
cp -a src dst         # preserve attrs
mv old new            # rename / move
```

### Disk & space

```
du -sh dir            # dir size
du -h --max-depth=1   # one level
df -h                 # free space
```

### dd, chmod, chown

```
dd if=img.iso of=/dev/sdb bs=4M status=progress
chmod +x script.sh
chmod 644 file
chown user:group file
```

## Processes & system {#processes}

See what's running, stop it, follow its logs, and inspect its ports and files.

### ps & top

```
ps aux                # all processes
ps aux | grep nginx
top                   # live view
htop                  # nicer live view
```

### kill

```
kill 1234             # SIGTERM
kill -9 1234          # SIGKILL
pkill -f "node app"
pgrep -l node
```

### systemctl

```
systemctl status nginx
systemctl restart nginx
systemctl enable nginx
journalctl -u nginx -f
```

### Network & files

```
ss -tulpn             # listening ports
lsof -i :80           # who owns port 80
lsof -p 1234          # files a PID has open
which python3; type ls
```

> **15:** **Signals: SIGTERM first, SIGKILL last.** `kill 1234` sends SIGTERM (a polite request the process may handle); `kill -9 1234` sends SIGKILL, which nothing can catch — use it only when a process ignores SIGTERM.

## Git & version control {#git}

Track every change, branch without fear, and rewind any mistake. The daily commands, plus the safe ways out.

### 1. Start a repo

```
git init
git clone git@github.com:user/repo.git
git remote add origin URL
```

### 2. See what changed

```
git status -s
git diff            # unstaged
git diff --staged   # staged
git log --oneline --graph
```

### 3. Stage & commit

```
git add file     # one file
git add -p       # pick hunks
git commit -m "msg"
git commit --amend
```

### 4. Share

```
git push origin main
git pull --rebase
git fetch --all
git remote -v
```

### Branch & switch

```
git branch feature
git switch feature       # or: git checkout
git switch -c fix        # create + switch
git merge feature
git rebase main
git branch -d feature
```

### Undo

```
git restore file         # discard changes
git restore --staged f   # unstage
git reset --soft HEAD~1  # undo commit, keep staged
git reset --hard HEAD~1  # undo commit + changes
git revert abc123        # new commit that undoes
```

- `git log --oneline --all --graph` — the whole history as a graph.
- `git reflog` — everything HEAD has done — your undo safety net.
- `git stash` — park changes; `git stash pop` brings them back.
- `git cherry-pick abc123` — copy one commit onto this branch.
- `git tag -a v1.0 -m "release"` — mark a release point.
- `git blame file` — who changed each line.

> **KEY:** **reflog saves you.** Almost anything you "lose" is still in `git reflog` for ~90 days. `git reset --hard` before checking reflog is the only truly destructive move.

## Networking & TCP/IP {#networking}

From sockets and ports to DNS and packet captures — the CLI tools that answer "why can't this talk to that?"

| Tool | What it answers | Example |
| --- | --- | --- |
| `ss` | Listening sockets & connections | `ss -tulpn` |
| `ip` | Interfaces, addresses, routes | `ip a; ip route` |
| `ping` | Reachability & latency | `ping -c 4 1.1.1.1` |
| `dig` | DNS resolution | `dig +short example.com` |
| `curl` | HTTP requests | `curl -sS -I https://example.com` |
| `nc` | Raw TCP/UDP poke | `nc -zv host 443` |
| `traceroute` | Path across hops | `traceroute 8.8.8.8` |
| `tcpdump` | Packets on the wire | `tcpdump -ni eth0 port 443` |

### TCP/IP layers

```
Application  HTTP, DNS, SSH
Transport    TCP, UDP (+ ports)
Network      IP (routing)
Link         Ethernet, Wi-Fi (MAC)
```

### Handy checks

```
curl -v https://host   # full handshake
nc -zv host 22         # is the port open?
ss -tn state established
dig MX example.com     # mail server
```

### Common ports

```
22  SSH      53  DNS
80  HTTP    443 HTTPS
5432 Postgres  6379 Redis
3306 MySQL  27017 MongoDB
```

> **KEY:** **Test in layers.** Can you resolve the name (`dig`)? Can you reach the host (`ping` / `nc`)? Is the port open (`ss` / `nc -z`)? Is the app responding (`curl -v`)? Walk the stack and the culprit shows itself.

## Gotchas {#gotchas}

Behaviors that silently change results — quoting, shell expansion, portability, and spaces in filenames.

### Quote your variables

Unquoted `$var` word-splits on spaces and globs. Always double-quote in scripts.

```
for f in *.txt; do echo "$f"; done
cat "$file"          # not cat $file
```

### The shell expands first

Globs, `$var`, and `$(…)` are expanded by the shell before the command ever runs.

```
echo *.txt           # shell expands glob
echo "*.txt"         # literal asterisk
find . -name '*.txt' # find does the matching
```

### GNU vs BSD (macOS)

macOS ships BSD tools with different flags.

```
# GNU:  sed -i 's/a/b/' f
# BSD:  sed -i '' 's/a/b/' f
# GNU has grep -P; BSD doesn't
brew install coreutils
```

### grep exit codes vs `set -e`

`grep` returns `0` on match, `1` on no match, `2` on error. Under `set -e`, a "no match" silently kills the script.

```
grep -q "err" log || true
if grep -q "err" log; then
  echo "found"
fi
```

### sort is locale-aware; uniq needs sorted input

`sort` order changes with `LC_COLLATE`; pin byte order with `LC_ALL=C`. `uniq` only drops *adjacent* duplicates — sort first.

```
LC_ALL=C sort -u f
sort f | uniq -c
```

### Fail fast with `set -euo pipefail`

Put it at the top of scripts: `-e` exits on error, `-u` errors on unset variables, `-o pipefail` makes the pipeline reflect any failing command.

```
set -euo pipefail
false | true   # non-zero with pipefail
```

> **!:** **Spaces in filenames break naive pipelines.** `for f in $(ls)` and unquoted `xargs` split on whitespace. Use `find -print0 | xargs -0` or a `while read` loop to stay safe.
