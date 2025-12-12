# Incremental TDD - Baseline Failures (RED Phase)

**Date:** 2025-12-12
**Purpose:** Document known failure patterns when agents implement features WITHOUT incremental TDD enforcement

## Known Failure Patterns

### Pattern 1: Writing Multiple Failing Tests (Batch Testing)

**Symptom:** Agent writes 3-5 tests before implementing any code

**Example Rationalizations:**
- "Let me cover the main scenarios first"
- "I'll write tests for all edge cases, then implement"
- "These tests are similar, I can batch them"
- "Let me write comprehensive test coverage upfront"

**What gets skipped:** ONE test at a time discipline

**Why it matters:** Batch testing defeats incremental design discovery. Each test should inform implementation and reveal design insights. Writing all tests upfront locks you into assumptions before learning.

### Pattern 2: Skipping Two-Stage RED (Compile → Fail)

**Symptom:** Agent jumps directly from writing test to full implementation, skipping proper RED phase

**Two-Stage RED Process:**
```
Stage 1: Make it compile
- Write minimal stub that compiles
- Test should fail with "expected X but got undefined" or similar
- Confirms test infrastructure works

Stage 2: Make it fail for right reason
- If needed, adjust stub to fail correctly
- Confirms test is actually testing what you think
```

**Example Rationalizations:**
- "The test is simple, I can just implement it"
- "Making it compile is obvious, skipping to implementation"
- "I don't need a stub, I know what to write"

**What gets skipped:** Verification that test infrastructure works and test fails for expected reason

**Why it matters:** Tests that don't fail first might be broken or testing wrong thing. You never verified they can catch the bug.

### Pattern 3: Batch Implementation

**Symptom:** Agent implements multiple tests' requirements in one pass

**Example Behavior:**
- Writes Test 1, Test 2, Test 3
- Implements code that makes all three pass at once
- "I can see the pattern, let me implement it completely"

**Rationalizations:**
- "These are all testing the same feature"
- "The implementation is straightforward"
- "It's more efficient to implement them together"

**What gets skipped:** Learning from each RED-GREEN cycle

**Why it matters:** Each test reveals something. Batching hides insights until later when changes are more expensive.

### Pattern 4: Skipping REFACTOR Phase

**Symptom:** Agent moves to next test immediately after GREEN

**RED → GREEN → REFACTOR → (next test)**

**Example Rationalizations:**
- "The code works, let's move on"
- "Refactoring can wait until the feature is complete"
- "The design is fine, next test"
- "I'll refactor at the end"

**What gets skipped:** Design evaluation after each test

**Why it matters:** Design debt accumulates. Each skipped REFACTOR makes next test harder. By end of feature, refactoring becomes "massive change" instead of small adjustments.

### Pattern 5: Context Dilution Through Multiple Cycles

**Symptom:** Agent follows ONE TEST discipline for first 2-3 tests, then batches tests 4-6

**Timeline:**
- Test 1: ✅ Follows RED-GREEN-REFACTOR carefully
- Test 2: ✅ Still following process
- Test 3: ⚠️ Skips REFACTOR "to save time"
- Test 4-6: ❌ Writes all three tests at once, implements batch
- Test 7+: ❌ Process completely forgotten

**What happens:** Incremental-TDD instructions fade from context after 15-20 tool calls

**Why it matters:** Feature implementation typically requires 5-10+ tests. Process needs to stay enforced for entire feature, not just first few tests.

### Pattern 6: "Simple Feature" Excuse

**Symptom:** Agent sees feature as simple and skips incremental approach entirely

**Rationalizations:**
- "This is just a getter/setter, no need for incremental"
- "The implementation is obvious, I'll write it"
- "This feature is too simple for TDD"
- "Let me just implement this quickly"

**What gets skipped:** Entire RED-GREEN-REFACTOR cycle

**Why it matters:** "Simple" features reveal edge cases when you test them incrementally. Skipping process on "simple" features means you never verify they work and have poor test coverage.

### Pattern 7: Integration Test Bypass

**Symptom:** Agent writes unit tests incrementally but then writes full integration test in one shot

**Example:**
- Unit tests: ✅ Incremental, ONE at a time
- Integration test: ❌ "Let me test the full flow" (writes 1 big test)

**Rationalization:**
- "Integration tests are different, they need to test the whole flow"
- "I can't make this incremental, it's end-to-end"

**What gets skipped:** Breaking integration tests into incremental scenarios

**Why it matters:** Even integration tests benefit from incremental approach. Test happy path first, then edge cases one at a time.

## Context Dilution Timeline

Based on observed sessions implementing features:

| Test # | Tool Calls | Agent Behavior |
|--------|-----------|----------------|
| 1 | 0-5 | ✅ Follows RED-GREEN-REFACTOR carefully |
| 2 | 6-10 | ✅ Still following ONE TEST discipline |
| 3 | 11-15 | ⚠️ May skip REFACTOR, but still one test |
| 4-6 | 16-25 | ❌ Writes multiple tests, batches implementation |
| 7+ | 26+ | ❌ Process completely forgotten, writes full remaining feature |

## Pressure Combinations That Trigger Failures

1. **Obvious implementation + Confidence** → Skip ONE TEST discipline
2. **Time pressure + "Simple feature"** → Batch all tests upfront
3. **Similar test cases + Pattern recognition** → Implement multiple tests together
4. **Integration testing + End-to-end mindset** → Write single large test instead of incremental scenarios
5. **Long feature implementation + Context dilution** → Forget discipline after test 3-4

## Success Criteria for GREEN Phase

Agent must:
1. ✅ Write ONE failing test at a time (never batch tests)
2. ✅ Follow two-stage RED (compile → fail correctly)
3. ✅ Implement minimal code to make THAT test pass
4. ✅ REFACTOR after each GREEN (evaluate design)
5. ✅ Maintain discipline through 10+ test cycles without context dilution
6. ✅ Apply incremental approach even to "simple" features
7. ✅ Break integration tests into incremental scenarios

## Notes

These patterns were identified from:
- Previous feature implementations where tests were batched
- Known failure modes in incremental-tdd skill usage
- Observation of context dilution during multi-test features
- Pattern from systematic-debugging conversion (context fades after 20+ calls)

The hybrid agent pattern should address all of these by keeping the ONE TEST AT A TIME principle in agent's identity throughout execution, not as external instructions that fade from context.
