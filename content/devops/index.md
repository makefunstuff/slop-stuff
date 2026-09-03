---
title: "Infrastructure & DevOps"
description: "CI/CD, Docker & containers, orchestration, IaC, observability, and deployment strategies."
category: "Cloud, DevOps & observability"
tags: ["devops", "CI/CD", "Docker", "Terraform"]
weight: 190
lead: "Ship software that ships itself."
version: "infra"
---
DevOps is the loop that turns code into running, observable systems: commit, build, test, deploy, watch — then do it again. This page is the map of the whole toolchain.

## Quick reference {#quickref}

The ten commands you reach for most, in the order of the delivery loop — plus the four deploy strategies. Full context lives in the sections below.

- `git push origin main` — Triggers CI — build and test run automatically on the branch.
- `docker build -t app:1.2.3 .` — Build an image from a Dockerfile in the current dir.
- `docker run -p 8000:8000 app:1.2.3` — Run a container, mapping host port → container port.
- `docker compose up -d --build` — Rebuild images and start the whole stack detached.
- `docker compose down -v` — Stop the stack and remove its volumes.
- `terraform init` — Download providers and modules (run first, then after edits).
- `terraform plan -out=tfplan` — Preview the diff and save a reviewable plan.
- `terraform apply tfplan` — Apply exactly the plan you reviewed.
- `kubectl apply -f deploy.yaml` — Create or update resources from a manifest.
- `kubectl rollout undo deploy/web` — Roll back the last deployment in one command.

### Rolling

Replace pods one at a time; rollback is instant.

### Blue / green

Run old and new side by side, flip the router.

### Canary

Send a small % of traffic to the new version.

### Feature flag

Ship the code, toggle behavior per user.

## The DevOps loop {#start}

Plan → code → build → test → release → deploy → monitor. Each stage is automated and feeds the next; monitoring feeds back into planning.

**Plan** (issue → branch) → **Code** (commit + review) → **Build** (image / artifact) → **Test** (unit + e2e) → **Release** (tag + changelog) → **Deploy** (progressive rollout) → **Monitor** (metrics feed the next plan)

### 1. Automate

Anything done twice by hand becomes a script, a job, or a pipeline.

### 2. Version everything

Code, config, and infrastructure all live in git and get reviewed.

### 3. Observe

Metrics, logs, and traces tell you what's happening in production.

### 4. Ship small

Small, reversible changes make rollback a reflex, not a fire drill.

## CI/CD {#ci}

Continuous integration builds and tests every change; continuous delivery deploys it. Both are declarative YAML describing jobs, stages, and triggers.

1. **Commit** — `git push` triggers the pipeline via a webhook.
1. **Build** — Compile or build the image; restore the cache.
1. **Test** — Unit, integration, and lint in parallel jobs.
1. **Deploy** — Publish artifacts, then release behind an approval gate.

### GitHub Actions

```
name: CI
on:
  push: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### GitLab CI

```
stages: [build, test, deploy]

build:
  stage: build
  image: node:22
  script:
    - npm ci
    - npm run build
  artifacts:
    paths: [dist/]

test:
  stage: test
  script: npm test

deploy:
  stage: deploy
  script: ./deploy.sh
  only: [main]
```

| Concept | GitHub Actions | GitLab CI |
| --- | --- | --- |
| Pipeline | `workflow` | `pipeline` |
| Unit of work | `job` | `job` |
| Ordering | `needs:` | `stage` |
| Triggers | `on:` | `rules:` / `only:` |
| Reusable step | `uses:` (action) | `image:` / `extends:` |
| Secrets | `secrets.NAME` | `$NAME` (masked var) |
| Outputs | `actions/upload-artifact` | `artifacts:` |

> **!:** **Never print secrets.** Store tokens in the CI secret store and reference them as env vars. Add an `environment` (GitHub) or `environment:` (GitLab) block to require manual approval before production deploys.

## Containers {#containers}

An image is a read-only filesystem snapshot; a container is a running instance of it. A Dockerfile is the recipe that builds the image.

### Dockerfile

```
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app"]
```

### Build & run

```
docker build -t app:1.2.3 .
docker run -p 8000:8000 app:1.2.3
docker push ghcr.io/acme/app:1.2.3
docker pull ghcr.io/acme/app:1.2.3
```

### Docker Compose

```
services:
  web:
    build: .
    ports: ["8000:8000"]
  db:
    image: postgres:17
    volumes: ["pg:/var/lib/postgresql/data"]
volumes:
  pg:
```

| Instruction | What it does |
| --- | --- |
| `FROM` | Base image to start from. |
| `WORKDIR` | Set the working directory. |
| `COPY` | Copy files from the build context into the image. |
| `RUN` | Execute a command at build time (installs). |
| `CMD` | Default command when the container starts. |
| `ENTRYPOINT` | Fixed executable; `CMD` becomes its args. |
| `ENV` | Set an environment variable. |
| `EXPOSE` | Document which port the app listens on. |

- `docker ps -a` — List containers (add `-a` for stopped).
- `docker images` — List local images.
- `docker logs -f NAME` — Follow a container's stdout.
- `docker exec -it NAME sh` — Open a shell inside a running container.
- `docker compose up -d` — Start the whole stack, detached.
- `docker compose down -v` — Stop and remove volumes too.
- `docker system prune -a` — Remove stopped containers, unused images, and networks.
- `docker inspect NAME` — Full config as JSON; `--format '{{.NetworkSettings.IPAddress}}'` picks a field.
- `docker cp NAME:/path ./` — Copy files out of (or into) a container.
- `docker history IMAGE` — See every layer and its size.
- `docker network ls` — List networks; `docker volume ls` for volumes.

`Docker Hub` `ghcr.io` `Amazon ECR` `Google Artifact Registry` `Quay`

<details>
<summary>Docker deep dive</summary>

#### Multi-stage builds

Build in a heavy image, copy only the artifact into a slim runtime — no build tools in the final image.

```
FROM golang:1.24 AS build
WORKDIR /src
COPY . .
RUN go build -o /app/server .

FROM gcr.io/distroless/base
COPY --from=build /app/server /server
ENTRYPOINT ["/server"]
```

#### Layer caching

Each instruction is a layer. Copy deps first, install, then code last so code edits don't rebuild dependencies.

```
COPY requirements.txt .   # deps first
RUN pip install -r requirements.txt
COPY . .                  # code last
```

#### Healthchecks

Tell Docker (and the orchestrator) whether the container is alive, so it can restart or drain it.

```
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/health || exit 1
```

#### Networks & volumes

Volumes persist data across restarts; networks let containers reach each other by name in Compose.

```
docker volume create pgdata
docker run -v pgdata:/var/lib/postgresql/data ...
docker network create appnet
docker run --network appnet --name web ...
```

</details>

> **KEY:** **Image ≠ container.** An image is immutable and versioned; a container is its writable runtime layer. Kill the container and the image is untouched — that's what makes rollback cheap.

## Orchestration {#orchestration}

Kubernetes runs your containers across a cluster: a Deployment keeps N replicas alive, a Service gives them a stable address, and a controller reconciles actual state toward desired state.

### Pod

The smallest unit: one or more containers sharing a network and volume.

### Deployment

Declares replicas and the rollout strategy; owns a ReplicaSet.

### Service

A stable IP and DNS name that load-balances across matching Pods.

### Deployment

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
  selector:
    matchLabels: {app: web}
  template:
    metadata:
      labels: {app: web}
    spec:
      containers:
        - name: web
          image: app:1.2.3
          ports: [{containerPort: 8000}]
```

### Service

```
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: {app: web}
  ports:
    - port: 80
      targetPort: 8000
```

- `kubectl scale deploy/web --replicas=5` — Scale the Deployment up or down.
- `kubectl set image deploy/web web=app:1.3.0` — Roll out a new image version.
- `kubectl rollout status deploy/web` — Watch a rolling update finish.
- `kubectl rollout undo deploy/web` — Roll back the last rollout.
- `helm install app ./chart` — Install a Helm release.
- `helm upgrade app ./chart` — Apply changed values.
- `helm rollback app 2` — Return to release revision 2.

> **⌁:** Helm is templating + release management over raw manifests: `values.yaml` holds per-environment config, `helm template` renders manifests for review, and releases are versioned so you can `rollback`. For the full kubectl command reference, see the [kubectl cheatsheet](kubectl/).

## Infrastructure as code {#iac}

Declare servers, networks, and services in files, then converge the real world to match. Terraform plans and applies; Ansible configures the machines.

1. **Write** — `main.tf` declares resources and modules.
1. **Init** — `terraform init` downloads providers and modules.
1. **Plan** — `terraform plan` diffs desired vs. actual.
1. **Apply** — `terraform apply` converges the real world.

### Resource & module

```
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  cidr   = "10.0.0.0/16"
}
```

### State

State records what Terraform manages. Keep it in a shared backend and never edit it by hand.

```
terraform {
  backend "s3" {
    bucket = "acme-tfstate"
    key    = "prod/terraform.tfstate"
  }
}
```

- `terraform init` — Install providers and modules.
- `terraform plan -out=tfplan` — Preview changes, save the plan.
- `terraform apply tfplan` — Apply exactly the reviewed plan.
- `terraform fmt` — Format all `.tf` files.
- `terraform destroy` — Tear down everything in state.
- `terraform import aws_instance.web i-1234` — Adopt existing resources.

| Ansible | Meaning |
| --- | --- |
| `inventory` | List of hosts, grouped. |
| `playbook` | YAML file of ordered plays and tasks. |
| `module` | Idempotent unit of work (e.g. `apt`, `copy`). |
| `role` | Reusable bundle of tasks, templates, and vars. |
| `ansible-playbook site.yml` | Run a playbook against the inventory. |

> **⚠:** **Config drift is the enemy.** Once a human hand-edits a server, reality and code diverge. Re-run apply/playbook on a schedule and treat manual changes as a bug to be codified, not a fix to keep.

> **i:** **Terraform or OpenTofu?** HashiCorp relicensed Terraform under the BUSL (2023); [OpenTofu](https://opentofu.org/) is the Linux Foundation fork with a drop-in workflow — `tofu init`, `tofu plan`, `tofu apply`. Same HCL, same providers.

## Observability {#observability}

Metrics tell you something is wrong; logs tell you what; traces tell you where. Together they turn “it's slow” into “this service on this path”.

### Metrics

Numbers over time: request rate, latency, error rate, saturation. Scraped by Prometheus, queried with PromQL.

### Logs

Structured, searchable lines. Shipped to Loki and searched with LogQL.

### Traces

One request's path through services, as spans. Correlated to logs by trace id.

| Term | Meaning | Example |
| --- | --- | --- |
| `SLI` | Measured indicator of a behavior | p99 latency of `GET /api` |
| `SLO` | Target for the SLI over a window | p99 < 300 ms over 30 days |
| `Error budget` | Allowed misses = `1 - SLO` | burned down by incidents |

- `rate(http_requests_total[5m])` — Requests per second, smoothed.
- `histogram_quantile(0.99, rate(http_duration_bucket[5m]))` — p99 latency from a histogram.
- `sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m]))` — Error ratio.

- **healthy** — SLIs inside budget, no pages.
- **pending** — Alert triggered, waiting to confirm.
- **firing** — SLO breached; on-call is paged.
- **resolved** — Incident closed, postmortem filed.
> **✓:** **Alert on symptoms, not causes.** Page on “p99 latency > SLO for 10 minutes”, not on “CPU > 80%”. Dashboard with Grafana, query with PromQL/LogQL, and link every alert to a runbook.

## Deployment strategies {#deploy}

How you move a new version into production decides how safely you can roll back. Pick by blast radius and how much traffic you can afford to risk.

| Strategy | How it works | Rollback |
| --- | --- | --- |
| Rolling | Replace instances one at a time. | Instant — old pods still exist. |
| Blue / green | Run old and new side by side, flip a router. | Flip the router back. |
| Canary | Send a small % of traffic to the new version. | Cut the canary's traffic to 0. |
| Feature flag | Ship the code, toggle the behavior per user. | Turn the flag off — no redeploy. |

### Canary by percentage

```
kubectl apply -f web-v2.yaml
# shift 10% of traffic to v2
kubectl patch svc web \
  -p '{"spec":{"selector":{"version":"v2"}}}'
```

### Rollback checklist

```
kubectl rollout undo deploy/web
helm rollback app 1
terraform apply tfplan.backup
git revert <sha> && git push
```

> **⚠:** **Rehearse rollback before you need it.** A deploy that can't be undone in one command is a bet you'll lose at 3 a.m. Run a rollback drill as part of every release.

## Pitfalls {#gotchas}

Common mistakes that ship broken systems faster than any outage could — each with the fix.

### Secrets in code

A token in a repo is a token on every clone. Use a secret store and scan history.

```
# bad
password: "hunter2"
# good
password: ${DB_PASSWORD}
```

### Config drift

Hand-edited servers drift from IaC until the next apply wipes your fix.

```
terraform plan   # shows the drift
terraform apply  # converge back
```

### Oversized images

Multi-gigabyte images slow every build and rollout. Use slim bases and multi-stage builds.

```
docker build --pull .
docker images | sort -k7 -h
```

### No rollback plan

If you can't undo in one command, the deploy is a trap.

```
kubectl rollout undo deploy/web
helm rollback app 1
```

### Running as root

Containers default to `root`. A compromised app then gets far more than it should. Drop privileges in both the image and the pod.

```
USER 10001                    # Dockerfile

securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
```

### latest & mutable tags

A moving tag means the same manifest can deploy different code on different days. Pin by digest for reproducible, auditable deploys.

```
image: app:1.2.3                # pinned tag
image: app@sha256:9f86d08...    # immutable digest
```

> **⚠:** **Production data in dev.** Copies of prod databases in dev environments leak PII and drift from schema. Use synthetic or anonymized data, and never run a dev tool against the prod endpoint.
