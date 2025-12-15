#!/bin/bash
# Liaison Toolkit Sync System Installation Script
# Formal, repeatable installation for Beads-Cody synchronization
# Usage: ./scripts/sync-install.sh [--force] [--verbose]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SYNC_SCRIPT_PY="${PROJECT_ROOT}/scripts/automated-sync.py"
SYNC_SCRIPT_TS="${PROJECT_ROOT}/scripts/automated-sync.ts"
LOG_FILE="${PROJECT_ROOT}/.sync-install.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables
FORCE_INSTALL=false
VERBOSE=false
ERRORS=0
WARNINGS=0

# Logging functions
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
    
    case "$level" in
        "ERROR")
            echo -e "${RED}❌ ERROR: ${message}${NC}" >&2
            ((ERRORS++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARNING: ${message}${NC}"
            ((WARNINGS++))
            ;;
        "INFO")
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}ℹ️  ${message}${NC}"
            fi
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ ${message}${NC}"
            ;;
        "HEADER")
            echo -e "${BLUE}🚀 ${message}${NC}"
            ;;
    esac
}

# Utility functions
check_command() {
    local cmd="$1"
    if command -v "$cmd" >/dev/null 2>&1; then
        log "INFO" "$cmd is available"
        return 0
    else
        log "ERROR" "$cmd is not installed"
        return 1
    fi
}

check_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        log "INFO" "File exists: $file"
        return 0
    else
        log "ERROR" "File missing: $file"
        return 1
    fi
}

check_directory() {
    local dir="$1"
    if [[ -d "$dir" ]]; then
        log "INFO" "Directory exists: $dir"
        return 0
    else
        log "INFO" "Creating directory: $dir"
        mkdir -p "$dir" || {
            log "ERROR" "Failed to create directory: $dir"
            return 1
        }
        return 0
    fi
}

# Installation steps
check_dependencies() {
    log "HEADER" "Checking dependencies..."
    
    local deps_met=true
    
    # Check Python 3
    if ! check_command "python3"; then
        log "ERROR" "Python 3 is required but not installed"
        deps_met=false
    fi
    
    # Check git
    if ! check_command "git"; then
        log "ERROR" "Git is required but not installed"
        deps_met=false
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log "ERROR" "Not in a git repository"
        deps_met=false
    fi
    
    # Check Bun (optional but recommended)
    if ! check_command "bun"; then
        log "WARN" "Bun is not installed - TypeScript sync will not work"
    fi
    
    if [[ "$deps_met" == "false" ]]; then
        log "ERROR" "Dependency check failed"
        return 1
    fi
    
    log "SUCCESS" "All dependencies satisfied"
    return 0
}

install_sync_scripts() {
    log "HEADER" "Installing sync scripts..."
    
    # Make Python script executable
    if check_file "$SYNC_SCRIPT_PY"; then
        chmod +x "$SYNC_SCRIPT_PY" || {
            log "ERROR" "Failed to make $SYNC_SCRIPT_PY executable"
            return 1
        }
        log "SUCCESS" "Python sync script is executable"
    else
        log "ERROR" "Python sync script not found - run git restore"
        return 1
    fi
    
    # Make TypeScript script executable if it exists
    if check_file "$SYNC_SCRIPT_TS"; then
        chmod +x "$SYNC_SCRIPT_TS" || {
            log "WARN" "Failed to make $SYNC_SCRIPT_TS executable"
        }
        log "SUCCESS" "TypeScript sync script is executable"
    else
        log "INFO" "TypeScript sync script not found (optional)"
    fi
    
    log "SUCCESS" "Sync scripts installed"
    return 0
}

setup_directories() {
    log "HEADER" "Setting up directories..."
    
    # Create sync state directory
    check_directory "${PROJECT_ROOT}/.cody/project/build" || return 1
    
    # Create log directory
    check_directory "${PROJECT_ROOT}/.logs" || return 1
    
    # Create backup directory
    check_directory "${PROJECT_ROOT}/.backups" || return 1
    
    log "SUCCESS" "Directories setup complete"
    return 0
}

validate_installation() {
    log "HEADER" "Validating installation..."
    
    local validation_passed=true
    
    # Test Python sync script
    if [[ -x "$SYNC_SCRIPT_PY" ]]; then
        log "INFO" "Testing Python sync script..."
        if python3 "$SYNC_SCRIPT_PY" --help >/dev/null 2>&1; then
            log "SUCCESS" "Python sync script validation passed"
        else
            log "ERROR" "Python sync script validation failed"
            validation_passed=false
        fi
    else
        log "ERROR" "Python sync script is not executable"
        validation_passed=false
    fi
    
    # Test TypeScript sync script (if available)
    if [[ -x "$SYNC_SCRIPT_TS" ]]; then
        log "INFO" "Testing TypeScript sync script..."
        if bun run "$SYNC_SCRIPT_TS" --help >/dev/null 2>&1; then
            log "SUCCESS" "TypeScript sync script validation passed"
        else
            log "WARN" "TypeScript sync script validation failed"
        fi
    else
        log "INFO" "TypeScript sync script not available (optional)"
    fi
    
    # Test liaison CLI integration
    log "INFO" "Testing liaison CLI integration..."
    if command -v liaison >/dev/null 2>&1; then
        if liaison sync --help >/dev/null 2>&1; then
            log "SUCCESS" "Liaison CLI sync integration working"
        else
            log "ERROR" "Liaison CLI sync integration failed"
            validation_passed=false
        fi
    else
        log "INFO" "Liaison CLI not found (optional)"
    fi
    
    if [[ "$validation_passed" == "true" ]]; then
        log "SUCCESS" "Installation validation passed"
        return 0
    else
        log "ERROR" "Installation validation failed"
        return 1
    fi
}

create_configuration() {
    log "HEADER" "Creating configuration..."
    
    # Create sync configuration file
    local config_file="${PROJECT_ROOT}/.sync-config.json"
    cat > "$config_file" << EOF
{
  "version": "1.0.0",
  "sync": {
    "enabled": true,
    "default_mode": "python",
    "lock_timeout": 300,
    "auto_commit": true,
    "validation_enabled": true
  },
  "paths": {
    "beads_file": ".beads/issues.jsonl",
    "cody_build_dir": ".cody/project/build",
    "state_file": ".beads-cody-sync-state.json",
    "log_file": ".beads-cody-sync.log"
  },
  "notifications": {
    "on_error": true,
    "on_success": false,
    "email": ""
  }
}
EOF
    
    log "SUCCESS" "Configuration created at $config_file"
    return 0
}

generate_quickstart() {
    log "HEADER" "Generating quick start guide..."
    
    local quickstart_file="${PROJECT_ROOT}/SYNC_QUICKSTART.md"
    cat > "$quickstart_file" << 'EOF'
# Liaison Sync System Quick Start

## Installation
```bash
./scripts/sync-install.sh
```

## Basic Usage

### Manual Sync
```bash
# Python version (recommended)
python3 scripts/automated-sync.py --force

# TypeScript version
bun run scripts/automated-sync.ts --force
```

### CLI Integration
```bash
# Via liaison CLI
liaison sync --force
```

## Configuration

Edit `.sync-config.json` to customize sync behavior.

## Monitoring

Check sync status:
```bash
liaison health --component=sync
```

## Troubleshooting

1. **Sync fails**: Check `.beads-cody-sync.log` for details
2. **Lock issues**: Remove `.beads-cody-sync.lock` if stale
3. **Permission errors**: Run `chmod +x scripts/automated-sync.py`

## Git Integration

The sync system integrates with git hooks for automatic synchronization.
EOF
    
    log "SUCCESS" "Quick start guide created at $quickstart_file"
    return 0
}

show_summary() {
    log "HEADER" "Installation Summary"
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    INSTALLATION COMPLETE                   ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                                                            ║"
    echo "║  📁 Project Root: $(pwd)                         ║"
    echo "║  🔧 Sync Script: scripts/automated-sync.py                 ║"
    echo "║  ⚙️  Config File: .sync-config.json                        ║"
    echo "║  📝 Quick Start: SYNC_QUICKSTART.md                        ║"
    echo "║  📊 Health Check: liaison health --component=sync          ║"
    echo "║                                                            ║"
    echo "║  Next Steps:                                               ║"
    echo "║  1. Test sync: liaison sync --force                       ║"
    echo "║  2. Check health: liaison health                           ║"
    echo "║  3. Read SYNC_QUICKSTART.md for usage guide                ║"
    echo "║                                                            ║"
    if [[ $ERRORS -gt 0 ]]; then
        echo "║  ❌ Errors: $ERRORS                                              ║"
    else
        echo "║  ✅ No errors detected                                       ║"
    fi
    if [[ $WARNINGS -gt 0 ]]; then
        echo "║  ⚠️  Warnings: $WARNINGS                                          ║"
    else
        echo "║  ✅ No warnings detected                                     ║"
    fi
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    if [[ $ERRORS -gt 0 ]]; then
        log "ERROR" "Installation completed with $ERRORS errors"
        log "INFO" "Check ${LOG_FILE} for details"
        return 1
    else
        log "SUCCESS" "Installation completed successfully"
        return 0
    fi
}

# Main installation function
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║        Liaison Toolkit Sync System Installation            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_INSTALL=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--force] [--verbose]"
                echo ""
                echo "Options:"
                echo "  --force     Force installation even if issues are detected"
                echo "  --verbose   Enable verbose output"
                echo "  --help      Show this help message"
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Initialize log file
    echo "Starting sync system installation at $(date)" > "$LOG_FILE"
    
    # Run installation steps
    check_dependencies || {
        log "ERROR" "Dependency check failed"
        if [[ "$FORCE_INSTALL" != "true" ]]; then
            log "INFO" "Use --force to continue anyway"
            exit 1
        fi
    }
    
    install_sync_scripts || {
        log "ERROR" "Failed to install sync scripts"
        exit 1
    }
    
    setup_directories || {
        log "ERROR" "Failed to setup directories"
        exit 1
    }
    
    create_configuration || {
        log "ERROR" "Failed to create configuration"
        exit 1
    }
    
    validate_installation || {
        log "ERROR" "Installation validation failed"
        if [[ "$FORCE_INSTALL" != "true" ]]; then
            log "INFO" "Use --force to continue anyway"
            exit 1
        fi
    }
    
    generate_quickstart || {
        log "WARN" "Failed to generate quick start guide"
    }
    
    show_summary
    local exit_code=$?
    
    # Final log entry
    echo "Installation completed at $(date)" >> "$LOG_FILE"
    if [[ $exit_code -eq 0 ]]; then
        echo "Installation successful" >> "$LOG_FILE"
    else
        echo "Installation failed with exit code $exit_code" >> "$LOG_FILE"
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"