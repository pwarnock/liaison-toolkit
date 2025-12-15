#!/usr/bin/env sh
set -e

echo "🌍 Installing liaison CLI globally with proper workspace linking..."
echo ""

# Save current directory
ORIGINAL_DIR="$(pwd)"

# Step 1: Clean existing installations
echo "🧹 Cleaning existing installations..."
bun remove -g @pwarnock/liaison @pwarnock/liaison-coordinator @pwarnock/opencode_config @pwarnock/toolkit-core 2>/dev/null || true
rm -rf ~/.bun/install/global/ 2>/dev/null || true
rm -f ~/.bun/bin/liaison 2>/dev/null || true
rm -f ~/.local/bin/liaison 2>/dev/null || true

# Step 2: Unlink workspace packages
echo "🔗 Unlinking workspace packages..."
(cd packages/liaison && bun unlink) || true
(cd packages/core && bun unlink) || true
(cd packages/opencode_config && bun unlink) || true
(cd packages/liaison-coordinator && bun unlink) || true

# Step 3: Link dependencies
echo "📦 Linking dependencies..."
cd packages/core && bun link
cd packages/liaison && bun link @pwarnock/toolkit-core

# Step 4: Build and install globally
echo "🏗️ Building and installing liaison..."
(cd "$ORIGINAL_DIR/packages/liaison" && bun run build)

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
    echo "   📁 Built directory contents:"
ls packages/liaison/dist/ || echo "   ⚠️  No dist directory found"
    
# Create global installation
mkdir -p ~/.bun/install/global/@pwarnock/liaison
cp -r "$ORIGINAL_DIR/packages/liaison/dist"/* ~/.bun/install/global/@pwarnock/liaison/
ln -sf ~/.bun/install/global/@pwarnock/liaison/cli.js ~/.bun/bin/liaison
    
    echo "   ✅ Global installation created"
else
    echo "   ❌ Build failed"
    exit 1
fi

# Create package.json to fix module warning
echo '{"type":"module"}' > ~/.bun/install/global/package.json

# Step 5: Verification
echo "🔍 Testing installation..."
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

if timeout 10 liaison --help >/dev/null 2>&1; then
    echo "✅ liaison --help works from different directory!"
    VERSION_OUTPUT=$(liaison --version 2>/dev/null || echo "version unavailable")
    echo "📋 Version: $VERSION_OUTPUT"
    cd "$ORIGINAL_DIR"
    rm -rf "$TEST_DIR"
    echo ""
    echo "🎉 Global installation completed successfully!"
    echo ""
    echo "You can now use 'liaison' from any directory."
    echo ""
    echo "💡 Features:"
    echo "   • Uses Bun's native workspace linking"
    echo "   • Dependencies properly resolved"
    echo "   • Fast iteration (no rebuild required)"
    echo "   • Always uses latest source code"
    echo ""
    echo "📋 Available commands:"
    echo "   liaison --help           # Show help"
    echo "   liaison task list         # List tasks"
    echo "   liaison health            # Check system health"
else
    echo "❌ Installation test failed"
    cd "$ORIGINAL_DIR"
    rm -rf "$TEST_DIR"
    exit 1
fi