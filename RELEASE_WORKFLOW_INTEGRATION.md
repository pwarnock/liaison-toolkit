# Recommended Release Workflow Integration

## Current Issue
The `just release-*` commands use manual version bumping while `just release` uses Changesets. This creates conflicting workflows.

## Recommended Solution
Update the justfile to use Changesets for all release operations.

### Option 1: Replace manual release commands with Changesets
```bash
# Instead of:
just release-patch

# Use:
changeset add --patch
just release  # or just publish
```

### Option 2: Update justfile to use changesets
Update `justfile.release.just` to:
1. Create changeset files instead of bumping versions
2. Run `changeset version` to update versions
3. Run `changeset publish` to publish

### Benefits of Changesets:
- ✅ Monorepo-aware versioning
- ✅ Automated changelog generation
- ✅ Consistent release process
- ✅ Better dependency management

### Current Commands That Work:
- `just release` → Uses Changesets ✅
- `just publish` → Uses Changesets ✅

### Commands That Need Update:
- `just release-patch` → Should use Changesets
- `just release-minor` → Should use Changesets  
- `just release-major` → Should use Changesets