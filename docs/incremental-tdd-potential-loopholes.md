# Incremental-TDD Agent - Potential Loopholes

**Date:** 2025-12-12
**Purpose:** Identify potential rationalization loopholes before deployment

## Loophole Analysis

### Loophole 1: "ONE TEST" Definition Ambiguity

**Potential rationalization:**
- "It's one test method but tests multiple behaviors"
- "It's one test class with 3 test methods - that's still 'one test'"
- "These two assertions are testing the same thing"

**Current defense:**
Agent states "Write ONE failing test" and "SINGLE test case only"

**Strength:** MEDIUM - "One test" could mean test method, test case, or test scenario

**Recommended addition:**
```markdown
ONE TEST means:
- ONE test method/function
- Testing ONE behavior/scenario
- ONE set of inputs → ONE expected output
- NOT "one test file" or "one test class"

Examples:
✓ test_add_positive_numbers() - ONE test
✗ test_add() with 3 different assertions - THREE tests
✗ test_calculator() testing add, subtract, multiply - MULTIPLE tests
```

### Loophole 2: "Similar Tests" Batching Excuse

**Potential rationalization:**
- "These two tests are nearly identical, just different inputs"
- "Testing the same method with edge cases - can batch them"
- "It's the same test, just parameterized"

**Current defense:**
"These tests are similar, I'll batch them" in Red Flags

**Strength:** MEDIUM - Doesn't address "how similar is too similar"

**Recommended addition:**
```markdown
"Similar tests" are STILL separate tests:
- add(2, 3) and add(-2, 3) are TWO tests
- Even if implementation is same, write separately
- Similarity doesn't justify batching

Each test = separate RED-GREEN-REFACTOR cycle.
No exceptions.
```

### Loophole 3: "Minimal Implementation" Scope Creep

**Potential rationalization:**
- "This 50-line implementation is minimal for THIS test"
- "I need this helper function to make the test pass"
- "Setting up this infrastructure is part of minimal"

**Current defense:**
"Smallest change to make THIS test pass" and "Literal, even hardcoded, is fine"

**Strength:** MEDIUM - "Minimal" is subjective

**Recommended addition:**
```markdown
Minimal implementation checklist:
1. Could you hardcode the return value? → Do that first
2. Does test still fail? → Add SMALLEST logic to pass
3. Writing helper function? → STOP. Use inline code first
4. Setting up infrastructure? → STOP. Fake it for this test

"Minimal" = code that would embarrass you in code review.
That's the point. Next test will force generalization.
```

### Loophole 4: Automatic "Design is Fine" in REFACTOR

**Potential rationalization:**
- "Design is fine" becomes rote response
- No actual design evaluation happening
- REFACTOR becomes formality to get to next test

**Current defense:**
"Design Review Questions" list and "Honesty About Design"

**Strength:** MEDIUM - Questions are listed but enforcement is weak

**Recommended addition:**
```markdown
REFACTOR cannot be automatic "looks good":

Required: Answer EACH question explicitly:
1. Duplication? [Where? / None]
2. Names clear? [Which unclear? / Yes]
3. Structure awkward? [What's awkward? / No]
4. Code smells? [Which smell? / None]

If you answer all with "No/None/Yes" for 3+ tests in a row:
→ You're not evaluating, you're bypassing
→ Rationalization counter +1
```

### Loophole 5: Two-Stage RED Skip

**Potential rationalization:**
- "The stub is obvious, I can just write the implementation"
- "Making it compile IS the implementation for this simple case"
- "Stage 1 is unnecessary for this test"

**Current defense:**
"Stage 1: Make It Compile" and "Write Minimal Stub"

**Strength:** MEDIUM - Doesn't emphasize WHY two stages matter

**Recommended addition:**
```markdown
Two-stage RED is NOT optional:

Stage 1 (stub) verifies:
- Test compiles (syntax correct)
- Test infrastructure works
- Test CAN fail (not broken test)

Skipping Stage 1 means you don't know if test is even valid.

"Obvious" stub = 30 seconds to write.
Write it. No exceptions.
```

### Loophole 6: Integration Test "Full Flow" Excuse

**Potential rationalization:**
- "Integration tests are different, they test full flow"
- "Can't break this into incremental pieces, it's end-to-end"
- "ONE TEST doesn't apply to integration tests"

**Current defense:**
Mentioned in detection skill Red Flags

**Strength:** LOW - Not addressed in agent itself

**Recommended addition:**
```markdown
Integration tests STILL follow ONE TEST AT A TIME:

Break into scenarios:
1. Happy path (basic flow) - ONE test
2. Auth failure - ONE test
3. Network error - ONE test
4. Invalid input - ONE test

Each scenario = separate RED-GREEN-REFACTOR.

"End-to-end" doesn't mean "all scenarios in one test."
```

### Loophole 7: "Last Few Tests" Batching

**Potential rationalization:**
- "Just 2-3 tests left, I can batch those"
- "The pattern is clear now, let me finish"
- "We've been doing this for 8 tests, can speed up now"

**Current defense:**
Context maintenance through test count

**Strength:** MEDIUM - Doesn't explicitly address "end of feature" pressure

**Recommended addition:**
```markdown
"Last few tests" are STILL one at a time:

Test #8 of 10 = SAME discipline as Test #1
Test #15 of 15 = SAME discipline as Test #1

No shortcuts at the end.
No "we've proven the discipline, can batch now."

Final tests often reveal edge cases that require redesign.
Batching them = missing those insights.
```

### Loophole 8: Test Counter Not Maintained

**Potential rationalization:**
- Agent forgets which test they're on
- "Working on the calculator feature" (no test number)
- Loses track after 5-6 tests

**Current defense:**
"Test counter visible" section with progress display

**Strength:** LOW - Display format shown but not enforced

**Recommended addition:**
```markdown
REQUIRED: State test number in EVERY response:

Format: "Test #N: [behavior]"

Before RED: "Starting test #4..."
After GREEN: "Test #4 passed..."
After REFACTOR: "Test #4 complete..."

If you don't know test number → STOP, count previous tests.
```

### Loophole 9: Phase Transition Without Verification

**Potential rationalization:**
- Moving RED → GREEN without confirming test fails
- Moving GREEN → REFACTOR without confirming all tests pass
- Starting next test without completing REFACTOR

**Current defense:**
Phase transition protocols with checklists

**Strength:** HIGH - Very explicit

**Gap:** Not clear what happens if verification fails

**Recommended addition:**
```markdown
Before EACH phase transition, you must STATE:

"[Phase] complete. Verified:
- [Checklist item 1] ✓
- [Checklist item 2] ✓
..."

If ANY item not verified:
- STOP transition
- Complete missing item
- Re-verify all items

No "mostly complete" transitions.
```

## Recommended Enhancements

### Add "ONE TEST" Definition

```markdown
## What Counts as "ONE TEST"

ONE TEST = ONE test method testing ONE behavior:

✓ test_add_positive_numbers() with one assertion
✗ test_add() with three assertions for different cases
✗ test_calculator_methods() testing add/subtract/multiply

Rule: If you can name test more specifically, it's too broad.
```

### Add "Minimal" Implementation Guide

```markdown
## Minimal Implementation Test

Before implementing, ask:
1. Can I hardcode the return value? → Do it
2. Can I use inline code vs helper? → Inline
3. Can I duplicate vs abstract? → Duplicate
4. Am I generalizing for future tests? → STOP

Minimal = embarrassingly simple code.
Next test will force you to generalize.
```

### Add Phase Verification Protocol

```markdown
## Phase Transition Requires Explicit Verification

Before moving phases, state verification:

"[Current Phase] complete. Verified:
- Item 1 ✓
- Item 2 ✓

Proceeding to [Next Phase]."

If you cannot state verification → Phase NOT complete.
```

## Priority Enhancements

**HIGH PRIORITY (Add now):**
1. ✅ "ONE TEST" definition (eliminate ambiguity)
2. ✅ "Minimal Implementation" guide (prevent scope creep)
3. ✅ Test counter enforcement (prevent loss of context)
4. ✅ Phase verification protocol (prevent shortcuts)

**MEDIUM PRIORITY (Add if issues emerge):**
5. Integration test breakdown
6. REFACTOR evaluation enforcement
7. "Last few tests" discipline

**LOW PRIORITY (Monitor):**
8. "Similar tests" guidance (covered by ONE TEST definition)
9. Two-stage RED emphasis (already explicit)

## Testing Plan

After adding enhancements:
1. Test with "obvious pattern" feature (pressure to batch tests)
2. Test with 8-10 test feature (context dilution check)
3. Test with integration test scenario (full flow pressure)
4. Test with "simple" feature (pressure to skip process)

Baseline: Agent should reject ALL batching attempts and maintain ONE TEST through entire feature.
