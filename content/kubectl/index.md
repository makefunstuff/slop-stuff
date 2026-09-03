---
title: "kubectl"
description: "Inspect, run, edit, debug, and switch Kubernetes contexts from the shell."
category: "Cloud, DevOps & observability"
tags: ["cloud", "get", "apply", "rollout"]
weight: 200
lead: "Drive a cluster from the shell."
version: "k8s CLI"
---
kubectl is the Kubernetes command line: one binary to inspect, run, edit, and debug every resource in a cluster. No dashboard required.

## Quick reference {#quickref}

The commands you'll type a hundred times a day, scannable at a glance — everything else on this page is the depth behind them.

- `kubectl get pods -n NAMESPACE` — List pods; `-A` for every namespace.
- `kubectl describe pod NAME` — Status, conditions, and recent events.
- `kubectl logs -f deploy/NAME` — Follow logs from a deployment.
- `kubectl apply -f manifest.yaml` — Create or update from YAML.
- `kubectl exec -it pod/NAME -- sh` — Open a shell inside a pod.
- `kubectl port-forward svc/NAME 8080:80` — Forward a local port to a service.
- `kubectl rollout restart deploy/NAME` — Cycle pods to pick up changes.
- `kubectl get pods -o yaml` — Full object as YAML.
- `kubectl config use-context NAME` — Switch clusters.
- `kubectl config current-context` — Which cluster am I on?

> **KEY:** **Namespace and context shape everything.** `-n NAMESPACE` scopes one command; `kubectl config set-context --current --namespace=team-a` sets the default; `--context NAME` targets another cluster without switching.

## Contexts & config {#start}

Everything starts with a kubeconfig: clusters, users, and the context that ties them together. Switch context and you're talking to a different cluster.

### 1. List contexts

```
kubectl config get-contexts
```

### 2. Switch context

```
kubectl config use-context minikube
```

### 3. Current context

```
kubectl config current-context
```

### 4. Cluster info

```
kubectl cluster-info
```

### Scope a namespace

```
kubectl get pods -n kube-system
kubectl get pods -A
kubectl config set-context --current \
  --namespace=team-a
```

### Point at a context

```
kubectl --context prod get pods
KUBECONFIG=~/.kube/prod.yaml \
  kubectl get pods
```

> **KEY:** **Config lives in `~/.kube/config`.** A context binds a cluster, a user, and a namespace. Scope any command with `-n NAMESPACE` or `--context NAME`; set `KUBECONFIG` to point at a different file. See `kubectl get namespaces` for what's available.

## Inspect resources {#inspect}

`get` lists resources, `describe` narrates their state, and `events` tell you what just happened.

- `kubectl get pods` — List pods in the current namespace.
- `kubectl get pods -o wide` — Add node, IP, and container columns.
- `kubectl get pods -o yaml` — Full object as YAML.
- `kubectl get pods -o json` — Full object as JSON.
- `kubectl get pods --watch` — Stream changes as they happen.
- `kubectl get deploy,svc,cm` — Several kinds in one shot.
- `kubectl describe pod web-abc123` — Events, conditions, mounts, status.
- `kubectl get events --sort-by=.metadata.creationTimestamp` — Recent cluster events, newest last.
- `kubectl events --for pod/web-abc123` — Watch events for one resource (1.30+).
- `kubectl api-resources` — Every kind this cluster knows.
- `kubectl explain pod.spec.containers` — Field-by-field documentation.

### Custom columns

```
kubectl get pods \
  -o custom-columns=NAME:.metadata.name,IP:.status.podIP
```

### Sort by a field

```
kubectl get pods \
  --sort-by=.metadata.creationTimestamp
kubectl get events \
  --sort-by=.lastTimestamp
```

> **⌁:** **get vs describe:** `get` is a table; `describe` is the story. Use `-o wide` for a few extra columns, `-o yaml` for the exact spec, and `--watch` to tail a resource.

## Run & apply {#run}

`apply` reconciles manifests, `create` is one-shot, and `run` spins up a single workload fast.

- `kubectl apply -f deploy.yaml` — Create or update from a manifest.
- `kubectl create -f deploy.yaml` — Create only — errors if it exists.
- `kubectl apply -k ./overlays/prod` — Apply a kustomize directory.
- `kubectl run nginx --image=nginx` — Quick pod in a single line.
- `kubectl expose deploy web --port=80 --target-port=8080` — Create a Service for a deployment.
- `kubectl delete -f deploy.yaml` — Delete resources from a manifest.
- `kubectl delete pod web-abc123 --grace-period=0 --force` — Hard-delete a stuck pod.
- `kubectl apply -f app.yaml --dry-run=client -o yaml` — Preview without touching the cluster.
- `kubectl diff -f app.yaml` — Show exactly what apply would change.

### Generate a manifest

```
kubectl create deploy web \
  --image=nginx \
  --dry-run=client -o yaml
```

### Preview an apply

```
kubectl apply -f app.yaml \
  --dry-run=client -o yaml
```

> **⚠:** **apply vs create:** `apply` merges with live state and can update in place; `create` refuses if the resource already exists. Prefer `apply -f` for anything you'll re-run, and dry-run first when you're not sure.

## Edit & update {#edit}

Most changes are one-liners: set an image, scale replicas, or restart a rollout. `edit` and `patch` handle the rest.

- `kubectl set image deploy/web web=nginx:1.27` — Swap the container image in place.
- `kubectl scale deploy/web --replicas=5` — Change how many replicas run.
- `kubectl rollout restart deploy/web` — Cycle pods to pick up new config.
- `kubectl rollout status deploy/web` — Block until the rollout finishes.
- `kubectl rollout undo deploy/web` — Roll back to the previous revision.
- `kubectl rollout history deploy/web` — List rollout revisions.
- `kubectl edit deploy/web` — Open the live object in $EDITOR.
- `kubectl label deploy/web env=prod` — Add or change a label.
- `kubectl annotate deploy/web owner=platform` — Attach non-identifying metadata.

### Patch — strategic merge

```
kubectl patch deploy/web \
  -p '{"spec":{"replicas":3}}'
```

### Patch — JSON

```
kubectl patch deploy/web \
  --type=json \
  -p='[{"op":"replace","path":"/spec/replicas","value":3}]'
```

> **⚠:** **Edit vs apply:** `edit` and `patch` mutate the live object but leave your git file untouched. If the change matters, put it in a manifest and `apply -f` — that's the source of truth.

## Debug & access {#debug}

Follow logs, open a shell inside a pod, forward a port, or drop a `debug` container into a running pod or node.

- `kubectl logs deploy/web` — Logs from a deployment's pods.
- `kubectl logs pod/web-abc123 -f` — Follow logs live.
- `kubectl logs pod/web-abc123 --tail=50` — Just the last 50 lines.
- `kubectl logs pod/web-abc123 -c sidecar` — One specific container.
- `kubectl exec -it pod/web-abc123 -- sh` — Open a shell inside the pod.
- `kubectl exec pod/web-abc123 -- env` — Run one command, no TTY.
- `kubectl port-forward svc/web 8080:80` — Forward local 8080 → service 80.
- `kubectl cp pod/web-abc123:/app/out.txt ./out.txt` — Copy a file out of a pod.
- `kubectl top pods` — CPU/memory (needs metrics-server).
- `kubectl attach pod/web-abc123` — Attach to a container's stdio.
- `kubectl debug node/worker-1 -it --image=busybox` — Run a debug pod on a node.
- `kubectl debug pod/web-abc123 -it --image=busybox --target=web` — Ephemeral container sharing the pod's namespaces.

### Crashed container logs

```
kubectl logs pod/web-abc123 \
  --previous
kubectl logs pod/web-abc123 \
  -c sidecar --previous
```

### Forward a pod directly

```
kubectl port-forward \
  pod/web-abc123 8080:80
# expose to the network:
kubectl port-forward \
  pod/web-abc123 8080:80 \
  --address=0.0.0.0
```

> **KEY:** **exec needs `--`.** Everything after `--` goes to the container, not kubectl: `kubectl exec -it POD -- sh`. `port-forward` runs in the foreground — append `&` to background it.

## Resource YAML {#yaml}

Four fields frame every manifest: `apiVersion`, `kind`, `metadata`, `spec`. Labels select; specs describe.

### Pod

```
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports:
        - containerPort: 80
```

### Deployment

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
```

### Service

```
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

### ConfigMap

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
  app.yaml: |
    retries: 3
```

> **KEY:** **Labels wire things together.** `metadata.labels` on a pod is matched by a Service's `spec.selector` and a Deployment's `matchLabels` to decide what belongs to what. `apiVersion` + `kind` pick the type; `metadata` names it; `spec` describes it.

## Multi-cluster & namespaces {#contexts}

One kubectl, many clusters: contexts switch the target, namespaces partition it, and RBAC decides what you may do.

- `kubectl config get-contexts` — List every context in kubeconfig.
- `kubectl config use-context prod` — Switch the active cluster.
- `kubectl config current-context` — Which cluster am I on?
- `kubectl config set-context prod --namespace=team-a` — Pin a namespace to a context.
- `kubectl get namespaces` — List namespaces.
- `kubectl create namespace team-a` — Make a new namespace.
- `kubectl get pods -n kube-system` — Scope a single command.
- `kubectl config set-context --current --namespace=team-a` — Change the default namespace for now.

### Can I? (auth can-i)

```
kubectl auth can-i create pods
kubectl auth can-i delete deployments \
  -n team-a
```

### As another identity

```
kubectl auth can-i get secrets \
  --as=system:serviceaccount:team-a:default
kubectl auth can-i '*' '*'
```

> **⚠:** **RBAC is allow-only:** no rules means no access. Roles grant permissions inside a namespace; ClusterRoles grant them cluster-wide. Bind them with RoleBinding / ClusterRoleBinding. The default namespace is just a convention, not a sandbox.

<details>
<summary>RBAC verbs at a glance</summary>

Read verbs: `get`, `list`, `watch`. Write verbs: `create`, `update`, `patch`, `delete`, `deletecollection`. `*` matches everything. Verbs are scoped to `apiGroups` and `resources` inside a Role or ClusterRole.

</details>

## Flags & gotchas {#gotchas}

Output format, namespace scope, and selectors change everything about what a command returns.

- `kubectl get pods -o wide` — Add IP + node columns.
- `kubectl get pods -o yaml` — The whole object, YAML.
- `kubectl get pods -A` — Every namespace at once.
- `kubectl get pods -l app=web` — Label selector (equality).
- `kubectl get pods -l 'env in (prod,staging)'` — Label selector (set-based).
- `kubectl get nodes -o jsonpath='{.items[*].status.addresses[0].address}'` — JSONPath extraction.
- `kubectl get pods -o json | jq '.items[].metadata.name'` — Pipe structured output to jq.

### JSONPath

```
kubectl get pods \
  -o jsonpath='{.items[*].metadata.name}'

kubectl get nodes \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.capacity.cpu}{"\n"}{end}'
```

### Pipe to jq

```
kubectl get pods -o json | \
  jq -r '.items[] | [.metadata.name, .status.phase] | @tsv'

kubectl get pods -A -o json | \
  jq '.items | length'
```

> **⚠:** **Scope is silent.** kubectl defaults to the current namespace, so `get pods` quietly ignores pods elsewhere. Pass `-A` / `-n NAME` to see them. `-l` filters by label; JSONPath and `jq` shape the output.

<details>
<summary>More gotchas</summary>

`kubectl run` creates a bare Pod, not a Deployment — use `kubectl create deploy` for a managed workload. `kubectl cp` needs `tar` inside the container image. `logs` and `exec` target one pod; pass `deploy/NAME` to fan out across its replicas. A context switch is global and sticky — `kubectl config use-context prod` stays until you switch back, so check `current-context` before destructive commands. `delete` waits for graceful shutdown; add `--now` (`--grace-period=0 --force`) to skip it. Raw `-o yaml` includes `managedFields` noise — strip it with `jq 'del(.metadata.managedFields)'` when you want a clean manifest.

</details>
