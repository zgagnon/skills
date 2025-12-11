# Code Execution with MCP: Pattern Documentation

Source: https://www.anthropic.com/engineering/code-execution-with-mcp

## The Problem This Solves

Traditional MCP implementations load all tool definitions upfront into the agent context, consuming excessive tokens. Example: loading tool schemas for all Shortcut operations, Discovery Tree operations, JJ operations simultaneously wastes 150,000+ tokens even if you only need 2-3 tools.

## The Solution: MCP Tools as TypeScript APIs

Instead of exposing MCP tools as JSON-RPC tool schemas, expose them as **TypeScript function APIs** that agents can:
1. Discover through filesystem exploration
2. Import and call through code execution
3. Load on-demand, not upfront

### Token Savings
- **Before**: 150,000 tokens (all tool schemas loaded)
- **After**: 2,000 tokens (agent imports only what's needed)
- **Reduction**: 98.7%

## Architectural Pattern

### File Structure
```
servers/
├── google-drive/
│   ├── getDocument.ts        # Single tool as async function
│   ├── listFiles.ts
│   └── index.ts               # Exports all tools
├── salesforce/
│   ├── updateRecord.ts
│   ├── queryRecords.ts
│   └── index.ts
├── search_tools.ts            # Optional: helps discover available tools
```

### Tool Implementation Pattern
Each tool becomes an exported async TypeScript function with typed interfaces:

```typescript
// servers/google-drive/getDocument.ts
export interface GetDocumentInput {
  documentId: string;
  format?: 'json' | 'html' | 'plain';
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export async function getDocument(input: GetDocumentInput): Promise<Document> {
  // Implementation calls underlying MCP server
  const result = await mcpClient.callTool('google-drive', 'get-document', input);
  return result;
}
```

## Key Benefits

### 1. Progressive Disclosure
Agents discover and load tools on-demand:
- Use filesystem navigation to explore available tools
- Read only the specific tool definitions needed for current task
- No upfront token cost for unused tools

### 2. Context Efficiency Through Code
Agents can filter and transform data **in the execution environment** before logging results:

```typescript
// Fetch 10,000 rows but only show first 5 filtered results
const allData = await salesforce.queryRecords({ object: 'Account', limit: 10000 });
const filtered = allData.filter(r => r.status === 'Active').slice(0, 5);
console.log('First 5 active accounts:', filtered);
// Only 5 rows go into context, not 10,000
```

### 3. Privacy Preservation
Intermediate results stay in execution environment:
- PII can be tokenized automatically by MCP client
- Sensitive data flows to external services without entering model context
- Agents can process private data without "seeing" it

### 4. State & Skills Persistence
Agents build reusable capabilities over time:
- Save working code to `./skills/` directory
- Compose higher-level functions from lower-level tools
- Build institutional knowledge through code

## Implementation for Our Skills

### Current Structure
We already have this pattern partially:
- `discovery-tree-workflow/src/beads.ts` - TypeScript API for Discovery Tree
- `using-jj/src/jj.ts` - TypeScript API for JJ operations

### What's Missing
Shortcut MCP tools are only available as direct MCP tool calls, not as TypeScript APIs.

### What We Need to Build

```
skills/
├── discovery-tree-workflow/
│   └── src/
│       ├── beads.ts          # ✓ Already exists
│       └── beads-impl.ts     # ✓ Already exists
├── using-jj/
│   └── src/
│       ├── jj.ts             # ✓ Already exists
│       └── jj-impl.ts        # ✓ Already exists
├── shortcut-integration/     # ✗ Need to create
│   └── src/
│       ├── shortcut.ts       # Public API wrapper around MCP calls
│       ├── stories.ts        # Story operations
│       ├── iterations.ts     # Iteration operations
│       └── types.ts          # Type definitions
```

### Integration Pattern

The TypeScript API would wrap MCP calls but allow composition:

```typescript
// shortcut-integration/src/stories.ts
export async function getStoryWithBranch(storyId: number): Promise<StoryDetails> {
  // This would need to call through to the agent's MCP context
  // Pattern: Return instructions for agent to execute MCP calls
  return {
    storyId,
    _needsMcp: true,
    _mcpCalls: [
      { tool: 'mcp__shortcut__stories-get-by-id', params: { storyPublicId: storyId } },
      { tool: 'mcp__shortcut__stories-get-branch-name', params: { storyPublicId: storyId } }
    ]
  };
}
```

## Implementation Considerations

### Security Requirements
Code execution requires:
- Secure execution environment (we have: bun-sandbox MCP)
- Appropriate sandboxing (bun-sandbox provides this)
- Resource limits (timeout: 3 seconds in current implementation)
- Monitoring (execution errors are surfaced)

### Tradeoffs
- **Cost**: Infrastructure for code execution vs token costs
- **Latency**: Multiple tool calls may be slower than batch operations
- **Complexity**: More moving parts vs simpler direct tool calls

### Our Context
- We already have bun-sandbox MCP for secure TypeScript execution
- We already have this pattern working for Discovery Tree and JJ
- We need to extend the pattern to Shortcut operations

## Next Steps

1. **Create Shortcut TypeScript API wrapper**
   - Expose mcp__shortcut__* tools as TypeScript functions
   - Handle the MCP boundary appropriately

2. **Implement composition helpers**
   - `createTaskFromShortcut()` - combines story fetch + branch name + task creation
   - `createBookmarkFromTask()` - combines task details + jj bookmark creation

3. **Update skills to use TypeScript APIs exclusively**
   - Agents write code that imports these functions
   - No direct MCP tool calls in agent conversations
   - Progressive disclosure: only import what's needed

## Key Insight

The article's core message: **"Agents scale better by writing code to call tools instead"**

This isn't about reducing MCP calls per se—it's about:
- Loading tool schemas on-demand (progressive disclosure)
- Processing data in execution environment (context efficiency)
- Building reusable capabilities (skills persistence)
- Preserving privacy (data stays in sandbox)

Our goal should be: **Make Claude Code orchestrate MCP operations by writing TypeScript code**, not by loading 100+ tool schemas upfront.

## Research Findings: Current Claude Code Limitations

### What's Possible Today

Based on research of Claude Code and MCP documentation:

1. **bun-sandbox cannot directly call other MCP tools**
   - The code execution environment is isolated
   - No built-in `callMCPTool()` function exists
   - MCP tools are permissions for Claude Code (the agent), not for sandboxed code

2. **The pattern requires custom infrastructure**
   - The Anthropic article describes an ideal architecture
   - Implementing it requires building a bridge between code execution and MCP client
   - Claude Code doesn't currently expose this bridge

### What This Means for Our Implementation

**Option A: Agent-Orchestrated Composition (Current Best Practice)**
```typescript
// TypeScript code returns structured data
return {
  needsShortcutStory: 93114,
  nextAction: "create_discovery_tree_task"
};
```
Claude Code sees this return value and orchestrates the Shortcut MCP calls + discovery tree task creation.

**Option B: Direct API Calls (Bypass MCP)**
```typescript
// Call Shortcut REST API directly from TypeScript
const response = await fetch('https://api.app.shortcut.com/api/v3/stories/93114', {
  headers: { 'Shortcut-Token': process.env.SHORTCUT_TOKEN }
});
```
This bypasses the MCP layer entirely but requires credentials in the execution environment.

**Option C: Build the Bridge (Future Work)**
Create a `callMCPTool()` utility that:
- Runs in bun-sandbox TypeScript code
- Communicates back to Claude Code via a protocol
- Requests Claude Code to invoke MCP tools on its behalf
- Receives results back into the execution environment

This would require extending either bun-sandbox or Claude Code itself.

### Recommendation

For now, use **Option A: Agent-Orchestrated Composition**. TypeScript code should:
1. Process data efficiently (filtering, transforming)
2. Return structured results with clear next-action indicators
3. Let Claude Code handle the MCP orchestration

This achieves the token efficiency goals (keep intermediate data in sandbox) without requiring infrastructure that doesn't exist yet.

## Breakthrough Discovery: TypeScript Can Be an MCP Client!

### Proof of Concept

Testing revealed that **TypeScript code in bun-sandbox CAN act as an MCP client**:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client(
  { name: "test-client", version: "1.0.0" },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@shortcut/mcp@latest"],
  env: {
    SHORTCUT_API_TOKEN: process.env.SHORTCUT_API_TOKEN
  }
});

await client.connect(transport);

// Successfully lists 36 available tools!
const tools = await client.listTools();
console.log(`Found ${tools.tools.length} tools`);

await client.close();
```

**Status: Connection works! Tool calls have timeout issues that need debugging.**

### Implementation Path Forward

**Option D: TypeScript as MCP Client (Now Viable!)**

Since we can connect to MCP servers from TypeScript, we can build the wrapper pattern:

```
~/.claude/skills/
├── shortcut-integration/
│   └── src/
│       ├── client.ts          # Shared MCP client singleton
│       ├── stories.ts         # Story operations
│       ├── iterations.ts      # Iteration operations
│       └── index.ts           # Re-exports
```

Example usage:
```typescript
import { getStory, getBranchName } from "~/shortcut-integration/stories.js";
import { createTask } from "~/discovery-tree-workflow/beads.js";

// All calls happen in TypeScript, no agent MCP orchestration needed
const story = await getStory(93114);
const branch = await getBranchName(93114);

await createTask({
  title: story.name,
  description: `${story.description}\n\nShortcut: ${story.app_url}\nBranch: ${branch}`
});
```

### Current Blockers

1. **Tool call timeouts**: Connection succeeds, `listTools()` works, but `callTool()` times out after 60s
   - Possible cause: `npx -y @shortcut/mcp@latest` downloads package on each run
   - Solution: Pre-install globally or use local path

2. **Client lifecycle**: Need to manage singleton pattern for client reuse
   - Creating new client per call is expensive
   - Should maintain single client instance per skill session

3. **Error handling**: Need to wrap MCP errors in user-friendly messages

### Next Steps

1. Debug the timeout issue (try with globally installed Shortcut MCP)
2. Create a shared client manager in `shortcut-integration/src/client.ts`
3. Build wrapper functions for commonly-used Shortcut tools
4. Test the full workflow: TypeScript calls Shortcut → creates discovery tree task
5. Update skills to use this pattern instead of agent MCP orchestration

This is the **true code execution pattern** from the Anthropic article!
