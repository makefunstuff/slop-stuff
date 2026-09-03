---
title: "Zig"
description: "Comptime, memory/allocators, optionals/errors, build.zig, and C interop."
category: "Languages"
tags: ["language", "comptime", "allocator", "interop"]
weight: 130
lead: "A modern C that's easier to read."
version: "systems language"
---
Zig is a general-purpose systems language with no hidden control flow, no hidden allocation, and a build system that doubles as a C/C++ compiler. This is the surface you touch every day: syntax, memory, errors, comptime, and C interop — current for **Zig 0.14.0**.

## Quick reference {#quickref}

The nine things you reach for most often, in one glance — each is unpacked in the sections below.

- `zig init` — Scaffold a project: build.zig, build.zig.zon, src/main.zig.
- `zig build / run / test` — build compiles, build run compiles + runs, build test runs tests.
- `const / var` — Immutable vs mutable binding — prefer const; Zig enforces it.
- `comptime` — Evaluate code at build time; types are first-class values, no macros.
- `try / catch / orelse` — Propagate errors, handle them, or supply a default value.
- `defer / errdefer` — Scope-exit cleanup (LIFO); errdefer runs only on error return.
- `Allocator` — Passed explicitly everywhere — no hidden allocation. You allocate, you free.
- `@cImport / @cInclude` — Parse C headers and call into C directly — no bindings generator.
- `!T / ?T` — Error unions and optionals — errors and null are values, not exceptions.

## Build & project {#start}

Everything starts from `zig init` and a `build.zig` file — one tool runs builds, tests, formatting, and C compilation.

### 1. Init a project

```
zig init
# → build.zig
#   build.zig.zon
#   src/main.zig
```

### 2. Build & run

```
zig build            # compile
zig build run        # compile + run
zig build test       # run tests
zig build -Doptimize=ReleaseFast
```

### 3. Format

```
zig fmt .            # format all
zig fmt --check .    # verify only
```

### 4. As a C compiler

```
zig cc main.c -o main
zig cc -target x86_64-linux-gnu \
  hello.c -o hello
```

> **KEY:** **`build.zig` is the build script.** It's ordinary Zig — the standard template creates an executable from `src/main.zig` and wires up the install step. const std = @import("std");
> pub fn build(b: *std.Build) void {
>  const exe = b.addExecutable(.{
>  .name = "app",
>  .root_source_file = b.path("src/main.zig"),
>  .target = b.standardTargetOptions(.{}),
>  .optimize = b.standardOptimizeOption(.{}),
>  });
>  b.installArtifact(exe);
> }

## Syntax & types {#basics}

Zig's type system is small and explicit: ints, floats, bools, and the containers — arrays, slices, structs, enums, unions, optionals.

### const vs var

```
const x = 1;   // immutable
var y = 2;     // mutable
y += 1;        // ok
// x += 1;     // error: cannot assign to constant
```

### comptime_int

Untyped literals are `comptime_int` and coerce to the type you name.

```
const a = 1;        // comptime_int
const b: u32 = a;   // u32
comptime { @compileLog("build time"); }
```

| Type | Notes | Example |
| --- | --- | --- |
| `u8` … `u128` | unsigned ints | `const n: u8 = 255;` |
| `i8` … `i128` | signed ints | `const n: i32 = -42;` |
| `usize` / `isize` | pointer-sized | `const i: usize = arr.len;` |
| `f32` / `f64` | floats | `const x: f64 = 3.14;` |
| `bool` | true / false | `const ok = true;` |
| `[N]T` | fixed array | `const a = [3]u8{ 1, 2, 3 };` |
| `[]T` | slice (ptr + len) | `const s: []const u8 = "hi";` |
| `?T` | optional (T or null) | `var x: ?u32 = null;` |
| `struct` | named fields | `const P = struct { x: i32, y: i32 };` |
| `enum` | tagged variants | `const C = enum { red, green, blue };` |
| `union` | one-of (tagged or not) | `const U = union(enum) { i: i32, f: f64 };` |

<details>
<summary>Containers in practice</summary>

#### struct & enum

```
const Point = struct { x: i32, y: i32 };
const Color = enum { red, green, blue };

const p = Point{ .x = 1, .y = 2 };
const c: Color = .red;
```

#### union & optional

```
const Value = union(enum) {
    int: i32,
    float: f64,
};

var maybe: ?u32 = null;
maybe = 42;
if (maybe) |m| { /* m: u32 */ }
```

</details>

## Memory & allocators {#memory}

Nothing allocates unless you hand it an allocator, and nothing frees for you — `defer` is the cleanup pattern.

> **KEY:** **No hidden allocation.** Zig never allocates behind your back. Any function that needs memory takes an `Allocator` argument you pass in, and you free it yourself (or let `defer` do it).

### DebugAllocator

Safety-first: detects leaks and double-frees on `deinit`. Use during development. Renamed from `GeneralPurposeAllocator` in 0.14.

```
var gpa: std.heap.DebugAllocator(.{}) = .init;
defer _ = gpa.deinit();
const alloc = gpa.allocator();

const buf = try alloc.alloc(u8, 64);
defer alloc.free(buf);
```

### page & arena

`page_allocator` hands out whole pages and never frees; an arena frees everything at once.

```
const page = std.heap.page_allocator;

var arena = std.heap.ArenaAllocator.init(page);
defer arena.deinit();
const a = arena.allocator();
```

### defer for cleanup

`defer` runs at scope exit — including error returns — in LIFO order.

```
fn open() !void {
    var f = try std.fs.cwd().openFile("a.txt", .{});
    defer f.close();
    // f.close() runs when open() returns
}
```

## Errors & optionals {#errors}

Errors are values, not exceptions: `!T` unions, `try`, `catch`, `orelse`, and `errdefer`.

| Construct | Meaning | Example |
| --- | --- | --- |
| `!T` | error union: T or an error | `fn f() !u32` |
| `try` | propagate error, else unwrap | `const n = try f();` |
| `catch` | handle error / give default | `const n = f() catch 0;` |
| `if (x) \|v\|` | unwrap optional when present | `if (maybe) \|m\| { … }` |
| `orelse` | default when null | `const n = maybe orelse 0;` |
| `error{…}` | named error set | `error{NotFound, OutOfMemory}` |
| `errdefer` | runs only on error return | `errdefer alloc.free(buf);` |

### Propagate with try

```
fn load() ![]u8 {
    const buf = try alloc.alloc(u8, 256);
    return buf;
}
```

### Handle with catch / orelse

```
const n = parseU32(s) catch 0;
const m = maybe_value orelse 42;
// error capture:
const v = f() catch |err| blk: {
    log(err);
    break :blk default;
};
```

<details>
<summary>Unwrapping error unions</summary>

```
const std = @import("std");

fn find(haystack: []const u8, needle: u8) !usize {
    for (haystack, 0..) |c, i| {
        if (c == needle) return i;
    }
    return error.NotFound;
}

pub fn main() void {
    const idx = find("zig", 'z') catch {
        std.debug.print("not found\n", .{});
        return;
    };
    std.debug.print("found at {d}\n", .{idx});
}
```

</details>

> **!:** **`errdefer` runs only when the function returns an error.** Use it to clean up on failure while `defer` always runs.

## Comptime {#comptime}

Types are first-class values at compile time — metaprogramming with the same language, no macro system.

### 1. Compile-time eval

```
fn fact(n: u64) u64 {
    return if (n == 0) 1 else n * fact(n - 1);
}
const TABLE = comptime fact(5); // 120
```

### 2. Types as values

```
fn Vec(comptime T: type) type {
    return struct { items: []T, len: usize };
}
const Bytes = Vec(u8);
```

### 3. Generics via comptime

```
fn max(comptime T: type, a: T, b: T) T {
    return if (a > b) a else b;
}
const biggest = max(i32, 3, 7); // 7
```

### 4. Builtins

```
const std = @import("std");  // comptime
const T = @TypeOf(42);       // comptime_int
const n: u8 = @intCast(200); // checked
const size = @sizeOf(u64);   // 8
```

| Builtin | What it does |
| --- | --- |
| `@import` | compile-time import of a module |
| `@TypeOf` | type of an expression |
| `@intCast` | checked integer conversion |
| `@intFromEnum` | enum → integer |
| `@enumFromInt` | integer → enum |
| `@compileLog` | print a value at build time |
| `@field` | access a struct field by comptime name |

> **⌁:** **Comptime is ordinary Zig.** Loops, `if`, functions, and `switch` all work at compile time — there's no separate template language to learn.

## C interop {#interop}

Call into C with `@cImport`, `extern`, and direct linking — no bindings generator required.

### Import a header

```
const c = @cImport({
    @cInclude("stdio.h");
});

pub fn main() void {
    _ = c.printf("hello: %d\n", 42);
}
```

### Declare extern

```
extern "c" fn puts([*:0]const u8) c_int;

pub fn main() void {
    _ = puts("via extern");
}
```

### Link C in build.zig

```
exe.linkLibC();
exe.linkSystemLibrary("sqlite3");
exe.addIncludePath(.{
    .cwd_relative = "include",
});
exe.addObjectFile(.{
    .cwd_relative = "vendor/libfoo.a",
});
```

### Translate C

```
zig translate-c -lc hello.h > hello.zig
zig cc -c helper.c -o helper.o
```

> **✓:** **Tip:** Zig treats C as a first-class citizen. `zig cc` is a drop-in C/C++ compiler, and `@cImport` parses headers with Clang so you get types and functions for free.

## std library {#std}

A small, coherent standard library for containers, formatting, memory, OS calls, and testing.

- `std.ArrayList(T)` — growable list: init(alloc), append, items, deinit.
- `std.StringHashMap(V)` — string-keyed map: put, get, deinit.
- `std.fmt` — format & parse: allocPrint, parseInt, bufPrint.
- `std.mem` — memory utils: eql, indexOf, tokenize, copyForwards.
- `std.posix` — OS interfaces: argv, getenv, file I/O. (std.os is the legacy alias.)
- `std.testing` — assertions: expect, expectEqual, expectError.
- `std.debug.print` — printf-style debug output to stderr.

### ArrayList & HashMap

```
var list = std.ArrayList(u8).init(alloc);
defer list.deinit();
try list.appendSlice("hello");
try list.append('!');
std.debug.print("{s}\n", .{list.items});

var map = std.StringHashMap(u32).init(alloc);
defer map.deinit();
try map.put("zig", 2024);
```

### fmt, mem & testing

```
const s = try std.fmt.allocPrint(alloc, "{d}", .{42});
defer alloc.free(s);

const same = std.mem.eql(u8, "zig", "zig");

test "1 + 1 = 2" {
    try std.testing.expectEqual(2, 1 + 1);
}
```

| Specifier | Meaning |
| --- | --- |
| `{s}` | string (`[]const u8`) |
| `{d}` | decimal integer |
| `{x}` / `{X}` | hex, lower / upper |
| `{b}` | binary |
| `{e}` | float, scientific |
| `{any}` | any value (debug) |

> **0.14:** **0.14 std direction:** the library is moving toward *unmanaged* containers — `std.ArrayListUnmanaged` / `std.StringHashMapUnmanaged`, which take an allocator per call. The managed `std.ArrayList` and `std.StringHashMap` shown here still work, and `std.heap.GeneralPurposeAllocator` is now `std.heap.DebugAllocator`.

## Pitfalls {#gotchas}

The behaviors that surprise C and C++ programmers on day one.

### You allocate, you free

There is no garbage collector and no reference counting. If you allocate, you must free — `defer` is the cleanup idiom.

```
const buf = alloc.alloc(u8, 64) catch return;
defer alloc.free(buf);
```

### Overflow is checked

Arithmetic overflow panics in Debug and ReleaseSafe builds. Convert explicitly with `@intCast`.

```
var n: u8 = 250;
n += 10;                  // panic: overflow
const m: u8 = @intCast(300); // panic: 300 > 255
```

### No hidden control flow

No exceptions, no operator overloading, no implicit conversions. A function call is just a function call — everything is greppable.

```
const result = try compute();
// `try` is just sugar for:
//   if (err) return err;
```

### No RAII, no destructors

Resources are freed explicitly. There are no destructors; scope-exit cleanup is done with `defer` (and `errdefer` on error paths).

```
var arena = std.heap.ArenaAllocator.init(page);
defer arena.deinit();
```

### Unused locals don't compile

Zig rejects unused local variables and function parameters — and shadowing an outer name. Discard deliberately with `_ = value;`.

```
fn f(x: u32) void {
    _ = x;            // discard, not unused
}

pub fn main() void {
    var y: u32 = 0;   // error: unused local
}
```

### for-loops & exhaustive switch

There's no C-style `for (;;)` — iterate collections with `for` and loops with `while`. A `switch` over an enum must cover every case (or add `else`).

```
for (items, 0..) |it, i| { /* it, i */ }

switch (c) {
    .red => {},
    .green => {},
    .blue => {},   // omit one → compile error
}
```

> **!:** **comptime is build-time, not runtime.** A `comptime` type or value does not exist in the final binary. Materialize a runtime value from it before the binary runs.
