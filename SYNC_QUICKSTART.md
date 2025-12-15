# Liaison Sync System Quick Start

## Installation
```bash
./scripts/sync-install.sh
```

## Basic Usage

### Manual Sync
```bash
# Python version (recommended)
python3 scripts/automated-sync.py --force

# TypeScript version
bun run scripts/automated-sync.ts --force
```

### CLI Integration
```bash
# Via liaison CLI
liaison sync --force
```

## Configuration

Edit `.sync-config.json` to customize sync behavior.

## Monitoring

Check sync status:
```bash
liaison health --component=sync
```

## Troubleshooting

1. **Sync fails**: Check `.beads-cody-sync.log` for details
2. **Lock issues**: Remove `.beads-cody-sync.lock` if stale
3. **Permission errors**: Run `chmod +x scripts/automated-sync.py`

## Git Integration

The sync system integrates with git hooks for automatic synchronization.
