# Deployment Checklist: Incremental-TDD Hybrid Pattern

**Date:** 2025-12-12
**Skill:** incremental-tdd → hybrid agent pattern
**Checklist based on:** writing-skills/SKILL.md

## ✅ RED Phase - Write Failing Test

- [x] Create pressure scenarios (baseline failures documented)
- [x] Run scenarios WITHOUT skill - documented in `incremental-tdd-baseline-failures.md`
- [x] Identified 7 failure patterns:
  - Pattern 1: Writing Multiple Failing Tests (batch testing)
  - Pattern 2: Skipping Two-Stage RED (compile → fail)
  - Pattern 3: Batch Implementation
  - Pattern 4: Skipping REFACTOR Phase
  - Pattern 5: Context Dilution Through Multiple Cycles
  - Pattern 6: "Simple Feature" Excuse
  - Pattern 7: Integration Test Bypass

## ✅ GREEN Phase - Write Minimal Skill

**Detection Skill (`dispatching-incremental-tdd/SKILL.md`):**
- [x] Name uses only letters, numbers, hyphens: `dispatching-incremental-tdd` ✓
- [x] YAML frontmatter with only name and description ✓
- [x] Description starts with "Use when..." ✓
- [x] Description: 286 chars (under 500 recommended) ✓
- [x] Description written in third person ✓
- [x] Keywords throughout for search (implementing, features, TDD, testing, incremental, etc.) ✓
- [x] Clear overview with core principle (ONE TEST AT A TIME) ✓
- [x] Addresses baseline failures (dispatch instead of batch tests) ✓
- [x] Code inline with clear dispatch example ✓
- [x] Red flags section (all baseline rationalizations listed) ✓

**Process Agent (`agents/incremental-tdd-agent.md`):**
- [x] Agent identity statement (first section) ✓
- [x] Full RED-GREEN-REFACTOR process maintained in agent context ✓
- [x] Rationalization counter (0/3 tracking) ✓
- [x] Phase checkpoints (explicit transition protocols) ✓
- [x] Addresses all 7 baseline patterns ✓

## ✅ REFACTOR Phase - Close Loopholes

- [x] Identified 9 potential loopholes in `incremental-tdd-potential-loopholes.md`
- [x] Added HIGH PRIORITY enhancements:
  - [x] "ONE TEST" definition (eliminated ambiguity)
  - [x] "Minimal Implementation" guide (prevents scope creep)
  - [x] Test counter enforcement (prevents loss of context)
  - [x] Phase verification protocol (prevents shortcuts)
  - [x] REFACTOR evaluation enforcement (explicit answers required)
  - [x] "Last few tests" discipline (no shortcuts at end)
  - [x] Integration test guidance (break into scenarios)
- [x] Re-verified agent addresses all baseline patterns with enhancements

## ✅ Quality Checks

- [x] Detection skill: Small (~450 words, under 500 target) ✓
- [x] Quick reference in detection skill (How to Dispatch section) ✓
- [x] Common mistakes section (Red Flags) ✓
- [x] No narrative storytelling ✓
- [x] Agent as separate file (proper separation of concerns) ✓

## ✅ CSO Optimization

- [x] Name: `dispatching-incremental-tdd` (valid format) ✓
- [x] Description: 286 chars (under 500 recommended) ✓
- [x] Description: Starts with "Use when..." ✓
- [x] Description: Third person ✓
- [x] Keywords: implementing, features, functionality, TDD, testing, incremental, ONE test, batch, design discovery, discipline, cycles ✓
- [x] Word count: ~450 words (under 500 target) ✓

## 🔄 Deployment (Pending)

- [ ] Update using-superpowers skill to reference dispatch pattern (if applicable)
- [ ] Commit to git with clear message
- [ ] Update discovery tree (mark story complete)
- [ ] Document in README or skill index

## 📊 Success Metrics (To Measure Later)

| Metric | Baseline | Target | Method |
|--------|----------|--------|--------|
| ONE TEST discipline | ~60% (fails after test 3-4) | 95%+ | Test with multi-test features |
| Batch testing rate | ~40% | <5% | Count test batching attempts |
| REFACTOR skips | ~70% | <10% | Track design evaluation after tests |
| Context retention | Fails at 3-4 tests | Maintains through 10+ tests | Long feature test |

## 🧪 Testing Plan (Future)

1. **Test with "obvious pattern" feature**
   - Pressure: Pattern is clear, batch all tests
   - Expected: Agent refuses, enforces ONE TEST

2. **Test with 10-test feature**
   - Pressure: Context dilution after test 4-5
   - Expected: Agent maintains discipline through test 10

3. **Test with "simple feature"**
   - Pressure: "Too simple for TDD"
   - Expected: Agent enforces process for simple features

4. **Test with integration test**
   - Pressure: "Need to test full flow"
   - Expected: Agent breaks into incremental scenarios

## 📝 Files Created

1. `/Users/zell/.claude/skills/dispatching-incremental-tdd/SKILL.md` (detection skill)
2. `/Users/zell/.claude/skills/agents/incremental-tdd-agent.md` (process agent)
3. `/Users/zell/.claude/skills/docs/incremental-tdd-baseline-failures.md` (RED phase)
4. `/Users/zell/.claude/skills/docs/incremental-tdd-potential-loopholes.md` (REFACTOR phase)
5. This checklist

## ✅ TDD Compliance

- [x] Followed RED-GREEN-REFACTOR cycle
- [x] Documented baseline behavior BEFORE writing skills
- [x] Addressed specific failure patterns (not hypothetical)
- [x] Closed identified loopholes
- [x] Ready for real-world testing

**Status:** REFACTOR phase complete. Ready for deployment and real-world testing.
