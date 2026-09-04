---
title: "C++"
description: "C++20 RAII, smart pointers, STL picks, concepts, views lifetimes, UB, and sanitizers."
category: "Languages"
tags: ["language", "C++20", "RAII", "STL", "concepts"]
weight: 70
lead: "Zero-cost abstractions — C++20 daily."
version: "C++20 · C++23/26 deltas"
---
Pin **C++20** (`-std=c++20`) as the daily baseline. C++23/26 are teach/skip deltas below — not the happy path. Prefer **Rule of 0** and **no owning `new`**.

## Quick reference {#quickref}

```
g++     -std=c++20 -Wall -Wextra -Wpedantic main.cpp -o main
clang++ -std=c++20 -Wall -Wextra -Wpedantic main.cpp -o main
```

| Reach for | Idiom |
| --- | --- |
| Container | `std::vector<int> v; v.push_back(x);` |
| Hash map | `std::unordered_map<K,V>` if no order · `std::map` if ordered |
| Unique owner | `auto p = std::make_unique<T>(...);` |
| Shared | `auto sp = std::make_shared<T>(...);` · `weak_ptr` breaks cycles |
| Loop | `for (const auto& x : v)` |
| Lambda | `auto f = [&](int n){ return n * 2; };` |
| Concept | `void print(const std::integral auto& x);` |
| RAII | resource lifetime = object lifetime |

## Compile {#compile}

Daily: **`-std=c++20` only**. Add `-g -O1` for sanitize builds. Don’t advertise c++23/26 as the default line on this page.

```
clang++ -std=c++20 -g -O1 -fno-omit-frame-pointer \
  -Wall -Wextra -Wpedantic -Wshadow -Wconversion \
  -fsanitize=address,undefined -fno-sanitize-recover=undefined \
  main.cpp -o main
```

No ASan+TSan in one binary. `-fno-exceptions` only if intentional.

## Value categories / move {#move}

| Category | Identity? | Move from? |
| --- | --- | --- |
| lvalue | yes | no (normally) |
| xvalue | yes | **yes** (`std::move`) |
| prvalue | no | initializes / materializes |

`std::move` = last use of an lvalue → treat as xvalue (**not** a magic speedup). `std::forward` **only** with forwarding refs (`T&&`). Never `move` a `const` object (silent copy). Moved-from state = valid but unspecified — don’t use except to destroy/assign.

## RAII · Rule of 0/3/5 · const {#raii}

| Rule | Meaning |
| --- | --- |
| **0** | Prefer composing members that already manage resources |
| **3** | If you touch copy/dtor in old code → consistency |
| **5** | If you define any of copy/move/dtor → define or `=delete` **all five** |

Polymorphic bases: **virtual destructor**; often delete copy. Prefer `const` and `constexpr` where it documents intent. Don’t return `const` by value as a “safety” habit.

## Smart pointers {#ptrs}

| Pointer | When |
| --- | --- |
| `unique_ptr` | **default** exclusive owner |
| `shared_ptr` | only when ownership is truly shared |
| `weak_ptr` | observe / break cycles |
| raw `T*` / ref | **non-owning** views only |

**No owning `new`** (Core Guidelines R.11). Prefer `make_unique` / `make_shared`. Don’t default to `shared_ptr` everywhere.

## Containers {#containers}

| Pick | Why |
| --- | --- |
| `vector` | **default** contiguous |
| `unordered_map` / `unordered_set` | hash, no order |
| `map` / `set` | ordered / lower_bound |
| `deque` | grow both ends |
| `list` | **almost never** |
| `flat_map` / `flat_set` | **C++23** — contiguous associative |

**Invalidation:** `vector` realloc invalidates all pointers/iters/refs · `unordered_*` rehash invalidates iterators · erasing invalidates the erased.

## Algorithms {#algo}

- Prefer half-open ranges `[first, last)`
- Prefer `std::ranges::sort` / constrained algos (C++20)
- Erase-remove: C++20 `std::erase` / `std::erase_if` on containers
- Comparators must induce a **strict weak ordering** or you get UB in `sort` / `map`
- Don’t assume algorithm stability unless documented

## `string_view` / `span` lifetimes {#views}

They **do not** extend lifetime.

```
std::string_view v = std::string{"hi"};  // DANGLING
// don't return a view to a local or temporary
// span into a vector dies on realloc
```

Document who **owns** the bytes. Views are non-owning — treat like raw pointers to buffers.

## Templates / concepts (C++20) {#concepts}

```
template<class T>
  requires std::integral<T>
T twice(T x) { return x + x; }

template<class T>
concept Addable = requires(T a, T b) { a + b; };

template<Addable T>
T add(T a, T b) { return a + b; }

void print(const std::integral auto& x);
```

Prefer concepts over `enable_if` walls. CTAD: `std::vector v{1, 2, 3};`.

## Concurrency (short) {#concurrency}

| Do | Don’t |
| --- | --- |
| `mutex` / `lock_guard` / `scoped_lock` | Data races (UB) |
| `atomic` for simple flags/counters | Bare `std::thread` without join/detach plan |
| Send ownership with `move` across threads | Share raw owning pointers |

## UB / invalidation hotspots {#ub}

| Hotspot | Reality |
| --- | --- |
| Dangling `string_view` / `span` | Instant footgun |
| Iterator invalidation | After realloc / erase / rehash |
| Object slicing | Copy polymorphic by value |
| Signed overflow | UB (same spirit as C) |
| Data races | UB |
| Bad comparators | UB in ordered containers / sort |
| `vector<bool>` | Not a real container of `bool` |
| OOB `operator[]` | UB (use `.at` when you want checks) |
| Use-after-move | Logic bug / UB if invariants broken |
| Wrong `delete` / `delete[]` | Don’t — use smart pointers |

## C++23 teach / skip {#cxx23}

**Teach:** `std::print` / `println` · `expected` · optional monadic ops · `ranges::to` · `flat_map` / `flat_set` · `contains` · deducing this · `std::unreachable`

**Skip here:** mdspan deep dive · generator details · extended FP · module politics

## C++26 names only {#cxx26}

Contracts · reflection (`^^`) · `std::execution` · `inplace_vector` · `simd` — feature-frozen / early compilers · **not** daily baseline. Not “finalized 2025.”

## AI-slop kill-list {#gotchas}

| Slop | Reality |
| --- | --- |
| Owning `new` / naked `delete` | `unique_ptr` / containers |
| `shared_ptr` everywhere | Default `unique_ptr` |
| `using namespace std;` in headers | Pollution / ADL pain |
| Dangling `string_view` from temporaries | Own a `string` or document lifetime |
| `std::endl` flush spam | Prefer `'\n'` |
| `std::move` on `const` | Silent copy |
| Teaching c++23/26 as daily compile line | **c++20** happy path |
| Bare `thread` tutorials without lifetime | Join / `jthread` (C++20) |
| `list` as default sequence | `vector` |
| `enable_if` walls | Concepts |
| “C++26 finalized 2025” | Wrong framing for this sheet |
| Mangled template examples (`vector v` without CTAD note) | Show real syntax |

## Refs {#refs}

- [cppreference C++](https://en.cppreference.com/w/cpp) · [C++20](https://en.cppreference.com/w/cpp/20) · [C++23](https://en.cppreference.com/w/cpp/23) · [C++26](https://en.cppreference.com/w/cpp/26)
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) — especially Resource management R.1–R.36
- Value categories · Rule of three/five · `string_view` · `span` · concepts · Clang ASan/UBSan docs
