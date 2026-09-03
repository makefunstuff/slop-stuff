---
title: "Memory allocators"
description: "Bump, free lists, arenas, slab, buddy, and garbage collection."
category: "Systems & CS"
tags: ["systems", "arena", "free list", "gc"]
weight: 490
lead: "Where memory comes from."
version: "memory"
---
`malloc` hands out blocks from the heap and `free` takes them back. Behind that simple pair sits a family of strategies — bump, free lists, arenas, slab, buddy, and tracing garbage collectors — each tuned for a different lifetime and speed trade-off.

## The 20-second version {#quickref}

The strategies, the two costs, and the allocators you'll actually reach for — in one screen.

### malloc / free

```
int *p = malloc(n * sizeof *p);
if (!p) { /* out of memory */ }
free(p);        // once, exactly once
p = NULL;       // avoid use-after-free
```

### Bump / arena

```
// one lifetime, many objects
Arena a = arena_new(1 << 20);
for (...) push(&a, sizeof T);
arena_reset(&a);  // all gone at once
// O(1) alloc, no per-object free
```

### Free list

```
free(p)   → block → free list
malloc(n) → first-fit / best-fit
split the big, coalesce adjacent
header sits before the payload
```

### Slab / pool

```
// one hot size, O(1) push/pop
pop()  → head of the free list
push() → link it back in
no search, no split, no frag
```

### Buddy

```
round up to a power of two
split halves until it fits
free → merge if buddy is free
buddy = addr ^ size   // O(1)
```

### Fragmentation

```
internal → padding + headers
external → scattered free holes
fix: coalesce, size classes,
     pools, arenas
```

### Alignment

```
malloc → 16-byte aligned (x86-64)
aligned_alloc(64, n)     // over-align
posix_memalign(&p, 64, n)
misaligned = slow or fault
```

### Modern allocators

```
mimalloc  → sharded free lists
jemalloc  → threads, low frag
tcmalloc  → per-thread caches
swap via LD_PRELOAD or link
```

> **TIP:** Pick the allocator that matches the **lifetime**, not the speed: bump/arena for batch work, a free list for mixed sizes, a slab for one hot size, and `malloc` for everything else.

## The allocation problem {#start}

Programs need memory at runtime. How you hand it out — and take it back — decides speed, fragmentation, and safety.

1. **Request** — `malloc(n)` asks for `n` bytes of usable space — plus room for a header that tracks the block.
1. **Search** — The allocator looks for a free block big enough (first-fit or best-fit) in its free list.
1. **Split** — A larger block is carved into `n` bytes plus a remainder that stays free.
1. **Extend** — If nothing fits, grow the heap with `sbrk()` or `mmap()` and allocate from the new space.
1. **Return** — The pointer goes to the program; `free(p)` later returns the block to the pool and coalesces neighbours.

### 1. Heap vs stack

The **stack** is a LIFO frame per call: allocation is one pointer move, freed automatically on return — but it dies with the scope. The **heap** is a shared pool you manage by hand: `malloc`/`free` give lifetime control at the cost of fragmentation and leaks.

```
int x = 5;             // stack — gone when the frame pops
int *p = malloc(64);   // heap — lives until free(p)
```

### 2. Two kinds of fragmentation

**Internal:** wasted space inside a block — headers, alignment padding, or a size class bigger than the request. **External:** free memory chopped into holes too small to satisfy any request, even though the total is plenty.

`internal → padding` `external → holes` `coalescing fixes`

| Mechanism | What it does | Use for |
| --- | --- | --- |
| `sbrk()` | moves the program break (contiguous) | small, incremental heap growth |
| `mmap()` | maps fresh pages from the OS | large blocks, returned on free |

> **KEY:** **Two ways to get more heap.** `sbrk()` moves the program break for small, contiguous growth; `mmap()` grabs a fresh page-aligned region for large allocations (> ~128 KB in glibc). Big `mmap` blocks go straight back to the OS on `free`.

## Bump allocator {#bump}

The simplest allocator there is: keep a pointer, move it forward, and never free individual objects.

**base** (region start) → **A · 32 B** (allocated) → **B · 16 B** (allocated) → **bump** (next free slot) → **end** (region limit)

### Minimal C implementation

```
#include <stddef.h>

typedef struct { unsigned char *base; size_t off, cap; } Arena;

void *bump_alloc(Arena *a, size_t n) {
  n = (n + 7) & ~(size_t)7;              // 8-byte align
  if (a->off + n > a->cap) return NULL;  // out of room
  void *p = a->base + a->off;
  a->off += n;                           // move the bump pointer
  return p;
}
void bump_reset(Arena *a) { a->off = 0; }  // free everything at once
```

### When to use it

Perfect when many allocations share one lifetime: a compiler pass, a game frame, an HTTP request handler. There is **no free** — you reset the whole arena when the scope ends.

`game loop scratch` `compiler passes` `per-request state` `O(1) alloc`

> **!:** **No free, no reuse.** You cannot return one object to a bump allocator without freeing everything allocated after it. Mixing long-lived and short-lived objects together wastes memory until the reset.

## Free lists {#freelist}

Keep freed blocks in a linked list; when a request arrives, walk the list to find a block that fits.

**head** (free-list ptr) → **64 B** (next →) → **128 B** (next →) → **32 B** (next → NULL)

### First-fit vs best-fit

**First-fit** returns the first block that's big enough — fast, but leaves small fragments near the front. **Best-fit** scans for the tightest match — less waste, but slower and prone to unusable slivers.

`first-fit → fast` `best-fit → tight` `next-fit → spread`

### Split and coalesce

**Splitting** carves a request out of a larger free block. **Coalescing** merges adjacent free blocks on `free` so they can satisfy a bigger request later — the main defence against external fragmentation.

### Allocate from the list

```
#include <stddef.h>

typedef struct Block { size_t size; struct Block *next; } Block;

void *first_fit(Block **head, size_t n) {
  for (Block *b = *head; b; b = b->next)
    if (b->size >= n) {
      if (b->size >= n + sizeof(Block) + 8) split(b, n); // leave remainder
      unlink(head, b);
      return (void *)(b + 1);       // payload sits after the header
    }
  return NULL;                       // nothing fits — grow the heap
}
```

<details>
<summary>Boundary tags: coalescing with the previous block</summary>

A free block usually stores only a header. To merge with the **previous** block you must find its size, so some allocators write a matching **footer** at the end of every block — header plus footer is a pair of boundary tags.

</details>

> **KEY:** **The header lives just before the payload.** `free(ptr)` finds it by subtracting `sizeof(Block)`, reads the size, and links the block back into the list. That's why freeing a pointer you didn't get from the allocator corrupts memory.

## Slab & fixed-size {#slab}

When most objects are the same size, cache one size and hand out objects in O(1) with zero external fragmentation.

- **16 B** — pointers, list nodes
- **32 B** — small structs
- **64 B** — strings, mid structs
- **256 B** — larger fixed objects

### Object pool in C

```
typedef union Obj { union Obj *next; char data[64]; } Obj;
Obj *pool = NULL;                    // free-list of objects

void *obj_alloc(void) {
  Obj *o = pool;                     // pop the head
  pool = o ? o->next : NULL;
  return o;
}
void obj_free(void *p) {
  Obj *o = p;                        // push back — O(1)
  o->next = pool;
  pool = o;
}
```

### Why it's fast

No size search, no splitting, no coalescing — just push and pop a pointer. The freed object's own memory stores the `next` link, so there's no per-object header and no internal fragmentation beyond the fixed size.

<details>
<summary>Slab vs buddy: which one?</summary>

Buddy handles **varied sizes** with cheap coalescing but rounds to powers of two. Slab handles **one size** with zero external fragmentation and no rounding. Production allocators combine them: buddy for large ranges, slabs for the common small sizes.

</details>

> **SLAB:** **Slab allocators** (the Linux kernel, jemalloc size classes) preallocate pages and carve them into same-size objects. Per-CPU caches keep allocation lock-free — the workhorse behind most real-world allocators.

## Buddy allocator {#buddy}

Split power-of-two blocks in half to serve a request; merge them back only when both halves are free.

**64 KB** (order 6) → **32 KB** (used) → **32 KB** (split again) → **16 KB** (served) → **16 KB** (free buddy)

### Split to fit

Keep blocks at power-of-two sizes. A request is rounded up to the next power of two; if no block of that size is free, split a larger one in half recursively until it fits.

### Merge only true buddies

On `free`, check the block's **buddy** — the other half of its parent. If it's free, merge and repeat upward. The buddy address is one XOR, computed in O(1).

| Order | Block size | Serves requests |
| --- | --- | --- |
| 0 | 4 KB | 1 – 4 KB |
| 1 | 8 KB | 4 – 8 KB |
| 2 | 16 KB | 8 – 16 KB |
| 3 | 32 KB | 16 – 32 KB |
| 4 | 64 KB | 32 – 64 KB |

<details>
<summary>Computing a buddy's address</summary>

The buddy of a block is found by XORing its address with its size — no searching, no bitmaps.

```
uintptr_t buddy = (uintptr_t)block ^ block->size;
```

</details>

> **!:** **Internal fragmentation.** Rounding a 300-byte request up to 512 bytes wastes ~40% in the worst case. Buddy is predictable and cheap to coalesce, but pays for it with power-of-two rounding.

## Arenas & regions {#arena}

Group allocations by lifetime: bump inside a region, then free the entire region at once when its scope ends.

1. **Create the arena** — Reserve one big region up front — a fixed buffer, an `mmap`, or a malloc'd block.
1. **Bump many allocations** — Every `alloc` is a pointer increment — no free list, no header search.
1. **Share one lifetime** — Objects live as long as the arena, so pointers between them stay valid by construction.
1. **Reset or destroy** — Rewind the bump pointer to reuse the memory, or free the whole region in one call.

### Region-based lifetime

```
Arena a = arena_new(1 << 20);        // 1 MB region
for (int i = 0; i < 1000; i++) {
  Node *n = bump_alloc(&a, sizeof *n); // owned by the arena
  /* ...build a graph... */
}
arena_reset(&a);                     // all nodes gone at once
arena_free(&a);                      // release the region
```

### Arenas vs general malloc

`malloc` is for objects with independent, unpredictable lifetimes. An arena is for a **batch** of objects that all die together — compilers, interpreters, and parsers use arenas to skip thousands of individual `free` calls.

> **✓:** **Tip:** pairing an arena with a bump allocator gives allocation as fast as possible and deallocation as a single instruction. Use it for any structure whose lifetime matches a phase or a request.

## Garbage collection {#gc}

When you stop freeing by hand, a collector figures out what's unreachable and reclaims it automatically.

1. **Mark roots** — Seed the worklist with the root set — globals, registers, and stack slots.
1. **Trace** — Pop an object, mark it, and push every pointer it contains until the worklist empties.
1. **Sweep** — Walk the whole heap; every unmarked object goes back on the free list.

### Mark & sweep

Start from roots (globals, stack), follow every pointer, mark reachable objects, then sweep away the unmarked. Simple and complete, but it pauses the program while it traces.

```
mark_roots()
while (stack) mark(obj)   // trace
sweep()                   // free unmarked
```

### Reference counting

Each object stores how many pointers point at it; free it when the count hits zero. Immediate and incremental, but cycles (A→B→A) leak without a cycle collector, and every pointer write pays an increment/decrement.

### Generational

Most objects die young, so collect the nursery often and the old generation rarely. Survivors are copied, so allocation is just a bump — the basis of most modern VMs and runtimes.

| Approach | Reclaims | Cost | Notes |
| --- | --- | --- | --- |
| Manual (`malloc/free`) | exactly what you free | zero overhead | leaks + use-after-free are yours |
| Reference counting | objects at count 0 | every pointer write | cycles need extra handling |
| Mark & sweep | unreachable objects | full-heap pause | no cycles, but pauses |
| Generational | most garbage, cheaply | short nursery pauses | fast bump allocation |

<details>
<summary>The reference-counting cycle problem</summary>

Two objects that point at each other never reach count zero, so a pure reference counter leaks them. Weak references, a periodic cycle detector, or a tracing collector are the usual fixes.

</details>

> **!:** **Pauses.** Tracing collectors stop the world while they scan. Real-time and latency-sensitive code — game loops, audio, trading — either disables GC, pools memory, or uses incremental/concurrent collectors to keep pauses short.

## Pitfalls & techniques {#gotchas}

The classic bugs and the tricks that avoid them: alignment, cache locality, and choosing the right allocator.

### Alignment

`malloc` returns memory aligned for any type (16 bytes on x86-64). Over-aligned types need `aligned_alloc` or `posix_memalign`; misaligned access is slow or a hard fault.

```
void *p = aligned_alloc(64, 256); // 64-byte aligned
```

### Cache locality

Objects allocated together are usually used together. A bump arena or pool keeps them contiguous, so one cache line holds several — scattered `malloc` calls put each object on its own line.

### Leaks & double-free

Forgetting `free` grows the heap forever; freeing twice corrupts the free list. Use ASan and Valgrind during development, and a pool or arena where lifetimes are well-defined.

```
gcc -fsanitize=address prog.c && ./a.out
```

### Contention

Every thread hitting one `malloc` lock serializes on it. glibc mitigates this with **per-thread arenas**, but they still pile up under load. Modern allocators (jemalloc, tcmalloc, mimalloc) keep per-thread or per-CPU caches so most allocations never touch a shared lock — the trade-off is that `free` may land on another thread's cache, keeping memory resident longer.

| Allocator | Focus | Best for |
| --- | --- | --- |
| glibc ptmalloc2 | fork of dlmalloc, per-thread arenas | Linux default `malloc` |
| jemalloc | fragmentation + threads | Firefox, Redis, high core counts |
| tcmalloc | speed + per-thread caches | Chrome, low-latency services |
| mimalloc | free-list sharding, secure | apps that churn allocations |
| snmalloc | message passing, memory-safe | CHERI, many-core systems |

<details>
<summary>Swapping in a modern allocator without recompiling</summary>

On Linux you can test jemalloc, tcmalloc, or mimalloc by preloading it — the allocator's `malloc`/`free` then override the libc versions for the whole process:

```
LD_PRELOAD=/usr/lib/libmimalloc.so  ./myapp   # mimalloc
LD_PRELOAD=/usr/lib/libtcmalloc.so ./myapp   # tcmalloc
LD_PRELOAD=/usr/lib/libjemalloc.so ./myapp   # jemalloc
```

Or link it directly at build time. Profile with `LD_PRELOAD` first, then commit to one allocator for the entire process — mixing allocators in one address space is asking for corruption.

</details>

`bump arena` same-lifetime batch
`free list` varied sizes, long-lived
`object pool` one hot size
`malloc` general purpose

> **!:** **Fragmentation is the silent killer.** Long-running processes that mix many sizes and lifetimes fragment the heap until allocation fails despite free memory. Prefer size classes, pools, or arenas for hot paths.
