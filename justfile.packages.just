# Package-Specific Commands
# This file contains commands for specific packages

# Cody-Beads Integration specific recipes
cody-build:
    echo "🏗️ Building cody-beads-integration..."
    @cd packages/liaison && bun run build

cody-test:
    echo "🧪 Testing cody-beads-integration..."
    @cd packages/liaison && bun run test

cody-dev:
    echo "🚀 Starting cody-beads-integration development..."
    @cd packages/liaison && bun run dev

cody-clean:
    echo "🧹 Cleaning cody-beads-integration..."
    @cd packages/liaison && bun run clean

cody-lint:
    echo "🔍 Linting cody-beads-integration..."
    @cd packages/liaison && bun run lint

cody-format:
    echo "✨ Formatting cody-beads-integration..."
    @cd packages/liaison && bun run format

# OpenCode Config specific recipes
opencode-test:
    echo "🧪 Testing opencode-config..."
    @cd packages && uv run pytest

opencode-lint:
    echo "🔍 Linting opencode-config..."
    @cd packages && uv run ruff check opencode_config/
    @cd packages && uv run mypy opencode_config/

opencode-format:
    echo "✨ Formatting opencode-config..."
    @cd packages && uv run black opencode_config/
    @cd packages && uv run ruff format opencode_config/

# Global Installation Commands
install-global:
    #!/usr/bin/env sh
    echo "🌍 Installing liaison CLI globally..."
    echo ""
    
    # Save current directory
    ORIGINAL_DIR="$(pwd)"
    
    # Step 1: Try the global installation approach
    echo "📦 Attempting global package installation..."
    
    # Clean existing installation
    echo "   Cleaning existing global installation..."
    bun remove -g @pwarnock/liaison @pwarnock/liaison-coordinator @pwarnock/opencode_config @pwarnock/toolkit-core || true
    
    # Build packages first
    echo "   Building all packages..."
    bun run build
    
    # Try to install globally (this may fail due to workspace dependency issues)
    echo "   Installing @pwarnock/toolkit-core (required dependency)..."
    if cd packages/core && bun link --global 2>/dev/null; then
        echo "   ✅ toolkit-core linked globally"
        cd "$ORIGINAL_DIR"
        
        echo "   Installing @pwarnock/liaison (main CLI)..."
        if cd packages/liaison && bun link --global 2>/dev/null; then
            echo "   ✅ liaison linked globally"
            cd "$ORIGINAL_DIR"
            
            echo "   Installing optional packages..."
            cd packages/opencode_config && bun link --global 2>/dev/null || echo "   ⚠️  opencode_config not linked"
            cd packages/liaison-coordinator && bun link --global 2>/dev/null || echo "   ⚠️  liaison-coordinator not linked"
            cd "$ORIGINAL_DIR"
            
            echo ""
            echo "🔍 Testing global installation..."
            
            # Test from different directory
            TEST_DIR=$(mktemp -d)
            cd "$TEST_DIR"
            if timeout 5 liaison --help >/dev/null 2>&1; then
                echo "   ✅ Global installation works!"
                cd "$ORIGINAL_DIR"
                rm -rf "$TEST_DIR"
                echo ""
                echo "✅ Global installation completed successfully!"
                echo ""
                echo "You can now use 'liaison' from any directory."
                exit 0
            else
                echo "   ❌ Global installation test failed"
                cd "$ORIGINAL_DIR"
                rm -rf "$TEST_DIR"
            fi
        else
            cd "$ORIGINAL_DIR"
        fi
    else
        cd "$ORIGINAL_DIR"
    fi
    
    # Step 2: Fallback to development alias (reliable approach)
    echo ""
    echo "⚠️  Global installation failed due to workspace dependency resolution"
    echo "   Falling back to development alias (recommended for development)..."
    echo ""
    
    # Remove any existing alias
    if grep -q "alias liaison=" ~/.bashrc 2>/dev/null; then
        echo "   Removing existing development alias..."
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
    echo ""
    echo "For production deployment, use: 'just install-prod'"

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
    
    # Add new alias pointing to source code
    echo "   Adding development alias to ~/.bashrc..."
    echo "alias liaison='bun $(pwd)/packages/liaison/src/cli.ts'" >> ~/.bashrc
    
    echo ""
    echo "✅ Development alias added!"
    echo ""
    echo "To use immediately:"
    echo "   source ~/.bashrc"
    echo "   liaison --help"
    echo ""
    echo "Or open a new terminal and use:"
    echo "   liaison --help"
    echo ""
    echo "This uses source code directly (no rebuild needed)."

install-global-test:
    #!/usr/bin/env sh
    echo "🧪 Testing current global liaison installation..."
    echo ""
    
    # Check if command exists
    if ! command -v liaison >/dev/null 2>&1; then
        echo "   ❌ liaison command not found in PATH"
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

install-global-prod:
    #!/usr/bin/env sh
    echo "🏭 Installing liaison CLI for production deployment..."
    echo ""
    
    # Save current directory
    ORIGINAL_DIR="$(pwd)"
    
    # Step 1: Create production build
    echo "🏗️  Creating production build with bundled dependencies..."
    
    # Clean existing builds
    echo "   Cleaning existing builds..."
    cd packages/liaison && rm -rf dist-bundle && cd "$ORIGINAL_DIR"
    
    # Build liaison with bundled dependencies
    echo "   Building liaison with bundled dependencies..."
    cd packages/liaison
    bun build ./src/cli.ts --outdir ./dist-bundle --target node --format esm --bundle
    cd "$ORIGINAL_DIR"
    
    if [ ! -f "packages/liaison/dist-bundle/cli.js" ]; then
        echo "❌ Production build failed"
        exit 1
    fi
    
    # Step 2: Create standalone package
    echo "📦 Creating standalone package..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    mkdir -p "$TEMP_DIR/liaison/bin"
    
    # Copy built binary
    cp packages/liaison/dist-bundle/cli.js "$TEMP_DIR/liaison/bin/liaison"
    chmod +x "$TEMP_DIR/liaison/bin/liaison"
    
    # Create package.json for standalone using echo
    echo '{"name":"liaison-standalone","version":"0.1.0","description":"Liaison CLI - Standalone installation","bin":{"liaison":"bin/liaison"},"type":"module"}' > "$TEMP_DIR/liaison/package.json"
    
    # Step 3: Install globally
    echo "   Installing standalone package globally..."
    cd "$TEMP_DIR/liaison"
    bun install -g .
    cd "$ORIGINAL_DIR"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    # Step 4: Test installation
    echo "🔍 Testing production installation..."
    TEST_DIR=$(mktemp -d)
    cd "$TEST_DIR"
    
    if timeout 5 liaison --help >/dev/null 2>&1; then
        echo "   ✅ Production installation works!"
        VERSION_OUTPUT=$(liaison --version 2>/dev/null || echo "version not available")
        echo "   📋 Version: $VERSION_OUTPUT"
    else
        echo "   ❌ Production installation failed"
        cd "$ORIGINAL_DIR"
        rm -rf "$TEST_DIR"
        exit 1
    fi
    
    cd "$ORIGINAL_DIR"
    rm -rf "$TEST_DIR"
    
    # Cleanup build artifacts
    rm -rf packages/liaison/dist-bundle
    
    echo ""
    echo "✅ Production installation completed successfully!"
    echo ""
    echo "This standalone version:"
    echo "   • Bundles all dependencies (no workspace issues)"
    echo "   • Works from any directory"
    echo "   • Suitable for production deployment"
    echo ""
    echo "For development, use: 'just install-global-dev'"

install-global-clean:
    #!/usr/bin/env sh
    echo "🧹 Cleaning global liaison installation..."
    echo ""
    
    # Remove all liaison-related packages
    echo "   Removing @pwarnock packages from global installation..."
    bun remove -g @pwarnock/liaison || echo "   ℹ️  @pwarnock/liaison not installed"
    bun remove -g @pwarnock/liaison-coordinator || echo "   ℹ️  @pwarnock/liaison-coordinator not installed"
    bun remove -g @pwarnock/opencode_config || echo "   ℹ️  @pwarnock/opencode_config not installed"
    bun remove -g @pwarnock/toolkit-core || echo "   ℹ️  @pwarnock/toolkit-core not installed"
    
    # Remove standalone package if exists
    bun remove -g liaison-standalone || echo "   ℹ️  liaison-standalone not installed"
    
    # Remove development alias if exists
    if grep -q "alias liaison=" ~/.bashrc 2>/dev/null; then
        echo "   Removing development alias from ~/.bashrc..."
        sed -i '/alias liaison=/d' ~/.bashrc
    else
        echo "   No development alias found in ~/.bashrc"
    fi
    
    echo ""
    echo "✅ Global installation cleaned!"
    echo ""
    echo "To reinstall, run:"
    echo "   just install-global        # For development"
    echo "   just install-global-prod  # For production"