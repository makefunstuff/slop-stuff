---
title: "Algorithms"
description: "Complexity classes, sorting, searching, data structures, and graphs."
category: "Systems & CS"
tags: ["cs", "big-O", "sort", "graph"]
weight: 450
lead: "The patterns behind fast code."
version: "complexity"
---
Big-O tells you how an algorithm scales before you write a line of it. This is the map: the complexity classes that matter, the sorts and searches you'll actually reach for, and the structures and graph algorithms behind them.

## Quick reference {#quickref}

The eight items you'll reach for most — scan this before anything else.

- `O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)` — **Big-O ladder.** Constant → logarithmic → linear → linearithmic → quadratic → exponential: how cost scales with `n`.
- `O(n log n)` — **Sorting.** Quicksort: in-place, `O(n log n)` avg / `O(n²)` worst, unstable. Mergesort: `O(n log n)` always, stable, `O(n)` space.
- `mid = lo + (hi - lo) // 2` — **Binary search.** `O(log n)` on a sorted array — the `lo + (hi - lo)` midpoint form avoids integer overflow.
- `dict / set` — **Hash table.** `O(1)` avg insert, lookup, delete — `O(n)` worst under collisions. No ordering.
- `BFS = queue · DFS = stack` — **Graph traversal.** Both `O(V + E)`. BFS gives shortest unweighted paths; DFS handles reachability, cycles, topological sort.
- `pq = [(0, start)]` — **Dijkstra.** `O((V + E) log V)` shortest paths with non-negative weights — use Bellman-Ford when edges go negative.
- `memo[n] = fib(n-1) + fib(n-2)` — **DP / memoization.** Cache overlapping subproblems to go from exponential to polynomial: naive fib `O(2ⁿ)` → memoized `O(n)`.
- `Ω(n log n)` — **Sorting floor.** Comparison sorts can't beat `Ω(n log n)`; beat it with counting/radix sort, or skip sorting and hash instead.

## Complexity & big-O {#start}

Big-O describes how cost grows with input size `n` — the one number that decides if an algorithm will survive real data.

| Class | Name | Typical example | Scales like |
| --- | --- | --- | --- |
| `O(1)` | Constant | array index, hash lookup | Same cost no matter how big `n` gets. |
| `O(log n)` | Logarithmic | binary search, balanced-tree ops | One more step each time `n` doubles. |
| `O(n)` | Linear | linear scan, summing an array | One step per element. |
| `O(n log n)` | Linearithmic | mergesort, heapsort, quicksort (avg) | `n` elements across `log n` levels. |
| `O(n²)` | Quadratic | nested loop, insertion-sort worst | `n × n` comparisons. |
| `O(2ⁿ)` | Exponential | brute-force subsets, naive fib | Doubles with each added element. |

### Best / average / worst

Big-O usually names the **worst case**; quote the case that matters. Quicksort is `O(n log n)` average but `O(n²)` worst — random or median-of-three pivots keep it fast.

### Amortized

Rare expensive steps spread over many cheap ones. A dynamic array's `push` is `O(1)` amortized: doubling capacity is paid back by the inserts that follow.

### Space complexity

Extra memory beyond the input. Mergesort needs `O(n)` auxiliary space, quicksort `O(log n)` for its stack, and in-place sorts like heapsort need `O(1)`.

> **KEY:** **`n log n` is the floor.** Any comparison-based sort needs at least `Ω(n log n)` comparisons. To beat it you must exploit structure — counting, radix, or bucket sort — or skip sorting and hash instead.

## Sorting {#sorting}

Quicksort, mergesort, heapsort, and insertion — plus stability, which decides when equal keys keep their order.

| Algorithm | Average | Worst | Space | Stable |
| --- | --- | --- | --- | --- |
| Quicksort | `O(n log n)` | `O(n²)` | `O(log n)` | No |
| Mergesort | `O(n log n)` | `O(n log n)` | `O(n)` | Yes |
| Heapsort | `O(n log n)` | `O(n log n)` | `O(1)` | No |
| Insertion sort | `O(n²)` | `O(n²)` | `O(1)` | Yes |
| Timsort (built-in) | `O(n log n)` | `O(n log n)` | `O(n)` | Yes |

### Quicksort — in-place default

Cache-friendly and usually fastest on arrays, but not stable. Use it when order among equal keys doesn't matter.

### Mergesort — stable & guaranteed

Guaranteed `O(n log n)` and stable; the choice for linked lists and external/disk sorts that need extra space anyway.

### Heapsort — tight memory

`O(1)` extra space and no recursion. Use when memory is constrained; it's also the engine inside a priority queue.

### Insertion sort — tiny or sorted

Runs in `O(n)` on nearly-sorted input. Real quicksort and Timsort switch to it below ~10–50 elements.

### Quicksort (simple, not in-place)

```
def quicksort(a):
    if len(a) <= 1:
        return a
    pivot = a[len(a) // 2]
    left  = [x for x in a if x < pivot]
    mid   = [x for x in a if x == pivot]
    right = [x for x in a if x > pivot]
    return quicksort(left) + mid + quicksort(right)
```

### Mergesort

```
def mergesort(a):
    if len(a) <= 1:
        return a
    m = len(a) // 2
    L, R = mergesort(a[:m]), mergesort(a[m:])
    out, i, j = [], 0, 0
    while i < len(L) and j < len(R):
        if L[i] <= R[j]: out.append(L[i]); i += 1
        else:            out.append(R[j]); j += 1
    return out + L[i:] + R[j:]
```

> **⌁:** **Stable** sorts keep equal keys in their original order. You need that when sorting by a secondary key after a primary sort — otherwise the first ordering gets scrambled.

## Searching {#search}

Linear scan, binary search, hashing, tree lookup, and indexes — match the method to the data's shape.

| Method | Lookup | Requires | Notes |
| --- | --- | --- | --- |
| Linear search | `O(n)` | nothing | Unsorted or tiny data; scan until found. |
| Binary search | `O(log n)` | sorted array | Halve the range each step. |
| Hash table | `O(1)` avg | hash function | Collisions degrade to `O(n)`. |
| BST lookup | `O(log n)` avg | balanced tree | Unbalanced → `O(n)`; keeps sorted order. |
| Database index | `O(log n)` | B-tree / hash index | Disk-friendly, supports range scans. |

### Binary search

```
def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2   # no overflow
        if a[mid] == target:
            return mid
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1                       # not found
```

### Hash for membership

Build a set once, then every check is `O(1)`. Repeated linear scans would be `O(n²)`.

```
def linear_search(a, target):
    for i, x in enumerate(a):
        if x == target:
            return i
    return -1

seen = set(a)            # O(n) build
if target in seen: ...   # O(1) lookups
```

## Data structures {#structures}

The operation costs that decide which container fits your problem.

| Structure | Access | Search | Insert | Delete | Use for |
| --- | --- | --- | --- | --- | --- |
| Array | `O(1)` | `O(n)` | `O(n)` | `O(n)` | Random access, cache locality. |
| Linked list | `O(n)` | `O(n)` | `O(1)`* | `O(1)`* | Insert/delete at a known node. *at head/tail. |
| Stack / queue | `O(n)` | `O(n)` | `O(1)` | `O(1)` | LIFO / FIFO; the plumbing of DFS / BFS. |
| Hash table | — | `O(1)` avg | `O(1)` avg | `O(1)` avg | Key → value, unordered; `O(n)` worst. |
| Balanced BST | `O(log n)` | `O(log n)` | `O(log n)` | `O(log n)` | Sorted, dynamic, range queries. |
| Heap | `O(1)` peek | `O(n)` | `O(log n)` | `O(log n)` | Priority queue: min/max always on top. |
| Graph (adj list) | — | `O(V + E)` | `O(1)` | `O(1)` | Sparse graphs, iterating neighbors. |

### Hash table caveats

Worst case is `O(n)` when everything collides — a good hash function plus rehashing keeps it `O(1)`. It has no ordering; for sorted ranges reach for a tree.

### Heap = priority queue

Peek is `O(1)`, push/pop are `O(log n)`. Use it for Dijkstra, top-k, and scheduling. Finding an arbitrary element is still `O(n)`.

### Stack & queue

```
stack = []
stack.append("a")   # push
stack.pop()         # pop (LIFO)

from collections import deque
q = deque()
q.append("a")       # enqueue
q.popleft()         # dequeue (FIFO)
```

### Heap in Python

```
import heapq
h = []
heapq.heappush(h, 3)   # O(log n)
heapq.heappush(h, 1)
heapq.heappop(h)       # 1 — O(log n)
h[0]                   # peek — O(1)
```

## Graph algorithms {#graph}

Traversals, shortest paths, and spanning trees — and how you store the graph in the first place.

| Algorithm | Solves | Complexity | Key ingredient |
| --- | --- | --- | --- |
| BFS | Shortest path in unweighted graphs, level order | `O(V + E)` | queue |
| DFS | Reachability, cycle detection, topological sort | `O(V + E)` | stack / recursion |
| Dijkstra | Shortest path with non-negative weights | `O((V + E) log V)` | priority queue |
| A* | Shortest path guided by a heuristic | problem-dependent | priority queue + `h(n)` |
| Topological sort | Order a DAG's dependencies | `O(V + E)` | DFS / Kahn's algorithm |
| Kruskal | Minimum spanning tree | `O(E log E)` | sort edges + union-find |
| Prim | Minimum spanning tree | `O((V + E) log V)` | priority queue |

### Adjacency list

`O(V + E)` space and fast neighbor iteration. The default for sparse graphs — most real-world graphs are sparse.

```
graph = {
  "a": ["b", "c"],
  "b": ["a", "d"],
}
```

### Adjacency matrix

`O(V²)` space but `O(1)` edge checks. Only worth it for dense graphs or when you query edges constantly.

```
# matrix[i][j] = 1 means edge i→j
matrix = [[0,1,1],
          [1,0,1],
          [0,0,0]]
```

### BFS — shortest path, unweighted

```
from collections import deque

def bfs(graph, start):
    seen = {start}
    q = deque([start])
    while q:
        node = q.popleft()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                q.append(nxt)
    return seen
```

### Dijkstra — non-negative weights

```
import heapq

def dijkstra(graph, start):
    dist = {start: 0}
    pq = [(0, start)]
    while pq:
        d, node = heapq.heappop(pq)
        if d > dist.get(node, float("inf")):
            continue
        for nxt, w in graph[node]:
            nd = d + w
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd
                heapq.heappush(pq, (nd, nxt))
    return dist
```

> **!:** **Dijkstra breaks on negative edges** — use Bellman-Ford there. And A* is only correct if its heuristic never overestimates the true remaining cost (it must be *admissible*).

## Divide & conquer / DP {#dp}

Recursion, reuse, and greed — the three ways to turn a big problem into small ones.

1. **State** — What changes as you solve? An index, remaining capacity, two string positions…
1. **Recurrence** — Express the answer in terms of smaller subproblems.
1. **Base cases** — The smallest inputs you can answer directly.
1. **Order** — Memoize top-down, or fill a table bottom-up in dependency order.

### Divide & conquer

Split into independent pieces, solve each, combine. Mergesort, quicksort, binary search. Recurrence `T(n) = 2T(n/2) + O(n)` → `O(n log n)`.

### Memoization (top-down)

Cache results by their inputs. Turns overlapping-subproblem recursion from exponential into polynomial — the fix for naive Fibonacci.

### Dynamic programming

Memoization's bottom-up sibling: fill a table when subproblems overlap and you can order them. Knapsack, edit distance, longest common subsequence.

### Greedy

Take the locally best choice and never backtrack. Dijkstra, Prim, Huffman, activity selection. Correct only when a local optimum is also global.

### Naive recursion — O(2ⁿ)

```
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)
```

### Memoized — O(n)

```
memo = {0: 0, 1: 1}
def fib(n):
    if n not in memo:
        memo[n] = fib(n-1) + fib(n-2)
    return memo[n]
```

## Common techniques {#techniques}

Five patterns that solve a surprising share of real and interview problems.

- `i, j = 0, len(a) - 1` — **Two pointers.** Walk from both ends (or both from the start) to find sorted pairs, palindromes, or partitions in `O(n)`.
- `win = sum(a[l:r])` — **Sliding window.** Grow and shrink a window to track subarrays under a constraint — no re-scanning the window each step.
- `pre[i] = pre[i-1] + a[i]` — **Prefix sums.** Any range sum `a[l:r] = pre[r+1] - pre[l]` in `O(1)` after one `O(n)` pass.
- `while lo < hi: mid = (lo+hi)//2` — **Binary search on answer.** Search the value range, not the array, when a monotonic `check(x)` tells you if `x` is feasible.
- `def search(path): …` — **Backtracking.** Choose, recurse, undo. Prune branches that can't lead to a solution before exploring them.

### Prefix sums in practice

```
pre = [0]
for x in a:
    pre.append(pre[-1] + x)
# sum of a[l:r] (inclusive r) is:
pre[r + 1] - pre[l]
```

### Binary search on answer

```
def ok(x): return can_make(x)   # monotonic
lo, hi = 0, max_val
while lo < hi:
    mid = (lo + hi + 1) // 2
    if ok(mid): lo = mid
    else:       hi = mid - 1
return lo   # largest feasible value
```

### Two pointers — palindrome

```
def is_palindrome(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i, j = i + 1, j - 1
    return True
```

### Sliding window — max sum of size k

```
def max_subarray_sum(a, k):
    win = sum(a[:k])
    best = win
    for i in range(k, len(a)):
        win += a[i] - a[i - k]   # slide
        best = max(best, win)
    return best
```

## Pitfalls {#gotchas}

The classic ways correct-looking code goes wrong.

### Off-by-one

Closed `[lo, hi]` vs half-open `[lo, hi)` change the loop condition and the `- 1`s. Pick half-open ranges everywhere and the fenceposts disappear.

### Integer overflow

`(lo + hi) / 2` overflows when `lo + hi` exceeds the int range — use `lo + (hi - lo) / 2`. Watch 32-bit ints; arbitrary-precision languages sidestep it.

### Wrong structure

An `O(n)` list membership inside a loop becomes `O(n²)`; a set makes it `O(n)`. Choose the structure for the operation you repeat.

### Constant factors

Big-O hides constants: a tight `O(n²)` can beat `O(n log n)` on small `n`. Profile real data before "optimizing" to a worse practical choice.

### Caching / locality

Sequential array access is far faster than pointer-chasing a linked list — locality often beats asymptotics on modern CPUs. Arrays are the default for a reason.

### Recursion depth

Deep recursion overflows the call stack. Convert to an explicit stack or loop, or use iterative bottom-up DP for linear/quadratic space.

### Stability assumed

Not every sort is stable: quicksort and heapsort reorder equal keys. Sorting by a secondary key after a primary sort silently scrambles the first ordering unless the sort is stable.

### Floating-point comparisons

Comparing floats with `==` — or using them as binary-search bounds — can loop forever or miss the target. Prefer integer arithmetic, or compare against a tolerance `abs(a - b) < eps`.

> **!:** **Premature optimization is the trap.** Get the algorithm right first, then measure. Big-O picks the strategy; a profiler picks the implementation.
