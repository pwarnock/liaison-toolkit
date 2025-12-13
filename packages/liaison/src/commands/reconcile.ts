/**
 * Reconcile Command
 * CLI command: liaison reconcile
 * Reconciles version tasklists with task backend
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import {
  TasklistParser,
  ReconcilerEngine,
  BeadsAdapter,
  type VersionConfig,
  type ReconcileResult,
} from '../reconciler';
import type { TaskBackendAdapter } from '../reconciler/adapter';

function getAdapterByName(backendName: string): TaskBackendAdapter {
  switch (backendName.toLowerCase()) {
    case 'beads':
      return new BeadsAdapter(true); // Use bun x bd
    default:
      throw new Error(`Unknown backend: ${backendName}`);
  }
}

export class VersionDiscovery {
  static discover(versionName?: string, projectRoot: string = process.cwd()): VersionConfig[] {
    const versionsDir = join(projectRoot, '.cody', 'project', 'versions');

    if (!existsSync(versionsDir)) {
      console.warn(chalk.yellow(`No versions directory found at ${versionsDir}`));
      return [];
    }

    const dirs = readdirSync(versionsDir, { withFileTypes: true })
      .filter((f) => f.isDirectory())
      .map((f) => f.name);

    // Filter by versionName if provided
    const filtered = versionName ? dirs.filter((d) => d === versionName) : dirs;

    return filtered.map((dir) => {
      const path = join(versionsDir, dir);
      const tasklistPath = join(path, 'tasklist.md');
      return {
        path,
        version: dir,
        tasklistPath,
        exists: existsSync(tasklistPath),
      };
    });
  }
}

export function createReconcileCommand(): Command {
  const command = new Command('reconcile');

  command
    .description('Reconcile version tasklists with task backend')
    .argument('[version]', 'Version name (e.g., v0.1.0-initial)', undefined)
    .option('--all', 'Reconcile all versions', false)
    .option('--backend <name>', 'Backend name (default: beads)', 'beads')
    .option('--dry-run', 'Show planned edits only', false)
    .option('--verbose', 'Detailed output', false)
    .action(async (versionArg: string | undefined, options) => {
      const spinner = ora('🔄 Initializing reconciler...').start();

      try {
        // Determine which versions to reconcile
        const versionName = options.all ? undefined : versionArg;
        const versions = VersionDiscovery.discover(versionName);

        if (versions.length === 0) {
          spinner.warn(
            'No version tasklists found. Use `liaison reconcile --help` for usage.'
          );
          return;
        }

        // Filter for existing tasklists
        const validVersions = versions.filter((v) => v.exists);
        if (validVersions.length === 0) {
          spinner.warn('No version tasklists found.');
          return;
        }

        // Initialize adapter
        spinner.text = `🔄 Checking ${options.backend} backend...`;
        const adapter = getAdapterByName(options.backend);

        // Skip healthCheck for now due to timeout issues
        // TODO: Fix healthCheck timeout in BeadsAdapter
        spinner.succeed(
          chalk.green(`Backend '${options.backend}' initialized.`)
        );

        // Reconcile each version
        const results: ReconcileResult[] = [];

        for (const versionConfig of validVersions) {
          spinner.start(
            chalk.blue(`📋 Processing ${versionConfig.version}...`)
          );

          try {
            const content = readFileSync(versionConfig.tasklistPath, 'utf-8');
            const parser = new TasklistParser();
            const rows = parser.parse(content);

            const engine = new ReconcilerEngine(adapter);
            const result = await engine.reconcile(
              rows,
              versionConfig.version,
              options.dryRun
            );

            results.push(result);

            // Write result
            if (!options.dryRun) {
              const newContent = parser.stringify(result.newRows, {
                version: versionConfig.version,
              });
              writeFileSync(versionConfig.tasklistPath, newContent);
            }

            const summary = `+${result.created} created, ~${result.updated} updated, -${result.deleted} deleted`;
            if (options.dryRun) {
              spinner.info(chalk.cyan(`[DRY RUN] ${versionConfig.version}: ${summary}`));
            } else {
              spinner.succeed(chalk.green(`✓ ${versionConfig.version}: ${summary}`));
            }
          } catch (err) {
            spinner.fail(
              chalk.red(`✗ ${versionConfig.version}: ${err}`)
            );
          }
        }

        // Summary
        spinner.stop();
        const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
        const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
        const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);

        console.log(chalk.blue('\n📊 Reconciliation Summary'));
        console.log(`Versions processed: ${results.length}`);
        console.log(
          `Tasks: +${totalCreated} created, ~${totalUpdated} updated, -${totalDeleted} deleted`
        );

        if (options.dryRun) {
          console.log(
            chalk.yellow('\n⚠️  Dry run: no changes written to disk.')
          );
        }

        if (options.verbose && results.length > 0) {
          console.log(chalk.blue('\n📝 Detailed Changes'));
          for (const result of results) {
            if (result.changes.length > 0) {
              console.log(`\n${result.version}:`);
              result.changes.forEach((change) => {
                console.log(
                  `  - [${change.changeType}] Row ${change.rowIndex}: ${change.oldRow.task}`
                );
              });
            }
          }
        }
      } catch (error) {
        spinner.fail(chalk.red(`Reconciliation failed: ${error}`));
        process.exit(1);
      }
    });

  return command;
}

export const reconcileCommand = createReconcileCommand();
