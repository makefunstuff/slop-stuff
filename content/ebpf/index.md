---
title: "eBPF"
description: "Programs, maps, hooks, the verifier, and observability tooling."
category: "Systems & CS"
tags: ["systems", "kprobe", "XDP", "bpftrace"]
weight: 480
lead: "Programmable kernel."
version: "kernel"
---
eBPF runs sandboxed programs inside the Linux kernel — safely tracing, filtering, and observing everything — with no kernel module and no reboot.

## Quick reference {#quickref}

The eight commands and concepts you'll reach for most — copy, adapt, then dig into the sections below.

- `bpftrace -e 'kprobe:vfs_read { @[comm] = count(); }'` — one-liner tracing — count a function call per process, no compile step.
- `bpftool prog list · bpftool map dump name counts` — list loaded programs and dump a map's key/value pairs.
- `clang -O2 -g -target bpf -c prog.c -o prog.o` — compile C to BPF bytecode (libbpf object file).
- `bpftool prog load prog.o /sys/fs/bpf/x autoattach` — load and auto-attach a `SEC`-tagged object file.
- `go generate` — cilium/ebpf's `bpf2go` compiles C and embeds it into Go bindings.
- `SEC("xdp") · SEC("tracepoint/…")` — the section name chooses the hook — kprobe, tracepoint, XDP, tc, cgroup, uprobe.
- `BPF_MAP_TYPE_HASH · ARRAY · PERCPU_* · RINGBUF` — hash & array for counters/config, per-CPU to avoid races, ringbuf for streaming.
- `bpf_core_read(&v, &ctx->field)` — CO-RE + BTF relocate field offsets — compile once, run on many kernels.

`libbpf` `cilium/ebpf` `bpftrace` `bpftool` `bpf2go` `CO-RE` `BTF` `sched_ext`

## What eBPF is {#start}

Small programs compiled to BPF bytecode, loaded into the kernel, proven safe by the verifier, JIT-compiled to native code, and attached to a hook.

**Userspace** (loads & attaches) → **Verifier** (proves safety) → **JIT** (native code) → **Kernel hook** (kprobe · XDP · tc) → **Maps** (shared state)

1. **Write** — A `SEC`-tagged C function, or a Go loader over a small C file.
1. **Compile** — `clang -O2 -target bpf` emits BPF bytecode into an ELF object file.
1. **Load** — The `bpf()` syscall hands the bytecode to the verifier.
1. **Verify + JIT** — The verifier proves safety, then JIT-compiles to native code.
1. **Attach + run** — The program binds to a hook and fires on every matching event.

### 1. Install tooling

```
sudo apt install clang llvm \\
  bpftool bpftrace libbpf-dev
```

### 2. Write

```
SEC("tracepoint/…")
int prog(void *ctx) { … }
char LICENSE[] = "GPL";
```

### 3. Compile

```
clang -O2 -target bpf -g \\
  -c prog.c -o prog.o
```

### 4. Load & attach

```
bpftool prog load prog.o \\
  /sys/fs/bpf/prog autoattach
```

> **KEY:** **Nothing runs until the verifier approves.** The bytecode is checked for bounded loops, in-bounds memory access, and whitelisted helpers — then JIT-compiled and attached. Maps are the only shared state between your program and userspace.

### eBPF

Verified, sandboxed, JIT-compiled, no reboot. It can only run through hooks, so a bad program can't crash the kernel.

### Kernel module

Unrestricted native code that can panic the kernel, must be rebuilt against the exact kernel headers, and loads with `insmod`.

## Program types & hooks {#hooks}

The hook decides when your program runs and what `ctx` it receives.

| Hook | Where it runs | Use when | Example |
| --- | --- | --- | --- |
| `kprobe` / `kretprobe` | any kernel function (entry / return) | tracing one function | `kprobe:vfs_read` |
| `fentry` / `fexit` | function entry / exit via BTF | fast, stable tracing (prefer over kprobes) | `fentry/vfs_read` |
| `tracepoint` | stable kernel tracepoints | low-overhead, stable ABI | `tracepoint:syscalls:sys_enter_open` |
| `XDP` | earliest point in the NIC driver | DDoS filter, load balancing | `xdp` |
| `tc` | traffic control ingress / egress | shaping, policing, redirect | `tc/ingress` |
| `socket filter` | per-socket | filter one socket's packets | `SO_ATTACH_BPF` |
| `cgroup` | cgroup attach points | per-container policy | `cgroup/skb` |
| `uprobe` / `uretprobe` | userspace functions | tracing applications | `uprobe:/bin/bash:readline` |

> **!:** **kprobes are not a stable ABI.** Kernel function names and signatures change between releases. Prefer tracepoints (a stable interface) or `fentry`/`fexit` (BTF-based function tracing) for long-lived tooling; reach for kprobes when exploring or when no better hook exists.

### Attach a kprobe

```
bpftrace -e 'kprobe:do_sys_open { @[comm] = count(); }'
```

### Attach a tracepoint

```
bpftrace -e 'tracepoint:syscalls:sys_enter_open { @[comm] = count(); }'
```

### Attach XDP

```
ip link set dev eth0 xdp obj prog.o sec xdp
# detach:
ip link set dev eth0 xdp off
```

## Maps {#maps}

Key/value stores shared between kernel and userspace — the only state that survives between events.

| Map type | Stores | Use when |
| --- | --- | --- |
| `BPF_MAP_TYPE_HASH` | key → value pairs | counters, lookup tables |
| `BPF_MAP_TYPE_ARRAY` | fixed array, `u32` index | per-CPU stats, config |
| `BPF_MAP_TYPE_PERCPU_HASH` | per-CPU copy per key | avoid races on shared keys |
| `BPF_MAP_TYPE_LRU_HASH` | hash with LRU eviction | bounded caches |
| `BPF_MAP_TYPE_PERF_EVENT_ARRAY` | events to a perf buffer | stream events to userspace |
| `BPF_MAP_TYPE_RINGBUF` | lock-free ring buffer | low-latency event streaming |
| `BPF_MAP_TYPE_STACK_TRACE` | kernel / user stack traces | profiling, flame graphs |
| `BPF_MAP_TYPE_ARENA` | huge memory-mapped region | GB-scale state (e.g. sched_ext schedulers) |

### Kernel side

Look up, update, or delete entries from inside the program.

```
__u64 *v = bpf_map_lookup_elem(&counter_map, &key);
if (v) __sync_fetch_and_add(v, 1);
else   bpf_map_update_elem(&counter_map, &key, &one, BPF_ANY);
```

### Userspace side

Open the same map by fd and read it, or inspect it from the shell.

```
bpftool map dump name counter_map
# or in Go:
objs.CounterMap.Lookup(key)
```

- `bpf_map_lookup_elem(&m, &k)` — read a value; `NULL` if the key is absent.
- `bpf_map_update_elem(&m, &k, &v, BPF_ANY)` — insert or overwrite a key.
- `bpf_map_delete_elem(&m, &k)` — remove a key.
- `bpf_map_get_next_key(&m, &k, &next)` — iterate keys (start with `NULL`).

> **⇄:** **Maps are the only channel between kernel and user.** Pick `BPF_MAP_TYPE_RINGBUF` over a perf event array for new streaming code — it's lock-free and supports variable-size records.

## Tooling {#tooling}

Five layers, from one-liner tracing to production Go loaders.

- `bpftool prog list` — list loaded programs and their IDs.
- `bpftool map dump name counters` — dump a map's key/value pairs.
- `bpftool prog load prog.o /sys/fs/bpf/prog autoattach` — load + auto-attach an object file.
- `bpftrace -l 'tracepoint:syscalls:*'` — list available tracepoints.
- `bpftrace -e 'kprobe:vfs_read { @[comm] = count(); }'` — count reads per process.
- `python3 ./trace.py` — BCC: tracing in Python with inline C.
- `clang -O2 -target bpf -g -c prog.c -o prog.o` — compile C to BPF bytecode (libbpf).
- `go generate` — bpf2go compiles + embeds BPF into Go.

`libbpf` `BCC` `cilium/ebpf` `bpftrace` `bpftool` `bpf2go`

> **▲:** **Start with bpftrace to explore, graduate to libbpf or cilium/ebpf for production.** bpftrace and BCC shine for scripts; libbpf (C) and cilium/ebpf (Go) give you static programs, CO-RE, and full lifecycle control.

<details>
<summary>More bpftool + bpftrace recipes</summary>

- `bpftool prog dump xlated id N` — disassemble a loaded program.
- `bpftool prog pin id N /sys/fs/bpf/x` — pin a program for later reuse.
- `bpftool feature probe` — report this kernel's eBPF capabilities.
- `bpftrace -e 't:block:block_rq_issue { @[args->comm] = count(); }'` — count block I/O per process.
- `bpftrace -e 'uprobe:/bin/bash:readline { printf("%s\n", str(arg0)); }'` — log every bash command line.
- `bpftool btf dump file /sys/kernel/btf/vmlinux format c` — dump kernel BTF as C headers.

</details>

## Writing a program {#program}

A minimal skeleton: a section-tagged function, a map, and an attach call.

### Complete program (C · libbpf)

Counts `execve` calls per process in a hash map.

```
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

char LICENSE[] SEC("license") = "GPL";

struct {
  __uint(type, BPF_MAP_TYPE_HASH);
  __uint(max_entries, 1024);
  __type(key, __u32);   /* pid */
  __type(value, __u64); /* count */
} counts SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_execve")
int count_exec(void *ctx) {
  __u32 pid = bpf_get_current_pid_tgid() >> 32;
  __u64 *v = bpf_map_lookup_elem(&counts, &pid);
  __u64 one = 1;
  if (v) __sync_fetch_and_add(v, 1);
  else   bpf_map_update_elem(&counts, &pid, &one, BPF_ANY);
  return 0;
}
```

### Compile & load

Build the object, load it, and read the map.

```
clang -O2 -target bpf -g -c prog.c -o prog.o
bpftool prog load prog.o /sys/fs/bpf/prog autoattach
bpftool prog list
bpftool map dump name counts
```

### Go with bpf2go

`bpf2go` compiles the C and generates Go bindings.

```
//go:build linux
//go:generate go run github.com/cilium/ebpf/cmd/bpf2go counter counter.c

var objs counterObjects
loadCounterObjects(&objs, nil)
defer objs.Close()
```

### Attach (Go)

Attach to the tracepoint, then read maps through the generated struct.

```
tp, err := link.Tracepoint("syscalls",
  "sys_enter_execve", objs.CountExec, nil)
defer tp.Close()
// read/write via objs.Counts.Lookup(…)
```

> **SEC:** **The section name is the hook.** `SEC("tracepoint/syscalls/sys_enter_execve")` tells libbpf where to attach. Programs must declare a GPL-compatible license (`char LICENSE[] = "GPL"`) to call GPL-only helpers.

<details>
<summary>What bpf2go generates</summary>

`counter_bpfel.go` (little-endian) and `counter_bpfeb.go` (big-endian) embed the compiled bytecode and declare the `counterObjects`, `counterPrograms`, and `counterMaps` types plus the `loadCounterObjects` loader — no clang needed at runtime.

</details>

## The verifier {#verifier}

Before loading, the kernel proves your program is safe. What it enforces:

| Rule | What the verifier requires | Why |
| --- | --- | --- |
| `bounded loops` | every loop must provably terminate (or be unrolled) | guarantee finite runtime |
| `bounds checks` | every load/store must be provably in-bounds | no out-of-bounds access |
| `no unreachable code` | dead instructions are rejected | verifier explores all paths |
| `helper whitelist` | only whitelisted `bpf_*` helpers and registered kfuncs may be called | no arbitrary kernel calls |
| `pointer safety` | kernel pointers can't leak to userspace or into maps | protect kernel memory |
| `512-byte stack` | per-subprogram stack is capped at 512 B — move big buffers to maps | bounded memory use |
| `1M instructions` | complexity limit before rejection | the verifier itself terminates |

- **SCALAR_VALUE** — a number; the verifier tracks its value range.
- **PTR_TO_MAP_VALUE** — pointer into a map value, bounds-checked.
- **PTR_TO_STACK** — pointer into the 512-byte stack.
- **PTR_TO_CTX** — pointer to the hook context (`ctx`).

### Without CO-RE

Recompile against the exact kernel headers; struct field offsets are baked in and break across versions.

### With CO-RE + BTF

BTF describes kernel types at load time; CO-RE relocations patch field offsets, so one `.o` covers many kernels.

1. **Parse** — libbpf reads the ELF object: programs, maps, and relocations.
1. **Verify** — The kernel walks every path, checking bounds, loops, and helper calls.
1. **Relocate (CO-RE)** — Field offsets and helper references are patched using BTF.
1. **JIT + attach** — Bytecode becomes native code and binds to the hook.
> **CO-RE:** **Compile once, run anywhere.** Use `bpf_core_read()` and `__builtin_preserve_access_index` so field offsets relocate from BTF instead of being compiled in.

## Use cases {#usecases}

Observability, networking, security, and profiling — four reasons to reach for eBPF.

### Observability

Measure syscall latency as a histogram, with no app changes.

```
bpftrace -e 'kprobe:vfs_read { @start[tid] = nsecs; }
kretprobe:vfs_read /@start[tid]/ {
  @us = hist((nsecs - @start[tid]) / 1000);
  delete(@start[tid]); }'
```

### Networking (XDP)

Drop or redirect packets at the NIC, before the network stack — DDoS filtering and load balancing at line rate. In pods, Cilium now attaches these programs to `netkit` devices instead of veth.

```
SEC("xdp")
int xdp_filter(struct xdp_md *ctx) {
  return XDP_DROP; /* or XDP_PASS / XDP_TX */
}
```

### Security

`seccomp-bpf` filters syscalls per process; LSM hooks enforce policy across the whole kernel (audit, socket controls).

`seccomp` `LSM` `audit`

### Profiling & tracing

Sample stack traces at 99 Hz for flame graphs and CPU profiling.

```
bpftrace -e 'profile:hz:99 { @[kstack] = count(); }'
```

> **→:** **Pick the hook to match the goal.** Observability → kprobe / tracepoint / fentry; networking → XDP / tc (or `netkit` devices); security → seccomp / LSM / cgroup; profiling → perf events via `profile:hz`; scheduling → `struct_ops` via `sched_ext` (Linux 6.12+).

## Pitfalls {#gotchas}

Things that bite everyone once, from verifier rejections to missing helpers.

> **⚠:** **The verifier is conservative.** Correct code can still be rejected. When it is, simplify: fewer branches, explicit bounds checks, constant loop bounds.

### Verifier limits

Loops, stack (512 B), and instruction count (1M) are capped. Unroll small loops, move big buffers to maps, and keep `SEC` functions short.

```
#pragma unroll
for (int i = 0; i < 8; i++) { … }
```

### Kernel version & CO-RE

Helpers and features vary by kernel. Use BTF + CO-RE, and feature-detect at load time.

```
if (bpf_core_enum_value_exists(
      enum bpf_func_id, BPF_FUNC_…)) { … }
```

### Map sizing

Maps preallocate memory. `max_entries` too small → `ENOSPC` / `E2BIG`; too big wastes RAM.

```
__uint(max_entries, 65536);
__uint(map_flags, BPF_F_NO_PREALLOC); /* huge hashes */
```

### GPL license

GPL-only helpers refuse to load unless the program declares a GPL-compatible license.

```
char LICENSE[] SEC("license") = "GPL";
```

### Privileges

Loading programs needs `CAP_BPF` + `CAP_PERFMON` (or root). Unprivileged eBPF is heavily restricted and often disabled.

```
cat /proc/sys/kernel/unprivileged_bpf_disabled
# 1 = disabled, 2 = always disabled
```

### Ring buffer vs perf

Prefer `ringbuf` for new code — lock-free, single-producer, and supports reservation for variable-size records.

```
__uint(type, BPF_MAP_TYPE_RINGBUF);
__uint(max_entries, 1 << 20); /* 1 MiB */
```

### Missing BTF

CO-RE relocation needs the running kernel's BTF at `/sys/kernel/btf/vmlinux`. If it's absent (old or stripped kernels), CO-RE fails — ship a matching `.BTF` blob or fall back to compiled headers.

```
ls /sys/kernel/btf/vmlinux
# absent? boot with CONFIG_DEBUG_INFO_BTF=y
```

### fentry/fexit context

`fentry`/`fexit` pass the function's raw arguments as a struct — there's no `PT_REGS` sugar like kprobes. Read args via CO-RE field access, and require BTF on the target kernel.

```
SEC("fentry/vfs_read")
int BPF_PROG(fentry_vfs_read,
  struct file *f, char *buf,
  size_t count, loff_t *pos) { … }
```
