---
title: "PromQL"
description: "Selectors, rates, aggregation, and functions for Prometheus."
category: "Cloud, DevOps & observability"
tags: ["observability", "rate", "sum by", "histogram"]
weight: 210
lead: "Query metrics like a pro."
version: "Prometheus 3.x"
---
PromQL is Prometheus' query language: pick a time series by name and labels, transform it with functions, and aggregate across the whole fleet. Here's every query you'll actually write.

## Quick reference {#quickref}

The ten queries you'll reach for every day. Each links to the full section below.

- `rate(metric[5m])` — Per-second rate of a counter, reset-aware. [Rates →](#rates)
- `irate(metric[5m])` — Per-second rate from the last two samples — for alerting. [Rates →](#rates)
- `increase(metric[1h])` — Total counter increase over the window. [Rates →](#rates)
- `sum by (label) (metric)` — Aggregate, keeping the listed labels only. [Aggregation →](#aggregation)
- `histogram_quantile(0.99, rate(bucket[5m]))` — Percentile latency from histogram buckets. [Functions →](#functions)
- `topk(5, metric)` — Largest 5 series by value; `bottomk` for smallest. [Aggregation →](#aggregation)
- `metric{job="api", status=~"5.."}` — Label selectors & matchers. [Selectors →](#selectors)
- `sort(metric) / sort_desc(metric)` — Order series by value. [Functions →](#functions)
- `rate(metric[5m]) / rate(metric[5m] offset 1h)` — Compare now vs an hour ago. [Functions →](#functions)
- `up == 0` — Targets that are down. [Operators →](#operators)

## Metric model {#start}

Every metric is a name plus a set of labels. A time series is that combination sampled over time.

**Metric name** (http_requests_total) → **Labels** ({job="api", status="200"}) → **Time series** (name + label set) → **Sample** (value @ timestamp) → **Vector** (instant vs range)

### 1. Name

All series with that metric name.

```
http_requests_total
```

### 2. Filter

Narrow to a label set.

```
http_requests_total{job="api"}
```

### 3. Window

Turn it into a range vector.

```
http_requests_total[5m]
```

### 4. Rate

Compute per-second change.

```
rate(http_requests_total[5m])
```

### A sample

The atomic unit: a `float64` value plus a millisecond timestamp.

```
http_requests_total{job="api"} 10421 1700000000000
```

### Instant vector

One sample per series at a single point in time — what most expressions return.

```
http_requests_total
{job="api"}
```

### Range vector

Many samples per series across a window — what `rate()` and friends consume.

```
http_requests_total[5m]
node_cpu_seconds_total[1h]
```

> **KEY:** **Labels define identity.** Every unique label set — `http_requests_total{job="api", status="200"}` — is its own time series. Adding a label multiplies the number of series, so keep cardinality low.

## Selectors & matchers {#selectors}

Select a subset of series by matching on label values. The metric name is itself a label.

| Matcher | Meaning | Example |
| --- | --- | --- |
| `=` | label equals string | `up{job="api"}` |
| `!=` | label does not equal | `up{job!="api"}` |
| `=~` | label matches regex (anchored) | `up{job=~"api\|web"}` |
| `!~` | label does not match regex | `up{job!~"test.*"}` |
| `__name__` | internal label holding the metric name | `{__name__=~"http_.*"}` |

### Metric name is a selector

The name is just a label. `http_requests_total` is shorthand for `{__name__="http_requests_total"}`.

```
http_requests_total
{__name__="http_requests_total"}
```

### Regex is fully anchored

`=~` matches the whole value, so `job=~"api"` matches only `api` — not `apiserver`. Add `.*` to widen.

```
up{job=~"api.*"}
up{env!~"dev|staging"}
```

<details>
<summary>Label matching recipes</summary>

#### Prefix / suffix

```
up{job=~"api.*"}
up{job=~".*prod"}
```

#### Exclude environments

```
up{env!~"dev|staging|test"}
```

#### All metrics matching a pattern

```
{__name__=~"http_.*_total"}
```

#### Everything but one label

```
up{job!=""}
```

</details>

> **KEY:** **Commas AND, braces OR.** Multiple matchers inside one `{…}` must all hold; separate selectors separated by commas are independent series.

## Rates & counters {#rates}

Counters only ever go up (until a reset), so query their rate of change — never their raw value.

### 1. rate()

Per-second average over the window. Extrapolates the edges and handles counter resets. Best for dashboards.

```
rate(http_requests_total[5m])
```

### 2. irate()

Per-second rate from the last two samples only. Reacts faster but is noisier. Best for alerting.

```
irate(http_requests_total[5m])
```

### 3. increase()

Total increase over the window, reset-aware. Use when you want a count, not a rate.

```
increase(http_requests_total[1h])
```

### 4. delta()

Difference over the window for gauges. Does *not* handle counter resets.

```
delta(node_memory_available_bytes[1h])
```

<details>
<summary>rate() vs irate()</summary>

`rate()` averages over the full window for a smooth, stable line. `irate()` uses only the last two samples, so it catches spikes faster but is jittery — prefer it in alerting expressions.

```
rate(http_requests_total[5m])   # dashboards
irate(http_requests_total[5m])  # alerts
```

</details>

> **KEY:** **Rate first, then sum.** Apply `rate()` to each counter series *before* aggregating: `sum(rate(http_requests_total[5m]))`. Summing raw counters first hides resets and double-counts when series churn.

## Aggregation {#aggregation}

Aggregation operators collapse many series into fewer by grouping on a chosen label set.

| Operator | Purpose | Example |
| --- | --- | --- |
| `sum` | Add values together | `sum by (job) (rate(x[5m]))` |
| `avg` | Arithmetic mean | `avg(node_load1)` |
| `min` / `max` | Extremes across series | `max(node_filesystem_avail_bytes)` |
| `count` | Number of series | `count(up == 0)` |
| `count_values` | Frequency per value | `count_values("version", build_info)` |
| `stddev` / `stdvar` | Spread of values | `stddev(node_load1)` |
| `topk` / `bottomk` | Largest / smallest k series | `topk(5, rate(x[5m]))` |
| `quantile` | φ-quantile across series | `quantile(0.9, node_load1)` |
| `group` | Drop labels, keep 1 per group | `group by (job) (up)` |

### by vs without

`by (…)` keeps only the listed labels; `without (…)` drops the listed labels and keeps everything else.

```
sum by (job, status) (rate(x[5m]))
sum without (instance) (rate(x[5m]))
```

### topk & bottomk

`topk(k, v)` returns the k series with the largest values in `v`; `bottomk` the smallest.

```
topk(3, rate(x[5m]))
bottomk(3, node_load1)
```

> **⚠:** **Aggregation `quantile` is across series,** not a histogram percentile. For latency percentiles use `histogram_quantile()` with bucket series.

<details>
<summary>count_values & group</summary>

`count_values(label, v)` counts how many series share each value and stores the count in a new label. `group` collapses every group to a single series with value 1 — handy for checking which label sets exist.

```
count_values("version", build_info)
count by (app) (up)     # instances per app
group by (job) (up)     # one series per job
```

</details>

## Functions {#functions}

The workhorses beyond rate and aggregation — histograms, sorting, prediction, and label surgery.

- `histogram_quantile(0.99, rate(bucket[5m]))` — 99th-percentile latency from histogram buckets.
- `sort(v) / sort_desc(v)` — Sort series by value ascending / descending.
- `predict_linear(v[1h], 4*3600)` — Linear forecast 4h ahead (disk-full alerts).
- `absent(v)` — 1 if v has no series, empty otherwise.
- `absent_over_time(v[5m])` — 1 if v had no samples in the window.
- `time()` — Current Unix timestamp in seconds.
- `v offset 1h` — Shift the query one hour into the past.
- `label_replace(v, "dst", "$1", "src", "(.*)")` — Rewrite a label using a regex capture.
- `clamp(v, 0, 100)` — Clamp every value into [0, 100].
- `sort_by_label(v, "label")` — Sort series by a label's value.
- `last_over_time(v[5m])` — Last sample in the window — the right way to read a gauge's current value.
- `info(v, {__name__="build_info"})` — Experimental (3.x): enrich series with labels from `target_info`/`build_info` — needs `--enable-feature=promql-experimental-functions`.

### Histogram quantiles

Always pass the bucket series through `rate()` first and keep the `le` label intact.

```
histogram_quantile(0.99,
  rate(http_request_duration_seconds_bucket[5m]))
```

### offset for comparisons

`offset` shifts a query back in time so you can compare now against then.

```
(rate(x[5m]) - rate(x[5m] offset 1h))
  / rate(x[5m] offset 1h)
```

`histogram` `sorting` `prediction` `absence` `labels` `time` `metadata` `experimental`

<details>
<summary>label_replace in depth</summary>

#### Syntax

```
label_replace(v, dst, replacement, src, regex)
```

For each series where `src` matches `regex`, set label `dst` to `replacement` (with `$1` capture groups).

#### Strip a port suffix

```
label_replace(up, "instance", "$1",
  "instance", "(.*):9100")
```

Rewrites `instance="10.0.0.5:9100"` to `instance="10.0.0.5"`.

</details>

<details>
<summary>absent vs absent_over_time</summary>

#### absent

```
absent(nonexistent_metric)
```

Returns `1` if the metric has no series at all right now — useful for "is anything emitting this?" checks.

#### absent_over_time

```
absent_over_time(up[5m])
```

Returns `1` if the series had no samples in the window, catching scrape gaps and stale targets.

</details>

## Operators & vector matching {#operators}

Arithmetic and comparison work element-wise across series; set operators combine whole vectors.

| Operator | Kind | Example |
| --- | --- | --- |
| `+ - * / % ^` | Arithmetic | `node_memory_used / node_memory_total` |
| `== != > < >= <=` | Comparison | `up == 0` |
| `and` | Set intersection | `up == 1 and rate(x[5m]) > 10` |
| `or` | Set union | `up or vector(0)` |
| `unless` | Set difference | `up unless up == 1` |

### on / ignoring

Control which labels must match when joining two vectors. `on` lists labels to join on; `ignoring` lists labels to ignore.

```
a / on (instance) b
a / ignoring (job) b
```

### group_left / group_right

Many-to-one joins. `group_left` keeps the extra labels on the left-hand side.

```
rate(http_errors_total[5m])
  / ignoring (code) group_left
    rate(http_requests_total[5m])
```

> **KEY:** **No matching labels → empty result.** Two vectors only pair up on series with identical label sets (modulo `on`/`ignoring`). If nothing matches, you get no output — silently, not an error.

<details>
<summary>and / or / unless semantics</summary>

`and` keeps left series only where the right side also has a matching series; `or` keeps the left and fills gaps with the right; `unless` keeps left series that have no match on the right. Operands are treated as booleans (non-zero is true) and the result keeps the left side's values.

```
up == 1 and rate(http_requests_total[5m]) > 0  # up AND receiving traffic
rate(node_errors_total[5m]) or vector(0)          # never empty
up unless up{job="ignored"}                       # drop one job
```

</details>

<details>
<summary>Comparison with bool</summary>

Normally a comparison keeps only the series where it holds, dropping the rest. Add `bool` to keep every series and return `0` or `1` instead.

```
up == 1            # only the up series
up == bool 1       # every series as 0/1
rate(x[5m]) > bool 0.5
```

</details>

## Recording rules & alerts {#recording}

Recording rules precompute expressions into new metrics; alerting rules evaluate a condition and fire.

### Recording rule

Store an expensive expression under a new metric name, updated every evaluation interval.

```
- record: job:http_requests:rate5m
  expr: sum by (job) (rate(http_requests_total[5m]))
```

### Alerting rule

Fires after `expr` holds true continuously for the `for` duration.

```
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: page
  annotations:
    summary: "errors on {{ $labels.job }}"
```

1. **Evaluate expr** — The server evaluates each rule's `expr` on the rule group's `interval` (default `evaluation_interval`).
1. **Hold for** — An alerting rule must stay true for the whole `for` duration before it transitions to `pending`.
1. **Fire** — The alert enters `firing` state and is sent to Alertmanager.
1. **Route & notify** — Alertmanager deduplicates, groups, routes, and sends notifications.
> **KEY:** **Name recording rules `level:metric:operation`** — e.g. `job:http_requests:rate5m`. Rules are evaluated by the server (default `evaluation_interval` = 1m), so don't record a raw metric you can already query directly.

<details>
<summary>Complete rules.yml</summary>

```
groups:
  - name: http.rules
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
      - alert: HighErrorRate
        expr: sum by (job) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (job) (rate(http_requests_total[5m])) > 0.1
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "{{ $labels.job }} error rate above 10%"
```

</details>

## Pitfalls {#gotchas}

Small behaviors that silently change what a query returns.

### Counter resets

A counter resets to 0 on restart. `rate()`, `irate()`, and `increase()` detect and handle resets; `delta()` does not.

```
rate(restarts_total[5m])  # safe
delta(restarts_total[5m]) # wrong
```

### Window ≥ 2× scrape

Use a range at least twice the scrape interval so `rate()` has ≥2 samples. Too short a window extrapolates wildly.

```
# scrape_interval: 15s → window ≥ 30s
rate(http_requests_total[1m])
```

### Label cardinality

Every unique label set is a separate time series. Never put user IDs, request paths, or other unbounded values in labels — use a histogram or log instead.

```
http_requests_total{path="/users/123"}  # bad
http_requests_total{route="/users/:id"}  # good
```

### Staleness

A series that stops scraping goes stale after ~5m and its last sample is ignored by queries, so graphs drop to empty instead of flat-lining.

```
up == 0    # target is down
absent(up) # target vanished entirely
```

### Many-to-many matching

Joining two vectors with different label sets raises `many-to-many matching not allowed`. Pin the join with `on()`/`ignoring()` plus `group_left()`/`group_right()`.

```
a * on (job) group_left b   # ok
a * b                       # error
```

### Aggregation drops the name

`sum()`, `avg()`, and the rest strip the `__name__` label, so the result is nameless. Record the expression or aggregate `without(__name__)` when you need a stable name.

```
sum by (job) (rate(x[5m]))  # no metric name
job:http_requests:rate5m    # recorded name
```

> **⚠:** **Sum after rate, never before.** `sum(rate(http_requests_total[5m]))` is correct. `rate(sum(http_requests_total)[5m])` merges reset boundaries and yields a meaningless rate.
