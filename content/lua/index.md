---
title: "Lua"
description: "Tables, metatables, patterns, modules, and embedding."
category: "Languages"
tags: ["language", "tables", "patterns", "require"]
weight: 90
lead: "Small, fast, embeddable."
version: "5.5"
---
Lua is a tiny scripting language you drop into games, servers, and tools. One table to rule every data structure, a handful of types, and C-level speed — with `luajit` on top when you need more.

## Quick reference {#quickref}

The essentials you reach for most, in one pass. Each links to its deep-dive section.

- `local t = {1, 2, 3}` — the one container: arrays and maps are the same [table](#tables) (1-indexed).
- `setmetatable(t, {__index = mt})` — `__index` fills missing keys, `__newindex` traps writes — [metatables](#tables).
- `for i, v in ipairs(t)` — array order `1..n`; `pairs(t)` walks every key — [iterators](#tables).
- `s:match("(%w+)=(%w+)")` — Lua patterns (`%d` `%s` `%w` `()`), not regex — [strings](#strings).
- `s:gsub("%s+", " ")` — collapse runs of whitespace to one space.
- `local f = function(a) return a, a * 2 end` — first-class + multiple returns — [functions](#functions).
- `return function() n = n + 1 end` — closures capture surrounding locals — [closures](#functions).
- `local m = require("mymod")` — runs once, caches, returns the module — [require](#modules).
- `coroutine.resume(co)` — `create` / `resume` / `yield` — [coroutines](#misc).

`%d` `%s` `%w` `%a` `#` `..` `:` `//` `nil`

> **⚡:** **Truthiness:** only `nil` and `false` are falsy — `0` and `""` are true. **Prefer `local`:** bare names become globals.

## Run & basics {#start}

Run a file with `lua script.lua` or a snippet with `-e`. Comments use `--`, and semicolons are optional everywhere.

### 1. Run a script

```
lua script.lua
luajit script.lua
```

### 2. One-liner

```
lua -e 'print(2 + 2)'   # → 4
lua -e 'print(2 ^ 10)'  # → 1024.0
```

### 3. Comments

```
-- single line
--[[ multi
     line ]]
```

### 4. Variables

```
local x = 10     -- local
count = 0        -- global
-- no semicolons
```

`lua script.lua` run a file
`lua -e 'print(1)'` inline snippet
`luajit script.lua` JIT runtime

> **KEY:** **Prefer `local`.** Bare assignments create globals; `local` scopes the name to its block and is faster to access. In the REPL, exit with <kbd>Ctrl</kbd>+<kbd>D</kbd> or `os.exit()`.

## Types & values {#types}

Eight types, but you touch six daily. Only `nil` and `false` are falsy — `0` and `""` are both true.

| Type | Example | Notes |
| --- | --- | --- |
| `nil` | `nil` | absent value; falsy |
| `boolean` | `true`, `false` | only false + nil are falsy |
| `number` | `3.14`, `2`, `0x1F` | doubles; integers in 5.3+ |
| `string` | `"hi"`, `'hi'`, `[[raw]]` | immutable; both quote styles |
| `function` | `function() end` | first-class values |
| `table` | `{}`, `{1, 2}`, `{k = "v"}` | the only container type |

`type("hi")` → `string`
`#{"a","b","c"}` → `3`
`type(nil)` → `nil`

> **!:** **Truthiness:** only `nil` and `false` are false. `0`, `""`, and `{}` are all truthy, so `if 0 then print("yes") end` prints `yes`.

## Tables {#tables}

The one container type: arrays, maps, objects, and namespaces are all tables. Arrays are **1-indexed**.

### Array (1-indexed)

```
local t = {"a", "b", "c"}
print(t[1])        -- "a"
t[#t + 1] = "d"    -- append
print(#t)          -- 4
```

### Map / record

```
local p = {name = "Ada", age = 36}
print(p.name)      -- "Ada"
p["role"] = "admin"
print(p.role)      -- "admin"
```

### table.* helpers

```
table.insert(t, "x")   -- append
table.remove(t, 1)     -- pop front
table.concat(t, ", ")  -- join
table.sort(t)          -- sort in place
```

| Iterator | Walks | Use for |
| --- | --- | --- |
| `ipairs(t)` | keys `1, 2, 3…` until `nil` | contiguous arrays, in order |
| `pairs(t)` | every key, any order | maps, string keys, sparse tables |

**t.foo** (read a key) → **__index** (metamethod) → **mt.foo** (fallback value)

> **MT:** **Metatables** hook into table behavior. `__index` supplies missing keys (defaults, inheritance), `__newindex` intercepts writes. Set with `setmetatable(t, {__index = mt})`.

## Strings & patterns {#strings}

Strings are immutable and concatenate with `..`. Pattern matching uses Lua patterns, not regular expressions.

### Concatenate & format

```
local s = "Hello" .. " " .. "world"
string.format("%s: %05d", "id", 42)
-- "id: 00042"
```

### Extract

```
s:sub(1, 5)        -- "Hello"
s:find("world")    -- start, end or nil
s:match("%d+")     -- first number or nil
```

### Replace

```
s:gsub("l", "L")       -- all l → L
s:gsub("%s+", " ")     -- collapse space
s:gsub("(%w+)=(%w+)", "%2=%1")
```

- `s:upper()` — uppercase copy.
- `s:lower()` — lowercase copy.
- `#s` — byte length.
- `s:rep(3)` — repeat the string.
- `s:find("x")` — first match index.
- `s:gsub("a", "b")` — substitute all.

| Pattern | Matches | Example |
| --- | --- | --- |
| `%d` | a digit | `"a1b2":match("%d+")` → `1` |
| `%w` | alphanumeric | `"ab_c":match("%w+")` → `ab_c` |
| `%s` | whitespace | `gsub("%s+", " ")` |
| `%a` | a letter | `"lua":match("%a+")` → `lua` |
| `()` | capture group | `"k=v":match("(%w+)=(%w+)")` |
| `^` / `$` | start / end anchor | `"lua":match("^l")` → `l` |

`%d` `%w` `%s` `%a` `%c` `%p` `%l` `%u` `%x`

> **⚠:** **Lua patterns are not regex.** No `|` alternation, no `{n,m}` repetition, no `?` quantifier. You get `.`, `*`, `+`, `-`, classes `%x`, and captures `()` — enough for most parsing.

## Functions & closures {#functions}

Functions are first-class values with multiple returns and varargs. Closures capture their surrounding `local` variables.

### Multiple returns

```
local function divmod(a, b)
  return a // b, a % b
end
local q, r = divmod(17, 5)
print(q, r)   -- 3  2
```

### Varargs ...

```
local function sum(...)
  local total = 0
  for _, v in ipairs({...}) do
    total = total + v
  end
  return total
end
print(sum(1, 2, 3, 4))  -- 10
```

### Closures

```
local function counter()
  local n = 0
  return function()
    n = n + 1
    return n
  end
end
local next = counter()
print(next(), next())   -- 1  2
```

<details>
<summary>Function extras</summary>

#### Anonymous as arguments

```
table.sort(names, function(a, b)
  return a < b
end)
```

#### Recursion needs a name

```
local fact
fact = function(n)
  if n == 0 then return 1 end
  return n * fact(n - 1)
end
```

#### Multiple assignment

```
local a, b = b, a     -- swap
local x, y = returns2()
```

#### Colon syntax

```
function obj:method() end
-- sugar for obj.method(self)
```

</details>

> **fn:** **Functions are first-class.** Store them in variables, pass them as arguments, return them from other functions. A closure keeps its `local` variables alive after the outer function returns.

## Modules & require {#modules}

`require` loads a file once, runs it, and returns whatever it returns — usually a table of functions.

### my_mod.lua

```
local M = {}
function M.greet(name)
  return "hi " .. name
end
return M
```

### main.lua

```
local my_mod = require("my_mod")
print(my_mod.greet("Ada"))  -- hi Ada
```

1. **Search `package.path`** — Turn `"my_mod"` into a file path like `./my_mod.lua`.
1. **Load the chunk** — Compile and run the file as a fresh chunk.
1. **Return the table** — Whatever the module `return`s becomes the value of `require`.
1. **Cache in `package.loaded`** — Later `require` calls return the same table.

<details>
<summary>Module patterns</summary>

#### Return a table (recommended)

```
local M = {}
M.hello = function() print("hi") end
return M
```

#### Cache manually

```
package.loaded["mymod"] = M
-- require("mymod") returns M
```

</details>

> **req:** **Prefer returning a table.** The old `module()` function is deprecated — it hides globals. A module that returns a table is explicit and plays well with `package.path` and `package.loaded`.

## Coroutines & embedding {#misc}

Coroutines give cooperative multitasking; the C API and LuaJIT FFI give you the host machine.

### Coroutines

```
local co = coroutine.create(function()
  for i = 1, 3 do
    coroutine.yield(i)
  end
end)
print(coroutine.resume(co))  -- true  1
print(coroutine.resume(co))  -- true  2
print(coroutine.status(co))  -- suspended
```

### LuaJIT FFI

```
local ffi = require("ffi")
ffi.cdef[[ int abs(int n); ]]
print(ffi.C.abs(-42))  -- 42
```

- **running** — Executing now; the one active coroutine.
- **suspended** — Paused at `yield` or fresh from `create`.
- **normal** — It resumed another coroutine.
- **dead** — Finished; `resume` returns `false`.
- `luaL_newstate()` — create an interpreter.
- `luaL_openlibs(L)` — load the standard library.
- `lua_pushnumber(L, 42)` — push a value onto the stack.
- `lua_getglobal(L, "fn")` — push a global onto the stack.
- `lua_pcall(L, 0, 0, 0)` — protected call.
- `lua_tonumber(L, -1)` — read a number off the stack.

> **co:** **Cooperative, not preemptive.** A coroutine only switches when it calls `coroutine.yield`. No locks, no data races — but one tight loop can hog the whole program.

## Pitfalls {#gotchas}

Small behaviors that surprise people coming from other languages.

### Arrays start at 1

`t[1]` is the first element — there is no `t[0]`. Loops run `1, #t`.

```
local t = {"a", "b"}
print(t[1])   -- "a"
print(t[0])   -- nil
```

### No continue statement

Use `goto` with a label, or restructure the loop with an `if`.

```
for i = 1, 10 do
  if i == 5 then goto next end
  print(i)
  ::next::
end
```

### nil ends iteration

`ipairs` and `#` stop at the first `nil`, so holes hide the rest of the array.

```
local t = {1, nil, 3}
print(#t)      -- 1 or 3 (undefined)
```

### # is undefined on holes

The length of a table with `nil` gaps is unspecified. Count manually instead.

```
local n = 0
for _ in pairs(t) do n = n + 1 end
```

### String methods need a colon

`s:match("x")` is sugar for `s.match(s, "x")`. A dot drops the receiver and errors on a `nil` index.

```
s:upper()      -- ok
s.upper(s)     -- equivalent
s.upper()      -- error: nil value
```

### and / or return operands

They yield values, not booleans — idiomatic for defaults and guards.

```
local x = maybe or "default"
local y = flag and "yes" or "no"
```

> **⚠:** **Globals by default.** Assigning to an undeclared name creates a global — visible everywhere, easy to clobber. Declare with `local` at the top of each block.
