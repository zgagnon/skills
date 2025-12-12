# ADR-006: Consolidation File Contains Full API Surface

## Status
Accepted

## Context
`src/discovery-tree.ts` was created as a unified entry point that re-exports APIs from `beads.ts`, `shortcut.ts`, and `jj-bookmark-helper.ts`. The goal was token efficiency - agents load 1 file instead of 3.

**Problem with re-exports:**
```typescript
// Current approach - re-exports
export { createTask, setWorkspace } from "./beads.js";
export { getShortcutStory } from "./shortcut.js";
```

When agents read `discovery-tree.ts`, they see:
- Function names
- ❌ No type information
- ❌ No JSDoc documentation
- ❌ No parameter details

Agents must read 3+ additional files to understand:
- What parameters each function takes
- What each function returns
- What each function does

**This defeats the purpose** - we wanted token efficiency, but agents need MORE context, not less.

## Decision
**`discovery-tree.ts` must contain full API surface, not re-exports:**

1. **Include in `discovery-tree.ts`:**
   - All type definitions (interfaces for inputs/outputs)
   - Complete JSDoc documentation for each function
   - Full function signatures with inline implementation or delegation
   - All information needed to call the API

2. **Implementation stays separate:**
   - Business logic remains in `*-impl.ts` files
   - Original API files (`beads.ts`, `shortcut.ts`) remain for backward compatibility or can be deprecated

**Pattern for consolidation file:**
```typescript
/**
 * Create a new task
 *
 * Creates a new task (task, bug, feature, epic, or chore) with specified details.
 *
 * @param input - Task configuration with title, type, priority, description
 * @returns Created task with ID and details
 */
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  return createTaskImpl(input);
};

export interface CreateTaskInput {
  title: string;
  type?: TaskType;
  priority?: number;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  taskType: TaskType;
  createdAt: string;
  updatedAt: string;
}
```

**NOT this (re-exports hide information):**
```typescript
// ❌ BAD: Agents can't see types or documentation
export { createTask } from "./beads.js";
export type { CreateTaskInput, Task } from "./beads.js";
```

## Consequences

### Positive
- **Single source of truth**: Agents read ONE file and have ALL information
- **True token efficiency**: One file with complete API beats multiple files with partial info
- **Better DX**: Clear, documented API surface in one place
- **Self-documenting**: Types + JSDoc + signatures = complete documentation
- **Agent-friendly**: LLMs can understand and use API from a single file read

### Negative
- **Duplication**: Type definitions and JSDoc exist in both original files and consolidation file
- **Maintenance**: Changes to API require updating consolidation file
- **File size**: Consolidation file is larger than simple re-exports

### Neutral
- Original API files can remain for backward compatibility
- Tests can test either original APIs or consolidated API
- Implementation stays in `*-impl.ts` files unchanged

## Implementation Notes

**For each consolidated function:**
1. Copy type definitions from original file
2. Copy JSDoc documentation from original file
3. Include full function signature
4. Delegate to existing implementation (call `*Impl` or import from original)

**Example consolidation:**
```typescript
// Import implementation
import { createTaskImpl } from "./beads-impl.js";

// Copy types
export type TaskType = "bug" | "feature" | "task" | "epic" | "chore";
export interface CreateTaskInput {
  title: string;
  type?: TaskType;
  // ... rest of interface
}

// Copy JSDoc + signature, delegate to implementation
/**
 * Create a new task
 * (full JSDoc here)
 */
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  return createTaskImpl(input);
};
```

## Related
- ADR-004: Separate API from Implementation (consolidation file IS the API surface)
- ADR-003: Prefer Arrow Functions (applies to consolidation file)

## Migration Path
1. Expand re-exports in `discovery-tree.ts` to include full types and JSDoc
2. Update SKILL.md to reference `discovery-tree.ts` as primary API documentation
3. Original files remain but are not primary documentation source
