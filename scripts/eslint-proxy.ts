#!/usr/bin/env bun

/**
 * ESLint Proxy - Transitional compatibility layer
 * 
 * This proxy provides backward compatibility while we migrate from ESLint to oxlint.
 * It intercepts ESLint calls and routes them appropriately:
 * - For linting: Delegates to oxlint
 * - For configuration: Provides compatibility responses
 * - For other commands: Graceful fallback with helpful messages
 */

import { spawn } from 'child_process';

const command = process.argv[2];
const args = process.argv.slice(3);

// Map ESLint commands to oxlint equivalents
const commandMap: Record<string, string> = {
  'lint': 'oxlint',
  '.': 'oxlint',
};

function main(): void {
  // Check if this is a linting command
  if (commandMap[command] || !command || command.startsWith('.')) {
    console.log('🔄 ESLint proxy: Redirecting to oxlint...');
    
    const oxlintArgs: string[] = [];
    if (command && command !== '.') {
      oxlintArgs.push(command);
    }
    oxlintArgs.push(...args.filter(arg => !arg.startsWith('--format') && arg !== '--fix'));
    
    // Handle --fix flag
    if (args.includes('--fix')) {
      console.log('⚠️  oxlint does not support --fix yet. Please run manually if needed.');
    }
    
    const oxlint = spawn('bunx', ['oxlint', ...oxlintArgs], {
      stdio: 'inherit',
      shell: true
    });
    
    oxlint.on('exit', (code: number | null) => {
      process.exit(code || 0);
    });
    
  } else if (command === '--version' || command === '-v') {
    console.log('ESLint Proxy v1.0.0 (migrating to oxlint)');
    console.log('Underlying linter: oxlint');
    
  } else if (command === '--help' || command === '-h') {
    console.log(`
ESLint Proxy - Transitional Compatibility Layer

This proxy helps migrate from ESLint to oxlint.

Current status:
✅ Basic linting commands work with oxlint
⚠️  Advanced features may have limited support
📝 Use 'bunx oxlint --help' for full oxlint documentation

Migration progress:
🔄 ESLint dependencies removed from packages
🔄 ESLint configs preserved for reference
🔄 oxlint adopted as primary linter

Examples:
  eslint src/          → bunx oxlint src/
  eslint --fix         → Manual fix required
  eslint --version     → Shows proxy info
    `);
    
  } else {
    console.log(`❌ ESLint proxy: Command '${command}' not yet supported in migration`);
    console.log('💡 Try using oxlint directly: bunx oxlint [options]');
    console.log('📖 For help: eslint --help');
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { main };