# Systematic Debugging - Baseline Failures (RED Phase)

**Date:** 2025-12-12
**Purpose:** Document known failure patterns when agents debug WITHOUT skill enforcement

## Known Failure Patterns

### Pattern 1: Proposing Fixes Without Investigation

**Symptom:** Agent immediately suggests fixes upon seeing error

**Example Rationalizations:**
- "The error message is clear, let me fix it"
- "I can see the problem, it's obviously X"
- "This is a simple bug, no need for full investigation"
- "Let me try this fix and see if it works"

**What gets skipped:** Entire Phase 1 (Root Cause Investigation)

### Pattern 2: Context Dilution During Multi-Phase Work

**Symptom:** Agent starts following process but forgets after 20+ tool calls

**Example Behavior:**
- Phase 1: Follows investigation steps carefully
- Phase 2: Still somewhat following
- Phase 3: Proposes hypothesis without completing Phase 2
- Phase 4: Writes fix without failing test

**What happens:** Skill instructions fade from context, agent reverts to "quick fix" mode

### Pattern 3: Skipping Test-First in Phase 4

**Rationalization:**
- "I understand the fix now, let me implement it"
- "The test would be simple, let me write the fix first"
- "I'll verify manually instead of writing a test"

**What gets skipped:** Creating failing test case before implementing fix

### Pattern 4: Multiple Fixes Without Root Cause

**Symptom:** Agent tries fix #1, fails, tries fix #2, fails, tries fix #3...

**Rationalizations:**
- "Let me try this other approach"
- "Maybe it's actually this other thing"
- "One more fix attempt should work"

**What's missing:** Returning to Phase 1 after failed hypothesis

### Pattern 5: Inadequate Evidence Gathering

**Symptom:** Agent proposes fix based on assumptions, not evidence

**Rationalizations:**
- "This is probably caused by X"
- "Based on the error, it must be Y"
- "I don't need to add logging, the issue is clear"

**What gets skipped:** Adding instrumentation to gather actual evidence

## Context Dilution Timeline

Based on observed sessions:

| Tool Calls | Phase | Agent Behavior |
|-----------|-------|----------------|
| 0-10 | Phase 1 | ✅ Follows process carefully |
| 11-20 | Phase 2 | ⚠️ Some shortcuts, mostly follows |
| 21-30 | Phase 3 | ⚠️ Proposes fixes without completing prior phases |
| 31+ | Phase 4 | ❌ Forgets process entirely, quick-fix mode |

## Pressure Combinations That Trigger Failures

1. **Time pressure + Obvious fix** → Skip investigation
2. **Sunk cost + Multiple attempts** → Keep trying fixes without re-investigation
3. **Simple bug appearance + Confidence** → Skip phases as "overkill"
4. **Long debugging session + Exhaustion** → Context dilution accelerates

## Success Criteria for GREEN Phase

Agent must:
1. ✅ Always complete Phase 1 before proposing fixes (even under pressure)
2. ✅ Maintain process through 50+ tool calls without context dilution
3. ✅ Create failing test before implementing fix in Phase 4
4. ✅ Return to Phase 1 after 3 failed fix attempts
5. ✅ Add instrumentation to gather evidence, not rely on assumptions

## Notes

These patterns were identified from:
- Previous debugging sessions with context dilution
- Known failure modes in systematic-debugging skill usage
- Patterns from the permissions bug investigation earlier in this session
- General agent behavior under debugging pressure

The hybrid agent pattern should address all of these by keeping full process instructions in agent's context throughout execution.
