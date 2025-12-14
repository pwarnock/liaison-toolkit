/**
 * Task Command
 * CLI command: liaison task
 * Manage tasks in the backend (create, list, get, update status)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { BeadsAdapter } from '../reconciler/adapters/beads-adapter';
import type { Task, TaskFilter } from '../reconciler/types';
import { agenticWorkflowManager } from '../agentic-workflow-manager';
import { checkForDuplicates, formatDuplicateMatches } from '../utils/duplicate-checker';

/**
 * Format task for human-readable output
 */
function formatTask(task: Task): string {
  const status = task.status;
  const closed = task.closedAt ? ` [closed ${task.closedAt.toISOString().split('T')[0]}]` : '';
  return `${chalk.cyan(task.id)} | ${task.title}${closed}`;
}

/**
 * Format table header
 */
function printTableHeader(): void {
  console.log(
    chalk.bold(
      'ID'.padEnd(12) + ' | Task'.padEnd(40) + ' | Status'.padEnd(10) + ' | Description'
    )
  );
  console.log(chalk.gray('-'.repeat(100)));
}

/**
 * Format task as table row
 */
function formatTaskRow(task: Task): string {
  const statusEmoji = task.status === 'closed' ? '🟢' : task.status === 'deleted' ? '❌' : '🔴';
  return (
    task.id.padEnd(12) +
    ' | ' +
    (task.title.substring(0, 38) + '...').padEnd(40) +
    ' | ' +
    statusEmoji.padEnd(10) +
    ' | ' +
    (task.description || '').substring(0, 40)
  );
}

export function createTaskCommand(): Command {
  const command = new Command('task');

  command.description('Manage tasks in the backend');

  // liaison task create
  command
    .command('create <title>')
    .description('Create a new task')
    .option('--description <text>', 'Task description')
    .option('--assigned-to <user>', 'Assign task to user')
    .option('--auto-trigger <workflow>', 'Automatically trigger workflow when task is created')
    .option('--priority <level>', 'Task priority (low, medium, high, critical)')
    .option('--check-duplicates', 'Check for duplicate issues before creating (default: true)', true)
    .option('--no-check-duplicates', 'Skip duplicate check')
    .option('--force-create', 'Create task even if duplicates found')
    .option('--json', 'Output as JSON')
    .action(async (title: string, options) => {
      let spinner = ora('Creating task...').start();

      try {
        const adapter = new BeadsAdapter(true);

        // Health check first
        const healthy = await adapter.healthCheck();
        if (!healthy) {
          spinner.fail(chalk.red('Backend is not available. Check your setup.'));
          process.exit(1);
        }

        // Check for duplicates unless explicitly bypassed
        if (options.checkDuplicates && !options.forceCreate) {
          spinner.text = 'Checking for duplicate issues...';
          const dupCheck = await checkForDuplicates(title, false);

          if (dupCheck.error) {
            spinner.warn(chalk.yellow(`Duplicate check failed: ${dupCheck.error}`));
            // Continue anyway, don't block task creation
          } else if (dupCheck.hasDuplicates && dupCheck.matches.length > 0) {
            spinner.stop();
            console.log(formatDuplicateMatches(dupCheck.matches));
            console.log(chalk.yellow('\nUse --force-create to create this task anyway\n'));
            process.exit(0);
          }
        }

        spinner.start();
        const task = await adapter.createTask({
          title,
          description: options.description,
          assignedTo: options.assignedTo,
          priority: options.priority || 'medium',
        });

        // Emit task creation event for agentic workflow triggers
        console.log(`🔄 Task created: ${task.id} - checking for auto-triggers...`);
        
        // Auto-trigger workflows if requested
        if (options.autoTrigger) {
          console.log(`🚀 Auto-triggering workflow: ${options.autoTrigger}`);
          // This would integrate with workflow engine
          console.log(`📋 Task priority: ${task.priority || 'medium'}`);
          console.log(`🎯 Ready for agentic workflow integration`);
          
          // Process task event through agentic workflow manager
          const triggeredWorkflows = await agenticWorkflowManager.processTaskEvent({
            type: 'created',
            taskId: task.id,
            task,
            timestamp: new Date()
          });
          
          if (triggeredWorkflows.length > 0) {
            console.log(chalk.green(`✨ Agentic workflows triggered: ${triggeredWorkflows.join(', ')}`));
          }
        }
        
        // Check if this task should trigger any workflows (handled by agentic workflow manager)
        // This is now handled by the agentic workflow manager above

        if (options.json) {
          spinner.stop();
          console.log(JSON.stringify(task, null, 2));
        } else {
          spinner.succeed(chalk.green('Task created'));
          console.log(`ID: ${chalk.cyan(task.id)}`);
          console.log(`Title: ${task.title}`);
          if (task.description) {
            console.log(`Description: ${task.description}`);
          }
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to create task: ${error}`));
        process.exit(1);
      }
    });

  // liaison task list
  command
    .command('list')
    .description('List all tasks')
    .option('--status <status>', 'Filter by status (open, closed, deleted)')
    .option('--assigned-to <user>', 'Filter by assignee')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching tasks...').start();

      try {
        const adapter = new BeadsAdapter(true);

        // Health check first
        const healthy = await adapter.healthCheck();
        if (!healthy) {
          spinner.fail(chalk.red('Backend is not available. Check your setup.'));
          process.exit(1);
        }

        const filters: TaskFilter = {};
        if (options.status) {
          filters.status = options.status;
        }
        if (options.assignedTo) {
          filters.assignedTo = options.assignedTo;
        }

        const tasks = await adapter.listTasks(filters);

        if (options.json) {
          spinner.stop();
          console.log(JSON.stringify(tasks, null, 2));
        } else {
          spinner.stop();
          if (tasks.length === 0) {
            console.log(chalk.yellow('No tasks found'));
            return;
          }

          console.log(chalk.blue(`\n📋 Tasks (${tasks.length})\n`));
          printTableHeader();
          tasks.forEach((task) => console.log(formatTaskRow(task)));
          console.log();
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list tasks: ${error}`));
        process.exit(1);
      }
    });

  // liaison task get
  command
    .command('get <id>')
    .description('Get task details')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora(`Fetching task ${id}...`).start();

      try {
        const adapter = new BeadsAdapter(true);

        // Health check first
        const healthy = await adapter.healthCheck();
        if (!healthy) {
          spinner.fail(chalk.red('Backend is not available. Check your setup.'));
          process.exit(1);
        }

        const task = await adapter.getTask(id);

        if (!task) {
          spinner.fail(chalk.red(`Task not found: ${id}`));
          process.exit(1);
        }

        if (options.json) {
          spinner.stop();
          console.log(JSON.stringify(task, null, 2));
        } else {
          spinner.succeed(chalk.green('Task found'));
          console.log(`\nID: ${chalk.cyan(task.id)}`);
          console.log(`Title: ${task.title}`);
          console.log(`Status: ${task.status}`);
          if (task.description) {
            console.log(`Description: ${task.description}`);
          }
          if (task.createdAt) {
            console.log(`Created: ${task.createdAt.toISOString().split('T')[0]}`);
          }
          if (task.closedAt) {
            console.log(`Closed: ${task.closedAt.toISOString().split('T')[0]}`);
          }
          console.log();
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to get task: ${error}`));
        process.exit(1);
      }
    });

  // liaison task update
  command
    .command('update <id>')
    .description('Update task status')
    .option('--status <status>', 'New status (open, closed, deleted)', 'closed')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora(`Updating task ${id}...`).start();

      try {
        const adapter = new BeadsAdapter(true);

        // Health check first
        const healthy = await adapter.healthCheck();
        if (!healthy) {
          spinner.fail(chalk.red('Backend is not available. Check your setup.'));
          process.exit(1);
        }

        const task = await adapter.updateTaskStatus(id, options.status);

        if (options.json) {
          spinner.stop();
          console.log(JSON.stringify(task, null, 2));
        } else {
          spinner.succeed(chalk.green('Task updated'));
          console.log(`ID: ${chalk.cyan(task.id)}`);
          console.log(`Status: ${task.status}`);
          console.log();
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to update task: ${error}`));
        process.exit(1);
      }
    });

  return command;
}

export const taskCommand = createTaskCommand();
