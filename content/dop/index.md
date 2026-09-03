---
title: "Data-Oriented Design"
description: "Cache-friendly SoA vs AoS, data locality, ECS, and layout patterns."
category: "Systems & CS"
tags: ["systems", "SoA", "cache", "ECS"]
weight: 470
lead: "Design for the cache, not the objects."
version: "cache & data"
---
Data-oriented design (DOD) optimizes around how the CPU actually reads memory: keep the fields you touch together, in the order you touch them. It's how fast games and simulations stay fast at scale.

## Quick reference {#quickref}

The moves you reach for most — the layout decision, the cache line, and the swaps that matter. One line each.

- `SoA vs AoS` — split by *field* (SoA) when a loop reads a subset; keep whole records together (AoS) when each is consumed entirely.
- `cache line` — 64 B on x86/ARM, 128 B on Apple Silicon — touching one byte pulls the whole line.
- `locality` — walk arrays forward (stride-1) so the hardware prefetcher runs ahead; avoid pointer chasing in hot loops.
- `hot / cold split` — `struct UnitHot { x,y,hp };` + `struct UnitCold { name[32] };` — keep cold fields out of the hot loop.
- `ECS` — Entity = id, Component = plain data in arrays, System = loop over those arrays.
- `indices > pointers` — `uint32_t index` (or id + generation) instead of `Node*` — dense arrays, no dangling handles.
- `false sharing` — pad per-thread counters to their own line with `alignas(64)`.
- `measure first` — `perf stat -e cache-misses,cache-references ./prog` — restructure the one hot loop, not the other 99%.

## The mindset {#start}

Every memory read you make goes through a hierarchy of caches. The further down you go, the more cycles you pay — so **data layout**, not the number of instructions, usually decides how fast your loop runs.

### 1. L1 cache

≈4 cycles · ~1 ns. 32–64 KB, per core. Touching it is nearly free.

### 2. L2 cache

≈12 cycles · ~4 ns. 256 KB–1 MB, per core.

### 3. L3 cache

≈40 cycles · ~12 ns. 4–32 MB, shared across cores.

### 4. Main RAM

≈200–400 cycles · ~60–100 ns. Gigabytes. A miss here stalls everything.

1. **Decide the data** — List the fields and how often each is read vs written.
1. **Group by access** — Separate hot (every frame) from cold (rarely used) fields.
1. **Lay out contiguously** — Store each group in packed, parallel arrays — SoA where it helps.

### Instructions are cheap

A modern CPU retires several instructions per cycle, but one RAM miss stalls for hundreds of cycles. You can often trade a dozen instructions to save a single miss and still come out ahead.

### The DOD checklist

```
1. what data?        → list fields + access
2. how is it read?   → hot vs cold, seq vs random
3. where does it go? → pack, split, align
```

> **KEY:** **Think data first, objects second.** Start from the data you process and the order you touch it, then shape the code around that. A "clean" object model that jumps around memory can be orders of magnitude slower than a flat array a cache line at a time.

## SoA vs AoS {#soa}

Array of structs interleaves every field of one object; struct of arrays keeps each field in its own contiguous array. Split by *access pattern*, not by object.

### Array of structs (AoS)

```
struct Particle {          // interleaved
  float x, y, z;
  float vx, vy, vz;
  float mass;
};
Particle p[N];             // xyz vxvyvz m xyz …
// update x only → still drags y,z,vx… in
```

### Struct of arrays (SoA)

```
struct Particles {         // split by field
  float* x,  *y,  *z;
  float* vx, *vy, *vz;
  float* mass;
};
// update x only → touches x[] alone
for (int i = 0; i < N; ++i)
  x[i] += vx[i] * dt;
```

**x[0..N]** (all x values) → **y[0..N]** (all y values) → **z[0..N]** (all z values)

> **✓:** **When each wins.** **SoA**: the hot loop reads a *subset* of fields, and you want SIMD/vectorization — every byte of a cache line is a field you actually use. **AoS**: a record is always consumed whole and fits in one cache line, or you need random access to single records.

<details>
<summary>Hot/cold splitting — the classic example</summary>

#### Before (AoS, cold dragged in)

```
struct Unit {
  float x, y;           // hot: every frame
  char  name[32];       // cold: read rarely
  int   hp;             // hot
};
// moving a unit pulls 40+ bytes of
// name[] into cache you never read
```

#### After (hot/cold split)

```
struct UnitHot  { float x, y; int hp; };
struct UnitCold { char name[32]; };

UnitHot  hot[N];        // tight, all hot
UnitCold cold[N];       // touched only when needed
```

</details>

## Cache & locality {#locality}

The CPU moves memory in fixed-size **cache lines** — 64 bytes on x86 and most ARM cores, 128 bytes on Apple Silicon (M-series). Sequential access is cheap because hardware prefetchers run ahead; pointer chasing defeats them.

| Concept | Rule of thumb |
| --- | --- |
| `cache line` | 64 bytes (x86/ARM), 128 on Apple Silicon — touching one byte pulls the whole line. |
| `sequential` | Walk arrays forward (stride-1); the prefetcher reads ahead. |
| `prefetch` | `__builtin_prefetch(p)` hides latency for data you'll need soon. |
| `pointer chasing` | Linked lists / trees jump to a new cache line every hop. |
| `data locality` | Group data touched together so one line serves many accesses. |
| `instruction locality` | Hot loops stay in the I-cache; cold code paths cost I-misses. |

### Sequential access

```
// cache-friendly: stride-1, forward
float sum = 0;
for (int i = 0; i < N; ++i)
  sum += a[i];          // prefetcher runs ahead
```

### Pointer chasing

```
// cache-hostile: one miss per hop
for (Node* n = head; n; n = n->next)
  sum += n->value;      // node may live anywhere
```

> **!:** **A linked list is a cache miss generator.** In a hot loop, prefer a packed array and an integer index over a `next` pointer. Reserve pointer-chasing structures for cold, rarely-traversed data.

<details>
<summary>Prefetching & stream processing</summary>

Hardware prefetchers handle stride-1 access automatically; software prefetch helps for strided or irregular access you can predict in advance.

```
// strided access the HW prefetcher may miss
for (int i = 0; i < N; i += STRIDE) {
  __builtin_prefetch(&a[i + STRIDE]);
  sum += a[i];
}
```

</details>

## Entities & components {#entities}

Entity-Component-System (ECS) is DOD applied to game objects: entities are ids, components are plain data in contiguous arrays, and systems are code that loops over those arrays.

### The ECS split

- `Entity` — an id / handle — no data, no methods.
- `Component` — plain old data, stored in arrays.
- `System` — a function that iterates components.
- `Archetype` — a group sharing the same component set.

### Contiguous components

```
struct Transform { float x, y, z; };
struct Velocity  { float vx, vy, vz; };

Transform pos[MAX_N];    // parallel arrays,
Velocity vel[MAX_N];     // one entity per index

for (uint32_t e = 0; e < count; ++e)
  pos[e].x += vel[e].vx * dt;
```

> **KEY:** **Indices and handles, not pointers.** A handle is an `index` plus a `generation` counter: `id = index | (gen << 24)`. The generation detects stale handles after a slot is recycled — so a dead entity can never dangle a pointer into a reused slot.

1. **Input** — Read player/network input into a small packed buffer.
1. **Simulate** — Systems loop component arrays in dependency order.
1. **Render** — Copy only visible transforms into a draw buffer.

<details>
<summary>Iteration order matters</summary>

Walk component arrays in memory order (index `0 → N`), and swap-remove dead entities so the live set stays dense and prefix-packed — no holes for the prefetcher to skip over.

```
// swap-remove keeps arrays dense (no holes)
void remove(uint32_t i) {
  uint32_t last = --count;
  pos[i] = pos[last];
  vel[i] = vel[last];
  // backref[last] = i  — update moved id
}
```

</details>

## Data layout patterns {#layout}

The same logical data can sit in memory many ways. Each pattern trades flexibility for cache behavior — pick by how the data is read.

- `packed array` — contiguous values, no per-element heap alloc — the default win.
- `interleaved (AoS)` — related fields of one record together — access the whole record.
- `columnar (SoA)` — one field per array — hot loop touches only what it needs.
- `hot / cold split` — frequently-used fields together, rarely-used fields elsewhere.
- `bitfield / bitset` — pack many booleans into one word — dense flags, branch-free tests.
- `alignment` — `alignas(16/32/64)` so SIMD loads don't straddle lines.

### Hot / cold split

```
struct Unit {
  float x, y;           // hot: read every frame
  char  name[32];       // cold: read rarely
};
// split them apart:
float pos_x[N], pos_y[N];
char  name[N][32];      // kept out of the hot loop
```

### Alignment & bitfields

```
alignas(32) float x[N]; // 32-byte SIMD loads
uint32_t flags[N];      // 32 bools in one word
#define IS_ALIVE (1u << 0)
#define IS_DIRTY (1u << 1)
if (flags[e] & IS_ALIVE) { /* … */ }
```

<details>
<summary>Choosing a layout</summary>

Ask two questions: which fields does the hot loop touch, and is access sequential or random?

| Access pattern | Layout |
| --- | --- |
| Hot loop reads a subset of fields | SoA / columnar |
| Record is always consumed whole | AoS / interleaved |
| Random lookup by id | packed array + index |
| Many booleans per entity | bitset / bitfield |
| SIMD math over one field | SoA + `alignas(16/32)` |

</details>

## Transformation & batching {#transform}

Process data in batches over homogeneous arrays. Run one loop per data stream, keep updates in place, and avoid per-object virtual calls and branches.

### Per-object virtual (slow)

```
// vtable lookup + branch per object,
// plus a cache miss on each object
for (auto* e : objects)
  e->update(dt);
```

### Batched transform (fast)

```
// one loop per component stream
for (int i = 0; i < N; ++i)
  pos[i] += vel[i] * dt;
for (int i = 0; i < N; ++i)
  health[i] -= damage[i];
```

### Minimize branches

```
// branchy: a different path per element
for (int i = 0; i < N; ++i)
  if (type[i] == UNIT)  update_unit(i);
  else if (type[i] == TOWER) update_tower(i);

// branch-free: bucket by type first,
// then one loop per bucket
```

### In-place updates

```
// mutate the same array instead of
// allocating a new one each frame
for (int i = 0; i < N; ++i)
  pos[i].x += vel[i].vx * dt;
// reuse buffers across frames — no
// malloc/free in the hot path
```

> **✓:** **Separate your transforms.** Split logic into systems that each touch the fewest fields possible (`move`, `damage`, `render`). A system that only needs position should never load `name` or `texture` into cache.

1. **Bucket** — Sort/partition entities by type so each batch is homogeneous.
1. **Transform** — Run one straight-line loop over each bucket's arrays.
1. **Commit** — Write results back in place; reuse buffers next frame.

## Pitfalls {#gotchas}

The ways DOD goes wrong: optimizing before measuring, chasing pointers in hot loops, false sharing, and abstractions that quietly wreck locality.

### Premature optimization

Rewriting to SoA before you've measured is guesswork. Profile first, then restructure the one hot loop.

```
perf stat -e cache-misses,       \
          cache-references ./prog
# misses/references > a few %?
#   → investigate your layout
```

### Pointer chasing

Linked lists, trees, and graphs hop to a new cache line per step. In hot paths, replace them with arrays + indices.

```
// slow: Node* next, one miss per hop
// fast: uint32_t next[MAX_N];  // index
```

### False sharing

Two cores writing different variables in the same cache line ping-pong the line between their caches — it reads as contention but is just bad placement.

```
// fix: pad each to its own line (C++17 portable)
alignas(std::hardware_destructive_interference_size) int a;
alignas(std::hardware_destructive_interference_size) int b;
// thread 1: a++   thread 2: b++
// line = 64 B on x86, 128 B on Apple Silicon
```

### Pointer instability

Pointers/references into a `std::vector` dangle the moment it reallocates (or swap-removes). Indices and id+generation handles stay valid across growth.

```
// bad: T* p = &v[i];  // invalid after push_back
// good: uint32_t id = i;  // index survives growth
//       v[id]  — re-resolve each use
```

### Over-engineering

A flat packed array usually beats a clever hierarchy of interfaces. Don't build an ECS for ten objects — a `std::vector<T>` is the right call until profiling says otherwise.

### Readability vs speed

Write the simple, readable version first. Measure, then optimize only the loop that shows up. Keep the optimized part small and documented.

```
// clear code that's 90% as fast
// beats unreadable code that's 100%
for (auto& p : particles) p.move(dt);
```

### Cache-unfriendly abstractions

`std::vector<Base*>` plus virtual methods is pointer chasing plus a branch per call — the opposite of DOD.

```
// bad: vector<Base*> + e->update()
// good: vector<T> + one loop per T
//   (or a tag + switch on the batch)
```

> **!:** **Measure before you restructure.** `perf stat`, `cachegrind`, or your profiler will name the actual hot loop. Data-oriented rewrites pay off on the 1% of code that dominates runtime — not on the other 99%.
