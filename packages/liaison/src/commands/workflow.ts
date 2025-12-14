/**
 * Workflow Command
 * CLI command: liaison workflow
 * Manage agentic workflows and automation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { agenticWorkflowManager } from '../agentic-workflow-manager';

/**
 * Get subtask definitions based on workflow type
 */
function getSubtaskDefinitions(workflowId: string): Array<{
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  workflowTrigger?: string;
}> {
  const definitions: Record<string, Array<{
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    workflowTrigger?: string;
  }>> = {
    'security-response': [
      {
        title: 'Investigate security vulnerability',
        description: 'Analyze the security issue and determine impact',
        priority: 'critical',
        workflowTrigger: 'investigation'
      },
      {
        title: 'Isolate affected systems',
        description: 'Contain the vulnerability to prevent further damage',
        priority: 'high',
        workflowTrigger: 'containment'
      },
      {
        title: 'Develop security patch',
        description: 'Create and test patch for the vulnerability',
        priority: 'high',
        workflowTrigger: 'development'
      },
      {
        title: 'Verify fix effectiveness',
        description: 'Test that the patch resolves the security issue',
        priority: 'medium',
        workflowTrigger: 'verification'
      }
    ],
    'bug-fix': [
      {
        title: 'Reproduce the bug',
        description: 'Create reliable reproduction steps',
        priority: 'high',
        workflowTrigger: 'investigation'
      },
      {
        title: 'Debug root cause',
        description: 'Identify the underlying cause of the bug',
        priority: 'high',
        workflowTrigger: 'debugging'
      },
      {
        title: 'Implement fix',
        description: 'Code the solution for the bug',
        priority: 'medium',
        workflowTrigger: 'development'
      },
      {
        title: 'Test fix thoroughly',
        description: 'Ensure the fix works and doesn\'t break other functionality',
        priority: 'medium',
        workflowTrigger: 'testing'
      },
      {
        title: 'Deploy fix to production',
        description: 'Release the fix to the production environment',
        priority: 'low',
        workflowTrigger: 'deployment'
      }
    ],
    'high-priority-response': [
      {
        title: 'Assign appropriate team members',
        description: 'Ensure the right people are working on this priority issue',
        priority: 'high',
        workflowTrigger: 'assignment'
      },
      {
        title: 'Escalate if needed',
        description: 'Bring in additional resources if required',
        priority: 'medium',
        workflowTrigger: 'escalation'
      },
      {
        title: 'Notify stakeholders',
        description: 'Keep relevant parties informed of progress',
        priority: 'medium',
        workflowTrigger: 'notification'
      },
      {
        title: 'Track progress closely',
        description: 'Monitor resolution progress and timeline',
        priority: 'low',
        workflowTrigger: 'monitoring'
      }
    ],
    'documentation-update': [
      {
        title: 'Update documentation content',
        description: 'Revise the relevant documentation sections',
        priority: 'medium',
        workflowTrigger: 'content-update'
      },
      {
        title: 'Review documentation changes',
        description: 'Ensure accuracy and completeness of updates',
        priority: 'medium',
        workflowTrigger: 'review'
      },
      {
        title: 'Publish updated documentation',
        description: 'Release the updated documentation to users',
        priority: 'low',
        workflowTrigger: 'publication'
      }
    ]
  };

  return definitions[workflowId] || [];
}

/**
 * Execute Python workflow script with proper error handling
 */
function executeWorkflowScript(scriptName: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = `scripts/${scriptName}`;
    const childProcess = spawn('python3', [scriptPath, ...args], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    childProcess.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    childProcess.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Script failed with code ${code}: ${errorOutput}`));
      }
    });

    childProcess.on('error', (error: Error) => {
      reject(new Error(`Failed to execute script: ${error.message}`));
    });
  });
}

export function createWorkflowCommand(): Command {
  const command = new Command('workflow');

  command.description('Manage agentic workflows and automation');

  // liaison workflow list
  command
    .command('list')
    .description('List all available workflows')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching workflows...').start();

      try {
        // Get workflows from Python script
        const output = await executeWorkflowScript('list-workflows.py', options.json ? ['--json'] : []);
        
        spinner.stop();
        
        if (options.json) {
          console.log(output);
        } else {
          // Show agentic workflow manager stats
          const stats = agenticWorkflowManager.getTriggerStats();
          console.log(chalk.blue('\n🤖 Agentic Workflow Manager Status:'));
          console.log(`  Total Triggers: ${stats.totalTriggers}`);
          console.log(`  Recent Events: ${stats.recentEvents.length}`);
          console.log();
          
          console.log(output);
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list workflows: ${error}`));
        process.exit(1);
      }
    });

  // liaison workflow create
  command
    .command('create <name>')
    .description('Create a new workflow')
    .option('--trigger <condition>', 'Trigger condition for the workflow')
    .option('--actions <actions>', 'Comma-separated list of actions')
    .option('--description <text>', 'Workflow description')
    .action(async (name: string, options) => {
      const spinner = ora(`Creating workflow ${name}...`).start();

      try {
        const args = [name];
        if (options.trigger) args.push('--trigger', options.trigger);
        if (options.actions) args.push('--actions', options.actions);
        if (options.description) args.push('--description', options.description);

        const output = await executeWorkflowScript('create-workflow.py', args);
        
        spinner.succeed(chalk.green('Workflow created'));
        console.log(output);
      } catch (error) {
        spinner.fail(chalk.red(`Failed to create workflow: ${error}`));
        process.exit(1);
      }
    });

  // liaison workflow run
  command
    .command('run <name>')
    .description('Execute a workflow')
    .option('--dry-run', 'Show what would be executed without running')
    .option('--task-id <id>', 'Associate with specific task')
    .action(async (name: string, options) => {
      const spinner = ora(`Running workflow ${name}...`).start();

      try {
        const args = [name];
        if (options.dryRun) args.push('--dry-run');
        if (options.taskId) args.push('--task-id', options.taskId);

        const output = await executeWorkflowScript('run-workflow.py', args);
        
        spinner.succeed(chalk.green('Workflow executed'));
        console.log(output);
        
        // Emit workflow execution event for agentic manager
        agenticWorkflowManager.emit('workflow.executed', {
          workflowId: name,
          taskId: options.taskId,
          timestamp: new Date(),
          dryRun: options.dryRun || false
        });

        // If workflow completed successfully and has associated task, create subtasks
        if (options.taskId && !options.dryRun) {
          console.log(chalk.blue(`🔄 Creating subtasks for task ${options.taskId} from workflow ${name}`));
          
          // Define subtasks based on workflow type
          const subtaskDefinitions = getSubtaskDefinitions(name);
          
          if (subtaskDefinitions.length > 0) {
            try {
              await agenticWorkflowManager.createSubtasks(options.taskId, subtaskDefinitions);
            } catch (error) {
              console.warn(chalk.yellow(`⚠️  Failed to create subtasks: ${error}`));
            }
          }
        }
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to run workflow: ${error}`));
        process.exit(1);
      }
    });

  // liaison workflow schedule
  command
    .command('schedule <name> <time>')
    .description('Schedule workflow execution')
    .option('--recurring', 'Make this a recurring schedule')
    .action(async (name: string, time: string, options) => {
      const spinner = ora(`Scheduling workflow ${name}...`).start();

      try {
        const args = [name, time];
        if (options.recurring) args.push('--recurring');

        const output = await executeWorkflowScript('schedule-workflow.py', args);
        
        spinner.succeed(chalk.green('Workflow scheduled'));
        console.log(output);
      } catch (error) {
        spinner.fail(chalk.red(`Failed to schedule workflow: ${error}`));
        process.exit(1);
      }
    });

  // liaison workflow logs
  command
    .command('logs <name>')
    .description('Show workflow execution logs')
    .option('--limit <number>', 'Number of log entries to show', '10')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      const spinner = ora(`Fetching logs for ${name}...`).start();

      try {
        const args = [name, '--limit', options.limit];
        if (options.json) args.push('--json');

        const output = await executeWorkflowScript('show-workflow-logs.py', args);
        
        spinner.stop();
        console.log(output);
      } catch (error) {
        spinner.fail(chalk.red(`Failed to fetch logs: ${error}`));
        process.exit(1);
      }
    });

  // liaison workflow triggers
  command
    .command('triggers')
    .description('Show workflow trigger configuration')
    .action(async () => {
      console.log(chalk.blue('🎯 Workflow Trigger Configuration:\n'));
      
      const stats = agenticWorkflowManager.getTriggerStats();
      
      console.log(chalk.bold('Trigger Statistics:'));
      console.log(`  Total Triggers: ${stats.totalTriggers}`);
      console.log(`  Triggers by Type:`);
      
      Object.entries(stats.triggersByType).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
      
      console.log(chalk.bold('\nRecent Events:'));
      stats.recentEvents.forEach((event: any, index: number) => {
        console.log(`  ${index + 1}. ${event.type.toUpperCase()} - ${event.taskId} (${event.timestamp.toISOString()})`);
      });
      
      console.log(chalk.green('\n✅ Agentic workflow triggers are active and monitoring task events'));
    });

  return command;
}

export const workflowCommand = createWorkflowCommand();