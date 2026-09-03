---
title: "Python"
description: "Comprehensions, decorators, dataclasses, and the standard library."
category: "Languages"
tags: ["language", "comprehension", "stdlib", "venv"]
weight: 100
lead: "Readable, batteries included."
version: "3.13+"
---
Python is a readable, general-purpose language whose standard library ships the batteries. This is the daily surface: types, comprehensions, functions, classes, and the tooling that keeps code clean.

## Quick reference {#quickref}

The nine things you'll reach for daily — isolated envs, comprehensions, f-strings, decorators, dataclasses, paths, and resource cleanup.

- `python -m venv .venv && source .venv/bin/activate` — venv — isolate a project's dependencies.
- `uv init && uv add requests && uv run app.py` — uv — fast, modern env + dependency manager.
- `[n*2 for n in nums if n > 0]` — List comprehension — map + filter in one line.
- `{k: v for k, v in pairs}` — Dict comprehension — build a mapping inline.
- `f"{name}: {price:.2f}"` — f-strings — interpolate, format, and debug.
- `@dataclass class P: x: int` — Auto `__init__` / `__repr__` / `__eq__`.
- `@decorator` — Decorators — wrap a function in reusable behavior.
- `Path("a.txt").read_text()` — pathlib — read / write / glob without os.path.
- `with open("a.txt") as f:` — Context manager — auto-closes, even on error.

## Run, venv & pip {#start}

The four commands that get any project off the ground — and the fast path with uv.

### 1. Run code

```
python app.py             # run a script
python -c 'print(2**10)'  # one-liner
python -i app.py          # run, then REPL
```

### 2. Virtual environment

```
python -m venv .venv
source .venv/bin/activate   # macOS / Linux
.venv\Scripts\activate      # Windows
deactivate                  # leave it
```

### 3. Install packages

```
pip install requests
pip install -r requirements.txt
pip freeze > requirements.txt
```

### 4. uv (fast, modern)

```
uv init                  # pyproject.toml project
uv add requests          # add a dependency
uv sync                  # sync lockfile → .venv
uv run app.py            # run in project env
```

1. **Create the venv** — `python -m venv .venv` — an isolated, project-local Python.
1. **Activate it** — `source .venv/bin/activate` — Windows: `.venv\Scripts\activate`.
1. **Install dependencies** — `pip install -r requirements.txt` — or add one package at a time.
1. **Run your code** — `python app.py` — repeat after every change.
> **3.14:** **Version currency:** Python 3.14 (Oct 2025) is the current stable release — its headline addition is template strings (`t"…"`, PEP 750), while the opt-in free-threaded (no-GIL) build keeps maturing. This guide targets 3.13+; everything here runs on both.

## Built-in types {#types}

Every value has a type; knowing which are mutable is half the language.

| Type | Example | Mutable | Notes |
| --- | --- | --- | --- |
| `int` | `42` | no | arbitrary precision; `10 // 3` floors |
| `float` | `3.14` | no | IEEE-754 double; `1e3` == 1000 |
| `str` | `"py"` | no | immutable; `.split()`, `.join()` |
| `bool` | `True` / `False` | no | a subclass of `int` |
| `list` | `[1, 2]` | yes | ordered, dynamic; `.append()` |
| `tuple` | `(1, 2)` | no | immutable, hashable (usable as dict key) |
| `set` | `{1, 2}` | yes | unique, unordered; `a & b` intersects |
| `dict` | `{"k": 1}` | yes | key → value, insertion-ordered |
| `NoneType` | `None` | — | the “no value” singleton |

`immutable: int · float · str · bool · tuple` `mutable: list · set · dict`

### Slicing — seq[start:stop:step]

```
s = "python"
s[0]      # 'p'   first
s[-1]     # 'n'   last
s[1:4]    # 'yth'
s[::2]    # 'pto' every other
s[::-1]   # 'nohtyp' reversed
```

### Membership & type checks

```
"py" in "python"         # True
3 in [1, 2, 3]           # True
"k" in {"k": 1}          # True (keys)
type(x) is int           # exact type
isinstance(x, (int, float))
```

> **!:** **Mutability gotcha:** `b = a` does not copy — both names point to the same object, so `a = [1]; b = a; b.append(2)` changes `a` to `[1, 2]` too. Copy with `b = a.copy()` or `b = a[:]`. Only pass a mutable object to a function if you mean for it to be changed.

## Control flow & comprehensions {#control}

Loops and conditions, then the concise comprehension forms that replace them.

### if / elif / else

```
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"

grade = "A" if score >= 90 else "B"   # ternary
```

### for / while / break / continue

```
for item in items:
    print(item)

while x < 10:
    x += 1
    if x == 5:
        break       # exit loop
    continue        # next iteration
```

### Comprehensions

```
[n * 2 for n in range(5)]       # [0, 2, 4, 6, 8]
[n for n in nums if n > 0]      # filter
{x: x**2 for x in range(3)}     # {0: 0, 1: 1, 2: 4}
{x % 3 for x in range(10)}      # {0, 1, 2}
```

### Generators & context managers

```
sum(n * n for n in nums)         # lazy, no list
",".join(str(n) for n in nums)

with open("data.txt") as f:      # auto-closes
    text = f.read()
```

> **KEY:** **Comprehension anatomy:** `[expression for item in iterable if condition]`. Drop the brackets — `(n*2 for n in nums)` — to get a lazy generator expression when you only iterate once.

## Functions & decorators {#functions}

Define once, reuse everywhere — and decorate, generate, or inline them.

### def & default arguments

```
def greet(name, greeting="hi"):
    return f"{greeting}, {name}"

greet("Ada")              # 'hi, Ada'
greet("Ada", "yo")        # 'yo, Ada'
greet(greeting="hey", name="Bo")
```

### *args & **kwargs

```
def fn(*args, **kwargs):
    print(args)      # tuple of positional
    print(kwargs)    # dict of keyword

fn(1, 2, x=3)        # (1, 2) {'x': 3}

def f(a, b, *, c):   # c is keyword-only
    ...
```

### lambda

```
sq = lambda x: x * x
sq(4)                       # 16

sorted(items, key=lambda x: x.price)
pairs = [(p, q) for p, q in zip(a, b) if p]
```

### Decorators

```
def timer(fn):
    def wrapper(*a, **kw):
        t = time.time()
        r = fn(*a, **kw)
        print(f"{fn.__name__}: {time.time() - t:.3f}s")
        return r
    return wrapper

@timer
def work():
    ...
```

### Generators (yield)

```
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        yield a        # lazy: one at a time
        a, b = b, a + b

list(fib(6))           # [0, 1, 1, 2, 3, 5]
```

### Walrus operator :=

```
if (n := len(items)) > 10:
    print(f"{n} is a lot")

while (line := f.readline()):
    process(line)

if (m := re.search(r"\d+", s)):
    print(m.group())
```

> **!:** **Never use a mutable default:** `def f(x, seen=[])` shares one list across every call. Write `def f(x, seen=None):` and inside `seen = seen or []`.

> **!:** **Late-binding closure gotcha:** a loop variable captured by a `lambda` or inner function is read at call time, not definition time — `[lambda: i for i in range(3)]` returns three functions that all give `2`. Bind it as a default: `lambda i=i: i`.

## Classes & dataclasses {#classes}

Objects are dictionaries with behavior; dataclasses remove the boilerplate.

### class, __init__, self

```
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def move(self, dx, dy):
        self.x += dx
        self.y += dy

p = Point(3, 4)
p.move(1, -2)     # p.x == 4, p.y == 2
```

### @dataclass

```
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p = Point(3, 4)       # auto __init__
p == Point(3, 4)      # auto __eq__ → True
repr(p)               # 'Point(x=3, y=4)'
```

### @property

```
class Circle:
    def __init__(self, r):
        self._r = r

    @property
    def area(self):          # call without ()
        return 3.14159 * self._r ** 2

c = Circle(2)
c.area                     # 12.566…
```

| Dunder method | Triggered by | Purpose |
| --- | --- | --- |
| `__init__` | `C(...)` | constructor — set up state |
| `__repr__` | `repr(obj)` | unambiguous, for debugging |
| `__str__` | `str(obj)`, `print` | human-readable |
| `__eq__` | `==` | equality between instances |
| `__len__` | `len(obj)` | size / length |
| `__getitem__` | `obj[k]` | indexing / slicing |
| `__iter__` | `for x in obj` | iteration |
| `__enter__`/`__exit__` | `with` | context manager |

> **KEY:** For plain data containers, prefer `@dataclass` — it writes `__init__`, `__repr__`, and `__eq__` for you. Add `frozen=True` for an immutable record.

## stdlib {#stdlib}

The batteries included: paths, JSON, dates, regex, and the itertools/functools toolkit.

- `from pathlib import Path` — Modern paths; replaces most of os.path.
- `Path("a/b.txt").read_text()` — Read a whole file as a string.
- `Path("out.txt").write_text(s)` — Write a string to a file.
- `Path("src").glob("*.py")` — Iterate files matching a glob.
- `json.loads(s)` — Parse a JSON string into objects.
- `json.dumps(obj, indent=2)` — Serialize an object to a JSON string.
- `datetime.now().isoformat()` — Sortable timestamp string.
- `datetime.fromisoformat(s)` — Parse an ISO timestamp back.
- `re.search(r"\d+", s)` — First match; read it with .group().
- `re.findall(r"\w+", s)` — All matches as a list.
- `re.sub(r"\s+", " ", s)` — Replace matches (collapse whitespace).
- `Counter("abracadabra")` — Count items; .most_common(3) ranks them.
- `defaultdict(list)` — Dict with a default factory — append without setup.
- `namedtuple("P", "x y")` — Lightweight immutable record with named fields.
- `itertools.chain(a, b)` — Iterate a then b.
- `itertools.groupby(xs, key=fn)` — Group consecutive items by key.
- `itertools.product(a, b)` — Cartesian product of iterables.
- `functools.lru_cache` — Memoize a pure function — decorate with @lru_cache.
- `functools.reduce(fn, xs)` — Fold an iterable left-to-right.
- `os.environ["HOME"]` — Read an environment variable.

<details>
<summary>More stdlib worth knowing</summary>

#### argparse

```
p = argparse.ArgumentParser()
p.add_argument("name")
args = p.parse_args()
```

#### random

```
random.choice(xs)
random.randint(1, 6)
```

#### math / statistics

```
math.sqrt(2)
statistics.median(xs)
```

#### sqlite3 / shutil

```
sqlite3.connect("app.db")
shutil.copy(src, dst)
```

</details>

## Everyday patterns {#patterns}

The idioms that appear in every codebase — f-strings, unpacking, sorting, and safe error handling.

**input** (raw bytes) → **parse** (json.loads) → **transform** (comprehension) → **validate** (try/except) → **output** (result)

### f-strings

```
name, n = "Ada", 3
f"{name} has {n} items"
f"{n:>4}"            # pad to width 4
f"{price:.2f}"       # 2 decimal places
f"{n=}"              # 'n=3' (debug)
```

### Unpacking

```
a, b = b, a             # swap
first, *rest = items    # head + tail
*all, last = items
merged = {**d1, **d2}   # merge dicts
nums = [*a, *b]         # concat lists
```

### dict.get & defaults

```
d.get("k")                # None if missing
d.get("k", 0)             # fallback
d.setdefault("k", []).append(x)

v = d.get("k") or 0       # {} and [] are falsy too
```

### enumerate & zip

```
for i, item in enumerate(items, start=1):
    print(i, item)

for name, score in zip(names, scores):
    print(name, score)

dict(zip(keys, values))   # build a dict
```

### sorted(key=)

```
sorted(items)                 # natural order
sorted(items, key=str.lower)
sorted(users, key=lambda u: u.age)
sorted(users, key=lambda u: u.age, reverse=True)

items.sort(key=fn)            # in-place
```

### try / except / else / finally

```
try:
    n = int(raw)
except ValueError as e:
    print("bad input:", e)
else:
    print("parsed", n)    # no exception raised
finally:
    print("always runs")  # cleanup
```

> **!:** **Truthiness gotcha:** `""`, `[]`, `{}`, `0`, and `None` are all falsy — write `if x:`, not `if x == True:` (which only matches literal `True`/`1`, not other truthy values like `"yes"`).

## Tooling & types {#tooling}

Type hints, linters, tests, and the debugger that keep a growing codebase honest.

### Type hints

```
def add(a: int, b: int) -> int:
    return a + b

def first(items: list[str]) -> str | None:
    return items[0] if items else None

def apply(fn: Callable[[int], int], x: int) -> int:
    return fn(x)
```

### mypy & ruff

```
mypy app.py          # static type check
ruff check .         # lint
ruff check --fix .   # auto-fix
ruff format .        # formatter
```

### pytest

```
# test_math.py
def test_add():
    assert add(2, 3) == 5

def test_raises():
    with pytest.raises(ValueError):
        parse("nope")

pytest -q            # run tests
```

### __main__ guard

```
def main():
    args = parse_args()
    run(args)

if __name__ == "__main__":
    main()
```

### pdb (debugger)

```
breakpoint()           # Python 3.7+; pauses here
# older: import pdb; pdb.set_trace()

# at the (Pdb) prompt:
n   # next line      s   # step into
c   # continue       q   # quit
```

#### pdb — move

- Next line — <kbd>n</kbd>
- Step into — <kbd>s</kbd>
- Return — <kbd>r</kbd>

#### pdb — inspect

- Print expr — <kbd>p expr</kbd>
- Pretty-print — <kbd>pp expr</kbd>
- List source — <kbd>ll</kbd>

#### pdb — control

- Continue — <kbd>c</kbd>
- Quit — <kbd>q</kbd>
- Help — <kbd>h</kbd>
> **!:** **Type hints are not enforced at runtime.** They are documentation that `mypy` checks statically. Python will happily run `add("a", "b")` — mypy is what catches it.
