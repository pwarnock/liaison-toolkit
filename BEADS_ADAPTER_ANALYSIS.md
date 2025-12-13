# BeadsAdapter Implementation Analysis

## Current Implementation Overview

The `BeadsAdapter` class in `packages/liaison/src/reconciler/adapters/beads-adapter.ts` is a wrapper around the `bd` CLI tool that implements the `TaskBackendAdapter` interface.

### Key Components

1. **Import and Setup**
   - Imports `exec` from `child_process`
   - Creates `execPromise` using `promisify(exec)`
   - Has a helper function `execWithTimeout` for adding timeout functionality

2. **Command Prefix Structure**
   - `commandPrefix: string[]` - Stores the base command
   - Constructor accepts `useBunX: boolean` parameter
   - If `useBunX` is true: `['bun', 'x', 'bd']`
   - If `useBunX` is false: `['bd']`

3. **execPromise Usage Patterns**

   The `execPromise` is used in 5 different methods:

   a) **getTask(id: string)** - Line 31-32

   ```typescript
   const { stdout } = await execPromise(
     [...this.commandPrefix, 'list', `--id=${id}`, '--json'].join(' ')
   );
   ```

   - Command: `bd list --id=<ID> --json`
   - Returns JSON output with task details

   b) **listTasks(filters?: TaskFilter)** - Line 53-55

   ```typescript
   const { stdout } = (await execWithTimeout(
     [...this.commandPrefix, ...args].join(' ')
   )) as any;
   ```

   - Command: `bd list --json` (with optional filters)
   - Uses `execWithTimeout` wrapper with 10 second default timeout
   - Returns JSON array of tasks

   c) **createTask(input: CreateTaskInput)** - Line 75-76

   ```typescript
   const { stdout } = await execPromise(
     [...this.commandPrefix, ...args].join(' ')
   );
   ```

   - Command: `bd create --title="..." --description="..." --assigned-to="..." --json`
   - Returns JSON with created task

   d) **updateTaskStatus(id: string, status: TaskStatus)** - Line 87-94

   ```typescript
   const { stdout } = await execPromise(
     [...this.commandPrefix, 'update', id, `--status=${status}`, '--json'].join(
       ' '
     )
   );
   ```

   - Command: `bd update <ID> --status=<STATUS> --json`
   - Returns JSON with updated task

   e) **healthCheck()** - Line 113-115

   ```typescript
   const check = execPromise([...this.commandPrefix, '--version'].join(' '));
   ```

   - Command: `bd --version`
   - Used with Promise.race for 5 second timeout
   - Returns version string

### Current Implementation Issues

1. **String Concatenation Approach**
   - All commands use `[...this.commandPrefix, ...args].join(' ')`
   - This creates a single string command which can be problematic for:
     - Shell injection vulnerabilities
     - Complex arguments with spaces
     - Special characters in arguments

2. **Error Handling**
   - Some methods return `null` on error (getTask)
   - Some methods throw errors (createTask, updateTaskStatus)
   - Inconsistent error handling strategy

3. **Timeout Implementation**
   - Only `listTasks` uses `execWithTimeout`
   - Other methods could benefit from timeout protection
   - Health check has custom timeout implementation

## Spawn vs Exec Comparison

### Current exec Approach

- **Pros:**
  - Simpler API for capturing stdout/stderr
  - Returns combined output
  - Built-in buffering

- **Cons:**
  - Spawns shell by default (security concern)
  - Limited control over process
  - Can hang on large output
  - No streaming capability
  - Shell injection vulnerabilities

### Proposed spawn Approach

- **Pros:**
  - More control over the spawned process
  - Can stream output in real-time
  - Better for long-running commands
  - No shell by default (more secure)
  - Can handle large output better
  - Can kill process tree more easily

- **Cons:**
  - More complex API
  - Need to manually handle stdout/stderr streams
  - Requires buffering for complete output

## Migration Strategy

### Step 1: Create spawnPromise Utility

Replace `execPromise` with a `spawnPromise` function that:

- Uses `spawn` from `child_process`
- Takes command as array (no string concatenation)
- Returns `{ stdout, stderr, exitCode }`
- Handles streaming and buffering

### Step 2: Update Command Construction

Change from:

```typescript
[...this.commandPrefix, ...args].join(' ');
```

To:

```typescript
[...this.commandPrefix, ...args];
```

Pass the array directly to spawnPromise.

### Step 3: Update execWithTimeout

Modify to use spawnPromise instead of execPromise.

### Step 4: Update healthCheck

Replace custom Promise.race with spawnPromise + timeout.

### Step 5: Test All Methods

Ensure all CRUD operations work correctly:

- getTask
- listTasks
- createTask
- updateTaskStatus
- healthCheck

## Benefits of Migration

1. **Security**: No shell injection vulnerabilities
2. **Reliability**: Better handling of edge cases
3. **Performance**: Can stream output for long operations
4. **Control**: Can kill process trees more effectively
5. **Consistency**: Unified approach across all methods

## Implementation Plan

1. Create `spawnPromise` utility function
2. Update all method calls to use spawnPromise
3. Remove execPromise and execWithTimeout
4. Test thoroughly with various scenarios
5. Document changes
