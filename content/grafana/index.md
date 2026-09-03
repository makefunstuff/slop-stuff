---
title: "Grafana"
description: "Panels, variables, transforms, alerts, and provisioning as code."
category: "Cloud, DevOps & observability"
tags: ["observability", "panels", "alerts", "provisioning"]
weight: 180
lead: "Visualize everything."
version: "dashboards"
---
Grafana turns metrics, logs, and traces into dashboards you can read at a glance — then alerts on them. Query any data source, shape the result, and ship it.

## Cheat sheet {#quickref}

The commands and values you reach for most. Everything else on this page expands on these.

| Task | Where / how | Key syntax |
| --- | --- | --- |
| **Run Grafana** | Docker, one container | `docker run -d -p 3000:3000 grafana/grafana` |
| **Add a data source** | Connections → Data sources | `prometheus` · `loki` · `postgres` · `tempo` |
| **Add a panel** | Dashboard → Add → Visualization | `Explore → Add to dashboard` |
| **Template variable** | Dashboard → Settings → Variables | `$var` · `${var:regex}` · `${var:raw}` |
| **Reshape a result** | Panel → Transform tab | `Reduce`, `Filter by name`, `Join by field` |
| **Alert** | Alerting → Alert rules | `Reduce + threshold`, route by `label` |
| **Provision as code** | YAML + env vars | `datasources:` · `GF_SECURITY_ADMIN_USER` |
| **Time-aware PromQL** | Built-in macros | `$__rate_interval` · `$__interval` · `$__timeFilter()` |

> **v12:** **Current: Grafana 12.** As of late 2025 the current major is Grafana 12 (11.6 was the last 11.x). New in 11/12: **Explore Metrics** & **Explore Logs** (query without PromQL/LogQL), Scenes-powered dynamic dashboards, the **Trend** and **Canvas** panels, a rebuilt table, and label-based access control (LBAC) for metrics.

## Run & first dashboard {#start}

Five minutes from an empty server to a live panel: run it, sign in, wire a data source, add a panel.

### 1. Run

```
docker run -d -p 3000:3000 \
  grafana/grafana
```

### 2. Sign in

Open `http://localhost:3000` and log in as `admin` / `admin`.

```
# change the password
# when prompted
```

### 3. Add a data source

Connections → Data sources → Prometheus, Loki, or Postgres.

```
http://prometheus:9090
```

### 4. New dashboard + panel

Dashboards → New → Add visualization → pick a query and panel type.

```
Dashboard → Add → Visualization
```

> **KEY:** **Queries live in panels.** A dashboard is just a grid of panels; each panel runs its own query against a data source. Write the query in **Explore** first to iterate, then save it into a dashboard panel.

<details>
<summary>Persist data & plugins</summary>

#### Keep dashboards across restarts

```
docker run -d -p 3000:3000 \
  -v grafana-data:/var/lib/grafana \
  grafana/grafana
```

#### Install plugins at boot

```
GF_INSTALL_PLUGINS=grafana-clock-panel,\
grafana-piechart-panel
```

</details>

## Data sources & queries {#concepts}

Every panel queries a data source through its own query language, then plots the result over a time range.

### Prometheus

Metrics via PromQL. Add `rate()` to counters and use `$__rate_interval`.

```
rate(http_requests_total[$__rate_interval])
sum by (job) (rate(http_requests_total[$__rate_interval]))
```

### Loki

Logs via LogQL. Filter with a stream selector, then pipe to parsers and aggregations.

```
{job="api"} |= "error"
sum by (level) (count_over_time({job="api"}[5m]))
```

### PostgreSQL

Tables via SQL. `$__timeFilter()` applies the dashboard time range to a timestamp column.

```
SELECT time, value
FROM metrics
WHERE $__timeFilter(time)
ORDER BY 1
```

| Shape | Columns | Use when |
| --- | --- | --- |
| `wide` | `time`, series A, series B, … | One column per series (pivoted). |
| `long` | `time`, `value`, label | A value column plus a series-name column. |

> **⌁:** **Time & units are panel-level.** The dashboard time range picker applies to every panel. Set units in Panel → Standard options → Unit — common values: `bytes`, `percent (0-100)`, `percentunit (0.0-1.0)`, `s`, `ms`, `short`.

<details>
<summary>Iterate in Explore</summary>

Explore runs a query against one data source with the time range and query inspector visible. When a query looks right, use **Add to dashboard** to drop it into a panel. Grafana 11+ also ships **Explore Metrics** and **Explore Logs** for click-driven browsing without writing PromQL/LogQL.

```
# Explore → pick data source → write query
# → Add to dashboard → choose panel type
```

</details>

## Panel types {#panels}

Pick the visualization that matches the data shape, then tune thresholds, units, and the legend.

| Panel | What it shows | Use for |
| --- | --- | --- |
| `Time series` | Lines over time | Metrics, rates, latencies. |
| `Stat` | One big number | Current value, e.g. uptime or errors. |
| `Gauge` | Value on an arc | Utilization against a max. |
| `Bar gauge` | Horizontal bars per series | Ranking several series at once. |
| `Table` | Tabular rows/columns | Logs, top-N lists, raw rows. |
| `Text` | Markdown / HTML | Docs, links, runbooks on a dashboard. |

### Thresholds

Color-code values by ranges. `base` is the default, `green`/`red` override it.

```
# Thresholds: 0 = green, 80 = base, 95 = red
# value 70 → green
```

### Units

Format the raw value without changing the data.

```
Panel → Standard options → Unit
# bytes, percent, s, ms, short
```

### Legend

Control series names and visibility.

```
# Legend format with labels:
{{job}} - {{instance}}
# or per-series overrides
```

<details>
<summary>More panel types</summary>

`logs` `pie chart` `histogram` `state timeline` `status history` `geomap` `candlestick` `heatmap` `node graph` `flame graph` `trend` `canvas` `xy chart` `dashboard list` `alert list` `annotation list`

Specialized panels for logs (Loki), distributions (histogram/heatmap), discrete state over time (state timeline/status history), and tracing (node graph, flame graph). New in Grafana 11/12: **Trend** (sparkline-style per-series stats), **Canvas** (free-form layout), **XY chart** (arbitrary x/y), and the **dashboard / alert / annotation list** panels.

</details>

## Template variables {#variables}

Make one dashboard reusable across hosts, jobs, and environments with `$var` placeholders.

| Type | Options come from | Example |
| --- | --- | --- |
| `query` | A data source query | `label_values(up, job)` |
| `custom` | A comma-separated list | `prod, staging, dev` |
| `interval` | Auto time spans | `1m, 5m, 15m, 1h` |
| `constant` | A fixed hidden value | `region=us-east-1` |
| `datasource` | The data sources list | pick Prometheus or Loki |
| `textbox` | Free-text input | a hostname prefix |

### Multi-value

Enable **Multi-value** and **Include All**. The format changes interpolation: `=~` regex for multi-select in PromQL.

```
# Multi-select as regex:
label=~"$jobs"
# Single: label="$job"
```

### Chained (dependent)

Later variables read earlier ones: pick `$region` first, then `$cluster` narrows to it.

```
# $cluster query depends on $region:
label_values(kube_node_labels{region="$region"}, cluster)
```

> **!:** **Escaping.** `$var` auto-escapes for the context; use `${var:raw}` to disable escaping and `${var:regex}` for a safe regex in label matchers. Chained variables refresh top-down when a parent changes.

<details>
<summary>Built-in variables & ad hoc filters</summary>

```
$__from          # range start (epoch ms)
$__to            # range end (epoch ms)
$__interval      # auto step, e.g. 15s
$__rate_interval # safe window for rate()
```

**Ad hoc filters** let viewers add key/value filters on the fly without editing the dashboard.

</details>

## Transforms {#transforms}

Reshape query results in the panel before they render — no need to change the query itself.

- `Reduce` — Aggregate rows into single values (sum, mean, min, max, last) per field.
- `Filter by name` — Keep or remove fields matching a regex.
- `Merge` — Combine several query results into one table by time.
- `Join by field` — SQL-style join of two tables on a shared field value.
- `Group by` — Bucket rows by field(s), then apply an aggregation.
- `Sort by` — Order rows by a field ascending or descending.
- `Filter by value` — Keep rows where a field passes a condition.
- `Rename by regex` — Rewrite field/series names with capture groups.
- `Calculate field` — Add a computed field from an expression.
- `Labels to fields` — Turn label columns into data fields.

> **▦:** **Order matters.** Transforms run top-to-bottom and each sees the previous one's output. Put `Filter by name` before `Reduce` to slim the table before aggregating.

<details>
<summary>Organize & convert</summary>

#### Organize fields

```
# reorder, hide, or rename columns
# before the panel renders them
```

#### Convert field type

```
# string ↔ number ↔ boolean ↔ time
# fixes "no data" from string numbers
```

</details>

## Alerts & notifications {#alerts}

Alert rules evaluate a query on a schedule, then route the result to contact points by label.

- **Normal** — The condition is not met; the alert is quiet.
- **Pending** — Condition met, but not yet for the full evaluation window.
- **Alerting** — Condition has held; a notification is firing.
- **NoData** — The query returned no data during the window.

### Alert rule + condition

Create from a panel (Edit → Alert) or standalone (Alerting → Alert rules).

```
# Reduce + threshold expression:
when avg() of query(A, 5m, now)
IS ABOVE 0.9
```

### Contact points

Where notifications go: email, Slack, PagerDuty, webhook, Telegram.

```
Alerting → Contact points → New
# pick an integration, fill secrets
```

### Notification policies

The routing tree matches alerts to contact points by label.

```
# default policy → email
# severity=critical → pagerduty
```

### Labels

Key/value pairs attached to an alert; they drive routing and silence matching.

```
severity: critical
team: api
```

> **↺:** **Routing is label-based.** A notification policy matches on `label = value`. If an alert fires to the wrong place, check its labels against the routing tree before touching the contact point.

<details>
<summary>Evaluation timing</summary>

Rules evaluate on an interval (default `1m`) over a `for` window. An alert stays **Pending** until the condition holds for the full `for`, then it becomes **Alerting**.

```
# Evaluate every 1m, fire after 5m:
# Interval: 1m · For: 5m
```

</details>

## Provisioning as code {#provisioning}

Declare data sources and dashboards as YAML, and override any setting with `GF_`-prefixed env vars.

### Data sources

```
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### Dashboards

```
apiVersion: 1
providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

### Env vars

Every config key maps to `GF_SECTION_KEY` in the container.

```
GF_SECURITY_ADMIN_PASSWORD=secret
GF_SECURITY_ADMIN_USER=admin
GF_SERVER_HTTP_PORT=3000
GF_DATABASE_URL=postgres://…
GF_INSTALL_PLUGINS=grafana-clock-panel
```

### Config file

Full config lives in `grafana.ini`; provisioned YAML is separate.

```
/etc/grafana/grafana.ini
# [server]
# http_port = 3000
# [security]
# admin_password = …
```

> **GF_:** **Env wins.** Any `grafana.ini` value can be overridden by its `GF_` env var at container start — no rebuild, no mounted config needed for most changes.

<details>
<summary>Secrets in datasources</summary>

```
datasources:
  - name: Postgres
    type: postgres
    url: db:5432
    jsonData:
      database: metrics
    secureJsonData:
      user: grafana
      password: secret
```

</details>

## Pitfalls {#gotchas}

Small behaviors that make a panel show nothing, wrong values, or the wrong series names.

### Time range picker

Every panel is clipped to the dashboard time range. Use `$__rate_interval` in PromQL instead of a fixed `[5m]` so rates resize with the picker.

```
rate(requests_total[$__rate_interval])
```

### Unit formatting

The unit changes the label, not the data. If values look wrong (e.g. bytes shown as a huge number), set the unit on the panel — not in the query.

```
Standard options → Unit → bytes
```

### Template var escaping

`$var` is auto-escaped; a multi-value PromQL matcher needs the regex form or you'll get a broken query.

```
label=~"${jobs:regex}"
# not: label="$jobs"
```

### Series naming

Multiple series with identical names collapse to one line. Disambiguate with a `Legend` format or a rename transform.

```
Legend: {{job}} - {{instance}}
```

### Data source access mode

`access: proxy` routes queries through the Grafana server; `direct` fetches from the browser. In Docker, or when the target isn't reachable from the browser (CORS / private network), `direct` fails with no data.

```
access: proxy   # server-side, default
access: direct  # browser-side
```

### No data & null gaps

Gaps appear where a series has *no samples*, not where it's zero. For lines, enable **Connect null values**; to treat missing as zero, fill in the query with `OR on() vector(0)` (PromQL) or `COALESCE(…, 0)` (SQL).

```
# PromQL: fill missing with 0
requests_total OR on() vector(0)
# SQL: SELECT COALESCE(value, 0)
```

> **!:** **Data source auth.** Provisioned data sources with credentials need `secureJsonData` (e.g. `basicAuthPassword`, `token`) — plain `jsonData` holds only non-secret settings. If a panel shows *401 / no data*, check the source's auth before the query.
