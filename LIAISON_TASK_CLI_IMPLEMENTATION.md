# Liaison Task CLI Implementation

**Status:** Complete  
**Date:** 2025-12-13  
**Tests:** 9 passing  
**Integration:** Wired into `liaison` CLI

## Overview

Implemented a lightweight task management CLI (`liaison task`) that provides direct access to task backend operations without heavy sync machinery. Uses the same `BeadsAdapter` as the reconciler module for consistent, single-responsibility design.

## What Was Built

### New Files

#### `packages/liaison/src/commands/task.ts`
- 4 subcommands: `create`, `list`, `get`, `update`
- Human-readable output (tables, colors) with `--json` flag for scripting
- Health check before each operation
- Proper error handling and spinner feedback

**Commands:**
```bash
# Create task
liaison task create "New feature" --description "Implement X" --assigned-to user

# List tasks (with optional filters)
liaison task list
liaison task list --status closed
liaison task list --assigned-to user

# Get task details
liaison task get task-123

# Update status
liaison task update task-123 --status closed
```

#### `packages/liaison/src/commands/task.test.ts`
- 9 test cases covering all 4 subcommands
- Mock BeadsAdapter for unit testing
- Tests for happy path, filtering, error conditions

### Modified Files

#### `packages/liaison/src/cli.ts`
- Added import: `import { createTaskCommand } from './commands/task.js'`
- Wired command into program: `program.addCommand(createTaskCommand())`

#### `packages/liaison-coordinator/src/utils/beads.ts`
- Added deprecation notice to `BeadsClientImpl` class
- Explains migration path to `BeadsAdapter`
- Notes that coordinator is for heavy sync; task CLI is for lightweight ops

#### `BEADS-CODY-SYNC-QUICKSTART.md`
- Added "Manual Task Management (Simpler Alternative)" section
- Shows `liaison task` as lightweight alternative to full sync workflow
- Clarifies that task CLI has no automatic syncing

## Design Decisions

### Why BeadsAdapter (Not BeadsClientImpl)

| Aspect | BeadsAdapter | BeadsClientImpl |
|--------|---|---|
| **Responsibility** | Single: task operations | Multiple: sync, fallback, persistence |
| **Size** | ~150 LOC | ~500 LOC |
| **Dependencies** | Minimal (spawn, promisify) | Heavy (fs, paths, JSON parsing) |
| **Testing** | Mockable, isolated | Tightly coupled to sync flow |
| **Maintainability** | Lightweight, focused | Complex, interdependent |

BeadsAdapter is battle-tested (24 passing reconciler tests) and purpose-built for CLI use.

### Command Structure

- **No nesting:** `liaison task create`, not `liaison task:create` or `liaison tasks create`
- **Consistent with other commands:** `liaison reconcile`, `liaison health`
- **Subcommands map directly to adapter methods:** `create` → `adapter.createTask()`, etc.

### Output Format

- **Default:** Human-readable with colors and tables (UX-friendly)
- **`--json` flag:** Structured JSON for tooling/scripting integration
- **Spinners:** Async feedback (using `ora` library)

### No Built-In Defaults

Task creation requires explicit title; no default assignments or statuses. This gives users full control and avoids hidden behavior.

## Integration with Reconciler

Both tools use the same `BeadsAdapter` but for different purposes:

- **`liaison reconcile`:** Syncs version tasklists with backend (reads/writes Markdown)
- **`liaison task`:** Direct task CRUD operations (CLI interface)

They complement each other:
```bash
# Create task via CLI
liaison task create "Implement auth" --description "Add JWT"

# Later, reconcile it into a version tasklist
liaison reconcile --version v0.5.0
```

## Migration Path for Coordinator

`BeadsClientImpl` remains for backward compatibility with the sync command, but new CLI work should use `BeadsAdapter`:

```typescript
// Old way (heavy)
import { BeadsClientImpl } from '@pwarnock/liaison-coordinator/utils/beads';
const client = new BeadsClientImpl({ projectPath: '.' });
await client.getIssues();

// New way (lightweight)
import { BeadsAdapter } from '@pwarnock/liaison/reconciler';
const adapter = new BeadsAdapter(true);
await adapter.listTasks();
```

## Test Coverage

All 9 tests passing:
- ✅ Create task with/without options
- ✅ List all tasks + filtering by status
- ✅ Get task by ID (exists/not found)
- ✅ Update task status
- ✅ Health check before operations
- ✅ Command structure validation

Run tests:
```bash
bun test packages/liaison/src/commands/task.test.ts
```

## Files Touched

**Created:**
- `packages/liaison/src/commands/task.ts` (~220 lines)
- `packages/liaison/src/commands/task.test.ts` (~192 lines)

**Modified:**
- `packages/liaison/src/cli.ts` (+6 lines)
- `packages/liaison-coordinator/src/utils/beads.ts` (+11 line comment)
- `BEADS-CODY-SYNC-QUICKSTART.md` (+22 lines)

## What's Next

The task CLI is now ready for use in workflows:

1. **User can create tasks directly:**
   ```bash
   liaison task create "Fix bug #123" --description "Crash on login"
   ```

2. **User can list/filter tasks:**
   ```bash
   liaison task list --status closed
   ```

3. **User can reconcile into version tasklists:**
   ```bash
   liaison reconcile --version v0.5.0
   ```

## Backward Compatibility

- `scripts/beads-cody-sync.py/.ts` unchanged (legacy generators)
- `BeadsClientImpl` unchanged, marked deprecated with migration notes
- `liaison reconcile` fully functional and unchanged
- All existing tests still pass

## Related Documentation

- See `docs/BEADS_CODY_RECONCILIATION_CONTRACT.md` for link strategy and task ID management
- See `AGENTS.md` for design principles (Ask → Plan → Approve → Execute)
- See `BEADS-CODY-SYNC-QUICKSTART.md` for user-facing quickstart
