---
title: "gcloud"
description: "Compute Engine, Cloud Storage, GKE, IAM, Cloud SQL, and logging."
category: "Cloud, DevOps & observability"
tags: ["cloud", "compute", "gke", "iam"]
weight: 170
lead: "One CLI for all of GCP."
version: "Google Cloud CLI"
---
gcloud is the single command for Google Cloud: authenticate once, then drive Compute Engine, Cloud Storage, GKE, IAM, Cloud SQL, and logs — all from your terminal.

## The commands you'll type most {#quickref}

Six commands plus `--format=json` cover most everyday GCP work. Each links through to a full section below.

| Command | What it does |
| --- | --- |
| `gcloud auth login` | Browser OAuth for your user account. |
| `gcloud config set project my-project` | Set the default project. |
| `gcloud compute instances list` | List your VMs. |
| `gcloud storage cp file.txt gs://my-bucket/` | Upload a file to Cloud Storage. |
| `gcloud container clusters get-credentials my-cluster` | Write the kubeconfig entry so `kubectl` works. |
| `gcloud projects add-iam-policy-binding my-project --member=user:ada@example.com --role=roles/viewer` | Grant a role to a member. |
| `gcloud components update` | Upgrade the CLI and its components. |
| `--format=json` | Machine-readable output — works on every gcloud command. |

## Install & auth {#start}

Get the CLI installed, sign in, and pick a default project. Four commands take you from nothing to working.

### 1. Initialize

```
gcloud init
```

Interactive: login, pick a project, set compute defaults.

### 2. Log in

```
gcloud auth login
```

Browser OAuth for your user account.

### 3. ADC login

```
gcloud auth application-default login
```

Credentials for local SDKs and libraries, not the CLI itself.

### 4. Update

```
gcloud components update
```

Upgrade the CLI and its installed components.

> **KEY:** **Two logins, two jobs.** `gcloud auth login` authenticates the CLI. `gcloud auth application-default login` writes Application Default Credentials so your Python/Go/Node code finds credentials automatically. Run both only when you need both.

## Config & projects {#config}

gcloud remembers your defaults as properties. List them, set them, and override per-command when you need a different project.

- `gcloud config list` — Show all active properties.
- `gcloud config set project my-project` — Set the default project.
- `gcloud config set compute/zone us-central1-a` — Set the default zone.
- `gcloud config unset project` — Clear a property.
- `gcloud config get-value project` — Read a single value.
- `gcloud auth list` — Accounts with stored credentials.
- `gcloud config set account user@example.com` — Set the active account.
- `gcloud projects list` — Projects you can access.
- `gcloud config configurations list` — Named config sets.
- `gcloud config configurations activate work` — Switch to a named config.

### Per-command override

The `--project` flag beats the config, for one command only.

```
gcloud compute instances list \
  --project=other-project
```

### Inspect your setup

`gcloud info` dumps every property, credential source, and the active account and project in one shot.

```
gcloud info
gcloud config list --all
```

> **⌁:** Config is scoped per user by default. Keep entirely separate identities and projects with named configurations: create them with `gcloud config configurations create <name>` and jump between them with `activate`.

## Compute Engine {#compute}

Spin up VMs, reach them over SSH, and control their lifecycle. Zone and region are first-class flags almost everywhere.

- `gcloud compute instances list` — All VMs in the current project/zone.
- `gcloud compute instances create web-1 --zone=us-central1-a --machine-type=e2-medium --image-family=debian-12 --image-project=debian-cloud` — Create a VM.
- `gcloud compute ssh web-1 --zone=us-central1-a` — SSH in (adds keys automatically).
- `gcloud compute instances start web-1` — Start a stopped VM.
- `gcloud compute instances stop web-1` — Stop a running VM.
- `gcloud compute instances delete web-1` — Delete a VM (add `--quiet` to skip the prompt).
- `gcloud compute images list` — Public images available to you.
- `gcloud compute machine-types list --zones=us-central1-a` — Machine types in a zone.
- `gcloud compute disks list` — Persistent disks.
- `gcloud compute snapshots list` — Disk snapshots.

### Zones & regions

Zonal resources need `--zone`; regional ones use `--region`. Set a default so you can drop the flag.

```
gcloud compute zones list
gcloud compute regions list
gcloud config set compute/zone us-central1-a
```

### Instance groups

Managed instance groups scale a VM template behind a load balancer.

```
gcloud compute instance-groups managed list
gcloud compute instance-groups managed create web-group \
  --base-instance-name web --template web-tmpl \
  --size 3 --zone us-central1-a
```

## Cloud Storage {#storage}

The unified `gcloud storage` commands are the modern path; the older `gsutil` still works. Both speak `gs://` URLs.

- `gcloud storage ls gs://my-bucket` — List objects in a bucket.
- `gcloud storage cp file.txt gs://my-bucket/` — Upload a file.
- `gcloud storage cp gs://my-bucket/file.txt .` — Download a file.
- `gcloud storage rsync -r ./build gs://my-bucket/site` — Mirror a directory (sync).
- `gcloud storage buckets create gs://my-bucket` — Create a bucket.
- `gcloud storage rm gs://my-bucket/file.txt` — Delete an object.
- `gsutil mb gs://my-bucket` — Make a bucket (legacy gsutil).
- `gsutil cp -r ./dir gs://my-bucket/` — Recursive copy (legacy gsutil).
- `gcloud storage du gs://my-bucket` — Total size of a bucket.
- `gcloud storage mv gs://my-bucket/a.txt gs://my-bucket/b.txt` — Move or rename an object.

### gsutil vs gcloud storage

`gcloud storage` is the newer, faster rewrite and the recommended path. `gsutil` remains for scripts that haven't migrated.

```
# same job, both tools
gcloud storage cp app.zip gs://my-bucket/
gsutil cp app.zip gs://my-bucket/
```

### Bucket lifecycle

Attach a lifecycle rule to auto-delete or downgrade old objects.

```
gcloud storage buckets update gs://my-bucket \
  --lifecycle-file=lifecycle.json

# lifecycle.json
{"rule": [{"action": {"type": "Delete"},
  "condition": {"age": 30}}]}
```

> **!:** **Bucket names are globally unique** and can never be changed after creation. Pick a globally unique name once, or you'll end up recreating the bucket and copying everything over.

## GKE & containers {#gke}

Create a cluster, pull its kubeconfig with get-credentials, then drive it with `kubectl` as usual.

- `gcloud container clusters create my-cluster --zone=us-central1-a --num-nodes=2` — Create a zonal cluster.
- `gcloud container clusters get-credentials my-cluster --zone=us-central1-a` — Write the kubeconfig entry.
- `gcloud container clusters list` — List your clusters.
- `gcloud container clusters delete my-cluster --zone=us-central1-a` — Delete a cluster.
- `gcloud container node-pools list --cluster=my-cluster --zone=us-central1-a` — List node pools.
- `gcloud container node-pools create pool-2 --cluster=my-cluster --num-nodes=1 --zone=us-central1-a` — Add a node pool.
- `gcloud container clusters resize my-cluster --num-nodes=4 --zone=us-central1-a` — Resize the default node pool.
- `gcloud container clusters upgrade my-cluster --zone=us-central1-a` — Upgrade the cluster master and nodes.

### Then kubectl

After `get-credentials`, your `~/.kube/config` points at the cluster.

```
kubectl get nodes
kubectl get pods -A
kubectl config current-context
```

### Region vs zone

Regional clusters spread the control plane and nodes across zones for higher availability.

```
gcloud container clusters create ha-cluster \
  --region=us-central1 --num-nodes=1 \
  --node-locations=us-central1-a,us-central1-b
```

## IAM & service accounts {#iam}

Grant roles to members with policy bindings, and mint service accounts for machines and CI.

- `gcloud projects get-iam-policy my-project` — Read the full policy.
- `gcloud projects add-iam-policy-binding my-project --member=user:ada@example.com --role=roles/viewer` — Grant a role to a user.
- `gcloud projects remove-iam-policy-binding my-project --member=user:ada@example.com --role=roles/viewer` — Revoke a role.
- `gcloud iam service-accounts create deployer --display-name="Deployer"` — Create a service account.
- `gcloud iam service-accounts keys create key.json --iam-account=deployer@my-project.iam.gserviceaccount.com` — Download a JSON key.
- `gcloud iam roles list` — List predefined roles.
- `gcloud iam service-accounts list` — Service accounts in the project.
- `gcloud iam service-accounts keys list --iam-account=deployer@my-project.iam.gserviceaccount.com` — Keys for a service account.

### Member types

Bindings address members by a type prefix.

```
user:ada@example.com
serviceAccount:deployer@my-project.iam.gserviceaccount.com
group:eng@example.com
domain:example.com
```

### Common roles

Start with the basic trio, then narrow to service roles like `roles/storage.objectViewer`.

```
roles/viewer   # read-only
roles/editor   # read + write
roles/owner    # full control + IAM
```

> **⚠:** **Service-account keys are long-lived secrets.** Treat `key.json` like a password: never commit it, and prefer Workload Identity Federation or the instance metadata server over downloaded keys wherever you can.

## Cloud SQL & more {#sql}

A few more services you'll reach for: managed databases, Pub/Sub messaging, and serverless deploys.

- `gcloud sql instances list` — List databases.
- `gcloud sql instances create my-db --tier=db-f1-micro --region=us-central1` — Create an instance.
- `gcloud sql connect my-db --user=root` — Connect via psql/mysql (Auth Proxy V2).
- `gcloud pubsub topics create my-topic` — Create a topic.
- `gcloud pubsub topics publish my-topic --message="hello"` — Publish a message.
- `gcloud pubsub subscriptions create my-sub --topic=my-topic` — Create a subscription.
- `gcloud pubsub subscriptions pull my-sub --auto-ack` — Pull messages.
- `gcloud functions deploy my-fn --runtime=python311 --trigger-http --entry-point=hello --region=us-central1` — Deploy a Cloud Function.
- `gcloud run deploy my-svc --image=gcr.io/my-project/my-svc --region=us-central1 --allow-unauthenticated` — Deploy to Cloud Run.
- `gcloud run jobs list --region=us-central1` — List Cloud Run jobs.
- `gcloud run jobs execute my-job --region=us-central1` — Run a job to completion.
- `gcloud sql instances delete my-db` — Delete a database instance.
- `gcloud pubsub topics list` — List topics.

## Logging & monitoring {#logs}

Read and write Cloud Logging entries, and shape every gcloud response with `--format`, `--filter`, and `--limit`.

- `gcloud logging read "resource.type=gce_instance" --limit=5` — Recent VM log entries.
- `gcloud logging read "severity>=ERROR" --freshness=1h` — Errors from the last hour.
- `gcloud logging write my-log "deploy complete" --severity=INFO` — Write a structured entry.
- `gcloud logging logs list` — List log names.
- `gcloud logging sinks list` — List export sinks.
- `gcloud logging read "textPayload:FAILED" --format="value(textPayload)"` — Extract one field.

### Formatting

`--format` reshapes output without jq. It works on every gcloud command.

```
--format=json
--format=yaml
--format="table(name,status)"
--format="value(name)"
```

### Filtering & limits

`--filter` narrows server-side; `--limit` caps rows.

```
--filter="status:RUNNING"
--filter="name:web-*"
--limit=10
--sort-by=~creationTimestamp
```

<details>
<summary>More log recipes</summary>

#### Tail recent errors

```
gcloud logging read "severity>=ERROR" \
  --freshness=15m --limit=20
```

#### Read one instance

```
gcloud logging read \
  "resource.type=gce_instance AND \
   resource.labels.instance_id=12345"
```

#### Count by severity

```
gcloud logging read "severity>=ERROR" \
  --format="value(severity)" \
  | sort | uniq -c
```

#### Export to a sink

```
gcloud logging sinks create my-sink \
  storage.googleapis.com/gs://my-bucket \
  --log-filter="severity>=ERROR"
```

</details>

## Flags & gotchas {#gotchas}

The flags that change behavior everywhere, and the small traps that bite everyone once.

| Flag | Effect | Use when |
| --- | --- | --- |
| `--project` | Override the active project for one command | One-off work in a different project. |
| `--format` | Shape output (`json`, `yaml`, `table`, `value`) | Scripting and readable reports. |
| `--filter` | Server-side expression filter | Narrow a list before it downloads. |
| `--quiet` / `-q` | Skip all confirmation prompts | Scripts — but deletes become instant. |
| `--zone` / `--region` | Target a zone or region explicitly | Zonal resources without a configured default. |
| `--async` | Return immediately, poll later | Long create/delete operations. |
| `--limit` | Cap the number of results | Keep large lists small. |
| `--account` | Run as a different authenticated account | Multiple identities in one shell. |
| `--impersonate-service-account` | Run as a service account with short-lived credentials | Least-privilege access without a key file. |
| `--billing-project` | Charge API calls to a different project | Separate quota/billing from the target project. |
| `--verbosity` | Control output detail (`debug`, `info`, `error`) | Diagnosing failed commands. |

### --quiet is a loaded gun

It auto-answers "yes" to every prompt, including deletes. Pair it only with commands you've already reviewed.

```
gcloud compute instances delete web-1 \
  --zone=us-central1-a --quiet
```

### Operations are async

Many commands kick off a long-running operation. Watch its progress with the returned operation ID.

```
gcloud compute operations list
gcloud compute operations describe \
  operation-123 --zone=us-central1-a
```

### Impersonate, don't copy keys

Prefer short-lived impersonation over a downloaded service-account key — no secret to leak or rotate.

```
gcloud compute instances list \
  --impersonate-service-account=deployer@my-project.iam.gserviceaccount.com
```

### Image families drift

Families like `debian-11` go end-of-life yet the CLI keeps offering them for a while. Pin a current family and re-check before new deploys.

```
gcloud compute images list --standard-images \
  --filter="family:debian*"
```

<details>
<summary>Command discovery & help</summary>

#### Built-in help

```
gcloud --help
gcloud compute instances --help
gcloud help config
```

#### Version & components

```
gcloud version
gcloud components list
gcloud components update
```

</details>
