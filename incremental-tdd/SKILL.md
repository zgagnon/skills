---
name: incremental-tdd
description: Use when implementing features or refactoring with TDD - enforces writing ONE test at a time, implementing minimal code to pass, then repeating, preventing batch test writing that defeats incremental design discovery
---

# Incremental TDD

## Overview

**Write ONE test. Make it pass. Repeat.**

TDD is not "write all tests, then implement." It's an incremental cycle where each test teaches you what to build next.

**Core principle:** Writing tests in batch defeats the design discovery benefit of TDD.

## The Iron Law

```
ONE FAILING TEST AT A TIME
```

Write a single failing test → Implement minimal code to pass → Refactor if needed → Write NEXT failing test.

**No exceptions:**
- Not "write a few failing tests"
- Not "cover main scenarios first"
- Not "write comprehensive test suite then implement"
- ONE failing test, make it pass, then next failing test

**Clarification:** Having multiple GREEN (passing) tests is fine. The rule is about FAILING tests. Only write ONE failing test at a time.

## The Cycle

```
1. Write ONE simple test (simplest case)
2. Run ALL tests - watch the new one fail (RED)
3. Write minimal code to pass (GREEN)
4. Run ALL tests - verify all pass (still GREEN)
5. Refactor if needed (REFACTOR)
6. Run ALL tests - verify still passing
7. Commit
8. GOTO 1 for next test
```

**IMPORTANT: Always run ALL tests, not just the one you're working on.**

This catches regressions immediately. If you only run the current test, you won't notice if your changes broke existing functionality.

## Why One Test at a Time Matters

**The REFACTOR step is where design emerges.**

When you write ONE test at a time:
1. RED: Write one failing test
2. GREEN: Minimal code to pass
3. **REFACTOR: Evaluate the emerging design, improve it**
4. Now you understand the design → inform next test

**Critical insight:** After each test passes, you can evaluate the design and discover what's next. Writing 3-5 tests at once commits you to a design before seeing what you need.

❌ **Batch**: Write 5 tests → implement everything
✓ **Incremental**: Write ONE test → implement → evaluate → next test

## Quick Reference

| Situation | Action |
|-----------|--------|
| Starting TDD task | Write ONE simplest test, run ALL tests (RED) |
| Test passes | Run ALL tests, refactor if needed, write NEXT test |
| Refactoring existing code | ONE test for simplest case first |

## Common Rationalizations (All Wrong)

| Excuse | Reality |
|--------|---------|
| "Need comprehensive coverage upfront" | Build incrementally, one test at a time. |
| "Senior engineer/best practices say all tests first" | Incremental TDD IS best practice. |
| "Let me plan all test cases first" | Planning ≠ writing. Write ONE, discover next. |
| "It's urgent, batch for speed" | Incremental is FASTER. Prevents over-engineering. |
| "This is simple, I know what I need" | You think you know. Write ONE, you'll learn. |
| "I'll write 3-4 main scenarios" | That's batch testing. Write ONE. |
| "Run single test for speed, full suite later" | Regressions happen NOW. Always run all tests. |
| "Production urgent, skip full test run" | Breaking more under pressure makes it worse. Run all tests. |

**Seeing yourself in this table? Write ONE test. Stop rationalizing.**

## Red Flags - You're Doing Batch TDD

**STOP if you:**
- Write more than one FAILING `test()` / `it()` block before implementing
- Think "let me cover the main scenarios" and write them all
- Plan out all test cases AND write them all at once
- Write multiple failing tests numbered test1, test2, test3

**All of these mean: Keep only ONE failing test. Comment out or delete the rest. Make it pass. Then uncomment/write the next one.**

## Integration with RED-GREEN-REFACTOR

This skill enforces the incremental nature of RED-GREEN-REFACTOR:

1. **RED**: Write ONE failing test
2. **GREEN**: Minimal code to pass THAT test
3. **REFACTOR**: Clean up if needed
4. **Repeat**: Write NEXT test

You cannot skip step 2 (implementing) by writing multiple tests in step 1.

## The Bottom Line

**TDD means ONE test at a time.**

Not "tests first, then code." Not "batch of tests, then batch of code."

One test → Implementation → Next test.

That's the cycle. Follow it.
