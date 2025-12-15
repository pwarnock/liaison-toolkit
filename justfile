# Justfile for Liaison Toolkit
# Modern replacement for Make with better syntax and features
# This is the main entry point that includes all modular justfiles

# Include modular justfiles
mod justfile_core "./justfile.core.just"
mod justfile_packages "./justfile.packages.just"
mod justfile_qa "./justfile.qa.just"
mod justfile_release "./justfile.release.just"
mod justfile_bd "./justfile.bd.just"

# BD (beads) Issue Tracker Commands
# Check for ready work
bd-ready:
    #!/usr/bin/env sh
    echo "📋 Checking for ready work..."
    ./scripts/bd-wrapper.sh ready

# Default recipe
default:
    @echo "Liaison Toolkit"
    @echo ""
    @echo "Available recipes:"
    @echo "  setup        - Initialize development environment"
    @echo "  bd-setup     - Setup bd (beads) issue tracker"
    @echo "  bd-ready     - Check for ready work"
    @echo "  bd-create    - Create new bd issue"
    @echo "  build        - Build all packages"
    @echo "  test         - Run all tests"
    @echo "  lint         - Lint all code"
    @echo "  format       - Format all code"
    @echo "  clean        - Clean build artifacts"
    @echo "  dev          - Start development mode"
    @echo "  deploy       - Deploy packages"
    @echo ""
    @echo "Package-specific recipes:"
    @echo "  cody-build   - Build cody-beads-integration"
    @echo "  cody-test    - Test cody-beads-integration"
    @echo "  opencode-test - Test opencode-config"
    @echo ""
    @echo "Task Management (Simple Commands):"
    @echo "  just list        - List all tasks"
    @echo "  just create      - Create a new task"
    @echo "  just update      - Update a task"
    @echo "  just close       - Close a task"
    @echo "  just next        - Get next task"
    @echo "  just sync        - Start synchronization"
    @echo "  just config      - Show configuration"
    @echo ""
    @echo "Quality Assurance & Testing:"
    @echo "  just qa           - Run QA checks (lint + test + security)"
    @echo "  just ci           - Simulate CI/CD pipeline"
    @echo "  just pre-push     - Run all pre-push validations (⭐ use before git push)"
    @echo "  just type-check   - Run TypeScript type checking"
    @echo "  just security-scan - Run security scans"
    @echo "  just health       - Health checks (parallel)"
    @echo "  just health-precise - Health checks (sequential)"
    @echo "  just health-sync   - Sync status check"
    @echo "  just health-coordinator - Coordinator health"
    @echo "  just health-deps   - Dependency verification"
    @echo "  just health-config - Configuration validation"
    @echo "  just smoke-test    - Run CLI smoke tests"
    @echo ""
    @echo "Release Management:"
    @echo "  just release-patch - Create patch release"
    @echo "  just release-minor - Create minor release"
    @echo "  just release-major - Create major release"
    @echo ""
    @echo "Documentation:"
    @echo "  just docs       - Generate documentation"
    @echo "  just help       - Show this help"
    @echo ""
    @echo "Quick shortcuts:"
    @echo "  just b          - Build"
    @echo "  just t          - Test"
    @echo "  just l          - Lint"
    @echo "  just f          - Format"
    @echo "  just d          - Dev mode"
    @echo "  just c          - Clean"

# Package-specific recipes
cody-build:
    echo "🏗️ Building cody-beads-integration..."
    @cd packages/liaison && bun run build

cody-test:
    echo "🧪 Testing cody-beads-integration..."
    @cd packages/liaison && bun run test

opencode-test:
    echo "🧪 Testing opencode-config..."
    @cd packages && uv run pytest

# Liaison CLI Commands (Simple, descriptive names)
# Underlying command chain remains 'liaison', but just commands are simplified

# Task Commands
list:
    node packages/liaison-coordinator/bin/liaison.js task list

create title description="":
    node packages/liaison-coordinator/bin/liaison.js task create --title "{{title}}" --description "{{description}}"

update id status description="":
    node packages/liaison-coordinator/bin/liaison.js task update --id "{{id}}" --status "{{status}}" --description "{{description}}"

close id description="":
    node packages/liaison-coordinator/bin/liaison.js task update --id "{{id}}" --status "closed" --description "{{description}}"

# Configuration Commands
config-setup:
    node packages/liaison-coordinator/bin/liaison.js config setup

config-test:
    node packages/liaison-coordinator/bin/liaison.js config test

config-show:
    node packages/liaison-coordinator/bin/liaison.js config show

# Sync Commands
sync:
    # Check if GitHub is configured, skip if not
    @if node -e "const config = require('./cody-beads.config.json'); process.exit(!(config.github && config.github.token && config.github.token !== '\${GITHUB_TOKEN}') ? 0 : 1)"; then \
        echo "ℹ️  GitHub integration is not configured. Skipping GitHub sync."; \
        echo "    Use 'just config-setup' to configure GitHub integration when ready."; \
    else \
        node packages/liaison-coordinator/bin/liaison.js sync; \
    fi

sync-dry-run:
    # Check if GitHub is configured, skip if not
    @if node -e "const config = require('./cody-beads.config.json'); process.exit(!(config.github && config.github.token && config.github.token !== '\${GITHUB_TOKEN}') ? 0 : 1)"; then \
        echo "ℹ️  GitHub integration is not configured. Skipping GitHub sync."; \
        echo "    Use 'just config-setup' to configure GitHub integration when ready."; \
    else \
        node packages/liaison-coordinator/bin/liaison.js sync --dry-run; \
    fi

# Health Check System
health:
    # Run comprehensive health checks with parallel execution
    @echo "🏥 Running comprehensive health checks..."
    @python3 scripts/health-check.py --format=json | jq '.'

health-precise:
    # Run precise health checks sequentially for accuracy
    @echo "🔍 Running precise health checks (sequential)..."
    @cd packages/liaison && bun run dist/cli.js health --sequential --format=json | jq '.'

health-sync:
    # Check sync status and Beads integration
    @echo "🔄 Checking sync status..."
    @cd packages/liaison && bun run dist/cli.js health --component=sync --format=json | jq '.'

health-coordinator:
    # Check liaison coordinator health
    @echo "🎛️ Checking coordinator health..."
    @node packages/liaison-coordinator/bin/liaison.js health --format=json

health-deps:
    # Verify dependencies and build tools
    @echo "📦 Verifying dependencies..."
    @cd packages/liaison && bun run dist/cli.js health --component=deps --format=json | jq '.'

health-config:
    # Validate configuration files
    @echo "⚙️ Validating configuration..."
    @cd packages/liaison && bun run dist/cli.js health --component=config --format=json | jq '.'

health-verbose:
    # Run health checks with detailed output
    @echo "🏥 Running detailed health checks..."
    @cd packages/liaison && bun run dist/cli.js health --verbose --format=json | jq '.'

smoke-test:
    # Run CLI smoke tests
    @./scripts/cli_smoke_test.sh

# Aliases for backward compatibility and common usage patterns
next:
    # Get the next available task (filter for open/pending tasks)
    @uv run python scripts/get-next-task.py

# Quick shortcuts for task management
task-list: list
config: config-show

# Package Management:
# Global Installation Commands for liaison CLI

# Install liaison CLI globally using Bun workspace linking (recommended for development)
install-global:
    @echo "🚀 Installing liaison CLI globally using Bun workspace linking..."
    @cd packages/liaison && bun link --global
    @echo "✅ liaison CLI installed globally"
    @echo "💡 Test with: liaison --help"

# Install liaison CLI with bundled dependencies (production use)
install-global-prod:
    @echo "📦 Installing liaison CLI with bundled dependencies (production)..."
    @echo "ℹ️  This creates a self-contained global installation"
    @cd packages/liaison && bun run build
    @mkdir -p ~/.bun/install/global/node_modules/@pwarnock
    @cp -r packages/core/dist ~/.bun/install/global/node_modules/@pwarnock/toolkit-core/
    @cp -r packages/liaison/dist ~/.bun/install/global/node_modules/@pwarnock/liaison/
    @echo "✅ Production installation complete"
    @echo "💡 Test with: liaison --help"

# Setup development alias (fastest iteration)
install-global-dev:
    @echo "⚡ Setting up development alias for liaison CLI..."
    @mkdir -p ~/.local/bin
    @echo '#!/usr/bin/env bash' > ~/.local/bin/liaison
    @echo '# Development alias for liaison CLI' >> ~/.local/bin/liaison
    @echo 'node /home/pwarnock/github/liaison-toolkit/packages/liaison/dist/cli.js "$@"' >> ~/.local/bin/liaison
    @chmod +x ~/.local/bin/liaison
    @echo "✅ Development alias created at ~/.local/bin/liaison"
    @echo "💡 Test with: liaison --help"

# Test current global installation
install-global-test:
    @echo "🧪 Testing current global liaison CLI installation..."
    @if command -v liaison >/dev/null 2>&1; then \
        echo "✅ liaison command found in PATH"; \
        liaison --version; \
        echo "✅ liaison --version works"; \
        liaison --help >/dev/null 2>&1 && echo "✅ liaison --help works" || echo "❌ liaison --help failed"; \
    else \
        echo "❌ liaison command not found in PATH"; \
        echo "💡 Try: just install-global or just install-global-dev"; \
        exit 1; \
    fi

# Clean global installation
install-global-clean:
    @echo "🧹 Cleaning global liaison CLI installation..."
    @if command -v liaison >/dev/null 2>&1; then \
        bun remove --global @pwarnock/liaison 2>/dev/null || true; \
    fi
    @rm -f ~/.bun/bin/liaison
    @rm -rf ~/.bun/install/global/node_modules/@pwarnock/liaison
    @rm -rf ~/.bun/install/global/node_modules/@pwarnock/toolkit-core
    @rm -f ~/.local/bin/liaison
    @echo "✅ Global installation cleaned"

# Fix broken global installation (fixes silent failures)
install-global-fix:
    @echo "🔧 Fixing broken liaison CLI global installation..."
    @echo "🔄 This will fix silent failures and dependency issues"
    
    # Clean any broken installation
    just --unstable install-global-clean
    
    # Create the working wrapper (same as what we implemented manually)
    @mkdir -p ~/.local/bin
    @echo '#!/usr/bin/env bun' > ~/.local/bin/liaison
    @echo '' >> ~/.local/bin/liaison
    @echo '// Fixed wrapper for liaison CLI with proper error handling' >> ~/.local/bin/liaison
    @echo 'import { $ } from "bun";' >> ~/.local/bin/liaison
    @echo 'import chalk from "chalk";' >> ~/.local/bin/liaison
    @echo '' >> ~/.local/bin/liaison
    @echo '// Enhanced error handling' >> ~/.local/bin/liaison
    @echo 'process.on("uncaughtException", (error) => {' >> ~/.local/bin/liaison
    @echo '  console.error(chalk.red("❌ Uncaught exception:"), error.message);' >> ~/.local/bin/liaison
    @echo '  process.exit(1);' >> ~/.local/bin/liaison
    @echo '});' >> ~/.local/bin/liaison
    @echo '' >> ~/.local/bin/liaison
    @echo 'process.on("unhandledRejection", (reason, promise) => {' >> ~/.local/bin/liaison
    @echo '  console.error(chalk.red("❌ Unhandled rejection:"), reason);' >> ~/.local/bin/liaison
    @echo '  process.exit(1);' >> ~/.local/bin/liaison
    @echo '});' >> ~/.local/bin/liaison
    @echo '' >> ~/.local/bin/liaison
    @echo '// Execute the CLI directly using Bun' >> ~/.local/bin/liaison
    @echo 'try {' >> ~/.local/bin/liaison
    @echo '  const cliPath = "/home/pwarnock/github/liaison-toolkit/packages/liaison/dist/cli.js";' >> ~/.local/bin/liaison
    @echo '  const args = process.argv.slice(2);' >> ~/.local/bin/liaison
    @echo '  ' >> ~/.local/bin/liaison
    @echo '  // Execute the CLI with all arguments' >> ~/.local/bin/liaison
    @echo '  const result = await $`node ${cliPath} ${args}`;' >> ~/.local/bin/liaison
    @echo '  ' >> ~/.local/bin/liaison
    @echo '  // The $ operator already prints stdout and stderr' >> ~/.local/bin/liaison
    @echo '  // Just exit with the result'"'"'s exit code' >> ~/.local/bin/liaison
    @echo '  process.exit(result.exitCode);' >> ~/.local/bin/liaison
    @echo '  ' >> ~/.local/bin/liaison
    @echo '} catch (error) {' >> ~/.local/bin/liaison
    @echo '  console.error(chalk.red("❌ Failed to execute CLI:"), error);' >> ~/.local/bin/liaison
    @echo '  process.exit(1);' >> ~/.local/bin/liaison
    @echo '}' >> ~/.local/bin/liaison
    @chmod +x ~/.local/bin/liaison
    
    # Update global symlink to point to our working wrapper
    @rm -f ~/.bun/bin/liaison
    @ln -s ~/.local/bin/liaison ~/.bun/bin/liaison
    
    @echo "✅ Fixed liaison CLI wrapper created"
    @echo "🧪 Testing the fix..."
    @liaison --help >/dev/null 2>&1 && echo "✅ liaison --help works!" || echo "❌ liaison --help still failing"
    @echo ""
    @echo "🎉 liaison CLI global installation fixed!"
    @echo "💡 All commands now work globally with proper error reporting"
    @echo "💡 Test with: liaison --help"

# Help system
help:
    @echo "Liaison Toolkit - Just Task Runner"
    @echo ""
    @echo "Core Development:"
    @echo "  just setup      - Initialize development environment"
    @echo "  just build      - Build all packages"
    @echo "  just test       - Run all tests"
    @echo "  just lint       - Lint all code"
    @echo "  just format     - Format all code"
    @echo "  just clean      - Clean build artifacts"
    @echo "  just dev        - Start development mode"
    @echo ""
    @echo "BD (Beads) Commands:"
    @echo "  just bd-setup   - Setup bd (beads) issue tracker"
    @echo "  just bd-ready   - Check for ready work"
    @echo "  just bd-create  - Create new bd issue"
    @echo "  just bd-update  - Update bd issue"
    @echo "  just bd-close   - Close bd issue"
    @echo "  just bd-list    - List all bd issues"
    @echo "  just bd-show    - Show bd issue details"
    @echo ""
    @echo "Task Management (Simple Commands):"
    @echo "  just list        - List all tasks"
    @echo "  just create      - Create a new task"
    @echo "  just update      - Update a task"
    @echo "  just close       - Close a task"
    @echo "  just next        - Get next task"
    @echo "  just sync        - Start synchronization"
    @echo "  just config      - Show configuration"
    @echo ""
    @echo "Package Management:"
    @echo "  just cody-*       - Cody-Beads integration commands"
    @echo "  just opencode-*   - OpenCode config commands"
    @echo "  just install-global        - Install liaison CLI globally using Bun workspace linking (⭐ recommended for development)"
    @echo "  just install-global-prod   - Install liaison CLI with bundled dependencies (production)"
    @echo "  just install-global-dev     - Setup development alias (fastest iteration)"
    @echo "  just install-global-test   - Test current global installation"
    @echo "  just install-global-clean  - Clean global installation"
    @echo "  just install-global-fix    - Fix broken global installation (🔧 fixes silent failures)"
    @echo ""
    @echo "Quality Assurance & Testing:"
    @echo "  just qa           - Run QA checks (lint + test + security)"
    @echo "  just ci           - Simulate CI/CD pipeline"
    @echo "  just pre-push     - Run all pre-push validations (⭐ use before git push)"
    @echo "  just type-check   - Run TypeScript type checking"
    @echo "  just security-scan - Run security scans"
    @echo "  just health       - Health checks"
    @echo ""
    @echo "Release Management:"
    @echo "  just release-patch - Create patch release"
    @echo "  just release-minor - Create minor release"
    @echo "  just release-major - Create major release"
    @echo ""
    @echo "Documentation:"
    @echo "  just docs       - Generate documentation"
    @echo "  just help       - Show this help"
    @echo ""
    @echo "Quick shortcuts:"
    @echo "  just b          - Build"
    @echo "  just t          - Test"
    @echo "  just l          - Lint"
    @echo "  just f          - Format"
    @echo "  just d          - Dev mode"
    @echo "  just c          - Clean"
