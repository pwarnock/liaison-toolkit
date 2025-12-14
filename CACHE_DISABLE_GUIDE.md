# Disabling Caching in Liaison Toolkit

This document explains how to disable caching across the entire Liaison Toolkit system.

## Quick Disable Method

### Using Environment Variable (Recommended)

Set the `DISABLE_CACHE` environment variable to disable all caching:

```bash
# Disable all caching
DISABLE_CACHE=true liaison task create "Test task"

# Or set it permanently for your session
export DISABLE_CACHE=true
liaison task create "Test task"
```

### Using the Disable Script

Run the provided script to set all necessary environment variables:

```bash
./disable-cache.sh
```

This script sets:
- `DISABLE_CACHE=true`
- `CACHE_ENABLED=false`
- `LIAISON_CACHE_ENABLED=false`
- `GITHUB_CACHE_ENABLED=false`
- `BEADS_CACHE_ENABLED=false`
- `SYNC_CACHE_ENABLED=false`
- `OPENCODE_CACHE_SIZE=0`

## Cache Disable Options

### 1. Environment Variables

Set any of these environment variables to disable caching:

```bash
# Primary disable flag (affects all components)
export DISABLE_CACHE=true

# General cache disable
export CACHE_ENABLED=false
export LIAISON_CACHE_ENABLED=false

# Component-specific disables
export GITHUB_CACHE_ENABLED=false
export BEADS_CACHE_ENABLED=false
export SYNC_CACHE_ENABLED=false

# CLI cache disable
export OPENCODE_CACHE_SIZE=0
```

### 2. CacheManager Configuration

You can also disable caching by setting the backend to "none":

```typescript
import { CacheManager } from './CacheManager';

// Disable caching
const cache = new CacheManager({
  backend: "none",
  maxMemoryEntries: 0,
  maxDiskSize: 0,
});
```

## What Gets Disabled

When caching is disabled, the following components will not use caching:

### Core Components
- **CacheManager**: Returns no-op backend that doesn't store or retrieve data
- **CachedGitHubClient**: Bypasses all GitHub API caching
- **CachedBeadsClient**: Bypasses all Beads API caching
- **CachedSyncEngine**: Disables sync result caching

### CLI Components
- **cacheMiddleware**: Skips command result caching
- **Performance optimizations**: Cache-based performance improvements

### Cache Types Disabled
- **Memory cache**: In-memory data storage
- **Disk cache**: File-based data storage
- **Hybrid cache**: Automatic memory/disk routing
- **GitHub API cache**: Repository, issues, PRs, etc.
- **Beads API cache**: Workspace, issues, sync results, etc.
- **Sync operation cache**: Sync state and conflict resolution
- **CLI command cache**: Command result caching

## Verification

To verify caching is disabled, check that:

1. No cache files are created in `.cache/` directory
2. API calls are made on every request (no performance improvement from repeated calls)
3. Cache statistics show 0 hits and 0 misses
4. Command execution time remains consistent across multiple runs

## Use Cases for Disabling Caching

Disable caching when:

- **Debugging**: Ensure you're getting fresh data from APIs
- **Development**: Avoid stale cache during development
- **Testing**: Ensure tests use real API responses
- **Data consistency**: Need absolute latest data from external systems
- **Memory constraints**: Running on systems with limited memory
- **CI/CD pipelines**: Want consistent behavior without cache dependencies

## Re-enabling Caching

To re-enable caching, simply unset the environment variables:

```bash
# Remove cache disable flags
unset DISABLE_CACHE
unset CACHE_ENABLED
unset LIAISON_CACHE_ENABLED
unset GITHUB_CACHE_ENABLED
unset BEADS_CACHE_ENABLED
unset SYNC_CACHE_ENABLED
unset OPENCODE_CACHE_SIZE

# Or start a new shell session
```

## Performance Impact

When caching is disabled:
- **GitHub API calls**: Will hit rate limits faster
- **Beads API calls**: More API requests per operation
- **Sync operations**: Slower due to no cached results
- **CLI commands**: No command result caching
- **Overall performance**: Reduced due to no caching benefits

Expected performance impact:
- API calls: 70-80% more requests
- Response times: 60-70% slower for repeated operations
- Memory usage: Lower (no cache storage)
- Disk usage: No cache files created

## Troubleshooting

If caching is still active after setting environment variables:

1. **Check environment variables**:
   ```bash
   echo $DISABLE_CACHE
   echo $CACHE_ENABLED
   ```

2. **Restart services**: Ensure all processes pick up the new environment variables

3. **Verify cache backend**: Check that NoOpBackend is being used

4. **Check component initialization**: Ensure all clients are using the disabled cache configuration

## Implementation Details

The caching system uses a `NoOpBackend` class that implements the `CacheBackend` interface but performs no actual caching operations:

```typescript
class NoOpBackend implements CacheBackend {
  async get<T>(key: string): Promise<T | null> {
    return null; // Always return null (no cache hit)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Do nothing
  }

  async delete(key: string): Promise<void> {
    // Do nothing
  }

  async clear(): Promise<void> {
    // Do nothing
  }

  async keys(): Promise<string[]> {
    return []; // Empty list
  }

  async size(): Promise<number> {
    return 0; // No cache entries
  }
}
```

This ensures that disabling caching doesn't break the application - it just bypasses all caching functionality.