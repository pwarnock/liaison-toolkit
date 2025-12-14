#!/bin/bash

# Simple Build and Deploy Script for Liaison
# This script builds the liaison package and makes it available

echo "🚀 Building Liaison Package"
echo "=========================="
echo ""

# Check if we're in the right directory
if [[ ! -f "packages/liaison/package.json" ]]; then
    echo "❌ Error: Run this script from the root of the liaison-toolkit project"
    echo "   Expected: /home/pwarnock/github/liaison-toolkit"
    exit 1
fi

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed"
    echo "   Please install Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Build the package
echo "📦 Building liaison package..."
cd packages/liaison
bun run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Test the built package
echo "🧪 Testing built package..."
node dist/cli.js -h

if [ $? -ne 0 ]; then
    echo "❌ Test failed"
    exit 1
fi

echo "✅ Test passed"
echo ""

# Create a global symlink
echo "🔗 Creating global symlink..."
cd /home/pwarnock/github/liaison-toolkit

# Create symlink in ~/.local/bin (common user PATH)
mkdir -p ~/.local/bin
ln -sf "$PWD/packages/liaison/dist/cli.js" ~/.local/bin/liaison

# Make it executable
chmod +x ~/.local/bin/liaison

echo "✅ Symlink created at ~/.local/bin/liaison"
echo ""

# Add ~/.local/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo "📝 Adding ~/.local/bin to PATH..."
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    echo "✅ Added to PATH in ~/.bashrc and ~/.zshrc"
    echo ""
    echo "⚠️  IMPORTANT: Run 'source ~/.bashrc' or restart your terminal to use 'liaison' command"
fi

# Test the symlink
echo "✅ Verifying installation..."
~/.local/bin/liaison -h

if [ $? -ne 0 ]; then
    echo "❌ Verification failed"
    exit 1
fi

echo ""
echo "🎉 Success! Liaison is now available"
echo ""
echo "You can now use liaison from anywhere:"
echo "  ~/.local/bin/liaison -h        # Use with full path"
echo "  liaison -h                     # Use with short name (after sourcing ~/.bashrc)"
echo ""
echo "To disable caching:"
echo "  DISABLE_CACHE=true liaison -h"
echo ""
echo "To unlink later:"
echo "  rm ~/.local/bin/liaison"