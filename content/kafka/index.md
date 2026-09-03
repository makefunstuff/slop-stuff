---
title: "Kafka"
description: "Topics, partitions, producers, consumers, offsets, and operations."
category: "Data & databases"
tags: ["streaming", "topic", "partition", "consumer group"]
weight: 240
lead: "A distributed log."
version: "brokers"
---
Apache Kafka is a distributed, append-only commit log. Producers append records to topics; consumers read them back in order, at their own pace — the shared buffer that decouples your services.

## Quick reference {#quickref}

The daily surface on one screen — create, produce, consume, and watch lag. Every command takes `--bootstrap-server localhost:9092`; each is expanded below.

- `kafka-topics --list` — Every topic on the cluster.
- `kafka-topics --create --topic orders --partitions 6 --replication-factor 3` — Create a topic — 6 partitions, 3 replicas.
- `kafka-topics --describe --topic orders` — Leader, replicas, and ISR for each partition.
- `kafka-console-producer --topic orders` — Type records on stdin, one per line.
- `kafka-console-consumer --topic orders --from-beginning` — Replay every record from offset 0.
- `kafka-console-consumer --topic orders --group billing` — Consume as a group — committed offsets persist.
- `kafka-consumer-groups --list` — All consumer groups.
- `kafka-consumer-groups --describe --group billing` — Current offset, log-end offset, and LAG.
- `kafka-consumer-groups --group billing --reset-offsets --to-earliest --execute --topic orders` — Rewind a group to the oldest offset.
- `kafka-topics --alter --topic orders --partitions 12` — Grow partitions — they can only increase.

## The model {#start}

Kafka is a distributed commit log. Producers append records to topics; each topic is split into partitions, and each partition is replicated across brokers for durability.

**producer** (writes records) → **topic** (orders · 3 partitions) → **partition** (append-only log) → **replica** (broker ×3) → **consumer** (reads offsets)

### 1. Topic

A named stream of records — like a table or a queue, but append-only.

```
kafka-topics --create \
  --topic orders \
  --partitions 3
```

### 2. Partition

An ordered, immutable sequence of records. Each record gets a sequential `offset`.

```
offset:  0  1  2  3  4
          [A][B][C][D][E] …
```

### 3. Broker

A server that stores partitions, serves reads/writes, and replicates data.

```
broker-1: p0 leader
broker-2: p0 follower
broker-3: p0 follower
```

### 4. Replication

Each partition is copied to `replication.factor` brokers: one leader, the rest followers.

```
replication.factor=3
min.insync.replicas=2
```

> **LOG:** **Append-only.** Records are never edited or deleted in place. The `offset` — a record's position in its partition — is how consumers track what they've read. Retention removes whole segments later, never individual records.

> **KR:** **KRaft, not ZooKeeper.** Apache Kafka 4.0 (2025) made KRaft the only metadata mode — ZooKeeper was deprecated in 3.5 and removed in 4.0. Cluster metadata now lives in an internal `__cluster_metadata` topic managed by a quorum of controller nodes, so there is no separate ZK ensemble to run. Every command here uses `--bootstrap-server`; the legacy `--zookeeper` flags are gone.

## Topics & partitions {#topics}

Create, inspect, and delete topics. Partitions are the unit of parallelism — set them up front because they can only grow.

### Create

```
kafka-topics --bootstrap-server localhost:9092 \
  --create --topic orders \
  --partitions 6 \
  --replication-factor 3
```

### Describe & list

```
kafka-topics --bootstrap-server localhost:9092 \
  --describe --topic orders

kafka-topics --bootstrap-server localhost:9092 --list
```

### Delete

```
kafka-topics --bootstrap-server localhost:9092 \
  --delete --topic orders
```

### Add partitions

```
kafka-topics --bootstrap-server localhost:9092 \
  --alter --topic orders \
  --partitions 12
```

Partitions can only be increased — never removed.

| Setting | Meaning | Default |
| --- | --- | --- |
| `replication.factor` | Copies of each partition across brokers | 1 |
| `partitions` | Number of partitions (parallelism) | 1 |
| `retention.ms` | How long records are kept | 604800000 (7 days) |
| `segment.bytes` | Size at which a log segment rolls | 1073741824 (1 GB) |
| `cleanup.policy` | `delete` (by age) or `compact` (keep latest per key) | delete |
| `min.insync.replicas` | Replicas that must ACK before a write is accepted | 1 |

> **!:** **Partitions are permanent.** You can raise the count but never lower it without recreating the topic. Ordering is only guaranteed *within* a partition, so choose partition count — and your keying strategy — with ordering in mind.

## Producers {#producers}

Producers append records to a topic. The record's key picks its partition; `acks` decides how durable that write is.

### Produce (console)

```
echo '{"id":1,"sku":"A1"}' \
  | kafka-console-producer \
    --bootstrap-server localhost:9092 \
    --topic orders
```

### Keys pick the partition

Kafka hashes the key and maps it to a partition: `partition = hash(key) % num_partitions`. Same key ⇒ same partition ⇒ ordered.

```
echo 'alice:{"qty":2}' \
  | kafka-console-producer \
    --property parse.key=true \
    --property key.separator=: \
    --topic orders
```

### Producer API (Java)

```
props.put("acks", "all");
props.put("key.serializer",
  StringSerializer.class);
props.put("value.serializer",
  StringSerializer.class);
new KafkaProducer<>(props);
```

| `acks` | Guarantee | Risk / cost |
| --- | --- | --- |
| `0` | No ack — fire and forget | Fastest; records can be lost |
| `1` | Leader acks the write | Lost if leader fails before replication |
| `all` | All in-sync replicas ack | Durable; requires `min.insync.replicas` |

### Batching

Producers buffer records and send them in batches for throughput.

```
linger.ms=5
batch.size=16384
compression.type=lz4
```

### Idempotence

Retries can duplicate records. Idempotent producers dedupe by producer id + sequence number.

```
enable.idempotence=true
acks=all
max.in.flight.requests=5
```

### Serialization

The producer converts keys/values to bytes. Pick a serializer and keep a schema registry.

```
key.serializer
value.serializer
# Avro → Schema Registry
# JSON → Jackson / JSON
```

## Consumers & groups {#consumers}

Consumers read partitions and commit offsets. In a group, each partition is assigned to exactly one member — that's how you scale out.

### Consumer groups

Every partition is read by exactly one consumer in a group. Add consumers to scale; more consumers than partitions means some idle.

```
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders --group billing
```

### Offsets & commit

The offset is each consumer's position in a partition. Committed offsets are stored in the `__consumer_offsets` topic.

```
enable.auto.commit=false
consumer.commitSync();   // manual
consumer.commitAsync();  // fire & forget
```

1. **Subscribe** — `consumer.subscribe(List.of("orders"))` — join the group and get assigned partitions.
1. **Poll** — `consumer.poll(Duration.ofMillis(500))` — fetch a batch of records from the broker.
1. **Process** — Handle each record idempotently — after a rebalance or retry your code may run more than once.
1. **Commit** — `consumer.commitSync()` — persist the offset *after* processing to get at-least-once delivery.
- **At-most-once** — Commit before processing. Fast, but a crash loses unprocessed records.
- **At-least-once** — Process then commit. The safe default — expect duplicates, stay idempotent.
- **Exactly-once** — Idempotent producer + transactions + idempotent consumers. Powerful, complex.
- **Rebalance** — Partitions reassign when a consumer joins or leaves. `max.poll.interval.ms` guards slow processing.
> **GROUP:** **One consumer per partition.** Partitions are the unit of parallelism: 12 partitions ⇒ at most 12 active consumers in a group. Give every new topic enough partitions to feed its busiest group.

## CLI operations {#cli}

The four tools you'll run daily. Add `--bootstrap-server localhost:9092` to every command.

- `kafka-topics --list` — All topics on the cluster.
- `kafka-topics --describe --topic orders` — Partition, leader, replicas, and ISR per partition.
- `kafka-topics --create --topic orders --partitions 6 --replication-factor 3` — Create a topic.
- `kafka-console-producer --topic orders` — Type records on stdin, one per line.
- `kafka-console-consumer --topic orders --from-beginning` — Read all records from the start.
- `kafka-console-consumer --topic orders --group billing` — Read as a group (persists committed offsets).
- `kafka-consumer-groups --list` — All consumer groups.
- `kafka-consumer-groups --describe --group billing` — Per-partition offset, log-end offset, and LAG.
- `kafka-consumer-groups --group billing --reset-offsets --to-earliest --execute --topic orders` — Rewind a group to the oldest offset.
- `kafka-consumer-groups --group billing --reset-offsets --to-latest --execute --topic orders` — Skip ahead to the newest offset.

<details>
<summary>More: reset offsets & peek</summary>

#### Reset to a timestamp

```
kafka-consumer-groups \
  --group billing \
  --reset-offsets \
  --to-datetime 2024-01-01T00:00:00.000 \
  --topic orders --execute
```

#### Peek with a throwaway group

```
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --group debug-$(date +%s) \
  --max-messages 10
```

</details>

## Key configs {#config}

These few settings determine durability, throughput, and retention. Set them at the broker or topic level.

| Config | What it controls | Where | Typical |
| --- | --- | --- | --- |
| `replication.factor` | Copies of each partition | topic | 3 |
| `min.insync.replicas` | Minimum replicas that must ACK a write | topic / broker | 2 |
| `acks` | Producer acknowledgment level | producer | all |
| `retention.ms` | How long records are kept | topic / broker | 604800000 |
| `segment.bytes` | Log segment roll size | topic / broker | 1073741824 |
| `num.partitions` | Default partitions for auto-created topics | broker | 3 |
| `auto.offset.reset` | Where to start when no committed offset exists | consumer | earliest / latest |
| `enable.auto.commit` | Whether offsets commit automatically | consumer | false |

> **CFG:** **Durability rule of thumb:** `replication.factor=3` + `min.insync.replicas=2` + `acks=all` survives one broker loss without dropping acknowledged writes. The cluster tolerates at most `replication.factor - min.insync.replicas` failures.

## Operations {#ops}

Day-two work: move partitions, watch consumer lag, keep the ISR healthy, and handle leader failure.

### Reassign partitions

Rebalance partition placement across brokers with a JSON plan.

```
kafka-reassign-partitions \
  --bootstrap-server localhost:9092 \
  --reassignment-json-file plan.json \
  --execute

kafka-reassign-partitions \
  --bootstrap-server localhost:9092 \
  --verify
```

### Monitor consumer lag

Lag is how far a group is behind the end of each partition. Growing lag means consumers can't keep up.

```
kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group billing
# watch the LAG column
```

### ISR health

The in-sync replica set is the followers that are caught up. A follower that falls behind drops out of the ISR.

```
kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe --topic orders
# ISR column: 0,1,2 vs 0,1
```

### Leader failure

When a partition leader dies, the controller picks a new leader from the ISR — automatically, in seconds.

```
# leader broker 1 dies:
Partition: 0  Leader: 1 → 2
# controller promotes an
# in-sync follower
```

1. **Check topic health** — `kafka-topics --describe --topic orders` — look at the Leader and ISR columns for every partition.
1. **Check the ISR** — If the ISR shrank below `min.insync.replicas`, producers with `acks=all` start failing — find and fix the lagging broker.
1. **Check consumer lag** — `kafka-consumer-groups --describe` — rising LAG means slow consumers or a hot partition.
1. **Reset or scale** — Reset offsets to skip poison records, or scale the consumer group up toward the partition count.
> **!:** **Never take the last replica offline.** If you lose every in-sync replica of a partition, acknowledged data can be unrecoverable. Keep `unclean.leader.election.enable=false` (the default) to refuse an out-of-sync leader and surface the problem instead of losing data.

## Pitfalls {#gotchas}

The failure modes that surprise teams in production — and how to avoid them.

### Hot partitions (key skew)

If one key dominates — say every event keyed by `"all"` — that partition gets all the traffic while others idle. Ordering is per-key; throughput is per-partition.

```
# bad: every record keyed by "all"
# good: key by user_id or shard id
```

### Offset reset surprises

`auto.offset.reset=latest` silently skips everything produced before a new consumer starts; `earliest` replays the whole history.

```
auto.offset.reset=earliest
# → reads from offset 0
auto.offset.reset=latest
# → reads only new records
```

### Rebalance storms

Slow processing trips `max.poll.interval.ms`, the consumer is kicked out, and partitions shuffle — over and over. Tune the poll loop, not just the interval.

```
max.poll.interval.ms=300000
max.poll.records=500
```

### Retention vs slow consumers

A consumer paused longer than `retention.ms` comes back to missing offsets — the broker already deleted them.

```
# LAG outgrew the retention window
# → OffsetOutOfRangeException
# fix: longer retention, or
# consume faster / catch up
```

### Leader loss

A partition is briefly unavailable while the controller elects a new leader. With `acks=all` and a healthy ISR, no acknowledged data is lost.

```
replication.factor=3
min.insync.replicas=2
acks=all
```

### Partitions are forever

You can add partitions but not remove them. Re-keying or re-partitioning a live topic means migrating to a new one.

```
# plan partition count up front:
partitions ≈ peak consumers
```

### ZooKeeper is gone (KRaft)

Kafka 4.0 removed ZooKeeper entirely. Brokers carrying the old `zookeeper.connect` won't start, and the `--zookeeper` CLI flags were dropped — migrate to KRaft before upgrading.

```
# 4.0: no zookeeper.connect
process.roles=broker,controller
controller.quorum.voters=1@h1:9093
```

### Log compaction ≠ delete

`cleanup.policy=compact` keeps the latest record per key, not a time window. Every message needs a key, and deleting a key writes a tombstone (`null` value) held for `delete.retention.ms`.

```
cleanup.policy=compact
delete.retention.ms=86400000
# null value = tombstone
```

> **!:** **Watch the ISR before the disk.** Most "Kafka is down" incidents are really `min.insync.replicas` not being met because a follower fell out of the ISR — check `kafka-topics --describe` before restarting brokers.
