---
title: "Database optimization"
description: "Indexes, query plans, normalization, Redis caching, and tuning."
category: "Data & databases"
tags: ["database", "index", "EXPLAIN", "Redis"]
weight: 220
lead: "Make the database fast again."
version: "performance"
---
Slow queries are rarely mysterious — they show up in the plan as a full scan, a missing index, or an N+1 loop. This guide is the loop: measure, explain, index, re-measure.

## Quick reference {#quickref}

The highest-leverage moves in one glance — measure, index, seek, and only then denormalize.

- `EXPLAIN (ANALYZE, BUFFERS) SELECT …` — Run the plan for real — actual rows, time, and page I/O. Trust actual, not cost.
- `CREATE INDEX ON t (a, b) INCLUDE (c);` — B-tree is the default; composite order = filter order; INCLUDE makes it covering (index-only scan).
- `WHERE col = x` — Sargable: keep the column bare — no function, arithmetic, or implicit cast, or the index is skipped.
- `WHERE id > :last ORDER BY id LIMIT 50` — Keyset pagination seeks straight to the page; OFFSET scans and discards every earlier row.
- `SELECT u.id, u.name FROM users u;` — Name the columns you use — SELECT * drags data and defeats covering indexes.
- `JOIN … ON o.user_id = u.id` — Index the join keys. Nested loop = small + indexed, hash = large, merge = both sorted.
- `Normalize writes · denormalize reads` — Normalize to remove redundancy; denormalize hot read paths to drop joins.
- `ANALYZE table;` — Refresh statistics when estimates drift — a bad plan usually means stale stats.

## The optimization loop {#start}

Don't guess. Measure, find the slow query, read the plan, add an index, and measure again — every fix starts and ends with data.

1. **Measure first** — Profile real traffic. Enable the slow query log or `pg_stat_statements` so you're optimizing what actually runs.
1. **Find the slow query** — Rank by total time, not single latency: `total_time = calls × avg_time`. A query run a million times beats a one-off.
1. **EXPLAIN it** — Read the plan. Is it a seq scan on a big table? A nested loop over millions of rows? Find the step that costs the most.
1. **Add an index / rewrite** — Add the missing index, or rewrite the predicate so the optimizer can use one (make it sargable).
1. **Re-measure** — Confirm the plan changed and rows scanned dropped. Keep only the change that measurably helped.

### 1. Turn on logging

```
-- PostgreSQL
log_min_duration_statement = 250
-- MySQL
slow_query_log = ON
long_query_time = 0.25
```

### 2. Rank by total time

```
SELECT query, calls,
       total_exec_time,
       mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### 3. Read the plan

```
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 42
  AND created_at > now() - interval '30 days';
```

### 4. Fix + verify

```
CREATE INDEX idx_orders_uid_ts
  ON orders (user_id, created_at);
ANALYZE orders; -- refresh stats
```

> **KEY:** **Measure before and after.** `EXPLAIN` only estimates; `EXPLAIN ANALYZE` actually runs the query and reports real rows and time. Trust the `actual` numbers over the cost estimate, and keep only the change that measurably helped.

## Indexes {#indexes}

Indexes trade write cost for read speed. Match the index to the query's `WHERE`, `JOIN`, and `ORDER BY`.

| Index | Shines at | Example |
| --- | --- | --- |
| B-tree | Equality, ranges, and sort — the default | `CREATE INDEX idx ON users (email);` |
| Hash | Equality only (`=`), no range or sort — crash-safe since PG 10, but B-tree usually wins | `CREATE INDEX idx ON users USING hash (email);` |
| Composite | Multi-column filters + sort | `CREATE INDEX idx ON orders (user_id, created_at);` |
| Covering | Reading a few columns with no table hop (`INCLUDE` is Postgres syntax; InnoDB auto-covers via the PK) | `CREATE INDEX idx ON orders (user_id) INCLUDE (total);` |
| Partial | A hot subset of rows | `CREATE INDEX idx ON users (email) WHERE deleted_at IS NULL;` |
| Unique | Uniqueness constraint + index in one | `CREATE UNIQUE INDEX idx ON users (email);` |

### Leftmost prefix rule

A composite index `(a, b, c)` serves queries filtering on `a`, `a + b`, or `a + b + c` — but not `b` alone. Order columns by how you filter.

```
-- index (a, b, c) helps:
WHERE a = 1
WHERE a = 1 AND b = 2
-- but NOT:
WHERE b = 2          -- skips a
```

### When indexes hurt

Every `INSERT`/`UPDATE`/`DELETE` must maintain every index. Too many indexes cause write amplification, more storage, and slower writes.

```
-- find unused indexes (PostgreSQL)
SELECT schemaname, relname, indexrelname
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

> **⚠:** **Add an index for the queries you run, not the ones you might.** One well-chosen composite index usually beats five single-column indexes — combining several single-column indexes (BitmapAnd/BitmapOr) is costlier than one index that already matches.

## Query plans {#plans}

`EXPLAIN` shows the plan the optimizer chose. The shape of the plan — scan type and join method — tells you where the time goes.

- `EXPLAIN SELECT …` — Estimate only; does not run the query.
- `EXPLAIN ANALYZE SELECT …` — Runs it; adds actual time + rows.
- `EXPLAIN (ANALYZE, BUFFERS) SELECT …` — Adds cache / page I/O (shared, hit).
- `EXPLAIN (FORMAT JSON) SELECT …` — Machine-readable plan tree.
- `ANALYZE table;` — Refresh statistics the planner uses.
- `SET enable_seqscan = off;` — Debug: force an index scan to compare.

| Operator | What it does | Watch for |
| --- | --- | --- |
| Seq Scan | Reads every row of the table in order | Fine for small tables; suspect on big ones. |
| Index Scan | Looks up rows in an index, then fetches them from the table | Good; check it isn't fetching most of the table. |
| Index Only Scan | Serves the query entirely from the index (covering) | Fastest; needs a covering index. |
| Bitmap Heap Scan | Collects matches in a bitmap, then reads matching pages | Often beats an index scan for many matches. |
| Nested Loop | For each outer row, probe the inner side | Great with a small outer set + indexed inner key. |
| Hash Join | Hashes the smaller side, probes with the other | Best for large, unsorted joins. |
| Merge Join | Sorts both sides, then merges them | Best when both sides are already sorted. |

> **KEY:** **cost is `startup..total` in arbitrary units** — useful for comparing plans, not for predicting wall-clock time. `EXPLAIN ANALYZE` reports `actual time` and `rows`; when those differ wildly from the estimate, statistics are stale — run `ANALYZE table;`.

## Query tuning {#queries}

The optimizer can only use an index when the predicate is *sargable* — keep the column bare on the left side of comparisons.

| Sargable — uses the index | Non-sargable — forces a scan |
| --- | --- |
| `WHERE created_at > now() - interval '1 day'` | `WHERE age(created_at) < 1` — function on the column. |
| `WHERE id = 42` | `WHERE id + 1 = 43` — arithmetic on the column. |
| `WHERE email = 'ada@example.com'` | `WHERE lower(email) = 'ada@example.com'` — function (unless indexed). |
| `WHERE status IN ('new','open')` | `WHERE status \|\| '' = 'new'` — expression on the column. |
| `WHERE deleted_at IS NULL` | `WHERE COALESCE(deleted_at, now()) = now()` — function on the column. |
| `WHERE user_id = 42` on an INT column | `WHERE code = 42` on a TEXT column — implicit cast. |

### LIMIT & keyset pagination

`OFFSET` scans and discards every earlier row, so deep pages get slower. Seek directly with a keyset.

```
-- slow: scans + discards 10000 rows
SELECT * FROM events
ORDER BY id
LIMIT 50 OFFSET 10000;

-- fast: seeks straight to the page
SELECT * FROM events
WHERE id > :last_id
ORDER BY id
LIMIT 50;
```

### Select only what you need

`SELECT *` pulls every column and defeats covering indexes. Name the columns you use.

```
SELECT u.id, u.name, u.email
FROM users u;
-- not: SELECT *  (pulls every column,
-- defeats covering indexes)
```

> **⌁:** **Need a function on a column?** Add an expression index for that exact expression: `CREATE INDEX idx ON users (lower(email));`. Implicit casts and wrappers are the #1 reason an index is ignored.

## Joins & subqueries {#joins}

The optimizer picks the join method; your job is to give it indexes on the join keys and to pick the right structure for the question.

| Join | What it returns | Use when |
| --- | --- | --- |
| `INNER JOIN` | Only rows that match in both tables | The default relationship. |
| `LEFT JOIN` | All left rows + matches (NULLs when no match) | Keep rows even without a match. |
| `RIGHT JOIN` | All right rows + matches | Rare — usually rewritten as LEFT. |
| `FULL OUTER JOIN` | All rows from both sides | Find unmatched rows on both sides. |
| `CROSS JOIN` | Cartesian product | Generate combinations; usually a bug. |
| `EXISTS` / `NOT EXISTS` | Semi/anti join — membership test, no duplicate rows | `WHERE EXISTS (SELECT 1 …)`. |

### EXISTS vs IN

```
-- prefer EXISTS: short-circuits,
-- NULL-safe, no duplicate rows
SELECT id FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
);

-- IN returns duplicates; NULLs in the
-- subquery can surprise you
SELECT id FROM users
WHERE id IN (SELECT user_id FROM orders);
```

### Subquery vs JOIN vs CTE

```
-- JOIN pairs rows; can multiply them
SELECT u.name, o.id FROM users u
JOIN orders o ON o.user_id = u.id;

-- CTE: readable, reusable block
WITH recent AS (
  SELECT * FROM orders
  WHERE created_at > now() - interval '7 days'
)
SELECT u.name, r.total FROM users u
JOIN recent r ON r.user_id = u.id;
```

> **KEY:** **Denormalize when a hot read path joins tables that rarely change** — e.g. cache `orders.total` or `users.order_count`. Pay the write cost once, keep it consistent with a trigger, or accept a bounded window of staleness.

## Schema design {#schema}

Normalize to eliminate redundancy; denormalize to eliminate joins. The schema is a cache-invalidation problem — pick the shape that matches your access patterns.

| Normal form | Rule | Example |
| --- | --- | --- |
| 1NF | Atomic cells, no repeating groups | One email per row; split tags into a join table. |
| 2NF | 1NF + no partial key dependencies | Every non-key column depends on the whole composite key. |
| 3NF | 2NF + no transitive dependencies | Store `city_id`, not `city_name` (which depends on the city). |

### Denormalization trade-offs

Denormalize for reads: fewer joins, faster `SELECT`s. You pay with larger rows, write amplification, and the risk of inconsistent duplicates that must be kept in sync.

### Data types matter

Use the smallest exact type. `INT` not `BIGINT` unless needed; `DATE`/`TIMESTAMPTZ` not `VARCHAR`; `BOOLEAN` not `INT`. Smaller rows = more rows per page = fewer pages read.

```
-- prefer these
id INTEGER NOT NULL,
created_at TIMESTAMPTZ,
active BOOLEAN
-- over VARCHAR dates and 0/1 flags
```

- `PARTITION BY RANGE (created_at)` — Split one table into many by key; prunes scans.
- `PARTITION BY HASH (user_id)` — Even spread across partitions.
- `DETACH PARTITION p_old` — Drop a whole partition instantly.
- `Sharding` — Split rows across servers by a key; horizontal scale.

> **⚠:** **Partition on the column you filter and delete by.** A partition key that never appears in your `WHERE` adds overhead without pruning anything. Sharding buys scale but makes cross-shard joins and transactions much harder.

## Caching & connections {#caching}

The fastest query is the one you never run. Cache at the right layer, and never open a connection per request.

### Connection pooling

Opening a connection is expensive (handshake, auth, memory). A pool reuses a fixed set of connections across requests instead of one per request.

```
# pgbouncer.ini
[databases]
app = host=dbhost dbname=app

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

### Query & result cache

Cache slow, rarely-changing results in Redis/memcached. Invalidate on write or set a TTL. Never cache user-specific data without a per-user key.

```
key = "dashboard:stats"
val = redis.get(key)
if val is None:
    val = run_slow_query()
    redis.set(key, val, ex=60)
```

### Read replicas

Route reads to replicas, writes to the primary. Reads scale horizontally, but accept replication lag — don't read your own write from a replica.

```
# write to primary
conn_primary.execute(...)
# read from replica
conn_replica.query("SELECT …")
```

### Materialized views

Precompute a heavy aggregate into a table; refresh on a schedule. Stale by design, instant to read.

```
CREATE MATERIALIZED VIEW mv_sales AS
  SELECT user_id, sum(total) s
  FROM orders GROUP BY user_id;

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales;
```

> **KEY:** **Cache invalidation is the hard part.** Every cache needs a TTL and a path to rebuild. Cache the final result only if the query is genuinely slow and reads vastly outnumber writes — and always know how you'll invalidate it.

## Redis as a cache & store {#redis}

In-memory data structures on a key-value model — the default answer for caching, rate limits, queues, and fast counters in front of a SQL database.

| Type | What it stores | Core commands |
| --- | --- | --- |
| `STRING` | One value per key | `SET / GET / INCR / EXPIRE` |
| `HASH` | Field/value pairs | `HSET / HGET / HGETALL` |
| `LIST` | Ordered list (queue/stack) | `LPUSH / RPUSH / LPOP / BRPOP` |
| `SET` | Unique members | `SADD / SMEMBERS / SISMEMBER` |
| `ZSET` | Scored, sorted members | `ZADD / ZRANGE / ZRANK` |
| `STREAM` | Append-only event log | `XADD / XREAD / XRANGE` |

### Cache-aside (the usual)

Read through to the DB on a miss, write the result back with a TTL. Invalidate on write.

```
val = redis.get(key)
if val is None:
    val = db.query(...)
    redis.set(key, val, ex=300)
return val
```

### Common patterns

```
INCR counter              # fast counter
SETEX rate:u1 60 1        # rate-limit TTL
LPUSH queue job
BRPOP queue 0             # blocking queue
SADD online:room1 user42  # membership
ZADD lb 42 "player"       # leaderboard
```

| Setting | What it controls |
| --- | --- |
| `RDB` | Point-in-time snapshot; fast recovery, can lose recent writes. |
| `AOF` | Append-only log of every write; safer, larger, slower restart. |
| `maxmemory-policy` | Eviction: `allkeys-lru`, `volatile-lru`, `noeviction`. |
| `EXPIRE` | TTL in seconds; `TTL key` shows what's left. |

> **!:** **Redis is not a durable system of record.** It's in-memory and, under `noeviction` with full memory, new writes fail. Treat it as a cache or a queue with an acknowledgment path — keep the source of truth in Postgres/Kafka, and know your eviction policy before you hit maxmemory.

## Pitfalls {#gotchas}

The bugs that survive to production are the quiet ones: an N+1 here, a type coercion there. Here's what to watch for.

### N+1 queries

One query to list N rows, then one query per row. Collapse it into a single `JOIN` or `IN`.

```
-- ❌ one query per user
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 2;

-- ✅ one query, one join
SELECT o.* FROM orders o
JOIN users u ON u.id = o.user_id
WHERE u.active;
```

### Over-indexing

Every index is rebuilt on every write. A table with twelve indexes pays for all twelve on every `INSERT`.

```
-- find unused indexes (PostgreSQL)
SELECT schemaname, relname, indexrelname
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

### Implicit type conversion

Comparing unlike types forces a cast on the column, which defeats the index.

```
-- ❌ code is TEXT: casts the column
SELECT * FROM orders WHERE code = 42;

-- ✅ compare with the right type
SELECT * FROM orders WHERE code = '42';
```

### Lock contention

Long transactions hold row locks and block everyone. Keep transactions short, lock in a consistent order, and don't run reads inside a write transaction you don't need.

```
BEGIN;
SELECT * FROM jobs WHERE id = 5 FOR UPDATE;
UPDATE jobs SET status = 'done' WHERE id = 5;
COMMIT;  -- release immediately
```

### Dead tuples & bloat

In PostgreSQL, `UPDATE`/`DELETE` leave dead tuples that occupy space until `VACUUM` reaps them. Bloat slows scans, bloats indexes, and wastes cache.

```
-- find tables with the most dead tuples
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- reclaim space
VACUUM (VERBOSE) orders;
```

### Stale statistics

The planner picks a plan from table statistics. After bulk writes — or when a plan suddenly gets worse — the stats have drifted. Refresh them before changing anything else.

```
ANALYZE orders;
-- or just the columns a query filters
ANALYZE orders (user_id, created_at);
```

> **⚠:** **Don't optimize until you've measured it being slow.** Adding indexes and denormalizing on a hunch is how you get twelve-index tables and buggy caches. Profile first, fix the top offender, re-measure.
