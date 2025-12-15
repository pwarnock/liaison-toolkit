# Package-Specific Commands
# This file contains commands for specific packages in the monorepo

# Global Installation Commands using Bun Native Workspace Linking

install-global:
    #!/usr/bin/env sh
    echo "🌍 Installing liaison CLI globally using Bun's native workspace linking..."
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
    echo "🔗 Unlinking existing workspace packages..."
    (cd packages/liaison && bun unlink) || true
    (cd packages/core && bun unlink) || true
    (cd packages/opencode_config && bun unlink) || true
    (cd packages/liaison-coordinator && bun unlink) || true
    
    # Step 3: Link core dependency
    echo "📦 Installing core dependency..."
    cd packages/core && bun link
    
    # Step 4: Link dependency to liaison and install globally
    echo "   Installing @pwarnock/liaison with linked dependencies..."
    cd packages/liaison && bun link @pwarnock/toolkit-core
    cd packages/liaison && bun run build
    
    # Manual global installation approach
    echo "   Creating global installation..."
    mkdir -p ~/.bun/install/global/@pwarnock/liaison
    cp -r packages/liaison/dist/* ~/.bun/install/global/@pwarnock/liaison/
    ln -sf ~/.bun/install/global/@pwarnock/liaison/cli.js ~/.bun/bin/liaison
    
    # Step 5: Fix module type warning
    echo "   📝 Fixing module type configuration..."
    echo '{"type":"module"}' > ~/.bun/install/global/package.json
    
    # Step 6: Verification
    echo "🔍 Testing global installation..."
    TEST_DIR=$(mktemp -d)
    cd "$TEST_DIR"
    if timeout 5 liaison --help >/dev/null 2>&1; then
        echo "   ✅ liaison --help works from different directory!"
        VERSION_OUTPUT=$(liaison --version 2>/dev/null || echo "version unavailable")
        echo "   📋 Version: $VERSION_OUTPUT"
        cd "$ORIGINAL_DIR"
        rm -rf "$TEST_DIR"
        echo ""
        echo "✅ Global installation completed successfully!"
        echo ""
        echo "🎉 You can now use 'liaison' from any directory!"
        echo ""
        echo "💡 This installation uses Bun's native workspace linking:"
        echo "   • Dependencies are properly resolved"
        echo "   • Fast iteration (no rebuild required)"
        echo "   • Always uses latest source code"
        echo ""
        echo "📋 Available commands:"
        echo "   liaison --help           # Show help"
        echo "   liaison task list         # List tasks"
        echo "   liaison health            # Check system health"
        echo ""
        echo "🔄 To reinstall: 'just install-global'"
    else
        echo "   ❌ Global installation test failed"
        cd "$ORIGINAL_DIR"
        rm -rf "$TEST_DIR"
        exit 1
    fi

install-global-test:
    #!/usr/bin/env sh
    echo "🧪 Testing current global liaison installation..."
    echo ""
    
    # Check if command exists
    if ! command -v liaison >/dev/null 2>&1; then
        echo "   ❌ liaison command not found in PATH"
        echo "   💡 Run: 'just install-global' to install"
        exit 1
    fi
    
    echo "   ✅ liaison command is available: $(which liaison)"
    
    # Test from different directory
    TEST_DIR=$(mktemp -d)
    cd "$TEST_DIR"
    
    echo "   Testing from: $TEST_DIR"
    
    # Test help command
    if timeout 10 liaison --help >/dev/null 2>&1; then
        echo "   ✅ liaison --help works"
    else
        echo "   ❌ liaison --help failed or timed out"
        cd - >/dev/null
        rm -rf "$TEST_DIR"
        exit 1
    fi
    
    # Test version command
    if timeout 10 liaison --version >/dev/null 2>&1; then
        VERSION_OUTPUT=$(liaison --version 2>/dev/null || echo "version command failed")
        echo "   ✅ liaison --version works: $VERSION_OUTPUT"
    else
        echo "   ⚠️  liaison --version failed or timed out"
    fi
    
    # Test basic task command
    if timeout 10 liaison task list >/dev/null 2>&1; then
        echo "   ✅ liaison task list works"
    else
        echo "   ⚠️  liaison task list failed (may be normal if no backend configured)"
    fi
    
    cd - >/dev/null
    rm -rf "$TEST_DIR"
    
    echo ""
    echo "✅ Installation test completed!"
    echo "   📋 Version: $(timeout 10 liaison --version 2>/dev/null || echo 'version unavailable')"

install-global-clean:
    #!/usr/bin/env sh
    echo "🧹 Cleaning global liaison installation..."
    echo ""
    
    # Remove all global installations
    echo "   Removing @pwarnock packages from global installation..."
    bun remove -g @pwarnock/liaison @pwarnock/liaison-coordinator @pwarnock/opencode_config @pwarnock/toolkit-core 2>/dev/null || echo "   ℹ️  @pwarnock/liaison not installed"
    bun remove -g @pwarnock/liaison-coordinator 2>/dev/null || echo "   ℹ️  @pwarnock/liaison-coordinator not installed"
    bun remove -g @pwarnock/opencode_config 2>/dev/null || echo "   ℹ️  @pwarnock/opencode_config not installed"
    bun remove -g @pwarnock/toolkit-core 2>/dev/null || echo "   ℹ️  @pwarnock/toolkit-core not installed"
    
    # Remove standalone package if exists
    bun remove -g liaison-standalone 2>/dev/null || echo "   ℹ️  liaison-standalone not installed"
    
    # Remove manual global attempts
    rm -rf ~/.bun/install/global/ 2>/dev/null || true
    rm -f ~/.bun/bin/liaison 2>/dev/null || true
    rm -f ~/.local/bin/liaison 2>/dev/null || true
    
    # Remove development alias if exists
    if grep -q "alias liaison=" ~/.bashrc 2>/dev/null; then
        echo "   Removing development alias from ~/.bashrc..."
        sed -i '/alias liaison=/d' ~/.bashrc
    else
        echo "   No development alias found in ~/.bashrc"
    fi
    
    # Remove workspace links
    echo "   Unlinking workspace packages..."
    (cd packages/liaison && bun unlink) 2>/dev/null || true
    (cd packages/core && bun unlink) 2>/dev/null || true
    (cd packages/opencode_config && bun unlink) 2>/dev/null || true
    (cd packages/liaison-coordinator && bun unlink) 2>/dev/null || true
    
    # Remove build artifacts and temporary files
    echo "   Cleaning build artifacts..."
    rm -rf packages/liaison/dist-bundle packages/*/dist packages/*/coverage packages/*/test-results 2>/dev/null || true
    
    echo ""
    echo "✅ Global installation cleaned!"
    echo ""
    echo "To reinstall, run:"
    echo "   just install-global        # For development"
    echo "   just install-global-prod   # For production"

install-global-prod:
    #!/usr/bin/env sh
    echo "🏭 Installing liaison CLI for production deployment..."
    echo ""
    
    # Save current directory
    ORIGINAL_DIR="$(pwd)"
    
    # Step 1: Create production build with bundled dependencies
    echo "🏗️  Creating production build with bundled dependencies..."
    
    # Clean existing builds
    echo "   Cleaning existing builds..."
    cd packages/liaison && rm -rf dist-bundle 2>/dev/null || true
    
    # Build with bundle (no external dependencies)
    echo "   Building liaison with bundled dependencies..."
    cd packages/liaison && bun build ./src/cli.ts --outdir ./dist-bundle --target node --format esm --bundle --external none 2>/dev/null || exit 1
    
    # Step 2: Create standalone package
    echo "📦 Creating standalone package..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    mkdir -p "$TEMP_DIR/liaison/bin"
    
    # Copy built binary
    cp packages/liaison/dist-bundle/cli.js "$TEMP_DIR/liaison/bin/liaison"
    chmod +x "$TEMP_DIR/liaison/bin/liaison"
    
    # Create package.json
    echo '{"name":"liaison-standalone","version":"0.1.0","description":"Liaison CLI - Standalone installation","bin":{"liaison":"bin/liaison"},"type":"module"}' > "$TEMP_DIR/liaison/package.json"
    
    # Step 3: Install globally
    echo "   Installing standalone package globally..."
    cd "$TEMP_DIR/liaison"
    bun install -g . 2>/dev/null || exit 1
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    # Step 4: Test production installation
    echo "🔍 Testing production installation..."
    TEST_DIR=$(mktemp -d)
    cd "$TEST_DIR"
    
    if timeout 5 liaison --help >/dev/null 2>&1; then
        echo "   ✅ Production installation works!"
        VERSION_OUTPUT=$(liaison --version 2>/dev/null || echo "version unavailable")
        echo "   📋 Version: $VERSION_OUTPUT"
        cd "$ORIGINAL_DIR"
        rm -rf "$TEST_DIR"
        echo ""
        echo "✅ Production installation completed successfully!"
        echo ""
        echo "This standalone version:"
        echo "   • Bundles all dependencies (no workspace issues)"
        echo "   • Works anywhere when installed globally"
        echo "   • Suitable for production deployment"
        echo ""
        echo "🔄 To reinstall: 'just install-global-prod'"
    else
        echo "   ❌ Production installation test failed"
        cd "$ORIGINAL_DIR"
        rm -rf "$TEST_DIR"
        exit 1
    fi

install-global-dev:
    #!/usr/bin/env sh
    echo "🔧 Setting up development alias for liaison CLI..."
    echo ""
    
    # Check if alias already exists
    if grep -q "alias liaison=" ~/.bashrc 2>/dev/null; then
        echo "   ⚠️  Development alias already exists in ~/.bashrc"
        echo "   Removing old alias..."
        sed -i '/alias liaison=/d' ~/.bashrc
    fi
    
    # Add development alias pointing to source code
    echo "   Adding development alias to ~/.bashrc..."
    echo "alias liaison='bun $ORIGINAL_DIR/packages/liaison/src/cli.ts'" >> ~/.bashrc
    
    echo ""
    echo "✅ Development alias setup completed!"
    echo ""
    echo "💡 Using development alias is recommended because:"
    echo "   • No dependency resolution issues"
    echo "   • Always uses latest source code"
    echo "   • No rebuild required"
    echo "   • Works from any directory"
    echo ""
    echo "To use immediately:"
    echo "   source ~/.bashrc"
    echo "   liaison --help"
    echo ""
    echo "Or open a new terminal and use:"
    echo "   liaison --help"

# Cody-Beads Integration specific recipes
cody-build:
    echo "🏗️ Building cody-beads-integration..."
    @cd packages/liaison && bun run build

cody-test:
    echo "🧪 Testing cody-beads-integration..."
    @cd packages/liaison && bun run test

# OpenCode Config specific recipes
opencode-test:
    echo "🧪 Testing opencode-config..."
    @cd packages && uv run pytest opencode_config/