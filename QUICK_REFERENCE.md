# Quick Reference: Building and Deploying Liaison

## One-Command Build and Deploy

```bash
# From the project root
./simple-build-and-deploy.sh
```

This will:
1. ✅ Build the package
2. ✅ Test the build
3. ✅ Create a global symlink
4. ✅ Add to your PATH
5. ✅ Verify installation

## Manual Steps (if you prefer)

### 1. Build the Package

```bash
cd /home/pwarnock/github/liaison-toolkit/packages/liaison
bun run build
```

### 2. Test the Build

```bash
node dist/cli.js -h
```

Expected output:
```
Usage: liaison [options] [command]
Liaison CLI - Workflow automation and task management
```

### 3. Make it Available Globally

```bash
# Create symlink
mkdir -p ~/.local/bin
ln -sf /home/pwarnock/github/liaison-toolkit/packages/liaison/dist/cli.js ~/.local/bin/liaison
chmod +x ~/.local/bin/liaison

# Add to PATH (one-time setup)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 4. Verify Installation

```bash
liaison -h
```

## Common Commands

```bash
# Basic usage
liaison -h                    # Help
liaison --version             # Version

# Plugin management
liaison plugin list           # List loaded plugins
liaison plugin load ./plugin  # Load a plugin

# Sync operations
liaison sync                  # Sync systems
liaison sync --force          # Force sync

# Task management
liaison task create "Task"    # Create task
liaison task list             # List tasks
liaison task update 1 --status completed  # Update task

# Status and health
liaison status                # Show status
liaison health                # Health check
```

## Development Workflow

```bash
# During development
cd packages/liaison

# Watch mode (auto-rebuild on changes)
bun run dev

# Run tests
bun run test

# Run without building
bun run start

# Build manually
bun run build
```

## Environment Variables

```bash
# Disable caching
export DISABLE_CACHE=true

# Enable debug mode
export DEBUG=true

# Enable verbose output
export VERBOSE=true

# Example usage
DISABLE_CACHE=true liaison task create "Test task"
```

## Troubleshooting

### "Command not found: liaison"
```bash
# Check if symlink exists
ls -la ~/.local/bin/liaison

# Check PATH
echo $PATH | grep .local/bin

# Source bashrc
source ~/.bashrc
```

### "Permission denied"
```bash
# Make executable
chmod +x ~/.local/bin/liaison
```

### Build fails
```bash
# Reinstall dependencies
rm -rf node_modules
bun install

# Try building again
bun run build
```

## File Locations

- **Source**: `/home/pwarnock/github/liaison-toolkit/packages/liaison/src/`
- **Built**: `/home/pwarnock/github/liaison-toolkit/packages/liaison/dist/cli.js`
- **Global symlink**: `~/.local/bin/liaison`
- **Config**: `~/.bashrc` (for PATH)

## Quick Test

```bash
# Test with full path
~/.local/bin/liaison -h

# Test with short name (after sourcing)
liaison -h

# Test with caching disabled
DISABLE_CACHE=true liaison -h
```