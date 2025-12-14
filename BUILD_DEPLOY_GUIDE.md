# Building and Deploying Liaison Package

This guide shows you how to build and deploy the liaison package on your local machine.

## Prerequisites

- **Bun** installed (recommended) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (alternative) - if you prefer to use Node.js instead of Bun
- **Git** - for version control and dependencies

## Project Structure

```
/home/pwarnock/github/liaison-toolkit/
├── packages/
│   └── liaison/              # The main liaison CLI package
│       ├── src/              # Source code (TypeScript)
│       ├── dist/             # Compiled output (JavaScript)
│       ├── package.json      # Package configuration
│       └── ...
└── ...
```

## Step-by-Step Build Process

### 1. Navigate to the Liaison Package

```bash
cd /home/pwarnock/github/liaison-toolkit/packages/liaison
```

### 2. Install Dependencies (if needed)

```bash
# Using Bun (recommended)
bun install

# OR using npm (if you don't have Bun)
npm install
```

### 3. Build the Package

```bash
# Build the package
bun run build

# This command does:
# - Compiles TypeScript to JavaScript
# - Bundles all dependencies
# - Outputs to dist/cli.js
# - Creates a single executable file
```

### 4. Test the Built Package

```bash
# Test the built CLI
node dist/cli.js -h

# Expected output:
# Usage: liaison [options] [command]
# Liaison CLI - Workflow automation and task management
```

## Development Workflow

### During Development

```bash
# Watch mode - automatically rebuilds on changes
bun run dev

# Run without building (for testing)
bun run start

# Run tests
bun run test

# Lint code
bun run lint

# Type checking
bun run type-check
```

### Full Development Cycle

```bash
# 1. Start watch mode (in one terminal)
bun run dev

# 2. In another terminal, test changes
node dist/cli.js -h

# 3. Make changes to src/*.ts files
# 4. Watch automatically rebuilds
# 5. Test again
node dist/cli.js -h
```

## Installing the Package Globally

### Option 1: Link the Package (Recommended for Development)

```bash
# From the liaison package directory
cd /home/pwarnock/github/liaison-toolkit/packages/liaison

# Link the package globally
bun link --global

# OR using npm
npm link

# Now you can run 'liaison' from anywhere
liaison -h
```

### Option 2: Install from Local Path

```bash
# From any directory
npm install -g /home/pwarnock/github/liaison-toolkit/packages/liaison

# Or using Bun
bun add -g /home/pwarnock/github/liaison-toolkit/packages/liaison
```

### Option 3: Use Direct Path

```bash
# Create a symlink in your PATH
sudo ln -s /home/pwarnock/github/liaison-toolkit/packages/liaison/dist/cli.js /usr/local/bin/liaison

# Make it executable
sudo chmod +x /usr/local/bin/liaison

# Now you can run from anywhere
liaison -h
```

## Common Build Issues and Solutions

### Issue 1: "Command not found: bun"

**Solution**: Install Bun

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or using npm
npm install -g bun

# Verify installation
bun --version
```

### Issue 2: "Cannot find module" errors

**Solution**: Reinstall dependencies

```bash
# Remove node_modules and reinstall
rm -rf node_modules
bun install
```

### Issue 3: Build fails with TypeScript errors

**Solution**: Check for TypeScript issues

```bash
# Run type checking
bun run type-check

# Fix any errors shown
```

### Issue 4: "liaison command not found"

**Solution**: Check installation

```bash
# Check if package is linked
bun pm global list | grep liaison

# Re-link if needed
bun link --global

# Check PATH
echo $PATH
```

## Environment Variables

Set these for development:

```bash
# Disable caching for testing
export DISABLE_CACHE=true

# Enable debug mode
export DEBUG=true

# Enable verbose output
export VERBOSE=true

# Example usage
DISABLE_CACHE=true liaison task create "Test task"
```

## Building the Entire Monorepo

If you need to build all packages:

```bash
# From the root directory
cd /home/pwarnock/github/liaison-toolkit

# Build all packages
bun run build

# Or build just liaison
cd packages/liaison
bun run build
```

## Deployment Checklist

### Before Deploying

- [ ] Run tests: `bun run test`
- [ ] Check linting: `bun run lint`
- [ ] Type check: `bun run type-check`
- [ ] Build succeeds: `bun run build`
- [ ] Help works: `node dist/cli.js -h`

### After Deploying

- [ ] Command works globally: `liaison -h`
- [ ] All features work as expected
- [ ] No missing dependencies
- [ ] Version is correct

## Troubleshooting

### "Module not found" errors

This usually means a dependency is missing. Try:

```bash
# Reinstall all dependencies
rm -rf node_modules
bun install

# Or update dependencies
bun update
```

### "Permission denied" errors

```bash
# Make the file executable
chmod +x dist/cli.js

# Or run with node explicitly
node dist/cli.js -h
```

### "Port already in use" errors

If you're running a development server:

```bash
# Kill processes using the port
lsof -ti:3000 | xargs kill -9

# Or use a different port
bun run dev --port 4000
```

## Example Commands

```bash
# Basic usage
liaison -h
liaison --version

# Plugin management
liaison plugin list
liaison plugin load ./my-plugin.js

# Sync operations
liaison sync
liaison sync --force

# Status checks
liaison status
liaison health

# Task management
liaison task create "New task"
liaison task list
liaison task update 1 --status completed
```

## Notes

- The `dist/cli.js` file is the compiled, executable version
- Source files are in `src/` directory
- Always test with `node dist/cli.js -h` before linking globally
- Use `bun link --global` for easy development workflow
- The package supports both Node.js and Bun runtimes