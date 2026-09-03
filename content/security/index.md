---
title: "Security practices"
description: "Auth, secrets, supply chain, hardening, web security, and incident response."
category: "Security"
tags: ["defensive", "auth", "secrets", "hardening"]
weight: 550
lead: "Defend like it's always attacked."
version: "defensive"
---
Authentication, secrets, supply chain, web security, and incident response — the habits and commands that keep a system standing under pressure.

## Quick reference {#quickref}

Seven habits that stop most attacks, plus three that keep you patched and visible. The sections below add the how.

- `CIA triad` — Confidentiality (encrypt, control access), Integrity (hash, sign), Availability (redundancy, rate limits).
- `argon2id / bcrypt` — Hash passwords with argon2id (OWASP first choice) or bcrypt cost 12+ — never MD5 / SHA-1 / plaintext.
- `MFA` — Require a second factor (passkey / TOTP) for every human account — the biggest lever against account takeover.
- `Least privilege` — Non-root, read-only, scoped IAM, short-lived tokens. Grant the minimum a task needs.
- `Secrets management` — Vault-managed and runtime-injected; never in git, env dumps, or frontends. Rotate before you leak.
- `OWASP Top 10` — The 2025 baseline for web risk — broken access control stays #1; SSRF now folds into it.
- `TLS` — TLS 1.3 preferred, 1.2 minimum, HSTS on. Encrypt in transit everywhere.
- `Defense in depth` — Layer independent controls so one failure isn't a full compromise. Assume breach.
- `SBOM + scan` — Pin dependencies, generate an SBOM, scan for CVEs in CI (trivy / osv-scanner / npm audit).
- `Rate limit` — Throttle login and token endpoints to blunt brute force, stuffing, and scraping.

## Security fundamentals {#start}

Four ideas underpin every secure system: the CIA triad, threat modeling, least privilege, and defense in depth.

### 1. CIA triad

**Confidentiality** (encryption, access control), **Integrity** (hashing, signatures), **Availability** (redundancy, rate limits).

### 2. Threat modeling

Map assets, entry points, and trust boundaries. Use STRIDE or attack trees *before* writing code.

### 3. Least privilege

Grant the minimum access a task needs — scoped IAM roles, short-lived tokens, narrow permissions.

### 4. Defense in depth

Layer independent controls (network, app, data) so a single failure isn't a full compromise.

> **KEY:** **Assume breach.** Design so a single compromised credential, host, or dependency does not hand an attacker the whole system.

## Authentication & authorization {#auth}

Prove who someone is (authN), then decide what they may do (authZ). Never store passwords in plaintext.

| Password hashing | Work factor | Use when | Notes |
| --- | --- | --- | --- |
| `bcrypt` | cost 12+ | Default for web apps | Slow, salted; 72-byte input limit. |
| `argon2id` | memory + time + lanes | OWASP first choice | PHC winner; resists GPU cracking. |
| `scrypt` | N, r, p | Memory-hard alternative | Common in crypto libraries. |
| `PBKDF2` | 600k+ iterations | FIPS / legacy | Older but fine at high iterations. |
| `MD5 / SHA-1 / plain` | — | Never | Fast hashes crack at scale. |

<kbd>bcrypt cost 10</kbd> = <kbd>~100 ms</kbd> <kbd>cost 12</kbd> = <kbd>~400 ms</kbd> <kbd>argon2id</kbd> = <kbd>memory-hard</kbd>

### Hash + verify (Node)

```
const hash = await bcrypt.hash(pw, 12);
const ok = await bcrypt.compare(pw, hash);
```

### Hash (argon2 CLI)

```
echo -n "p@ss" | argon2 salt \
  -id -t 3 -m 65536 -p 4
```

### MFA

Require a second factor: TOTP app, WebAuthn passkey, or backup codes. Enroll admins and finance first.

### OAuth 2.0 / OIDC

Use the **authorization code + PKCE** flow for apps. OIDC layers identity (ID token + `/userinfo`) on top of OAuth.

### JWT

Signed, not secret. Verify `alg`, `exp`, `aud`, and signature; keep tokens short-lived and reject `alg=none`.

### Sessions

Server-side sessions with cookies flagged `HttpOnly; Secure; SameSite=Lax`. Rotate the session id on login.

**User** (browser) → **App** (client + PKCE) → **IdP** (authorize + token) → **API** (validates JWT)

<details>
<summary>JWT anatomy & verification</summary>

A JWT is `header.payload.signature`, each part base64url-encoded. Never trust it without verifying the signature and claims:

```
# header:  {"alg":"HS256","typ":"JWT"}
# payload: {"sub":"42","exp":1710000000,"aud":"api"}
# verify:  signature, exp (not expired),
#          aud (for your API), iss (trusted)
```

</details>

- `RBAC` — roles → permissions. “Admin can delete users”.
- `ABAC` — attributes → policy. “Delete if resource.owner == user”.
- `2FA / MFA` — something you know + have + are.
- `PKCE` — proof key for code exchange — OAuth for public clients.

## Secrets & keys {#secrets}

Credentials live in a secret manager, never in source control. Rotate before you leak.

> **!:** **A secret pushed to git is compromised forever.** Treat repo history as public: rotate the credential immediately, then scrub with `git filter-repo` or `bfg` — rotation always comes first.

### Env vars

Fine for local dev, but they leak into child processes, crash dumps, and CI logs.

```
export DATABASE_URL=postgres://…
node app.js
```

### Vaults / secret managers

Central store with audit, rotation, and access control. Inject at runtime, not build time.

```
vault kv get secret/app/db
aws secretsmanager get-secret-value \
  --secret-id app/db
```

| Tool | Kind | Rotation | Use for |
| --- | --- | --- | --- |
| `HashiCorp Vault` | self-hosted vault | dynamic secrets | platform-wide secrets + PKI |
| `AWS Secrets Manager` | managed vault | built-in | AWS workloads |
| `GCP Secret Manager` | managed vault | versioned | GCP workloads |
| `SOPS` | encrypted files | manual | git-friendly config secrets |
| `Doppler / Infisical` | managed vault | built-in | dev → prod sync |

- `echo ".env" >> .gitignore` — keep `.env`, `*.pem`, and `*.key` out of git.
- `gitleaks detect --source .` — scan history for committed secrets.
- `trufflehog git file://. --only-verified` — live-verify leaked credentials.
- `git filter-repo --path .env --invert-paths` — scrub a file from history (then rotate).

### Patterns that must never be committed

`aws_access_key_id` `AKIA…` `ghp_…` `sk_live_…` `xoxb-…` `-----BEGIN PRIVATE KEY-----`

## Supply chain {#supplychain}

Your app ships other people's code. Pin it, hash it, and know what's inside.

### Pin & lock

Commit lockfiles and pin exact versions in production. Avoid `^` / `~` ranges for deploys.

```
package-lock.json   npm
yarn.lock           yarn
Cargo.lock          rust
go.sum               go
Pipfile.lock         python
```

### SBOM

Ship a machine-readable bill of materials (SPDX / CycloneDX) with every release.

```
syft dir:. -o spdx-json > sbom.json
syft image:app:latest -o cyclonedx-json
```

### Signed commits

Sign commits and tags so history is verifiable. Enable SSH or GPG signing.

```
git config commit.gpgsign true
git config user.signingkey KEYID
```

- `npm audit --omit=dev` — known CVEs in your JS deps.
- `pip-audit` — audit Python environments.
- `osv-scanner -r .` — scan many ecosystems via OSV.
- `trivy fs .` — scan repo, containers, and IaC for CVEs and misconfigs.
- `govulncheck ./...` — Go-specific vulnerability analysis.
- `Dependabot / Renovate` — automated PRs for outdated, vulnerable deps.

<details>
<summary>Dependency hygiene checklist</summary>

#### Pin

```
npm ci        # exact lockfile install
pip install --require-hashes -r reqs.txt
```

#### Scan

```
npm audit --omit=dev
osv-scanner -r .
```

</details>

> **✓:** **Lockfiles are not optional in CI.** Run `npm ci`, `pip install --require-hashes`, and `go mod verify` so builds use the pinned, hashed dependency graph.

## Hardening {#hardening}

Shrink the attack surface: remove what you don't need, lock down what remains, patch fast.

### Containers non-root

Drop root, use a read-only filesystem, and drop capabilities.

```
FROM node:20-alpine
USER 10001
COPY --chown=10001 . /app
# run: --read-only --cap-drop ALL
```

### TLS everywhere

TLS 1.3 preferred, 1.2 minimum, HSTS, automate certs. Never terminate at the edge without re-encrypting.

```
Strict-Transport-Security:
  max-age=31536000; includeSubDomains
```

### SSH hardening

Keys only, no root login, minimal ciphers.

```
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
AllowUsers deploy
```

| Practice | What it means | Quick win |
| --- | --- | --- |
| Least privilege | minimal perms on users, roles, processes | run as non-root, scope IAM to resources |
| Network segmentation | isolate tiers; deny by default | security groups / subnets per tier |
| Patch management | apply security updates on a cadence | auto OS + dependency updates, track CVEs |
| CIS benchmarks | configuration baselines | run a CIS scanner, apply Level 1 |
| Disable unused | turn off ports, services, features | remove debug endpoints and unused deps |

#### Containers

- Run as non-root — <kbd>USER 10001</kbd>
- Read-only rootfs — <kbd>--read-only</kbd>
- Drop capabilities — <kbd>--cap-drop ALL</kbd>

#### Linux

- Disable root SSH — <kbd>PermitRootLogin no</kbd>
- Keys only — <kbd>PasswordAuthentication no</kbd>
- Brute-force lockout — <kbd>fail2ban maxretry 5</kbd>

#### Network

- TLS version — <kbd>1.3 / 1.2 min</kbd>
- HSTS max-age — <kbd>31536000</kbd>
- Firewall default — <kbd>deny</kbd>
> **⌁:** CIS benchmarks (cisecurity.org) give step-by-step baselines for Linux, Windows, cloud, and Kubernetes. Start with Level 1 — safe for most workloads.

## Web & API security {#websec}

Assume every request is hostile: validate input, set headers, and limit abuse.

| OWASP Top 10 (2025) | Risk | Core defense |
| --- | --- | --- |
| `A01` Broken access control | users reach others' data; now includes SSRF, BOLA/BFLA | authorize every request server-side, deny by default |
| `A02` Security misconfiguration | defaults, debug, verbose errors, open buckets | harden, disable unused, scan IaC + headers |
| `A03` Software supply chain failures | compromised deps, build, CI/CD | SBOM, pin + sign + scan, trusted sources |
| `A04` Cryptographic failures | data exposed in transit/at rest | TLS 1.3/1.2, argon2id, strong keys |
| `A05` Injection | SQL, OS, LDAP, XSS | parameterized queries, output-encode |
| `A06` Insecure design | flaws baked into architecture | threat modeling, fail closed |
| `A07` Authentication failures | credential stuffing, weak MFA, sessions | MFA, rate-limit, breached-password checks |
| `A08` Software/data integrity failures | unsigned updates, insecure deserialization | sign artifacts, verify integrity |
| `A09` Logging & alerting failures | no visibility or response to attacks | structured logs + alerting + playbooks |
| `A10` Mishandling of exceptional conditions | fail-open logic, verbose errors | fail closed, centralized error handling |

### Content-Security-Policy

Restrict what the browser may load and execute — the single best header against XSS.

```
Content-Security-Policy: default-src 'self';
  script-src 'self'; object-src 'none';
  frame-ancestors 'none'
```

### CORS

CORS relaxes the same-origin policy — only for the origins you actually need, with explicit methods.

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Credentials: true
```

### SQL injection → parameterize

Never concatenate user input into SQL. Use bound parameters everywhere.

```
cursor.execute(
  "SELECT * FROM users WHERE id = %s",
  (user_id,))
```

### XSS → escape output

Context-aware output encoding; sanitize HTML with DOMPurify; prefer templates that auto-escape.

```
// Go html/template escapes by default
tmpl.Execute(w, userInput)
```

| Header | What it does | Example |
| --- | --- | --- |
| `Content-Security-Policy` | allowlist of script/style sources | `default-src 'self'` |
| `Strict-Transport-Security` | force HTTPS | `max-age=31536000` |
| `X-Frame-Options` | block clickjacking (legacy; prefer CSP `frame-ancestors`) | `DENY` |
| `Referrer-Policy` | limit referrer leakage | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | disable camera/mic/geolocation | `geolocation=()` |
| `X-Content-Type-Options` | stop MIME sniffing | `nosniff` |

<details>
<summary>The four classics, one line each</summary>

#### SQLi

User input becomes SQL. Fix: bound parameters, never string concat.

#### XSS

User input becomes HTML/JS. Fix: output-encode, CSP, DOMPurify.

#### CSRF

Cross-site requests ride the victim's cookies. Fix: SameSite + CSRF token.

#### SSRF

Server fetches attacker-controlled URLs. Fix: allowlist, block metadata IPs.

</details>

> **✓:** **Rate limiting** is the cheap fix for brute force, scraping, and DDoS: `express-rate-limit`, nginx `limit_req`, or an API gateway throttle — especially on login and token endpoints.

## Incident response {#incident}

Plan before the breach: detect, contain, eradicate, recover — then learn from it.

1. **Prepare** — Playbooks, contacts, and tooling ready before you need them. Run tabletop exercises.
1. **Detect** — Alerts from SIEM, IDS, and logs. Confirm the scope: what, when, which systems.
1. **Contain** — Isolate hosts, revoke keys, disable accounts, snapshot evidence. Stop the bleed first.
1. **Eradicate** — Remove the foothold: patch, reimage, rotate secrets, delete persistence.
1. **Recover** — Restore from clean backups, monitor for recurrence, bring services back gradually.
1. **Learn** — Post-mortem: what failed, what slowed you, and one concrete change to prevent a repeat.
- **healthy** — Serving traffic with normal telemetry.
- **degraded** — Serving but failing checks — investigate now.
- **contained** — Isolated from the network, no egress.
- **restored** — Rebuilt from clean image, back in rotation.

### Logging that helps

Structured, centralized, tamper-evident. Log auth events, admin actions, and failures — never secrets or PII.

```
{"ts":"…","evt":"login_failed",
 "user":"ada","ip":"203.0.113.7"}
```

### Backups = 3-2-1

Three copies, two media, one offsite. Test restores — an untested backup is a hope, not a plan.

```
# restore drill, not just a copy job
pg_restore -d app latest.dump
```

> **!:** **Don't destroy evidence during containment.** Capture memory, disk images, and logs *before* reimaging a compromised host — you'll need them for the post-mortem and any legal follow-up.

## Pitfalls {#gotchas}

The mistakes that keep showing up in breach reports — and how to avoid them.

### Hardcoded secrets

API keys and passwords in code, config, or frontends are the #1 breach cause. Move them to a vault and rotate.

```
# bad
API_KEY = "sk_live_4x…"
# good
API_KEY = os.environ["API_KEY"]
```

### Roll-your-own crypto

Hand-written ciphers and homegrown token formats break quietly. Use vetted libraries and standard primitives.

```
# use libsodium / WebCrypto / Go crypto
# never invent AES modes or "encoding"
```

### Over-permissioned IAM

Admin access for every service means one leak = total control. Least privilege, short-lived, scoped to resource.

```
"Action": ["s3:GetObject"],
"Resource": ["arn:aws:s3:::app/*"]
```

### Logging PII & secrets

Logs capture tokens, passwords, and user data, then leak via SIEM or support tickets. Redact by default.

```
log.info("login", user=u.id)   # not u.email
# redact: mask tokens, never log bodies
```

### Missing MFA

Single-factor accounts fall to phishing and credential stuffing. MFA is the biggest lever against account takeover.

```
# require for all human users
# hardware keys > TOTP > SMS
```

### `curl … | bash`

Piping a remote script to a shell skips review and runs as you. Download, inspect, verify, then run.

```
curl -fsSL URL -o install.sh
sha256sum install.sh   # verify
bash install.sh
```

### Default credentials

Ship with the vendor's default login and scanners will find you in minutes. Change on first boot; rotate regularly.

```
# change before exposing anything
admin / admin
root / password
```

### bcrypt's 72-byte limit

bcrypt silently truncates input after 72 bytes, so a 100-char passphrase and its 72-byte prefix hash the same. Pre-hash with SHA-384, or use argon2id for long passphrases.

```
# argon2id has no 72-byte ceiling
# or: bcrypt(sha384(pw)) for long inputs
```

### Forced password rotation

Scheduled rotation pushes users to weak, predictable passwords. NIST 800-63B: drop expiry, check new passwords against breached lists, rotate only on compromise.

```
# check pwned passwords (k-anonymity)
# rotate on breach, not on a calendar
```

### Non-constant-time comparison

Comparing tokens or MACs with `==` leaks how many bytes match via timing. Use a constant-time compare for secrets.

```
crypto.timingSafeEqual(a, b)   # Node
hashlib.compare_digest(a, b)   # Python
```
