# Notion API Integration Design

**Date:** 2025-12-12
**Status:** Draft
**Context:** Expand discovery-tree-workflow with Notion integration for agent context and communication

## Problem Statement

Agents working in the discovery tree need access to team knowledge and a way to communicate findings back to humans. Currently:
- **Shortcut**: Provides work items (tasks, stories) - *what to do*
- **Discovery Tree**: Agent execution workspace - *how to execute*
- **Missing**: Access to context (plans, decisions, architecture) and way to communicate back

Notion serves as the human-human collaboration space containing plans, documentation, and decisions that agents need for context.

## Solution: Notion REST API Integration

Integrate Notion REST API into discovery-tree-workflow to enable:
1. **Reading context**: Agents pull documentation, plans, ADRs from Notion
2. **Communicating outward**: Agents write findings, decisions, progress back to Notion

### Key Distinction
- **Shortcut** = Work tracking (tasks flow)
- **Notion** = Knowledge base (context & communication)
- Agents should NOT pull/push work items from Notion (that's Shortcut's role)

## Architecture

### Integration Pattern
Follow established Shortcut integration pattern:
- **Dependency injection**: Token/client injected via `setNotionClient()`
- **Security**: Agents never access credentials directly
- **Public API**: Clean interface exposed in `src/discovery-tree.ts`
- **Implementation**: Private details in `src/notion-impl.ts`

### File Structure
```
src/
  notion-impl.ts          # Implementation (private)
  discovery-tree.ts       # Public API (add Notion functions)
  notion.test.ts          # Tests
docs/
  plans/
    2025-12-12-notion-api-integration-design.md  # This document
```

## Core Capabilities

### 1. Read Operations
- **Get page content**: Retrieve Notion page for context
- **Search pages**: Find relevant documentation by query

**Use cases:**
- Agent reads architecture doc before implementing feature
- Agent searches for relevant ADRs
- Agent looks up team conventions

### 2. Write Operations
- **Update page**: Append content to existing pages
- **Create page**: Generate new documentation

**Use cases:**
- Agent documents decisions made during implementation
- Agent creates new ADR after architectural choice
- Agent updates changelog with what was accomplished
- Agent adds notes to project page about findings

## API Design Philosophy

**Emergent design through implementation:**
- Define API surface as we build capabilities
- Use TDD to drive interface design
- Start minimal, expand based on actual usage
- Avoid over-engineering upfront

**Consistency with existing patterns:**
- Same dependency injection as Shortcut
- Similar error handling
- Matches discovery-tree.ts API style

## Discovery Mechanism

Agents will discover Notion content through:
1. **Search**: Query Notion for relevant pages/databases
2. **Direct reference**: Task metadata contains Notion URLs when known
3. **API constraints**: Some operations constrained to specific pages for safety

Implementation will determine exact balance between these approaches.

## Technical Details

### Notion API Version
Use **2025-09-03** (current version):
- "Data sources" terminology (not "databases")
- Endpoint: `POST /v1/data_sources/{id}/query`
- Breaking changes from earlier versions

### Authentication
- **Token type**: Bearer token (internal integration)
- **Storage**: Injected via `setNotionClient()`, never exposed to agents
- **Scopes**: TBD based on operations (likely `read_content`, `update_content`, `create_content`)

### Operations Mapping

| Agent Need | Notion API | Implementation Priority |
|------------|-----------|------------------------|
| Read page | GET /v1/pages/{id} | TBD |
| Get page content | GET /v1/blocks/{id}/children | TBD |
| Search | POST /v1/search | TBD |
| Update page | PATCH /v1/pages/{id} | TBD |
| Append content | PATCH /v1/blocks/{id}/children | TBD |
| Create page | POST /v1/pages | TBD |

*Priority determined during implementation planning*

## Integration with Existing System

### With Shortcut
- **Shortcut**: Source of work items
- **Notion**: Source of context for those work items
- Typical flow: Agent gets Shortcut story → reads Notion for context → executes in discovery tree → updates both Shortcut (status) and Notion (learnings)

### With Discovery Tree Workflow
- Discovery tree tasks may reference Notion pages
- Agents use `getNotionPage()` during task execution
- Agents use `updateNotionPage()` when completing tasks

### Data Flow Example
```
1. Agent claims discovery tree task (linked to Shortcut story)
2. Agent reads Notion page for architecture context
3. Agent implements feature in discovery tree
4. Agent updates Shortcut story status
5. Agent writes findings back to Notion page
```

## Open Questions

These will be resolved during implementation:

1. **Page references**: Best way to link discovery tree tasks to Notion pages?
2. **Content format**: How to structure content blocks when reading/writing?
3. **Search scope**: Should search be workspace-wide or constrained to specific databases?
4. **Error handling**: Retry strategy for rate limits, permission errors?
5. **Caching**: Should we cache Notion content to reduce API calls?

## Non-Goals

- **Task sync**: Not syncing tasks between Notion and discovery tree (that's Shortcut's role)
- **Real-time sync**: Not bidirectional real-time sync (read/write on demand only)
- **Notion as database**: Not using Notion databases for structured data storage
- **MCP server**: Using REST API directly, not Notion's MCP server

## Success Criteria

Integration is successful when:
1. Agents can read Notion pages for context during task execution
2. Agents can search Notion to find relevant documentation
3. Agents can update Notion pages to communicate findings
4. Agents can create new Notion pages for documentation
5. All operations follow security model (no direct token access)
6. API follows same patterns as Shortcut integration

## Implementation Approach

1. **Start minimal**: Implement one operation (likely read page)
2. **TDD driven**: Write tests first, let API emerge
3. **Iterate**: Add operations based on actual agent needs
4. **Follow ADRs**: Maintain consistency with existing codebase patterns

## Next Steps

1. Create discovery tree epic for Notion integration work
2. Break down into tasks (one per operation type)
3. Prioritize first operation to implement
4. Use incremental TDD to build and validate
5. Update this design doc as we learn from implementation

## References

- Notion API docs: https://developers.notion.com/reference
- Notion 2025-09-03 upgrade guide: https://developers.notion.com/docs/upgrade-guide-2025-09-03
- Existing Shortcut integration: `src/shortcut-impl.ts`
- Discovery tree API: `src/discovery-tree.ts`
