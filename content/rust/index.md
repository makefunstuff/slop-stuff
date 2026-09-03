---
title: "Rust"
description: "Ownership, cargo, match, Result, traits, and concurrency."
category: "Languages"
tags: ["language", "ownership", "cargo", "traits"]
weight: 110
lead: "Systems speed, memory safety."
version: "cargo · std"
---
Rust gives you C-level performance with memory safety enforced at compile time — no garbage collector, no null, no data races. This is the surface you'll touch every day. Current for the **Rust 2024 Edition**.

## Quick reference {#quickref}

The nine things you reach for most often, in one glance — each is unpacked in the sections below.

- `cargo new / build / run / test` — Scaffold a package, compile, run, and test — the whole daily loop lives in one tool.
- `ownership` — One owner per value; move vs `Copy`. The value is dropped when its owner leaves scope.
- `& / &mut` — Many shared borrows *or* one mutable borrow — never both at once.
- `match` — Exhaustive pattern matching over values, ranges, and enums.
- `Result<T, E> / ?` — Return failures as values; `?` propagates `Err` up the stack.
- `Option<T>` — `Some(x)` / `None` — no null; handle with `unwrap_or` or `match`.
- `Vec<T> / HashMap<K, V>` — The two collections you'll use daily; read with `.get()`, not indexing.
- `#[derive(...)]` — Auto-implement `Debug`, `Clone`, `PartialEq`, and more.
- `trait / impl` — Interfaces and shared behavior; pair with generics `<T: Trait>`.

## Cargo & project basics {#start}

`cargo` is the build tool, package manager, and test runner in one. Every crate starts with a `Cargo.toml` manifest and a `src/` tree.

### 1. New project

```
cargo new myapp        # binary
cargo new mylib --lib  # library
cargo init             # in current dir
```

### 2. Build & run

```
cargo build            # debug
cargo run              # build + run
cargo build --release  # optimized
```

### 3. Check & test

```
cargo check      # fast, no codegen
cargo test       # run tests
cargo test foo   # filter by name
```

### 4. Add dependencies

```
cargo add serde \
  --features derive
cargo add tokio \
  --features full
```

| Path / flag | What it is |
| --- | --- |
| `Cargo.toml` | Manifest: name, version, `edition = "2024"`, `[dependencies]`, profiles. |
| `src/main.rs` | Binary entry point (`fn main()`). |
| `src/lib.rs` | Library root for reusable crates. |
| `target/` | Build artifacts — add to `.gitignore`. |
| `cargo build --release` | Optimized build into `target/release/`. |
| `rustc main.rs` | Compile one file directly; prefer `cargo` for real projects. |

> **KEY:** **Start with `cargo check`.** It type-checks without codegen, so it's the fastest feedback loop while you write. Save `cargo build` for when you need a runnable binary.

## Ownership & borrowing {#ownership}

One owner per value. The borrow checker proves at compile time that you never use freed memory or mutate data that's aliased.

### The three rules

- Each value has exactly one owner.
- When the owner goes out of scope, the value is dropped.
- Many shared borrows (&) or one mutable borrow (&mut) — never both.

### Move vs Copy

```
let s1 = String::from("hi");
let s2 = s1;        // moved
// println!("{s1}"); // ✗ value moved

let n1 = 42;
let n2 = n1;        // Copy: n1 still valid
```

### Borrowing

```
fn len(s: &String) -> usize { s.len() }
fn push(s: &mut String) { s.push('!') }

let mut s = String::from("hi");
len(&s);         // shared borrow
push(&mut s);    // one &mut at a time
```

### Slices `&[T]`

```
let a = [1, 2, 3, 4, 5];
let mid = &a[1..3];   // [2, 3]

let s = String::from("hello");
let w: &str = &s[..]; // a view, no copy
```

### `String` vs `&str`

`String` owns its heap buffer and can grow; `&str` is a borrowed, fixed-length view. Take `&str` in arguments so callers can pass either.

```
fn shout(s: &str) -> String {
    format!("{}!", s)
}
```

> **!:** **The borrow checker** is the compiler, not a runtime GC. It rejects any use of a moved value and any second mutable borrow — so data races and use-after-free are **compile errors**, not bugs you chase in production.

## Core types & collections {#types}

Rust is statically typed with inference. Annotate with `let x: Type = …`; the compiler infers when you don't.

`i8` `i16` `i32` `i64` `i128` `isize` `u8` `u16` `u32` `u64` `u128` `usize` `f32` `f64` `bool` `char`

| Type | Example | Notes |
| --- | --- | --- |
| `i32` / `u64` | `let n: u64 = 42;` | Default integer is `i32`; `usize` for lengths/indices. |
| `f32` / `f64` | `let pi = 3.14f64;` | Default float is `f64`. |
| `bool` | `let ok = true;` | `true` / `false`; no truthy/falsy. |
| `char` | `let c = 'é';` | 4 bytes, one Unicode scalar value. |
| Tuple | `let t = (1, "a", 3.0);` | Fixed arity; index with `t.0`, `t.1`. |
| Array | `let a: [i32; 3] = [1, 2, 3];` | Fixed length, stack-allocated. |
| `Vec<T>` | `let v = vec![1, 2, 3];` | Growable heap vector; `v.push(4)`. |
| `HashMap<K, V>` | `let m = HashMap::new();` | `m.insert("k", 1)`; `m.get("k")`. |
| `Option<T>` | `Some(x)` / `None` | No null; see the Errors section. |
| `Result<T, E>` | `Ok(x)` / `Err(e)` | Fallible operations; see the Errors section. |
| `String` | `String::from("hi")` | Owned, growable UTF-8 text. |

### Build a collection

```
use std::collections::HashMap;

let mut v = vec![1, 2, 3];
v.push(4);                // [1, 2, 3, 4]

let mut m = HashMap::new();
m.insert("a", 1);
let got = m.get("a");     // Some(&1)
```

### Ownership in containers

Collections own their elements. Reads give you references (`&T`), so handle `Option` results and borrow lifetimes.

```
let first = v.get(0);   // Option<&i32>
match first {
    Some(&n) => println!("{n}"),
    None => println!("empty"),
}
```

## Control flow & pattern matching {#control}

Rust's control constructs are **expressions** — they evaluate to a value, so you can assign their result.

### `if` / `else`

```
let n = 12;
let label = if n > 10 {
    "big"
} else if n > 5 {
    "medium"
} else {
    "small"
};   // if is an expression
```

### `loop` / `while`

```
let mut i = 0;
loop {
    i += 1;
    if i == 5 { break; }
}

while i < 10 {
    i += 1;
}
```

### `for .. in`

```
for x in 0..5 {
    println!("{x}");     // 0..4
}
for x in [10, 20, 30] {
    println!("{x}");
}
```

### `match`

```
match n {
    0 => "zero",
    1 | 2 => "small",
    3..=9 => "medium",
    _ => "big",
}
```

### `if let` / `while let`

```
if let Some(v) = maybe {
    println!("{v}");
}

while let Some(v) = it.next() {
    println!("{v}");
}
```

### `let else`

Bind a pattern and bail out early if it doesn't match — the `else` block must diverge (`return`, `break`, `continue`).

```
let Some(v) = maybe else {
    return Err("missing");
};
println!("{v}");  // v is in scope here
```

### `let` chains

Combine multiple `let` conditions with `&&` in one `if` (Rust 2024 Edition).

```
if let Some(x) = a
    && let Some(y) = b
    && x == y
{
    println!("both match");
}
```

### Iterators

```
let nums = vec![1, 2, 3, 4];
let out: Vec<i32> = nums.iter()
    .copied()            // &i32 → i32
    .map(|x| x * 2)
    .filter(|x| x % 4 == 0)
    .collect();          // [4, 8]
```

### Iterator methods

```
.iter()       // borrows (&T)
.into_iter()  // consumes (T)
.map(f)  .filter(f)
.enumerate() .take(n)
.sum()  .count()  .collect()
```

## Errors & `Result` {#errors}

Fallible functions return `Result<T, E>` or `Option<T>`. Propagate with `?`; only unwrap when you truly can't proceed.

### `Result<T, E>` + `?`

```
use std::fs;

fn read() -> Result<String, std::io::Error> {
    let s = fs::read_to_string("cfg")?; // ? returns Err early
    Ok(s)
}
```

### `Option` handling

```
match maybe {
    Some(v) => println!("{v}"),
    None => println!("nothing"),
}
let n = maybe.unwrap_or(0);
let n = maybe.unwrap_or_else(|| fallback());
```

### `unwrap` / `expect`

Both `panic!` on `Err`/`None`. Fine in tests and one-off scripts; avoid in libraries and long-running code — prefer `?`, `match`, or `unwrap_or`.

```
let v = cfg.unwrap();
let v = cfg.expect("cfg must load");
```

### `panic!`

```
panic!("unrecoverable: {reason}");
assert_eq!(got, want);
unreachable!();   // must never run
```

`panic!` unwinds the current thread; use `Result` for recoverable errors.

### `anyhow` (apps)

Opaque error type for application code — one `Result` with no error enum to design.

```
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let s = fs::read_to_string("cfg")
        .context("read config")?;
    Ok(())
}
```

### `thiserror` (libraries)

Typed error enums via `#[derive]`, so callers can `match` on the cause.

```
#[derive(thiserror::Error, Debug)]
enum AppError {
    #[error("io failed: {0}")]
    Io(#[from] std::io::Error),
}
```

## Traits, generics & closures {#traits}

Traits are Rust's interfaces. Implement one to opt a type into shared behavior — including operators, formatting, and error handling.

### Define & implement

```
trait Greet {
    fn greet(&self) -> String;
}

struct Person { name: String }

impl Greet for Person {
    fn greet(&self) -> String {
        format!("hi, {}", self.name)
    }
}
```

### Derive common traits

```
#[derive(Debug, Clone, PartialEq)]
struct Point { x: i32, y: i32 }

let a = Point { x: 0, y: 0 };
let b = a.clone();
assert_eq!(a, b);      // PartialEq
println!("{a:?}");     // Debug
```

### Generics <T>

```
fn largest<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

let x = largest(3, 9);      // i32
let y = largest("a", "z");  // &str
```

### Closures

```
let add = |x, y| x + y;
let n = add(2, 3);          // 5

let xs = vec![1, 2, 3];
let dbl: Vec<i32> = xs.iter()
    .copied().map(|x| x * 2).collect();

let owned = move || println!("{n}"); // move captures
```

> **→:** **`impl Trait` returns:** hand back a closure or iterator without naming its exact type — `fn make_adder(n: i32) -> impl Fn(i32) -> i32 { move |x| x + n }`.

## Concurrency & async {#concurrency}

The `Send`/`Sync` traits make data races compile errors. Share state through channels or `Arc` + `Mutex`; write async with `.await`.

### `thread::spawn`

```
let handle = std::thread::spawn(|| {
    println!("from a thread");
});
handle.join().unwrap();  // wait for it
```

### mpsc channels

```
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();
std::thread::spawn(move || {
    tx.send("hi").unwrap();
});
let msg = rx.recv().unwrap();
```

### `Arc<Mutex<T>>`

```
use std::sync::{Arc, Mutex};

let c = Arc::new(Mutex::new(0));
let c2 = Arc::clone(&c);
std::thread::spawn(move || {
    let mut n = c2.lock().unwrap();
    *n += 1;
}).join().unwrap();
```

### `async` / `.await`

```
async fn fetch() -> String {
    "data".to_string()
}

#[tokio::main]
async fn main() {
    let s = fetch().await;
}
```

### `tokio::spawn`

```
let handle = tokio::spawn(async {
    work().await
});
let out = handle.await.unwrap();
```

Async tasks run on a runtime (e.g. `tokio`) and are cooperatively scheduled — great for IO-heavy work.

## cargo tools {#tooling}

Lint, format, test, benchmark, document, and inspect the dependency graph — all through `cargo` subcommands.

- `cargo fmt` — Format code (rustfmt). Add `--check` to fail instead of write.
- `cargo clippy` — Lint for idiomatic, safe Rust. `-- -D warnings` treats warnings as errors.
- `cargo test` — Run unit + integration tests. `cargo test <name>` filters.
- `cargo bench` — Run benchmarks (needs `criterion` or the nightly bench harness).
- `cargo doc --open` — Build rustdoc HTML and open it in a browser.
- `cargo tree` — Print the dependency graph; `-d` for duplicates, `-i <crate>` for reverse deps.
- `cargo add / remove` — Edit `Cargo.toml` dependencies from the CLI.
- `cargo build --release` — Optimized build into `target/release/`.
- `cargo update` — Refresh `Cargo.lock` to latest compatible versions.
- `cargo install <crate>` — Install a binary crate from crates.io.

### Workspaces

One root `Cargo.toml` shares a single `target/` and `Cargo.lock` across member crates.

```
[workspace]
members = ["core", "cli", "web"]
```

### Daily loop

```
cargo fmt --check && \
cargo clippy -- -D warnings && \
cargo test
```

Run this trio before committing; wire the same commands into CI so they stay green.

## Gotchas & footguns {#gotchas}

The borrow checker turns most memory bugs into compile errors — but these six still bite newcomers and veterans alike.

### Use after move

```
let s = String::from("hi");
let t = s;          // s moved into t
println!("{s}");    // ✗ compile error
```

Borrow with `&s`, or copy with `s.clone()`.

### Iterators are lazy

```
let v = vec![1, 2, 3];
v.iter().map(|x| x * 2);   // does nothing!

let out: Vec<_> = v.iter()
    .map(|x| x * 2).collect();
```

### Ranges: `..` vs `..=`

```
0..5    // 0, 1, 2, 3, 4  (exclusive)
0..=5   // 0, 1, 2, 3, 4, 5 (inclusive)
```

### Indexing panics

```
let v = vec![1, 2, 3];
v[10]        // ✗ panics!
v.get(10)    // → None (safe)
```

### `unwrap` in libraries

```
// tests/scripts: fine
let n = maybe.unwrap();
// libraries: propagate instead
let n = maybe?;
```

### Integer overflow

```
let n: u8 = 255;
n + 1   // panics in debug
        // wraps in release
```

> **!:** **When in doubt, read the error.** Rust's diagnostics usually tell you exactly what to fix — a missing `&`, a moved value, or a trait bound — and suggest a fix. Lean on `cargo check` for a fast loop.
