#!/bin/bash
set -e

echo "🚬 Running CLI Smoke Test..."

# Resolve absolute path to CLI
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_PATH="$PROJECT_ROOT/packages/liaison/dist/cli.js"

# Check if file exists
if [ ! -f "$CLI_PATH" ]; then
    echo "❌ CLI binary not found at $CLI_PATH"
    echo "   Did you run 'just build'?"
    exit 1
fi

# Run help
echo "Testing --help..."
node "$CLI_PATH" --help > /dev/null
echo "✅ --help passed"

# Run version
echo "Testing --version..."
node "$CLI_PATH" --version > /dev/null
echo "✅ --version passed"

# Run health (core component only for speed)
echo "Testing health (core)..."
node "$CLI_PATH" health --component core --format json > /dev/null
echo "✅ health passed"

echo "🎉 Smoke test passed!"
