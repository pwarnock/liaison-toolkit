# Reconciler Implementation Design

This document details the concrete implementation strategy for `liaison reconcile`.

## Module Structure

### Location: `packages/liaison/src/reconciler/`

```
packages/liaison/src/reconciler/
├── index.ts                       # Main entry point, export types + factory
├── adapter.ts                     # TaskBackendAdapter interface
├── adapters/
│   ├── beads-adapter.ts          # BeadsAdapter (bd CLI wrapper)
│   └── index.ts                  # Adapter factory
├── tasklist-parser.ts            # Parse/write markdown version tasklists
├── reconciler-engine.ts          # Core reconciliation logic
├── row-transformer.ts            # Strike-through, mark done, insert ID
└── types.ts                       # Shared types (Task, TaskStatus, VersionConfig, etc.)

packages/liaison/src/commands/
├── reconcile-command.ts          # CLI command: liaison reconcile
└── ...

packages/liaison/src/cli.ts       # Wire reconcile-command into main CLI

test/reconciler/
├── tasklist-parser.test.ts
├── row-transformer.test.ts
├── reconciler-engine.test.ts
├── adapters/
│   ├── beads-adapter.test.ts
│   └── mock-adapter.ts
└── fixtures/
    ├── sample-tasklist.md        # Fixture: version tasklist with mixed IDs
    ├── cody-version-tree.json    # Fixture: sample .cody/project/versions/ structure
    └── beads-tasks.json          # Fixture: sample backend task responses
```

## Core Modules

### 1. `types.ts` – Shared Data Types

```typescript
// Task backend interface
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  closedAt?: Date;
}

enum TaskStatus {
  Open = "open",
  Closed = "closed",
  Deleted = "deleted", // Special: returned by adapter if task no longer exists
}

// Version tasklist row
interface TasklistRow {
  id: string | null;      // Task ID from backend (null if not yet created)
  task: string;            // Task title
  description?: string;
  dependencies?: string;
  status: "todo" | "done" | "deleted"; // Local Cody status
  assignedTo?: string;
}

// Reconciliation result
interface ReconcileResult {
  version: string;
  originalRows: TasklistRow[];
  newRows: TasklistRow[];
  changes: RowChange[];
  created: number;  // Tasks created
  updated: number;  // Tasks updated (status only)
  deleted: number;  // Tasks marked deleted
}

interface RowChange {
  rowIndex: number;
  changeType: "created-id" | "marked-done" | "marked-deleted" | "no-change";
  oldRow: TasklistRow;
  newRow: TasklistRow;
}

// Version discovery config
interface VersionConfig {
  path: string;              // .cody/project/versions/v0.1.0-name
  version: string;           // v0.1.0-name
  tasklistPath: string;      // .cody/project/versions/v0.1.0-name/tasklist.md
  exists: boolean;
}
```

### 2. `adapter.ts` – TaskBackendAdapter Interface

```typescript
interface TaskBackendAdapter {
  // Query existing tasks
  getTask(id: string): Promise<Task | null>;
  listTasks(filters?: TaskFilter): Promise<Task[]>;
  
  // Mutate tasks
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  
  // Utility
  healthCheck(): Promise<boolean>;
  name(): string; // e.g., "beads", "github", "jira"
}

interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo?: string;
}

interface TaskFilter {
  status?: TaskStatus;
  assignedTo?: string;
}
```

### 3. `adapters/beads-adapter.ts` – Beads CLI Wrapper

```typescript
class BeadsAdapter implements TaskBackendAdapter {
  constructor(private commandRunner: CommandRunner) {}
  
  async getTask(id: string): Promise<Task | null> {
    // Run: bd list --id=<id> --json
    // Parse JSON response
  }
  
  async createTask(input: CreateTaskInput): Promise<Task> {
    // Run: bd create --title=<...> --json
    // Return parsed Task with assigned ID
  }
  
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    // Run: bd update --id=<id> --status=<status> --json
  }
  
  async listTasks(): Promise<Task[]> {
    // Run: bd list --json
    // Return all tasks
  }
  
  async healthCheck(): Promise<boolean> {
    // Run: bd version (or similar)
    // Return true if successful
  }
  
  name(): string {
    return "beads";
  }
}
```

### 4. `tasklist-parser.ts` – Markdown Table I/O

```typescript
class TasklistParser {
  // Parse version tasklist markdown
  parse(content: string): TasklistRow[] {
    // Extract markdown table
    // Map columns: ID | Task | Description | Dependencies | Status | Assigned To
    // Return rows (preserving markdown syntax, capture ~~strikethrough~~)
  }
  
  // Write updated tasklist
  stringify(rows: TasklistRow[], metadata?: VersionMetadata): string {
    // Rebuild markdown table
    // Apply formatting: ~~cell~~ for deleted rows
    // Preserve heading/footer if present
  }
  
  // Utilities
  parseRow(tableRow: string): TasklistRow | null;
  stringifyRow(row: TasklistRow): string;
}

interface VersionMetadata {
  version: string;
  description?: string;
  createdAt?: Date;
}
```

### 5. `row-transformer.ts` – Mutation Logic

```typescript
class RowTransformer {
  // Mark entire row as deleted (strike through each cell)
  markDeleted(row: TasklistRow): TasklistRow {
    return {
      ...row,
      id: row.id ? `~~${row.id}~~` : null,
      task: `~~${row.task}~~`,
      description: row.description ? `~~${row.description}~~` : undefined,
      dependencies: row.dependencies ? `~~${row.dependencies}~~` : undefined,
      status: "deleted",
      assignedTo: row.assignedTo ? `~~${row.assignedTo}~~` : undefined,
    };
  }
  
  // Mark row as done
  markDone(row: TasklistRow): TasklistRow {
    return { ...row, status: "done" };
  }
  
  // Insert task ID
  insertId(row: TasklistRow, id: string): TasklistRow {
    return { ...row, id };
  }
  
  // Check if row is marked deleted (has ~~...~~ in any cell)
  isMarkedDeleted(row: TasklistRow): boolean {
    // ...
  }
}
```

### 6. `reconciler-engine.ts` – Core Algorithm

```typescript
class ReconcilerEngine {
  constructor(
    private adapter: TaskBackendAdapter,
    private transformer: RowTransformer,
  ) {}
  
  async reconcile(
    rows: TasklistRow[],
    versionName: string,
    dryRun: boolean = false,
  ): Promise<ReconcileResult> {
    const changes: RowChange[] = [];
    const newRows: TasklistRow[] = [];
    let created = 0, updated = 0, deleted = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let newRow = { ...row };
      let changeType: RowChange["changeType"] = "no-change";
      
      if (this.transformer.isMarkedDeleted(row)) {
        // Already marked deleted; no action
        changeType = "no-change";
      } else if (!row.id) {
        // Row has no task ID: create task in backend
        try {
          const task = await this.adapter.createTask({
            title: row.task,
            description: row.description,
            assignedTo: row.assignedTo,
          });
          newRow = this.transformer.insertId(row, task.id);
          changeType = "created-id";
          created++;
        } catch (err) {
          logger.error(`Failed to create task for row ${i}: ${err.message}`);
          // Continue; row stays without ID
        }
      } else {
        // Row has ID: fetch status from backend
        const task = await this.adapter.getTask(row.id);
        
        if (!task || task.status === TaskStatus.Deleted) {
          // Task deleted in backend: strike through row
          newRow = this.transformer.markDeleted(row);
          changeType = "marked-deleted";
          deleted++;
        } else if (task.status === TaskStatus.Closed && row.status !== "done") {
          // Task closed in backend: mark row done
          newRow = this.transformer.markDone(row);
          changeType = "marked-done";
          updated++;
        }
        // Otherwise: no change (task is open or row already done)
      }
      
      newRows.push(newRow);
      if (changeType !== "no-change") {
        changes.push({ rowIndex: i, changeType, oldRow: row, newRow });
      }
    }
    
    return {
      version: versionName,
      originalRows: rows,
      newRows,
      changes,
      created,
      updated,
      deleted,
    };
  }
}
```

### 7. `reconcile-command.ts` – CLI Entry Point

```typescript
class ReconcileCommand implements Command {
  name = "reconcile";
  description = "Reconcile version tasklists with task backend";
  
  args = [
    { name: "version", optional: true, description: "Version name (e.g., v0.1.0-initial)" },
  ];
  
  options = [
    { name: "--all", description: "Reconcile all versions" },
    { name: "--backend", description: "Backend name (default: beads)", default: "beads" },
    { name: "--dry-run", description: "Show planned edits only" },
    { name: "--verbose", description: "Detailed output" },
  ];
  
  async run(args: string[], options: Record<string, any>) {
    // 1. Discover version tasklists
    const versions = await discoverVersions(options.all ? null : args[0]);
    
    // 2. Init adapter (beads, github, etc.)
    const adapter = adapterFactory.create(options.backend);
    await adapter.healthCheck();
    
    // 3. For each version:
    for (const versionConfig of versions) {
      const content = fs.readFileSync(versionConfig.tasklistPath, "utf-8");
      const rows = parser.parse(content);
      
      const result = await engine.reconcile(
        rows,
        versionConfig.version,
        options["dry-run"],
      );
      
      if (options["dry-run"]) {
        console.log(`[DRY RUN] ${versionConfig.version}: ${result.changes.length} changes`);
        result.changes.forEach(c => console.log(`  - ${c.changeType}`));
      } else {
        const newContent = parser.stringify(result.newRows, { version: versionConfig.version });
        fs.writeFileSync(versionConfig.tasklistPath, newContent);
        console.log(`✓ Reconciled ${versionConfig.version}: +${result.created} -${result.deleted} ~${result.updated}`);
      }
    }
  }
}
```

## Test Strategy

### Unit Tests

1. **tasklist-parser.test.ts**
   - Parse valid markdown tables
   - Parse tables with mixed ID/no-ID rows
   - Parse strikethrough rows
   - Round-trip: parse → stringify → parse (idempotent)

2. **row-transformer.test.ts**
   - markDeleted: all cells get ~~...~~
   - markDone: status changes to "done"
   - insertId: ID field populated
   - isMarkedDeleted: detect ~~...~~ in any cell

3. **reconciler-engine.test.ts** (with mock adapter)
   - Row without ID → creates task, inserts ID
   - Row with ID, backend closed → marks done
   - Row with ID, backend deleted → marks deleted
   - No changes when aligned
   - Error handling: failed create

4. **beads-adapter.test.ts** (with mocked command runner)
   - getTask: parses JSON response
   - createTask: returns task with assigned ID
   - listTasks: filters by status
   - healthCheck: calls bd version

### Integration/E2E Tests

- Fixture: temp `.cody/project/versions/v0.1.0-test/tasklist.md`
- Fixture: mock backend responses (JSON files)
- Run full reconcile cycle, verify file changes

### Test Fixtures

**fixtures/sample-tasklist.md**
```markdown
# v0.1.0-initial Tasklist

| ID | Task | Description | Dependencies | Status | Assigned To |
|---|---|---|---|---|---|
| abc-001 | Auth module | Implement JWT | - | 🟢 | AGENT |
| | Database setup | Create schema | - | 🟡 | HUMAN |
| def-002 | API endpoints | REST routes | Database setup | 🔴 | AGENT |
```

**fixtures/beads-tasks.json**
```json
[
  { "id": "abc-001", "title": "Auth module", "status": "closed", "createdAt": "2025-01-01" },
  { "id": "def-002", "title": "API endpoints", "status": "open", "createdAt": "2025-01-02" }
]
```

## Algorithm Flow (Reconcile)

```
For each version tasklist (.cody/project/versions/<version>/tasklist.md):
  1. Parse markdown table → rows
  2. For each row:
     a. If already marked deleted → skip
     b. If no ID:
        - Create task in backend → get ID
        - Insert ID into row
        - Log: created
     c. If has ID:
        - Query backend for task by ID
        - If task deleted → mark entire row deleted (strikethrough)
        - Else if backend closed AND row not done → mark row done
        - Else → no change
  3. Stringify rows → updated markdown
  4. Write file (unless --dry-run)
  5. Report: created/updated/deleted counts
```

## Dependencies

- `bd` CLI must be available (health check on startup)
- `packages/liaison` must export reconciler + command
- Markdown table parsing: use existing tooling (TBD: `markdown-table` or hand-parse)

## No Breaking Changes

- Legacy scripts remain in `scripts/` (marked deprecated in comments)
- New reconciler is opt-in CLI command
- Contract doc serves as specification for future adapters

## Next: Start Implementing?

Ready to create the module files and wire up the command?

Option:
- **A** = Create all source files (no tests yet)
- **B** = Create source + tests together
- **C** = Start with just adapter + parser (minimal slice)
