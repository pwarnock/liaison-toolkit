#!/bin/bash

# Build and Deploy Liaison Package
# This script builds the liaison package and makes it available globally

echo "🚀 Building and Deploying Liaison Package"
echo "=================================="
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "packages/liaison/package.json" ]]; then
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

# Step 1: Build the package
echo "📦 Building packages..."
cd packages/liaison
bun run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Step 2: Test the built package
echo "🧪 Testing built package..."
cd dist
node cli.js -h

if [ $? -ne 0 ]; then
    echo "❌ Test failed"
    exit 1
fi

echo "✅ Test passed"
echo ""

# Step 3: Deploy (link globally)
cd /home/pwarnock/github/liaison-toolkit/packages/liaison

echo "🔗 Linking package globally..."
bun link --global

if [ $? -ne 0 ]; then
    echo "❌ Global link failed"
    exit 1
fi

echo "✅ Package linked globally"
echo ""

# Step 4: Verify installation
echo "✅ Verifying installation..."
cd /home/pwarnock/github/liaison-toolkit
liaison -h

if [ $? -ne 0 ]; then
    echo "❌ Verification failed"
    exit 1
fi

echo ""
echo "🎉 Success! Liaison is now available globally"
echo ""
echo "You can now use liaison from anywhere:"
echo "  liaison -h                    # Show help"
echo "  liaison --version             # Show version"
echo "  liaison plugin list           # List plugins"
echo "  liaison sync                  # Sync systems"
echo "  liaison task create 'Task'    # Create task"
echo ""
echo "To unlink the package later:"
echo "  bun pm global unlink liaison"
echo ""
echo "To disable caching:"
echo "  DISABLE_CACHE=true liaison -h"