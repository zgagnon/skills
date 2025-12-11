# ADR-005: Verify Behavior Not Interactions

## Status
Accepted

## Context

When writing tests with collaborators (dependencies), there are two approaches:

**Interaction-based testing (tight coupling):**
```typescript
test("calls MCP client correctly", async () => {
  const mockClient = {
    callTool: mock()
  };

  await service.fetchStory(123);

  // Verifying HOW it's called (implementation detail)
  expect(mockClient.callTool).toHaveBeenCalledWith("stories-get-by-id", { id: 123 });
  expect(mockClient.callTool).toHaveBeenCalledTimes(2);
});
```

**Behavior-based testing (loose coupling):**
```typescript
test("returns story with data from MCP client", async () => {
  const fakeClient = {
    callTool: async (tool: string) => {
      // Stub returns unique data
      if (tool === "stories-get-by-id") {
        return { content: [{ text: JSON.stringify({ name: "Unique Story Name" }) }] };
      }
      if (tool === "stories-get-branch-name") {
        return { content: [{ text: JSON.stringify("unique-branch-name") }] };
      }
    }
  };

  const story = await service.fetchStory(123);

  // Verify WHAT it returns (behavior)
  expect(story.name).toBe("Unique Story Name");
  expect(story.branch_name).toBe("unique-branch-name");
  // If these values are present, the collaborator MUST have been called
});
```

**Problems with interaction testing:**
1. **Tight coupling**: Test breaks when refactoring implementation (e.g., combining calls, reordering, caching)
2. **False confidence**: Test passes even if return value is ignored
3. **Verbose**: Requires mock setup AND expectation setup
4. **Unclear intent**: Focuses on HOW rather than WHAT

**Benefits of behavior testing:**
1. **Loose coupling**: Test survives refactoring as long as behavior is correct
2. **True confidence**: Test fails if collaborator isn't actually used
3. **Clear intent**: Focuses on observable behavior (return value, side effects)
4. **Simpler**: Just stub with unique data, verify it appears in result

## Decision

**Test behavior (return values, observable effects) instead of interactions (method calls).**

Use stubs/fakes that return unique data that can ONLY be obtained by calling the collaborator. If that unique data appears in the result, the collaborator must have been called correctly.

### Rules

1. **Use stubs/fakes, not mocks with expectations**
   - Stub: Returns predetermined data
   - Fake: Minimal working implementation
   - Mock: Records calls for verification (avoid)

2. **Return unique, recognizable data from stubs**
   - Use distinctive strings like "Unique Story Name" not "Test Story"
   - Use specific IDs that only that stub would return
   - Make it obvious the data came from the stub

3. **Verify behavior, not interactions**
   - Assert on return values containing stub data
   - Assert on observable side effects (files written, state changed)
   - Don't assert on `.toHaveBeenCalled()` unless testing error cases

4. **When interaction testing IS appropriate:**
   - Testing error handling (verify error thrown)
   - Testing void functions with no observable effects
   - Testing that expensive operations are cached (not called twice)
   - Testing order-dependent operations (rare)

## Examples

### ❌ Wrong: Interaction-based test

```typescript
test("fetches story and branch", async () => {
  const mockClient = {
    callTool: mock(async () => ({ content: [{ text: "{}" }] }))
  };

  await getShortcutStory(123, mockClient);

  // Coupled to implementation
  expect(mockClient.callTool).toHaveBeenNthCalledWith(1, "stories-get-by-id", { id: 123 });
  expect(mockClient.callTool).toHaveBeenNthCalledWith(2, "stories-get-branch-name", { id: 123 });
});
```

**Problems:**
- Breaks if we change order of calls
- Breaks if we cache results
- Breaks if we parallelize calls
- Doesn't verify the return value is actually used

### ✓ Right: Behavior-based test

```typescript
test("returns story with name from MCP and branch from MCP", async () => {
  const fakeClient = {
    callTool: async (tool: string) => {
      if (tool === "stories-get-by-id") {
        return { content: [{ text: JSON.stringify({
          id: 123,
          name: "Distinctive Story Name From MCP",
          description: "Story description"
        }) }] };
      }
      if (tool === "stories-get-branch-name") {
        return { content: [{ text: JSON.stringify("distinctive-branch/sc-123") }] };
      }
    }
  };

  const story = await getShortcutStory(123, fakeClient);

  // Verify behavior: stub data appears in result
  expect(story.name).toBe("Distinctive Story Name From MCP");
  expect(story.branch_name).toBe("distinctive-branch/sc-123");
  // If these pass, the collaborator WAS called correctly
});
```

**Benefits:**
- Still passes if we optimize (cache, parallelize, reorder)
- Fails if we break the integration (ignore return value, wrong parameters)
- Clear: "returns story with data from both MCP calls"
- Simple: No mock expectations needed

### When Interaction Testing Is Appropriate

```typescript
test("throws error when MCP client fails", async () => {
  const fakeClient = {
    callTool: mock(async () => {
      throw new Error("MCP connection failed");
    })
  };

  await expect(getShortcutStory(123, fakeClient)).rejects.toThrow("MCP connection failed");

  // Interaction testing OK here: verifying error handling
  expect(fakeClient.callTool).toHaveBeenCalled();
});
```

## Consequences

### Positive
- Tests survive refactoring (loose coupling)
- True verification: behavior is actually correct
- Simpler test code: no mock expectations
- Clearer intent: focus on observable behavior

### Negative
- Requires thinking about "what unique data proves this worked"
- Slightly more setup: need meaningful stub data
- Can't verify order of operations (usually good)

### Migration
Existing tests using `mock()` and `.toHaveBeenCalled()` should be refactored to verify behavior instead of interactions, unless they fall under the exceptions (error handling, caching verification, etc.).

## References
- Martin Fowler: [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
- Growing Object-Oriented Software, Guided by Tests by Steve Freeman and Nat Pryce ([book website](http://www.growing-object-oriented-software.com/))
