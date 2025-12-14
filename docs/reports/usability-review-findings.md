# Liaison CLI Usability Review Findings

**Date**: 2025-12-13
**Reviewer**: OpenCode Agent

## Executive Summary
The liaison CLI review revealed a **critical usability issue** that prevented the tool from running out of the box due to missing file extensions in ESM imports. Once patched, the CLI demonstrated good usability, clear output, and effective task management capabilities. The "dogfooding" process was successfully completed after applying local fixes.

## Critical Findings (Severity: Critical)

### 1. CLI Execution Failure (Import Errors)
- **Issue**: The `liaison` CLI failed to execute immediately due to `ERR_UNSUPPORTED_DIR_IMPORT` and `ERR_MODULE_NOT_FOUND` errors.
- **Root Cause**: Source files in `packages/liaison/src` (specifically in `commands/` and `reconciler/`) were importing modules without `.js` extensions or using directory imports (e.g., `import ... from '../reconciler'`), which is not supported in the project's ESM build configuration.
- **Impact**: New users or agents cannot use the tool without manual code fixes.
- **Fix Applied**: Manually updated imports in `reconciler.ts`, `task.ts`, `beads-adapter.ts`, `reconciler-engine.ts`, `adapter.ts`, and `tasklist-parser.ts` to include `.js` extensions.
- **Task Created**: `owk-c3x` (Fix CLI Import Errors)

## High Priority Findings (Severity: High)

### 2. Build Process Errors
- **Issue**: The build process (`tsc` via `bun run build`) emits TypeScript errors regarding test files (`task.test.ts`) and duplicate exports (`index.ts`), even though it successfully emits JavaScript files.
- **Impact**: confusing for developers, potential for hidden bugs, and creates "noise" in CI pipelines.
- **Task Created**: `owk-g4e` (Fix TypeScript Build Errors)

## Medium Priority Findings (Severity: Medium)

### 3. Health Check JSON Parsing Failure
- **Issue**: `liaison health` reported the "coordinator" component as unhealthy due to a "JSON decode error".
- **Root Cause**: The `checkCoordinator` method in `health.ts` attempts to parse the output line-by-line. The coordinator returns pretty-printed multi-line JSON, so the parser grabs only the first line (`{`), which is invalid JSON.
- **Impact**: False negative in health checks.
- **Task Created**: `owk-4lu` (Fix Health Check JSON Parsing)

## Positive Findings
- **Command Discoverability**: Commands like `task list`, `task create`, and `health` are intuitive and follow standard CLI patterns.
- **Output Quality**: The use of `chalk` for colored output and tables for lists makes the data easy to read.
- **Performance**: Commands execute reasonably fast (sub-second for local operations).
- **Dogfooding**: The tool is capable of managing its own development tasks effectively.

## Recommendations
1.  **Immediate Fix**: Apply the import fixes to the codebase and ensure all future imports use explicit `.js` extensions or update the build process to handle them (e.g., using a bundler like `tsup` or `esbuild` instead of `tsc` for the CLI binary).
2.  **Fix Health Check**: Update `HealthChecker.checkCoordinator` to accumulate output before parsing JSON.
3.  **Clean Build**: Resolve TypeScript errors to ensure a clean `just build` or `npm run build`.
4.  **Regression Testing**: Add a simple "smoke test" script that runs `liaison --help` and `liaison health` after build to catch import errors early.

## Tasks Generated
- `owk-c3x`: Fix CLI Import Errors
- `owk-g4e`: Fix TypeScript Build Errors
- `owk-4lu`: Fix Health Check JSON Parsing
