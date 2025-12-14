#!/bin/bash

# Disable Caching in Liaison Toolkit
# This script sets environment variables to disable all caching

echo "🔧 Disabling all caching in Liaison Toolkit..."

# Disable main caching system
export DISABLE_CACHE=true
export CACHE_ENABLED=false
export LIAISON_CACHE_ENABLED=false

# Disable specific component caching
export GITHUB_CACHE_ENABLED=false
export BEADS_CACHE_ENABLED=false
export SYNC_CACHE_ENABLED=false

# Disable CLI caching
export OPENCODE_CACHE_SIZE=0

echo "✅ All caching has been disabled!"
echo ""
echo "Environment variables set:"
echo "  DISABLE_CACHE=true"
echo "  CACHE_ENABLED=false"
echo "  LIAISON_CACHE_ENABLED=false"
echo "  GITHUB_CACHE_ENABLED=false"
echo "  BEADS_CACHE_ENABLED=false"
echo "  SYNC_CACHE_ENABLED=false"
echo "  OPENCODE_CACHE_SIZE=0"
echo ""
echo "You can now run liaison commands without caching."
echo "Example: DISABLE_CACHE=true liaison task create 'Test task'"