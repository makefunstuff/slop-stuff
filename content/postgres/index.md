---
title: "Postgres management"
description: "psql, users/permissions, backups, replication, tuning, and monitoring."
category: "Data & databases"
tags: ["database", "psql", "pg_dump", "VACUUM"]
weight: 250
lead: "Run Postgres in production."
version: "psql · admin"
---
PostgreSQL is the database you keep for years. This cheatsheet covers the operational half — `psql`, roles and privileges, backups, replication, and the tuning knobs that keep it fast under load.

## Quick reference {#quickref}

The daily surface on one screen — connect, inspect, back up, and keep it healthy. Everything here is expanded in the sections below.

- `psql -U postgres -d appdb` — Connect — add `-h host` `-p 5432`, or a URI: `postgres://u:p@host/db`.
- `\l · \dt · \d users` — List databases, list tables, describe one table.
- `pg_dump -Fc appdb > appdb.dump` — Compressed custom-format dump (best default).
- `pg_restore -d appdb appdb.dump` — Restore it — `-l` lists contents, `-j 4` restores in parallel.
- `GRANT SELECT, INSERT ON users TO app;` — Give a role table rights; `REVOKE ALL … FROM app` takes them back.
- `VACUUM (ANALYZE) users;` — Reclaim dead tuples and refresh planner stats.
- `EXPLAIN (ANALYZE, BUFFERS) SELECT …;` — Real query plan with timing and I/O.
- `CREATE PUBLICATION pub FOR TABLE users;` — Logical replication — or stream WAL to a standby (next section).
- `SELECT pid, state, query FROM pg_stat_activity;` — What's running right now.

## psql basics {#start}

Connect with `psql`, then orient yourself with the `\` backslash commands. They never touch the server's SQL parser.

### 1. Connect

```
psql -U postgres -d appdb
psql "postgres://u:p@host:5432/db"
# -h host -p 5432 -U user -d db
```

### 2. List & inspect

```
\l           # databases
\dt          # tables
\d users     # one table
\dn          # schemas
```

### 3. Expanded & copy

```
\x on        # vertical output
\copy users TO 'u.csv' CSV HEADER
\conninfo     # who/where am I
```

### 4. .pgpass

```
# host:port:db:user:password
localhost:5432:appdb:app:s3cret
chmod 600 ~/.pgpass
```

> **KEY:** **Meta-commands start with a backslash** and run inside `psql` only. Real SQL ends with `;` — `\l` lists databases, but `SELECT * FROM users;` is a query you can send from any client. `\?` lists every meta-command.

<details>
<summary>More psql meta-commands</summary>

- `\du` — List roles and their attributes.
- `\dp users` — Table privileges (the ACL).
- `\di` — List indexes.
- `\dv` — List views.
- `\d+ users` — Extended describe with storage/size.
- `\timing on` — Show query execution time.
- `\e` — Edit the last query in $EDITOR.
- `\i schema.sql` — Run a SQL file.
- `\! pg_dump --version` — Escape to a shell command.

</details>

## Users & permissions {#users}

Postgres calls users and groups *roles*. Privileges are granted per object, and row-level security adds a per-row filter.

| Statement | What it does | Tip |
| --- | --- | --- |
| `CREATE ROLE app LOGIN PASSWORD 's3cret'` | Creates a role that can connect. | `NOLOGIN` makes a group. |
| `ALTER ROLE app CREATEDB` | Adds attributes (`SUPERUSER`, `REPLICATION`…). | Avoid `SUPERUSER` for apps. |
| `GRANT SELECT, INSERT, UPDATE ON users TO app` | Table privileges; also `DELETE`, `TRUNCATE`. | `GRANT ALL` for everything. |
| `GRANT USAGE ON SCHEMA public TO app` | Lets the role touch the schema. | Required before table access. |
| `REVOKE ALL ON users FROM app` | Removes privileges. | `GRANT OPTION` can spread rights. |
| `ALTER TABLE users OWNER TO app` | Transfers ownership. | Only the owner can drop/alter. |
| `ALTER TABLE users ENABLE ROW LEVEL SECURITY` | Turns on RLS. | No policy = no rows visible. |
| `CREATE POLICY p ON users USING (tenant_id = current_setting('app.tenant'))` | Per-row filter. | Add `WITH CHECK` for writes. |

> **✓:** **Least privilege:** grant only what an app needs, and put each app in its own role. Check membership with `\du` and a role's grants with `\dp users`.

<details>
<summary>Role membership & switching</summary>

#### Group membership

```
GRANT app TO admin;
# admin inherits app's rights
REVOKE app FROM admin;
SET ROLE app;   -- become app
RESET ROLE;     -- back to self
```

#### Check who has what

```
\du          # roles + members
\dp users    # per-table ACL
SELECT * FROM pg_roles;
SELECT * FROM information_schema
  .table_privileges;
```

</details>

## Backups & restore {#backup}

Logical dumps with `pg_dump` for portability, or physical WAL-based backups for point-in-time recovery.

- `pg_dump -Fc appdb > appdb.dump` — Compressed custom-format dump (best default).
- `pg_restore -d appdb appdb.dump` — Restore a custom-format dump.
- `pg_dump -Fp --clean appdb > appdb.sql` — Plain-text SQL dump.
- `pg_dumpall > cluster.sql` — Whole cluster: roles + every database.
- `pg_basebackup -D /backup -F t -z -X stream` — Physical base backup for PITR.
- `archive_command = 'cp %p /wal/%f'` — Ship WAL segments for continuous recovery.
- `pg_basebackup -D /incr --incremental=/full/backup_manifest` — Incremental base backup (PG 17+) — only changed blocks.
- `pg_combinebackup -o /restore /full /incr` — Reconstruct a full backup from an incremental chain.

1. **Base backup** — `pg_basebackup` copies the cluster while `wal_level` keeps WAL flowing.
1. **Archive WAL** — `archive_command` files every segment away as changes happen.
1. **Restore base** — Recover the base backup into a fresh `$PGDATA`.
1. **Replay to a point** — `recovery_target_time` in `postgresql.conf` replays WAL up to the crash.

### pg_dump flags

```
-Fc           custom format
--schema=s    one schema only
-t users      one table only
--no-owner    omit ownership
--no-acl      omit privileges
-j 4          parallel workers
```

### pg_restore flags

```
-l            list contents
--clean       drop before create
--no-owner    skip ownership
-j 4          parallel restore
-C            create DB first
--data-only / --schema-only
```

> **⚠:** **A backup you haven't restored isn't a backup.** Run a test restore on a schedule — `pg_restore -l` lists a dump's contents, and `pg_dump` against a live, changing DB can miss nothing only if it completes cleanly.

## Replication {#replication}

Streaming replication ships the write-ahead log to standbys; logical replication replays individual changes between databases.

**Primary** (accepts writes) → **WAL stream** (binary change log) → **Standby** (replays WAL) → **Read scaling** (hot_standby = on)

### Primary config

```
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
# standby sync level
synchronous_commit = on
```

### Standby config

```
hot_standby = on
primary_conninfo = 'host=pg1
  port=5432 user=repl
  password=s3cret'
# created via pg_basebackup -R
```

- **on** — Wait for standby to acknowledge the WAL before committing.
- **remote_apply** — Standby also applies the change — strongest consistency.
- **local** — Only the local flush is confirmed; standbys lag.
- **off** — Async: no wait, possible data loss on failover.
- `CREATE PUBLICATION pub FOR TABLE users;` — Publish changes (logical).
- `CREATE SUBSCRIPTION sub CONNECTION 'host=pg1 dbname=appdb' PUBLICATION pub;` — Subscribe to them.
- `SELECT pg_is_in_recovery();` — Am I a standby? true = read-only replica.
- `SELECT client_addr, state FROM pg_stat_replication;` — Who is replicating from me.

<details>
<summary>Logical replication, step by step</summary>

1. **Publisher** — On the source: `wal_level = logical` and `CREATE PUBLICATION pub FOR ALL TABLES;`
1. **Subscriber** — On the target: `CREATE SUBSCRIPTION sub CONNECTION 'host=pg1' PUBLICATION pub;`
1. **Stream changes** — Rows replicate as they commit; the initial copy happens first.
1. **Filter & transform** — Unlike streaming, logical replication can target single tables or apply row filters.

</details>

## Tuning & config {#tuning}

Most settings live in `postgresql.conf` (or `ALTER SYSTEM`). Start with the memory knobs, then let autovacuum breathe.

| Parameter | Default | Rule of thumb |
| --- | --- | --- |
| `shared_buffers` | 128MB | 25% of RAM for a dedicated DB server. |
| `work_mem` | 4MB | Per sort/hash — raise for big queries, but it multiplies by connections. |
| `effective_cache_size` | 4GB | Total RAM the OS + Postgres can cache; the planner trusts it. |
| `max_connections` | 100 | Don't oversize — each slot costs memory. Use a pooler. |
| `maintenance_work_mem` | 64MB | Bigger speeds `VACUUM`, `REINDEX`, `CREATE INDEX`. |
| `autovacuum` | on | Leave on; lower `autovacuum_vacuum_scale_factor` to ~0.01. |
| `wal_level` | replica | `replica` for replication; `minimal` only for bulk loads. |

> **⌁:** Apply live without a restart: `ALTER SYSTEM SET work_mem = '16MB';` then `SELECT pg_reload_conf();`. `SHOW work_mem;` confirms the value your session actually sees.

<details>
<summary>More config worth knowing</summary>

`checkpoint_timeout` `random_page_cost` `idle_in_transaction_session_timeout` `statement_timeout` `lock_timeout` `jit` `track_io_timing` `synchronous_commit` `io_method`

- `statement_timeout = '30s'` — Cancel queries that run too long.
- `lock_timeout = '5s'` — Fail rather than wait on a lock forever.
- `random_page_cost = 1.1` — On SSD storage, bias the planner toward index scans.
- `checkpoint_timeout = '15min'` — Spread checkpoints to smooth I/O.
- `io_method = 'worker'` — PG 18 async I/O — `worker` or `io_uring`; up to 3× read throughput.

</details>

## Monitoring {#monitoring}

The `pg_stat_*` views are the dashboard. Query them before you reach for an external tool.

- `SELECT * FROM pg_stat_activity;` — Every connection and its current query.
- `SELECT pid, now()-xact_start AS t, query FROM pg_stat_activity WHERE state = 'idle in transaction';` — Transactions holding locks open.
- `SELECT * FROM pg_stat_database;` — Per-DB commits, rollbacks, blk reads, deadlocks.
- `SELECT * FROM pg_locks WHERE NOT granted;` — Locks currently waiting.
- `SELECT pid, wait_event_type, wait_event FROM pg_stat_activity WHERE wait_event IS NOT NULL;` — Who's blocked and on what.
- `EXPLAIN (ANALYZE, BUFFERS) SELECT …;` — Real plan, timing, and I/O.
- `SELECT relname, n_dead_tup FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;` — Dead tuples → upcoming bloat.

### Slow query log

```
log_min_duration_statement = 250
# log statements > 250ms
log_statement = 'mod'
# log DDL + writes
```

### Blocked query killer

```
SELECT pg_cancel_backend(pid);
# interrupt one backend
SELECT pg_terminate_backend(pid);
# hard-kill it
```

<details>
<summary>More monitoring queries</summary>

- `SELECT * FROM pg_stat_user_tables ORDER BY seq_scan DESC;` — Tables missing indexes (heavy sequential scans).
- `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;` — Indexes that are never used.
- `SELECT datname, numbackends, xact_commit, deadlocks FROM pg_stat_database;` — Load and contention per DB.
- `SELECT now() - pg_last_xact_replay_timestamp() AS lag;` — Replication lag on a standby.
- `SELECT * FROM pg_statio_user_tables;` — Cache hit ratio per table.

</details>

## Maintenance {#maintenance}

Postgres marks deleted rows dead and reaps them later. `VACUUM` keeps tables and indexes healthy so queries stay fast.

- `VACUUM (ANALYZE) users;` — Reclaim dead tuples and refresh planner stats.
- `VACUUM FULL users;` — Rewrite the table to shrink it — locks, use rarely.
- `ANALYZE users;` — Refresh statistics so plans stay good.
- `REINDEX INDEX idx_users_email;` — Rebuild a bloated index.
- `SELECT relname, n_live_tup, n_dead_tup, round(100.0*n_dead_tup/NULLIF(n_live_tup,0),1) AS bloat FROM pg_stat_user_tables;` — Spot tables needing VACUUM.

### Partitioning

```
CREATE TABLE events (
  id bigint, ts timestamptz
) PARTITION BY RANGE (ts);

CREATE TABLE events_2025
  PARTITION OF events
  FOR VALUES FROM
  ('2025-01-01') TO ('2026-01-01');
```

### Table maintenance

```
CREATE INDEX CONCURRENTLY
  idx_users_email
  ON users (email);
# no full lock

ALTER TABLE users
  SET (autovacuum_vacuum_scale_factor
       = 0.01);
```

<details>
<summary>What's new in PostgreSQL 17 & 18</summary>

- `io_method = 'worker'` — PG 18 async I/O (`worker`/`io_uring`) — up to 3× read throughput.
- `uuidv7()` — PG 18 — timestamp-ordered UUIDs for better index locality.
- `GENERATED ALWAYS AS (…) VIRTUAL` — PG 18 — generated columns computed at read, not stored.
- `RETURNING old.*, new.*` — PG 18 — reference OLD and NEW row values in DML RETURNING.
- `auth method = oauth` — PG 18 — SSO via OAuth 2.0; `md5` password auth is deprecated, use SCRAM.
- `initdb … (checksums on by default)` — PG 18 — page checksums enabled for new clusters.
- `pg_basebackup --incremental` — PG 17 — incremental backups, merged with `pg_combinebackup`.
- `pg_upgrade (keeps planner stats)` — PG 18 — statistics survive major upgrades; no post-upgrade `ANALYZE` stall.

</details>

## Pitfalls {#gotchas}

Seven ways a healthy-looking Postgres quietly degrades in production.

### Connection exhaustion

Each connection is a backend process with its own `work_mem`. A pool of 1000 connections can eat RAM fast.

```
SELECT count(*) FROM pg_stat_activity;
# put PgBouncer in front
```

### Idle-in-transaction

A connection that opened a transaction and walked away holds locks and blocks `VACUUM`.

```
SET idle_in_transaction_session_timeout
  = '5min';
```

### Bloat

Dead tuples accumulate until autovacuum or a manual `VACUUM` cleans up. Tables and indexes swell, queries slow.

```
VACUUM (ANALYZE) big_table;
```

### Wrong index choice

A single-column index doesn't serve a two-column `WHERE a AND b`. Unused indexes cost every write.

```
SELECT * FROM pg_stat_user_indexes
  WHERE idx_scan = 0;
```

### Transaction ID wraparound

Every row carries an `xmin`. If a database's oldest unfrozen XID falls roughly 2 billion behind, Postgres halts writes rather than risk data loss.

```
SELECT age(datfrozenxid)
  FROM pg_database;
# keep age < 200M
```

### Stale replication slot

A slot no standby consumes pins WAL on the primary until the disk fills and writes stop.

```
SELECT slot_name, active
  FROM pg_replication_slots;
# idle_replication_slot_timeout
# drops idle slots (PG 18)
```

> **⚠:** **Missing backups is the one that ends the company.** A replica is not a backup — a dropped table or `DELETE` replays onto the standby too. Keep logical dumps *and* WAL archives, and test the restore.
