---
disable-model-invocation: true
name: spec-compliance-review
description: Use when reviewing an implementation against its spec, plan, or written brief — during adversarial review post-implementation, as an audit-loop reviewer node in a pipeline, or at spec-time to self-audit for internal consistency. Maps each spec clause to code evidence and flags drift.
---

# Spec Compliance Review

The spec is the contract. The code is the claim. The reviewer's job is to prove every clause of the contract is honored by the claim — and to catch when the contract itself disagrees with itself.

## When to invoke

- **Post-implementation (adversarial review):** Verify every spec requirement has an implementation and vice versa
- **Audit-loop reviewer node:** Include spec compliance as a first-class review axis whenever there IS a spec
- **Spec-time self-audit:** Before spec freezes, check for internal contradictions (section A says X, section B implies not-X)

**Audit-loop reviewers are read-only.** When invoked as an independent audit-loop reviewer node (parallel review fan-out, typically its own sandbox), map requirements to code by reading, not by building or executing anything. Your sandbox may have different capabilities (network, filesystem, socket permissions) than the environment that produced any evidence pack you're given — an execution failure in your own sandbox is not evidence of a spec-compliance defect. The "Run the check" instruction below applies to a reviewer with same-environment access (e.g. post-implementation adversarial review); as an audit-loop node, verify claims against already-captured evidence/results artifacts instead.

**Skip when:** the work is truly exploratory and has no written intent to verify against. If there's even a PR body or task brief, use it as the spec.

## Red flags (cheap checks — stop if any are true)

- [ ] Spec describes a behavior, code has no evidence of that behavior
- [ ] Code does something the spec doesn't mention (unstated capability)
- [ ] Spec contains two sections that contradict each other
- [ ] PR body claims something the code doesn't do (claim drift)
- [ ] Commit message describes scope A, diff shows scope A+B
- [ ] Spec uses "probably", "maybe", "we might want to" — the requirement is not verifiable

## Checklist (deeper)

### Requirement-to-evidence mapping

- Does every spec requirement map to a file and line number in the code?
- Is the mapping documented in the review (not just felt)?
- Are there requirements with no corresponding code? → `intent_gap`
- Are there code paths with no corresponding requirement? → note for `bad_spec` or `reject`

### Spec-vs-code drift

- Does the code do exactly what the spec describes, nothing more, nothing less?
- If the spec describes API shape, does the code match field-by-field?
- If the spec describes error handling, does the code implement every branch?
- If the spec describes log lines or events, do they emit with the exact keys and values named?

### Spec-internal drift

- Does §N use the same terms as §M?
- Do enumerations in two sections list the same members?
- Do examples in one section match the rules defined in another?
- If the spec lists "required fields", does every section referring to those fields list the same set?

### Claim-vs-code drift (PR body / commit messages)

- Does the PR body's scope list match the diff?
- Does the commit message describe what the commit actually does?
- Are any claims ("X is verified", "Y passes") falsifiable with a quick check? Run the check if you have same-environment access; otherwise verify against already-captured evidence/results artifacts (see the audit-loop note above).

### Open-language red flags in the spec itself

- "probably X" → ambiguity. Flag as `bad_spec` if reviewing a spec before implementation.
- "either A or B" (with no criterion for picking) → unverifiable. Flag.
- "we might want to" → not a requirement. Flag.
- "Handle edge cases" → not a requirement. Every edge case needs to be named.

## Prompt template for adversarial reviewer

Drop this block into any reviewer node prompt when a spec exists:

```
Spec compliance review — REQUIRED whenever a spec, plan, or PR body
exists:
  * Read-only as an audit-loop node: verify from source and already-captured
    evidence/results; do not build, run, or execute anything to reproduce
    claims yourself (your sandbox may lack capabilities — network, sockets —
    the evidence-gathering environment had)
  * For each spec clause, cite the file and line where the code
    implements it. If no evidence exists, it is a finding.
  * For each code change, cite the spec clause it fulfills. If none
    exists, it is either unstated capability (bad_spec) or out-of-scope
    (reject).
  * Check for spec-internal drift: does §N agree with §M?
  * Check PR body / commit messages against the diff: does the claim
    match the work?
  * Fuzzy language in the spec itself ("probably", "maybe", "might") is
    a bad_spec finding on the spec author, not the implementer.

Missing requirement in code is an `intent_gap` finding. Unstated
capability in code is a `bad_spec` finding. Spec-internal contradiction
is a `bad_spec` finding.
```

## Finding classifications

| Finding | Classification |
|---------|---------------|
| Spec requirement has no code evidence | `intent_gap` |
| Code has capability the spec doesn't describe | `bad_spec` (specify the spec) or `reject` (drop the capability) |
| Spec §N contradicts spec §M | `bad_spec` |
| PR body claim doesn't match the diff | `patch` (fix the body) |
| Spec uses "probably" / "maybe" / "might" | `bad_spec` |
| Field naming inconsistency across code and spec | `patch` |
| Scope boundary violated (code does more than spec permits) | `intent_gap` |

## Canonical worked example

**PR #22 — `release-pr` charity-pass observability, release-workspace (2026-04-21)**

Round-2 adversarial review caught a classic **spec-internal drift**:

- Spec §3.5 defined the summary event with 24 required fields
- Spec §10 (Observability Assertions) listed only 10 required fields
- Harness assertion matched §10's weaker check

The implementation was correct against §3.5, and the harness was correct against §10 — but §10 and §3.5 disagreed. The finding was `bad_spec`: both the spec and the harness needed to line up with §3.5's 24 fields.

The lesson: when reviewing against a spec, read ALL of it and check it agrees with itself. Internal drift in a multi-section spec is common and creates "which source of truth?" ambiguity that silently propagates into implementations and tests.

## Anti-patterns

- **Taking the PR body's word for what the code does** — you have to read the diff. "Claim X is verified" requires you to verify it.
- **Walking the code and asking "does this look right?"** — start from the spec and ask "is every clause implemented?" The direction matters: spec→code catches missing implementations; code→spec catches unstated capabilities. You need both.
- **Skipping spec-internal drift** — "they probably agree" often means they don't
- **Letting fuzzy spec language pass** — "probably X" in the spec means implementers guess; guesses diverge; reviewers can't verify. Flag fuzzy language as a spec-level finding before implementation starts.
- **One-sided review** — checking only that the spec is fulfilled, not that the code is within scope. Unstated capability is a drift signal.

## Quick reference

| Aspect | What to check |
|--------|--------------|
| Spec → code | Every clause mapped to file + line |
| Code → spec | Every change explained by a clause |
| Internal drift | §N ↔ §M agreement on shared concepts |
| Claim drift | PR body / commit message vs. diff |
| Fuzzy language | "probably", "maybe", "might" flagged as `bad_spec` |

## Related skills

- `observability-review` — review axis specific to observability, invoked alongside this one for runnable artifacts
- `preparing-dark-factory` — teaches how to write specs that are reviewable in the first place (reduces "probably X" surface)
