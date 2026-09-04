---
disable-model-invocation: true
name: security-audit-review
description: Use when reviewing code for security concerns — token handling, injection surfaces, auth paths, secret exposure, and permissions scope. Invoked during adversarial review post-implementation, as an audit-loop reviewer node, or on PRs that touch auth/secrets/deploy surfaces. Distinct from the built-in `/security-review` slash command (which runs an automated scan); this skill guides a human or reviewer-agent through the audit.
---

# Security Audit Review

Most security bugs come from the same half-dozen patterns. This skill is the checklist for catching them during review.

## When to invoke

- **Post-implementation (adversarial review):** any PR that touches auth, tokens, secrets, URL construction, subprocess execution, file paths, or external-service calls
- **Audit-loop reviewer node:** for any pipeline producing an artifact that handles secrets or runs in a privileged context
- **Pre-merge on infra / deploy / IAM changes:** ruleset modifications, App permissions, Kubernetes RBAC, Cloudsmith / secret-manager access

**Audit-loop reviewers are read-only.** When invoked as an independent audit-loop reviewer node (parallel review fan-out, typically its own sandbox), audit by reading source, not by building, running, or executing anything. Your sandbox may have different capabilities (network, filesystem, socket permissions) than the environment that produced any evidence pack you're given — an execution failure in your own sandbox is not a security finding about the artifact.

**Skip when:** the change is purely docs or tests with no secret/auth surface. A README edit doesn't need a security review.

## Red flags (cheap checks — stop if any are true)

- [ ] A token or secret variable appears in a log line, error message, or event field without an explicit redaction step
- [ ] An HTTP request or subprocess call builds a URL or command from user input without escaping
- [ ] An `if err != nil { log.Fatal(err) }` where `err` could contain token values (generic "response body" errors leak payloads)
- [ ] A GitHub App / IAM role / service account has broader scope than the task requires
- [ ] `fetch`, `exec.Command`, `os.OpenFile`, or similar takes a string from stdin/params with no validation
- [ ] A config file or environment variable with a secret is read into a map and the whole map gets logged on error
- [ ] `--allow-insecure`, `-k`, `InsecureSkipVerify`, or `NODE_TLS_REJECT_UNAUTHORIZED=0` appears in production code

## Checklist (deeper)

### Token handling

- Are tokens read from config / env / secrets manager, never inlined as string literals?
- Are they passed to subprocesses via env vars rather than argv? (argv shows up in `ps`; env is per-process)
- Are they scrubbed from `stderr_tail`, error messages, panic traces, and summary events via an explicit redaction function?
- Does the redaction regex cover all the patterns in use? Canonical patterns to redact:
  - `^[A-Z_]+_TOKEN=` (GH_TOKEN, CLOUDSMITH_TOKEN, etc.)
  - `Authorization:\s*(Bearer|token)\s+\S+`
  - `password[=:]\s*\S+`
  - API key formats the service you're talking to uses (Stripe keys start with `sk_`, etc.)

### Injection surfaces

- Every `exec.Command` or `/bin/sh -c` construction: is every argument user-controlled or literal? If user-controlled, is it passed as a separate argv element (safe) or concatenated into a shell string (unsafe)?
- Every URL constructed with `fmt.Sprintf("%s/%s", base, path)` or string concat: is the path component URL-escaped?
- Every SQL query: prepared statements, not format strings
- Every HTML-rendered user content: escaped at output time, not at input time
- Every file-path join with user-controlled segments: `filepath.Clean` + directory-traversal check (no `..` after cleaning)

### Auth path scope

- For GitHub Apps / OAuth: does the App installation have only the permissions needed by the workflow? Over-scoped Apps widen blast radius on compromise.
- For IAM roles / service accounts: principle-of-least-privilege review. List the actions the role can take; match against the actions the workflow needs. Prune the delta.
- For secrets: does each secret flow to only the jobs that need it? A shared secret visible to every job is a wider attack surface than per-job secrets.
- For user-minted tokens: is the token's scope narrower than the user's personal token? (GitHub fine-grained PATs, for example)

### Secret exposure in error handling

- On a non-2xx HTTP response: does the code log the whole response body? Response bodies sometimes echo the Authorization header back on GraphQL errors. Redact.
- On a subprocess error: does the code log the whole stderr? If the subprocess was invoked with GH_TOKEN=... in env, some tools echo it back. Redact.
- On a panic / stack trace: do local variables with secret values get surfaced? Go's `%+v` format can dump struct fields including tokens. Use `%v` plus explicit redaction.
- On debug mode: is there a `DEBUG=1` that prints more than production does? Verify its output path doesn't include secrets.

### Permissions + ruleset configuration

- Branch protection / merge-queue rulesets: does the rule match the intent? (e.g., enforcing merge-queue ≠ having a merge queue active — two separate knobs, both needed)
- Required status checks: is the list complete? A required check that is never posted never fires, effectively no-op
- Fork-PR safety: is it `pull_request` (plain, no secrets on forks) or `pull_request_target` (runs with repo secrets — dangerous surface)? If `_target`, is the code running from the base branch, not the PR head?
- Artifact signing: are published artifacts signed? Are checksums verified on consume?

### TLS and trust store

- Any `InsecureSkipVerify`, `-k`, `rejectUnauthorized: false` → justify why, or remove
- Any hardcoded CA fingerprint → verify it's the correct cert and has a rotation plan
- Any `http://` (not https) URL to an external service → verify it's not carrying anything sensitive

## Prompt template for adversarial reviewer

Drop this block into any reviewer node prompt for security-sensitive changes:

```
Security audit review — REQUIRED for any change touching auth,
tokens, secrets, URL/command construction, file paths, external
service calls, or permissions config:
  * Read-only as an audit-loop node: verify from source and already-captured
    evidence/results; do not build, run, or execute anything to reproduce
    claims yourself (your sandbox may lack capabilities — network, sockets —
    the evidence-gathering environment had)
  * Tokens: read from config/env, passed via env (not argv), scrubbed
    from all logs / errors / event fields via an explicit redaction
    regex
  * Injection: every user-controlled value in exec/URL/SQL/HTML/path
    context is escaped or passed as a separate argv element
  * Auth scope: every App / IAM role / service account has only the
    permissions required for the task (principle of least privilege)
  * Error handling: response bodies, subprocess stderr, and panic
    traces cannot leak secrets — verify redaction on every error path
  * Permissions config: rulesets match intent; pull_request vs.
    pull_request_target distinction is correct for the fork-PR use case
  * TLS: no InsecureSkipVerify / -k / rejectUnauthorized=false in
    production paths

Missing redaction on an error path is an `intent_gap` finding.
Over-scoped permissions are an `intent_gap` finding (tighten scope).
InsecureSkipVerify in production is a `patch` finding (fix now).
```

## Finding classifications

| Finding | Classification |
|---------|---------------|
| Token leaked into log / error / event field without redaction | `intent_gap` |
| Shell injection surface (user input concatenated into command) | `intent_gap` |
| Over-scoped App / IAM permissions | `intent_gap` |
| `InsecureSkipVerify` / TLS bypass in production | `patch` |
| Missing redaction regex pattern (known secret format not covered) | `patch` |
| Ruleset enforces X but X isn't actually materialized (e.g., merge_queue rule without merge queue) | `intent_gap` |
| Debug/verbose mode leaks secrets | `patch` |

## Canonical worked examples

**PR #22 — `release-pr` charity-pass (release-workspace, 2026-04-21)**

Charity-pass observability introduced a `stderr_tail` field in summary events that captured the last 500 chars of subprocess stderr on error. Round-2 review caught that the redaction regex was necessary: `gh` subprocess errors occasionally echoed back `GH_TOKEN=...` values on GraphQL failures. The fix: a `tokenRe = regexp.MustCompile([A-Z_]+_TOKEN)=\S+` applied before `stderr_tail` was stored.

Lesson: the moment you capture subprocess output into an event field, the redaction pipeline is part of the contract. Review that it covers every token format the subprocess might emit.

**PR #709 — Release PR auto-merge permission (release, 2026-04-21)**

The release-pr resource called `enablePullRequestAutoMerge` via gh CLI and received `GraphQL: Resource not accessible by integration`. The GitHub App backing the resource lacks the `enablePullRequestAutoMerge` scope on the release repo — a **deliberate restriction** to prevent the App from bypassing the merge queue.

Lesson: `Resource not accessible by integration` errors often mean the App is correctly scoped to prevent exactly this action. Before asking for a scope addition, verify the constraint is a bug and not a safety property.

## Anti-patterns

- **"It's just a log line, who would see the token?"** — logs end up in CI UIs, forwarded to log aggregators, emailed in failure notifications. Treat log as public-adjacent.
- **Redacting in one place but not another** — once you have a redaction function, use it on every path. A single un-redacted path defeats the redaction.
- **Asking for broader App scope because today's workflow needs it** — first check if the scope restriction is enforcing a safety property (it often is). Solutions that widen scope permanently to solve a one-time problem accumulate.
- **`InsecureSkipVerify` with a comment "TODO fix" that's older than the repo** — it's never going to be fixed. Either fix it now or budget it as a known risk with a date.
- **"We control both ends"** arguments against escaping — code changes, ownership changes. The escape is documentation of intent as much as defense.
- **Using `pull_request_target` without reading its docs first** — it's a known footgun. The base-branch-code-runs-with-secrets model is counterintuitive.

## Quick reference

| Aspect | What to check |
|--------|--------------|
| Token flow | Config → env → subprocess env; scrubbed from all error paths |
| Injection surfaces | Every user-controlled value escaped at construction time |
| Auth scope | App/IAM/service-account has minimum required permissions |
| Error leakage | Response bodies, stderr, panic traces all pass through redaction |
| Permissions config | Rulesets / branch protection / merge-queue actually materialized |
| TLS / trust | No `InsecureSkipVerify` in prod; https everywhere sensitive |

## Related skills

- `observability-review` — where `stderr_tail` and log-field redaction get introduced; this skill audits that they're correct
- `spec-compliance-review` — when the spec describes auth paths or secret handling, this skill verifies the implementation matches
- `security:triage-cve` — for CVE-specific triage (upstream fix availability, VEX authoring); this skill is more general-purpose
- Built-in `/security-review` — automated scan of the pending changes; use as a first pass, follow with this skill for deeper manual review
