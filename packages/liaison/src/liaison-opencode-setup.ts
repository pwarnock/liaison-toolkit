#!/usr/bin/env node

import { setupOpenCodeConfig } from '@pwarnock/opencode_config';
import { parseArgs } from 'util';

const options = parseArgs({
  args: process.argv.slice(2),
  options: {
    directory: { type: 'string', short: 'd' },
    agents: { type: 'string', short: 'a' },
    model: { type: 'string', short: 'm' },
    help: { type: 'boolean', short: 'h' }
  }
});

if (options.values.help) {
  console.log(`
OpenCode Configuration Setup

Usage: liaison-opencode-setup [options]

Options:
  -d, --directory <path>  Target directory for configuration (default: current directory)
  -a, --agents <agents>   Comma-separated list of agents (default: library-researcher,code-reviewer)
  -m, --model <model>     Default model to use (default: big-pickle)
  -h, --help              Show this help

Available Models:
  - big-pickle: Big Pickle (GLM 4.6) - General purpose
  - grok-fast: Grok Fast - Code review and quick tasks
  - kat-coder: KAT-Coder - Documentation and technical writing

Available Agents:
  - library-researcher: Researches libraries and APIs
  - code-reviewer: Code review and quality assurance
  - docs-writer: Technical writing specialist
  - custom-agent: Generic agent template

Examples:
  liaison-opencode-setup
  liaison-opencode-setup --agents "docs-writer,library-researcher" --model kat-coder
  liaison-opencode-setup --directory ~/my-project --agents "code-reviewer"
`);
  process.exit(0);
}

async function main() {
  try {
    const config = {
      directory: options.values.directory || process.cwd(),
      agents: options.values.agents?.split(',').map(a => a.trim()) || ['library-researcher', 'code-reviewer'],
      model: options.values.model || 'big-pickle'
    };

    console.log('🤖 Setting up OpenCode configuration...');
    await setupOpenCodeConfig(config);
    console.log('✅ Setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();