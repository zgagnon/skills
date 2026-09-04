---
disable-model-invocation: true
name: testing-review
description: Use when reviewing a test harness for adequacy — post-implementation (adversarial review), as an audit-loop reviewer node, or pre-spec to verify that planned coverage reaches every acceptance criterion. Classifies tests as outside-in vs unit, and flags structural blind spots that let green tests miss real regressions.
---

# Testing Review

Testing gaps found in adversarial review are fix-loop iterations. Testing adequacy in the spec is free. This skill encodes a discipline for reviewing test harnesses: does the harness exercise every acceptance criterion through the artifact's real interface, and would it catch a production regression that a user would notice?

## When to invoke

- **Pre-spec:** Verify that the planned harness covers every acceptance criterion before agents implement
- **Post-implementation (adversarial review):** Reviewing a harness for outside-in correctness and structural blind spots
- **Audit-loop reviewer node:** Include testing adequacy as a first-class review axis in reviewer node prompts

**Audit-loop reviewers are read-only.** When invoked as an independent audit-loop reviewer node (parallel review fan-out, typically its own sandbox), verify coverage claims by reading the harness source and already-captured evidence/results artifacts. Do not build, run, execute, or make network/socket calls to reproduce results yourself — your sandbox may have different capabilities (network, filesystem, socket permissions) than the environment that produced the evidence, so an execution failure there is not evidence of a defect in the artifact under review. This includes the "harness passes before implementation exists" check below: verify it from prior recorded results, don't re-run the harness against a blank scaffold yourself.

## Red flags (cheap checks — stop if any are true)

- [ ] Tests import internal packages of the artifact under review
- [ ] Test-only seam in production code (`GH_API_BASE`, `TEST_MODE`, or similar env var / flag)
- [ ] Faked LLM responses — locks tests to wording, breaks on every model update
- [ ] Assertions on reply wording when a downstream side-effect is the correct check
- [ ] `t.Skip`, `skip`, or `xit` hiding an unimplemented scenario
- [ ] Hand-written fixtures not captured from the real service
- [ ] `sleep N` as a readiness check
- [ ] Harness passes before the implementation exists (proves the harness isn't asserting enough)

## Checklist (deeper)

### Acceptance criterion coverage

- Does every acceptance criterion from the spec map to at least one harness test?
- Can you name the test that would catch a regression in each criterion?
- **Good:** a scenario table in the harness maps 1:1 with spec bullets
- **Bad:** criteria covered only by unit tests that don't exercise the full artifact path

### Outside-in classification

- Classify each test: *outside-in* (exercises the built artifact through its public interface) or *unit* (exercises internal code directly)
- Outside-in: invoke the binary, daemon, or endpoint; assert on stdout, stderr, exit code, files, or downstream effects
- Unit: call a function directly; assert on return values and state
- Both categories are valid; a harness that mixes them — calling internals from a harness script — is neither
- **Red flag:** any `import` of `artifact/internal/...` in a file tagged as a harness test

### Harness fidelity — does it exercise real dep chains?

- Does the harness exercise the same runtime dep chains production does?
- Tape-driven or DNS-fake approaches replace network calls but do not expose runtime subprocess dependencies
- Ask: "What does the binary actually exec, shell out to, or require at runtime?" Each is a potential blind spot if the fake doesn't exercise it
- **Good:** fake replaces the network service; the binary still invokes the real subprocess chain underneath
- **Bad:** tape fake replaces the binary's entire runtime, hiding that the binary requires `git`, `gh`, or another tool at runtime

### Representative scenario coverage

- Does the harness cover the scenarios that distinguish production state from local dev?
- Ask: "What production configuration is absent from this harness?" Each gap is a class of hidden failures
- **Good:** harness provisions merge-queue config (or equivalent) when the feature exercises a merge-queue path
- **Bad:** smoke test runs with a minimal repo config that never exercises the production flow

### Fixture fidelity

- Were fixtures captured from the real service, or hand-written from imagination?
- Hand-written fixtures encode assumptions; the real service may behave differently
- For API fixtures: note the API version, capture date, and how they were obtained
- **Red flag:** fixtures under `testdata/` with no capture provenance, especially if field shapes look simplified

## Prompt template for adversarial reviewer

Drop this block into any reviewer node prompt when testing adequacy is a concern:

```
Testing review — REQUIRED for any artifact with a test harness:
  * Read-only: verify from source and already-captured evidence/results; do
    not build, run, execute, or reproduce results yourself (your sandbox may
    lack capabilities — network, sockets — the evidence-gathering environment
    had; an execution failure there is not a finding about the artifact)
  * Every acceptance criterion maps to at least one outside-in harness test —
    name the test that would catch each regression
  * Tests classified: outside-in (drives the artifact) vs unit (tests internals);
    no harness test imports artifact internal packages
  * No test seams in production code (TEST_MODE, *_API_BASE env vars, etc.)
  * Fixtures captured from real services, not hand-written from imagination
  * No sleep N for readiness — condition-based waiting only
  * No t.Skip / skip hiding unimplemented scenarios
  * Harness fails before the implementation exists (sanity check before spec)
  * Harness covers scenarios representative of prod state, not just local dev
    (e.g., merge-queue enabled, real subprocess dep chains exercised)

Testing gaps on a runnable artifact are `intent_gap` findings, not polish.
```

## Finding classifications

| Finding | Classification |
|---------|---------------|
| Acceptance criterion with no harness coverage | `intent_gap` |
| Harness test imports artifact internals | `intent_gap` |
| Test seam (`TEST_MODE`, `*_API_URL`) in production code | `intent_gap` |
| Harness passes before implementation exists | `intent_gap` |
| `t.Skip` / `skip` hiding unimplemented scenario | `intent_gap` |
| `sleep N` as readiness check | `intent_gap` |
| Hand-written fixture not captured from real service | `intent_gap` |
| Faked LLM response asserts on wording | `intent_gap` |
| Harness blind to runtime subprocess deps (tape hides dep chains) | `intent_gap` |
| Harness not representative of prod state (missing config) | `intent_gap` |
| Fixture field naming inconsistency vs real API | `polish` |

## Canonical worked examples

### PR #22 — Tape fake hides runtime dep chain

**release-pr out resource, release-workspace (2026-04-21)**

The fake-`gh` harness ran 108/108 tests green. What it didn't exercise: `gh` shells out to `git` at runtime. The sandbox image had `gh` but not `git`. Production runs failed immediately after deploy; the harness was structurally blind to it.

**Root cause:** The tape fake replaced `gh`'s network calls but not its subprocess dependencies. From the harness's perspective, `gh` "worked" — the `gh → git` dep chain was invisible.

**What a fidelity check would have caught:** "What does this binary exec at runtime?" → `git` → is `git` in the sandbox image? → No.

**Payoff of catching in review:** one sandbox image fix (`RUN apt-get install git`) before merge, instead of a deploy → incident → rollback cycle.

### PR #30 — Harness not representative of production state

**release-pr out resource, release-workspace (2026-04-21)**

103/103 tests green locally and in CI. The smoke test repo had no merge-queue configured. The feature being gated was the enqueue-to-merge-queue path. The harness never exercised the path it was supposed to gate.

**Root cause:** the harness was correct relative to its test repo, but the test repo wasn't representative of production. Merge-queue is an opt-in GitHub repo setting that was never provisioned in the test environment.

**What a representativeness check would have caught:** "Does the test scenario match production state?" → merge-queue path requires merge-queue config → is merge-queue configured in the smoke repo? → No.

**Payoff:** harness failure would have surfaced the missing scenario before the implementation was considered complete, rather than after deploy when the enqueue path was exercised for the first time.

---

Lead with PR #22 when teaching this review axis — it's the cleanest story: obvious fix, clear before/after, no special setup required to understand.

## Anti-patterns

- **Harness tests call artifact internals** — these are unit tests; the harness should drive the built artifact end-to-end through its public interface
- **Test seams in production code** — `GH_API_BASE`, `TEST_MODE`, and similar env vars mean the "tested" code path is not the "production" code path
- **Faking LLM responses** — locks tests to specific wording; a model update breaks the test without breaking the feature; assert on side effects instead
- **`sleep N` readiness** — works on a fast machine, fails on a slow one; condition-based waiting (poll for a log line, port open, or output file) is the fix
- **`t.Skip` in the harness** — a skip is a missing assertion, not a passing test; fix the implementation or delete the skip
- **Hand-writing fixtures** — if the real API returns a different shape, the harness passes but prod breaks; capture real responses
- **Harness passes before implementation** — means assertions are vacuous; add assertions until the harness fails against a blank implementation
- **Scenario coverage matches local dev, not prod** — tests that only pass because a prod feature (merge-queue, auth, rate-limiting) isn't configured are covering the wrong state space

## Quick reference

| Aspect | What to check |
|--------|--------------|
| Criterion coverage | Every spec bullet maps to a named harness test |
| Outside-in classification | No harness test imports `artifact/internal/...` |
| No test seams | No `TEST_*` / `*_API_URL` env vars in production code |
| Fixture fidelity | Fixtures captured from real service, not hand-written |
| Readiness | Condition-based waiting, not `sleep N` |
| Harness fails first | Harness is red against the unimplemented scaffold |
| Prod representativeness | Test scenario matches production config, not just local dev defaults |

## Related skills

- `writing-moab-harness` — the companion HOW skill. This skill asks *whether* a harness is adequate; `writing-moab-harness` teaches *how to write* one. Read that skill before authoring harness scripts, fixtures, fakes, or slice tests.
- `observability-review` — parallel review axis for runnable artifacts: wide summary events, correlation IDs, exit-path coverage. Often run alongside testing review in an audit-loop.
- `preparing-dark-factory` — where to put testing goals in the spec before pipeline composition; the "Write the Spec" section is the canonical home for the acceptance criterion table that this skill reviews against.
