# Reconciler Test Execution Guide

Reference: **owk-v5o-09** (Multi-layered testing framework)
Sub-tasks: **owk-v5o-09-01** through **owk-v5o-09-07**

## Test File Location

```
packages/liaison/src/reconciler/reconciler.e2e.test.ts
```

## Test Organization

### 7 E2E Test Suites (Atomic Tasks)

| ID | Suite | Description | Tests | Duration |
|----|-------|-------------|-------|----------|
| owk-v5o-09-01 | Phase 1: Environment Verification | Verify prerequisites (directory exists, bd available, backend healthy) | 5 | ~2s |
| owk-v5o-09-02 | Phase 1b: Tasklist Parsing | Parse v0.5.0 tasklist, extract rows, identify IDs | 3 | ~1s |
| owk-v5o-09-03 | Phase 2: Dry-Run Analysis | File preservation on dry-run | 2 | ~1s |
| owk-v5o-09-04 | Phase 3: Reconciliation Mutations | Identify rows needing ID creation, status updates, deletion | 3 | ~1s |
| owk-v5o-09-05 | Phase 2b: Multi-Version Discovery | Discover all versions, find tasklists | 2 | ~1s |
| owk-v5o-09-06 | Phase 4: File Integrity | Validate markdown structure and column consistency | 2 | ~1s |
| owk-v5o-09-07 | Phase 3b: Error Handling | Handle missing/empty/malformed tasklists | 3 | ~1s |

**Total**: 20 test cases, ~8 seconds execution time

## How to Run Tests

### Run All Reconciler Tests

```bash
cd packages/liaison
bun test src/reconciler
```

Expected output:
```
src/reconciler/reconciler.e2e.test.ts:
  Phase 1: Environment Verification
    ✓ should find .cody/project/versions directory
    ✓ should discover at least one version tasklist
    ✓ should find v0.5.0/tasklist.md
    ✓ should verify bd CLI is available
    ✓ should verify Beads backend is healthy

  Phase 1b: Tasklist Parsing
    ✓ should parse v0.5.0/tasklist.md without errors
    ✓ should extract markdown table rows from v0.5.0
    ✓ should identify rows with IDs

  ... (etc for all 7 suites)

 20 pass
 0 fail
Ran 20 tests
```

### Run Specific Test Suite

```bash
# Environment verification only
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 1: Environment"

# Tasklist parsing only
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 1b: Tasklist"

# Error handling only
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 3b: Error"
```

### Run with Verbose Output

```bash
bun test src/reconciler/reconciler.e2e.test.ts --reporter=verbose
```

## Test Requirements & Assumptions

### Environment Prerequisites

- ✅ `.cody/project/versions/` directory exists (checked in test)
- ✅ `v0.5.0/tasklist.md` exists (checked in test)
- ⚠️ `bd` CLI available (warned if missing, test continues)
- ⚠️ Beads backend healthy (warned if missing, test continues)

### Key Test Files

- Tasklist: `.cody/project/versions/v0.5.0/tasklist.md`
- Versions: `.cody/project/versions/v0.5.0*` (v0.5.0, v0.5.0-alpha, v0.5.0-beta, owk-qyf)

## Test Execution Phases

### Phase 1: Foundation (owk-v5o-09-01 + owk-v5o-09-02)
**Status**: ✅ Ready to execute
- Verify directory structure
- Parse real tasklist
- Identity IDs in rows

**Run**:
```bash
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 1"
```

### Phase 2: Discovery (owk-v5o-09-03 + owk-v5o-09-05)
**Status**: ✅ Ready to execute
- Verify dry-run doesn't write
- Discover all versions

**Run**:
```bash
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 2"
```

### Phase 3: Mutations (owk-v5o-09-04 + owk-v5o-09-07)
**Status**: ✅ Ready to execute
- Simulate ID creation detection
- Simulate status update detection
- Error handling

**Run**:
```bash
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 3"
```

### Phase 4: Integrity (owk-v5o-09-06)
**Status**: ✅ Ready to execute
- Validate markdown structure
- Check column consistency

**Run**:
```bash
bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 4"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Reconciler E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd packages/liaison && bun test src/reconciler
```

## Test Coverage

### What These Tests Cover

✅ **Environment Verification**
- Directory structure exists
- bd CLI availability
- Beads backend health

✅ **Tasklist I/O**
- Parsing markdown tables
- Row extraction
- ID identification

✅ **Reconciliation Logic (Simulation)**
- ID creation detection
- Status update simulation
- Deletion detection

✅ **Error Handling**
- Missing tasklists
- Empty files
- Malformed markdown

### What These Tests Don't Cover (Yet)

- 🔴 Actual task creation in Beads (`liaison reconcile` execution)
- 🔴 File writes to tasklist
- 🔴 Status field updates in markdown
- 🔴 Strikethrough row generation

**Note**: Those are covered by Phase 3-4 of the E2E_TEST_PLAN.md (manual dry-run + live tests).

## Debugging Tests

### View Test Output

```bash
bun test src/reconciler/reconciler.e2e.test.ts --reporter=verbose 2>&1 | tee test-output.log
```

### Check Tasklist Path

```bash
ls -la .cody/project/versions/v0.5.0/
```

### Check bd CLI

```bash
bun x bd --version
bun x bd list --json | jq length
```

### Parse Tasklist Manually

```bash
cat .cody/project/versions/v0.5.0/tasklist.md | grep "^|" | wc -l
```

## Next Steps

1. **Run Phase 1 tests**: `bun test src/reconciler/reconciler.e2e.test.ts -t "Phase 1"`
2. **Review output**: All 8 tests in Phase 1 should pass
3. **Proceed with manual E2E**: Follow `docs/E2E_TEST_PLAN.md` Phases 1-4
4. **Mark tasks complete**: Update owk-v5o-09-01 through owk-v5o-09-07 in v0.5.0 tasklist

## Related Documentation

- **Design**: `docs/RECONCILER_IMPLEMENTATION_DESIGN.md`
- **Completion**: `docs/RECONCILER_IMPLEMENTATION_COMPLETE.md`
- **E2E Plan**: `docs/E2E_TEST_PLAN.md`
- **Cody Reference**: `.cody/project/versions/v0.5.0/tasklist.md` (owk-v5o-09-*)
