---
title: "Systems by the giants"
description: "Lessons from nginx, Redis, the Linux kernel, and Carmack on fast systems."
category: "Systems & CS"
tags: ["systems", "nginx", "redis", "Carmack"]
weight: 510
lead: "Learn systems design from the masters."
version: "lessons"
---
nginx, Redis, the Linux kernel, and John Carmack's game engines run the modern internet. They are different tools built on the same few lessons: measure, mind the data structures, and never block.

## Quick reference {#quickref}

The ten-second version — every lesson on this page in one glance.

- `epoll_wait()` — non-blocking I/O: one thread watches many fds and never waits on a single client.
- `event loop` — single thread multiplexes I/O — keep blocking work out of it.
- `perf stat ./prog` — measure first: the bottleneck is rarely where you guessed.
- `SoA, cache lines` — data structures dominate — keep one cache line hot.
- `fork() + COW` — copy-on-write and RCU share pages/reads until a writer must diverge.
- `cache + invalidate` — store results near where they're used; stale data is worse than slow data.
- `0x5f3759df` — bit hack + Newton for 1/√x — historic, now superseded by `rsqrtss`.
- `delete code` — keep it simple: the fastest path is the one you didn't write.

## The through-line {#start}

Different tools, same four principles. They show up again in every section below.

### 1. Measure first

Profile before you optimize. The bottleneck is rarely where you guessed.

```
perf stat ./program
perf record && perf report
```

### 2. Data structures dominate

Big-O and cache-friendly layout beat micro-tuning the code around them.

```
# array-of-structs → struct-of-arrays
# keeps one cache line hot
```

### 3. Avoid blocking

One blocked call stalls every request behind it. Use non-blocking I/O and events.

```
epoll_wait(efd, ev, N, -1);
# one thread, many fds
```

### 4. Keep it simple

Complexity is where bugs hide. Simple code survives contact with production.

```
# the best optimization
# is deleting code
```

> **KEY:** **These principles compound.** nginx stays fast because it never blocks on I/O; Redis stays fast because its data structures live in RAM; the kernel stays correct because copy-on-write and RCU avoid needless work. Each is a different answer to the same question: *what is this machine actually spending its time on?*

## nginx {#nginx}

One event loop per worker instead of one thread per connection — that is the whole trick.

> **!:** **The C10K problem.** Serving 10,000 concurrent clients at once. A thread-per-connection server dies at a few thousand — each thread eats a stack and pays a context switch. An event loop multiplexes tens of thousands of sockets through a handful of workers.

**Master** (binds, reloads) → **Worker** (event loop) → **Worker** (event loop) → **Clients** (thousands)

### The event loop

Each worker runs a single thread. Sockets are set non-blocking and registered with `epoll` (Linux) or `kqueue` (BSD/macOS). When a socket becomes readable, the loop handles it and moves on — never waiting on one client.

### Reverse proxy

nginx terminates client connections and forwards them to an upstream (`proxy_pass`), absorbing slow clients, TLS, and connection reuse so your app never sees them.

```
location / {
  proxy_pass http://127.0.0.1:8080;
  proxy_buffering on;
}
```

|  | Thread per connection | nginx event-driven |
| --- | --- | --- |
| Concurrency model | one thread per client | one loop per worker process |
| Memory per connection | ~1–8 MB thread stack | ~2.5 KB |
| Context switches | constant, per blocked thread | rare |
| Practical ceiling | a few thousand | tens of thousands |
| Blocking I/O | thread sleeps, kernel reschedules | non-blocking + readiness API |

- `worker_processes auto;` — one worker per CPU core.
- `worker_connections 1024;` — max connections per worker.
- `keepalive_timeout 65;` — reuse idle client connections.
- `sendfile on;` — zero-copy file serving.
- `tcp_nopush on;` — batch response packets together.
- `proxy_pass http://up;` — forward to an upstream.
- `gzip on;` — compress responses on the fly.
- `client_max_body_size 10m;` — cap upload size.

<details>
<summary>Minimal nginx.conf</summary>

```
worker_processes auto;          # one worker per core

events {
    worker_connections 1024;
    use epoll;                  # Linux readiness API
}

http {
    server {
        listen 80;
        location / {
            proxy_pass http://backend;
        }
    }
}
```

Set `worker_processes` to `auto` to spawn one worker per CPU core. Keep `worker_connections` high; each worker can hold many idle keep-alive connections.

</details>

## Redis {#redis}

Single-threaded event loop, data in RAM, and data structures tuned for the common case.

### Single thread, no locks

Commands execute one at a time on one thread, so there are no races, no locks, and no context switches on the command path. Each command is effectively atomic.

### In-memory

Everything lives in RAM, so reads never touch disk. Durability is a separate, configurable concern — not on the hot path.

### I/O multiplexing

One thread serves many clients with the same `epoll` trick as nginx. (Redis 6+ added I/O threads for parsing network bytes, and Redis 8 adds event-driven async I/O threading — but command execution stays single-threaded.)

| Type | Backing structure | Use for |
| --- | --- | --- |
| `string` | SDS, embeds small ints | caches, counters (`INCR`) |
| `list` | quicklist | queues, latest-N |
| `hash` | hash table / listpack | object fields |
| `set` | hash table | membership, tags |
| `sorted set` | skiplist + hash | leaderboards, ranges |
| `stream` | radix tree + listpack | logs, event feeds |

### Why it's fast

- Data in RAM, not on disk.
- O(1)/O(log n) structures picked for small data.
- No locks — single-threaded command path.
- One loop multiplexes many clients.

### Common commands

```
SET user:1:name "Ada"
GET user:1:name        # → "Ada"
LPUSH jobs "render"    # enqueue
SADD tags "fast"       # membership
HSET user:1 name Ada age 36
ZADD board 99 "p1"     # score
```

<details>
<summary>Persistence: RDB vs AOF</summary>

#### RDB — snapshots

Writes a point-in-time binary dump. `fork()` + copy-on-write makes the snapshot cheap. Compact, fast to load, but you can lose the last few seconds.

#### AOF — append-only log

Appends every write command, replayed on restart. `appendfsync everysec` balances durability and speed. Can be rewritten/compacted in the background.

</details>

## Linux kernel {#kernel}

The operating system is a library of hard-won answers to concurrency and memory problems.

| Mechanism | What it does | Why it matters |
| --- | --- | --- |
| `fork()` / `clone()` | clone a process / make threads that share memory | isolation vs cheap concurrency |
| Virtual memory | page tables map virtual → physical addresses | per-process protection, `mmap` |
| Interrupts | hardware/software events preempt the CPU | responsiveness, device drivers |
| Syscalls | controlled user → kernel entry | the only door to hardware |
| Zero-copy | `sendfile`/`splice`/`mmap` move bytes without a userspace copy | fast file & network serving |
| Copy-on-write | `fork()` shares pages until a writer diverges | cheap process spawn |
| RCU | lock-free reads during concurrent update | scalable read paths |

- **running** — Currently executing on a CPU.
- **runnable** — In the run queue, waiting for a CPU.
- **blocked** — Sleeping on I/O, a lock, or a signal.
- **stopped** — Paused by a signal, e.g. <kbd>Ctrl</kbd>+<kbd>Z</kbd>.
1. **Call** — Userspace calls `read()`; libc loads the syscall number and executes `syscall`.
1. **Trap** — The CPU switches to kernel mode and jumps to the handler for that number.
1. **Serve** — The kernel copies data from the device into a userspace buffer.
1. **Return** — The result is written back and control returns to user mode.

### A syscall in assembly

```
mov rax, 1        ; SYS_write
mov rdi, 1        ; fd = stdout
mov rsi, msg      ; buffer
mov rdx, len      ; count
syscall           ; enter kernel
```

### Zero-copy in practice

Serve a file straight from disk to socket without copying through userspace.

```
sendfile(sock_fd, file_fd, &off, size);
splice(in_fd, NULL, out_fd, NULL, size);
mmap(file, size) → share pages
```

<details>
<summary>RCU — read-copy-update</summary>

Writers copy, update, and atomically swap a pointer; readers keep running lock-free on the old version until they leave the critical section. Reads never block, which is why the kernel uses RCU for routing tables and filesystem dentries.

```
rcu_read_lock();
node = rcu_dereference(head);
/* read node — no locks held */
rcu_read_unlock();

/* writer side */
new = copy(node);  new->val = 42;
rcu_assign_pointer(head, new);
synchronize_rcu();       /* wait for readers */
kfree(node);             /* then reclaim */
```

</details>

## Carmack {#carmack}

John Carmack's code is a masterclass in measuring, simplifying, and squeezing the machine.

### Fast inverse square root

From Quake III's source: a bit-level hack seeds a Newton iteration, computing `1/√x` ~4× faster than the naive route on 1990s hardware. The magic constant `0x5f3759df` was long attributed to Carmack, but its author was actually Greg Walsh at Ardent Computer — authorship settled in 2006. On modern x86 the SSE instruction `rsqrtss` does the same job faster and more accurately.

### The function, complete

```
float Q_rsqrt(float number) {
  long i;
  float x2, y;
  const float threehalfs = 1.5F;
  x2 = number * 0.5F;
  y  = number;
  i  = * (long *) &y;             // bit hack
  i  = 0x5f3759df - (i >> 1);    // magic
  y  = * (float *) &i;
  y  = y * (threehalfs - (x2 * y * y));
  return y;                       // 1 Newton step
}
```

### Data-oriented thinking

Lay data out for the cache and the hardware, not for the object diagram. Struct-of-arrays, contiguous memory, process many things at once.

### Profile, then optimize

Carmack instrumented hot paths obsessively before changing a line. Deep optimization starts with a measurement, not a hunch.

### Write clear code

Favor the simple, direct implementation. Clever code is a liability until a profiler proves it pays for itself.

> **“:** **“Focus is a matter of deciding what things you're not going to do.”** — John Carmack. The same restraint shows up in the code: the fastest path is often the one you didn't write.

`bit hack` `Newton iteration` `cache` `SoA` `profiling` `simplicity`

## Recurring patterns {#patterns}

The same six ideas keep showing up wherever fast, robust systems are built.

| Pattern | Idea | Where you've seen it |
| --- | --- | --- |
| `event loop` | one thread multiplexes many I/O handles | nginx, Redis, Node, browsers |
| `caching` | store computed or remote results near where they're used | Redis, CDNs, CPU caches |
| `copy-on-write` | share a resource until a writer must diverge | `fork()`, immutable strings |
| `arena allocation` | bump-allocate, free everything at once | compilers, games, per-request pools |
| `batching` | amortize fixed costs over many items | syscalls, disk writes, draw calls |
| `lock-free / atomic` | compare-and-swap and atomics instead of locks | RCU, ring buffers, counters |

### Arena in one breath

Allocate by bumping a pointer; reset to zero when the frame or request ends. No per-object free, no fragmentation.

```
void *arena_alloc(Arena *a, size_t n) {
  char *p = a->buf + a->off;
  a->off += n;
  return p;
}
/* free = a->off = 0 */
```

### Atomics over locks

For a counter or a flag, a lock is overkill — a single atomic instruction wins.

```
__atomic_add_fetch(&hits, 1, __ATOMIC_RELAXED);
__atomic_compare_exchange_n(&ptr, &old, new,
                           0, __ATOMIC_ACQUIRE,
                           __ATOMIC_RELAXED);
```

## Trade-offs {#tradeoffs}

Every fast system is a bet. These are the four you make most often.

| Trade-off | Pick the first when | Pick the second when | Rule of thumb |
| --- | --- | --- | --- |
| latency vs throughput | each request must feel instant | you need maximum requests/sec | amortize, but watch tail latency |
| simplicity vs performance | code must be read and changed | a profiler proves it's a hot path | optimize only measured hotspots |
| memory vs CPU | recomputing is cheap, caching is heavy | lookups dominate and data is stable | measure hit rate, not cache size |
| correctness vs speed | money, safety, or consensus is on the line | logs, stats, or pixels that can drop | relax only what you can afford to lose |

> **⚖:** **No free lunch.** nginx trades a thread per client for a loop that must never block. Redis trades durability (a disk write you can defer) for raw speed. The kernel trades memory (shared pages) for faster forks. Name the trade before you make it.

## Lessons & pitfalls {#gotchas}

The mistakes that sink fast systems — and the quotes that warn you about them.

### Premature optimization

“Premature optimization is the root of all evil.” — Donald Knuth. Write the simple thing, measure, then optimize the part that actually hurts.

### Blocking the event loop

One synchronous `read()`, `sleep()`, or heavy CPU burst stalls every client behind it. Never run blocking work inside the loop.

### Cache invalidation

“There are only two hard things in Computer Science: cache invalidation and naming things.” — Phil Karlton. Version, expire, or invalidate — stale data is worse than slow data.

### Concurrency bugs

Races, deadlocks, and torn reads don't reproduce on demand. Prefer immutability, ownership, and atomics over shared mutable state.

### Cache stampede

When a hot cache key expires, every client recomputes or hammers the origin at once. Add jitter to TTLs, lock the recompute, or serve stale while revalidating.

### COW fork thrash

`fork()` shares pages until a write forces a copy. A large process that forks and then writes heavily — Redis taking an RDB snapshot is the classic case — can briefly spike toward 2× its memory.

> **⚠:** **Complexity creep.** Every feature adds surface for bugs, and every abstraction adds a place to hide them. The giants stay fast partly because they say no: a small, well-understood system beats a clever, sprawling one.
