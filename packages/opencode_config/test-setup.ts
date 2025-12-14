#!/usr/bin/env bun

import { setupOpenCodeConfig } from './src/scripts/setup.js';

// Test the setup in current directory
await setupOpenCodeConfig({
  projectPath: process.cwd() + '/test-opencode',
  agents: ['library-researcher', 'code-reviewer'],
  model: 'big-pickle',
  overwrite: true
});

console.log('Setup test completed!');