#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

// Simple CLI for testing
program
  .name('liaison-test')
  .description('Simple test CLI')
  .version('1.0.0');

program
  .command('test')
  .description('Simple test command')
  .action(() => {
    console.log(chalk.green('✅ Test command works'));
  });

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log(chalk.blue('Hello from liaison-test!'));
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command'));
  process.exit(1);
});

// Start CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('❌ CLI failed:'), error);
    process.exit(1);
  }
}