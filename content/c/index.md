---
title: "C"
description: "C17 pointers, ownership, strings, structs, UB hotspots, sanitizers, and C23 deltas."
category: "Languages"
tags: ["language", "C17", "pointers", "UB", "malloc"]
weight: 60
lead: "Close to the metal — C17 first."
version: "C17 · C23 deltas"
---
Pin **C17** (`-std=c17`) as the everyday baseline. C23 is a boxed delta below — not the 20-second path. Signed overflow is **UB**, not “wraps in practice.”

## Quick reference {#quickref}

```
cc -std=c17 -Wall -Wextra -Wpedantic -g -O1 main.c -o main
# bugs:
cc -std=c17 -g -O1 -fno-omit-frame-pointer \
  -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wformat=2 \
  -fsanitize=address,undefined,leak -fno-sanitize-recover=undefined main.c -o main
```

| Idiom | Do |
| --- | --- |
| Allocate | `p = malloc(n * sizeof *p);` check `n` vs `SIZE_MAX/sizeof *p` |
| Grow | `q = realloc(p, n); if (!q) /* p live */; else p = q;` — **never** `p = realloc(p, n)` alone |
| Zero | `calloc(n, sz)` — zeros **and** overflow-checks |
| Free | `free(NULL)` OK · set ptr NULL after if you keep the name |
| Print int64 | `printf("%" PRId64 "\n", x);` — not `%ld` on Win64 |
| Bound string | `snprintf(dst, sizeof dst, "%s", src);` · `scanf("%63s", buf);` with `buf[64]` |

```
%d int   %u unsigned   %x hex   %c char   %s char*
%f double (printf)     %zu size_t   %p (void*)
%" PRId64 " / SCNd64   from <inttypes.h>
```

## Types / sizes {#types}

| | ILP32 | **LP64** (most *nix) | **LLP64** (Win64) |
| --- | --- | --- | --- |
| `int` | 32 | 32 | 32 |
| `long` | 32 | **64** | **32** |
| pointer | 32 | 64 | 64 |

Rank: `char < short < int < long < long long`. Same-rank signed vs unsigned → usual arithmetic conversions: `-1 < (size_t)10` is **false**.

`char` signedness is **implementation-defined** — use `unsigned char` for bytes / hashing.

Fixed widths: `<stdint.h>` + `<inttypes.h>` (`int32_t`, `uint64_t`, `PRId64`, `SCNu64`).

## Pointers / decay {#pointers}

```
int x = 42;
int *p = &x;     // address-of
*p = 7;          // dereference
p + 1;           // next element (scaled)
int *a = arr;    // array → pointer decay
```

| Expression | Meaning |
| --- | --- |
| `sizeof arr` | whole array size (bytes) |
| `sizeof p` | pointer width |
| `void f(int a[n])` | parameter is `int *` — size lost |
| `NITEMS(a)` macro | **only** before decay |

`void *` arithmetic is a **GCC extension**, not ISO C — cast to `unsigned char *` for byte walks.

## Ownership / malloc {#ownership}

```
p = malloc(n * sizeof *p);
if (!p) { perror("malloc"); exit(1); }

q = realloc(p, n);
if (!q) { /* p still valid — handle OOM */ }
else p = q;

calloc(n, sz);           // prefer for zeroed arrays
free(p); p = NULL;       // hygiene, not a full UAF fix
```

- Caller owns `malloc` / `calloc` / `strdup` results → caller `free`
- `strdup` = POSIX + **C23**; Windows `_strdup`
- **C23:** `realloc(p, 0)` is **UB** — don’t rely on free-or-null behavior

## Strings {#strings}

| Prefer | Avoid |
| --- | --- |
| `snprintf`, `strncpy_s` (if available), width in `scanf` | `gets`, unbounded `strcpy`/`strcat`, `scanf("%s")` |
| `memcmp` / length-aware APIs | `strncpy` as “safe strcpy” (no guaranteed NUL) |
| Explicit sizes everywhere | Assuming `char` is unsigned |

Missing NUL = classic OOB. Always track capacity.

## Structs / unions / FAM {#structs}

```
struct S { int n; char data[]; };          // flexible array member (C99+)
struct S *s = malloc(sizeof *s + n);
```

| Topic | Rule |
| --- | --- |
| Padding | Don’t `memcmp` structs for equality blindly |
| Union active member | Read the last-written member (type-pun via `memcpy` is the safe habit) |
| Alignment | `_Alignas` / `alignas` (C11+) when packing buffers |

## Preprocessor {#cpp}

```
#define NITEMS(a) (sizeof (a) / sizeof (a)[0])  // arrays only
#define MAX(a,b) ((a) > (b) ? (a) : (b))         // double-eval risk — prefer inline/static inline
```

`#pragma once` is **not** ISO — headers still need include guards for portability. Function-like macros: parens everywhere; watch multiple evaluation.

## UB hotspots {#ub}

| UB | Reality |
| --- | --- |
| Signed overflow | Not wrap — optimize as if it never happens |
| NULL deref | Not guaranteed `SIGSEGV` |
| UAF / double-free / OOB | Sanitizers catch many; not all |
| Strict aliasing | `memcpy` between types; don’t lie through incompatible `*` |
| Unsequenced `i = i++` | Don’t |
| Shift ≥ width / negative | UB |
| `restrict` lie | Optimizer trusts you |
| VLA huge `n` | Stack bomb |
| Data race | Separate problem — need TSan / atomics (don’t mix ASan+TSan+MSan) |

## Sanitize / warnings {#sanitize}

```
cc -std=c17 -g -O1 -fno-omit-frame-pointer \
  -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wformat=2 \
  -fsanitize=address,undefined,leak -fno-sanitize-recover=undefined
```

`-Wconversion` is noisy — keep it on purpose. No ASan+TSan+MSan combo in one binary.

## C23 deltas {#c23}

**Teach:** `bool`/`true`/`false` keywords · `nullptr` · `typeof` for macros · `[[nodiscard]]` · `memset_explicit` · `strdup` in ISO · `ckd_add` / checked math · `realloc(p,0)` is UB · K&R decls gone

**Skip for this sheet:** `#embed` · `_BitInt` · decimal FP · `auto` · `constexpr` · `<stdbit.h>` · `free_sized`

## AI-slop kill-list {#gotchas}

| Slop | Reality |
| --- | --- |
| `gets` / unbounded `strcpy`/`strcat`/`scanf("%s")` | Always bound |
| `strncpy` as safe strcpy | May omit NUL |
| `sizeof(ptr)` as length | Pointer width ≠ array length |
| `void*` arithmetic | GCC ext; not ISO |
| `malloc` cast in C | Unnecessary; can hide bugs |
| `return &local` | Dangling |
| `%ld` for `int64_t` | Breaks on LLP64 — use `PRId64` |
| `char` for bytes | Signedness impl-defined |
| `p = realloc(p, n)` | Leak original on failure |
| `while (!feof(f))` | Wrong loop shape |
| `fflush(stdin)` | UB / nonportable |
| Macro `MAX` double-eval | Side effects twice |
| `#pragma once` as ISO | Guards still matter |
| Only `-std=c23` on a C17 sheet | Baseline is **c17** |
| `INT_MAX+1` “wraps in practice” | Signed overflow is **UB** |
| NULL deref “segfault” | Not guaranteed |
| `calloc == malloc+memset` | `calloc` also overflow-checks |
| `p=NULL` after free = full UAF fix | Only helps that name |

## Refs {#refs}

- [cppreference C](https://en.cppreference.com/w/c) · [C23](https://en.cppreference.com/w/c/23)
- Working drafts: N3096 (last free pre-C23 WD — **not** the standard) · N3220 (post-C23 WD)
- CERT C: INT32-C, MEM30-C, EXP33-C, ARR30-C, STR31-C, …
- Clang ASan / UBSan docs · Open Group `malloc` / `strdup`
