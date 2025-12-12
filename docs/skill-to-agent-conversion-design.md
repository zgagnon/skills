# Skill-to-Agent Conversion Design

**Date:** 2025-12-12
**Status:** Proposed
**Authors:** Claude (Sonnet 4.5)

## Problem Statement

Skills suffer from **context dilution** in long conversations. As tool calls accumulate, skill instructions fade from active context, causing agents to forget process steps and requiring manual re-invocation of skills. This leads to:

- Incomplete process following (e.g., skipping TDD RED phase)
- Rationalization of shortcuts despite skill warnings
- Re-work when discipline lapses
- User frustration from repeated process violations

**Root Cause:** Skills are loaded once at invocation but not maintained as active context throughout multi-phase workflows.

## Proposed Solution: Hybrid Skill + Agent Pattern

Convert long-process skills to a **hybrid architecture** where:
1. **Detection Skill** (main agent context) - Knows WHEN to dispatch agent
2. **Process Agent** (sub-agent) - Knows HOW to execute process with full context

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Main Agent                                              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Detection Skill (in-context)                     │  │
│  │ - Recognizes when process needed                 │  │
│  │ - Knows dispatch criteria                        │  │
│  │ - Provides invocation guidance                   │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         │ dispatch when needed          │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Task(subagent_type='process-agent')              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Process Agent (sub-agent with fresh context)           │
│                                                         │
│  • Full process instructions in agent definition       │
│  • Agent identity IS the process                       │
│  • No context dilution (instructions stay at top)      │
│  • Maintains state throughout execution                │
│  • Enforces discipline automatically                   │
│                                                         │
│  Phases:                                               │
│  1. Phase 1: [Instructions fresh in context]          │
│  2. Phase 2: [Instructions still fresh]               │
│  3. Phase 3: [Instructions still fresh]               │
│  4. Complete and return to main agent                  │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Systematic Debugging

**Before (in-context skill):**
```markdown
---
name: systematic-debugging
---
# Full 4-phase debugging process
[Context dilutes after 20+ tool calls]
```

**After (hybrid):**

**Detection Skill** (`skills/dispatching-systematic-debugging/SKILL.md`):
```markdown
---
name: dispatching-systematic-debugging
---

When you encounter bugs, test failures, or unexpected behavior,
dispatch the systematic-debugging-agent.

**NEVER:**
- Propose fixes without investigation
- Skip the agent for "simple" bugs
```

**Process Agent** (`agents/systematic-debugging-agent.md`):
```markdown
---
name: systematic-debugging-agent
model: sonnet
---

You are a Systematic Debugging Guide. Your identity is ensuring proper
debugging process through 4 phases: Root Cause → Pattern → Hypothesis → Implementation.

[Full process instructions maintained throughout agent's execution]
```

### Example 2: Test-Driven Development

**Detection Skill** → Knows when to dispatch TDD agent
**Process Agent** → Guides through RED-GREEN-REFACTOR with fresh context

## Skills Recommended for Conversion

### High Priority (Long, Multi-Phase)

| Skill | Phases | Avg Tool Calls | Context Dilution Risk |
|-------|--------|----------------|----------------------|
| `systematic-debugging` | 4 phases | 30-50 | ⚠️ HIGH |
| `test-driven-development` | RED-GREEN-REFACTOR cycle | 20-40 | ⚠️ HIGH |
| `executing-plans` | Batch execution with reviews | 40-100 | ⚠️ HIGH |
| `subagent-driven-development` | Task-by-task with reviews | 50-150 | ⚠️ HIGH |

### Medium Priority (Iterative Workflows)

| Skill | Reason |
|-------|--------|
| `brainstorming` | Socratic method requires sustained discipline |
| `verification-before-completion` | Easy to skip under pressure |

### Low Priority (Keep as In-Context Skills)

| Skill | Reason |
|-------|--------|
| `using-superpowers` | Must be in main agent always (meta-skill) |
| `writing-commit-messages` | Quick, one-shot task |
| `condition-based-waiting` | Technique reference, not workflow |
| `testing-anti-patterns` | Knowledge base, not process |
| `defense-in-depth` | Architectural principle |

## Implementation Plan

### Phase 1: Proof of Concept
1. Convert `systematic-debugging` to hybrid pattern
2. Test with realistic debugging scenarios
3. Validate context retention
4. Gather feedback

### Phase 2: Core Process Skills
1. Convert `test-driven-development`
2. Convert `executing-plans`
3. Convert `subagent-driven-development`

### Phase 3: Iterative Skills
1. Convert `brainstorming`
2. Convert `verification-before-completion`

### Phase 4: Documentation & Training
1. Document hybrid pattern
2. Create skill-to-agent conversion guide
3. Update using-superpowers with dispatch guidance

## File Structure

```
.claude/skills/
  dispatching-systematic-debugging/
    SKILL.md              ← Detection skill (when to dispatch)

  dispatching-tdd/
    SKILL.md              ← Detection skill

  using-superpowers/
    SKILL.md              ← Updated with dispatch patterns

.claude/plugins/marketplaces/superpowers-dev/
  agents/
    systematic-debugging-agent.md   ← Process agent
    tdd-agent.md                    ← Process agent
    plan-execution-agent.md         ← Process agent
```

## Benefits

### 1. No Context Dilution
- Agent "born" with full process instructions
- Instructions stay at top of context window
- No manual refresh needed

### 2. Automatic Discipline Enforcement
- Agent identity IS the process
- Cannot skip phases
- Rationalization counters enforced programmatically

### 3. Clear Boundaries
- **Start:** Agent dispatched with clear task
- **Execute:** Agent maintains process throughout
- **Complete:** Agent returns with results
- Main agent knows exactly when process is active

### 4. Better User Experience
- Explicit mode transitions ("Now in TDD mode")
- Reduced cognitive load
- Clear completion signals

### 5. Scalability
- Multiple process agents can run independently
- No interference between different workflows
- Parallel execution possible

## Risks & Mitigations

### Risk: Agent Dispatch Overhead
**Mitigation:** Use for long processes only (>20 tool calls expected). Keep quick tasks as in-context skills.

### Risk: Loss of Flexibility
**Mitigation:** Detection skill provides guidance, not rigid rules. User can still choose to skip agent if appropriate.

### Risk: Context Handoff Issues
**Mitigation:** Detection skill provides clear template for what context to pass to agent.

### Risk: User Confusion
**Mitigation:** Clear announcement when dispatching: "I'm dispatching the systematic-debugging agent to handle this properly."

## Success Metrics

1. **Process Adherence:** % of debugging sessions that complete all 4 phases (target: 95%+, current: ~60%)
2. **Re-work Rate:** % of tasks requiring re-implementation due to skipped process (target: <5%, current: ~25%)
3. **Manual Skill Refreshes:** Number of times user reminds agent to follow skill (target: 0, current: 3-5 per session)
4. **User Satisfaction:** Subjective assessment of process following

## Migration Strategy

### For Each Skill:

1. **Create Detection Skill**
   - Extract "when to use" criteria
   - Add dispatch template
   - Reference process agent

2. **Create Process Agent**
   - Copy full skill content to agent definition
   - Add agent identity statement
   - Enhance with phase tracking
   - Add rationalization counters

3. **Update References**
   - Update `using-superpowers` to reference detection skill
   - Add examples to detection skill
   - Document agent in README

4. **Test & Validate**
   - Test with realistic scenarios
   - Verify context retention
   - Confirm process adherence
   - Gather user feedback

5. **Deprecate Old Skill**
   - Move old skill to `deprecated/`
   - Add redirect notice
   - Update all references

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Hybrid pattern (not pure agent) | Main agent needs to know WHEN to dispatch. Pure agent approach loses this context. |
| Keep quick skills in-context | Agent overhead not worth it for <10 tool call workflows |
| Start with systematic-debugging | Highest impact, most clear failure mode |
| Use sonnet model for agents | Process enforcement needs reasoning capability |
| Explicit dispatch announcement | User visibility and commitment principle |

## References

- Existing pattern: `requesting-code-review` skill + `code-reviewer` agent
- Persuasion principles: Authority, Commitment, Scarcity (see `writing-skills/persuasion-principles.md`)
- Context window research: Meincke et al. (2025) on LLM compliance patterns

## Approval

- [ ] User review and approval
- [ ] Initial POC with systematic-debugging
- [ ] Rollout plan approved
- [ ] Success metrics defined

---

**Next Steps:**
1. Create epic in discovery tree
2. Create story for each skill conversion
3. Start POC with systematic-debugging
4. Iterate based on results
