# Deployment Checklist: Systematic-Debugging Hybrid Pattern

**Date:** 2025-12-12
**Skill:** systematic-debugging → hybrid agent pattern
**Checklist based on:** writing-skills/SKILL.md

## ✅ RED Phase - Write Failing Test

- [x] Create pressure scenarios (baseline failures documented)
- [x] Run scenarios WITHOUT skill - documented in `systematic-debugging-baseline-failures.md`
- [x] Identified 5 failure patterns:
  - Pattern 1: Proposing fixes without investigation
  - Pattern 2: Context dilution during multi-phase work
  - Pattern 3: Skipping test-first in Phase 4
  - Pattern 4: Multiple fixes without root cause
  - Pattern 5: Inadequate evidence gathering

## ✅ GREEN Phase - Write Minimal Skill

**Detection Skill (`dispatching-systematic-debugging/SKILL.md`):**
- [x] Name uses only letters, numbers, hyphens: `dispatching-systematic-debugging` ✓
- [x] YAML frontmatter with only name and description (304 chars, under 1024) ✓
- [x] Description starts with "Use when..." ✓
- [x] Description written in third person ✓
- [x] Keywords throughout for search (bugs, errors, test failures, etc.) ✓
- [x] Clear overview with core principle ✓
- [x] Addresses baseline failures (dispatch instead of propose fixes) ✓
- [x] Code inline with clear dispatch example ✓
- [x] Red flags section (all baseline rationalizations listed) ✓

**Process Agent (`agents/systematic-debugging-agent.md`):**
- [x] Agent identity statement (first section) ✓
- [x] Full 4-phase process maintained in agent context ✓
- [x] Rationalization counter (0/3 tracking) ✓
- [x] Phase checkpoints (explicit transition protocols) ✓
- [x] Addresses all 5 baseline patterns ✓

## ✅ REFACTOR Phase - Close Loopholes

- [x] Identified 7 potential loopholes in `systematic-debugging-potential-loopholes.md`
- [x] Added HIGH PRIORITY enhancements:
  - [x] Spirit vs Letter rule (no "I'm following the spirit" excuse)
  - [x] Evidence = observed behavior definition (not assumptions)
  - [x] Phase transition protocols (explicit verification before proceeding)
- [x] Re-verified agent addresses all baseline patterns with enhancements

## ✅ Quality Checks

- [x] Detection skill: Small (445 words, under 500 target) ✓
- [x] Quick reference in detection skill (How to Dispatch section) ✓
- [x] Common mistakes section (Red Flags) ✓
- [x] No narrative storytelling ✓
- [x] Agent as separate file (proper separation of concerns) ✓

## ✅ CSO Optimization

- [x] Name: `dispatching-systematic-debugging` (valid format) ✓
- [x] Description: 304 chars (under 500 recommended) ✓
- [x] Description: Starts with "Use when..." ✓
- [x] Description: Third person ✓
- [x] Keywords: 11/12 found (bugs, test failures, errors, unexpected behavior, performance problems, dispatches, enforces, 4-phase, root cause, investigation, systematic) ✓
- [x] Word count: 445 words (under 500 target) ✓

## 🔄 Deployment (In Progress)

- [ ] Update using-superpowers skill to reference dispatch pattern (if applicable)
- [ ] Commit to git with clear message
- [ ] Update discovery tree (mark story complete)
- [ ] Document in README or skill index

## 📊 Success Metrics (To Measure Later)

| Metric | Baseline | Target | Method |
|--------|----------|--------|--------|
| Process adherence | ~60% | 95%+ | Test with debugging scenarios |
| Re-work rate | ~25% | <5% | Track re-implementations |
| Manual refreshes | 3-5/session | 0 | Count reminder prompts |
| Context retention | Fails at 30+ calls | Maintains through 50+ | Long session test |

## 🧪 Testing Plan (Future)

1. **Test with "obvious bug" scenario**
   - Pressure: Fix seems clear
   - Expected: Agent refuses to skip Phase 1

2. **Test with multi-component system**
   - Pressure: Skip instrumentation
   - Expected: Agent requires evidence gathering

3. **Test with "simple fix" scenario**
   - Pressure: Skip test
   - Expected: Agent enforces failing test first

4. **Test with 30+ tool call session**
   - Pressure: Context dilution
   - Expected: Agent maintains full process

## 📝 Files Created

1. `/Users/zell/.claude/skills/dispatching-systematic-debugging/SKILL.md` (detection skill)
2. `/Users/zell/.claude/skills/agents/systematic-debugging-agent.md` (process agent)
3. `/Users/zell/.claude/skills/docs/systematic-debugging-baseline-failures.md` (RED phase)
4. `/Users/zell/.claude/skills/docs/systematic-debugging-potential-loopholes.md` (REFACTOR phase)
5. `/Users/zell/.claude/skills/docs/skill-to-agent-conversion-design.md` (design doc)
6. This checklist

## ✅ TDD Compliance

- [x] Followed RED-GREEN-REFACTOR cycle
- [x] Documented baseline behavior BEFORE writing skills
- [x] Addressed specific failure patterns (not hypothetical)
- [x] Closed identified loopholes
- [x] Ready for real-world testing

**Status:** REFACTOR phase complete. Ready for deployment and real-world testing.
